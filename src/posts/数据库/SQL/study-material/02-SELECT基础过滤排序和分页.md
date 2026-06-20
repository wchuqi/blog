---
title: "SQL 学习资料：SELECT基础过滤排序和分页"
date: 2026-06-20
description: "基础查询看似简单，但它决定了 SQL 的正确性习惯。WHERE 是行级过滤，发生在聚合之前；ORDER BY 决定输出顺序，不写排序时结果顺序不可靠；分页如果没有稳定排序，翻页结果可能重复或丢失。真实业务中，很多“偶发数据错乱”不是数据库坏…"
tags:
  - "数据库"
  - "SQL"
category: "数据库"
---

# SQL 学习资料：SELECT基础过滤排序和分页

[返回索引](../SQL学习资料.md)

## 学习目标

- 掌握 `SELECT`、`FROM`、`WHERE`、`ORDER BY`、分页。
- 能写列别名、表达式、条件组合和范围过滤。
- 理解排序稳定性和分页风险。

## 理论导读

基础查询看似简单，但它决定了 SQL 的正确性习惯。`WHERE` 是行级过滤，发生在聚合之前；`ORDER BY` 决定输出顺序，不写排序时结果顺序不可靠；分页如果没有稳定排序，翻页结果可能重复或丢失。真实业务中，很多“偶发数据错乱”不是数据库坏了，而是 SQL 没有明确排序或过滤条件不严谨。

## 基本查询

```sql
SELECT candidate_id, name, email
FROM candidates
WHERE years_experience >= 3
ORDER BY years_experience DESC, candidate_id ASC;
```

## 条件过滤

| 条件 | 示例 |
| --- | --- |
| 比较 | `years_experience >= 5` |
| 范围 | `applied_at >= '2026-03-01' AND applied_at < '2026-04-01'` |
| 集合 | `status IN ('screening', 'interviewing')` |
| 模糊 | `title LIKE '%Engineer%'` |
| 空值 | `city IS NULL` |
| 组合 | `(city = 'Shanghai' OR city = 'Beijing') AND status = 'open'` |

## 分页

PostgreSQL/MySQL：

```sql
SELECT application_id, candidate_id, job_id, applied_at
FROM applications
ORDER BY applied_at DESC, application_id DESC
LIMIT 20 OFFSET 40;
```

SQL Server/Oracle 新版：

```sql
SELECT application_id, candidate_id, job_id, applied_at
FROM applications
ORDER BY applied_at DESC, application_id DESC
OFFSET 40 ROWS FETCH NEXT 20 ROWS ONLY;
```

> **重点：** 分页必须有稳定排序。只按 `applied_at` 排序，如果多行时间相同，翻页可能不稳定，应补主键作为二级排序。

## Keyset Pagination

深分页时，`OFFSET` 需要跳过大量行，可能越来越慢。游标式分页更适合无限滚动：

```sql
SELECT application_id, candidate_id, job_id, applied_at
FROM applications
WHERE (applied_at, application_id) < ('2026-03-05 09:00:00', 1005)
ORDER BY applied_at DESC, application_id DESC
LIMIT 20;
```

不同数据库对行值比较支持不同，可改写为：

```sql
WHERE applied_at < '2026-03-05 09:00:00'
   OR (applied_at = '2026-03-05 09:00:00' AND application_id < 1005)
```

## 练习

1. 查询上海的候选人，按经验年限倒序。
2. 查询 2026 年 3 月前 5 条投递记录。
3. 写一个稳定分页查询，排序字段包含时间和主键。
4. 把 `OFFSET` 分页改写为 keyset 分页。

## 验收

- 能解释 `WHERE` 和 `ORDER BY` 的作用边界。
- 能说明为什么分页需要稳定排序。
- 能写出范围查询而不是滥用日期函数包列。

## 重点

- 无 `ORDER BY` 的结果顺序不可靠。
- 日期范围建议用半开区间：`>= start AND < next_start`。

## 难点

- 深分页性能和一致性问题需要结合索引和业务游标设计。

## 易错

> **易错：** `WHERE DATE(applied_at) = '2026-03-01'`。
>
> 正确做法：`WHERE applied_at >= '2026-03-01' AND applied_at < '2026-03-02'`，更有机会使用索引。

