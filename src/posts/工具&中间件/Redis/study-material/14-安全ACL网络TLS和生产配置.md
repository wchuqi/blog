---
title: "Redis学习资料：安全、ACL、网络、TLS 和生产配置"
date: 2026-06-20
description: "Redis 默认不应该暴露到公网。安全防线应包括网络隔离、认证授权、最小权限、TLS、危险命令管控、审计和备份保护。密码只是其中一层，不能替代网络和权限治理。"
tags:
  - "工具&中间件"
  - "Redis"
category: "工具&中间件"
---

# Redis学习资料：安全、ACL、网络、TLS 和生产配置

[返回索引](../Redis学习资料.md)

## 学习目标

- 掌握 Redis 基础安全配置。
- 理解 ACL、网络隔离、TLS、危险命令管理。
- 能写生产安全检查清单。

## 理论导读

Redis 默认不应该暴露到公网。安全防线应包括网络隔离、认证授权、最小权限、TLS、危险命令管控、审计和备份保护。密码只是其中一层，不能替代网络和权限治理。

## 网络隔离

```conf
bind 127.0.0.1 10.0.0.10
protected-mode yes
port 6379
```

生产 Redis 应只允许应用所在网络访问，配合防火墙、安全组或 Kubernetes NetworkPolicy。

## 认证和 ACL

Redis ACL 可限制用户可执行命令和可访问 key pattern。

示意：

```bash
ACL SETUSER app on >strongpass ~app:* +@read +@write -FLUSHALL -CONFIG
ACL LIST
```

不同版本 ACL 细节可能不同，生产需以目标版本文档为准。

## 危险命令

高风险命令：

- `FLUSHALL`、`FLUSHDB`
- `CONFIG`
- `KEYS`
- `MONITOR`
- `EVAL`，视业务而定
- `DEBUG`
- `SHUTDOWN`

可以通过 ACL 限制。

## TLS

跨不可信网络传输应启用 TLS 或通过安全隧道。否则认证信息和数据可能被窃听。TLS 会带来一定 CPU 开销，需要压测。

## 生产配置关注

- `maxmemory` 和淘汰策略。
- 持久化策略。
- 客户端输出缓冲限制。
- 慢查询阈值。
- 日志级别。
- protected-mode。
- rename-command 或 ACL。

## 练习

1. 创建只允许访问 `app:*` 的用户。
2. 禁止应用用户执行 `FLUSHALL`。
3. 尝试未认证访问，验证失败。

## 验收

- 能列出 Redis 暴露公网的风险。
- 能说明 ACL 的最小权限原则。
- 能给生产实例写安全配置清单。

## 重点

- Redis 安全第一层是网络隔离。
- 应用账号不应有管理权限。
- 备份文件也包含敏感数据。

## 易错

> **易错：** 设置密码后把 Redis 开到公网。
>
> 正确做法：网络隔离、认证授权、TLS、危险命令限制和监控一起做。

