---
title: "Shell学习资料：重定向、管道、文件描述符和 Here 文档"
date: 2026-06-20
description: "Unix 程序默认有三个文件描述符：0 是标准输入，1 是标准输出，2 是标准错误。Shell 重定向改变的是命令执行时这些描述符指向哪里。管道把前一个命令的 stdout 接到后一个命令的 stdin。stderr 默认不进管道，除非显式…"
tags:
  - "开发语言"
  - "Shell"
category: "开发语言"
---

# Shell学习资料：重定向、管道、文件描述符和 Here 文档

[返回索引](../Shell学习资料.md)

## 学习目标

- 理解 stdin、stdout、stderr 和文件描述符。
- 掌握重定向顺序、管道、tee、here document、process substitution。
- 能安全记录日志和处理错误输出。

## 理论导读

Unix 程序默认有三个文件描述符：0 是标准输入，1 是标准输出，2 是标准错误。Shell 重定向改变的是命令执行时这些描述符指向哪里。管道把前一个命令的 stdout 接到后一个命令的 stdin。stderr 默认不进管道，除非显式合并。

## 文件描述符

```bash
cmd >out.txt       # stdout 到文件
cmd 2>err.txt      # stderr 到文件
cmd >all.txt 2>&1  # stderr 复制到当前 stdout 指向的位置
cmd &>all.txt      # Bash 写法，stdout 和 stderr 到文件
```

重定向顺序重要：

```bash
cmd >out.txt 2>&1
cmd 2>&1 >out.txt
```

第一条 stdout 和 stderr 都进 `out.txt`。第二条 stderr 先指向原 stdout，随后 stdout 才改到文件，因此 stderr 仍在终端。

## 管道

```bash
journalctl -u nginx | grep -i error | tail -n 20
```

管道默认只传 stdout。要传 stderr：

```bash
cmd 2>&1 | grep error
```

## tee

`tee` 同时写文件和 stdout，适合日志：

```bash
make 2>&1 | tee build.log
```

在 `pipefail` 下，管道整体能反映前面命令失败。

## Here document

```bash
cat >config.conf <<EOF
port=$PORT
env=$APP_ENV
EOF
```

如果 delimiter 加引号，则内容不展开：

```bash
cat <<'EOF'
literal $HOME
EOF
```

## Process substitution

Bash 支持：

```bash
diff <(sort a.txt) <(sort b.txt)
```

它让命令输出表现得像文件路径，适合需要文件参数的程序。POSIX sh 不支持。

## 例子：分离日志

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

exec > >(tee -a app.out.log)
exec 2> >(tee -a app.err.log >&2)

echo "normal output"
echo "error output" >&2
```

## 练习

1. 比较 `>out 2>&1` 和 `2>&1 >out`。
2. 用 here document 生成 Nginx 配置。
3. 用 `tee` 同时在终端显示和保存构建日志。

## 验收

- 能解释文件描述符 0、1、2。
- 能判断重定向顺序对结果的影响。
- 能在日志脚本中合理分离 stdout 和 stderr。

## 重点

- stderr 默认不进入管道。
- 重定向从左到右处理。
- here document delimiter 加引号可以禁止展开。

## 易错

> **易错：** `cmd 2>&1 >file` 以为 stdout 和 stderr 都进入文件。
>
> 正确做法：使用 `cmd >file 2>&1` 或 Bash 的 `cmd &>file`。

