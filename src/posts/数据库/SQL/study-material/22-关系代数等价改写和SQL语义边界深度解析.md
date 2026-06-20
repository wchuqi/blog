---
title: "SQL 学习资料：关系代数等价改写和SQL语义边界深度解析"
date: 2026-06-20
description: "SQL 优化器能做大量改写，是因为许多查询在关系代数上等价。例如先过滤再连接，和连接后再过滤，在某些内连接场景下结果相同。但 SQL 不是纯粹的集合代数：它默认允许重复行，有 NULL 三值逻辑，有外连接补 NULL，有聚合粒度和窗口顺序。…"
tags:
  - "数据库"
  - "SQL"
  - "深度解析"
category: "数据库"
---

# SQL 学习资料：关系代数等价改写和SQL语义边界深度解析

[返回索引](../SQL学习资料.md)

## 学习目标

- 理解 SQL 背后的关系代数操作：选择、投影、连接、并、差、聚合。
- 能判断常见 SQL 改写是否等价。
- 识别 NULL、重复行、外连接、聚合、窗口函数对等价改写的限制。
- 能用“语义保持”而不是“看起来差不多”评审 SQL。

## 理论导读

SQL 优化器能做大量改写，是因为许多查询在关系代数上等价。例如先过滤再连接，和连接后再过滤，在某些内连接场景下结果相同。但 SQL 不是纯粹的集合代数：它默认允许重复行，有 NULL 三值逻辑，有外连接补 NULL，有聚合粒度和窗口顺序。这些特性让很多“数学上看似能换”的改写不再安全。

真正深入理解 SQL，不是背语法，而是能回答：这条改写是否保持结果集的行数、列值、重复度、NULL 语义和排序要求？如果不能证明，就不能为了性能随意改。

## 关系代数到 SQL 的映射

| 关系操作 | SQL 表达 | 含义 |
| --- | --- | --- |
| 选择 | `WHERE` | 过滤行 |
| 投影 | `SELECT col` | 选择列或表达式 |
| 连接 | `JOIN ... ON` | 按条件匹配行 |
| 半连接 | `EXISTS` | 左侧行是否存在匹配 |
| 反连接 | `NOT EXISTS` | 左侧行是否不存在匹配 |
| 并 | `UNION` / `UNION ALL` | 合并结果 |
| 差 | `EXCEPT` / 反连接 | 去掉匹配结果 |
| 聚合 | `GROUP BY` | 按粒度汇总 |

## 等价改写一：内连接谓词下推

以下通常等价：

```sql
SELECT *
FROM applications a
JOIN jobs j ON j.job_id = a.job_id
WHERE j.status = 'open';
```

```sql
SELECT *
FROM applications a
JOIN jobs j
  ON j.job_id = a.job_id
 AND j.status = 'open';
```

因为是内连接，未满足 `j.status = 'open'` 的匹配最终都会被过滤。

## 非等价改写：外连接谓词移动

以下不等价：

```sql
SELECT c.candidate_id, a.application_id
FROM candidates c
LEFT JOIN applications a
  ON a.candidate_id = c.candidate_id
WHERE a.status = 'screening';
```

```sql
SELECT c.candidate_id, a.application_id
FROM candidates c
LEFT JOIN applications a
  ON a.candidate_id = c.candidate_id
 AND a.status = 'screening';
```

第一条过滤掉没有 screening 投递的候选人；第二条保留所有候选人，只是没有匹配时右侧为 NULL。

> **重点：** 外连接中，ON 决定匹配，WHERE 决定补 NULL 后是否保留。

## 重复行语义：UNION 和 UNION ALL

```sql
SELECT candidate_id FROM applications WHERE job_id = 101
UNION
SELECT candidate_id FROM applications WHERE job_id = 201;
```

`UNION` 去重，`UNION ALL` 保留重复。关系代数默认集合语义，但 SQL 很多场景是多重集合语义。把 `UNION` 改成 `UNION ALL` 可能提升性能，但会改变重复度。

## 聚合改写边界

错误改写：

```sql
SELECT job_id, COUNT(*) AS cnt
FROM applications
GROUP BY job_id
HAVING COUNT(*) >= 2;
```

不能随意改成：

```sql
SELECT job_id, COUNT(*) AS cnt
FROM applications
WHERE COUNT(*) >= 2
GROUP BY job_id;
```

因为 `WHERE` 发生在分组前，没有组级计数。

另一个常见错误：先 JOIN 多表再聚合，导致粒度变化。正确做法是先确认“一行代表什么”，必要时先聚合再 JOIN。

## NOT IN、NOT EXISTS、EXCEPT

在没有 NULL 且语义明确时，反连接写法可能等价：

```sql
WHERE candidate_id NOT IN (SELECT candidate_id FROM applications)
```

```sql
WHERE NOT EXISTS (
  SELECT 1 FROM applications a
  WHERE a.candidate_id = c.candidate_id
)
```

但一旦子查询列可能含 NULL，`NOT IN` 会受 UNKNOWN 影响，而 `NOT EXISTS` 仍按相关匹配判断，通常更安全。

## 窗口函数改写边界

窗口函数依赖分区、排序和帧。以下查询表示每个岗位最新投递：

```sql
WITH ranked AS (
    SELECT a.*,
           ROW_NUMBER() OVER (
               PARTITION BY job_id
               ORDER BY applied_at DESC, application_id DESC
           ) AS rn
    FROM applications a
)
SELECT *
FROM ranked
WHERE rn = 1;
```

不能简单改为：

```sql
SELECT job_id, MAX(applied_at)
FROM applications
GROUP BY job_id;
```

后者只得到最大时间，拿不到同一行的完整列；如果最大时间并列，还需要 tie-breaker。

## SQL 评审中的等价性检查

| 检查项 | 问题 |
| --- | --- |
| 行数 | 改写后是否增删行 |
| 重复度 | 是否从保留重复变成去重 |
| NULL | UNKNOWN 是否改变过滤 |
| 外连接 | 补 NULL 行是否保留 |
| 聚合粒度 | 一行代表的业务对象是否变化 |
| 排序 | TopN、窗口、分页是否仍稳定 |
| 方言 | 目标数据库是否同语义支持 |

## 练习

1. 判断 5 条内连接 WHERE/ON 条件移动是否等价。
2. 构造 LEFT JOIN 条件移动导致丢行的例子。
3. 对比 `UNION` 和 `UNION ALL` 的行数和执行计划。
4. 把一个窗口 Top1 查询错误改写为聚合，说明错在哪里。

## 验收

- 能用关系代数语言解释 SELECT、WHERE、JOIN、GROUP BY。
- 能判断外连接、NULL、重复行对改写的影响。
- 能写出 SQL 等价改写评审清单。

## 重点

- SQL 改写首先要语义等价，其次才是性能。

## 难点

- SQL 的重复行、NULL 和外连接让很多纯集合等价规则失效。

## 易错

> **易错：** 看到执行计划更快就接受改写。
>
> 正确做法：先证明结果等价，再比较性能。

