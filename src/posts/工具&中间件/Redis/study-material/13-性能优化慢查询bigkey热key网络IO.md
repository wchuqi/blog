---
title: "Redis学习资料：性能优化、慢查询、big key、hot key 和网络 IO"
date: 2026-06-20
description: "Redis 快是因为内存操作、事件循环、数据结构优化和避免锁竞争。但单个命令执行时间长、返回数据大、key 过大、客户端慢、网络包多、AOF rewrite、fork COW 都可能造成延迟。性能优化要从命令复杂度、数据大小、客户端、网络、…"
tags:
  - "工具&中间件"
  - "Redis"
category: "工具&中间件"
---

# Redis学习资料：性能优化、慢查询、big key、hot key 和网络 IO

[返回索引](../Redis学习资料.md)

## 学习目标

- 掌握 Redis 性能瓶颈来源。
- 能定位慢命令、big key、hot key、客户端输出缓冲和网络问题。
- 理解 pipeline、批量命令和连接池的取舍。

## 理论导读

Redis 快是因为内存操作、事件循环、数据结构优化和避免锁竞争。但单个命令执行时间长、返回数据大、key 过大、客户端慢、网络包多、AOF rewrite、fork COW 都可能造成延迟。性能优化要从命令复杂度、数据大小、客户端、网络、持久化、内存六层排查。

## 慢查询

```bash
SLOWLOG GET 10
CONFIG GET slowlog-log-slower-than
```

慢查询只统计命令执行时间，不包含网络传输和排队等待。返回大结果的网络耗时不一定体现在 SLOWLOG 中。

## big key

big key 包括：

- String value 很大。
- Hash/List/Set/ZSet 元素很多。
- 单次命令返回大量数据。

发现：

```bash
redis-cli --bigkeys
MEMORY USAGE key
SCAN 0 MATCH pattern COUNT 1000
```

风险：

- 阻塞事件循环。
- 复制和持久化压力。
- 网络输出大。
- 删除阻塞，可用异步删除类命令。

## hot key

hot key 是访问极度集中的 key，会打满单节点 CPU 或网络。

方案：

- 本地缓存。
- 多副本读。
- key 拆分。
- 请求合并。
- 热点保护和限流。

## pipeline

pipeline 减少网络 RTT：

```bash
redis-cli --pipe < commands.txt
```

客户端 pipeline 要控制批量大小。批太大可能造成输出缓冲膨胀和延迟尖刺。

## 练习

1. 构造大 Set，比较 `SCARD` 和 `SMEMBERS`。
2. 使用 `SLOWLOG` 观察慢命令。
3. 用 pipeline 写入大量 key，比较耗时和内存。

## 验收

- 能解释 SLOWLOG 不包含网络耗时。
- 能识别 big key 和 hot key。
- 能设计 pipeline 批量大小。

## 重点

- Redis 性能问题通常来自少数危险命令或异常 key。
- 返回数据量和命令执行复杂度同样重要。
- pipeline 是减少 RTT，不是无限批处理。

## 易错

> **易错：** SLOWLOG 没记录就认为 Redis 没慢。
>
> 正确做法：结合延迟、客户端、网络、输出缓冲、命令返回大小和系统指标分析。

