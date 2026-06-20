---
title: "Redis学习资料"
date: 2026-06-20
description: "这是一份面向后端开发、数据库、中间件、DevOps 和面试复习的 Redis 学习资料。内容以常见 Redis 服务端机制为主，兼顾缓存、数据结构、持久化、高可用、Cluster、性能、内存、安全、生产排障和深度原理。"
tags:
  - "工具&中间件"
  - "Redis"
  - "学习资料总览"
category: "工具&中间件"
---

# Redis学习资料

这是一份面向后端开发、数据库、中间件、DevOps 和面试复习的 Redis 学习资料。内容以常见 Redis 服务端机制为主，兼顾缓存、数据结构、持久化、高可用、Cluster、性能、内存、安全、生产排障和深度原理。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 安装、配置、客户端和 redis-cli | [01-安装配置客户端和redis-cli.md](study-material/01-安装配置客户端和redis-cli.md) |
| 2 | 数据类型和命令语义 | [02-数据类型和命令语义.md](study-material/02-数据类型和命令语义.md) |
| 3 | 键空间、过期、淘汰和内存模型 | [03-键空间过期淘汰和内存模型.md](study-material/03-键空间过期淘汰和内存模型.md) |
| 4 | 核心数据结构底层编码 | [04-字符串哈希列表集合有序集合底层编码.md](study-material/04-字符串哈希列表集合有序集合底层编码.md) |
| 5 | Bitmap、HyperLogLog、Geo 和 Stream | [05-BitmapHyperLogLogGeo和Stream.md](study-material/05-BitmapHyperLogLogGeo和Stream.md) |
| 6 | 事务、Lua 和原子性 | [06-事务Lua和原子性.md](study-material/06-事务Lua和原子性.md) |
| 7 | 发布订阅、Stream 和消息队列 | [07-发布订阅Stream和消息队列.md](study-material/07-发布订阅Stream和消息队列.md) |
| 8 | 持久化：RDB、AOF 和混合持久化 | [08-持久化RDBAOF和混合持久化.md](study-material/08-持久化RDBAOF和混合持久化.md) |
| 9 | 复制、主从、哨兵和高可用 | [09-复制主从哨兵和高可用.md](study-material/09-复制主从哨兵和高可用.md) |
| 10 | Cluster、分片槽和故障转移 | [10-Cluster分片槽和故障转移.md](study-material/10-Cluster分片槽和故障转移.md) |
| 11 | 缓存模式、穿透、击穿、雪崩和一致性 | [11-缓存模式穿透击穿雪崩一致性.md](study-material/11-缓存模式穿透击穿雪崩一致性.md) |
| 12 | 分布式锁、限流、计数器和会话 | [12-分布式锁限流计数器和会话.md](study-material/12-分布式锁限流计数器和会话.md) |
| 13 | 性能优化、慢查询、big key、hot key 和网络 IO | [13-性能优化慢查询bigkey热key网络IO.md](study-material/13-性能优化慢查询bigkey热key网络IO.md) |
| 14 | 安全、ACL、网络、TLS 和生产配置 | [14-安全ACL网络TLS和生产配置.md](study-material/14-安全ACL网络TLS和生产配置.md) |
| 15 | 监控、排障、备份恢复和运维 | [15-监控排障备份恢复运维.md](study-material/15-监控排障备份恢复运维.md) |
| 16 | 综合练习项目 | [16-综合练习项目.md](study-material/16-综合练习项目.md) |
| 17 | 命令速查 | [17-命令速查.md](study-material/17-命令速查.md) |
| 18 | 面试知识点整理 | [18-面试知识点整理.md](study-material/18-面试知识点整理.md) |
| 19 | Redis 完整知识点清单 | [19-Redis完整知识点清单.md](study-material/19-Redis完整知识点清单.md) |
| 20 | 事件循环、IO 多路复用和单线程模型深度解析 | [20-事件循环IO多路复用和单线程模型深度解析.md](study-material/20-事件循环IO多路复用和单线程模型深度解析.md) |
| 21 | 对象编码、SDS、Dict、Skiplist 和内存分配深度解析 | [21-对象编码SDSDictSkiplist和内存分配深度解析.md](study-material/21-对象编码SDSDictSkiplist和内存分配深度解析.md) |
| 22 | 过期删除、淘汰策略和内存碎片深度解析 | [22-过期删除淘汰策略和内存碎片深度解析.md](study-material/22-过期删除淘汰策略和内存碎片深度解析.md) |
| 23 | 复制、PSYNC、积压缓冲和一致性边界深度解析 | [23-复制PSYNC积压缓冲和一致性边界深度解析.md](study-material/23-复制PSYNC积压缓冲和一致性边界深度解析.md) |
| 24 | Cluster 槽迁移、重定向和故障判定深度解析 | [24-Cluster槽迁移重定向和故障判定深度解析.md](study-material/24-Cluster槽迁移重定向和故障判定深度解析.md) |
| 25 | 持久化 fork、COW、AOF 重写和恢复深度解析 | [25-持久化forkCOWAOF重写和恢复深度解析.md](study-material/25-持久化forkCOWAOF重写和恢复深度解析.md) |
| 26 | 缓存一致性、分布式锁和高并发场景深度解析 | [26-缓存一致性分布式锁和高并发场景深度解析.md](study-material/26-缓存一致性分布式锁和高并发场景深度解析.md) |
| 27 | 生产故障案例和排障剧本 | [27-生产故障案例和排障剧本.md](study-material/27-生产故障案例和排障剧本.md) |
| 28 | 深度实验手册和能力验收 | [28-深度实验手册和能力验收.md](study-material/28-深度实验手册和能力验收.md) |
| 29 | RESP 协议、客户端、pipeline 和背压深度解析 | [29-RESP协议客户端pipeline和背压深度解析.md](study-material/29-RESP协议客户端pipeline和背压深度解析.md) |
| 30 | 命令执行路径、复杂度和阻塞点深度解析 | [30-命令执行路径复杂度和阻塞点深度解析.md](study-material/30-命令执行路径复杂度和阻塞点深度解析.md) |
| 31 | Key 设计、容量估算和数据建模深度解析 | [31-Key设计容量估算和数据建模深度解析.md](study-material/31-Key设计容量估算和数据建模深度解析.md) |
| 32 | big key、hot key 在线治理和拆分迁移深度解析 | [32-bigkeyhotkey在线治理和拆分迁移深度解析.md](study-material/32-bigkeyhotkey在线治理和拆分迁移深度解析.md) |
| 33 | 缓存一致性工程方案、binlog 和消息补偿深度解析 | [33-缓存一致性工程方案binlog和消息补偿深度解析.md](study-material/33-缓存一致性工程方案binlog和消息补偿深度解析.md) |
| 34 | 分布式锁、Redlock、fencing token 和幂等深度解析 | [34-分布式锁Redlockfencingtoken和幂等深度解析.md](study-material/34-分布式锁Redlockfencingtoken和幂等深度解析.md) |
| 35 | Sentinel 选举、配置纪元和客户端切换深度解析 | [35-Sentinel选举配置纪元和客户端切换深度解析.md](study-material/35-Sentinel选举配置纪元和客户端切换深度解析.md) |
| 36 | Cluster gossip、configEpoch、failover 和脑裂深度解析 | [36-ClustergossipconfigEpochfailover和脑裂深度解析.md](study-material/36-ClustergossipconfigEpochfailover和脑裂深度解析.md) |
| 37 | 内存分配器、碎片、active defrag 和 RSS 深度解析 | [37-内存分配器碎片active defrag和RSS深度解析.md](study-material/37-内存分配器碎片active defrag和RSS深度解析.md) |
| 38 | 持久化损坏恢复、备份校验和灾备演练深度解析 | [38-持久化损坏恢复备份校验和灾备演练深度解析.md](study-material/38-持久化损坏恢复备份校验和灾备演练深度解析.md) |
| 39 | 客户端超时、重试、连接池雪崩和保护深度解析 | [39-客户端超时重试连接池雪崩和保护深度解析.md](study-material/39-客户端超时重试连接池雪崩和保护深度解析.md) |
| 40 | 生产容量规划、压测、SLA 和成本治理深度解析 | [40-生产容量规划压测SLA和成本治理深度解析.md](study-material/40-生产容量规划压测SLA和成本治理深度解析.md) |

## 使用建议

- 入门：按 00 到 06 学习，先能理解 key-value、数据类型、TTL、事务和 Lua。
- 缓存开发：重点看 03、11、12、13、26，理解穿透、击穿、雪崩、一致性、锁和限流。
- 运维生产：重点看 08、09、10、14、15、22、23、24、25、27。
- 深入原理：重点看 20 到 40，覆盖事件循环、对象编码、内存、持久化、复制、Cluster、协议、客户端、容量、故障和 SLA。
- 面试复习：先读 19 完整清单，再读 18 和 `面试知识点/`。
