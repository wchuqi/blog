---
title: "PostgreSQL 13 面试知识点：慢 SQL 定位和 SQL 调优"
date: 2026-06-20
description: "先确认慢 SQL 的范围和证据，再判断根因。常见流程："
tags:
  - "数据库"
  - "PostgreSQL13"
  - "面试"
category: "数据库"
---

# PostgreSQL 13 面试知识点：慢 SQL 定位和 SQL 调优

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../PostgreSQL13学习资料.md)

## 一、慢 SQL 定位和 SQL 调优

### 1. 线上出现慢 SQL，你的排查流程是什么？

**参考答案：**

先确认慢 SQL 的范围和证据，再判断根因。常见流程：

1. 从应用监控、慢查询日志或 `pg_stat_statements` 确认 SQL、接口、时间段、调用次数和耗时。
2. 用 `pg_stat_activity` 查看当前是否有等待、长事务或连接堆积。
3. 用 `pg_blocking_pids` 和 `pg_locks` 判断是否锁等待。
4. 对可复现 SQL 执行 `EXPLAIN (ANALYZE, BUFFERS)`，看耗时节点、行数估算、loops、buffer 和临时文件。
5. 判断根因是索引缺失、统计信息失真、SQL 写法、数据量增长、参数不足还是并发阻塞。
6. 做最小改动并复测，记录变更前后数据和回滚方案。

> **重点：** 慢 SQL 排查要先分清“执行慢”和“等待慢”。
>
> **易错：** 不看锁等待就直接优化执行计划。

### 2. `pg_stat_statements` 怎么用于慢 SQL 定位？

**参考答案：**

`pg_stat_statements` 会按归一化 SQL 聚合调用次数、总耗时、平均耗时、返回行数和 buffer 指标。它适合找历史 Top SQL。

```sql
SELECT
  queryid,
  calls,
  total_exec_time,
  mean_exec_time,
  rows,
  shared_blks_read,
  temp_blks_written,
  left(query, 120) AS query_sample
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

分析时要分维度：

- `total_exec_time` 高：总资源消耗大。
- `mean_exec_time` 高：单次体验差。
- `calls` 高：可能有 N+1、轮询或缓存缺失。
- `shared_blks_read` 高：物理读压力大。
- `temp_blks_written` 高：排序、Hash 或聚合可能落盘。

> **重点：** PostgreSQL 13 常用字段是 `total_exec_time` 和 `mean_exec_time`。

### 3. 如何判断慢 SQL 是锁等待导致的？

**参考答案：**

看 `pg_stat_activity` 的等待事件和阻塞关系：

```sql
SELECT
  pid,
  wait_event_type,
  wait_event,
  pg_blocking_pids(pid) AS blocking_pids,
  now() - query_start AS age,
  left(query, 160) AS query_sample
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;
```

如果 SQL 大部分时间在等待锁，执行计划可能本身并不慢。处理时要找到阻塞源，优先取消影响大的 DDL 或异常事务；对 `idle in transaction` 持锁会话，评估后可终止连接。

> **难点：** 锁等待慢的根因通常是另一个会话，不是被阻塞 SQL 本身。

### 4. 阅读 `EXPLAIN (ANALYZE, BUFFERS)` 时重点看什么？

**参考答案：**

重点看：

- 实际耗时最高的节点。
- `rows` 和 `actual rows` 是否差异巨大。
- `loops` 是否放大内层扫描。
- `Buffers` 中 shared hit/read 的比例。
- 是否有 `Sort Method: external merge Disk`。
- Hash 是否分批，`Batches` 是否大于 1。
- `Rows Removed by Filter` 是否很多。

行数估算偏差大时，优先检查统计信息、数据倾斜、多列相关性和参数化 SQL 的计划问题。

> **重点：** `Buffers` 能帮助判断 SQL 是读太多数据、I/O 压力大，还是主要在内存中消耗 CPU。

### 5. 为什么有索引但 SQL 还是慢？

**参考答案：**

可能原因包括：

- 返回比例太高，顺序扫描更划算。
- 复合索引列顺序不匹配查询条件和排序。
- 查询条件对列做了函数、隐式类型转换或模糊匹配。
- 部分索引谓词没有被查询条件蕴含。
- 统计信息过旧导致优化器不用索引或选错 Join。
- 索引扫描后仍要大量回表或排序。
- SQL 返回列太多、结果集太大，瓶颈在传输或客户端处理。

> **易错：** 把“有没有索引”当成唯一判断标准。

### 6. 慢 SQL 调优有哪些常见改写方式？

**参考答案：**

常见方式：

- 把函数包列改成范围查询，例如 `date(created_at)` 改为时间范围。
- 深分页 `OFFSET` 改为游标分页。
- 只判断存在性时，用 `EXISTS` 替代 Join 后 `DISTINCT`。
- 列表页不要 `SELECT *`，避免返回大字段。
- 先过滤再 Join 或聚合，减少中间结果。
- 大批量更新拆批提交，避免长事务、锁和 WAL 峰值。
- 高频复杂统计改为预聚合、物化视图或缓存。

示例：

```sql
SELECT *
FROM application
WHERE created_at >= timestamp '2026-06-01 00:00:00'
  AND created_at <  timestamp '2026-06-02 00:00:00';
```

> **重点：** SQL 改写必须保证语义不变，并用执行计划和结果校验。

### 7. 如何设计用于慢 SQL 的索引？

**参考答案：**

先分析 SQL 的过滤条件、Join 条件、排序和返回比例。常见策略：

- 等值过滤列放复合索引前部。
- 范围列和排序列结合查询模式设计。
- 高频固定条件可用部分索引。
- 函数条件可用表达式索引。
- 列表页可用 `INCLUDE` 做覆盖索引，但 index-only scan 还依赖 visibility map。

```sql
CREATE INDEX CONCURRENTLY idx_application_job_status_created
ON application(job_id, status, created_at DESC);
```

> **难点：** 索引设计没有固定公式，必须结合 SQL、数据分布、写入成本和执行计划验证。

### 8. 统计信息如何影响慢 SQL？

**参考答案：**

优化器依赖统计信息估算选择率和行数。如果统计信息过期、采样不足、数据倾斜或多列相关性强，可能严重低估或高估行数，进而选错扫描方式、Join 顺序和 Join 算法。

处理方式：

```sql
ANALYZE application;

ALTER TABLE application ALTER COLUMN status SET STATISTICS 1000;
ANALYZE application;

CREATE STATISTICS st_application_job_status (dependencies, mcv)
ON job_id, status
FROM application;
ANALYZE application;
```

> **重点：** 行数估算错误是执行计划错误的常见源头。

### 9. `work_mem` 调大一定能解决慢 SQL 吗？

**参考答案：**

不一定。`work_mem` 影响排序、Hash Join、Hash Aggregate 等节点，但它是每个会话中每个操作节点都可能使用的内存。全局调大在高并发下可能导致内存耗尽。

正确做法是先确认是否存在排序落盘或 Hash 分批，再对具体会话或事务局部测试：

```sql
BEGIN;
SET LOCAL work_mem = '64MB';
EXPLAIN (ANALYZE, BUFFERS)
SELECT ...
ROLLBACK;
```

> **易错：** 看到临时文件就全局大幅调高 `work_mem`。

### 10. 调优后如何证明真的有效？

**参考答案：**

要用同类数据和同等条件复测，至少记录：

- 执行耗时：平均、最大、P95 或 P99。
- `EXPLAIN (ANALYZE, BUFFERS)` 前后对比。
- shared read/hit、temp blocks、返回行数。
- `pg_stat_statements` 中总耗时、平均耗时和调用次数变化。
- 新增索引带来的写入成本和磁盘增长。
- 错误率、锁等待、复制延迟是否恶化。

> **重点：** 只说“感觉快了”不是有效调优结论。

### 11. `pg_stat_statements` 为什么不能完全替代慢查询日志？

**参考答案：**

`pg_stat_statements` 是归一化 SQL 的聚合统计，适合看历史 Top SQL，但它有局限：

- 会隐藏具体参数值，数据倾斜时同一 queryid 内部可能有快有慢。
- 只统计已完成语句，当前卡住的语句要看 `pg_stat_activity`。
- 不直接告诉你锁等待占比。
- 累计值会受 reset、重启和统计窗口影响。
- SQL 文本可能被截断。

慢查询日志能看到单次慢 SQL、发生时间、pid、应用名和实际 SQL 文本。生产上两者要结合：日志看单次事件，`pg_stat_statements` 看整体消耗和趋势。

> **重点：** 聚合统计解决“谁总体消耗大”，日志解决“某次为什么慢”。

### 12. 什么是 generic plan 和 custom plan？它们为什么会导致慢 SQL？

**参考答案：**

custom plan 会根据本次实际参数生成计划；generic plan 会复用通用计划，减少规划成本。数据分布均匀时 generic plan 可能足够好；数据高度倾斜时，不同参数需要不同计划，generic plan 就可能对某些参数很差。

例如 `status='active'` 只占 1%，`status='archived'` 占 95%。前者适合索引扫描，后者可能顺序扫描更好。若 prepared statement 复用 generic plan，就可能造成偶发慢。

诊断方式：

```sql
SET plan_cache_mode = force_custom_plan;
EXPLAIN (ANALYZE, BUFFERS)
SELECT ...
```

> **难点：** 参数化 SQL 的慢可能不稳定，因为慢的不是 SQL 形状，而是某些参数值。

### 13. PostgreSQL 13 中 CTE 会如何影响 SQL 调优？

**参考答案：**

PostgreSQL 13 中，副作用安全且只引用一次的 CTE 通常可以被内联；多次引用的 CTE 默认更可能物化。物化会形成优化边界，可能阻止过滤条件下推，也可能避免重复计算。

可以用 `MATERIALIZED` 或 `NOT MATERIALIZED` 明确表达意图：

```sql
WITH recent_app AS NOT MATERIALIZED (
  SELECT *
  FROM application
  WHERE created_at >= now() - interval '30 days'
)
SELECT *
FROM recent_app
WHERE status = 'interview';
```

> **易错：** 认为 CTE 只是让 SQL 更好看，不影响计划。

### 14. 部分索引为什么有时不能被参数化 SQL 使用？

**参考答案：**

部分索引要求查询条件能蕴含索引谓词。例如：

```sql
CREATE INDEX idx_job_open_created
ON job(created_at DESC)
WHERE status = 'open';
```

常量条件 `WHERE status = 'open'` 可以匹配。但 prepared statement 中 `WHERE status = $1` 在 generic plan 阶段参数未知，优化器未必能证明 `$1` 一定是 `'open'`，因此可能不用部分索引。

处理方式包括拆分热点 SQL、使用常量化查询路径、对特定场景使用 custom plan，或重新设计索引。

> **重点：** 部分索引的关键不是“条件看起来一样”，而是优化器能否证明谓词成立。

### 15. 如何从等待事件判断慢 SQL 的方向？

**参考答案：**

看 `pg_stat_activity.wait_event_type`：

- `Lock`：先查阻塞链，不要先加索引。
- `IO`：结合 `EXPLAIN BUFFERS`、临时文件日志和磁盘指标。
- `ClientRead` / `ClientWrite`：可能是应用或网络慢，数据库在等客户端。
- `LWLock`：可能是内部高并发争用，需要结合 WAL、buffer、checkpoint、连接数分析。
- `BufferPin`：可能与长查询、游标、VACUUM 或页面访问冲突有关。

```sql
SELECT wait_event_type, wait_event, count(*)
FROM pg_stat_activity
WHERE state <> 'idle'
GROUP BY wait_event_type, wait_event
ORDER BY count(*) DESC;
```

> **重点：** 等待事件是当前状态采样，要结合时间线，不能只凭一次截图下结论。

### 16. B-tree 复合索引的列顺序为什么重要？

**参考答案：**

多列 B-tree 索引按列顺序组织。前导列等值条件最能缩小扫描范围，第一个范围条件可以限制扫描边界，范围列后面的列通常只能在索引扫描过程中继续过滤，不能同样有效地缩小起止范围。

```sql
CREATE INDEX idx_app_job_status_created
ON application(job_id, status, created_at DESC);
```

它适合：

```sql
WHERE job_id = ?
  AND status = ?
ORDER BY created_at DESC
LIMIT 20;
```

但不太适合只有 `status = ?` 的查询，因为缺少前导列 `job_id`。

> **易错：** 只背“最左前缀”，却不能解释扫描范围、排序和范围列之后的行为。

### 17. 生产事故中慢 SQL 应该先优化还是先止血？

**参考答案：**

先看影响面。严重影响线上时，先取证再止血，之后再长期修复。

止血动作包括：

- 取消问题 SQL：`pg_cancel_backend`。
- 必要时终止持锁长事务：`pg_terminate_backend`。
- 暂停报表或批任务。
- 应用限流、降级或切只读。
- 临时加必要索引或调整局部参数。

长期修复包括 SQL 改写、索引设计、统计信息治理、批处理拆分、报表预聚合、连接池和超时治理。

> **重点：** 事故处理要区分恢复服务和消除根因，不能长期依赖手工 kill SQL。
