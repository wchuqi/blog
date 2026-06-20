---
title: "分布式锁与事务学习资料：ZooKeeper/etcd 锁和会话语义"
date: 2026-06-20
description: "ZooKeeper 和 etcd 属于一致性协调系统，通常基于共识协议维护元数据。它们比普通缓存锁更适合选主、配置协调、服务注册和高风险互斥场景，但成本更高，吞吐通常也不是为高频业务写路径设计的。"
tags:
  - "架构"
  - "分布式锁与事务"
category: "架构"
---

# 分布式锁与事务学习资料：ZooKeeper/etcd 锁和会话语义

[返回索引](../分布式锁与事务学习资料.md)

## 学习目标

- 理解 ZooKeeper 和 etcd 分布式锁的会话、租约和顺序语义。
- 掌握临时顺序节点、lease、revision、watch 的基本模型。
- 能判断什么时候应选择一致性协调系统而不是 Redis 锁。

## 理论导读

ZooKeeper 和 etcd 属于一致性协调系统，通常基于共识协议维护元数据。它们比普通缓存锁更适合选主、配置协调、服务注册和高风险互斥场景，但成本更高，吞吐通常也不是为高频业务写路径设计的。

## ZooKeeper 锁模型

典型锁流程：

1. 在锁目录下创建临时顺序节点，例如 `/locks/order/lock-00000012`。
2. 获取目录子节点并排序。
3. 如果自己序号最小，获得锁。
4. 如果不是最小，watch 前一个节点。
5. 前一个节点删除后重新判断。
6. 会话断开或客户端主动删除临时节点后释放锁。

这个模型避免了所有客户端 watch 同一个节点导致惊群。

## etcd 锁模型

etcd 常用 lease 和 revision：

- lease：租约，客户端通过 keepalive 保持有效。
- key：锁 key 绑定 lease，lease 失效后 key 自动删除。
- revision：全局递增版本，可用来判断顺序，也可作为 fencing token。
- watch：监听 key 变化。

etcd 的 revision 是非常有价值的 fencing token 来源，但下游仍必须校验 token。

## 对比

| 能力 | Redis | ZooKeeper/etcd |
| --- | --- | --- |
| 核心定位 | 缓存和内存数据结构 | 一致性元数据协调 |
| 锁语义 | TTL 租约锁 | 会话/租约和共识顺序 |
| 吞吐 | 高 | 较低 |
| 运维复杂度 | 中 | 较高 |
| 适用场景 | 低中风险互斥、防重复任务 | 选主、元数据协调、高风险调度 |

## 例子

选主比普通业务锁更适合 ZK/etcd：

- 主节点创建带租约的 leader key。
- 其他节点 watch leader key。
- leader 定期续租。
- leader 失联后 lease 过期，其他节点重新竞选。
- 所有写下游资源的请求携带 leader epoch 或 revision。

## 练习

设计一个基于 ZooKeeper 临时顺序节点的公平锁：

- 客户端如何获得排队顺序。
- 如何避免惊群。
- 会话断开如何释放锁。
- 业务执行超过会话有效期怎么办。

## 验收

- 能解释临时节点和临时顺序节点的区别。
- 能说明 etcd lease 和 revision 的用途。
- 能说出 ZK/etcd 锁仍然需要 fencing token 的原因。

## 重点

- ZK/etcd 提供更强的协调语义，但不是高频业务锁的默认选择。
- revision、zxid、epoch 等单调序号可以作为 fencing token。

## 易错

> **易错：** 认为用 ZooKeeper 或 etcd 后就可以忽略业务幂等。
>
> 正确做法：协调系统减少并发持有风险，但旧请求、重复请求和下游乱序仍要由状态机和 token 校验处理。

