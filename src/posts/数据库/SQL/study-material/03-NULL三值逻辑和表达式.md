---
title: "SQL 学习资料：NULL三值逻辑和表达式"
date: 2026-06-20
description: "NULL 是 SQL 中最容易被低估的概念。普通布尔逻辑只有真和假，但 SQL 条件判断有 UNKNOWN。WHERE 只保留 TRUE，FALSE 和 UNKNOWN 都会被过滤掉。这意味着很多看似自然的条件在遇到 NULL 时会“静默丢…"
tags:
  - "数据库"
  - "SQL"
category: "数据库"
---

# SQL 学习资料：NULL三值逻辑和表达式

[返回索引](../SQL学习资料.md)

## 学习目标

- 理解 NULL 表示未知、缺失或不适用，不等于空字符串或 0。
- 掌握三值逻辑：TRUE、FALSE、UNKNOWN。
- 避免 `= NULL`、`NOT IN`、外连接过滤中的常见错误。

## 理论导读

NULL 是 SQL 中最容易被低估的概念。普通布尔逻辑只有真和假，但 SQL 条件判断有 UNKNOWN。`WHERE` 只保留 TRUE，FALSE 和 UNKNOWN 都会被过滤掉。这意味着很多看似自然的条件在遇到 NULL 时会“静默丢行”。如果你不理解 NULL，JOIN、NOT IN、聚合、唯一约束和报表统计都会出现微妙错误。

## 三值逻辑

```sql
SELECT *
FROM candidates
WHERE city = NULL; -- 错误，结果通常为空
```

正确：

```sql
SELECT *
FROM candidates
WHERE city IS NULL;
```

比较结果：

| 表达式 | 结果 |
| --- | --- |
| `NULL = NULL` | UNKNOWN |
| `NULL <> 'Shanghai'` | UNKNOWN |
| `city IS NULL` | TRUE 或 FALSE |
| `COALESCE(city, 'Unknown')` | 替换 NULL |

## `NOT IN` 陷阱

```sql
SELECT candidate_id
FROM candidates
WHERE candidate_id NOT IN (
    SELECT candidate_id
    FROM applications
);
```

如果子查询结果中包含 NULL，`NOT IN` 可能让整个判断变成 UNKNOWN，导致结果为空。更稳妥：

```sql
SELECT c.candidate_id
FROM candidates c
WHERE NOT EXISTS (
    SELECT 1
    FROM applications a
    WHERE a.candidate_id = c.candidate_id
);
```

## 聚合中的 NULL

```sql
SELECT
    COUNT(*) AS row_count,
    COUNT(source) AS source_count
FROM applications;
```

- `COUNT(*)` 统计行数。
- `COUNT(source)` 统计 `source` 非 NULL 的行数。

## NULL 和唯一约束

不同数据库对唯一约束中的 NULL 处理有差异。很多数据库允许唯一列存在多个 NULL，因为 NULL 不等于 NULL；但具体行为要查目标数据库。业务上如果要求“缺失也唯一”，需要额外约束或表达式索引。

## 练习

1. 查询来源为空的投递。
2. 统计投递总数和有来源的投递数。
3. 用 `NOT EXISTS` 查询没有投递记录的候选人。
4. 构造一个包含 NULL 的 `NOT IN` 示例，观察结果。

## 验收

- 能解释 UNKNOWN 为什么会被 `WHERE` 过滤。
- 能区分 `COUNT(*)` 和 `COUNT(col)`。
- 能说明为什么反连接优先考虑 `NOT EXISTS`。

## 重点

- NULL 参与普通比较通常得到 UNKNOWN。
- `IS NULL` 和 `IS NOT NULL` 是判断 NULL 的正确方式。

## 难点

- NULL 会穿透连接、聚合、子查询和约束，必须按上下文分析。

## 易错

> **易错：** 用 `col <> NULL` 查非空。
>
> 正确做法：用 `col IS NOT NULL`。

