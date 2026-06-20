---
title: "SQL 学习资料：复杂报表SQL分层聚合和数据质量校验深度解析"
date: 2026-06-20
description: "复杂报表最危险的不是 SQL 写不出来，而是写出来的数字无法证明正确。报表通常跨多个事实表和维度表，涉及去重、状态口径、时间口径、迟到数据、重复数据、维度变化。正确做法是分层：先定义事实粒度，再清洗过滤，再聚合到中间粒度，最后做展示。每一层…"
tags:
  - "数据库"
  - "SQL"
  - "深度解析"
category: "数据库"
---

# SQL 学习资料：复杂报表SQL分层聚合和数据质量校验深度解析

[返回索引](../SQL学习资料.md)

## 学习目标

- 能把复杂报表拆成可验证的分层 SQL。
- 掌握多粒度聚合、去重、漏斗、留存、同比环比的基本写法。
- 能设计数据质量校验，避免报表数字“看起来对”。

## 理论导读

复杂报表最危险的不是 SQL 写不出来，而是写出来的数字无法证明正确。报表通常跨多个事实表和维度表，涉及去重、状态口径、时间口径、迟到数据、重复数据、维度变化。正确做法是分层：先定义事实粒度，再清洗过滤，再聚合到中间粒度，最后做展示。每一层都能单独校验行数和关键指标。

## 分层模式

```text
base 明细层
  -> cleaned 清洗层
  -> fact 粒度统一层
  -> agg 聚合层
  -> final 展示层
```

## 例子：岗位漏斗

目标：按岗位统计投递、进入面试、发 Offer 数。

```sql
WITH app_base AS (
    SELECT application_id, job_id, candidate_id, status, applied_at
    FROM applications
    WHERE applied_at >= '2026-03-01'
      AND applied_at < '2026-04-01'
),
interview_app AS (
    SELECT DISTINCT application_id
    FROM interviews
),
offer_app AS (
    SELECT DISTINCT application_id
    FROM offers
),
funnel AS (
    SELECT
        a.job_id,
        a.application_id,
        CASE WHEN i.application_id IS NOT NULL THEN 1 ELSE 0 END AS has_interview,
        CASE WHEN o.application_id IS NOT NULL THEN 1 ELSE 0 END AS has_offer
    FROM app_base a
    LEFT JOIN interview_app i ON i.application_id = a.application_id
    LEFT JOIN offer_app o ON o.application_id = a.application_id
)
SELECT
    job_id,
    COUNT(*) AS application_count,
    SUM(has_interview) AS interview_count,
    SUM(has_offer) AS offer_count
FROM funnel
GROUP BY job_id;
```

关键点：先把 `interviews` 按 `application_id` 去重，否则多轮面试会放大漏斗。

## 同比环比

月度投递：

```sql
WITH monthly AS (
    SELECT
        DATE_TRUNC('month', applied_at) AS month_start,
        COUNT(*) AS application_count
    FROM applications
    GROUP BY DATE_TRUNC('month', applied_at)
)
SELECT
    month_start,
    application_count,
    LAG(application_count) OVER (ORDER BY month_start) AS prev_month_count,
    application_count - LAG(application_count) OVER (ORDER BY month_start) AS diff
FROM monthly;
```

`DATE_TRUNC` 是 PostgreSQL 语法，其他数据库需要替换日期截断函数。

## 数据质量校验

| 校验 | SQL 思路 |
| --- | --- |
| 主键重复 | `GROUP BY id HAVING COUNT(*) > 1` |
| 外键孤儿 | LEFT JOIN 维表 WHERE 维表主键 IS NULL |
| 状态非法 | `WHERE status NOT IN (...)` |
| 时间倒挂 | `WHERE offered_at < applied_at` |
| 漏斗倒挂 | offer 数大于 interview 数 |
| 金额异常 | 薪资小于 0 或超出合理范围 |

## 报表口径文档

每张报表都要写清：

```text
指标名称：
业务含义：
统计粒度：
时间口径：
去重规则：
过滤条件：
迟到数据处理：
权限和脱敏：
校验 SQL：
```

## 练习

1. 写岗位漏斗报表，避免多轮面试放大。
2. 写月度投递环比。
3. 写 5 条数据质量校验 SQL。
4. 为报表写口径文档。

## 验收

- 能把复杂报表拆成多个 CTE 层。
- 能说明每层粒度。
- 能写数据质量校验。

## 重点

- 报表 SQL 的第一任务是口径正确和可验证。

## 难点

- 多事实表 JOIN 前必须先统一粒度，否则指标容易翻倍。

## 易错

> **易错：** 直接把所有明细表 JOIN 起来再 COUNT。
>
> 正确做法：先按业务粒度去重或聚合，再进入最终统计。

