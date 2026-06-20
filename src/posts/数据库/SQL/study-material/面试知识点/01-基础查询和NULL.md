---
title: "SQL 面试知识点：基础查询和NULL"
date: 2026-06-20
description: "SQL 书写顺序通常是 SELECT - FROM - WHERE - GROUP BY - HAVING - ORDER BY，但逻辑执行顺序更接近 FROM/JOIN - WHERE - GROUP BY - HAVING - SELE…"
tags:
  - "数据库"
  - "SQL"
  - "面试"
category: "数据库"
---

# SQL 面试知识点：基础查询和NULL

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../SQL学习资料.md)

## 一、基础查询和 NULL

### 1. SQL 的逻辑执行顺序是什么？

**参考答案：**

SQL 书写顺序通常是 `SELECT -> FROM -> WHERE -> GROUP BY -> HAVING -> ORDER BY`，但逻辑执行顺序更接近 `FROM/JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT -> DISTINCT -> ORDER BY -> LIMIT/OFFSET`。这个顺序解释了为什么 `WHERE` 不能直接使用聚合函数，为什么外连接补 NULL 后再经过 WHERE 可能丢行。

> **重点：** 逻辑顺序用于理解结果；物理执行顺序由优化器决定。

### 2. `WHERE` 和 `HAVING` 有什么区别？

**参考答案：**

`WHERE` 在分组前过滤原始行，`HAVING` 在分组后过滤聚合结果。过滤明细行用 `WHERE`，过滤聚合组用 `HAVING`。

```sql
SELECT job_id, COUNT(*) AS cnt
FROM applications
WHERE status <> 'cancelled'
GROUP BY job_id
HAVING COUNT(*) >= 10;
```

> **易错：** 把聚合条件写进 `WHERE`。

### 3. NULL 和空字符串、0 有什么区别？

**参考答案：**

NULL 表示未知、缺失或不适用，不等于空字符串，也不等于 0。NULL 参与普通比较通常得到 UNKNOWN，`WHERE` 只保留 TRUE，所以要用 `IS NULL` 或 `IS NOT NULL` 判断。

```sql
WHERE city IS NULL
```

### 4. 为什么 `col = NULL` 查不到数据？

**参考答案：**

因为 `NULL = NULL` 的结果是 UNKNOWN，不是 TRUE。SQL 三值逻辑中 `WHERE` 会过滤掉 FALSE 和 UNKNOWN。正确写法是：

```sql
WHERE col IS NULL
```

### 5. `COUNT(*)` 和 `COUNT(col)` 有什么区别？

**参考答案：**

`COUNT(*)` 统计行数，包括列值为 NULL 的行；`COUNT(col)` 只统计 `col` 非 NULL 的行。

```sql
SELECT COUNT(*) AS rows, COUNT(source) AS source_rows
FROM applications;
```

### 6. `NOT IN` 为什么遇到 NULL 容易出错？

**参考答案：**

如果 `NOT IN` 子查询结果中包含 NULL，比较可能变成 UNKNOWN，导致外层结果为空或不符合预期。反连接更推荐 `NOT EXISTS`。

```sql
SELECT c.*
FROM candidates c
WHERE NOT EXISTS (
    SELECT 1
    FROM applications a
    WHERE a.candidate_id = c.candidate_id
);
```

> **难点：** `NOT IN` 的问题不是语法，而是 NULL 三值逻辑。

### 7. 分页为什么必须有稳定排序？

**参考答案：**

没有 `ORDER BY` 时 SQL 结果顺序不可靠；只按非唯一字段排序时，相同值之间顺序不稳定，翻页可能重复或丢失。应补充唯一键作为次级排序。

```sql
ORDER BY applied_at DESC, application_id DESC
```

