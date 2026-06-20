---
title: "Linux 学习资料：命令行、Shell 和帮助系统"
date: 2026-06-20
description: "Shell 是用户和系统交互的解释器。你输入的一行命令并不是直接原样交给内核执行，Shell 会先做 alias 展开、变量展开、通配符展开、命令替换、重定向和管道连接，然后才启动进程。很多“命令为什么和我想的不一样”的问题，本质上是 Sh…"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
category: "运维"
---

# Linux 学习资料：命令行、Shell 和帮助系统

[返回索引](../Linux学习资料.md)

## 学习目标

- 掌握 Shell 的执行模型：命令查找、参数展开、引用、管道、重定向、退出码。
- 能通过帮助系统自行确认命令参数和配置文件格式。
- 能理解 CentOS 7 与 Ubuntu 24.04 上命令版本差异带来的行为差异。

## 理论导读

Shell 是用户和系统交互的解释器。你输入的一行命令并不是直接原样交给内核执行，Shell 会先做 alias 展开、变量展开、通配符展开、命令替换、重定向和管道连接，然后才启动进程。很多“命令为什么和我想的不一样”的问题，本质上是 Shell 展开规则没有理解。

Linux 学习的第一能力是自查。不同发行版命令版本可能不同，同一命令在 GNU coreutils、busybox、不同 systemd 版本下参数也可能不同。可靠做法是优先在目标机器上查 `man`、`--help`、`type`、`rpm -qf` 或 `dpkg -S`。

## 核心心智模型

一行命令的执行大致是：

```text
读取命令行
  -> alias/function/builtin/path 查找
  -> 变量、通配符、命令替换、引用处理
  -> 建立 stdin/stdout/stderr 和管道
  -> fork/exec 启动程序
  -> 等待退出码
```

## 知识点详解

### 1. 命令从哪里来

```bash
type cd
type ls
type systemctl
command -v bash
which nginx || true
```

命令可能来自：

- shell builtin，例如 `cd`、`echo`、`type`。
- alias，例如某些系统把 `ll` 定义为 `ls -l`。
- shell function。
- PATH 中的可执行文件，例如 `/usr/bin/systemctl`。

查看文件属于哪个包：

CentOS 7：

```bash
rpm -qf /usr/bin/systemctl
```

Ubuntu 24.04：

```bash
dpkg -S /usr/bin/systemctl
```

### 2. 退出码

Linux 命令通常用退出码表达成功或失败。0 表示成功，非 0 表示失败。

```bash
grep root /etc/passwd
echo $?

grep not_exist_user /etc/passwd
echo $?
```

脚本和自动化必须检查退出码。只看输出文本是不可靠的。

### 3. 管道和重定向

```bash
ps aux | grep nginx
command >out.log 2>err.log
command >all.log 2>&1
command >>append.log
```

管道连接的是前一个命令的 stdout 和后一个命令的 stdin。stderr 默认不进管道，除非显式重定向。

`set -o pipefail` 会让管道中任一命令失败时整体失败，更适合脚本。

```bash
set -o pipefail
grep pattern missing.txt | wc -l
echo $?
```

### 4. 引用和展开

```bash
name="a b"
echo $name
echo "$name"
echo '$name'
```

区别：

- 不加引号：变量展开后会发生词拆分和通配符展开。
- 双引号：变量会展开，但保留整体。
- 单引号：完全按字面量。

脚本里绝大多数变量引用都应使用双引号。

### 5. 通配符

```bash
ls *.log
ls /var/log/*.log
```

通配符由 Shell 展开，不是 `ls` 自己处理。没有匹配时，不同 shell 设置可能行为不同。脚本中要小心无匹配场景。

### 6. 帮助系统

```bash
man ls
man 5 passwd
man 8 useradd
info coreutils
systemctl --help
rpm --help
apt --help
```

man section 常见含义：

| section | 内容 |
| --- | --- |
| 1 | 用户命令 |
| 2 | 系统调用 |
| 3 | C 库函数 |
| 5 | 文件格式和配置文件 |
| 7 | 概念、协议、约定 |
| 8 | 系统管理命令 |

查看配置文件格式时，`man 5` 往往比博客可靠。

### 7. CentOS 7 与 Ubuntu 24.04 命令差异

| 主题 | CentOS 7 | Ubuntu 24.04 |
| --- | --- | --- |
| 包查询 | `rpm -qf`、`yum provides` | `dpkg -S`、`apt-file search` |
| 网络旧命令 | 可能有 `netstat`，但仍建议 `ss` | 默认更推荐 `ss`、`ip` |
| Python | `python` 常指 Python 2 或不存在视环境而定 | Python 3 为主，`python` 可能需包提供 |
| 服务 | systemd 219 | systemd 255 系列，功能更多 |

## 例子：排查命令不存在

问题：执行 `ifconfig` 提示 command not found。

判断：

```bash
command -v ifconfig || true
command -v ip
```

现代 Linux 推荐用：

```bash
ip addr
ip route
```

如果确实需要旧工具：

CentOS 7：

```bash
sudo yum install -y net-tools
```

Ubuntu 24.04：

```bash
sudo apt update
sudo apt install -y net-tools
```

## 练习

1. 用 `type` 判断 `cd`、`echo`、`ls`、`systemctl` 的来源。
2. 用 `man 5 passwd` 解释 `/etc/passwd` 每个字段。
3. 写命令把 `/var/log` 下包含 `error` 的行输出到 `errors.log`，stderr 输出到 `errors.err`。
4. 比较 `echo $HOME`、`echo "$HOME"`、`echo '$HOME'`。
5. 用 `rpm -qf` 或 `dpkg -S` 找出 `/bin/bash` 属于哪个包。

## 验收

- 能解释 shell builtin、alias、二进制命令的区别。
- 能根据退出码判断命令是否成功。
- 能正确使用 stdout、stderr、管道和追加重定向。
- 能说明为什么脚本中变量引用通常要加双引号。
- 能使用 man section 查询命令和配置文件格式。

## 重点

- Shell 会先展开，再执行命令。
- 自动化脚本必须关注退出码和 stderr。
- 目标机器上的帮助文档比记忆中的参数更可靠。

## 难点

- 管道默认只传 stdout，不传 stderr。很多日志分析命令漏数据，是因为错误输出没有被纳入管道。

## 易错

> **易错：** 用 `ps aux | grep nginx` 判断服务是否运行，却把 `grep nginx` 自己也匹配进去。
>
> 正确做法：优先用 `systemctl status nginx`、`pgrep -a nginx` 或 `ss -lntp` 结合判断。

> **易错：** 脚本里写 `rm $dir/*`，变量为空时变成危险路径。
>
> 正确做法：严格校验变量非空，并使用安全边界。生产脚本避免拼接高危删除命令。

