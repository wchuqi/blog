---
title: "Redis学习资料：内存分配器、碎片、active defrag 和 RSS 深度解析"
date: 2026-06-20
description: "Redis 内存不是一个数字。usedmemory 是 Redis 认为自己分配的内存，RSS 是操作系统看到的常驻内存。内存分配器可能保留空闲页，碎片会让 RSS 远大于 usedmemory。fork、COW、AOF rewrite 和…"
tags:
  - "工具&中间件"
  - "Redis"
  - "深度解析"
category: "工具&中间件"
---

# Redis学习资料：内存分配器、碎片、active defrag 和 RSS 深度解析

[返回索引](../Redis学习资料.md)

## 学习目标

- 区分 used_memory、RSS、allocator active/resident 和碎片。
- 理解内存碎片形成原因和 active defrag 的边界。
- 能分析 Redis 内存告警。

## 理论导读

Redis 内存不是一个数字。used_memory 是 Redis 认为自己分配的内存，RSS 是操作系统看到的常驻内存。内存分配器可能保留空闲页，碎片会让 RSS 远大于 used_memory。fork、COW、AOF rewrite 和大 key 删除也会改变 RSS。

## 指标层级

```bash
INFO memory
MEMORY STATS
```

关注：

- used_memory。
- used_memory_rss。
- mem_fragmentation_ratio。
- allocator_allocated。
- allocator_active。
- allocator_resident。

不同版本字段可能不同，重点是理解层级。

## 碎片来源

- 不同大小对象频繁创建删除。
- 大 key 删除。
- listpack/hashtable 编码转换。
- allocator 保留页。
- fork COW 后 RSS 变化。

## active defrag

active defrag 尝试主动整理碎片，降低 RSS。但它会消耗 CPU，也不是所有碎片都能回收。是否开启要结合延迟和内存压力测试。

## 排查判断

```text
used_memory 高：业务数据或缓冲多。
RSS 高 used_memory 低：碎片或 allocator 保留。
fork 时 RSS/COW 高：持久化和写入峰值。
client buffer 高：慢客户端或大响应。
```

## 练习

1. 创建删除大量不同大小 key，观察碎片。
2. 比较 big key 删除前后 RSS。
3. 开启 active defrag 前后观察 CPU 和 RSS。

## 验收

- 能解释 used_memory 和 RSS 区别。
- 能说明碎片不是一定能立刻释放给 OS。
- 能评估 active defrag 的收益和代价。

## 易错

> **易错：** mem_fragmentation_ratio 高就直接重启。
>
> 正确做法：先判断是否真实碎片、是否客户端缓冲、是否 fork 影响，再选择 defrag、迁移、重启或扩容。

