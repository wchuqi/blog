---
title: "Paramiko学习资料：远程命令执行、stdout、stderr 和退出码"
date: 2026-06-20
description: "execcommand 在远程主机上启动一个命令，并返回 stdin、stdout、stderr 三个类文件对象。命令是否成功不能只看 stdout，必须检查退出码。远程命令默认不是交互式登录 shell，PATH、alias、profil…"
tags:
  - "开发语言"
  - "paramiko"
category: "开发语言"
---

# Paramiko学习资料：远程命令执行、stdout、stderr 和退出码

[返回索引](../Paramiko学习资料.md)

## 学习目标

- 正确执行远程命令。
- 读取 stdout、stderr 和退出码。
- 处理环境变量、工作目录、sudo 和非交互 shell 差异。

## 理论导读

`exec_command` 在远程主机上启动一个命令，并返回 stdin、stdout、stderr 三个类文件对象。命令是否成功不能只看 stdout，必须检查退出码。远程命令默认不是交互式登录 shell，PATH、alias、profile 可能与手工登录不同。

## 示例

```python
def exec_checked(client, command: str, timeout: int = 30) -> str:
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    if exit_code != 0:
        raise RuntimeError(f"command failed: code={exit_code}, stderr={err}")
    return out
```

## 命令设计建议

- 使用绝对路径或显式加载环境。
- 对参数做安全引用，避免命令注入。
- 明确工作目录：`cd /path && command`。
- 对危险命令添加 dry-run。
- 非幂等命令不要盲目重试。

## 练习

封装 `run_remote`，返回结构体：host、command、exit_code、stdout、stderr、duration、error。

## 验收

- 能处理非 0 退出码。
- 能收集 stdout 和 stderr。
- 能解释远程 shell 环境差异。

## 重点

- exit code 是远程命令结果判断的核心。

## 难点

- sudo、交互式输入和伪终端会改变命令行为，自动化中要尽量避免依赖交互。

## 易错

> **易错：** 拼接用户输入到 shell 命令中。
>
> 正确做法：限制允许的命令和参数，使用 `shlex.quote` 或更安全的参数化策略。

