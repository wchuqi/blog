---
title: "Redis学习资料：对象编码、SDS、Dict、Skiplist 和内存分配深度解析"
date: 2026-06-20
description: "Redis 对外提供类型，对内用不同结构实现。对象头保存类型、编码、LRU/LFU 等元信息。SDS 管理字符串，dict 支撑 keyspace 和 Hash/Set，skiplist 支撑大 ZSet 范围查询，listpack 提供紧…"
tags:
  - "工具&中间件"
  - "Redis"
  - "深度解析"
category: "工具&中间件"
---

# Redis学习资料：对象编码、SDS、Dict、Skiplist 和内存分配深度解析

[返回索引](../Redis学习资料.md)

## 学习目标

- 理解 Redis object、type、encoding 和底层结构。
- 掌握 SDS、dict、skiplist、listpack、quicklist 的作用。
- 能解释内存开销和性能差异。

## 理论导读

Redis 对外提供类型，对内用不同结构实现。对象头保存类型、编码、LRU/LFU 等元信息。SDS 管理字符串，dict 支撑 keyspace 和 Hash/Set，skiplist 支撑大 ZSet 范围查询，listpack 提供紧凑存储。编码选择让 Redis 在“小数据省内存”和“大数据高性能”之间切换。

## Redis object

每个 value 通常有对象元数据：

- type：逻辑类型。
- encoding：底层编码。
- lru/lfu 信息。
- refcount 等。

key 名也是字符串对象，不能忽略 key 名内存。

## SDS

SDS 是 Redis 字符串结构，保存长度和容量，避免 C 字符串每次求长度 O(N)，也能安全保存二进制数据。

优势：

- O(1) 获取长度。
- 二进制安全。
- 预分配减少频繁 realloc。

## Dict

Redis keyspace 本质上是字典。dict 也用于 Hash、Set 等结构。dict rehash 可能渐进进行，避免一次性迁移阻塞过久。

## Skiplist

ZSet 大结构通常用 dict + skiplist：

- dict：member -> score，快速查成员。
- skiplist：按 score 排序，支持范围查询。

## 内存分配和碎片

Redis 依赖内存分配器。大量不同大小对象、删除和重写可能产生碎片。`mem_fragmentation_ratio` 只是入口指标，需要结合 RSS、used_memory、allocator 指标判断。

## 练习

1. 用 `OBJECT ENCODING` 观察不同 value 编码。
2. 用 `MEMORY USAGE` 比较短 key 和长 key。
3. 创建不同规模 ZSet，观察内存增长。

## 验收

- 能解释 type 和 encoding 区别。
- 能说明 SDS 为什么比 C 字符串更适合 Redis。
- 能解释 ZSet 使用 dict + skiplist 的原因。

## 重点

- Redis 内存开销不只是业务 value。
- 小对象紧凑编码，大对象通用结构。
- 编码转换会改变内存和性能表现。

## 易错

> **易错：** 估算 Redis 内存时只算 value 字节数。
>
> 正确做法：还要算 key、对象头、底层结构、allocator 开销和碎片。

