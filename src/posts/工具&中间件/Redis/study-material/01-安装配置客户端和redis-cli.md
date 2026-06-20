---
title: "Redis学习资料：安装、配置、客户端和 redis-cli"
date: 2026-06-20
description: "Redis 服务端由配置决定监听地址、端口、持久化、内存限制、安全和高可用行为。redis-cli 是学习和排障入口，但生产排障不能随意使用高风险命令。客户端连接 Redis 时还要考虑连接池、超时、重试、序列化和拓扑感知。"
tags:
  - "工具&中间件"
  - "Redis"
category: "工具&中间件"
---

# Redis学习资料：安装、配置、客户端和 redis-cli

[返回索引](../Redis学习资料.md)

## 学习目标

- 能启动 Redis、连接 Redis、查看配置和运行状态。
- 掌握 redis-cli、配置文件、客户端连接和基础安全配置。
- 理解本地实验环境和生产环境的差异。

## 理论导读

Redis 服务端由配置决定监听地址、端口、持久化、内存限制、安全和高可用行为。redis-cli 是学习和排障入口，但生产排障不能随意使用高风险命令。客户端连接 Redis 时还要考虑连接池、超时、重试、序列化和拓扑感知。

## 快速启动

Docker 实验：

```bash
docker run --name redis-lab -p 6379:6379 -d redis:7
docker exec -it redis-lab redis-cli
```

本机连接：

```bash
redis-cli -h 127.0.0.1 -p 6379 PING
```

## redis-cli 常用方式

```bash
redis-cli INFO server
redis-cli INFO memory
redis-cli CONFIG GET maxmemory
redis-cli CLIENT LIST
redis-cli SLOWLOG GET 10
redis-cli --scan --pattern 'user:*'
```

高风险：

- `KEYS *`：会阻塞扫描整个 keyspace。
- `MONITOR`：输出所有命令，生产高流量下风险大。
- `FLUSHALL`、`FLUSHDB`：破坏性清空。
- `CONFIG SET`：可能改变生产行为。

## 配置核心项

```conf
bind 127.0.0.1
port 6379
protected-mode yes
requirepass strong-password
maxmemory 4gb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
```

生产中应通过配置管理系统或部署平台管理，不建议临时手改后忘记持久化。

## 客户端连接关注点

- 连接池大小。
- 连接超时和读写超时。
- 重试策略和幂等性。
- 序列化格式。
- Cluster/Sentinel 拓扑发现。
- pipeline 和批量命令。
- 慢命令隔离。

## 练习

1. 启动 Redis，使用 redis-cli 执行 `PING`、`INFO`、`CONFIG GET`。
2. 设置密码并验证未认证连接被拒绝。
3. 用 `--scan` 替代 `KEYS` 扫描匹配 key。

## 验收

- 能启动并连接 Redis。
- 能查看内存、客户端、慢查询信息。
- 能列出至少 5 个生产 redis-cli 高风险命令。

## 重点

- 实验可以方便，生产必须安全配置。
- 客户端超时和连接池设置会直接影响 Redis 稳定性。
- 排障命令本身也可能制造故障。

## 易错

> **易错：** 生产执行 `KEYS *` 查 key。
>
> 正确做法：用 `SCAN` 增量扫描，并控制每次 count 和业务低峰执行。

