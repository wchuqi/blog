---
title: "PostgreSQL 13 学习资料：存储结构、WAL 和 Checkpoint 深度解析"
date: 2026-06-20
description: "PostgreSQL 的表不是一个抽象的二维表直接躺在磁盘上。每张表和索引都对应一个 relation，relation 被切成一个或多个物理文件，每个文件再切成固定大小的 block。默认 block size 是 8KB。Postgre…"
tags:
  - "数据库"
  - "PostgreSQL13"
  - "深度解析"
category: "数据库"
---

# PostgreSQL 13 学习资料：存储结构、WAL 和 Checkpoint 深度解析

[返回索引](../PostgreSQL13学习资料.md)

## 学习目标

- 理解一张表在磁盘上如何被拆成 relation 文件、segment、block、page 和 tuple。
- 理解 heap tuple、索引 tuple、TOAST、FSM、visibility map 和 HOT update 的作用。
- 能解释 WAL 写入、事务提交、checkpoint、崩溃恢复和归档恢复之间的关系。
- 能把生产现象，例如 WAL 暴涨、checkpoint 抖动、表膨胀、index-only scan 不稳定，映射到底层结构。

## 理论导读

PostgreSQL 的表不是一个抽象的二维表直接躺在磁盘上。每张表和索引都对应一个 relation，relation 被切成一个或多个物理文件，每个文件再切成固定大小的 block。默认 block size 是 8KB。PostgreSQL 的读写单位通常围绕这些 block 展开。

理解存储结构的意义在于，很多看似 SQL 层的问题其实来自存储层。例如更新一行不一定覆盖旧行，可能写出一个新 tuple；大字段可能被拆到 TOAST 表；索引扫描后仍然要访问 heap 判断可见性；checkpoint 太频繁会让大量脏页集中刷盘；WAL 归档失败会让 `pg_wal` 增长。

可以把 PostgreSQL 的存储理解为两套互相配合的账：

- 数据文件：当前和历史行版本的实际仓库。
- WAL：变更流水，用来保证崩溃后能把仓库恢复到一致状态。

## 核心心智模型

### 1. Page 是最小管理单元

表文件像一本账册，page 是固定大小的账页。每一页里有页头、行指针数组、空闲空间和 tuple 数据。行指针稳定地指向 tuple，这让 PostgreSQL 可以在页内移动 tuple 而不立刻改变外部引用。

简化结构：

```text
heap relation file
  segment 0
    block/page 0
      page header
      line pointers
      free space
      heap tuples
    block/page 1
    ...
  segment 1
```

### 2. Tuple 不是纯业务字段

heap tuple 除了业务字段，还有事务可见性相关元信息，例如 `xmin`、`xmax`、`ctid` 和 hint bits。你可以通过系统列观察：

```sql
SELECT xmin, xmax, ctid, *
FROM candidate
LIMIT 5;
```

- `xmin`：创建该 tuple 版本的事务 ID。
- `xmax`：删除或替换该 tuple 版本的事务 ID，未删除时通常为 0。
- `ctid`：物理位置，形式类似 `(page, item)`。

`ctid` 会在 UPDATE 或 VACUUM FULL 后变化，不应作为业务标识。

### 3. WAL 是先写日志，不是备份文件

WAL 的核心规则是 write-ahead：数据页落盘前，对应 WAL 必须先持久化。事务提交时，提交记录相关 WAL 刷到持久存储后，事务才可认为提交成功。数据页可以稍后由 checkpoint 或 background writer 写入磁盘。

这解释了两个重要现象：

- 崩溃后，数据页可能不是最新，但 WAL 可以重放。
- 提交延迟和 `synchronous_commit`、磁盘刷写能力、WAL 写入压力有关。

## 知识点详解

## 一、Relation、文件和 fork

PostgreSQL 中每个表、索引、TOAST 表等对象都有 relfilenode。一个 relation 通常包含多个 fork：

| fork | 文件后缀 | 作用 |
| --- | --- | --- |
| main | 无后缀 | 存储主要数据 |
| fsm | `_fsm` | free space map，记录页内可用空间 |
| vm | `_vm` | visibility map，记录页是否全可见或全冻结 |
| init | `_init` | unlogged relation 初始化用 |

查看对象文件：

```sql
SELECT pg_relation_filepath('candidate');
SELECT pg_relation_size('candidate');
SELECT pg_total_relation_size('candidate');
```

`pg_relation_size` 只看 main fork，`pg_total_relation_size` 包含索引、TOAST 等关联对象。

### 为什么有 FSM

INSERT 或 UPDATE 需要找有足够空闲空间的 page。如果没有 FSM，数据库可能要扫描很多页才能找到空位。FSM 像一张粗粒度地图，告诉执行器哪些 page 大概还有空间。

### 为什么有 VM

visibility map 记录某些 page 的 tuple 对所有事务都可见。它对两个场景特别关键：

- Index-only scan：如果索引返回的 heap page 标记为 all-visible，就可以少访问 heap。
- VACUUM：可以跳过一些不需要清理的 page。

这就是为什么覆盖索引建好了也不一定稳定触发 index-only scan。表频繁更新时 VM 位经常被清掉，查询仍要回 heap 做可见性检查。

## 二、Heap tuple 和 UPDATE 的真实过程

普通 UPDATE 通常不是原地覆盖。简化过程：

1. 找到旧 tuple。
2. 在旧 tuple 的 `xmax` 写入当前事务 ID，表示它被当前事务删除或替换。
3. 插入一个新 tuple，新 tuple 的 `xmin` 是当前事务 ID。
4. 新 tuple 的 `ctid` 指向自己，旧 tuple 的 `ctid` 可能指向新版本。
5. 索引是否需要新增条目取决于是否 HOT update。

观察示例：

```sql
CREATE TABLE mvcc_demo(id int PRIMARY KEY, name text, note text);
INSERT INTO mvcc_demo VALUES (1, 'alice', 'v1');

SELECT xmin, xmax, ctid, * FROM mvcc_demo;

UPDATE mvcc_demo SET note = 'v2' WHERE id = 1;
SELECT xmin, xmax, ctid, * FROM mvcc_demo;
```

普通 SELECT 只会看到当前快照可见的版本，但旧版本可能仍在页面中，直到 VACUUM 可以清理。

## 三、HOT update

HOT 是 heap-only tuple。它解决的问题是：如果 UPDATE 没有修改任何被索引引用的列，理论上没有必要为所有索引都插入新条目。PostgreSQL 可以把新版本放在同一 heap page 上，通过 HOT chain 连接旧版本和新版本，索引仍指向链头。

触发 HOT update 的关键条件：

- 被更新的列没有出现在任何索引中。
- 同一个 heap page 有足够空间容纳新 tuple。

为什么 `fillfactor` 会影响 HOT：

```sql
CREATE TABLE hot_demo(
  id bigint PRIMARY KEY,
  status text,
  payload text
) WITH (fillfactor = 80);
```

较低 fillfactor 会在 page 中预留空间，让后续 UPDATE 更可能在同页写新版本，提升 HOT 机会。但它会增加表初始体积，适合更新频繁的表，不适合只追加表。

查看 HOT 统计：

```sql
SELECT
  relname,
  n_tup_upd,
  n_tup_hot_upd,
  round(100.0 * n_tup_hot_upd / nullif(n_tup_upd, 0), 2) AS hot_ratio
FROM pg_stat_user_tables
ORDER BY n_tup_upd DESC;
```

## 四、TOAST：大字段如何存储

PostgreSQL 单个 page 默认 8KB，行不能无限大。对于 `text`、`bytea`、`jsonb` 等可变长大字段，PostgreSQL 会使用 TOAST：

- 尝试压缩。
- 压缩后仍太大，则拆分存储到关联 TOAST 表。
- 主表中保存指向 TOAST 数据的引用。

TOAST 的生产影响：

- `SELECT *` 会把大字段也取出，增加 I/O 和网络传输。
- 更新大字段可能产生大量 TOAST 数据和 WAL。
- `pg_total_relation_size` 才能看到表、索引和 TOAST 的总占用。

查看 TOAST：

```sql
SELECT
  c.relname AS table_name,
  t.relname AS toast_table
FROM pg_class c
JOIN pg_class t ON c.reltoastrelid = t.oid
WHERE c.relname = 'candidate_profile';
```

## 五、WAL 写入路径

一次事务提交的简化路径：

```text
SQL 修改数据
  -> 修改共享缓冲区中的 page，标记 dirty
  -> 生成 WAL record，放入 WAL buffer
  -> COMMIT 时按 synchronous_commit 策略刷 WAL
  -> 返回提交成功
  -> 数据页稍后由后台写入或 checkpoint 写入
```

关键配置：

| 参数 | 作用 | 深度理解 |
| --- | --- | --- |
| `wal_level` | WAL 记录级别 | `replica` 支持物理复制，`logical` 支持逻辑解码 |
| `fsync` | 是否要求内核刷盘 | 生产不应关闭，否则崩溃后可能损坏 |
| `synchronous_commit` | 提交等待策略 | 可在延迟和持久性之间取舍 |
| `wal_buffers` | WAL 缓冲区 | 高写入系统可能受影响 |
| `full_page_writes` | checkpoint 后首次改页写整页镜像 | 防止 torn page，生产通常保持 on |
| `max_wal_size` | checkpoint 触发相关上限 | 太小会 checkpoint 频繁 |

### full page writes 为什么重要

磁盘或文件系统可能只写入了一个 8KB page 的一部分就崩溃，称为 torn page。checkpoint 后某页第一次被修改时，PostgreSQL 会把整页镜像写入 WAL。恢复时如果发现数据页不完整，可以用 WAL 中的整页镜像修复。

代价是 checkpoint 后写入高峰会产生更多 WAL。不要因为 WAL 多就随意关闭 `full_page_writes`。

## 六、Checkpoint 的机制和风险

Checkpoint 的目标是缩短崩溃恢复时间。它会保证某个 LSN 之前的脏页已经写入数据文件。崩溃后只需要从最近 checkpoint 开始重放 WAL。

但 checkpoint 也带来 I/O 压力。过于频繁会出现：

- 大量脏页集中刷盘。
- 前台查询和写入等待 I/O。
- WAL 生成峰值和磁盘延迟抖动。

相关参数：

| 参数 | 作用 |
| --- | --- |
| `checkpoint_timeout` | 时间触发 checkpoint |
| `max_wal_size` | WAL 增长触发 checkpoint |
| `checkpoint_completion_target` | checkpoint 写出尽量摊开的比例 |
| `checkpoint_warning` | checkpoint 过频日志提醒 |

检查 checkpoint 状态：

```sql
SELECT
  checkpoints_timed,
  checkpoints_req,
  checkpoint_write_time,
  checkpoint_sync_time,
  buffers_checkpoint,
  buffers_clean,
  buffers_backend
FROM pg_stat_bgwriter;
```

如果 `checkpoints_req` 增长很快，通常说明 `max_wal_size` 偏小或写入峰值过大。

## 七、崩溃恢复、归档恢复和流复制的统一视角

WAL 是三件事的共同基础：

| 场景 | WAL 的作用 |
| --- | --- |
| 崩溃恢复 | 从 checkpoint 后重放，恢复一致状态 |
| PITR | 从基础备份开始，重放归档 WAL 到目标点 |
| 物理复制 | 主库发送 WAL，备库接收并重放 |

所以只要涉及恢复和复制，就必须关注 WAL 连续性、归档可靠性、复制延迟和磁盘容量。

## 例子：一次 UPDATE 为什么会造成 WAL、膨胀和索引维护

```sql
CREATE TABLE update_cost_demo (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  status text NOT NULL,
  payload text
);

CREATE INDEX idx_update_cost_demo_status ON update_cost_demo(status);

INSERT INTO update_cost_demo(email, status, payload)
SELECT
  'u' || g || '@example.com',
  'new',
  repeat('x', 200)
FROM generate_series(1, 100000) AS g;

UPDATE update_cost_demo
SET status = 'active'
WHERE id <= 50000;
```

这次 UPDATE 发生了什么：

- heap 中 50000 行旧版本被标记为过期，新版本被插入。
- `status` 被索引引用，所以索引也需要新增或调整条目，HOT 机会降低。
- 产生 WAL，记录 heap 和 index 变化。
- 旧版本等待 VACUUM 清理。
- VM 位被清除，相关 page 的 index-only scan 可能需要回表。

## 实操任务

### 任务 1：观察 HOT update

```sql
DROP TABLE IF EXISTS hot_lab;

CREATE TABLE hot_lab (
  id int PRIMARY KEY,
  status text,
  note text
) WITH (fillfactor = 70);

INSERT INTO hot_lab
SELECT g, 'new', repeat('x', 100)
FROM generate_series(1, 10000) AS g;

UPDATE hot_lab SET note = note || 'a' WHERE id <= 5000;

SELECT relname, n_tup_upd, n_tup_hot_upd
FROM pg_stat_user_tables
WHERE relname = 'hot_lab';
```

然后给 `note` 建索引，再重复更新，比较 HOT 比例。

### 任务 2：观察 checkpoint 触发

```sql
SELECT checkpoints_timed, checkpoints_req
FROM pg_stat_bgwriter;
```

在测试环境大量写入，再观察 `checkpoints_req` 是否增长。不要在生产环境用压测 SQL 随意制造写入峰值。

### 任务 3：观察 TOAST

```sql
DROP TABLE IF EXISTS toast_lab;

CREATE TABLE toast_lab (
  id bigserial PRIMARY KEY,
  payload text
);

INSERT INTO toast_lab(payload)
SELECT repeat(md5(g::text), 1000)
FROM generate_series(1, 1000) AS g;

SELECT
  pg_size_pretty(pg_relation_size('toast_lab')) AS main_size,
  pg_size_pretty(pg_total_relation_size('toast_lab')) AS total_size;
```

## 验收

- 能解释 relation、fork、page、tuple、TOAST 的关系。
- 能说明 `ctid` 为什么不能当业务主键。
- 能解释 UPDATE 为什么会制造旧版本和 WAL。
- 能说明 HOT update 的条件和 fillfactor 的取舍。
- 能从 `pg_stat_bgwriter` 判断 checkpoint 是否过频。
- 能解释崩溃恢复、PITR 和物理复制为什么都依赖 WAL。

## 重点

- PostgreSQL 的 UPDATE 通常是新版本写入，不是简单原地覆盖。
- WAL 先于数据页落盘，是持久性和恢复能力的核心。
- checkpoint 是恢复时间和 I/O 压力之间的平衡。
- TOAST、VM、FSM、HOT 都是理解性能和膨胀问题的关键。

## 难点

- SQL 层只看到一行被更新，存储层可能涉及 heap 新旧版本、多个索引、WAL、VM 位变化和后续 VACUUM。
- `full_page_writes` 增加 WAL，但它保护 torn page。不能只看空间成本。

## 易错

> **易错：** 看到 WAL 增长就直接删除 `pg_wal` 文件。
>
> 正确做法：查写入量、归档失败、复制槽滞后和备份状态。手工删除 WAL 可能导致数据库无法恢复或备库断裂。

> **易错：** 把 `VACUUM` 理解为立即缩小表文件。
>
> 正确做法：普通 VACUUM 主要让空间可复用，文件收缩通常需要重写表，例如 `VACUUM FULL`、`CLUSTER` 或重建。

> **易错：** 认为 index-only scan 只取决于索引列是否覆盖查询。
>
> 正确做法：还要看 visibility map。频繁更新的表即使有覆盖索引，也可能大量回 heap。

