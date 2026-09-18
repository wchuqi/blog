"""
SQLite 数据库层 + SM-2 间隔重复算法。

数据模型：
  cards   表 —— 每篇文章一张卡片，存当前算法状态（权威源）
  reviews 表 —— 每次复习一行追加日志

SM-2 参数：
  ease 初始 2.5，下限 1.3，上限 3.0
  三档打分：5=记得 / 4=模糊 / 0=忘了
  interval 规则：reps=0→1天，reps=1→6天，之后 round(prev_interval × ease)
  忘了（grade<3）：reps 归零，interval=1，ease 下调
"""
from __future__ import annotations

import sqlite3
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

# ---------- SM-2 常量 ----------
EASE_INITIAL = 2.5
EASE_MIN = 1.3
EASE_MAX = 3.0

# 打分档位
GRADE_REMEMBER = 5   # 记得
GRADE_VAGUE = 4      # 模糊
GRADE_FORGOT = 0     # 忘了


def clamp_ease(ease: float) -> float:
    return max(EASE_MIN, min(EASE_MAX, ease))


def sm2_review(reps: int, interval: int, ease: float, grade: int) -> tuple[int, int, float]:
    """
    跑一次 SM-2，返回 (new_reps, new_interval, new_ease)。

    grade >= 3 视为复习成功，grade < 3 视为失败（忘了）。
    """
    if grade < 3:
        # 忘了：reps 归零，interval 重置为 1 天，ease 下调
        new_reps = 0
        new_interval = 1
        new_ease = clamp_ease(ease - 0.2)
        return new_reps, new_interval, new_ease

    # 复习成功
    new_reps = reps + 1
    if new_reps == 1:
        new_interval = 1
    elif new_reps == 2:
        new_interval = 6
    else:
        new_interval = round(interval * ease)
        new_interval = max(1, new_interval)

    # ease 调整
    if grade == GRADE_REMEMBER:
        new_ease = clamp_ease(ease + 0.1)
    elif grade == GRADE_VAGUE:
        new_ease = clamp_ease(ease)  # 模糊：ease 不变
    else:
        # grade=3 这种中间档（当前不使用，但保留兼容）
        new_ease = clamp_ease(ease - 0.05)

    return new_reps, new_interval, new_ease


def retention(t_days: int, interval: int) -> float:
    """记忆保留率 R = e^(-t/s)，s=interval"""
    if interval <= 0:
        return 0.0
    import math
    return math.exp(-max(0, t_days) / interval)


# ---------- 数据库 ----------

DB_PATH = Path(__file__).resolve().parent.parent / "review.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS cards (
    slug        TEXT PRIMARY KEY,
    title       TEXT NOT NULL DEFAULT '',
    category    TEXT DEFAULT NULL,
    created     TEXT NOT NULL,          -- ISO 日期，开始记忆的日期
    last_review TEXT DEFAULT NULL,      -- ISO 日期，最近一次复习
    reps        INTEGER NOT NULL DEFAULT 0,
    interval    INTEGER NOT NULL DEFAULT 0,
    ease        REAL NOT NULL DEFAULT 2.5
);

CREATE TABLE IF NOT EXISTS reviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL,
    review_date TEXT NOT NULL,          -- ISO 日期
    grade       INTEGER NOT NULL,       -- 0/4/5
    ease        REAL NOT NULL,           -- 当时 ease
    interval    INTEGER NOT NULL,        -- 当时算出的 interval
    FOREIGN KEY (slug) REFERENCES cards(slug)
);

CREATE INDEX IF NOT EXISTS idx_reviews_slug ON reviews(slug);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(review_date);
"""


def get_db() -> sqlite3.Connection:
    """打开数据库连接，首次运行时自动建表"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


def today_iso() -> str:
    return date.today().isoformat()


def parse_iso(s: str | None) -> date | None:
    if not s:
        return None
    return date.fromisoformat(s[:10])


# ---------- 卡片操作 ----------

def ensure_card(conn: sqlite3.Connection, slug: str, title: str = "",
                category: str | None = None, created: str | None = None) -> sqlite3.Row:
    """确保卡片存在（不存在则用初始值创建），返回当前行"""
    row = conn.execute("SELECT * FROM cards WHERE slug = ?", (slug,)).fetchone()
    if row is not None:
        # 更新标题/分类（文章元数据可能变化）
        conn.execute(
            "UPDATE cards SET title = ?, category = ? WHERE slug = ?",
            (title, category, slug),
        )
        conn.commit()
        return conn.execute("SELECT * FROM cards WHERE slug = ?", (slug,)).fetchone()

    conn.execute(
        """INSERT INTO cards (slug, title, category, created)
           VALUES (?, ?, ?, ?)""",
        (slug, title, category, created or today_iso()),
    )
    conn.commit()
    return conn.execute("SELECT * FROM cards WHERE slug = ?", (slug,)).fetchone()


def bulk_ensure_cards(
    conn: sqlite3.Connection,
    rows: list[tuple[str, str, str]],
) -> int:
    """
    批量确保卡片存在（万级卡片专用）：单事务 INSERT 缺失行，不逐条 commit。
    rows: (slug, title, created)。已存在的行不更新 title/category（ensure_card 才做）。
    返回新增行数。
    """
    existing = {r[0] for r in conn.execute("SELECT slug FROM cards")}
    missing = [(slug, title, None, created) for slug, title, created in rows if slug not in existing]
    if missing:
        with conn:
            conn.executemany(
                """INSERT INTO cards (slug, title, category, created)
                   VALUES (?, ?, ?, ?)""",
                missing,
            )
    return len(missing)


def get_card(conn: sqlite3.Connection, slug: str) -> sqlite3.Row | None:
    return conn.execute("SELECT * FROM cards WHERE slug = ?", (slug,)).fetchone()


def get_all_cards(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute("SELECT * FROM cards ORDER BY last_review IS NULL DESC, last_review DESC").fetchall()


def get_card_history(conn: sqlite3.Connection, slug: str) -> list[sqlite3.Row]:
    return conn.execute(
        "SELECT * FROM reviews WHERE slug = ? ORDER BY review_date ASC, id ASC",
        (slug,),
    ).fetchall()


def review_card(conn: sqlite3.Connection, slug: str, grade: int) -> dict[str, Any]:
    """
    对指定卡片执行一次复习。
    跑 SM-2 → 更新 cards 表 → 追加 reviews 日志 → 返回新的卡片状态。
    """
    card = get_card(conn, slug)
    if card is None:
        raise KeyError(f"卡片不存在: {slug}")

    new_reps, new_interval, new_ease = sm2_review(
        card["reps"], card["interval"], card["ease"], grade
    )
    today = today_iso()

    conn.execute(
        """UPDATE cards SET
              last_review = ?, reps = ?, interval = ?, ease = ?
           WHERE slug = ?""",
        (today, new_reps, new_interval, new_ease, slug),
    )
    conn.execute(
        """INSERT INTO reviews (slug, review_date, grade, ease, interval)
           VALUES (?, ?, ?, ?, ?)""",
        (slug, today, grade, new_ease, new_interval),
    )
    conn.commit()

    return dict(get_card(conn, slug))


# ---------- 统计与待复习 ----------

def days_until_due(card: sqlite3.Row, today: date | None = None) -> int | None:
    """距离下次复习的天数（负=已逾期），从未复习返回 0（今天到期）"""
    if not card["last_review"] or card["interval"] <= 0:
        if card["reps"] == 0:
            return 0
        created = parse_iso(card["created"])
        if created is None:
            return None
        t = today or date.today()
        return (created - t).days
    last = parse_iso(card["last_review"])
    if last is None:
        return None
    t = today or date.today()
    next_due = last + timedelta(days=card["interval"])
    return (next_due - t).days


def get_due_today(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    """今日待复习的卡片（dueIn <= 0）"""
    today = date.today()
    cards = get_all_cards(conn)
    due = []
    for c in cards:
        d = days_until_due(c, today)
        if d is not None and d <= 0:
            due.append(c)
    return due


def get_stats(conn: sqlite3.Connection) -> dict[str, Any]:
    """全局统计"""
    cards = get_all_cards(conn)
    total_cards = len(cards)
    total_reviews = conn.execute("SELECT COUNT(*) FROM reviews").fetchone()[0]
    avg_ease = (
        sum(c["ease"] for c in cards) / total_cards
        if total_cards > 0
        else 0
    )

    today = date.today()
    due_today = sum(
        1 for c in cards
        if (d := days_until_due(c, today)) is not None and d <= 0
    )
    overdue = sum(
        1 for c in cards
        if (d := days_until_due(c, today)) is not None and d < 0
    )

    # 连续复习天数：从今天往回数，有复习记录的连续天数
    streak = 0
    cursor = today
    while True:
        count = conn.execute(
            "SELECT COUNT(DISTINCT review_date) FROM reviews WHERE review_date = ?",
            (cursor.isoformat(),),
        ).fetchone()[0]
        if count > 0:
            streak += 1
            cursor -= timedelta(days=1)
        else:
            break

    return {
        "totalCards": total_cards,
        "totalReviews": total_reviews,
        "avgEase": round(avg_ease, 2),
        "streakDays": streak,
        "dueToday": due_today,
        "overdue": overdue,
    }


def get_heatmap(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    """每日复习次数聚合（热力图数据）"""
    rows = conn.execute(
        """SELECT review_date AS date, COUNT(*) AS count
           FROM reviews
           GROUP BY review_date
           ORDER BY date ASC"""
    ).fetchall()
    return [dict(r) for r in rows]
