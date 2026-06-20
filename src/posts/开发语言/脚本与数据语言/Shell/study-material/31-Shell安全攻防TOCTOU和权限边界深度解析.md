---
title: "Shell学习资料：Shell 安全攻防、TOCTOU 和权限边界深度解析"
date: 2026-06-20
description: "Shell 脚本经常运行在高权限环境，且天生会调用外部命令。攻击者不一定要修改脚本，只要控制输入、环境变量、PATH、配置文件、临时目录或文件名，就可能改变脚本行为。安全 Shell 编程要假设输入和环境都可能恶意。"
tags:
  - "开发语言"
  - "Shell"
  - "深度解析"
category: "开发语言"
---

# Shell学习资料：Shell 安全攻防、TOCTOU 和权限边界深度解析

[返回索引](../Shell学习资料.md)

## 学习目标

- 从攻击视角识别 Shell 注入、PATH 劫持、临时文件攻击、TOCTOU 和符号链接风险。
- 掌握 root 脚本、sudo 脚本和 CI 脚本的权限边界。
- 写出安全默认值和防御式代码。

## 理论导读

Shell 脚本经常运行在高权限环境，且天生会调用外部命令。攻击者不一定要修改脚本，只要控制输入、环境变量、PATH、配置文件、临时目录或文件名，就可能改变脚本行为。安全 Shell 编程要假设输入和环境都可能恶意。

## 命令注入

危险：

```bash
eval "grep $pattern $file"
```

如果 pattern 是 `x; rm -rf /`，会被当代码执行。正确方式是参数数组：

```bash
grep -- "$pattern" "$file"
```

## PATH 劫持

危险：

```bash
tar czf backup.tgz "$dir"
```

如果高权限脚本继承了不可信 PATH，攻击者可放一个伪造 `tar`。防御：

```bash
PATH=/usr/sbin:/usr/bin:/sbin:/bin
export PATH
command -v tar >/dev/null || exit 127
```

极高风险脚本可使用绝对路径。

## TOCTOU

Time-of-check to time-of-use：检查和使用之间对象被替换。

危险模式：

```bash
if [[ -f "$file" ]]; then
  cat "$file" > /safe/output
fi
```

检查后，攻击者可能把 `$file` 替换成符号链接或其他文件。缓解：

- 在受控目录下操作。
- 使用安全权限目录。
- 避免跟随不可信符号链接。
- 用 `mktemp` 创建临时文件。
- 对 root 脚本减少可写路径和用户输入。

## 临时文件攻击

危险：

```bash
tmp=/tmp/app.tmp
echo data > "$tmp"
```

攻击者可提前创建符号链接。正确：

```bash
tmpdir=$(mktemp -d)
trap 'rm -rf -- "$tmpdir"' EXIT
tmp=$tmpdir/data
```

## source 配置攻击

```bash
source "$config"
```

如果 config 可被低权限用户修改，就可以执行任意命令。防御：

- 配置文件必须 root 拥有且不可被普通用户写。
- 或按白名单 key/value 解析。
- 检查路径、所有者和权限。

## sudo 和 root 脚本

规则：

- 不继承不可信环境。
- 固定 PATH。
- 校验输入路径。
- 尽量降权执行不需要 root 的部分。
- 不在 world-writable 目录中基于可预测名称创建文件。
- 明确 umask。

## CI 脚本风险

- PR 可修改脚本并读取 secret。
- `set -x` 打印 token。
- 缓存污染。
- 下载执行远程脚本。
- Docker socket 暴露。

CI 中 secret 只应暴露给可信分支和最小步骤。

## 练习

1. 构造 PATH 劫持演示：当前目录放伪造 `tar`。
2. 构造 `/tmp/app.tmp` 符号链接攻击演示。
3. 写安全加载配置函数，拒绝未知 key。
4. 为 root 脚本写权限检查。

## 验收

- 能解释命令注入和 PATH 劫持。
- 能说明 TOCTOU 的本质。
- 能写出 `mktemp -d`、umask、路径校验和配置权限检查。

## 易错

> **易错：** 认为变量加引号就解决了所有安全问题。
>
> 正确做法：还要防 PATH、权限、符号链接、TOCTOU、配置执行和 secret 泄漏。

