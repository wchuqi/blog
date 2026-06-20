---
title: "Spring Cloud 学习资料：Stream 事件驱动和消息可靠性"
date: 2026-06-20
description: "同步 HTTP 调用适合立即返回结果的场景，但跨服务业务不总是适合同步链路。例如订单创建后发送通知、更新搜索索引、统计报表、发放积分，这些动作不应阻塞主流程。事件驱动通过消息中间件把生产者和消费者解耦，让消费者按自己的节奏处理。"
tags:
  - "框架"
  - "SpringCloud框架"
category: "框架"
---

# Spring Cloud 学习资料：Stream 事件驱动和消息可靠性

[返回索引](../SpringCloud学习资料.md)

## 学习目标

- 理解事件驱动在微服务中的作用：解耦、削峰、异步协作和最终一致性。
- 掌握 Spring Cloud Stream 的 binder、binding、consumer group、partition、DLQ、重试和函数式模型。
- 能设计消息幂等、重复消费、顺序性、死信队列和 outbox 方案。
- 能排查消息堆积、重复消费、消费组配置错误、序列化失败和事件丢失。

## 理论导读

同步 HTTP 调用适合立即返回结果的场景，但跨服务业务不总是适合同步链路。例如订单创建后发送通知、更新搜索索引、统计报表、发放积分，这些动作不应阻塞主流程。事件驱动通过消息中间件把生产者和消费者解耦，让消费者按自己的节奏处理。

Spring Cloud Stream 抽象了消息中间件差异。应用面向 binding 和函数处理消息，底层通过 binder 连接 Kafka、RabbitMQ 等系统。但抽象不等于没有中间件语义：消费组、offset、确认、重试、分区、顺序、死信队列仍然是可靠性核心。

## 核心心智模型

```text
Producer
  -> binding 输出通道
  -> binder
  -> Broker topic/exchange
  -> consumer group
  -> Consumer function
  -> ack / retry / DLQ
```

消息系统的默认现实是：可能重复、可能乱序、可能延迟、可能消费失败。业务必须设计幂等和补偿。

## 知识点详解

### 1. 函数式模型

```java
@Bean
Consumer<OrderCreatedEvent> orderCreatedConsumer() {
    return event -> {
        notificationService.sendOrderCreated(event.orderId(), event.userId());
    };
}
```

配置 binding：

```yaml
spring:
  cloud:
    function:
      definition: orderCreatedConsumer
    stream:
      bindings:
        orderCreatedConsumer-in-0:
          destination: order-events
          group: notification-service
```

`destination` 是 topic/exchange，`group` 是消费组。没有 group 的消费者可能是匿名组，重启和扩容语义会不同。

### 2. 消费组

同一消费组内，一条消息通常只被一个实例处理；不同消费组会各自收到一份消息。典型用法：

```text
order-events
  -> notification-service group
  -> search-index-service group
  -> analytics-service group
```

每个业务消费者用独立 group，避免互相抢消息。

### 3. 幂等

重复消费是常态。幂等方案：

- 事件 ID 去重表。
- 业务唯一约束。
- 状态机判断。
- 幂等键。
- 消费日志。

```sql
CREATE TABLE processed_event (
    event_id VARCHAR(128) PRIMARY KEY,
    processed_at TIMESTAMP NOT NULL
);
```

消费者先插入 `event_id`，插入成功再处理；主键冲突说明已处理。

### 4. 消费确认、重试和重复的真实原因

消息重复并不一定是中间件“出错”。常见原因：

- 消费者处理成功但 ack 前宕机。
- 消费处理超时，被认为失败后重新投递。
- 消费组再均衡期间分区重新分配。
- 人工从 offset 重放。
- DLQ 修复后重新投递。
- 生产者重试导致重复事件。

因此消费者要按“至少一次”语义设计。幂等不是可选项，而是消息消费者的基本契约。

确认策略要清楚：

```text
收到消息
  -> 反序列化
  -> 幂等检查
  -> 执行业务
  -> 提交 offset / ack
```

如果业务执行和 ack 之间失败，消息会重来。如果 ack 太早，业务失败后消息可能丢失。不同 binder 的具体机制不同，但原则一致：业务副作用和确认边界要谨慎。

### 5. outbox 模式

本地事务无法同时覆盖数据库和消息中间件。outbox 解决“业务数据已提交但消息没发”：

1. 订单和 outbox_event 在同一数据库事务提交。
2. 后台发布器扫描未发送事件。
3. 发送到消息中间件。
4. 标记已发送。
5. 消费者幂等处理。

这比“订单创建后直接发消息”更可靠。

### 6. 事件版本和 Schema 演进

事件是跨服务契约，升级要兼容：

- 新增字段默认兼容。
- 删除字段高风险。
- 字段类型变化高风险。
- 枚举新增会让旧消费者反序列化或业务判断失败。
- 事件含义变化必须升级 version。

事件建议包含：

```text
eventId
eventType
eventVersion
occurredAt
producer
traceId
payload
```

消费者应忽略未知字段，并对不支持的 eventVersion 有明确处理策略。

### 7. 重试和 DLQ

消费失败可以重试，但要防止毒消息阻塞队列。常见策略：

- 短暂错误重试。
- 超过次数进入 DLQ。
- DLQ 有告警和人工/自动修复流程。
- 反序列化失败单独处理。

### 8. 顺序性

消息顺序通常只在分区内保证。想保证同一订单事件有序，应使用订单 ID 作为 partition key。但全局顺序成本高，通常不追求。

### 9. 事件设计

事件是跨服务契约：

- 包含 eventId、eventType、version、occurredAt。
- 包含业务主键。
- 不暴露内部 Entity。
- 向后兼容新增字段。
- 避免消费者必须回查过多生产者内部数据。

## 例子：订单事件

```java
public record OrderCreatedEvent(
        String eventId,
        String orderId,
        String userId,
        Instant occurredAt,
        int version) {
}
```

## 练习

1. 订单服务创建订单后写 outbox 表。
2. 发布器把 outbox 事件发送到 `order-events`。
3. 通知服务消费 `OrderCreatedEvent`。
4. 增加 `processed_event` 表实现幂等。
5. 制造消费者异常，观察重试和 DLQ。
6. 新增事件字段，验证旧消费者是否兼容。

## 验收

- 能解释 destination、binder、binding、consumer group。
- 能说明为什么消费者必须幂等。
- 能画出 outbox 方案。
- 能设计 DLQ 处理流程。
- 能说明 ack、业务副作用和重复消费之间的关系。
- 能设计事件版本演进策略。
- 能说明顺序性和分区 key 的关系。

## 重点

- 消息可靠性是业务协议，不只是框架配置。
- 消费组决定消息分发语义。
- outbox + 消费幂等是常见最终一致性组合。

## 难点

- 消息重复、乱序、延迟、重放都会影响业务状态。
- 抽象 binder 不能替代对 Kafka/RabbitMQ 语义的理解。

## 易错

> **易错：** 认为消息队列保证“只消费一次”。
>
> 正确做法：按至少一次投递设计消费者幂等。
