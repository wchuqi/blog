---
title: "Shell学习资料：环境、版本和 POSIX/Bash 差异"
date: 2026-06-20
description: "Shell 不是一个单一语言。/bin/sh 在不同系统上可能链接到 Bash、dash、ash 或其他 POSIX 兼容 Shell。Bash 提供数组、[[ ]]、(( ))、{1..3}、process substitution、pi…"
tags:
  - "开发语言"
  - "Shell"
category: "开发语言"
---

# Shell学习资料：环境、版本和 POSIX/Bash 差异

[返回索引](../Shell学习资料.md)

## 学习目标

- 区分 `sh`、Bash、dash、zsh 和 POSIX Shell。
- 正确选择 shebang。
- 知道常见 Bash 特性和 POSIX 不兼容点。

## 理论导读

Shell 不是一个单一语言。`/bin/sh` 在不同系统上可能链接到 Bash、dash、ash 或其他 POSIX 兼容 Shell。Bash 提供数组、`[[ ]]`、`(( ))`、`{1..3}`、process substitution、`pipefail` 等扩展；POSIX sh 更小、更可移植，但功能少。脚本第一行 shebang 决定用什么解释器，写错会导致脚本在某些机器上直接失败。

## 核心心智模型

先决定目标，再选 Shell：

- 只在受控 Linux 机器上跑，追求可读和能力：用 Bash。
- 要在最小系统、容器、busybox、跨 Unix 跑：写 POSIX sh。
- 交互体验：zsh/fish 可以用，但生产脚本不要依赖交互 Shell 配置。

## shebang 选择

```bash
#!/usr/bin/env bash
```

优点是通过 `PATH` 查找 Bash，适合不同安装路径。

```sh
#!/bin/sh
```

表示按 POSIX sh 写，不能使用 Bash 扩展。

```bash
#!/bin/bash
```

路径明确，适合你确认目标机器 Bash 在 `/bin/bash`。

## 常见差异

| 能力 | Bash | POSIX sh |
| --- | --- | --- |
| 数组 | 支持 indexed/associative | 不支持数组 |
| `[[ ]]` | 支持 | 不支持 |
| `(( ))` | 支持 | 不标准 |
| `pipefail` | 支持 | 不标准 |
| process substitution `<(...)` | 支持 | 不支持 |
| brace expansion `{1..5}` | 支持 | 不标准 |
| `${var//a/b}` | 支持 | 不标准 |
| `source` | 支持 | POSIX 用 `.` |

## 版本检查

```bash
bash --version
echo "$BASH_VERSION"
printf '%s\n' "$SHELL"
ls -l /bin/sh
```

`$SHELL` 是用户登录 Shell，不一定是当前脚本解释器。脚本内判断 Bash 应看 `$BASH_VERSION`。

## 例子

错误示例：文件写的是 Bash，却用 sh 运行。

```bash
#!/bin/sh
arr=(a b c)
[[ -n "$arr" ]] && echo ok
```

这在 dash 下会报错。正确做法是改 shebang：

```bash
#!/usr/bin/env bash
arr=(a b c)
[[ -n "${arr[0]}" ]] && echo ok
```

## 练习

1. 在本机查看 `/bin/sh` 指向哪个 Shell。
2. 写一个 Bash 数组脚本，分别用 `bash script.sh` 和 `sh script.sh` 执行。
3. 把同一个逻辑改写成 POSIX sh。

## 验收

- 能解释 shebang 和 `sh script.sh` 的关系。
- 能列出至少 5 个 Bash 非 POSIX 特性。
- 能根据运行环境选择 Bash 或 POSIX sh。

## 重点

- 使用 Bash 特性就明确写 Bash shebang。
- `/bin/sh` 不等于 Bash。
- 生产脚本不要依赖 `.bashrc`、alias、交互选项。

## 易错

> **易错：** 脚本第一行写 `#!/bin/bash`，运行时却用 `sh script.sh`。
>
> 正确做法：直接执行 `./script.sh` 或 `bash script.sh`；如果用 `sh`，脚本必须符合 POSIX sh。

