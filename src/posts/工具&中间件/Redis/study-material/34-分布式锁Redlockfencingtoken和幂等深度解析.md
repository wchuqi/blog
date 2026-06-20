---
title: "Redis学习资料：分布式锁、Redlock、fencing token 和幂等深度解析"
date: 2026-06-20
description: "分布式锁不是“拿到锁就一定独占”。网络分区、时钟漂移、锁过期、客户端暂停、主从切换都可能让两个客户端认为自己持有锁。Redis 锁适合降低并发冲突，但关键一致性还要靠数据库约束、幂等状态机和 fencing token。"
tags:
  - "工具&中间件"
  - "Redis"
  - "深度解析"
category: "工具&中间件"
---

# Redis学习资料：分布式锁、Redlock、fencing token 和幂等深度解析

[返回索引](../Redis学习资料.md)

## 学习目标

- 理解 Redis 锁的基本安全条件和失败场景。
- 知道 Redlock 的设计意图和争议边界。
- 掌握 fencing token、幂等和下游资源保护。

## 理论导读

分布式锁不是“拿到锁就一定独占”。网络分区、时钟漂移、锁过期、客户端暂停、主从切换都可能让两个客户端认为自己持有锁。Redis 锁适合降低并发冲突，但关键一致性还要靠数据库约束、幂等状态机和 fencing token。

## 基本 Redis 锁

```bash
SET lock:resource uuid NX PX 30000
```

释放必须校验 value。续期也应校验 value。

## 失败场景

- 客户端 A 拿锁，业务暂停超过 TTL。
- 锁过期，客户端 B 拿锁。
- A 恢复后继续写下游资源。
- 如果下游不校验版本，A 的旧操作覆盖 B。

## fencing token

fencing token 是单调递增令牌。每次获得锁时同时获得一个递增 token。下游资源只接受 token 更大的操作。

```text
A token=10
B token=11
下游已看到 11，则拒绝 A 的 10
```

Redis 可用 `INCR lock:token` 生成 token，但下游必须参与校验，否则没有意义。

## Redlock

Redlock 尝试在多个独立 Redis 节点上获得多数锁，并用时间窗口判断成功。它的目标是降低单 Redis 节点故障风险，但在异步网络、时钟和暂停场景下存在争议。是否使用要结合业务风险。

建议：

- 普通防重复任务：单实例锁或主从锁可能足够。
- 关键资源互斥：使用 fencing token、数据库约束或专门一致性系统。
- 不要把 Redis 锁当线性一致锁。

## 幂等

锁失败时仍要保证幂等：

- 请求唯一 ID。
- 业务状态机。
- 数据库唯一约束。
- 去重表。
- 下游 token 校验。

## 练习

1. 模拟锁过期后旧客户端继续执行。
2. 设计 token 递增和下游拒绝旧 token。
3. 比较 Redis 锁、数据库锁、ZooKeeper/etcd 锁的边界。

## 验收

- 能解释 Redis 锁的失败场景。
- 能说明 fencing token 的作用。
- 能评价 Redlock 适用边界。

## 重点

- 锁不是最终防线，幂等和状态机才是。
- fencing token 需要下游资源配合。
- Redis 锁不适合所有强一致场景。

## 易错

> **易错：** 认为 Redlock 就能解决所有分布式锁安全问题。
>
> 正确做法：结合业务风险、下游 token、幂等和一致性系统选择方案。

