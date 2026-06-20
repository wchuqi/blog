---
title: "PostgreSQL 13 学习资料：SQL 基础和数据建模"
date: 2026-06-20
description: "SQL 是声明式语言。你描述想要什么结果，优化器决定怎么执行。数据建模则是把业务不变量落到数据库结构中：哪些数据必须存在，哪些组合不能重复，哪些状态可以流转，哪些关系必须引用已有记录。"
tags:
  - "数据库"
  - "PostgreSQL13"
category: "数据库"
---

# PostgreSQL 13 学习资料：SQL 基础和数据建模

[返回索引](../PostgreSQL13学习资料.md)

## 学习目标

- 掌握 PostgreSQL 常用 SQL：查询、过滤、排序、聚合、JOIN、子查询、CTE、窗口函数、UPSERT。
- 能从业务规则推导表、字段、约束和关系。
- 能写出可靠的数据修改语句，避免并发下的数据错误。

## 理论导读

SQL 是声明式语言。你描述想要什么结果，优化器决定怎么执行。数据建模则是把业务不变量落到数据库结构中：哪些数据必须存在，哪些组合不能重复，哪些状态可以流转，哪些关系必须引用已有记录。

可靠的 PostgreSQL 应用不是把所有规则都放在代码里，而是让数据库承担底线约束。应用层可以做用户体验和提前校验，数据库层必须保证最终正确性。

## 核心心智模型

把数据建模看成“业务事实登记簿”：

- 表记录一种事实，例如候选人、岗位、投递。
- 主键标识一条事实。
- 外键表达事实之间的依赖。
- 唯一约束表达业务上不能重复。
- 检查约束表达字段合法范围。
- 事务保证一组事实同时成立或同时不成立。

## 知识点详解

### 1. 基本查询顺序

SQL 的逻辑处理顺序通常可以理解为：

```text
FROM/JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT -> DISTINCT -> ORDER BY -> LIMIT
```

这解释了为什么 `WHERE` 不能直接使用 `SELECT` 别名，而 `ORDER BY` 通常可以使用。

### 2. JOIN

| 类型 | 含义 | 使用场景 |
| --- | --- | --- |
| `INNER JOIN` | 两边都匹配才返回 | 查有投递记录的候选人 |
| `LEFT JOIN` | 左表保留，右表无匹配填空 | 查所有候选人及其最近投递 |
| `RIGHT JOIN` | 右表保留 | 较少使用，通常可改写 |
| `FULL JOIN` | 两边都保留 | 对账、差异比较 |
| `CROSS JOIN` | 笛卡尔积 | 生成组合、测试数据 |

### 3. CTE 和窗口函数

CTE 用于拆分复杂查询。窗口函数用于“保留明细行的同时做分组内计算”。

```sql
WITH ranked AS (
  SELECT
    candidate_id,
    job_id,
    interview_time,
    row_number() OVER (
      PARTITION BY candidate_id
      ORDER BY interview_time DESC
    ) AS rn
  FROM interview
)
SELECT *
FROM ranked
WHERE rn = 1;
```

### 4. UPSERT

`INSERT ... ON CONFLICT` 是 PostgreSQL 实现幂等写入的核心工具。

```sql
INSERT INTO application(candidate_id, job_id, status)
VALUES (1, 10, 'submitted')
ON CONFLICT (candidate_id, job_id)
DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = now();
```

前提是冲突目标上存在唯一约束或唯一索引。

### 5. 数据建模基本流程

1. 找业务实体：候选人、岗位、投递、面试。
2. 找实体关系：一个候选人可以投递多个岗位，一个岗位有多个投递。
3. 找业务不变量：同一候选人对同一岗位只能有一条有效投递。
4. 找生命周期：投递状态从 `submitted` 到 `screening`、`interviewing`、`offered`、`rejected`。
5. 落约束和索引：唯一约束、检查约束、外键、查询索引。

## 例子

招聘系统核心表：

```sql
CREATE TABLE candidate (
  id bigserial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE job (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE application (
  id bigserial PRIMARY KEY,
  candidate_id bigint NOT NULL REFERENCES candidate(id),
  job_id bigint NOT NULL REFERENCES job(id),
  status text NOT NULL CHECK (
    status IN ('submitted', 'screening', 'interviewing', 'offered', 'rejected')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);
```

查询每个岗位最近 7 天投递数：

```sql
SELECT
  j.id,
  j.title,
  count(a.id) AS applications_last_7_days
FROM job j
LEFT JOIN application a
  ON a.job_id = j.id
 AND a.created_at >= now() - interval '7 days'
WHERE j.status = 'open'
GROUP BY j.id, j.title
ORDER BY applications_last_7_days DESC;
```

## 练习

1. 为 `interview` 表建模，要求每次面试关联投递记录、面试官、时间和结果。
2. 查询每个候选人的最近一次面试。
3. 写一个 UPSERT，保证同一候选人同一岗位重复投递时只更新状态。
4. 写一个报表：每个岗位在不同投递状态下的人数。

## 验收

- 能说明 SQL 逻辑处理顺序。
- 能区分 `WHERE` 和 `HAVING`。
- 能独立使用窗口函数解决 Top N 或最近记录问题。
- 能把业务唯一性落到数据库唯一约束。

## 重点

- SQL 写的是结果需求，执行路径由优化器决定。
- 幂等写入依赖唯一约束或唯一索引。
- 数据库约束是业务正确性的最后防线。

## 难点

- JOIN 的过滤条件放在 `ON` 还是 `WHERE` 会影响外连接结果。
- 窗口函数既有分区又有排序，和普通 `GROUP BY` 的结果形态不同。

## 易错

> **易错：** 在 `LEFT JOIN` 后把右表条件放到 `WHERE`，导致结果变成类似内连接。
>
> 正确做法：需要保留左表时，右表过滤条件通常放在 `ON` 中。

> **易错：** 用应用代码先查再插入来保证唯一。
>
> 正确做法：使用唯一约束加 `ON CONFLICT`，让数据库处理并发冲突。

