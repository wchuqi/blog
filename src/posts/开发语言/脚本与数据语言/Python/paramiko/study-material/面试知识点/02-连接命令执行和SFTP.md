---
title: "Paramiko面试知识点：连接、命令执行和 SFTP"
date: 2026-06-20
description: "SSHClient 是高级客户端封装；Transport 表示底层 SSH 连接和协议层；Channel 是同一 Transport 上的逻辑通道，用于执行命令、交互 shell 或端口转发。"
tags:
  - "开发语言"
  - "paramiko"
  - "面试"
category: "开发语言"
---

# Paramiko面试知识点：连接、命令执行和 SFTP

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../Paramiko学习资料.md)

## 一、连接、命令执行和 SFTP

### 1. `SSHClient`、`Transport`、`Channel` 有什么关系？

**参考答案：**

`SSHClient` 是高级客户端封装；`Transport` 表示底层 SSH 连接和协议层；`Channel` 是同一 Transport 上的逻辑通道，用于执行命令、交互 shell 或端口转发。

> **重点：** 一个 Transport 可以承载多个 Channel。

### 2. `exec_command` 如何判断命令是否成功？

**参考答案：**

不能只看 stdout，必须读取退出码，通常用 `stdout.channel.recv_exit_status()`。同时要收集 stdout 和 stderr，用于结果和排障。

> **易错：** stdout 有内容不代表命令成功。

### 3. 远程命令环境和手工登录有什么差异？

**参考答案：**

`exec_command` 通常不是交互式登录 shell，环境变量、PATH、alias、profile 加载可能不同。生产脚本应使用绝对路径或显式设置环境。

> **难点：** 很多“手工能执行、脚本不能执行”的问题来自环境差异。

### 4. SFTP 可靠上传应该怎么做？

**参考答案：**

先上传到临时文件，校验大小或哈希，再原子 rename 到目标路径。必要时备份旧文件，并提供回滚策略。

> **重点：** 不要直接覆盖生产配置。

