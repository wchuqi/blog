---
title: "Redis学习资料：Cluster 槽迁移、重定向和故障判定深度解析"
date: 2026-06-20
description: "Cluster 不是代理层透明分片，而是 Redis 节点和客户端共同维护路由。每个节点知道 slot 到节点的映射。客户端请求错节点时，节点用 MOVED 或 ASK 告诉客户端重定向。迁移期间 slot 处于 migrating/imp…"
tags:
  - "工具&中间件"
  - "Redis"
  - "深度解析"
category: "工具&中间件"
---

# Redis学习资料：Cluster 槽迁移、重定向和故障判定深度解析

[返回索引](../Redis学习资料.md)

## 学习目标

- 深入理解 hash slot、MOVED、ASK、importing、migrating。
- 掌握 Cluster 故障判定、config epoch 和主从提升。
- 能分析扩容迁移期间的客户端行为。

## 理论导读

Cluster 不是代理层透明分片，而是 Redis 节点和客户端共同维护路由。每个节点知道 slot 到节点的映射。客户端请求错节点时，节点用 MOVED 或 ASK 告诉客户端重定向。迁移期间 slot 处于 migrating/importing 状态，需要 ASK 临时重定向。

## 槽迁移状态

- migrating：源节点正在迁出 slot。
- importing：目标节点正在导入 slot。
- stable：slot 已稳定归属。

迁移 key 时，部分 key 已到目标节点，部分仍在源节点，所以客户端可能收到 ASK。

## MOVED 和 ASK

MOVED：

- 表示 slot 归属已经变了。
- 客户端应更新本地 slot cache。

ASK：

- 表示迁移期间临时去目标节点。
- 客户端不应永久更新 slot cache。
- 需要先发送 ASKING。

## hash tag

```text
cart:{user1}:items
cart:{user1}:meta
```

同一 `{user1}` 落同槽，支持多 key 操作。但过度使用 hash tag 会造成槽倾斜。

## 故障判定

Cluster 节点通过 gossip 交换状态。主节点被多个主节点判断不可达后，从 PFAIL 进入 FAIL。故障转移需要从节点发起选举并获得足够投票。

影响因素：

- cluster-node-timeout。
- 网络分区。
- 从节点复制偏移。
- 节点多数派。

## 练习

1. 用 `CLUSTER KEYSLOT` 查看 key slot。
2. 手动 reshard，抓取 MOVED/ASK。
3. 故意让某主节点不可达，观察 failover。
4. 设计 hash tag，避免跨槽又避免倾斜。

## 验收

- 能准确区分 MOVED 和 ASK。
- 能解释迁移期间为什么客户端必须理解 Cluster 协议。
- 能说明 Cluster 故障转移依赖多数派。

## 重点

- Cluster 扩容迁移会影响客户端路由和延迟。
- hash tag 是业务建模工具，不是随意包所有 key。
- 网络分区下可用性和一致性要权衡。

## 易错

> **易错：** 为了多 key 操作把所有 key 都放进同一个 hash tag。
>
> 正确做法：只把确实需要原子多 key 的一组 key 放同槽，避免单槽热点。

