---
title: "Redis面试知识点：Cluster 和分布式"
date: 2026-06-20
description: "Redis Cluster 把 key 映射到 16384 个 hash slot，每个主节点负责一部分 slot。客户端根据 slot 把请求路由到对应节点。"
tags:
  - "工具&中间件"
  - "Redis"
  - "面试"
category: "工具&中间件"
---

# Redis面试知识点：Cluster 和分布式

[返回面试索引](../18-面试知识点整理.md)

[返回学习资料索引](../../Redis学习资料.md)

## 一、Cluster

### 1. Redis Cluster 如何分片？

**参考答案：**

Redis Cluster 把 key 映射到 16384 个 hash slot，每个主节点负责一部分 slot。客户端根据 slot 把请求路由到对应节点。

### 2. MOVED 和 ASK 有什么区别？

**参考答案：**

MOVED 表示 slot 归属已经变化，客户端应更新路由缓存；ASK 表示 slot 迁移期间临时重定向，客户端去目标节点执行一次但不应永久更新 slot cache，并需要先发送 ASKING。

### 3. 为什么 Cluster 多 key 命令要求同槽？

**参考答案：**

Cluster 中不同 key 可能在不同主节点。Redis 不提供跨节点事务协调，因此多 key 命令通常要求 key 在同一 slot。可用 hash tag 让相关 key 同槽。

### 4. hash tag 有什么风险？

**参考答案：**

hash tag 可让 key 同槽，但过度使用会导致槽倾斜和热点。例如把所有业务 key 都放同一个 tag，会让 Cluster 失去分片意义。

### 5. Cluster 故障转移依赖什么？

**参考答案：**

Cluster 通过节点间 gossip 交换状态，主节点客观 FAIL 后，从节点发起选举并获得足够投票后提升为主。多数派和网络分区会影响故障转移。

