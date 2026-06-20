---
title: "Redis学习资料：生产容量规划、压测、SLA 和成本治理深度解析"
date: 2026-06-20
description: "Redis 容量规划要同时覆盖内存、CPU、网络、QPS、连接、持久化、复制、故障切换和成本。压测不能只用空 value 的 redis-benchmark，必须尽量模拟真实 value 大小、命令比例、pipeline、连接数、读写比例和…"
tags:
  - "工具&中间件"
  - "Redis"
  - "深度解析"
category: "工具&中间件"
---

# Redis学习资料：生产容量规划、压测、SLA 和成本治理深度解析

[返回索引](../Redis学习资料.md)

## 学习目标

- 建立 Redis 上线前容量规划和压测方法。
- 设计 SLA、错误预算、告警和扩容策略。
- 控制 Redis 成本，避免过度缓存和无治理增长。

## 理论导读

Redis 容量规划要同时覆盖内存、CPU、网络、QPS、连接、持久化、复制、故障切换和成本。压测不能只用空 value 的 redis-benchmark，必须尽量模拟真实 value 大小、命令比例、pipeline、连接数、读写比例和热点分布。

## 容量表

每类 key 记录：

```text
key pattern:
数量:
平均 key 长度:
平均 value 大小:
最大 value:
TTL:
读 QPS:
写 QPS:
是否热点:
是否允许淘汰:
持久化要求:
```

## 内存预留

建议预留：

- 业务数据。
- 元数据和 allocator 开销。
- 内存碎片。
- replication backlog。
- client buffer。
- fork COW。
- AOF rewrite buffer。
- 峰值写入。

## 压测模型

压测要覆盖：

- 真实命令比例。
- value 大小分布。
- key 热点分布。
- pipeline 批量。
- 连接数。
- Cluster 路由。
- 持久化开启状态。
- 故障切换期间行为。

## SLA 和告警

指标：

- P50/P95/P99 延迟。
- 命中率。
- 错误率。
- evicted_keys。
- blocked_clients。
- used_memory 和 RSS。
- replication lag。
- slowlog。
- client output buffer。

## 成本治理

- 删除无用 key。
- 缩短过长 key 名。
- 压缩或拆分 value。
- 冷热分层。
- 本地缓存减少 Redis QPS。
- 按业务拆实例，避免互相污染。
- 定期 keyspace 审计。

## 练习

1. 为一个业务写 Redis 容量表。
2. 用真实 value 大小做压测，而不是只压测小字符串。
3. 设计 P99 延迟告警和扩容阈值。
4. 写 keyspace 成本治理报告。

## 验收

- 能给出上线容量估算。
- 能设计真实压测模型。
- 能定义 Redis SLA 和告警。
- 能说明成本治理措施。

## 易错

> **易错：** 用默认 redis-benchmark 结果代表真实业务容量。
>
> 正确做法：压测必须模拟真实命令、value、热点、连接、pipeline、持久化和故障场景。

