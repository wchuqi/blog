---
title: "PostgreSQL 13 学习资料：复制、PITR 和高可用深度解析"
date: 2026-06-20
description: "PostgreSQL 的恢复、物理复制和 PITR 都围绕 WAL 展开。主库生成 WAL，备库接收 WAL 并重放。基础备份提供一个起点，WAL 提供从起点之后的变化。故障切换时，备库提升为主库，会产生新的 timeline。之后旧主不能…"
tags:
  - "数据库"
  - "PostgreSQL13"
  - "深度解析"
category: "数据库"
---

# PostgreSQL 13 学习资料：复制、PITR 和高可用深度解析

[返回索引](../PostgreSQL13学习资料.md)

## 学习目标

- 理解 LSN、timeline、WAL sender/receiver、startup process、replication slot 的协作。
- 掌握 PITR 的恢复链路和时间线切换。
- 能区分物理复制、逻辑复制、同步复制和高可用故障切换。
- 能识别复制延迟、复制槽堆 WAL、故障切换脑裂和旧主重加入风险。

## 理论导读

PostgreSQL 的恢复、物理复制和 PITR 都围绕 WAL 展开。主库生成 WAL，备库接收 WAL 并重放。基础备份提供一个起点，WAL 提供从起点之后的变化。故障切换时，备库提升为主库，会产生新的 timeline。之后旧主不能简单直接接回去，因为它可能位于旧 timeline，且可能包含未被新主接受的写入。

高可用不是复制的同义词。复制解决数据副本问题，高可用还要解决主库身份、故障判断、客户端路由、旧主隔离、数据丢失窗口和回滚路径。

## 核心心智模型

### 1. LSN 是 WAL 坐标

LSN 是 WAL 日志位置。你可以把它理解为数据库变化流水账上的坐标。

```sql
SELECT pg_current_wal_lsn();
```

备库延迟本质上可以拆成：

```text
主库生成 WAL
  -> 发送到备库
  -> 备库写入磁盘
  -> 备库 flush
  -> 备库 replay
```

不同阶段慢，对应不同根因。

### 2. Timeline 是历史分支

当备库 promote 成新主，PostgreSQL 会开启新 timeline。PITR 恢复到某个时间点后继续作为主库运行，也会产生新 timeline。timeline 防止不同历史分支混在一起。

## 知识点详解

## 一、物理流复制链路

主库侧：

- backend 产生 WAL。
- WAL sender 把 WAL 发给备库。
- replication slot 可选，用于保留备库未消费 WAL。

备库侧：

- WAL receiver 接收 WAL。
- startup process 重放 WAL。
- hot standby 允许只读查询。

查看主库复制状态：

```sql
SELECT
  application_name,
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  write_lag,
  flush_lag,
  replay_lag,
  sync_state
FROM pg_stat_replication;
```

字段解释：

| 字段 | 含义 |
| --- | --- |
| `sent_lsn` | 主库已发送到备库的位置 |
| `write_lsn` | 备库已写入操作系统缓存的位置 |
| `flush_lsn` | 备库已刷盘的位置 |
| `replay_lsn` | 备库已重放的位置 |
| `write_lag` | 发送到写入延迟 |
| `flush_lag` | 发送到刷盘延迟 |
| `replay_lag` | 发送到重放延迟 |

备库侧：

```sql
SELECT
  pg_is_in_recovery(),
  pg_last_wal_receive_lsn(),
  pg_last_wal_replay_lsn(),
  now() - pg_last_xact_replay_timestamp() AS replay_delay;
```

## 二、同步复制的等待点

`synchronous_commit` 决定提交等待到哪里：

| 值 | 含义 |
| --- | --- |
| `off` | 不等 WAL 本地刷盘，延迟低但崩溃可能丢已返回事务 |
| `local` | 等本地 WAL 刷盘，不等同步备库 |
| `on` | 等同步备库 flush，常用同步提交语义 |
| `remote_write` | 等备库写入操作系统缓存 |
| `remote_apply` | 等备库重放完成，读备库可见 |

同步复制配置：

```conf
synchronous_standby_names = 'FIRST 1 (standby1, standby2)'
synchronous_commit = on
```

生产风险：

- 同步备库不可用可能拖慢或阻塞提交。
- 多机房同步复制会增加提交延迟。
- `remote_apply` 语义更强，但延迟更高。

## 三、复制槽的保留机制

复制槽记录消费者需要的最老 WAL 位置。主库不会删除该位置之后仍需要的 WAL。

```sql
SELECT
  slot_name,
  slot_type,
  active,
  restart_lsn,
  confirmed_flush_lsn
FROM pg_replication_slots;
```

风险处理：

- inactive slot 要确认是否仍需要。
- 逻辑订阅停止消费会保留 WAL。
- 物理备库长时间离线会保留 WAL。
- PostgreSQL 13 可用 `max_slot_wal_keep_size` 限制单槽保留上限，但达到上限后消费者可能断裂，需要重建。

## 四、PITR 恢复链路

PITR 的材料：

- 物理基础备份。
- 从基础备份开始连续的 WAL。
- 恢复配置。

PostgreSQL 13 恢复触发文件：

- `recovery.signal`：普通恢复。
- `standby.signal`：作为 standby 持续恢复。

示例：

```conf
restore_command = 'copy "D:\\pg_archive\\%f" "%p"'
recovery_target_time = '2026-06-06 10:30:00+08'
recovery_target_action = 'pause'
```

为什么 `recovery_target_action = pause` 有用：

- 可以先检查恢复点是否正确。
- 确认数据后再 `pg_wal_replay_resume()` 或 promote。

```sql
SELECT pg_is_wal_replay_paused();
SELECT pg_wal_replay_resume();
```

## 五、Timeline 和恢复后的分支

当你恢复到过去某个时间点并继续写入，就产生了和原主库不同的历史。PostgreSQL 用 timeline 区分它们。

生产影响：

- 旧备份和 WAL 归档要保留 timeline history 文件。
- 恢复时可能需要指定 `recovery_target_timeline = 'latest'`。
- 故障切换后旧主必须通过 `pg_rewind` 或重新 basebackup 接回，不能直接当备库启动。

## 六、pg_rewind

`pg_rewind` 用于把旧主回退到新主的历史线上，前提是它能找到分叉点后的 WAL 或启用了必要页面变化追踪条件。常见要求包括启用 data checksums 或 `wal_log_hints = on`。

典型流程：

1. 确认旧主已停止且不会再接受写入。
2. 确认新主可连接。
3. 对旧主运行 `pg_rewind` 指向新主。
4. 配置旧主作为 standby。
5. 启动并验证复制。

如果 rewind 条件不满足或 WAL 不足，重新做基础备份更安全。

## 七、逻辑复制深度边界

发布端：

```sql
CREATE PUBLICATION job_pub
FOR TABLE candidate, application;
```

订阅端：

```sql
CREATE SUBSCRIPTION job_sub
CONNECTION 'host=primary dbname=job_app user=repl password=change_me'
PUBLICATION job_pub;
```

边界：

- DDL 不自动复制。
- 序列当前值不自动同步。
- 大对象不按普通表逻辑复制处理。
- UPDATE/DELETE 需要 replica identity 找到目标行。
- 双向写入容易冲突，PostgreSQL 原生逻辑复制不是通用多主方案。

replica identity：

```sql
ALTER TABLE application REPLICA IDENTITY USING INDEX application_pkey;
-- 或在无合适键时：
ALTER TABLE application REPLICA IDENTITY FULL;
```

`FULL` 会记录整行用于匹配，WAL 量和应用成本更高。

## 八、复制延迟拆解

| 现象 | 可能原因 |
| --- | --- |
| `sent_lsn` 落后当前 WAL 很多 | WAL sender、网络或主库压力 |
| `write_lsn` 落后 `sent_lsn` | 备库接收或写入慢 |
| `flush_lsn` 落后 `write_lsn` | 备库磁盘刷写慢 |
| `replay_lsn` 落后 `flush_lsn` | 备库重放慢、长查询冲突、I/O 或锁 |
| `pg_last_xact_replay_timestamp` 延迟大 | 备库整体应用变更慢，或主库长时间无事务时需结合 LSN 判断 |

不要只看时间延迟。主库没有写入时，时间函数可能误导。要结合 LSN 差距。

## 九、Hot standby 查询冲突

备库查询使用快照，WAL 重放可能需要清理或修改同一数据。冲突时 PostgreSQL 可能取消备库查询，或者如果开启 `hot_standby_feedback`，备库告诉主库保留旧版本。

取舍：

- 不开 feedback：主库膨胀风险低，但备库长查询可能被取消。
- 开 feedback：备库查询更稳定，但主库可能因保留旧版本膨胀。

生产常见策略：

- 报表备库和高可用备库分开。
- 控制备库长查询。
- 监控主库膨胀和 `backend_xmin`。

## 十、高可用切换流程

手动切换核心步骤：

1. 判断主库确实不可用，避免误判。
2. 隔离旧主，防止继续写入。
3. 选择 WAL 最完整、延迟最小的备库。
4. promote 备库。
5. 更新 VIP、DNS、代理或服务发现。
6. 验证新主读写。
7. 处理旧主：pg_rewind 或重建。
8. 复盘是否有数据丢失和客户端错误。

脑裂防护比提升命令更重要。没有可靠 fencing 的自动切换风险很高。

## 例子：误删数据后的 PITR 决策

场景：

```sql
DELETE FROM application WHERE job_id = 100;
COMMIT;
```

处理流程：

1. 记录误操作时间和事务信息。
2. 停止进一步自动修复脚本，防止扩大影响。
3. 在隔离环境恢复到误操作前。
4. 校验缺失数据。
5. 导出需要恢复的数据。
6. 在原库用事务导入并验证约束。
7. 保留恢复记录。

不要直接把整个库回滚到过去，除非业务接受丢失误操作之后的所有合法写入。

## 实操任务

### 任务 1：搭建一主一备

用 `pg_basebackup -R` 建备库，确认：

```sql
SELECT pg_is_in_recovery();
```

主库查看：

```sql
SELECT application_name, state, sync_state
FROM pg_stat_replication;
```

### 任务 2：制造复制槽滞后

创建测试复制槽，停止消费者或备库，观察 `pg_replication_slots` 和 `pg_wal` 变化。只在测试环境执行。

### 任务 3：PITR 演练

执行基础备份、归档 WAL、插入标记数据、误删、恢复到误删前，并验证标记数据状态。

## 验收

- 能解释 LSN、timeline、WAL 重放和 promote。
- 能根据 `sent_lsn/write_lsn/flush_lsn/replay_lsn` 判断延迟阶段。
- 能说明同步复制各等待级别的取舍。
- 能写出 PITR 恢复步骤和验证方式。
- 能解释逻辑复制的 DDL、序列和 replica identity 边界。
- 能设计防脑裂的故障切换流程。

## 重点

- 复制不是备份，备份不是高可用。
- Timeline 是故障切换和 PITR 后必须理解的历史分支。
- 复制槽可靠但危险，必须监控 WAL 保留。
- 自动故障切换必须有 fencing 思路。

## 难点

- 故障切换时最难的是判断旧主是否彻底失去写入能力。
- PITR 恢复后如何只恢复误删数据，而不是回滚所有业务写入，需要结合业务和导入方案。

## 易错

> **易错：** promote 备库后让旧主自动重新连回来。
>
> 正确做法：旧主必须隔离，然后 pg_rewind 或重建，确认时间线一致后再加入。

> **易错：** 用备库做长报表查询，同时要求主库永不膨胀。
>
> 正确做法：明确 hot standby feedback 取舍，必要时拆分报表库和高可用备库。

> **易错：** 只看 `replay_delay` 判断复制状态。
>
> 正确做法：结合 LSN 差距、主库写入活跃度和 replay 时间判断。

