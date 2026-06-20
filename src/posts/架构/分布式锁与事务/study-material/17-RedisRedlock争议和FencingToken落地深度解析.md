---
title: "分布式锁与事务学习资料：Redis Redlock 争议和 fencing token 落地深度解析"
date: 2026-06-20
description: "单实例 Redis 锁的最小正确写法："
tags:
  - "架构"
  - "分布式锁与事务"
  - "深度解析"
category: "架构"
---

# 分布式锁与事务学习资料：Redis Redlock 争议和 fencing token 落地深度解析

[返回索引](../分布式锁与事务学习资料.md)

## 学习目标

- 说清 Redis 单实例锁、主从锁、Redlock 分别解决和没解决什么。
- 理解 Redlock 争议的本质：时间假设和下游保护缺失。
- 能设计一套可落地的 Redis 锁 + fencing token + 状态机方案。

## Redis 单实例锁的边界

单实例 Redis 锁的最小正确写法：

```bash
SET lock:order:o1001 request-id NX PX 30000
```

释放锁必须校验 value：

```lua
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
```

这只能解决两个问题：

- 获取锁和设置 TTL 原子化。
- 避免旧客户端释放掉新客户端的锁。

它没有解决：

- Redis 宕机后锁丢失。
- 主从切换导致锁未复制。
- 客户端暂停超过 TTL。
- 下游资源接受旧请求。

## Redlock 的机制

Redlock 大致流程：

1. 准备 N 个互相独立的 Redis master。
2. 客户端按顺序向每个节点尝试 `SET NX PX`。
3. 如果在多数节点成功，并且总耗时小于租约有效时间，则认为获取锁成功。
4. 有效时间要扣除获取锁耗时和时钟漂移预算。
5. 释放时向所有节点释放。

它试图解决单 Redis 节点故障和主从异步复制的问题，但仍依赖时间窗口。只要系统允许进程任意长暂停，客户端就可能在租约过期后继续执行。

## Redlock 争议如何表达

面试中不要简单说“Redlock 不安全”或“Redlock 安全”。更准确的表达是：

- 如果业务只是降低重复执行概率，Redlock 可以作为工程折中。
- 如果业务要求强互斥写入，Redlock 本身不足以作为最终正确性保证。
- 在异步网络、进程暂停和时钟漂移模型下，基于租约的锁都需要下游 fencing token。

> **重点：** Redlock 的争议不是命令写法问题，而是它是否能在强故障模型下提供线性一致互斥。

## fencing token 落地方案

### 表结构

```sql
CREATE TABLE order_guard (
  order_id VARCHAR(64) PRIMARY KEY,
  last_token BIGINT NOT NULL,
  owner VARCHAR(128),
  updated_at TIMESTAMP NOT NULL
);
```

### 获取锁和 token

```text
1. SET lock:order:o1001 requestId NX PX 30000
2. 成功后 INCR lock:order:o1001:token 得到 token
3. 执行业务写入时携带 token
```

### 下游校验

```sql
UPDATE order_guard
SET last_token = :token,
    owner = :request_id,
    updated_at = CURRENT_TIMESTAMP
WHERE order_id = :order_id
  AND last_token < :token;
```

如果这一步失败，后续业务不能继续。

## token 生成顺序的细节

如果先 `INCR` 再拿锁，会产生大量跳号，但通常可以接受，因为 token 只要求单调，不要求连续。如果先拿锁再 `INCR`，要考虑拿锁成功但 `INCR` 失败的处理。实践中更重要的是下游必须存储最大 token。

## 与数据库 version 的关系

fencing token 和乐观锁 version 类似，但来源不同：

- version 通常由资源自身递增，用于防并发覆盖。
- fencing token 由协调服务发放，用于标识执行权新旧。
- 高风险场景可以两者同时使用：`WHERE status=? AND version=? AND last_token < ?`。

## 练习

设计“同一订单关闭任务”的 Redis 锁方案：

- key：`lock:order-close:{orderId}`。
- requestId：UUID。
- token：`INCR lock:order-close:{orderId}:token`。
- 订单更新 SQL：必须包含状态条件和 token 条件。
- 重复执行：如果订单已支付或已关闭，任务返回成功但不修改。

## 验收

- 能说清 Redis 锁基础写法解决了什么。
- 能说清 Redlock 仍需要业务兜底的原因。
- 能写出 token 表结构和下游拒绝旧请求 SQL。

## 易错

> **易错：** 生成了 token，但只写在日志里。
>
> 正确做法：token 必须参与下游数据更新条件，否则无法阻止旧请求。

