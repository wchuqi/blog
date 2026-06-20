---
title: "分布式锁与事务学习资料：可靠消息、Outbox/Inbox 和事务消息"
date: 2026-06-20
description: "跨服务最终一致经常依赖消息。核心难题是：业务数据库提交和消息发送不是同一个原子操作。如果先写库再发消息，发消息前宕机会丢事件；如果先发消息再写库，消费者可能看到不存在或未提交的业务状态。"
tags:
  - "架构"
  - "分布式锁与事务"
category: "架构"
---

# 分布式锁与事务学习资料：可靠消息、Outbox/Inbox 和事务消息

[返回索引](../分布式锁与事务学习资料.md)

## 学习目标

- 理解本地事务和消息发送之间的原子性问题。
- 掌握 Outbox、Inbox、事务消息和 CDC 的适用场景。
- 能设计消息重复、丢失、乱序和积压的恢复机制。

## 理论导读

跨服务最终一致经常依赖消息。核心难题是：业务数据库提交和消息发送不是同一个原子操作。如果先写库再发消息，发消息前宕机会丢事件；如果先发消息再写库，消费者可能看到不存在或未提交的业务状态。

Outbox 模式把业务数据和待发布事件写入同一个本地事务，然后由发布器或 CDC 异步投递消息。Inbox 模式在消费者侧记录已处理消息，保证重复投递不会重复执行业务。

## Outbox 表

```sql
CREATE TABLE outbox_event (
  id VARCHAR(64) PRIMARY KEY,
  aggregate_type VARCHAR(64) NOT NULL,
  aggregate_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  event_version INT NOT NULL,
  payload TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  retry_count INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL,
  published_at TIMESTAMP NULL
);
```

业务事务：

```sql
BEGIN;

UPDATE orders
SET status = 'PAID'
WHERE id = 'o1001'
  AND status = 'CREATED';

INSERT INTO outbox_event(...)
VALUES (..., 'OrderPaid', ..., 'NEW', ...);

COMMIT;
```

## 发布器规则

1. 扫描 `NEW` 或到达重试时间的事件。
2. 投递消息队列。
3. 投递成功后标记 `PUBLISHED`。
4. 投递失败后增加重试次数并退避。
5. 超过阈值进入 `FAILED` 并告警。
6. 消费者仍必须幂等，因为“消息已发出但标记 PUBLISHED 前宕机”会导致重复投递。

## Inbox 去重

消费者在同一个本地事务中写入处理记录和业务状态：

```sql
BEGIN;

INSERT INTO inbox_message(message_id, consumer, processed_at)
VALUES ('m1001', 'benefit-service', CURRENT_TIMESTAMP);

UPDATE user_benefit
SET status = 'ACTIVE'
WHERE order_id = 'o1001'
  AND status <> 'ACTIVE';

COMMIT;
```

如果 `message_id + consumer` 唯一冲突，说明已处理过，直接返回成功。

## 事务消息

一些消息队列提供事务消息：

1. 发送半消息。
2. 执行本地事务。
3. 根据本地事务结果提交或回滚消息。
4. Broker 未收到确认时回查本地事务状态。

事务消息能降低 Outbox 发布器开发成本，但业务仍要实现本地事务状态查询和消费幂等。

## 练习

为“支付成功后开通会员”设计可靠消息：

- 支付服务如何记录支付成功和 Outbox 事件。
- 会员服务如何用 Inbox 去重。
- 消息重复、乱序、积压如何处理。
- 会员开通失败如何重试和告警。

## 验收

- 能解释写库和发消息的双写问题。
- 能画出 Outbox 发布器和 Inbox 消费者流程。
- 能说明事务消息仍然需要幂等消费。

## 重点

- Outbox 解决“业务状态和事件记录原子写入”，不保证消息只投递一次。
- Inbox 和业务状态机解决重复消费。

## 易错

> **易错：** 以为消息队列开启 exactly once 后业务就不用幂等。
>
> 正确做法：业务消费方必须按至少一次投递设计，使用消息 ID、业务唯一键和状态机兜底。

