---
title: "Redis学习资料：事务、Lua 和原子性"
date: 2026-06-20
description: "Redis 单条命令在服务端执行期间不会被其他命令插入，因此单命令原子。MULTI/EXEC 可以把多个命令排队后一次执行，但不提供关系型数据库那种回滚。Lua 脚本在 Redis 中原子执行，适合把“读、判断、写”合并成不可打断的逻辑，但…"
tags:
  - "工具&中间件"
  - "Redis"
category: "工具&中间件"
---

# Redis学习资料：事务、Lua 和原子性

[返回索引](../Redis学习资料.md)

## 学习目标

- 理解 Redis 单命令原子性、MULTI/EXEC 事务和 Lua 脚本的差异。
- 掌握 WATCH 乐观锁。
- 能用 Lua 实现检查再修改的原子逻辑。

## 理论导读

Redis 单条命令在服务端执行期间不会被其他命令插入，因此单命令原子。MULTI/EXEC 可以把多个命令排队后一次执行，但不提供关系型数据库那种回滚。Lua 脚本在 Redis 中原子执行，适合把“读、判断、写”合并成不可打断的逻辑，但脚本执行时间过长会阻塞其他请求。

## MULTI/EXEC

```bash
MULTI
INCR account:1
INCR account:2
EXEC
```

事务中的命令先入队，EXEC 时按顺序执行。某些运行时错误不会回滚前面已执行命令。

## WATCH

```bash
WATCH stock:100
GET stock:100
MULTI
DECR stock:100
EXEC
```

WATCH 监控 key 是否被其他客户端修改，若被修改，EXEC 返回空，需要客户端重试。

## Lua

```bash
EVAL "local v=redis.call('GET', KEYS[1]); if not v then return 0 end; return redis.call('DEL', KEYS[1])" 1 lock:key
```

Lua 适合：

- 分布式锁释放：校验 value 后删除。
- 限流：读取、计算、写入 TTL。
- 秒杀库存：检查库存再扣减。

## 原子性边界

- Lua 脚本原子，但不应执行耗时循环。
- Redis 事务没有自动回滚。
- Cluster 中 Lua 或多 key 操作通常要求 key 在同一个 slot，可用 hash tag。
- 原子不等于持久化成功，也不等于复制到从节点成功。

## 练习

1. 用 MULTI/EXEC 实现两个计数器同时加一。
2. 用 WATCH 实现库存扣减重试。
3. 用 Lua 实现“value 匹配才删除”的锁释放。

## 验收

- 能说明 Redis 事务和数据库事务的差异。
- 能解释 WATCH 是乐观锁。
- 能写简单 Lua 原子脚本。

## 重点

- 单命令原子，多命令不自动原子。
- Lua 能保证脚本内原子，但长脚本会阻塞 Redis。
- 事务不回滚是面试高频点。

## 易错

> **易错：** 认为 MULTI/EXEC 中某条命令失败会像数据库事务一样回滚。
>
> 正确做法：理解 Redis 事务是顺序执行队列，不是完整 ACID 事务。

