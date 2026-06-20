---
title: "PostgreSQL 13 面试知识点：SQL、事务和 MVCC"
date: 2026-06-20
description: "常见理解顺序是："
tags:
  - "数据库"
  - "PostgreSQL13"
  - "面试"
category: "数据库"
---

# PostgreSQL 13 面试知识点：SQL、事务和 MVCC

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../PostgreSQL13学习资料.md)

## 一、SQL、事务和 MVCC

### 1. SQL 的逻辑执行顺序是什么？

**参考答案：**

常见理解顺序是：

```text
FROM/JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT -> DISTINCT -> ORDER BY -> LIMIT
```

这解释了为什么 `WHERE` 不能直接引用 `SELECT` 中定义的别名，而 `ORDER BY` 通常可以。

> **重点：** 这是逻辑处理顺序，不等于物理执行计划顺序。

### 2. `LEFT JOIN` 中条件放在 `ON` 和 `WHERE` 有什么区别？

**参考答案：**

`ON` 决定右表如何匹配，`WHERE` 是 join 结果生成后的过滤。如果把右表条件放到 `WHERE`，可能过滤掉右表为空的行，使 `LEFT JOIN` 变得像 `INNER JOIN`。

```sql
-- 保留没有投递的岗位
SELECT j.id, count(a.id)
FROM job j
LEFT JOIN application a
  ON a.job_id = j.id
 AND a.created_at >= now() - interval '7 days'
GROUP BY j.id;
```

> **易错：** 需要保留左表时，把右表过滤条件写进 `WHERE`。

### 3. `ON CONFLICT` 的前提是什么？

**参考答案：**

`ON CONFLICT` 需要冲突目标能匹配唯一约束或唯一索引。它常用于幂等写入，避免并发下“先查再插”的竞态。

```sql
INSERT INTO application(candidate_id, job_id, status)
VALUES (1, 2, 'submitted')
ON CONFLICT (candidate_id, job_id)
DO UPDATE SET status = EXCLUDED.status;
```

> **重点：** 并发唯一性应由数据库约束保证。

### 4. PostgreSQL 的 MVCC 是什么？

**参考答案：**

MVCC 是多版本并发控制。PostgreSQL 更新数据时会产生新的行版本，旧版本保留给仍需要旧快照的事务读取。查询根据事务快照判断哪个版本可见。这样普通读写可以减少互相阻塞。

代价是旧版本需要 VACUUM 清理，长事务会阻止旧版本回收，导致表和索引膨胀。

> **重点：** MVCC 提升读写并发，不代表没有锁。
>
> **难点：** 快照可见性、事务 ID 和 VACUUM 是一组联动机制。

### 5. PostgreSQL 13 支持哪些隔离级别？会脏读吗？

**参考答案：**

PostgreSQL 支持 READ COMMITTED、REPEATABLE READ、SERIALIZABLE。虽然 SQL 标准有 READ UNCOMMITTED，但 PostgreSQL 中 READ UNCOMMITTED 实际按 READ COMMITTED 处理，因此不会脏读。

READ COMMITTED 每条语句获取新快照；REPEATABLE READ 在事务内保持同一快照；SERIALIZABLE 会检测串行化冲突，必要时报错要求重试。

> **重点：** SERIALIZABLE 失败时应重试整个事务。

### 6. 长事务为什么会导致表膨胀？

**参考答案：**

长事务持有旧快照，VACUUM 不能删除仍可能被该快照看到的旧行版本。大量更新或删除后，dead tuple 无法回收，表和索引体积增长，查询和维护成本上升。

排查：

```sql
SELECT pid, state, now() - xact_start AS age, query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY age DESC;
```

> **易错：** 只看 active 慢查询，忽略 `idle in transaction`。

### 7. 如何排查锁等待？

**参考答案：**

先看等待事件，再关联 `pg_locks` 找阻塞源。

```sql
SELECT pid, wait_event_type, wait_event, state, query
FROM pg_stat_activity
WHERE wait_event_type IS NOT NULL;
```

找到阻塞源后，优先评估能否 `pg_cancel_backend(pid)`，最后才考虑 `pg_terminate_backend(pid)`。

> **重点：** 终止连接会回滚事务，必须评估业务影响。

### 8. 如何避免死锁？

**参考答案：**

常见做法：

- 多事务访问多行或多表时固定顺序。
- 缩短事务时间。
- 避免事务中等待用户输入或外部接口。
- 必要时提前 `SELECT ... FOR UPDATE` 锁定资源。
- 对死锁错误做事务级重试。

> **重点：** 死锁无法靠单条 SQL 完全消除，必须规范事务访问顺序。

