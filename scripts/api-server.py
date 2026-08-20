"""
本地 API server（FastAPI），只在本地 dev 时运行。

职责：
  - 复习系统：读写 SQLite，跑 SM-2 算法
  - 文章 CRUD：新增/编辑/删除 src/posts 下的 .md 文件

启动：
  python scripts/api-server.py
默认监听 http://localhost:3001

Vite dev server 通过 proxy 把 /api 转发到这里。
"""
from __future__ import annotations

import re
import shutil
from datetime import date
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import db

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "src" / "posts"

app = FastAPI(title="Blog Local API", version="0.1.0")

# 本地用，放开 CORS（Vite proxy 同源其实不需要，但保险）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- frontmatter 解析/序列化（与 sync-reviews.py 一致） ----------

FM_RE = re.compile(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$", re.MULTILINE)


def parse_md(raw: str) -> tuple[str, str, bool]:
    m = FM_RE.match(raw)
    if not m:
        return "", raw, False
    return m.group(1), m.group(2), True


def fm_value(fm_text: str, key: str) -> str | None:
    m = re.search(rf"^{re.escape(key)}:\s*(.+)$", fm_text, re.MULTILINE)
    if not m:
        return None
    return m.group(1).strip().strip("'\"")


def slug_from_path(path: Path) -> str:
    rel = path.relative_to(POSTS_DIR).as_posix()
    return rel[:-3]


def post_path_for_slug(slug: str) -> Path:
    """slug → 文件路径。slug 可含子目录前缀，如 'tech/hello'"""
    return POSTS_DIR / f"{slug}.md"


# ---------- Pydantic 请求模型 ----------

class ReviewRequest(BaseModel):
    grade: int  # 0=忘了 / 4=模糊 / 5=记得


class CreatePostRequest(BaseModel):
    title: str
    slug: str | None = None  # 可选，缺省由 title 推导
    category: str | None = None
    tags: list[str] | None = None
    description: str | None = None
    noReview: bool = False


class UpdateFrontmatterRequest(BaseModel):
    title: str | None = None
    category: str | None = None
    tags: list[str] | None = None
    description: str | None = None
    noReview: bool | None = None


class UpdateContentRequest(BaseModel):
    content: str


# ---------- 复习 API ----------

@app.get("/api/stats")
def api_stats() -> dict[str, Any]:
    conn = db.get_db()
    return db.get_stats(conn)


@app.get("/api/today")
def api_today() -> list[dict]:
    conn = db.get_db()
    due = db.get_due_today(conn)
    return [dict(c) for c in due]


@app.get("/api/cards")
def api_cards() -> list[dict]:
    conn = db.get_db()
    return [dict(c) for c in db.get_all_cards(conn)]


@app.get("/api/cards/{slug}")
def api_get_card(slug: str) -> dict:
    conn = db.get_db()
    card = db.get_card(conn, slug)
    if card is None:
        raise HTTPException(404, "卡片不存在")
    history = db.get_card_history(conn, slug)
    return {
        **dict(card),
        "history": [dict(h) for h in history],
    }


@app.post("/api/cards/{slug}/review")
def api_review_card(slug: str, req: ReviewRequest) -> dict:
    conn = db.get_db()
    # 如果卡片不存在，先按文件信息初始化
    if db.get_card(conn, slug) is None:
        path = post_path_for_slug(slug)
        if path.exists():
            raw = path.read_text(encoding="utf-8")
            fm_text, _, _ = parse_md(raw)
            title = fm_value(fm_text, "title") or slug
            created = fm_value(fm_text, "date") or db.today_iso()
            db.ensure_card(conn, slug, title, None, created)
        else:
            raise HTTPException(404, f"文章不存在: {slug}")
    try:
        return db.review_card(conn, slug, req.grade)
    except KeyError as e:
        raise HTTPException(404, str(e))


# ---------- 文章 CRUD API ----------

@app.get("/api/posts")
def api_list_posts() -> list[dict]:
    """列出所有文章（含子目录）"""
    posts = []
    for md_file in POSTS_DIR.rglob("*.md"):
        raw = md_file.read_text(encoding="utf-8")
        fm_text, _, has_fm = parse_md(raw)
        title = fm_value(fm_text, "title") or slug_from_path(md_file)
        post_date = fm_value(fm_text, "date")
        posts.append({
            "slug": slug_from_path(md_file),
            "title": title.strip("'\""),
            "date": post_date.strip("'\"") if post_date else None,
            "category": fm_value(fm_text, "category"),
            "path": str(md_file.relative_to(ROOT)),
        })
    return posts


@app.get("/api/posts/{slug}")
def api_get_post(slug: str) -> dict:
    """读取单篇文章（frontmatter + 正文）"""
    path = post_path_for_slug(slug)
    if not path.exists():
        raise HTTPException(404, f"文章不存在: {slug}")
    raw = path.read_text(encoding="utf-8")
    fm_text, body, has_fm = parse_md(raw)
    return {
        "slug": slug,
        "raw": raw,
        "content": body,
        "frontmatter": fm_text,
        "title": fm_value(fm_text, "title"),
    }


@app.post("/api/posts")
def api_create_post(req: CreatePostRequest) -> dict:
    """新增文章：生成带模板的 .md 文件"""
    slug = req.slug or req.title.strip().lower().replace(" ", "-")
    path = post_path_for_slug(slug)
    if path.exists():
        raise HTTPException(409, f"文章已存在: {slug}")

    # 子目录自动创建
    path.parent.mkdir(parents=True, exist_ok=True)

    fm_lines = [
        "---",
        f"title: {req.title}",
        f"date: {date.today().isoformat()}",
    ]
    if req.description:
        fm_lines.append(f"description: {req.description}")
    if req.category:
        fm_lines.append(f"category: {req.category}")
    if req.tags:
        fm_lines.append("tags:")
        for t in req.tags:
            fm_lines.append(f"  - {t}")
    if req.noReview:
        fm_lines.append("noReview: true")
    fm_lines.append("---")
    fm_lines.append("")
    fm_lines.append(f"# {req.title}")
    fm_lines.append("")
    fm_lines.append("开始写点什么吧…")

    path.write_text("\n".join(fm_lines) + "\n", encoding="utf-8")
    return {"slug": slug, "path": str(path.relative_to(ROOT))}


@app.put("/api/posts/{slug}/content")
def api_update_content(slug: str, req: UpdateContentRequest) -> dict:
    """更新文章正文（保留 frontmatter）"""
    path = post_path_for_slug(slug)
    if not path.exists():
        raise HTTPException(404, f"文章不存在: {slug}")
    raw = path.read_text(encoding="utf-8")
    fm_text, _, has_fm = parse_md(raw)
    if not has_fm:
        new_raw = f"---\n---\n\n{req.content}"
    else:
        new_raw = f"---\n{fm_text}---\n{req.content}"
    path.write_text(new_raw, encoding="utf-8")
    return {"ok": True}


@app.put("/api/posts/{slug}/frontmatter")
def api_update_frontmatter(slug: str, req: UpdateFrontmatterRequest) -> dict:
    """更新文章的 frontmatter 字段（不碰正文）"""
    path = post_path_for_slug(slug)
    if not path.exists():
        raise HTTPException(404, f"文章不存在: {slug}")
    raw = path.read_text(encoding="utf-8")
    fm_text, body, has_fm = parse_md(raw)
    if not has_fm:
        fm_text = ""

    # 简单的字段替换/插入
    def set_field(key: str, value: str | None):
        nonlocal fm_text
        pattern = re.compile(rf"^{re.escape(key)}:.*$", re.MULTILINE)
        if value is None:
            fm_text = pattern.sub("", fm_text).rstrip() + "\n"
        elif pattern.search(fm_text):
            fm_text = pattern.sub(f"{key}: {value}", fm_text)
        else:
            fm_text = fm_text.rstrip() + f"\n{key}: {value}\n"

    if req.title is not None:
        set_field("title", req.title)
    if req.category is not None:
        set_field("category", req.category)
    if req.description is not None:
        set_field("description", req.description)
    if req.noReview is not None:
        set_field("noReview", "true" if req.noReview else None)
    if req.tags is not None:
        # tags 是数组，特殊处理
        pattern = re.compile(r"^tags:.*?(?:\n  - .*)*", re.MULTILINE)
        if pattern.search(fm_text):
            fm_text = pattern.sub("", fm_text).rstrip() + "\n"
        if req.tags:
            fm_text = fm_text.rstrip() + "\ntags:\n" + "\n".join(f"  - {t}" for t in req.tags) + "\n"

    new_raw = f"---\n{fm_text.rstrip()}\n---\n{body}"
    path.write_text(new_raw, encoding="utf-8")
    return {"ok": True}


@app.delete("/api/posts/{slug}")
def api_delete_post(slug: str) -> dict:
    """删除文章文件 + 清理 SQLite 复习记录"""
    path = post_path_for_slug(slug)
    if not path.exists():
        raise HTTPException(404, f"文章不存在: {slug}")
    path.unlink()

    conn = db.get_db()
    conn.execute("DELETE FROM reviews WHERE slug = ?", (slug,))
    conn.execute("DELETE FROM cards WHERE slug = ?", (slug,))
    conn.commit()
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3001, log_level="info")
