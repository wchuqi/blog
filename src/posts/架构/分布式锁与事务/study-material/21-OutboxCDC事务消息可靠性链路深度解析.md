---
title: "分布式锁与事务学习资料：Outbox/CDC/事务消息可靠性链路深度解析"
date: 2026-06-20
description: "任意环节都可能重复、延迟、乱序或失败。可靠消息方案不是追求“没有重复”，而是保证重复和失败后仍能收敛。"
tags:
  - "架构"
  - "分布式锁与事务"
  - "深度解析"
category: "架构"
---

# 分布式锁与事务学习资料：Outbox/CDC/事务消息可靠性链路深度解析

[返回索引](../分布式锁与事务学习资料.md)

## 学习目标

- 深入理解 Outbox 从写库到消费完成的每个失败点。
- 掌握扫描式发布器、CDC 发布和事务消息的边界。
- 能设计事件顺序、分区键、重试、死信和消费幂等。

## 可靠消息链路

完整链路包含：

```text
业务事务 -> Outbox 事件 -> 发布器/CDC -> Broker -> 消费者 -> Inbox -> 业务状态
```

任意环节都可能重复、延迟、乱序或失败。可靠消息方案不是追求“没有重复”，而是保证重复和失败后仍能收敛。

## 扫描式 Outbox 发布器

并发发布器要避免多个实例同时发布同一事件。常见方式是使用状态抢占：

```sql
UPDATE outbox_event
SET status = 'PUBLISHING',
    updated_at = CURRENT_TIMESTAMP
WHERE id = :event_id
  AND status IN ('NEW', 'RETRY')
  AND next_retry_at <= CURRENT_TIMESTAMP;
```

只有影响行数为 1 的发布器才能发送消息。

发布成功后：

```sql
UPDATE outbox_event
SET status = 'PUBLISHED',
    published_at = CURRENT_TIMESTAMP
WHERE id = :event_id
  AND status = 'PUBLISHING';
```

如果发送成功但更新状态前宕机，事件会再次被发布。因此消费者必须幂等。

## CDC Outbox

CDC 读取数据库 binlog/WAL，把 outbox 表变更投递到消息队列。

优点：

- 避免应用扫描压力。
- 事件发布顺序更接近数据库提交顺序。
- 可以减少发布器代码。

风险：

- CDC 位点丢失或回退会重复投递。
- 表结构变更可能影响解析。
- 跨表事务的事件顺序要仔细设计。
- 消费方仍要幂等。

## 事件顺序和分区键

如果同一订单的事件要求顺序处理，应使用聚合根 ID 作为消息 key：

```text
key = orderId
```

这样同一订单事件进入同一分区，消费者可以按分区顺序处理。但这只能保证同一分区内顺序，不保证跨订单全局顺序。

## 事件版本

事件 payload 建议包含：

```json
{
  "eventId": "e1001",
  "eventType": "OrderPaid",
  "eventVersion": 3,
  "aggregateId": "o1001",
  "aggregateVersion": 7,
  "occurredAt": "2026-06-07T00:00:00Z"
}
```

消费者可以用 `aggregateVersion` 处理乱序：

- 如果版本等于期望版本，处理。
- 如果版本小于已处理版本，丢弃或忽略。
- 如果版本大于期望版本，暂存、拉取当前状态或触发补偿。

## 事务消息的回查边界

事务消息通常流程：

1. 发送半消息。
2. 执行本地事务。
3. 提交或回滚消息。
4. Broker 不确定时回查本地事务状态。

回查接口必须只根据本地持久化状态返回，不要根据内存状态或重新执行业务判断。

## 练习

设计“订单已支付事件”的 Outbox：

- outbox 字段。
- 发布器并发抢占 SQL。
- 消费者 Inbox 表。
- 消息 key。
- 事件版本。
- 死信处理。

## 验收

- 能指出 Outbox 仍会重复发布的场景。
- 能解释 CDC 位点和重复投递风险。
- 能设计同一聚合根的事件顺序保护。

## 易错

> **易错：** 认为 CDC 发布就天然 exactly once。
>
> 正确做法：CDC 也可能重复、回放和乱序，消费者必须用 Inbox、业务唯一键和状态机兜底。

