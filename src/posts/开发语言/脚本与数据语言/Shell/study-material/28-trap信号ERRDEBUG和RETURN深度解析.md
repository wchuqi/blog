---
title: "Shell学习资料：trap、信号、ERR、DEBUG 和 RETURN 深度解析"
date: 2026-06-20
description: "trap 是 Shell 的事件钩子，不是完整异常系统。EXIT 适合清理，ERR 受 set -e 语义影响，DEBUG 在每个简单命令前触发，RETURN 在函数或 source 文件返回时触发。trap 用得好能提升可靠性，用得差会让…"
tags:
  - "开发语言"
  - "Shell"
  - "深度解析"
category: "开发语言"
---

# Shell学习资料：trap、信号、ERR、DEBUG 和 RETURN 深度解析

[返回索引](../Shell学习资料.md)

## 学习目标

- 理解 EXIT、ERR、DEBUG、RETURN trap 的触发时机。
- 掌握 `set -E`、`functrace`、`errtrace` 的作用。
- 写出可靠、幂等、不递归失控的清理逻辑。

## 理论导读

trap 是 Shell 的事件钩子，不是完整异常系统。EXIT 适合清理，ERR 受 `set -e` 语义影响，DEBUG 在每个简单命令前触发，RETURN 在函数或 source 文件返回时触发。trap 用得好能提升可靠性，用得差会让脚本更难排障。

## EXIT trap

```bash
tmpdir=$(mktemp -d)
cleanup() {
  local status=$?
  rm -rf -- "$tmpdir"
  exit "$status"
}
trap cleanup EXIT
```

清理函数应保存原退出状态，避免清理命令覆盖真正错误。

## ERR trap

```bash
set -Eeuo pipefail
trap 'echo "ERR line=$LINENO status=$?" >&2' ERR
```

ERR trap 触发规则与 `set -e` 接近，因此在 `if` 条件、`&&`、`||`、管道非最后段等上下文也有例外。

## DEBUG trap

```bash
trap 'echo "debug: $BASH_COMMAND" >&2' DEBUG
```

DEBUG 在每个简单命令前执行。它适合高级调试、审计、覆盖率实验，但容易产生大量输出和递归问题，不建议普通生产脚本常开。

## RETURN trap

```bash
trap 'echo "return from function or sourced file" >&2' RETURN
```

RETURN 在函数返回或 sourced 脚本返回时触发，配合 `set -T` 或 `functrace` 会向函数和子 Shell 传播更多调试 trap。

## 信号

常见信号：

- INT：Ctrl-C。
- TERM：常规终止请求。
- HUP：终端断开或 reload 约定。
- PIPE：管道读端关闭。
- KILL、STOP：不能捕获。

```bash
trap 'echo interrupted >&2; exit 130' INT
trap 'echo terminated >&2; exit 143' TERM
```

## trap 设计原则

- 清理函数幂等，可重复执行。
- 保存原退出码。
- 清理失败不要掩盖主错误。
- 不在 trap 中做复杂业务逻辑。
- 避免 trap 调用可能再次触发 trap 的命令导致递归。

## 练习

1. 写 EXIT trap，验证正常退出和错误退出都清理临时目录。
2. 写 ERR trap，测试 `if false; then` 是否触发。
3. 写 DEBUG trap，观察输出量。
4. 捕获 INT，Ctrl-C 后清理后台任务。

## 验收

- 能解释 ERR trap 和 `set -e` 的关系。
- 能写不覆盖退出码的 cleanup。
- 能说明 KILL 和 STOP 不能捕获。

## 易错

> **易错：** 在 cleanup 最后一条执行 `rm`，导致脚本最终退出码变成 rm 的状态。
>
> 正确做法：进入 cleanup 时保存 `$?`，清理后按原状态退出。

