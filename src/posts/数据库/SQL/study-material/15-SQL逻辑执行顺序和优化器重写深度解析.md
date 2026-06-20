---
title: "SQL 学习资料：SQL逻辑执行顺序和优化器重写深度解析"
date: 2026-06-20
description: "SQL 的书写顺序、逻辑顺序和物理执行顺序是三件事。书写顺序是人写出来的语法；逻辑顺序用于定义结果语义；物理顺序由优化器选择。优化器可以把过滤提前、调整 JOIN 顺序、把子查询改成半连接、消除不必要列，但它不能随意改变 SQL 语义。真正…"
tags:
  - "数据库"
  - "SQL"
  - "深度解析"
category: "数据库"
---

# SQL 学习资料：SQL逻辑执行顺序和优化器重写深度解析

[返回索引](../SQL学习资料.md)

## 学习目标

- 精确理解 SQL 逻辑执行顺序。
- 区分语义层顺序和优化器物理计划。
- 理解谓词下推、投影裁剪、子查询改写、JOIN 重排等优化器行为。
- 能判断哪些改写不改变结果，哪些改写会因 NULL、外连接、聚合而改变语义。

## 理论导读

SQL 的书写顺序、逻辑顺序和物理执行顺序是三件事。书写顺序是人写出来的语法；逻辑顺序用于定义结果语义；物理顺序由优化器选择。优化器可以把过滤提前、调整 JOIN 顺序、把子查询改成半连接、消除不必要列，但它不能随意改变 SQL 语义。真正难的是知道哪些条件可以被安全下推，哪些因为外连接、NULL 或聚合边界不能下推。

## 逻辑顺序

```text
FROM / JOIN
  -> ON
  -> 外连接补 NULL
  -> WHERE
  -> GROUP BY
  -> 聚合计算
  -> HAVING
  -> SELECT
  -> DISTINCT
  -> ORDER BY
  -> OFFSET / FETCH / LIMIT
```

这个顺序解释了：

- 为什么 `WHERE` 不能直接使用聚合函数。
- 为什么 SELECT 别名通常不能在 WHERE 中使用。
- 为什么 LEFT JOIN 后 WHERE 右表条件会丢行。
- 为什么 ORDER BY 可以使用 SELECT 别名。

## 谓词下推

原 SQL：

```sql
SELECT *
FROM (
    SELECT *
    FROM applications
) a
WHERE a.job_id = 101;
```

优化器可能改写为：

```sql
SELECT *
FROM applications
WHERE job_id = 101;
```

这是安全的，因为过滤行不会改变派生表语义。

## 外连接下推风险

```sql
SELECT c.name, a.status
FROM candidates c
LEFT JOIN applications a
  ON a.candidate_id = c.candidate_id
WHERE a.status = 'screening';
```

这个 WHERE 发生在补 NULL 之后，会过滤掉未匹配候选人。如果把条件放到 ON：

```sql
LEFT JOIN applications a
  ON a.candidate_id = c.candidate_id
 AND a.status = 'screening'
```

语义变成保留所有候选人，只匹配 screening 投递。两者不是等价改写。

## JOIN 重排

内连接通常满足交换律和结合律，优化器可以重排：

```text
(A JOIN B) JOIN C
A JOIN (B JOIN C)
```

但外连接、半连接、反连接、带非等值条件的连接，重排空间受语义限制。优化器能不能重排取决于数据库实现和查询条件。

## 子查询改写

```sql
SELECT c.*
FROM candidates c
WHERE EXISTS (
    SELECT 1
    FROM applications a
    WHERE a.candidate_id = c.candidate_id
);
```

优化器可能改写为半连接。这样避免 JOIN 后产生重复候选人。

`NOT IN` 则因为 NULL 语义更复杂，不一定能等价改成普通反连接。

## 聚合边界

聚合前过滤和聚合后过滤不同：

```sql
WHERE status = 'screening'
GROUP BY job_id
```

表示只统计 screening 行。

```sql
GROUP BY job_id
HAVING SUM(CASE WHEN status = 'screening' THEN 1 ELSE 0 END) > 0
```

表示统计所有行，但保留至少有一个 screening 的组。

## 例子：错误改写

原需求：查询所有岗位及其 screening 投递数，没投递也显示 0。

正确：

```sql
SELECT
    j.job_id,
    j.title,
    COUNT(a.application_id) AS screening_count
FROM jobs j
LEFT JOIN applications a
  ON a.job_id = j.job_id
 AND a.status = 'screening'
GROUP BY j.job_id, j.title;
```

错误：

```sql
SELECT
    j.job_id,
    j.title,
    COUNT(a.application_id) AS screening_count
FROM jobs j
LEFT JOIN applications a
  ON a.job_id = j.job_id
WHERE a.status = 'screening'
GROUP BY j.job_id, j.title;
```

第二条会丢掉没有 screening 投递的岗位。

## 练习

1. 写出一条含 LEFT JOIN、WHERE、GROUP BY 的逻辑执行顺序。
2. 找出哪些 WHERE 条件可以安全移动到 ON，哪些不行。
3. 把 `EXISTS` 查询和 JOIN + DISTINCT 查询对比语义和行数。

## 验收

- 能说明逻辑顺序和物理计划的区别。
- 能解释外连接过滤条件位置的语义差异。
- 能判断优化器改写的安全边界。

## 重点

- 优化器可以改变执行方式，但不能改变查询语义。

## 难点

- NULL、外连接和聚合会限制很多看似自然的改写。

## 易错

> **易错：** 为了“优化”随意把 WHERE 条件移动到 ON 或反过来。
>
> 正确做法：先判断外连接补 NULL 和过滤时机是否改变结果。

