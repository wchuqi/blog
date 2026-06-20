---
title: "Redis学习资料：Sentinel 选举、配置纪元和客户端切换深度解析"
date: 2026-06-20
description: "Sentinel 是一个分布式监控和故障转移系统。单个 Sentinel 认为主节点不可达只是主观下线；达到 quorum 后才形成客观下线。随后 Sentinel 之间选出 leader 执行 failover。客户端必须通过 Senti…"
tags:
  - "工具&中间件"
  - "Redis"
  - "深度解析"
category: "工具&中间件"
---

# Redis学习资料：Sentinel 选举、配置纪元和客户端切换深度解析

[返回索引](../Redis学习资料.md)

## 学习目标

- 理解 Sentinel 主观下线、客观下线、leader 选举和 failover。
- 掌握配置纪元、从节点选择和客户端切换风险。
- 能排查 Sentinel 故障转移异常。

## 理论导读

Sentinel 是一个分布式监控和故障转移系统。单个 Sentinel 认为主节点不可达只是主观下线；达到 quorum 后才形成客观下线。随后 Sentinel 之间选出 leader 执行 failover。客户端必须通过 Sentinel 获得新主，旧连接和拓扑缓存也要正确处理。

## 下线判定

- SDOWN：单 Sentinel 主观认为实例不可达。
- ODOWN：足够 Sentinel 达成主节点不可达判断。

参数影响：

- down-after-milliseconds。
- quorum。
- 网络延迟和抖动。

## leader 选举和配置纪元

Sentinel failover 需要选出 leader。配置纪元用于标识新的主从配置版本，避免旧配置覆盖新配置。

## 从节点选择

考虑：

- slave-priority。
- 复制偏移量。
- 与主断开时间。
- run id 等稳定排序因素。

运维上应避免低规格、跨机房延迟大的从节点被提升。

## 客户端切换

客户端要：

- 支持 Sentinel。
- 获取当前 master 地址。
- 旧连接失败后重新发现。
- 处理写入失败重试。
- 避免在切换期间无限重试压垮系统。

## 练习

1. 搭建 3 Sentinel + 1 主 2 从。
2. 模拟主节点宕机，观察日志。
3. 修改从节点 priority，验证提升选择。
4. 测试客户端故障切换期间行为。

## 验收

- 能解释 SDOWN 和 ODOWN。
- 能说明 Sentinel leader 选举目的。
- 能设计客户端切换保护。

## 易错

> **易错：** Sentinel 切主后应用仍写旧主。
>
> 正确做法：客户端必须支持 Sentinel 发现，并在连接失败时刷新主节点。

