---
title: "分布式系统学习资料：分布式事务、可靠消息和 Exactly Once 深度推演"
date: 2026-06-20
description: "分布式事务难在多个系统分别拥有自己的提交点。数据库提交、消息发送、消息确认、外部接口调用、缓存更新都不是一个原子动作。所谓 Exactly Once，如果脱离端到端业务状态和幂等设计，往往只是局部语义。"
tags:
  - "架构"
  - "分布式系统"
category: "架构"
---

# 分布式系统学习资料：分布式事务、可靠消息和 Exactly Once 深度推演

[返回索引](../分布式系统学习资料.md)

## 学习目标

- 理解“精确一次”通常是端到端业务效果，而不是消息系统单点承诺。
- 能设计 Outbox、Inbox、幂等消费、状态机和对账。
- 能推演事务、消息和外部副作用之间的失败窗口。

## 理论导读

分布式事务难在多个系统分别拥有自己的提交点。数据库提交、消息发送、消息确认、外部接口调用、缓存更新都不是一个原子动作。所谓 Exactly Once，如果脱离端到端业务状态和幂等设计，往往只是局部语义。

## 失败窗口推演

### 本地事务 + 发送消息

```text
BEGIN
  写订单
COMMIT
发送 OrderCreated 消息
```

失败窗口：

- COMMIT 成功，发送消息前进程崩溃：订单存在，但事件丢失。
- 发送消息成功，返回前超时：不确定是否发出，重发可能重复。

### 先发送消息 + 后写库

```text
发送 OrderCreated 消息
BEGIN
  写订单
COMMIT
```

失败窗口：

- 消息已发出，但订单事务失败：消费者看到不存在的订单。

因此需要 Outbox。

## Outbox + Inbox 模式

### Outbox

生产者在同一个本地事务中写业务表和 outbox 表。

```sql
BEGIN;
INSERT INTO orders(id, status) VALUES ('o1', 'CREATED');
INSERT INTO outbox(event_id, aggregate_id, event_type, payload, status)
VALUES ('e1', 'o1', 'OrderCreated', '{...}', 'NEW');
COMMIT;
```

发布器扫描 `NEW` 事件，发布到 MQ，成功后标记 `PUBLISHED`。即使发布器崩溃，也能重新扫描。

### Inbox

消费者处理消息时，在本地事务中写消费记录和业务结果。

```sql
BEGIN;
INSERT INTO inbox(event_id, consumer_name) VALUES ('e1', 'InventoryService');
UPDATE inventory SET reserved = reserved + 1 WHERE sku_id = 's1';
COMMIT;
```

如果 `event_id` 已存在，说明处理过，直接确认消息。

## Exactly Once 的分层理解

| 层次 | 是否容易做到 | 说明 |
| --- | --- | --- |
| 消息不重复投递 | 很难 | 网络超时和确认丢失会导致重复 |
| 消费代码只执行一次 | 很难 | 消费成功但 ack 失败会重放 |
| 业务结果只生效一次 | 可做到 | 靠幂等键、唯一约束、条件更新和事务 |
| 外部副作用只发生一次 | 最难 | 第三方接口必须支持幂等或查询 |

面试中说 Exactly Once，最好表达为：“我追求端到端 exactly-once effect，而不是假设消息永不重复。”

## Saga 状态机

Saga 不应该只画流程箭头，还要定义状态机。

```text
CREATED
  -> INVENTORY_RESERVED
  -> PAYMENT_PENDING
  -> PAID
  -> FULFILLED

CREATED
  -> INVENTORY_FAILED
  -> CANCELLED

PAYMENT_PENDING
  -> PAYMENT_FAILED
  -> INVENTORY_RELEASED
  -> CANCELLED
```

每个状态转换要定义：

- 触发事件。
- 前置状态。
- 幂等键。
- 失败重试规则。
- 补偿动作。
- 超时扫描规则。

## 外部副作用处理

发送短信、扣款、发券、调用第三方 API 都是外部副作用。处理原则：

- 优先选择支持幂等键的外部接口。
- 如果外部接口超时，先查询外部状态。
- 本地记录外部请求流水。
- 重试前检查本地和外部状态。
- 对不可确认状态进入人工对账。

## 深度场景：支付成功但订单更新失败

流程：

1. 支付服务收到第三方支付成功回调。
2. 支付流水表写入成功。
3. 发布 PaymentSucceeded 事件。
4. 订单服务消费事件时数据库超时。

正确设计：

- 回调以第三方流水号幂等。
- PaymentSucceeded 通过 Outbox 发布。
- 订单服务消费端用 eventId 去重。
- 订单状态更新使用条件更新：只有 WAITING_PAYMENT 可变为 PAID。
- 消费失败不提交 offset，或进入重试队列。
- 长时间未更新的支付成功订单由对账任务补偿。

## 练习

设计“发放会员权益”的可靠流程：

1. 支付成功事件可能重复。
2. 权益服务数据库可能超时。
3. 第三方短信通知可能超时。
4. 用户刷新页面必须看到权益是否到账。

写出状态机、幂等键、Outbox/Inbox 表和对账规则。

## 验收

- 能列出事务和消息之间的失败窗口。
- 能说明 Outbox 和 Inbox 各自解决的问题。
- 能解释 Exactly Once effect 的端到端含义。
- 能为 Saga 定义状态机和补偿规则。

## 重点

- 可靠消息依赖本地事务表、扫描发布、消费幂等和对账。
- 精确一次的关键是业务结果幂等，不是消息只到一次。
- 补偿流程必须可重试、可观测、可人工接管。

## 难点

- 外部副作用无法被本地事务回滚。
- 消费确认和本地事务提交之间总有失败窗口，只能靠幂等收敛。

## 易错

> **易错：** 开启 MQ 的 exactly-once 配置后，业务就不需要幂等。
>
> 正确做法：即使 MQ 提供事务或幂等生产者，消费端业务状态仍必须防重和可恢复。
