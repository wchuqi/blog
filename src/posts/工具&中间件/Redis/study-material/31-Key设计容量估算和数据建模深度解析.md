---
title: "Redis学习资料：Key 设计、容量估算和数据建模深度解析"
date: 2026-06-20
description: "Redis 数据建模不是“想个 key 名”。key 名长度、数量、TTL、value 大小、访问频率、slot 分布、业务生命周期都会影响成本和稳定性。优秀 key 设计必须能回答：怎么查、怎么删、怎么过期、怎么扩容、怎么定位问题。"
tags:
  - "工具&中间件"
  - "Redis"
  - "深度解析"
category: "工具&中间件"
---

# Redis学习资料：Key 设计、容量估算和数据建模深度解析

[返回索引](../Redis学习资料.md)

## 学习目标

- 设计可扩展、可观测、可治理的 Redis key 模型。
- 能估算 key 数量、内存、QPS、带宽和 TTL 分布。
- 避免 key 过长、无限增长、单 slot 热点和无法清理。

## 理论导读

Redis 数据建模不是“想个 key 名”。key 名长度、数量、TTL、value 大小、访问频率、slot 分布、业务生命周期都会影响成本和稳定性。优秀 key 设计必须能回答：怎么查、怎么删、怎么过期、怎么扩容、怎么定位问题。

## key 命名原则

```text
业务:实体:{id}:属性
product:{100}:detail
user:{42}:session
rank:sales:2026-06-06
```

原则：

- 可读但不过长。
- 层级清楚。
- Cluster 中同槽需求使用 hash tag。
- 避免把所有 key 放同一 tag。
- 避免 key 名包含不可控原始输入。

## 容量估算

估算维度：

```text
key_count = 用户数 * 每用户 key 数
avg_key_size = key 名长度 + value + 元数据 + allocator 开销
memory = key_count * avg_key_size * 碎片系数
bandwidth = QPS * 平均响应大小
```

还要预留：

- fork COW。
- replication backlog。
- client buffer。
- AOF rewrite。
- 内存碎片。

## TTL 分布

同一时间大量 key 过期会引发雪崩。TTL 应加入随机扰动：

```text
ttl = base_ttl + random(0, jitter)
```

长期 key 和短期缓存 key 最好实例隔离，避免淘汰互相影响。

## key 生命周期设计

每类 key 应写清：

- 创建时机。
- 更新时机。
- 过期时机。
- 删除方式。
- 最大数量。
- 最大 value。
- 是否允许淘汰。
- 是否需要备份。

## 练习

1. 为电商商品、用户会话、排行榜、限流分别写 key 设计表。
2. 估算 1000 万用户会话的内存。
3. 设计 TTL 随机化范围。

## 验收

- 能输出 key 设计表。
- 能做粗略容量估算。
- 能说明哪些 key 需要实例隔离。

## 重点

- key 模型决定 Redis 稳定性。
- 容量估算必须包含元数据和峰值。
- Cluster hash tag 要克制使用。

## 易错

> **易错：** 只估算 value 大小，不估算 key 名、对象头和碎片。
>
> 正确做法：用 `MEMORY USAGE` 抽样校准估算模型。

