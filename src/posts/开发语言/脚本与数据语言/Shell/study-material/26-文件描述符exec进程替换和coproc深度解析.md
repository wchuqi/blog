---
title: "Shell学习资料：文件描述符、exec、进程替换和 coproc 深度解析"
date: 2026-06-20
description: "Shell IO 的核心是文件描述符表。重定向不是字符串操作，而是让某个 FD 指向文件、管道、socket 或另一个 FD。exec 不带命令时会修改当前 Shell 的 FD，这适合统一日志，也可能让后续命令全部输出到错误位置。"
tags:
  - "开发语言"
  - "Shell"
  - "深度解析"
category: "开发语言"
---

# Shell学习资料：文件描述符、exec、进程替换和 coproc 深度解析

[返回索引](../Shell学习资料.md)

## 学习目标

- 深入理解 FD 复制、关闭、移动和 `exec` 的当前 Shell 副作用。
- 掌握 process substitution 的实现边界。
- 理解 Bash `coproc` 双向通信的使用场景和风险。

## 理论导读

Shell IO 的核心是文件描述符表。重定向不是字符串操作，而是让某个 FD 指向文件、管道、socket 或另一个 FD。`exec` 不带命令时会修改当前 Shell 的 FD，这适合统一日志，也可能让后续命令全部输出到错误位置。

## FD 复制和顺序

```bash
cmd >out 2>&1
cmd 2>&1 >out
```

`2>&1` 的含义是“让 FD 2 复制当前 FD 1 的目标”，不是“让 2 永远跟随 1”。所以顺序不同结果不同。

关闭 FD：

```bash
cmd 2>/dev/null
cmd 3>&-
```

打开自定义 FD：

```bash
exec 3>debug.log
printf 'debug\n' >&3
exec 3>&-
```

## exec 改当前 Shell

```bash
exec >app.log 2>&1
echo "all later output goes to app.log"
```

保存和恢复 stdout：

```bash
exec 3>&1
exec >app.log
echo "to file"
exec 1>&3
exec 3>&-
echo "to terminal"
```

## command group 和重定向

```bash
{
  echo one
  echo two
} >out.log
```

`{ ...; }` 在当前 Shell 执行，重定向作用于整个组。`( ... )` 在子 Shell 执行，变量和目录变化不会影响外层。

## process substitution

```bash
diff <(sort a.txt) <(sort b.txt)
```

Bash 可能用 `/dev/fd` 或命名管道实现。它把命令输出变成一个文件名参数，适合 `diff`、`comm` 这类需要文件路径的程序。

边界：

- 非 POSIX。
- 进程替换命令失败不一定被主命令自然感知。
- 临时 FD 和后台进程排障更复杂。

## coproc

`coproc` 启动一个协进程，提供双向管道。

```bash
coproc AWK { awk '{print toupper($0); fflush() }'; }
printf 'hello\n' >&"${AWK[1]}"
IFS= read -r line <&"${AWK[0]}"
printf '%s\n' "$line"
exec {AWK[1]}>&-
wait "$AWK_PID"
```

适合需要长期保持一个子进程，避免循环中反复启动外部命令。但它复杂、可读性差，生产使用要非常谨慎。

## 练习

1. 验证 `>out 2>&1` 和 `2>&1 >out`。
2. 用 `exec 3>&1` 保存 stdout 并恢复。
3. 用 process substitution 比较两个排序后的文件。
4. 写一个简单 coproc，把输入转成大写。

## 验收

- 能解释 FD 复制是即时复制目标。
- 能使用 `exec` 做脚本级日志重定向并恢复。
- 能说明 process substitution 和 coproc 的非 POSIX 边界。

## 易错

> **易错：** 在函数里 `exec >log` 后忘记恢复，导致整个脚本后续输出都被重定向。
>
> 正确做法：保存原 FD，使用后恢复，或只对命令组做局部重定向。

