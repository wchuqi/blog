---
title: "Redis学习资料：发布订阅、Stream 和消息队列"
date: 2026-06-20
description: "Redis 可以做消息，但不同机制语义差异很大。Pub/Sub 是实时广播，订阅者不在线就收不到；List 可以做简单阻塞队列，但缺少完善消费确认；Stream 支持持久化日志、消费组、ack 和 pending 管理，更适合可靠消息。但…"
tags:
  - "工具&中间件"
  - "Redis"
category: "工具&中间件"
---

# Redis学习资料：发布订阅、Stream 和消息队列

[返回索引](../Redis学习资料.md)

## 学习目标

- 区分 Pub/Sub、List 队列、Stream 消费组。
- 理解可靠性、持久化、确认、重试和堆积。
- 能判断 Redis 消息能力的适用边界。

## 理论导读

Redis 可以做消息，但不同机制语义差异很大。Pub/Sub 是实时广播，订阅者不在线就收不到；List 可以做简单阻塞队列，但缺少完善消费确认；Stream 支持持久化日志、消费组、ack 和 pending 管理，更适合可靠消息。但 Redis Stream 仍不是 Kafka/RabbitMQ 的完全替代，需要评估堆积、重放、分区和运维能力。

## Pub/Sub

```bash
SUBSCRIBE news
PUBLISH news "hello"
```

特点：

- 实时推送。
- 不保存历史。
- 消费者离线丢消息。
- 适合通知和广播，不适合可靠任务队列。

## List 队列

```bash
LPUSH queue:email job1
BRPOP queue:email 10
```

优点简单。问题是消费者取出后崩溃，消息可能丢失。可用 `BRPOPLPUSH` 或 `LMOVE` 做处理中队列，但复杂度上升。

## Stream 消费组

```bash
XADD orders * order_id 1
XGROUP CREATE orders g1 $ MKSTREAM
XREADGROUP GROUP g1 c1 COUNT 10 BLOCK 5000 STREAMS orders >
XACK orders g1 1670000000000-0
XPENDING orders g1
```

关键：

- `>` 读取未投递给该组的新消息。
- PEL 保存已投递未确认消息。
- `XACK` 确认处理完成。
- `XAUTOCLAIM` 可转移长时间未确认消息。

## 队列设计问题

- 消费幂等：同一消息可能重复处理。
- 死信处理：多次失败怎么办。
- 堆积监控：stream 长度、lag、pending。
- 裁剪策略：`XTRIM` 控制长度。
- 大消息：不要把大 payload 直接塞 Redis。

## 练习

1. 用 Pub/Sub 验证离线丢消息。
2. 用 List 实现简单任务队列。
3. 用 Stream 消费组模拟消费者崩溃和 pending 重领。

## 验收

- 能说明 Pub/Sub、List、Stream 的可靠性差异。
- 能解释 PEL、XACK、XAUTOCLAIM。
- 能设计消息幂等处理。

## 重点

- Redis 做消息要先选语义，不是所有队列都一样。
- Stream 有 ack，但仍要处理重复消费。
- 队列堆积会占用 Redis 内存。

## 易错

> **易错：** 用 Pub/Sub 做订单可靠通知。
>
> 正确做法：可靠任务用 Stream 或专业 MQ，并设计 ack、重试、幂等和死信。

