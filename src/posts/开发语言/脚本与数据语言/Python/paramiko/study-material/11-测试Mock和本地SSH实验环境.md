---
title: "Paramiko学习资料：测试、Mock 和本地 SSH 实验环境"
date: 2026-06-20
description: "SSH 自动化测试不能完全依赖真实服务器。单元测试应 Mock SSHClient，验证命令构造、异常处理、结果解析和日志；集成测试可以用本地容器或测试 SSH Server 验证真实连接。"
tags:
  - "开发语言"
  - "paramiko"
  - "实践练习"
category: "开发语言"
---

# Paramiko学习资料：测试、Mock 和本地 SSH 实验环境

[返回索引](../Paramiko学习资料.md)

## 学习目标

- 为 Paramiko 封装代码编写单元测试。
- 使用 fake client 或 Mock 隔离真实网络。
- 了解本地 SSH Server 集成测试方式。

## 理论导读

SSH 自动化测试不能完全依赖真实服务器。单元测试应 Mock `SSHClient`，验证命令构造、异常处理、结果解析和日志；集成测试可以用本地容器或测试 SSH Server 验证真实连接。

## Mock 示例

```python
from unittest.mock import Mock


def test_exec_success():
    client = Mock()
    stdout = Mock()
    stderr = Mock()
    stdout.channel.recv_exit_status.return_value = 0
    stdout.read.return_value = b"ok"
    stderr.read.return_value = b""
    client.exec_command.return_value = (Mock(), stdout, stderr)

    # 调用你的封装函数，断言输出和调用参数
```

## 测试清单

- 连接成功。
- 认证失败。
- 命令退出码非 0。
- stderr 有内容。
- 超时。
- SFTP 文件不存在。
- 日志脱敏。
- 重试次数。

## 练习

为 `run_command` 编写 5 个单元测试：成功、失败退出码、连接超时、认证失败、stdout 解码异常。

## 验收

- 能用 Mock 测试远程执行封装。
- 能区分单元测试和集成测试。
- 能避免测试依赖生产主机。

## 重点

- 测试自己的封装逻辑，不要试图单元测试 Paramiko 本身。

## 难点

- 真实 SSH 集成测试需要处理端口、密钥、平台差异和清理。

## 易错

> **易错：** 单元测试直接连生产服务器。
>
> 正确做法：单元测试 Mock，集成测试使用隔离测试环境。

