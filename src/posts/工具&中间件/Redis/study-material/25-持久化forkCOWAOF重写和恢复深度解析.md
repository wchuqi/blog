---
title: "Redis学习资料：持久化 fork、COW、AOF 重写和恢复深度解析"
date: 2026-06-20
description: "RDB 和 AOF rewrite 常依赖 fork 子进程。fork 本身需要复制页表，数据页通过 COW 延迟复制。父进程在子进程持久化期间继续写入，修改过的数据页会复制，导致额外内存。写入越多、数据越热、内存越大，COW 峰值越高。"
tags:
  - "工具&中间件"
  - "Redis"
  - "深度解析"
category: "工具&中间件"
---

# Redis学习资料：持久化 fork、COW、AOF 重写和恢复深度解析

[返回索引](../Redis学习资料.md)

## 学习目标

- 深入理解 fork、copy-on-write 和持久化峰值内存。
- 掌握 AOF rewrite 缓冲和恢复流程。
- 能设计持久化故障排查和恢复演练。

## 理论导读

RDB 和 AOF rewrite 常依赖 fork 子进程。fork 本身需要复制页表，数据页通过 COW 延迟复制。父进程在子进程持久化期间继续写入，修改过的数据页会复制，导致额外内存。写入越多、数据越热、内存越大，COW 峰值越高。

## fork 风险

风险来自：

- fork 阻塞时间。
- 页表内存。
- COW 额外内存。
- 磁盘 IO。
- overcommit 配置。

观察：

```bash
INFO persistence
INFO memory
LATENCY LATEST
```

## AOF rewrite 流程

简化：

1. 父进程 fork 子进程。
2. 子进程根据当前内存生成新 AOF。
3. 父进程继续处理写命令，同时写入 AOF rewrite buffer。
4. 子进程完成后，父进程追加增量 buffer。
5. 原子替换旧 AOF。

## 恢复流程

启动时 Redis 根据配置加载持久化文件。AOF 可能需要检查和修复。恢复速度受文件大小、磁盘、命令复杂度影响。

## 生产建议

- 预留 fork COW 内存。
- 监控 rewrite 耗时和失败。
- 控制大 key 和写入峰值。
- 备份持久化文件。
- 定期演练恢复。
- 不把备份和运行数据放同一故障域。

## 练习

1. 在大量写入期间执行 BGSAVE，观察内存和延迟。
2. 开启 AOF，触发 BGREWRITEAOF。
3. 备份 AOF/RDB 到新实例恢复。

## 验收

- 能解释 fork COW 内存峰值。
- 能说明 AOF rewrite 期间新写入如何处理。
- 能写出持久化恢复流程。

## 重点

- 持久化会影响内存、CPU、磁盘和延迟。
- AOF rewrite 不是简单压缩旧文件。
- 恢复演练是备份策略的一部分。

## 易错

> **易错：** Redis used_memory 低于机器内存就认为 fork 安全。
>
> 正确做法：还要考虑页表、COW、RSS、碎片、overcommit 和同时写入量。

