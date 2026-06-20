---
title: "SQL 学习资料：子查询CTE和派生表"
date: 2026-06-20
description: "复杂 SQL 不应该写成一团。子查询、派生表和 CTE 的作用是把中间结果命名，让查询更接近业务推导过程。但数据库优化器可能会内联、物化或重写它们，不同数据库策略不同。所以你既要利用 CTE 提高可读性，也要通过执行计划确认性能。"
tags:
  - "数据库"
  - "SQL"
category: "数据库"
---

# SQL 学习资料：子查询CTE和派生表

[返回索引](../SQL学习资料.md)

## 学习目标

- 掌握标量子查询、IN/EXISTS 子查询、相关子查询、派生表和 CTE。
- 理解 CTE 是组织查询的工具，不一定总会提升性能。
- 能用分层思维拆解复杂 SQL。

## 理论导读

复杂 SQL 不应该写成一团。子查询、派生表和 CTE 的作用是把中间结果命名，让查询更接近业务推导过程。但数据库优化器可能会内联、物化或重写它们，不同数据库策略不同。所以你既要利用 CTE 提高可读性，也要通过执行计划确认性能。

## 标量子查询

```sql
SELECT
    c.name,
    (SELECT COUNT(*)
     FROM applications a
     WHERE a.candidate_id = c.candidate_id) AS application_count
FROM candidates c;
```

相关子查询每处理外层一行都依赖外层值。优化器可能改写为 JOIN，也可能执行成本较高。

## 派生表

```sql
SELECT job_id, application_count
FROM (
    SELECT job_id, COUNT(*) AS application_count
    FROM applications
    GROUP BY job_id
) t
WHERE application_count >= 2;
```

## CTE

```sql
WITH job_stats AS (
    SELECT job_id, COUNT(*) AS application_count
    FROM applications
    GROUP BY job_id
)
SELECT j.title, s.application_count
FROM job_stats s
JOIN jobs j ON j.job_id = s.job_id;
```

## EXISTS 与 IN

```sql
SELECT c.*
FROM candidates c
WHERE EXISTS (
    SELECT 1
    FROM applications a
    WHERE a.candidate_id = c.candidate_id
);
```

`EXISTS` 表达存在性，遇到 NULL 的语义通常比 `IN/NOT IN` 更稳妥。

## 练习

1. 用 CTE 统计每个岗位投递数，再连接岗位名称。
2. 用相关子查询统计每个候选人投递数。
3. 把相关子查询改写为 JOIN + GROUP BY。
4. 对比 `NOT IN` 和 `NOT EXISTS` 在 NULL 下的结果。

## 验收

- 能说明 CTE、派生表、子查询的用途。
- 能解释相关子查询潜在性能风险。
- 能用 EXISTS 表达半连接和反连接。

## 重点

- CTE 提升可读性，但性能要看执行计划。

## 难点

- 不同数据库对 CTE 物化和内联策略不同，迁移时必须验证。

## 易错

> **易错：** 以为用了 CTE 就一定更快。
>
> 正确做法：CTE 先服务可读性，性能必须通过执行计划和测试验证。

