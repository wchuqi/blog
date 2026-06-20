---
title: "PostgreSQL 13 学习资料：慢 SQL 定位和 SQL 调优"
date: 2026-06-20
description: "慢 SQL 定位不是看到一条耗时长的 SQL 就直接加索引。PostgreSQL 中一条 SQL 的响应时间可能由多段时间组成：排队等待连接、等待锁、优化器生成计划、执行扫描和 Join、排序聚合、读取磁盘、写 WAL、向客户端返回结果。用…"
tags:
  - "数据库"
  - "PostgreSQL13"
category: "数据库"
---

# PostgreSQL 13 学习资料：慢 SQL 定位和 SQL 调优

[返回索引](../PostgreSQL13学习资料.md)

## 学习目标

- 能建立 PostgreSQL 13 慢 SQL 定位的证据链：日志、统计扩展、活动会话、锁等待、执行计划和系统资源。
- 能区分 SQL 本身慢、被锁拖慢、I/O 慢、统计信息失真、参数不足、应用调用方式异常。
- 能对慢 SQL 做最小化调优：改写 SQL、补索引、更新统计信息、局部调整参数、拆分批处理或修正数据模型。
- 能输出生产可用的调优报告，包括现象、影响面、根因、变更、回滚和复测指标。

## 理论导读

慢 SQL 定位不是看到一条耗时长的 SQL 就直接加索引。PostgreSQL 中一条 SQL 的响应时间可能由多段时间组成：排队等待连接、等待锁、优化器生成计划、执行扫描和 Join、排序聚合、读取磁盘、写 WAL、向客户端返回结果。用户感受到的慢，未必都发生在执行计划里。

调优的正确顺序是：先确认问题 SQL 和发生时间，再判断它慢在哪一层，然后只改一个主要变量并复测。没有复测指标的优化只能算猜测。生产中还要考虑副作用：新增索引会拖慢写入并增加膨胀，调大 `work_mem` 会放大并发内存风险，重写 SQL 可能改变语义，终止会话会回滚事务。

## 核心心智模型

把慢 SQL 当成一条流水线：

```text
应用请求 -> 连接池排队 -> PostgreSQL 后端进程 -> 等锁/等资源 -> 生成执行计划
        -> 扫描/Join/排序/聚合 -> 读写 buffer/WAL/临时文件 -> 返回结果
```

定位时不要只盯着 SQL 文本。要回答四个问题：

- 谁慢：哪类 SQL、哪个接口、哪个业务租户、哪个时间段。
- 慢在哪里：锁等待、扫描过多、Join 放大、排序落盘、I/O、CPU、返回行太多。
- 为什么现在慢：数据量增长、数据倾斜、统计信息过期、参数变化、发布改动、并发峰值。
- 怎么证明修好了：同样条件下耗时、buffer、临时文件、返回行数、调用次数和错误率改善。

## 知识点详解

### 1. 慢 SQL 观测入口

| 入口 | 适合回答 | PostgreSQL 13 注意点 |
| --- | --- | --- |
| 慢查询日志 | 哪些单次 SQL 超过阈值 | 需要配置 `log_min_duration_statement`，日志量可能很大 |
| `pg_stat_statements` | 哪些归一化 SQL 总耗时或平均耗时高 | 需要 `shared_preload_libraries` 并重启 |
| `pg_stat_activity` | 当前谁正在执行、等待什么 | 只代表现场，不代表历史 |
| `pg_locks` 和 `pg_blocking_pids` | 谁阻塞谁 | 锁等待慢不一定是执行计划问题 |
| `EXPLAIN (ANALYZE, BUFFERS)` | SQL 内部实际执行成本 | 会真实执行 SQL，写操作要谨慎 |
| `auto_explain` | 自动记录慢 SQL 的执行计划 | 适合临时诊断或灰度开启，注意日志开销 |
| 应用 APM/trace id | 慢 SQL 对应哪个接口和请求 | 需要应用设置 `application_name` 或日志关联 |

> **重点：** `pg_stat_statements` 看历史聚合，`pg_stat_activity` 看当前现场，执行计划看单条 SQL 的内部执行。

### 2. 慢查询日志配置

最小可用配置：

```conf
log_min_duration_statement = '500ms'
log_line_prefix = '%m [%p] user=%u,db=%d,app=%a,client=%h '
log_lock_waits = on
deadlock_timeout = '1s'
log_temp_files = 0
```

含义：

- `log_min_duration_statement`：记录超过阈值的语句。生产阈值要结合业务 SLA，常见从 200ms、500ms、1s 开始。
- `log_line_prefix`：把时间、pid、用户、库名、应用名、客户端写进日志，方便关联。
- `log_lock_waits`：记录超过 `deadlock_timeout` 的锁等待。
- `log_temp_files`：记录排序、Hash、物化等产生的临时文件。`0` 表示全部记录，生产可设置更高阈值。

重新加载配置：

```sql
SELECT pg_reload_conf();
```

> **易错：** 只开慢查询日志但没有 `application_name`、pid 或 trace id，事故后无法关联到具体服务和接口。
>
> 正确做法：应用连接串设置 `application_name`，日志前缀带 `%p` 和 `%a`，应用日志带 SQL 摘要或 trace id。

### 3. `pg_stat_statements` 定位 Top SQL

安装和启用：

```conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all
```

修改 `shared_preload_libraries` 后需要重启 PostgreSQL。数据库内创建扩展：

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

按总耗时找消耗大户：

```sql
SELECT
  queryid,
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) AS pct,
  rows,
  left(query, 160) AS query_sample
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

按平均耗时找单次很慢的 SQL：

```sql
SELECT
  queryid,
  calls,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round(max_exec_time::numeric, 2) AS max_ms,
  rows,
  left(query, 160) AS query_sample
FROM pg_stat_statements
WHERE calls >= 10
ORDER BY mean_exec_time DESC
LIMIT 20;
```

找读 buffer 多的 SQL：

```sql
SELECT
  queryid,
  calls,
  shared_blks_hit,
  shared_blks_read,
  temp_blks_read,
  temp_blks_written,
  left(query, 160) AS query_sample
FROM pg_stat_statements
ORDER BY shared_blks_read + temp_blks_read + temp_blks_written DESC
LIMIT 20;
```

> **重点：** 总耗时高代表总体资源消耗大，平均耗时高代表单次体验差，调用次数高代表应用调用方式可能有问题。

> **易错：** 只优化平均耗时最高的 SQL。
>
> 正确做法：同时看 `total_exec_time`、`mean_exec_time`、`calls`、`rows`、shared/temp blocks。一个 20ms 但每天调用千万次的 SQL，可能比单次 5s 的低频报表更值得先处理。

### 4. 当前现场快照

事故中先保存现场，不要直接重启数据库。基础快照：

```sql
SELECT now() AS snapshot_time;

SELECT
  pid,
  usename,
  datname,
  application_name,
  client_addr,
  state,
  wait_event_type,
  wait_event,
  now() - query_start AS query_age,
  now() - xact_start AS xact_age,
  left(query, 200) AS query_sample
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY query_age DESC NULLS LAST
LIMIT 50;
```

查看阻塞链：

```sql
SELECT
  a.pid AS blocked_pid,
  a.usename AS blocked_user,
  now() - a.query_start AS blocked_age,
  pg_blocking_pids(a.pid) AS blocking_pids,
  left(a.query, 160) AS blocked_query
FROM pg_stat_activity a
WHERE cardinality(pg_blocking_pids(a.pid)) > 0
ORDER BY blocked_age DESC;
```

查看阻塞源：

```sql
WITH blocked AS (
  SELECT unnest(pg_blocking_pids(pid)) AS blocking_pid
  FROM pg_stat_activity
)
SELECT
  a.pid,
  a.usename,
  a.application_name,
  a.state,
  now() - a.xact_start AS xact_age,
  now() - a.query_start AS query_age,
  left(a.query, 200) AS query_sample
FROM pg_stat_activity a
JOIN blocked b ON b.blocking_pid = a.pid
ORDER BY xact_age DESC NULLS LAST;
```

> **难点：** 锁等待慢的 SQL 在执行计划里可能并不慢。它真正慢的是等待别人释放锁。

### 5. 执行计划分析顺序

常用命令：

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT ...
```

分析顺序：

1. 先看总耗时和最耗时节点，不要从第一行开始逐字读。
2. 看 `actual rows` 和 `rows` 是否偏差大。
3. 看 `loops` 是否把内层扫描放大。
4. 看 `Buffers`：大量 `read` 更像 I/O，几乎都是 `hit` 更偏 CPU 或内存内扫描。
5. 看排序、Hash、聚合是否使用临时文件或分批。
6. 看过滤条件中过滤掉多少行，判断是否扫描过宽。
7. 看返回给客户端的行数是否过大。

典型异常：

| 计划现象 | 常见原因 | 调优方向 |
| --- | --- | --- |
| `Seq Scan` 过滤大量行 | 缺索引、条件不可索引、返回比例太高 | 建合适索引、改写条件、确认选择率 |
| `Nested Loop` 内层 `loops` 巨大 | 外表估算过小、内表索引不合适 | 更新统计信息、改索引、改写 Join |
| `actual rows` 远大于 `rows` | 统计信息过期、数据倾斜、多列相关 | `ANALYZE`、提高统计目标、扩展统计 |
| `Sort Method: external merge Disk` | 排序超出 `work_mem` | 优化排序输入、加索引支持排序、局部调 `work_mem` |
| `Hash Batches` 大于 1 | Hash 表内存不足 | 减少输入、局部调 `work_mem`、检查估算 |
| `Rows Removed by Filter` 很大 | 访问路径不精准 | 复合索引、部分索引、表达式索引 |

> **重点：** 行数估算错误是很多慢 SQL 的根。它会连带影响扫描方式、Join 顺序、Join 算法和内存估算。

### 6. SQL 调优常见手段

#### 6.1 谓词可索引化

不要把索引列包在函数里，除非有表达式索引：

```sql
-- 不利于普通 created_at 索引
SELECT *
FROM application
WHERE date(created_at) = date '2026-06-01';

-- 更利于范围扫描
SELECT *
FROM application
WHERE created_at >= timestamp '2026-06-01 00:00:00'
  AND created_at <  timestamp '2026-06-02 00:00:00';
```

大小写不敏感查询可用表达式索引：

```sql
CREATE INDEX idx_candidate_lower_email
ON candidate (lower(email));

SELECT *
FROM candidate
WHERE lower(email) = lower('User@example.com');
```

#### 6.2 深分页改写

`OFFSET` 越深，数据库越需要跳过大量行：

```sql
-- 深分页成本随页码增长
SELECT id, candidate_id, created_at
FROM application
ORDER BY id
OFFSET 100000 LIMIT 20;

-- 游标分页更稳定
SELECT id, candidate_id, created_at
FROM application
WHERE id > 100000
ORDER BY id
LIMIT 20;
```

#### 6.3 `EXISTS` 替代不必要的 Join 去重

只判断是否存在时，不要把子表 Join 进来再 `DISTINCT`：

```sql
-- 容易放大再去重
SELECT DISTINCT c.id, c.name
FROM candidate c
JOIN application a ON a.candidate_id = c.id
WHERE a.status = 'interview';

-- 更贴合语义
SELECT c.id, c.name
FROM candidate c
WHERE EXISTS (
  SELECT 1
  FROM application a
  WHERE a.candidate_id = c.id
    AND a.status = 'interview'
);
```

#### 6.4 避免返回过多列和过多行

```sql
-- 不推荐给列表页直接取大字段
SELECT *
FROM job
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 50;

-- 列表页只取必要列，详情页再按主键取详情
SELECT id, title, city, salary_min, salary_max, created_at
FROM job
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 50;
```

#### 6.5 批处理分片执行

大批量更新会持锁、产生大量 WAL、拖慢复制和 autovacuum：

```sql
-- 每批处理一小段主键范围，由应用循环提交
UPDATE application
SET archived = true
WHERE id >= 100000
  AND id < 101000
  AND status IN ('rejected', 'withdrawn');
```

> **易错：** 把一个几千万行更新放进单个事务，导致锁、WAL、复制延迟和回滚成本同时放大。

### 7. 索引调优决策

索引不是越多越好。新增索引前先回答：

- 这条 SQL 的过滤、排序、Join 条件是什么。
- 预计返回表的百分之几。
- 是否服务高频路径或关键 SLA。
- 是否会增加高频写入表的维护成本。
- 是否可以用复合索引同时服务过滤和排序。
- 是否适合部分索引或表达式索引。

复合索引例子：

```sql
CREATE INDEX idx_application_job_status_created
ON application(job_id, status, created_at DESC);
```

适合：

```sql
SELECT id, candidate_id, created_at
FROM application
WHERE job_id = 1001
  AND status = 'interview'
ORDER BY created_at DESC
LIMIT 20;
```

部分索引例子：

```sql
CREATE INDEX idx_job_open_created
ON job(created_at DESC)
WHERE status = 'open';
```

适合开放岗位远少于总岗位，且查询总是带 `status = 'open'`。

检查无用或低价值索引时要结合业务周期，不能只看短时间窗口：

```sql
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, idx_tup_read ASC
LIMIT 30;
```

> **重点：** 删除索引比新增索引风险更隐蔽。先确认统计窗口、业务周期、约束依赖和回滚方案。

### 8. 统计信息调优

统计信息过期或粒度不足会导致计划选错：

```sql
ANALYZE application;
```

提高单列统计目标：

```sql
ALTER TABLE application ALTER COLUMN status SET STATISTICS 1000;
ANALYZE application;
```

多列相关性使用扩展统计：

```sql
CREATE STATISTICS st_application_job_status (dependencies, mcv)
ON job_id, status
FROM application;

ANALYZE application;
```

查看统计信息：

```sql
SELECT
  attname,
  n_distinct,
  most_common_vals,
  most_common_freqs,
  histogram_bounds
FROM pg_stats
WHERE schemaname = 'public'
  AND tablename = 'application';
```

> **难点：** 多列组合条件慢，不一定是缺复合索引，也可能是优化器不知道这些列之间有关联。

### 9. 参数和资源调优边界

常见局部参数：

```sql
BEGIN;
SET LOCAL work_mem = '64MB';
EXPLAIN (ANALYZE, BUFFERS)
SELECT ...
ROLLBACK;
```

参数影响：

| 参数 | 影响 | 风险 |
| --- | --- | --- |
| `work_mem` | 排序、Hash Join、Hash Aggregate | 每个节点每个会话都可能使用，不能按单连接估算 |
| `maintenance_work_mem` | 建索引、VACUUM、ALTER TABLE 等维护操作 | 维护任务并发时会放大内存使用 |
| `random_page_cost` | 优化器对随机 I/O 成本的估计 | 盲目调低可能过度偏向索引 |
| `effective_cache_size` | 优化器估算可用缓存 | 不是实际分配内存 |
| `track_io_timing` | 统计 I/O 时间 | 有少量开销，适合诊断时开启或评估后长期打开 |

> **易错：** 用全局参数掩盖单条 SQL 问题。
>
> 正确做法：优先优化访问路径和行数，再考虑局部参数。全局参数变更要经过容量估算和压测。

### 10. 慢 SQL 根因分层决策树

生产排查要先分类，再深入。下面这棵树可以作为现场判断顺序：

```text
慢 SQL
  -> 是否只在应用侧慢？
       -> 连接池排队、网络传输、客户端取数、ORM N+1、应用锁
  -> 数据库侧是否在等待？
       -> Lock、LWLock、IO、Client、Timeout、IPC、BufferPin
  -> 是否单次执行计划慢？
       -> 扫描过宽、Join 放大、排序/Hash 落盘、聚合数据量大
  -> 是否计划选错？
       -> 统计信息过期、数据倾斜、多列相关、参数化 generic plan
  -> 是否并发下才慢？
       -> 锁竞争、buffer 争用、I/O 饱和、checkpoint、autovacuum、WAL
  -> 是否业务模型导致？
       -> 深分页、实时大报表、冷热数据混表、大事务批量更新
```

每一层对应不同证据：

| 分类 | 核心证据 | 常见误判 |
| --- | --- | --- |
| 应用侧慢 | APM、连接池指标、客户端 fetch 耗时 | 误以为数据库执行慢 |
| 锁等待 | `pg_blocking_pids`、`wait_event_type='Lock'` | 给被阻塞 SQL 加索引 |
| I/O 慢 | `Buffers read`、`track_io_timing`、系统 I/O | 只看 SQL 总耗时 |
| CPU 慢 | 大量 shared hit、复杂表达式、排序聚合 | 误判为磁盘慢 |
| 计划错误 | 估算行数和实际行数差很多 | 强行关闭某类 Join |
| 业务模式问题 | 调用次数、返回行数、接口语义 | 只做数据库局部优化 |

> **重点：** SQL 调优不是单点技能，而是“观测 -> 分类 -> 验证 -> 最小修复”的诊断链。

### 11. 等待事件：慢在哪里等

`pg_stat_activity.wait_event_type` 能帮助判断 SQL 是否正在等待资源。PostgreSQL 13 常见类型包括：

| wait_event_type | 说明 | 慢 SQL 关联 |
| --- | --- | --- |
| `Lock` | 等待 heavyweight lock | DDL、行更新、外键检查、显式锁 |
| `LWLock` | 等待轻量锁 | buffer、WAL、锁管理等内部竞争 |
| `BufferPin` | 等待 buffer pin 释放 | 游标、长查询、VACUUM 或页面访问冲突 |
| `IO` | 等待文件读写 | 大扫描、临时文件、WAL、数据文件 |
| `Client` | 等客户端发送或接收 | 客户端取数慢、网络慢、应用没有及时消费 |
| `IPC` | 进程间通信 | 并行查询、后台进程协作 |
| `Timeout` | 等待超时事件 | sleep、锁超时、复制等待等 |

现场查询：

```sql
SELECT
  wait_event_type,
  wait_event,
  state,
  count(*) AS sessions
FROM pg_stat_activity
WHERE state <> 'idle'
GROUP BY wait_event_type, wait_event, state
ORDER BY sessions DESC;
```

判断方式：

- `Lock` 多：先看阻塞链，不要先看索引。
- `ClientRead` 或 `ClientWrite` 多：可能是应用或网络慢，数据库后端在等客户端。
- `IO` 多：结合 `EXPLAIN BUFFERS`、临时文件日志和系统磁盘指标。
- `LWLock` 多：可能是高并发内部争用，需要结合版本、热点页、WAL、checkpoint 和连接数看。

> **难点：** `wait_event` 是当前瞬间状态，不等于整条 SQL 的完整耗时结构。要结合日志、采样和执行计划。

### 12. `pg_stat_statements` 的局限和基线管理

`pg_stat_statements` 很强，但不能替代全部诊断：

- 它按归一化 SQL 聚合，会隐藏具体参数值。数据倾斜场景下，同一个 queryid 可能有的参数快、有的参数慢。
- 它记录的是已经完成的语句，当前卡住未完成的语句要看 `pg_stat_activity`。
- 它不直接告诉你锁等待占比。
- 重启、扩展 reset 或统计清理会影响历史窗口。
- SQL 文本可能被截断，受 `track_activity_query_size` 影响。

建议建立快照表保存基线：

```sql
CREATE TABLE IF NOT EXISTS dba_pgss_snapshot AS
SELECT now() AS snapshot_time, *
FROM pg_stat_statements
WHERE false;

INSERT INTO dba_pgss_snapshot
SELECT now() AS snapshot_time, s.*
FROM pg_stat_statements s;
```

对比两个窗口时要看差值，而不是只看累计值。简化示例：

```sql
WITH latest AS (
  SELECT DISTINCT ON (queryid) *
  FROM dba_pgss_snapshot
  ORDER BY queryid, snapshot_time DESC
),
previous AS (
  SELECT DISTINCT ON (queryid) *
  FROM dba_pgss_snapshot
  WHERE snapshot_time < (SELECT max(snapshot_time) FROM dba_pgss_snapshot)
  ORDER BY queryid, snapshot_time DESC
)
SELECT
  l.queryid,
  l.calls - p.calls AS delta_calls,
  l.total_exec_time - p.total_exec_time AS delta_exec_ms,
  left(l.query, 120) AS query_sample
FROM latest l
JOIN previous p USING (queryid)
WHERE l.calls > p.calls
ORDER BY delta_exec_ms DESC
LIMIT 20;
```

> **易错：** 在累计运行几个月的 `pg_stat_statements` 上直接看 Top SQL，可能被历史峰值误导。
>
> 正确做法：按固定时间窗口采样，面向“最近 5 分钟、1 小时、1 天”的增量分析。

### 13. `auto_explain`：抓住线上慢计划

当慢 SQL 难以复现，或参数导致计划差异很大时，可以用 `auto_explain` 把慢语句的执行计划写进日志。

会话级诊断示例：

```sql
LOAD 'auto_explain';
SET auto_explain.log_min_duration = '500ms';
SET auto_explain.log_analyze = on;
SET auto_explain.log_buffers = on;
SET auto_explain.log_timing = on;
SET auto_explain.log_nested_statements = on;
```

生产使用原则：

- 先在单个会话、灰度实例或低峰期开启。
- 阈值不能过低，否则日志量和执行开销会放大。
- `log_analyze = on` 会实际采集运行信息，诊断价值高但开销更高。
- 对高频短 SQL 不适合全量记录执行计划。

> **重点：** `auto_explain` 的价值是捕获“真实参数 + 真实并发 + 真实数据分布”下的计划。

### 14. 索引匹配规则要理解到访问路径

#### 14.1 B-tree 复合索引的扫描边界

PostgreSQL 13 的多列 B-tree 索引不是简单的“最左前缀口诀”就能解释清楚。更准确的理解是：

- 前导列的等值条件最能缩小扫描范围。
- 第一个范围条件可以继续限定扫描起止边界。
- 范围列后面的列仍可在索引中检查，但通常不能继续大幅缩小扫描区间。
- 如果排序方向和索引顺序匹配，索引可以避免额外排序。

例子：

```sql
CREATE INDEX idx_app_job_status_created
ON application(job_id, status, created_at DESC);
```

适合：

```sql
WHERE job_id = 1001
  AND status = 'interview'
ORDER BY created_at DESC
LIMIT 20;
```

不理想：

```sql
WHERE status = 'interview'
ORDER BY created_at DESC
LIMIT 20;
```

因为缺少前导列 `job_id` 条件，索引不能高效定位到某个连续小范围。

#### 14.2 部分索引的谓词蕴含

部分索引只有在优化器能证明查询条件蕴含索引谓词时才会使用：

```sql
CREATE INDEX idx_job_open_created
ON job(created_at DESC)
WHERE status = 'open';
```

可匹配：

```sql
SELECT *
FROM job
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 20;
```

不一定匹配：

```sql
PREPARE q(text) AS
SELECT *
FROM job
WHERE status = $1
ORDER BY created_at DESC
LIMIT 20;
```

原因是 generic plan 阶段参数值未知，优化器可能不能证明 `$1` 一定等于 `'open'`。

#### 14.3 表达式索引必须表达式一致

```sql
CREATE INDEX idx_candidate_lower_email
ON candidate (lower(email));
```

只有查询也使用可匹配表达式时才有意义：

```sql
SELECT *
FROM candidate
WHERE lower(email) = 'a@example.com';
```

> **难点：** “有索引但不用”经常不是优化器错误，而是 SQL 条件没有落到这个索引能高效支持的访问路径上。

### 15. Prepared Statement、generic plan 和参数敏感 SQL

很多后端框架会使用预编译语句。PostgreSQL 会在 custom plan 和 generic plan 之间权衡：

- custom plan：每次根据实际参数重新规划，能利用具体参数选择更合适路径，但规划成本更高。
- generic plan：复用通用计划，规划成本低，但无法针对具体参数值优化。

数据倾斜时，generic plan 容易出问题。例如：

```sql
-- active 只占 1%，archived 占 95%
SELECT *
FROM application
WHERE status = $1
ORDER BY created_at DESC
LIMIT 50;
```

`status='active'` 可能适合索引扫描，`status='archived'` 可能顺序扫描更划算。如果复用 generic plan，就可能对其中一种参数很慢。

诊断：

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM application
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 50;

EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM application
WHERE status = 'archived'
ORDER BY created_at DESC
LIMIT 50;

SET plan_cache_mode = force_custom_plan;
```

处理思路：

- 对高度倾斜条件拆 SQL，让热点值和普通值走不同 SQL。
- 对热点子集建部分索引。
- 用 `plan_cache_mode` 做诊断或局部兜底，不要无脑全局调整。
- 结合应用框架的 prepared statement 策略排查。

> **重点：** 参数化 SQL 慢，不一定是索引问题，也可能是计划缓存策略和数据倾斜叠加。

### 16. CTE、子查询和优化边界

PostgreSQL 13 中，副作用安全且只引用一次的 CTE 通常可以被内联；被多次引用的 CTE 默认更可能物化。你可以用 `MATERIALIZED` 或 `NOT MATERIALIZED` 明确表达优化边界。

可能不理想：

```sql
WITH all_app AS MATERIALIZED (
  SELECT *
  FROM application
  WHERE created_at >= now() - interval '30 days'
)
SELECT *
FROM all_app
WHERE status = 'interview';
```

如果物化结果很大，后续过滤就晚了。可尝试：

```sql
WITH all_app AS NOT MATERIALIZED (
  SELECT *
  FROM application
  WHERE created_at >= now() - interval '30 days'
)
SELECT *
FROM all_app
WHERE status = 'interview';
```

但 `NOT MATERIALIZED` 不是总是更好。如果 CTE 结果很小且被多次引用，物化一次可能更划算。

> **易错：** 把 CTE 当成纯粹的语法美化。
>
> 正确做法：在 PostgreSQL 13 里要关注 CTE 是否成为优化边界，结合执行计划判断是否物化、是否重复计算。

### 17. Join、聚合和临时文件的深层原因

排序、Hash Join、Hash Aggregate 变慢，通常不是“内存小”一个原因，而是输入规模、估算、算法和并发共同作用。

关键观察点：

| 计划节点 | 深层原因 | 处理方向 |
| --- | --- | --- |
| `Sort` 落盘 | 输入行太多、排序键无索引、`work_mem` 不足 | 减少输入、利用索引顺序、局部提高 `work_mem` |
| `Hash Join` 分批 | hash 表超内存、估算过低 | 更新统计、减少 build side、局部内存 |
| `HashAggregate` 落盘或慢 | 分组基数高、输入大 | 预聚合、索引辅助、分批、改报表策略 |
| `GroupAggregate` 前排序 | 没有可用顺序 | 复合索引、减少输入、改聚合路径 |
| `Nested Loop` 放大 | 外层实际行数大、内层重复扫描 | 修正估算、换 Join 路径、补 Join 键索引 |

PostgreSQL 13 还可以关注 `hash_mem_multiplier`。它控制 Hash 类操作可使用内存相对 `work_mem` 的倍数。它能缓解 Hash 分批，但同样有并发内存风险。

```sql
SHOW work_mem;
SHOW hash_mem_multiplier;
```

> **重点：** 临时文件是结果，不是根因。根因通常是输入太大、计划估算错、排序/聚合语义不可避免，或内存预算不匹配。

### 18. 生产止血和长期修复要分开

线上事故中，目标不是一步到位调优，而是先恢复服务，再根治。

| 阶段 | 目标 | 可选动作 | 风险 |
| --- | --- | --- | --- |
| 现场取证 | 保留证据 | 保存 `pg_stat_activity`、阻塞链、Top SQL、日志 | 取证太慢会延误止血 |
| 止血 | 降低影响 | 取消问题 SQL、限流、暂停报表、切只读、临时加索引 | 取消或终止会回滚事务 |
| 修复 | 消除根因 | SQL 改写、索引、统计信息、批处理拆分 | 需要发布和验证 |
| 复盘 | 防止复发 | 基线、报警、SQL 评审、容量规划 | 只写结论不落监控会复发 |

取消和终止：

```sql
SELECT pg_cancel_backend(12345);
SELECT pg_terminate_backend(12345);
```

`pg_cancel_backend` 只取消当前查询，连接还在；`pg_terminate_backend` 会断开连接并回滚事务。生产优先取消，除非会话持锁、长事务或已经失控。

> **易错：** 把止血动作当长期修复。例如长期依赖手工 kill SQL，说明缺少 SQL 治理、超时控制或报表隔离。

### 19. 慢 SQL 调优报告模板

```markdown
## 慢 SQL 调优报告

- 时间范围：
- 业务接口 / application_name：
- SQL 摘要 / queryid：
- 现象：平均耗时、最大耗时、总耗时、调用次数、错误率
- 影响面：接口、用户、批任务、主库/备库
- 现场证据：日志、pg_stat_statements、pg_stat_activity、阻塞链、执行计划
- 根因判断：锁等待 / 计划错误 / 索引缺失 / 统计信息 / SQL 写法 / 资源瓶颈
- 变更方案：SQL 改写、索引、ANALYZE、局部参数、批处理拆分
- 风险和回滚：索引删除、SQL 回退、参数恢复、发布回滚
- 复测结果：耗时、Buffers、临时文件、返回行数、调用次数
```

## 例子

### 例子 1：招聘系统岗位列表慢

现象：岗位列表按城市、状态和创建时间排序，接口偶发超过 2 秒。

原 SQL：

```sql
SELECT id, title, city, salary_min, salary_max, created_at
FROM job
WHERE status = 'open'
  AND city = 'Shanghai'
ORDER BY created_at DESC
LIMIT 20;
```

定位：

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, city, salary_min, salary_max, created_at
FROM job
WHERE status = 'open'
  AND city = 'Shanghai'
ORDER BY created_at DESC
LIMIT 20;
```

如果计划显示 `Seq Scan` 过滤大量关闭岗位，并额外排序，可建立部分复合索引：

```sql
CREATE INDEX CONCURRENTLY idx_job_open_city_created
ON job(city, created_at DESC)
WHERE status = 'open';
```

复测关注：

- 是否从 `Seq Scan + Sort` 变为 `Index Scan`。
- `Buffers shared read` 是否下降。
- `actual time` 是否下降。
- 写入岗位状态变更是否受到可接受影响。

### 例子 2：投递统计 SQL 慢

原 SQL：

```sql
SELECT j.id, j.title, count(a.id) AS application_count
FROM job j
LEFT JOIN application a ON a.job_id = j.id
WHERE j.company_id = 10
GROUP BY j.id, j.title
ORDER BY application_count DESC
LIMIT 20;
```

如果公司岗位很多、投递表巨大，这个查询可能 Join 后再聚合大量数据。可先收窄岗位，再聚合投递：

```sql
WITH target_jobs AS (
  SELECT id, title
  FROM job
  WHERE company_id = 10
)
SELECT tj.id, tj.title, count(a.id) AS application_count
FROM target_jobs tj
LEFT JOIN application a ON a.job_id = tj.id
GROUP BY tj.id, tj.title
ORDER BY application_count DESC
LIMIT 20;
```

配套索引：

```sql
CREATE INDEX CONCURRENTLY idx_job_company_id ON job(company_id);
CREATE INDEX CONCURRENTLY idx_application_job_id ON application(job_id);
```

如果这是高频榜单接口，更好的方案可能是预聚合表或缓存，而不是每次实时全量聚合。

### 例子 3：参数敏感计划导致偶发慢

现象：同一个岗位投递列表接口，大多数请求几十毫秒，少数请求数秒。`pg_stat_statements` 中 queryid 相同，但 `max_exec_time` 远高于 `mean_exec_time`。

SQL：

```sql
SELECT id, candidate_id, status, created_at
FROM application
WHERE status = $1
ORDER BY created_at DESC
LIMIT 50;
```

排查思路：

1. 从应用日志拿到慢请求的实际参数。
2. 分别用高选择性和低选择性参数执行 `EXPLAIN (ANALYZE, BUFFERS)`。
3. 使用 `SET plan_cache_mode = force_custom_plan` 对比 custom plan。
4. 如果不同参数最佳计划差异明显，考虑拆分 SQL 或部分索引。

可能方案：

```sql
CREATE INDEX CONCURRENTLY idx_application_active_created
ON application(created_at DESC)
WHERE status = 'active';
```

注意：只有查询条件明确包含 `status = 'active'` 时，部分索引才稳定可用。参数化 generic plan 未必能用它。

### 例子 4：CTE 物化导致过滤下推失败

现象：报表 SQL 把最近 90 天投递先放进 CTE，再按状态和岗位筛选，临时文件很多。

```sql
WITH recent_app AS MATERIALIZED (
  SELECT *
  FROM application
  WHERE created_at >= now() - interval '90 days'
)
SELECT job_id, count(*)
FROM recent_app
WHERE status = 'interview'
GROUP BY job_id
ORDER BY count(*) DESC
LIMIT 20;
```

优化方向：

```sql
SELECT job_id, count(*)
FROM application
WHERE created_at >= now() - interval '90 days'
  AND status = 'interview'
GROUP BY job_id
ORDER BY count(*) DESC
LIMIT 20;
```

配套思路：

- 避免先物化大量中间结果。
- 让过滤条件尽早进入基表扫描。
- 对固定状态和时间范围评估复合索引或部分索引。
- 高频报表考虑预聚合，而不是每次实时扫 90 天。

## 练习

1. 开启慢查询日志，构造一条超过阈值的 SQL，并在日志中找到 pid、应用名、耗时和 SQL。
2. 安装 `pg_stat_statements`，分别按总耗时、平均耗时、调用次数、临时块读写找 Top 10 SQL。
3. 构造一个锁等待场景，用 `pg_blocking_pids` 找阻塞源，并说明为什么执行计划不能解释这类慢。
4. 构造一个 `date(created_at)` 条件导致索引无法使用的案例，改写为范围条件并复测。
5. 构造一个深分页查询，比较 `OFFSET` 和游标分页的执行计划。
6. 构造多列相关数据，创建扩展统计前后比较估算行数变化。
7. 写一份慢 SQL 调优报告，必须包含变更前后 `EXPLAIN (ANALYZE, BUFFERS)`。
8. 构造一个参数敏感查询，对比常量 SQL、prepared statement、`force_custom_plan` 的计划差异。
9. 构造一个 CTE 物化案例，对比 `MATERIALIZED`、`NOT MATERIALIZED` 和直接改写的计划。
10. 构造一个排序落盘案例，分别用减少输入、索引支持排序、局部 `work_mem` 三种方式优化并比较副作用。

## 验收

- 能说清慢 SQL 的观测入口和各自局限。
- 能用 `pg_stat_statements` 找出总消耗大户和单次慢 SQL。
- 能在现场区分执行慢和锁等待慢。
- 能阅读执行计划中的行数偏差、loops、Buffers、排序落盘和 Hash 分批。
- 能根据 SQL 语义设计复合索引、部分索引或表达式索引。
- 能用 `ANALYZE`、统计目标和扩展统计修正估算问题。
- 能给出生产调优的风险、回滚和复测指标。
- 能解释 B-tree 复合索引扫描边界、部分索引谓词蕴含和表达式索引匹配规则。
- 能识别 generic plan、CTE 物化、排序落盘、Hash 分批等深层慢 SQL 原因。
- 能区分生产止血动作和长期修复方案。

## 重点

- 慢 SQL 定位要形成证据链，不能只凭经验加索引。
- `pg_stat_statements` 的 Top SQL 要同时看总耗时、平均耗时、调用次数和 buffer 指标。
- 锁等待、连接池排队和客户端取数慢不一定能从执行计划里看出来。
- SQL 调优优先减少扫描行数和中间结果，再考虑参数。
- 新增索引必须评估写入成本、磁盘成本、维护成本和回滚方案。
- `wait_event_type` 能帮助区分等待慢和执行慢。
- 参数敏感 SQL 要关注 generic plan 与 custom plan 的差异。
- CTE、子查询、视图不是单纯写法问题，它们可能改变优化器能否下推过滤和重排 Join。

## 难点

- 同一条 SQL 在不同参数、不同数据分布、不同并发状态下可能走不同计划。
- 行数估算错误会级联影响 Join 顺序、Join 算法、排序和内存使用。
- 生产慢 SQL 往往同时包含 SQL 问题、统计信息问题、锁等待和应用调用问题，需要分层拆解。
- 参数调优有并发乘法效应，单条 SQL 测试结果不能直接推广为全局配置。
- PostgreSQL 13 的计划选择受统计信息、成本参数、缓存假设和计划缓存共同影响，慢 SQL 常常不是单一原因。
- 生产环境中临时文件、锁等待、客户端等待和 WAL 压力可能互相叠加，必须结合时间线分析。

## 易错

> **易错：** 一看到慢 SQL 就创建单列索引。
>
> 正确做法：先看查询谓词、排序、Join 条件、返回比例和执行计划，再决定复合索引、部分索引、表达式索引或 SQL 改写。

> **易错：** 只看 `EXPLAIN` 不看 `EXPLAIN ANALYZE`。
>
> 正确做法：`EXPLAIN` 只展示估算计划，`EXPLAIN ANALYZE` 才能看到实际行数和耗时。写 SQL 测试要在事务中谨慎执行并回滚。

> **易错：** 线上直接 `CREATE INDEX`。
>
> 正确做法：生产高并发表优先考虑 `CREATE INDEX CONCURRENTLY`，并评估执行时间、失败后的 invalid index 清理和磁盘空间。

> **易错：** 调优后只说“快了”，没有保留数据。
>
> 正确做法：记录变更前后的耗时、Buffers、临时文件、调用次数、返回行数和计划变化。
