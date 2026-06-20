---
title: "Shell学习资料：参数解析、getopts、配置加载和优先级深度解析"
date: 2026-06-20
description: "生产脚本最容易变乱的地方是配置来源。命令行参数、环境变量、配置文件和默认值如果没有优先级，就会出现“到底哪个生效”的问题。配置加载还涉及安全：source config 等于执行配置文件中的 Shell 代码，不能用于不可信配置。"
tags:
  - "开发语言"
  - "Shell"
  - "深度解析"
category: "开发语言"
---

# Shell学习资料：参数解析、getopts、配置加载和优先级深度解析

[返回索引](../Shell学习资料.md)

## 学习目标

- 掌握短选项 `getopts` 和长选项手写解析。
- 设计命令行、环境变量、配置文件、默认值的优先级。
- 安全加载配置，避免 source 注入。

## 理论导读

生产脚本最容易变乱的地方是配置来源。命令行参数、环境变量、配置文件和默认值如果没有优先级，就会出现“到底哪个生效”的问题。配置加载还涉及安全：`source config` 等于执行配置文件中的 Shell 代码，不能用于不可信配置。

## 优先级模型

推荐优先级：

```text
命令行参数 > 环境变量 > 配置文件 > 默认值
```

实现时不要边解析边执行动作。先收集配置，校验完整，再运行。

## getopts

```bash
dry_run=false
verbose=false
output=

while getopts ':hvo:' opt; do
  case "$opt" in
    h) usage; exit 0 ;;
    v) verbose=true ;;
    o) output=$OPTARG ;;
    :) echo "missing argument: -$OPTARG" >&2; exit 2 ;;
    \?) echo "unknown option: -$OPTARG" >&2; exit 2 ;;
  esac
done
shift $((OPTIND - 1))
```

`getopts` 适合短选项。`OPTIND` 是状态变量，函数中重复使用要重置 `OPTIND=1`。

## 长选项手写解析

```bash
while (($#)); do
  case "$1" in
    --dry-run) dry_run=true; shift ;;
    --output=*) output=${1#*=}; shift ;;
    --output) output=${2:?missing value for --output}; shift 2 ;;
    --) shift; break ;;
    -*) echo "unknown option: $1" >&2; exit 2 ;;
    *) break ;;
  esac
done
```

要支持 `--key=value` 和 `--key value`，还要处理缺失值。

## 配置文件安全解析

危险：

```bash
source app.conf
```

如果配置可被低权限用户修改，就等于执行任意代码。

安全解析简单 `KEY=VALUE`：

```bash
load_config() {
  local file=$1 line key value
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || {
      echo "invalid config line: $line" >&2
      return 2
    }
    key=${BASH_REMATCH[1]}
    value=${BASH_REMATCH[2]}
    case "$key" in
      LOG_DIR) LOG_DIR=$value ;;
      DAYS) DAYS=$value ;;
      *) echo "unknown config key: $key" >&2; return 2 ;;
    esac
  done < "$file"
}
```

这仍不是完整 dotenv parser，但比 source 不可信文件安全。

## 配置校验

```bash
[[ -n "${LOG_DIR:-}" ]] || die "LOG_DIR required"
[[ "$DAYS" =~ ^[0-9]+$ ]] || die "DAYS must be integer"
((DAYS > 0)) || die "DAYS must be positive"
```

## 练习

1. 用 getopts 支持 `-v -o file`。
2. 手写解析 `--dry-run --output=file --output file`。
3. 实现配置优先级：默认值、配置文件、环境变量、命令行。
4. 写一个恶意配置文件，验证 source 风险。

## 验收

- 能解释 `OPTIND` 和 `OPTARG`。
- 能设计清晰配置优先级。
- 能拒绝不可信 source。

## 易错

> **易错：** 直接 `source .env` 加载用户可编辑配置。
>
> 正确做法：只有完全可信配置才 source；否则按白名单 key/value 解析并校验。

