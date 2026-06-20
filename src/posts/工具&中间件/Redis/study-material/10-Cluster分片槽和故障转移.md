---
title: "Redis学习资料：Cluster、分片槽和故障转移"
date: 2026-06-20
description: "Redis Cluster 将 key 映射到固定数量的 hash slot，每个主节点负责一部分 slot。客户端根据 slot 路由请求。节点扩容或迁移时，slot 可以从一个主节点迁移到另一个主节点。Cluster 解决水平扩展和分片…"
tags:
  - "工具&中间件"
  - "Redis"
category: "工具&中间件"
---

# Redis学习资料：Cluster、分片槽和故障转移

[返回索引](../Redis学习资料.md)

## 学习目标

- 理解 Redis Cluster 的 hash slot、分片和重定向。
- 掌握 MOVED、ASK、hash tag、多 key 同槽限制。
- 能说明 Cluster 的扩容、迁移和故障转移边界。

## 理论导读

Redis Cluster 将 key 映射到固定数量的 hash slot，每个主节点负责一部分 slot。客户端根据 slot 路由请求。节点扩容或迁移时，slot 可以从一个主节点迁移到另一个主节点。Cluster 解决水平扩展和分片高可用，但带来多 key 操作限制和客户端路由复杂度。

## hash slot

key 通过 CRC16 计算 slot。使用 hash tag 可让多个 key 落到同一 slot：

```text
user:{100}:profile
user:{100}:orders
```

花括号内相同部分作为 hash 输入，便于多 key 命令同槽执行。

## MOVED 和 ASK

- MOVED：slot 已归属另一个节点，客户端应更新路由缓存。
- ASK：slot 正在迁移，客户端临时去目标节点执行，并先发送 ASKING。

这要求客户端支持 Cluster 协议，而不是普通单点连接池。

## 多 key 限制

Cluster 中多 key 命令通常要求所有 key 在同一 slot。否则会报 CROSSSLOT。

```bash
MGET user:{1}:name user:{1}:age
```

## 故障转移

Cluster 节点之间通过 gossip 交换状态。主节点不可达时，从节点可被提升为主。故障判定需要多数主节点参与，因此网络分区会影响可用性。

## 扩容和迁移

扩容本质是把部分 slot 从旧节点迁移到新节点。迁移期间客户端可能收到 ASK 重定向。迁移大 key 会造成阻塞和网络压力。

## 练习

1. 创建三主三从 Cluster。
2. 用不同 key 查看 slot。
3. 用 hash tag 实现多 key 同槽。
4. 模拟 slot 迁移，观察 MOVED/ASK。

## 验收

- 能解释 16384 个 slot 的作用。
- 能说明 MOVED 和 ASK 区别。
- 能用 hash tag 解决多 key 同槽问题。

## 重点

- Cluster 是客户端参与路由的分布式系统。
- 多 key 业务设计要提前考虑 slot。
- 扩容迁移和故障切换不是无成本操作。

## 易错

> **易错：** 把普通 Redis 客户端连接池直接用于 Cluster。
>
> 正确做法：使用支持 Cluster 拓扑发现、MOVED/ASK 和重试的客户端。

