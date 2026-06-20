---
title: "Paramiko学习资料：Paramiko完整知识点清单"
date: 2026-06-20
description: "SFTP 文件传输。"
tags:
  - "开发语言"
  - "paramiko"
  - "知识清单"
category: "开发语言"
---

# Paramiko学习资料：Paramiko完整知识点清单

[返回索引](../Paramiko学习资料.md)

## 1. 基础定位

- SSHv2。
- 远程命令执行。
- SFTP 文件传输。
- 跳板机和端口转发。
- 与 Fabric、Ansible、AsyncSSH 的边界。

## 2. 安装和连接

- `pip install paramiko`。
- `SSHClient`。
- `load_system_host_keys`。
- `connect` 参数。
- 连接、banner、认证、命令超时。
- 资源关闭。

## 3. SSH 安全模型

- Host Key。
- known_hosts。
- MissingHostKeyPolicy。
- 密码认证。
- 私钥认证。
- SSH Agent。
- 凭据管理。

## 4. 架构对象

- SSHClient。
- Transport。
- Channel。
- SFTPClient。
- ProxyCommand。
- direct-tcpip。

## 5. 命令执行

- `exec_command`。
- stdout、stderr。
- `recv_exit_status`。
- 非交互 shell。
- sudo 和伪终端。
- 命令注入风险。

## 6. SFTP

- 上传下载。
- 远程文件属性。
- 目录操作。
- 临时文件和原子 rename。
- 权限和磁盘错误。

## 7. 跳板机和网络

- 堡垒机。
- ProxyCommand。
- sock 参数。
- 端口转发。
- 多跳排障。

## 8. 可靠性

- 超时。
- 重试。
- 幂等。
- 结果结构。
- 错误分类。
- 批量执行。

## 9. 并发和性能

- 线程池。
- 最大并发。
- 分批执行。
- 连接复用边界。
- 堡垒机和远程主机压力。

## 10. 日志和排障

- Paramiko debug 日志。
- 结构化日志。
- 日志脱敏。
- 连接、认证、命令、SFTP 分层排障。

## 11. 测试和生产

- Mock SSHClient。
- 本地 SSH 集成测试。
- 审计。
- 最小权限。
- dry-run。
- 回滚策略。

## 自检

- 是否能解释 Host Key 校验？
- 是否能安全执行远程命令并检查退出码？
- 是否能用 SFTP 做可靠上传？
- 是否能通过跳板机连接内网主机？
- 是否能为批量执行设计超时、重试和并发？
- 是否能保证日志不泄露凭据？

