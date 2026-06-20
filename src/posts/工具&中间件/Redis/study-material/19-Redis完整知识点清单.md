---
title: "Redis学习资料：Redis完整知识点清单"
date: 2026-06-20
description: "Redis 定位：内存数据结构服务器。"
tags:
  - "工具&中间件"
  - "Redis"
  - "知识清单"
category: "工具&中间件"
---

# Redis学习资料：Redis完整知识点清单

[返回索引](../Redis学习资料.md)

## 1. 基础

- Redis 定位：内存数据结构服务器。
- keyspace、database、TTL、类型、编码。
- RESP 协议、redis-cli、客户端连接池。
- 单命令原子性、事件循环。

## 2. 数据类型

- String、Hash、List、Set、Sorted Set。
- Bitmap、HyperLogLog、Geo、Stream。
- 命令复杂度、返回数据大小。
- key 命名、TTL、容量估算。

## 3. 内存和过期

- Redis object、key/value 元数据。
- 过期字典。
- 惰性删除、定期删除。
- maxmemory、淘汰策略、近似 LRU/LFU。
- big key、hot key、内存碎片。

## 4. 缓存模式

- cache-aside、read-through、write-through、write-behind。
- 穿透、击穿、雪崩。
- 空值缓存、Bloom Filter、互斥重建、逻辑过期。
- 数据库和缓存一致性。
- 双写失败补偿。

## 5. 原子和脚本

- MULTI/EXEC。
- WATCH。
- Lua 脚本。
- 原子性边界。
- Cluster 同槽限制。

## 6. 持久化

- RDB、BGSAVE、fork、COW。
- AOF、fsync 策略。
- AOF rewrite。
- 混合持久化。
- 恢复、备份和演练。

## 7. 高可用

- 主从复制。
- 全量同步、部分同步、PSYNC。
- replication backlog。
- Sentinel 主观下线、客观下线、failover。
- 复制延迟和数据丢失窗口。

## 8. Cluster

- hash slot。
- hash tag。
- MOVED、ASK。
- slot 迁移。
- gossip。
- 故障判定和主从提升。
- 多 key 同槽限制。

## 9. 消息和协调

- Pub/Sub。
- List 队列。
- Stream、consumer group、PEL、XACK、XAUTOCLAIM。
- 分布式锁。
- 限流、计数器、会话。

## 10. 性能和排障

- SLOWLOG、LATENCY、INFO。
- 命令复杂度。
- pipeline。
- 客户端输出缓冲。
- 网络 RTT。
- fork 抖动。
- AOF rewrite。
- big key/hot key。

## 11. 安全

- bind、protected-mode。
- requirepass、ACL。
- TLS。
- 危险命令限制。
- 网络隔离。
- 备份文件保护。

## 12. 深度机制

- ae event loop。
- IO 多路复用。
- SDS、dict、skiplist、listpack、quicklist。
- 内存 allocator 和碎片。
- 过期和淘汰抽样。
- replication offset、runid、PSYNC。
- Cluster config epoch。
- fork COW 和持久化峰值。

## 13. 学习验收

- 能根据业务场景选择 Redis 类型。
- 能设计缓存一致性和高并发保护。
- 能解释持久化、高可用和 Cluster 边界。
- 能定位慢查询、big key、hot key、内存和复制问题。
- 能写生产安全和备份恢复方案。

## 14. 协议和客户端深度清单

- RESP 请求和响应结构。
- pipeline、事务、Lua、批量命令对客户端缓冲的影响。
- 客户端连接池大小、等待队列、读写超时、命令超时。
- 重试放大、幂等性、退避、熔断、限流。
- 客户端输出缓冲区和慢客户端。
- Cluster 客户端 slot cache、MOVED/ASK、拓扑刷新。

## 15. 数据建模和容量深度清单

- key 命名长度、数量、TTL 分布。
- value 大小和元素数量上限。
- 单 key、单 slot、单节点热度。
- QPS、带宽、CPU、内存、持久化峰值。
- key 增长模型和过期模型。
- big key 在线拆分和迁移。
- hot key 本地缓存、多副本和请求合并。

## 16. 高可用和灾备深度清单

- Sentinel quorum、leader 选举、配置纪元。
- 客户端发现新主和旧连接处理。
- Cluster gossip、PFAIL/FAIL、configEpoch、投票。
- 网络分区、脑裂风险、min-replicas-to-write。
- RDB/AOF 损坏检测和恢复。
- 备份校验、恢复演练、RTO/RPO。

## 17. 安全一致性和生产治理深度清单

- Redlock 争议和适用边界。
- fencing token 与下游资源保护。
- 幂等键、业务状态机、数据库唯一约束。
- cache-aside 失败矩阵、binlog/CDC 补偿。
- 压测模型、SLA、错误预算、成本治理。
- 上线 gate、回滚、降级和熔断。
