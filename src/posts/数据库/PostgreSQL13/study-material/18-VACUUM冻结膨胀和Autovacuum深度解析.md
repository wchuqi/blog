---
title: "PostgreSQL 13 学习资料：VACUUM、冻结、膨胀和 Autovacuum 深度解析"
date: 2026-06-20
description: "PostgreSQL 的 MVCC 让 UPDATE 和 DELETE 不会立刻物理删除旧版本。旧版本是否能清理，取决于是否仍可能被某个活跃事务看到。VACUUM 的职责是清理不再可见的旧版本，让空间可复用，更新可见性信息，并在必要时冻结很…"
tags:
  - "数据库"
  - "PostgreSQL13"
  - "深度解析"
category: "数据库"
---

# PostgreSQL 13 学习资料：VACUUM、冻结、膨胀和 Autovacuum 深度解析

[返回索引](../PostgreSQL13学习资料.md)

## 学习目标

- 理解 dead tuple、表膨胀、索引膨胀、visibility map 和 freeze 的关系。
- 掌握 autovacuum 触发公式、关键参数和生产调优方法。
- 能判断什么时候用 `VACUUM`、`VACUUM FULL`、`REINDEX CONCURRENTLY` 或分批重写。
- 能识别事务 ID 回卷风险，并制定监控和处理方案。

## 理论导读

PostgreSQL 的 MVCC 让 UPDATE 和 DELETE 不会立刻物理删除旧版本。旧版本是否能清理，取决于是否仍可能被某个活跃事务看到。VACUUM 的职责是清理不再可见的旧版本，让空间可复用，更新可见性信息，并在必要时冻结很老的事务 ID。

Autovacuum 是后台自动维护机制，但它不是无条件及时，也不是没有成本。它需要在“清理速度、业务负载、事务 ID 安全、统计信息准确性”之间平衡。如果参数过保守，大表会膨胀；如果过激进，可能和业务争 I/O、CPU 和锁。

## 核心心智模型

一张频繁更新的表像一个不断改稿的文档。每次修改都会留下旧稿，读者可能还在看旧稿，所以不能立刻扔掉。VACUUM 是清理人员，它只能扔掉没有读者再需要的旧稿。长事务就像一直拿着旧稿不还的人，会让清理人员无法收走任何相关旧版本。

## 知识点详解

## 一、Tuple 生命周期

简化生命周期：

```text
INSERT -> live tuple
UPDATE -> old version becomes dead after no snapshot needs it, new version live
DELETE -> old version becomes dead after no snapshot needs it
VACUUM -> removes dead tuple pointers or marks space reusable
FREEZE -> old xmin replaced by frozen marker to avoid xid wraparound
```

关键点：

- DELETE 不是立即释放磁盘空间。
- UPDATE 等价于旧版本失效加新版本插入。
- 普通 VACUUM 通常让空间在表内复用，不缩小操作系统看到的文件大小。
- `VACUUM FULL` 会重写表，释放磁盘空间，但需要强锁。

## 二、Autovacuum 触发公式

表级 VACUUM 触发大致由这类公式决定：

```text
dead_tuples > autovacuum_vacuum_threshold
              + autovacuum_vacuum_scale_factor * reltuples
```

ANALYZE 触发大致由：

```text
changed_tuples > autovacuum_analyze_threshold
                 + autovacuum_analyze_scale_factor * reltuples
```

默认 scale factor 对大表可能太宽松。比如 1 亿行表，`autovacuum_vacuum_scale_factor = 0.2` 意味着约 2000 万 dead tuples 才触发，已经很大。

大表常见局部参数：

```sql
ALTER TABLE application SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 50000,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_analyze_threshold = 50000
);
```

不要直接照抄。应按更新量、表大小、业务低峰和 I/O 能力测算。

## 三、Autovacuum 成本控制

相关参数：

| 参数 | 作用 |
| --- | --- |
| `autovacuum_max_workers` | 最多 autovacuum worker 数 |
| `autovacuum_naptime` | launcher 检查周期 |
| `autovacuum_vacuum_cost_limit` | 成本限额 |
| `autovacuum_vacuum_cost_delay` | 达到成本后休眠 |
| `maintenance_work_mem` | 维护操作内存 |
| `autovacuum_work_mem` | autovacuum 专用内存，未设时用 maintenance_work_mem |

如果 autovacuum 总是追不上，常见原因：

- worker 数太少。
- 大表触发太晚。
- cost delay 太保守。
- 长事务阻止清理。
- I/O 瓶颈。
- 索引太多，清理索引成本大。

PostgreSQL 13 支持 VACUUM 对索引清理使用并行 worker，这对大表多索引场景有帮助，但仍受 I/O 和维护内存影响。

## 四、Freeze 和事务 ID 回卷

PostgreSQL 事务 ID 是有限空间，会循环使用。为了避免旧事务 ID 被误判为未来事务，必须把很老的 tuple 冻结。冻结后的 tuple 被视为所有事务都可见。

监控数据库年龄：

```sql
SELECT
  datname,
  age(datfrozenxid) AS xid_age
FROM pg_database
ORDER BY xid_age DESC;
```

监控表年龄：

```sql
SELECT
  relname,
  age(relfrozenxid) AS xid_age,
  n_live_tup,
  n_dead_tup
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY age(relfrozenxid) DESC
LIMIT 20;
```

相关参数：

| 参数 | 作用 |
| --- | --- |
| `vacuum_freeze_min_age` | tuple 多老才考虑冻结 |
| `vacuum_freeze_table_age` | 表多老时积极扫描冻结 |
| `autovacuum_freeze_max_age` | 达到后强制防回卷 vacuum |

防回卷 autovacuum 优先级很高，不能轻易关闭。接近危险线时，数据库会越来越强硬地保护自己，极端情况下可能拒绝新事务以避免数据损坏。

## 五、膨胀如何形成

表膨胀来源：

- UPDATE/DELETE 产生 dead tuple。
- 长事务让 dead tuple 不能被清理。
- 空间虽被清理但无法被后续插入有效复用。
- fillfactor 不合适。
- 批量更新修改索引列，导致索引膨胀。

索引膨胀来源：

- 被索引列频繁更新。
- 删除或更新后旧索引条目等待清理。
- B-tree page split 后空间利用率下降。
- 随机 UUID 主键导致插入位置分散。

PostgreSQL 13 的 B-tree deduplication 能减少重复键索引体积，但不能解决所有索引膨胀。

## 六、监控和诊断

表 dead tuple：

```sql
SELECT
  relname,
  n_live_tup,
  n_dead_tup,
  round(100.0 * n_dead_tup / nullif(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
  last_autovacuum,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;
```

表和索引大小：

```sql
SELECT
  relname,
  pg_size_pretty(pg_relation_size(relid)) AS table_size,
  pg_size_pretty(pg_indexes_size(relid)) AS indexes_size,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;
```

长事务：

```sql
SELECT
  pid,
  usename,
  state,
  now() - xact_start AS xact_age,
  now() - query_start AS query_age,
  query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start;
```

## 七、VACUUM 命令选择

| 操作 | 是否释放文件给操作系统 | 锁影响 | 典型用途 |
| --- | --- | --- | --- |
| `VACUUM` | 通常不释放 | 较低 | 日常清理，空间复用 |
| `VACUUM (ANALYZE)` | 通常不释放 | 较低 | 清理并更新统计信息 |
| `VACUUM FULL` | 释放 | 需要强锁 | 紧急收缩表，停机窗口 |
| `REINDEX` | 重建索引 | 有锁影响 | 索引损坏或严重膨胀 |
| `REINDEX CONCURRENTLY` | 重建索引 | 更低阻塞 | 在线降低索引膨胀 |
| `CLUSTER` | 按索引重写表 | 需要强锁 | 重排物理顺序 |

生产优先级通常是：

1. 处理长事务和写入模式。
2. 调整 autovacuum。
3. 对索引使用 `REINDEX CONCURRENTLY`。
4. 对表考虑分区、批量迁移、逻辑重写。
5. 最后才在窗口内用 `VACUUM FULL`。

## 八、为什么 VACUUM 没有效果

常见原因：

- 存在长事务或复制反馈，oldest xmin 太老。
- 表仍然持续高频更新，清理速度低于产生速度。
- autovacuum 被成本限制压得太慢。
- 只看文件大小，以为普通 VACUUM 必须缩小文件。
- 索引膨胀严重，但只 vacuum 表。

检查 oldest xmin 相关线索：

```sql
SELECT
  pid,
  backend_xmin,
  now() - xact_start AS xact_age,
  state,
  query
FROM pg_stat_activity
WHERE backend_xmin IS NOT NULL
ORDER BY backend_xmin;
```

备库开启 `hot_standby_feedback` 时，也可能让主库保留旧版本，降低查询冲突但增加主库膨胀风险。

## 九、按表设置策略

高频更新小表：

```sql
ALTER TABLE session_state SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_vacuum_threshold = 1000,
  fillfactor = 70
);
```

只追加大表：

- 重点是分区、归档、索引控制和 ANALYZE。
- fillfactor 不需要太低。
- VACUUM 压力通常低于高频更新表。

事件日志表：

- 按时间分区。
- 过期数据通过 drop partition 删除。
- 避免对超大单表频繁 delete。

## 例子：删除大量历史数据的正确方式

风险做法：

```sql
DELETE FROM event_log
WHERE created_at < now() - interval '180 days';
```

如果一次删除几亿行，会产生大量 WAL、dead tuple、索引清理压力和复制延迟。

更好的策略：

- 预先按时间分区，删除历史分区。
- 如果不能分区，分批删除并控制事务大小。
- 删除后评估 VACUUM、索引膨胀和复制延迟。

分批示例：

```sql
WITH doomed AS (
  SELECT id
  FROM event_log
  WHERE created_at < now() - interval '180 days'
  ORDER BY id
  LIMIT 10000
)
DELETE FROM event_log e
USING doomed d
WHERE e.id = d.id;
```

应用或任务调度循环执行，每批提交一次。

## 实操任务

### 任务 1：观察 dead tuple

```sql
DROP TABLE IF EXISTS vacuum_lab;
CREATE TABLE vacuum_lab(id bigserial PRIMARY KEY, value text);

INSERT INTO vacuum_lab(value)
SELECT md5(g::text)
FROM generate_series(1, 200000) AS g;

UPDATE vacuum_lab SET value = md5(random()::text) WHERE id <= 100000;

SELECT relname, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
WHERE relname = 'vacuum_lab';

VACUUM (ANALYZE) vacuum_lab;
```

### 任务 2：验证长事务阻止清理

会话 A：

```sql
BEGIN;
SELECT count(*) FROM vacuum_lab;
```

会话 B：

```sql
UPDATE vacuum_lab SET value = md5(random()::text);
VACUUM vacuum_lab;
```

观察 dead tuple 和长事务。提交会话 A 后再 VACUUM。

### 任务 3：估算 HOT 比例

比较更新索引列和非索引列时 `n_tup_hot_upd` 的变化。

## 验收

- 能写出 autovacuum 触发公式并解释大表默认参数风险。
- 能说明 freeze 是为了解决事务 ID 回卷。
- 能解释普通 VACUUM 为什么不释放文件大小。
- 能判断长事务、复制反馈和 autovacuum 成本限制如何影响清理。
- 能为高频更新表、只追加表、日志表分别设计维护策略。

## 重点

- VACUUM 是 PostgreSQL MVCC 的必要维护，不是可选优化。
- 大表必须按表设置 autovacuum 参数，默认 scale factor 往往太宽。
- 防回卷 vacuum 是安全机制，不能粗暴关闭。
- 膨胀治理要处理根因，不能只做一次重写。

## 难点

- 膨胀是写入模式、长事务、索引设计、autovacuum 参数和复制反馈共同作用的结果。
- 释放磁盘空间和恢复性能不是一回事。普通 VACUUM、重建索引和表重写解决的问题不同。

## 易错

> **易错：** 看到表文件没变小，就认为 VACUUM 没用。
>
> 正确做法：普通 VACUUM 让空间可复用，并更新 VM 和统计信息。文件收缩需要重写表。

> **易错：** 大表沿用默认 autovacuum scale factor。
>
> 正确做法：按表大小和每日更新量设置更合理的阈值。

> **易错：** 在高峰期对大表执行 `VACUUM FULL`。
>
> 正确做法：评估锁、WAL、磁盘临时空间和停机窗口，优先考虑在线或分批方案。

