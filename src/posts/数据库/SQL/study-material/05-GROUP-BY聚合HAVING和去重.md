---
title: "SQL 学习资料：GROUP BY聚合HAVING和去重"
date: 2026-06-20
description: "聚合的关键是“粒度”。原始表是一行一条业务事实，GROUP BY 会把多行压成每组一行。SELECT 中出现的非聚合列必须属于分组粒度，否则结果没有明确含义。很多报表 SQL 错误不是函数用错，而是粒度错了：先 JOIN 放大行数，再聚合统…"
tags:
  - "数据库"
  - "SQL"
category: "数据库"
---

# SQL 学习资料：GROUP BY聚合HAVING和去重

[返回索引](../SQL学习资料.md)

## 学习目标

- 掌握 GROUP BY、聚合函数、HAVING、DISTINCT。
- 理解聚合粒度和行数变化。
- 能写条件聚合和常见报表统计。

## 理论导读

聚合的关键是“粒度”。原始表是一行一条业务事实，`GROUP BY` 会把多行压成每组一行。SELECT 中出现的非聚合列必须属于分组粒度，否则结果没有明确含义。很多报表 SQL 错误不是函数用错，而是粒度错了：先 JOIN 放大行数，再聚合统计，数字自然翻倍。

## 基础聚合

```sql
SELECT job_id, COUNT(*) AS application_count
FROM applications
GROUP BY job_id;
```

## WHERE 和 HAVING

```sql
SELECT job_id, COUNT(*) AS application_count
FROM applications
WHERE status <> 'cancelled'
GROUP BY job_id
HAVING COUNT(*) >= 2;
```

- `WHERE`：分组前过滤行。
- `HAVING`：分组后过滤组。

## 条件聚合

通用写法：

```sql
SELECT
    job_id,
    COUNT(*) AS total_count,
    SUM(CASE WHEN status = 'screening' THEN 1 ELSE 0 END) AS screening_count,
    SUM(CASE WHEN status = 'offered' THEN 1 ELSE 0 END) AS offered_count
FROM applications
GROUP BY job_id;
```

PostgreSQL 支持：

```sql
COUNT(*) FILTER (WHERE status = 'screening')
```

## DISTINCT

```sql
SELECT COUNT(DISTINCT candidate_id) AS candidate_count
FROM applications;
```

`DISTINCT` 是去重结果，不是修复 JOIN 错误的默认手段。去重前要问：重复是业务上合理，还是连接条件错了？

## 练习

1. 统计每个岗位投递数。
2. 统计每个岗位不同候选人数。
3. 统计每个岗位 screening、interviewing、offered 数量。
4. 查询投递数大于等于 2 的岗位。

## 验收

- 能解释聚合粒度。
- 能区分 WHERE 和 HAVING。
- 能写条件聚合。

## 重点

- GROUP BY 后结果粒度由分组列决定。
- `COUNT(*)` 和 `COUNT(col)` 对 NULL 的处理不同。

## 难点

- JOIN 后聚合要特别注意行数放大。

## 易错

> **易错：** SELECT 里混用未分组列和聚合函数。
>
> 正确做法：非聚合列必须属于 GROUP BY 粒度，或使用明确的聚合函数。

