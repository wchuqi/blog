#!/usr/bin/env python3
"""把仓库根的 .env 同步进 dancer 的 settings 表。

jjdown CLI 只提供 `cookie <平台> --set` 来设登录态，没有设置 API Key 的入口；
而 ASR（`--asr`）和图片识别都是从 dancer 的 settings 表读 key 的。这个脚本补上
那一个缺口，别的事都有 CLI 命令，不需要脚本。

    python sync-env.py                 # 同步
    python sync-env.py --dry-run       # 只看会改什么，不写入

空值一律跳过，不会覆盖 dancer 里已有的配置 —— 所以 .env.example 里那些空键是
安全的，只填你要覆盖的项。
"""

from __future__ import annotations

import argparse
import os
import sqlite3
import sys
from pathlib import Path

# .env 变量名 → dancer settings 键名
ENV_TO_SETTING = {
    "SILICONFLOW_API_KEY": "siliconflow_api_key",
    "SILICONFLOW_MODEL": "siliconflow_model",
    "FUNASR_DEVICE": "funasr_device",
    "LLM_BASE_URL": "llm_base_url",
    "LLM_API_KEY": "llm_api_key",
    "LLM_MODEL": "llm_model",
    "VL_BASE_URL": "vl_base_url",
    "VL_API_KEY": "vl_api_key",
    "VL_MODEL": "vl_model",
    "PROXY_HTTP": "proxy_http",
    "PROXY_HTTPS": "proxy_https",
    # B 站登录态。配上才能拿到 1080P+ 与 CC 字幕，否则通常只有 480P。
    "BILIBILI_COOKIE": "bilibili_cookie",
}

DEFAULT_DANCER_DIR = Path("D:/dancer")


def mask(key: str, value: str) -> str:
    """只遮看起来是密钥的键；model、device 这类原样显示，否则看不出改了什么。"""
    if not value:
        return "(空)"
    if not any(t in key.upper() for t in ("KEY", "TOKEN", "SECRET", "COOKIE", "PASSWORD")):
        return value
    return "***" if len(value) <= 12 else f"{value[:6]}…{value[-2:]}"


def parse_env(path: Path) -> dict[str, str]:
    """解析 KEY=VALUE。支持 # 注释、空行、export 前缀、引号包裹、值里带 =。"""
    out: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        if key:
            out[key] = value
    return out


def find_repo_root(start: Path) -> Path:
    for p in [start, *start.parents]:
        if (p / "src" / "posts").is_dir() or (p / "package.json").is_file():
            return p
    return Path.cwd()


def main() -> int:
    ap = argparse.ArgumentParser(description="把 .env 同步进 dancer 的 settings")
    ap.add_argument("--dancer-dir", default=os.environ.get("DANCER_DIR", str(DEFAULT_DANCER_DIR)))
    ap.add_argument("--env", default="", help=".env 路径（默认 <仓库根>/.env）")
    ap.add_argument("--dry-run", action="store_true", help="只显示会改什么，不写入")
    args = ap.parse_args()

    root = find_repo_root(Path(__file__).resolve())
    env_path = Path(args.env).resolve() if args.env else root / ".env"
    if not env_path.is_file():
        print(f"找不到 {env_path}（先把 .env.example 复制成 .env）")
        return 1

    env = parse_env(env_path)
    db_path = Path(args.dancer_dir).resolve() / "server" / "data" / "jjdown.db"
    if not db_path.is_file():
        print(f"找不到 dancer 数据库：{db_path}（用 --dancer-dir 指定 dancer 位置）")
        return 1

    con = sqlite3.connect(str(db_path))
    try:
        current = {r[0]: r[1] for r in con.execute("SELECT key, value FROM settings")}
        changed, blank, unknown = [], [], []
        for key, value in env.items():
            setting = ENV_TO_SETTING.get(key)
            if not setting:
                unknown.append(key)
            elif not value:
                blank.append(key)
            elif str(current.get(setting) or "") != value:
                changed.append((setting, value, f"{key}={mask(key, value)}"))

        if changed and not args.dry_run:
            for setting, value, _ in changed:
                con.execute(
                    "INSERT INTO settings(key, value) VALUES(?, ?) "
                    "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                    (setting, value),
                )
            con.commit()
    finally:
        con.close()

    verb = "将同步" if args.dry_run else "已同步"
    print(f"{verb} {len(changed)} 项" + (f"：{', '.join(c[2] for c in changed)}" if changed else "（无变化）"))
    if blank:
        print(f"  跳过空值（不覆盖 dancer 里的旧值）：{', '.join(blank)}")
    if unknown:
        print(f"  忽略未知键：{', '.join(unknown)}")
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    sys.exit(main())
