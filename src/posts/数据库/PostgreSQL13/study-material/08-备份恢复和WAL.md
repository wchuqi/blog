---
title: "PostgreSQL 13 学习资料：备份恢复和 WAL"
date: 2026-06-20
description: "备份的目的不是“有一份文件”，而是在事故发生时恢复业务。PostgreSQL 的恢复能力建立在两类材料上：基础数据和 WAL。基础数据可以来自逻辑备份或物理基础备份，WAL 记录数据变化，用于崩溃恢复、复制和时间点恢复。"
tags:
  - "数据库"
  - "PostgreSQL13"
category: "数据库"
---

# PostgreSQL 13 学习资料：备份恢复和 WAL

[返回索引](../PostgreSQL13学习资料.md)

## 学习目标

- 理解 WAL、checkpoint、逻辑备份、物理备份和 PITR。
- 能制定 PostgreSQL 13 的备份恢复方案。
- 能安全执行恢复演练并验证备份有效性。

## 理论导读

备份的目的不是“有一份文件”，而是在事故发生时恢复业务。PostgreSQL 的恢复能力建立在两类材料上：基础数据和 WAL。基础数据可以来自逻辑备份或物理基础备份，WAL 记录数据变化，用于崩溃恢复、复制和时间点恢复。

逻辑备份像导出业务对象定义和数据，适合迁移、部分恢复和跨版本恢复；物理备份像复制整个数据目录，适合大库快速恢复和 PITR。二者不是互相替代，而是服务不同目标。

## 核心心智模型

WAL 是数据库的操作流水账。数据页可能还没完全刷盘，但只要提交对应的 WAL 安全落盘，崩溃后就能重放。PITR 的本质是：先恢复一份基础备份，再按 WAL 流水账重放到指定时间点或事务位置。

## 知识点详解

### 1. 逻辑备份

```powershell
pg_dump -h localhost -U postgres -d job_app -Fc -f job_app.dump
pg_restore -h localhost -U postgres -d job_app_restore job_app.dump
```

常见格式：

| 格式 | 参数 | 特点 |
| --- | --- | --- |
| plain SQL | 默认或 `-Fp` | 可读，可用 `psql` 执行 |
| custom | `-Fc` | 支持并行恢复、选择对象 |
| directory | `-Fd` | 支持并行备份和恢复 |
| tar | `-Ft` | 归档格式 |

备份全实例对象：

```powershell
pg_dumpall -h localhost -U postgres -f all.sql
```

`pg_dumpall` 包含角色和表空间等全局对象，单库 `pg_dump` 不包含这些全局对象。

### 2. 物理备份

```powershell
pg_basebackup -h primary.example.com -U repl -D D:\pgbackup\base -Fp -Xs -P
```

参数含义：

- `-D`：目标目录。
- `-Fp`：plain 格式。
- `-Xs`：同时流式获取 WAL。
- `-P`：显示进度。

PostgreSQL 13 支持备份清单，有助于验证备份文件完整性。

### 3. WAL 和归档

关键配置：

```conf
wal_level = replica
archive_mode = on
archive_command = 'copy "%p" "D:\\pg_archive\\%f"'
```

归档命令必须可靠且幂等。归档失败会导致 WAL 堆积，磁盘可能被打满。

### 4. PITR

PostgreSQL 13 使用 `recovery.signal` 触发恢复模式，恢复目标参数写入配置文件或自动配置文件。

示意步骤：

1. 停止目标实例。
2. 清空或更换目标数据目录。
3. 恢复基础备份。
4. 配置 `restore_command`。
5. 创建 `recovery.signal`。
6. 设置 `recovery_target_time`。
7. 启动数据库并检查恢复结果。

示例配置：

```conf
restore_command = 'copy "D:\\pg_archive\\%f" "%p"'
recovery_target_time = '2026-06-06 10:30:00+08'
recovery_target_action = 'pause'
```

### 5. RPO 和 RTO

| 指标 | 含义 | 影响因素 |
| --- | --- | --- |
| RPO | 最多能丢多少数据 | WAL 归档频率、复制延迟、备份策略 |
| RTO | 多久能恢复服务 | 数据量、恢复流程、自动化程度、演练熟练度 |

## 例子

误删表恢复思路：

```sql
DROP TABLE application;
```

正确处理不是立刻在原库乱试，而是：

1. 记录误操作时间。
2. 在隔离环境用基础备份加 WAL 恢复到误操作之前。
3. 导出缺失表或数据。
4. 在原库评估导入方案。
5. 保留事故证据和恢复日志。

## 练习

1. 对 `job_app` 做一次 `pg_dump -Fc`，恢复到新库。
2. 用 `pg_basebackup` 做物理备份。
3. 配置 WAL 归档，确认归档目录生成 WAL 文件。
4. 模拟误删数据，在测试环境恢复到指定时间点。

## 验收

- 能区分逻辑备份和物理备份。
- 能说明 PITR 需要基础备份和连续 WAL。
- 能解释 RPO、RTO。
- 能写出恢复演练步骤。

## 重点

- 未演练的备份方案不可靠。
- `pg_dump` 不等于 PITR。
- WAL 归档失败会变成磁盘风险。

## 难点

- 恢复时要保证时间点、时区、WAL 连续性和目标环境隔离，任何一步错都可能扩大事故。

## 易错

> **易错：** 只保留备份文件，从不恢复验证。
>
> 正确做法：定期在隔离环境恢复，并校验数据量、关键表和应用可用性。

> **易错：** 认为有流复制就不需要备份。
>
> 正确做法：复制会同步误删和错误更新，备份和 PITR 仍然必需。

