"""
同步脚本：读本地 SQLite → 刷写文章 frontmatter 的 review 快照 → 生成 public/review.json。

工作流：
  1. 遍历 src/posts 下所有 .md（含子目录），解析现有 frontmatter。
  2. 对每篇参与复习且在 SQLite 有记录的文章，把当前 SM-2 状态写回 frontmatter 的 review 字段。
  3. 聚合 SQLite 全量数据（含历史日志、热力图、统计）生成 public/review.json。

用法：
  python scripts/sync-reviews.py
"""
from __future__ import annotations

import json
import math
import re
import sqlite3
from datetime import date, datetime, timedelta
from pathlib import Path

import db

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "src" / "posts"
PUBLIC_JSON = ROOT / "public" / "review.json"

MS_PER_DAY = 24 * 60 * 60 * 1000


# ---------- frontmatter 解析/序列化（与 encrypt.mjs 一致的字符串处理） ----------

FM_RE = re.compile(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$", re.MULTILINE)


def parse_md(raw: str) -> tuple[str, str, bool]:
    """返回 (fm_text, body, has_fm)"""
    m = FM_RE.match(raw)
    if not m:
        return "", raw, False
    return m.group(1), m.group(2), True


def parse_frontmatter_value(fm_text: str, key: str) -> str | None:
    """从 frontmatter 文本里取某个顶层标量字段"""
    m = re.search(rf"^{re.escape(key)}:\s*(.+)$", fm_text, re.MULTILINE)
    if not m:
        return None
    return m.group(1).strip().strip("'\"")


def parse_frontmatter_obj(fm_text: str, key: str) -> dict | None:
    """解析 frontmatter 里一个对象块（key:\n  sub: val 形式）"""
    lines = fm_text.split("\n")
    start = None
    for i, line in enumerate(lines):
        if re.match(rf"^{re.escape(key)}:\s*$", line):
            start = i + 1
            break
    if start is None:
        return None
    result = {}
    for line in lines[start:]:
        if not line.startswith("  "):
            break
        m = re.match(r"^\s+(\w+):\s*(.+)$", line)
        if m:
            val = m.group(2).strip().strip("'\"")
            try:
                result[m.group(1)] = int(val)
            except ValueError:
                try:
                    result[m.group(1)] = float(val)
                except ValueError:
                    result[m.group(1)] = val
    return result or None


def has_field(fm_text: str, key: str) -> bool:
    return bool(re.search(rf"^{re.escape(key)}:", fm_text, re.MULTILINE))


def detect_newline(raw: str) -> str:
    """检测文本的主要换行符（默认 \\n）"""
    if "\r\n" in raw:
        return "\r\n"
    return "\n"


def format_review_block(review: dict, nl: str = "\n") -> str:
    """把 review 字典序列化成 YAML 对象块，使用指定换行符"""
    lines = ["review:"]
    for k in ("created", "lastReview", "reps", "interval", "ease"):
        if k in review:
            lines.append(f"  {k}: {review[k]}")
    return nl.join(lines)


def replace_or_insert_review(fm_text: str, review: dict, nl: str = "\n") -> str:
    """
    替换已有 review: 块，或在末尾追加。保留原始换行符。
    review 块可能是：
      review: {}          （单行，空）
      review:
        created: ...
        ...
    """
    # 匹配 review: 开头到下一个顶层字段之前（兼容 CRLF/LF）
    pattern = re.compile(
        r"^review:[ \t]*(?:\{\}|\r?\n(?:[ \t]+[^\r\n]+\r?\n+)*)",
        re.MULTILINE,
    )
    new_block = format_review_block(review, nl) + nl

    if pattern.search(fm_text):
        return pattern.sub(lambda m: new_block, fm_text, count=1)
    # 没有 review 字段，追加到末尾
    return fm_text.rstrip() + nl + new_block


# ---------- 扫描文章 ----------

def slug_from_path(path: Path) -> str:
    rel = path.relative_to(POSTS_DIR).as_posix()
    return rel[:-3]  # 去 .md


def scan_posts() -> list[dict]:
    """扫描所有 .md，返回 [{path, slug, fm_text, body, has_fm, title, date, no_review, nl}]"""
    posts = []
    for md_file in POSTS_DIR.rglob("*.md"):
        # 以字节读取再解码，保留原始换行符（CRLF/LF）不丢失
        raw = md_file.read_bytes().decode("utf-8")
        nl = detect_newline(raw)
        fm_text, body, has_fm = parse_md(raw)
        title = parse_frontmatter_value(fm_text, "title") or slug_from_path(md_file)
        post_date = parse_frontmatter_value(fm_text, "date")
        no_review = parse_frontmatter_value(fm_text, "noReview")
        is_encrypted = parse_frontmatter_value(fm_text, "encrypted")
        is_draft = parse_frontmatter_value(fm_text, "draft")
        # 路径推导分类
        rel = md_file.relative_to(POSTS_DIR).as_posix()
        path_parts = rel.split("/")
        category = "/".join(path_parts[:-1]) if len(path_parts) > 1 else parse_frontmatter_value(fm_text, "category")
        posts.append({
            "path": md_file,
            "slug": slug_from_path(md_file),
            "fm_text": fm_text,
            "body": body,
            "has_fm": has_fm,
            "nl": nl,
            "title": title.strip("'\""),
            "date": post_date.strip("'\"") if post_date else None,
            "no_review": no_review == "true" if no_review else False,
            "encrypted": is_encrypted == "true" if is_encrypted else False,
            "draft": is_draft == "true" if is_draft else False,
            "category": category,
        })
    return posts


# ---------- 刷写 frontmatter ----------

def sync_frontmatter(conn: sqlite3.Connection, posts: list[dict]) -> int:
    """把 SQLite 里每张卡片的状态刷回对应文章的 frontmatter。返回更新文件数。"""
    updated = 0
    for post in posts:
        if post["encrypted"] or post["draft"] or post["no_review"]:
            continue
        slug = post["slug"]
        card = db.get_card(conn, slug)
        if card is None:
            continue

        created = post["date"] or date.today().isoformat()
        review = {
            "created": card["created"] or created,
            "lastReview": card["last_review"] or created,
            "reps": card["reps"],
            "interval": card["interval"],
            "ease": round(card["ease"], 2),
        }
        nl = post["nl"]
        if not post["has_fm"]:
            # 没有 frontmatter，整个包一个出来
            new_fm = format_review_block(review, nl) + nl
            new_raw = f"---{nl}{new_fm}---{nl}{nl}{post['body']}"
        else:
            new_fm = replace_or_insert_review(post["fm_text"], review, nl)
            new_raw = f"---{nl}{new_fm}---{nl}{post['body']}"

        # 以 newline='' 写回，禁止 Python 再次转换换行符，保留原始行尾
        if new_raw != post["path"].read_bytes().decode("utf-8"):
            with open(post["path"], "w", encoding="utf-8", newline="") as f:
                f.write(new_raw)
            updated += 1
    return updated


# ---------- 生成 review.json ----------

def build_review_json(conn: sqlite3.Connection, posts: list[dict]) -> dict:
    """聚合全量数据生成 review.json 结构"""
    today = date.today()
    cards_data = []
    history_by_slug = {}

    # 预加载所有复习历史
    for post in posts:
        if post["encrypted"] or post["draft"] or post["no_review"]:
            continue
        hist = db.get_card_history(conn, post["slug"])
        history_by_slug[post["slug"]] = [
            {
                "date": row["review_date"],
                "grade": row["grade"],
                "ease": round(row["ease"], 2),
                "interval": row["interval"],
            }
            for row in hist
        ]

    for post in posts:
        if post["encrypted"] or post["draft"] or post["no_review"]:
            continue
        slug = post["slug"]
        card = db.get_card(conn, slug)
        if card is None:
            # 在 SQLite 中没有记录，但文章参与复习：用 created 初始化一个"未复习"卡片
            created = post["date"] or today.isoformat()
            last_review = None
            reps = 0
            interval = 0
            ease = 2.5
        else:
            created = card["created"] or post["date"] or today.isoformat()
            last_review = card["last_review"]
            reps = card["reps"]
            interval = card["interval"]
            ease = card["ease"]

        # 下次复习日
        if last_review and interval > 0:
            next_review = (date.fromisoformat(last_review[:10]) + timedelta(days=interval)).isoformat()
        else:
            next_review = created

        # 保留率
        if last_review and interval > 0:
            t = (today - date.fromisoformat(last_review[:10])).days
            retention = math.exp(-max(0, t) / interval)
        else:
            retention = 0.0

        # dueIn
        if last_review and interval > 0:
            due_in = (date.fromisoformat(next_review[:10]) - today).days
        else:
            due_in = (date.fromisoformat(created[:10]) - today).days

        cards_data.append({
            "slug": slug,
            "title": post["title"],
            "category": post["category"],
            "created": created,
            "lastReview": last_review or created,
            "reps": reps,
            "interval": interval,
            "ease": round(ease, 2),
            "nextReview": next_review,
            "retention": round(retention, 4),
            "dueIn": due_in,
            "history": history_by_slug.get(slug, []),
        })

    stats = db.get_stats(conn)
    heatmap = db.get_heatmap(conn)

    return {
        "stats": stats,
        "cards": cards_data,
        "heatmap": heatmap,
    }


# ---------- 主流程 ----------

def main():
    conn = db.get_db()
    posts = scan_posts()
    print(f"[sync] 扫描到 {len(posts)} 篇文章")

    # 确保所有参与复习的文章在 SQLite 中有卡片记录
    for post in posts:
        if post["encrypted"] or post["draft"] or post["no_review"]:
            continue
        created = post["date"] or date.today().isoformat()
        db.ensure_card(conn, post["slug"], post["title"], post["category"], created)

    updated = sync_frontmatter(conn, posts)
    print(f"[sync] 已更新 {updated} 篇文章的 frontmatter 快照")

    data = build_review_json(conn, posts)
    PUBLIC_JSON.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_JSON.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"[sync] 已生成 {PUBLIC_JSON}")
    print(f"[sync] 统计：{data['stats']}")
    conn.close()


if __name__ == "__main__":
    main()
