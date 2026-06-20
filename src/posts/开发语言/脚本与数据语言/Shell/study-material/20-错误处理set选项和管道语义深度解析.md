---
title: "Shell学习资料：错误处理、set 选项和管道语义深度解析"
date: 2026-06-20
description: "set -euo pipefail 是好起点，但不是错误处理体系。set -e 的历史语义复杂，为了兼容条件判断和组合命令，它在很多上下文不会退出。生产脚本必须区分“预期非 0”和“异常非 0”，并为关键步骤输出上下文。"
tags:
  - "开发语言"
  - "Shell"
  - "深度解析"
category: "开发语言"
---

# Shell学习资料：错误处理、set 选项和管道语义深度解析

[返回索引](../Shell学习资料.md)

## 学习目标

- 深入理解 `set -euo pipefail` 的收益和陷阱。
- 掌握 `PIPESTATUS`、ERR trap、预期失败处理。
- 写出可靠而不是迷信选项的错误处理。

## 理论导读

`set -euo pipefail` 是好起点，但不是错误处理体系。`set -e` 的历史语义复杂，为了兼容条件判断和组合命令，它在很多上下文不会退出。生产脚本必须区分“预期非 0”和“异常非 0”，并为关键步骤输出上下文。

## set -e 例外场景

这些场景中失败通常不会让脚本按直觉退出：

```bash
if grep -q pattern file; then
  echo found
fi

false || echo fallback
false && echo never

while false; do
  :
done
```

管道中非最后命令失败时，如果没有 `pipefail`，管道退出状态由最后命令决定：

```bash
set -e
false | true
echo "still running"
```

## pipefail 和 PIPESTATUS

```bash
set -o pipefail
grep ERROR app.log | sort | uniq -c
echo "${PIPESTATUS[*]}"
```

`PIPESTATUS` 保存最近一个前台管道每段命令退出状态。读取后如果再执行命令会被覆盖，应立即保存。

```bash
grep ERROR app.log | sort | uniq -c
statuses=("${PIPESTATUS[@]}")
```

## nounset

`set -u` 引用未设置变量时报错，但空字符串不报错。

```bash
set -u
echo "${maybe:-default}"
```

对可选变量使用默认值，对必填变量使用 `${var:?message}`。

## ERR trap

```bash
set -Eeuo pipefail
trap 'echo "error line=$LINENO status=$?" >&2' ERR
```

`ERR` trap 不是万能异常机制。它也受 `set -e` 上下文影响。`-E` 让 ERR trap 在函数、命令替换和子 Shell 中继承得更符合预期。

## 预期失败

grep 未匹配返回 1，但不一定是错误：

```bash
if grep -q -- "$pattern" "$file"; then
  echo found
else
  echo not found
fi
```

不要用 `grep ... || true` 随手吞错。它会把文件不存在、权限错误和未匹配混在一起。更严谨：

```bash
if grep -q -- "$pattern" "$file"; then
  found=true
else
  status=$?
  if [[ $status -eq 1 ]]; then
    found=false
  else
    echo "grep failed: $file" >&2
    exit "$status"
  fi
fi
```

## 练习

1. 写 5 个 `set -e` 不退出的例子。
2. 用 `PIPESTATUS` 区分 `grep`、`sort`、`uniq` 哪一步失败。
3. 写一个函数，区分 grep 未匹配和 grep 执行错误。

## 验收

- 能说明为什么 `set -e` 不是异常处理。
- 能正确使用 `pipefail` 和 `PIPESTATUS`。
- 能处理预期失败而不吞掉真实错误。

## 重点

- 错误处理要靠显式判断加日志，不只靠 set。
- `|| true` 是最后手段，使用时要写明原因。
- 预期失败必须和异常失败分开。

## 易错

> **易错：** `cmd | tee log` 中 cmd 失败但脚本继续。
>
> 正确做法：启用 `pipefail`，或显式检查 `PIPESTATUS`。

