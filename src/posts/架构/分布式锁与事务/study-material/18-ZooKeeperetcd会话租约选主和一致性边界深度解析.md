---
title: "分布式锁与事务学习资料：ZooKeeper/etcd 会话租约选主和一致性边界深度解析"
date: 2026-06-20
description: "客户端在锁目录下创建临时顺序节点："
tags:
  - "架构"
  - "分布式锁与事务"
  - "深度解析"
category: "架构"
---

# 分布式锁与事务学习资料：ZooKeeper/etcd 会话租约选主和一致性边界深度解析

[返回索引](../分布式锁与事务学习资料.md)

## 学习目标

- 深入理解 ZooKeeper 临时顺序节点锁和 etcd lease 锁。
- 能解释会话失效、watch 丢事件、羊群效应、选主 epoch 的边界。
- 能把 ZK/etcd 的顺序号用于 fencing token。

## ZooKeeper 临时顺序节点为什么适合锁

客户端在锁目录下创建临时顺序节点：

```text
/locks/job/lock-0000000010
/locks/job/lock-0000000011
/locks/job/lock-0000000012
```

序号最小者获得锁。非最小者只 watch 自己前一个节点，例如 `0012` watch `0011`。这样前一个节点释放时，只唤醒下一个等待者，避免所有客户端同时醒来争抢。

## ZK 锁失效边界

### 会话失效不是业务停止

ZK 可以在会话失效时删除临时节点，但无法强制客户端业务线程停止。如果客户端和 ZK 断连、会话过期，而业务线程还在写数据库，就仍然可能产生旧主写入。

因此选主或锁场景要使用 epoch、zxid 或递增 fencing token。下游服务要拒绝旧 epoch。

### watch 不是永久订阅

ZK watch 是一次性触发，触发后要重新注册。客户端要在收到事件后重新读取当前子节点列表，而不是假设自己一定拿到锁。

## etcd lease 和 revision

etcd 锁通常绑定 lease。客户端 keepalive 维持 lease；lease 过期时 key 删除。etcd 的 revision 是全局递增版本，可以作为顺序依据和 fencing token。

选主时可以记录：

```text
leader_key = /election/order-scheduler
leader_value = instance-a
lease_id = 123
create_revision = 987654
```

下游写入携带 `create_revision` 或 leader epoch。资源表只接受更大的 epoch。

## 选主深度模型

选主不只是“谁创建 key 成功”。完整模型包括：

1. 竞选成功，获得 leader epoch。
2. leader 定期续租。
3. leader 执行业务前检查本地是否仍认为 lease 有效。
4. 写下游时携带 epoch。
5. 下游拒绝旧 epoch。
6. follower watch leader key 删除后重新竞选。
7. 旧 leader 恢复后如果写入，因 epoch 过旧被拒绝。

## Redis 与 ZK/etcd 的取舍

| 维度 | Redis 锁 | ZK/etcd 锁 |
| --- | --- | --- |
| 主要优势 | 简单、高吞吐、低延迟 | 一致性元数据、会话、顺序 |
| 主要短板 | 异步复制和时间窗口 | 运维复杂、吞吐较低 |
| 更适合 | 普通防重复任务 | 选主、调度器、关键元数据 |
| 仍需兜底 | 幂等、状态机、token | 幂等、状态机、token |

## 练习

设计一个基于 etcd 的主调度器：

- leader key 如何命名。
- lease TTL 和 keepalive 间隔。
- revision 如何传给下游任务。
- 旧 leader 恢复后如何被拒绝。
- leader 切换期间任务如何避免重复执行。

## 验收

- 能解释 ZK 临时顺序节点锁的排队和 watch 机制。
- 能说明 etcd revision 为什么能做 fencing token。
- 能说出 ZK/etcd 仍不能强制旧业务线程停止。

## 易错

> **易错：** 认为选主成功就代表整个任期内只有一个主会写入。
>
> 正确做法：选主只授予任期，业务写入必须携带任期号或 revision，由下游拒绝旧主。

