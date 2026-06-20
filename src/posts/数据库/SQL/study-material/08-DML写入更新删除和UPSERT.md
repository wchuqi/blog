---
title: "SQL 学习资料：DML写入更新删除和UPSERT"
date: 2026-06-20
description: "读 SQL 错了通常是结果错；写 SQL 错了可能直接破坏数据。DML 必须把正确性、并发和可回滚性放在第一位。真实系统中，重复投递、库存扣减、状态流转都不能靠“先查再写”的应用层判断保证，因为并发请求会同时通过检查。正确做法是用唯一约束、…"
tags:
  - "数据库"
  - "SQL"
category: "数据库"
---

# SQL 学习资料：DML写入更新删除和UPSERT

[返回索引](../SQL学习资料.md)

## 学习目标

- 掌握 INSERT、UPDATE、DELETE 的安全写法。
- 理解幂等写入和 UPSERT。
- 避免无 WHERE 更新删除、并发查重和批量写入风险。

## 理论导读

读 SQL 错了通常是结果错；写 SQL 错了可能直接破坏数据。DML 必须把正确性、并发和可回滚性放在第一位。真实系统中，重复投递、库存扣减、状态流转都不能靠“先查再写”的应用层判断保证，因为并发请求会同时通过检查。正确做法是用唯一约束、事务和原子写入表达业务不变量。

## INSERT

```sql
INSERT INTO applications (application_id, candidate_id, job_id, status, applied_at, source)
VALUES (1006, 2, 201, 'screening', '2026-03-06 09:00:00', 'website');
```

## UPDATE

```sql
UPDATE applications
SET status = 'interviewing'
WHERE application_id = 1003
  AND status = 'screening';
```

带旧状态条件可以避免状态被并发覆盖。

## DELETE

```sql
DELETE FROM interviews
WHERE interview_id = 3;
```

生产中删除前建议先查：

```sql
SELECT *
FROM interviews
WHERE interview_id = 3;
```

## UPSERT

PostgreSQL：

```sql
INSERT INTO applications (application_id, candidate_id, job_id, status, applied_at, source)
VALUES (1007, 1, 101, 'screening', '2026-03-06 09:00:00', 'website')
ON CONFLICT (candidate_id, job_id)
DO UPDATE SET
    status = EXCLUDED.status,
    applied_at = EXCLUDED.applied_at;
```

MySQL：

```sql
INSERT INTO applications (application_id, candidate_id, job_id, status, applied_at, source)
VALUES (1007, 1, 101, 'screening', '2026-03-06 09:00:00', 'website')
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    applied_at = VALUES(applied_at);
```

SQL Server/Oracle 有 `MERGE`，但不同数据库的 `MERGE` 并发语义和坑不同，生产使用要看官方文档和锁策略。

## 安全写操作清单

- 先 SELECT 确认影响范围。
- WHERE 条件尽量包含主键、唯一键或状态条件。
- 事务中执行关键写操作。
- 依赖唯一约束防重复。
- 批量更新删除先小批量验证。
- 记录审计字段和变更日志。

## 练习

1. 插入一条投递记录。
2. 把 screening 状态更新为 interviewing，要求旧状态匹配。
3. 尝试重复插入同一候选人同一岗位，观察唯一约束。
4. 写 PostgreSQL 或 MySQL 的 UPSERT。

## 验收

- 能解释为什么应用层查重不可靠。
- 能写带状态条件的 UPDATE。
- 能说明 UPSERT 依赖唯一约束。

## 重点

- 数据正确性要让数据库约束参与。
- UPDATE/DELETE 没有 WHERE 是高危操作。

## 难点

- UPSERT 的语法和并发语义强依赖数据库方言。

## 易错

> **易错：** `SELECT` 不存在后再 `INSERT`，以为能防并发重复。
>
> 正确做法：建立唯一约束，并用 INSERT 冲突处理或捕获唯一冲突。

