---
title: "Redis学习资料：Bitmap、HyperLogLog、Geo 和 Stream"
date: 2026-06-20
description: "Bitmap 本质上是 String 的位操作，适合大量布尔状态。"
tags:
  - "工具&中间件"
  - "Redis"
category: "工具&中间件"
---

# Redis学习资料：Bitmap、HyperLogLog、Geo 和 Stream

[返回索引](../Redis学习资料.md)

## 学习目标

- 掌握 Redis 扩展数据结构的使用场景和边界。
- 能用 Bitmap 做签到和布尔状态，用 HyperLogLog 做近似 UV，用 Geo 做位置查询，用 Stream 做消息。
- 理解这些结构不是万能替代品。

## Bitmap

Bitmap 本质上是 String 的位操作，适合大量布尔状态。

```bash
SETBIT sign:2026-06 user:offset 1
GETBIT sign:2026-06 user:offset
BITCOUNT sign:2026-06
```

适用：签到、活跃标记、权限 bit。

边界：offset 过大导致字符串扩展，内存按最大 offset 占用。

## HyperLogLog

用于基数估算，如 UV 估算。

```bash
PFADD uv:page:1 user1 user2 user3
PFCOUNT uv:page:1
PFMERGE uv:site uv:page:1 uv:page:2
```

特点：占用小，有误差，不能列出元素。

## Geo

Geo 基于经纬度和有序集合实现。

```bash
GEOADD shop:geo 121.4737 31.2304 shop1
GEOSEARCH shop:geo FROMLONLAT 121.47 31.23 BYRADIUS 5 km WITHDIST
```

适用：附近门店、位置范围查询。

边界：不是完整 GIS 系统，不适合复杂地理拓扑。

## Stream

Stream 是 Redis 的日志型消息结构，支持消费组。

```bash
XADD stream:orders * order_id 1 status created
XREAD COUNT 10 STREAMS stream:orders 0
XGROUP CREATE stream:orders group1 $ MKSTREAM
XREADGROUP GROUP group1 consumer1 COUNT 10 STREAMS stream:orders >
XACK stream:orders group1 1670000000000-0
```

核心概念：

- stream entry：消息记录。
- ID：时间戳序号形式。
- consumer group：消费组。
- PEL：pending entries list，已投递未确认消息。

## 练习

1. 用 Bitmap 实现 30 天签到。
2. 用 HyperLogLog 统计 UV，并说明为什么不能精确去重。
3. 用 Stream 创建消费组，模拟消息未 ack 后重新读取。

## 验收

- 能解释 Bitmap 的 offset 风险。
- 能说明 HyperLogLog 是近似统计。
- 能说出 Stream 的 PEL 和 XACK 作用。

## 重点

- Bitmap 节省空间但 offset 决定最大空间。
- HyperLogLog 只能估算基数，不能取明细。
- Stream 比 List 更适合可靠消息，但仍不是 Kafka 的完全替代。

## 易错

> **易错：** 用 HyperLogLog 后还想取出所有用户 ID。
>
> 正确做法：需要明细就用 Set 或外部存储；HLL 只用于近似基数。

