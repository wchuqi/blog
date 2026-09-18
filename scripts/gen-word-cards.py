"""
一次性迁移脚本：把 10000 单词源文件切分成问答卡片。

源：D:\\tmp\\10000个英语单词，3个月200节课全记牢\\{1-1000 .. 9001-10000}.md
    条目格式：`N、word` + 围栏代码块（音标/谐音、词性、释义、空行、拆解联想句）
出：src/posts/卡片/单词/单词卡-<word>.md （1 词 1 卡，frontmatter type: card）

注：文件名已全局去重（见 `used`），所以不再按 1-1000 / 1001-2000 分子目录——
那层目录只会把卡片分组拆成 10 个无意义的桶（分组 = 文件所在子目录）。

卡片布局（谐音联想记忆法）：
  # 问题   -> 单词 + 音标/谐音 + 拆解联想句（提示）
  # 答案   -> 词性 + 释义

用法：
  python scripts/gen-word-cards.py            # 生成（已存在的文件跳过）
  python scripts/gen-word-cards.py --dry      # 只统计不写文件
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = Path(r"D:\tmp\10000个英语单词，3个月200节课全记牢")
RANGES = [f"{i}-{i + 999}" for i in range(1, 10001, 1000)]
OUT_DIR = ROOT / "src" / "posts" / "卡片" / "单词"
TAG = "单词"
DATE = "2026-09-11"

ENTRY_RE = re.compile(r"^\s*\d+、\s*(.+?)\s*$")
PHON_RE = re.compile(r"\[[^\]]+\]")
ILLEGAL = re.compile(r'[\\/:*?"<>|\s]+')

# Windows 文件名非法字符 / 空白 → 连字符；结尾的点也非法
def sanitize(name: str) -> str:
    return ILLEGAL.sub("-", name).strip("-.") or "word"


def first_fence(text: str) -> str:
    """取第一对 ``` 围栏内的内容；没有围栏则返回原文"""
    lines = text.split("\n")
    out: list[str] = []
    inside = False
    for ln in lines:
        s = ln.strip()
        if s.startswith("```"):
            if not inside:
                inside = True
                continue
            break
        if inside:
            out.append(ln)
    return "\n".join(out) if out else text


def parse_entry(chunk: str) -> tuple[str | None, list[str], list[str]]:
    """
    解析一个条目的正文，返回 (音标行, 联想提示行, 词性释义行)。
    结构假设：音标行 / 词性+释义 / 空行 / 联想句；
    找不到空行分隔时全部进答案（提示只有音标）。
    """
    lines = [ln.rstrip() for ln in first_fence(chunk).split("\n")]
    phon: str | None = None
    rest: list[str] = []
    for ln in lines:
        if phon is None and PHON_RE.search(ln):
            phon = ln.strip()
        else:
            rest.append(ln)
    while rest and not rest[0].strip():
        rest.pop(0)
    while rest and not rest[-1].strip():
        rest.pop()

    head, tail = rest, []
    for i, ln in enumerate(rest):
        if not ln.strip():
            head, tail = rest[:i], [x for x in rest[i + 1:] if x.strip()]
            break
    while head and not head[0].strip():
        head.pop(0)
    return phon, tail, head


def card_md(word: str, phon: str | None, hints: list[str], answers: list[str]) -> str:
    parts = [
        "---",
        f"title: {word}",
        f"date: {DATE}",
        "type: card",
        "tags:",
        f"  - {TAG}",
        "---",
        "",
        "# 问题",
        "",
        f"**{word}**",
    ]
    if phon:
        parts += ["", phon]
    if hints:
        parts += ["", *hints]
    parts += ["", "# 答案", ""]
    parts += answers if answers else ["（源条目缺少释义）"]
    return "\n".join(parts) + "\n"


def main() -> None:
    dry = "--dry" in sys.argv
    used: set[str] = set()
    total = 0
    skipped = 0

    if not dry:
        OUT_DIR.mkdir(parents=True, exist_ok=True)

    for rng in RANGES:
        src = SRC_DIR / f"{rng}.md"
        if not src.exists():
            print(f"[warn] 缺少源文件: {src}")
            continue
        raw = src.read_text(encoding="utf-8")
        lines = raw.split("\n")

        # 定位所有条目行：`N、word`
        entries: list[tuple[str, int]] = []
        for i, ln in enumerate(lines):
            m = ENTRY_RE.match(ln)
            if m:
                entries.append((m.group(1), i))

        count = 0
        for idx, (word, start) in enumerate(entries):
            end = entries[idx + 1][1] if idx + 1 < len(entries) else len(lines)
            chunk = "\n".join(lines[start + 1:end])
            phon, hints, answers = parse_entry(chunk)

            base = sanitize(word)
            key = base.lower()
            n = 2
            slug = base
            while slug.lower() in used:  # Windows 文件名大小写不敏感，按小写去重
                slug = f"{base}-{n}"
                n += 1
            used.add(slug.lower())

            if not dry:
                path = OUT_DIR / f"单词卡-{slug}.md"
                if path.exists():
                    skipped += 1
                else:
                    # newline="\n"：禁止 Windows 文本模式把 \n 翻成 CRLF，
                    # 否则 gen-rss.mjs 的极简 frontmatter 解析会漏读 type: card
                    with path.open("w", encoding="utf-8", newline="\n") as fh:
                        fh.write(card_md(word, phon, hints, answers))
            count += 1
        total += count
        print(f"[gen] {rng}: {count} 词")

    print(f"[gen] 合计 {total} 词" + (f"，跳过已存在 {skipped} 个" if skipped else "") + ("（dry run，未写文件）" if dry else ""))


if __name__ == "__main__":
    main()
