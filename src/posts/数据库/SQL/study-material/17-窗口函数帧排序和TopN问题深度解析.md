---
title: "SQL 学习资料：窗口函数帧排序和TopN问题深度解析"
date: 2026-06-20
description: "窗口函数不是简单的“高级聚合”。它把每一行放在一个窗口上下文里计算。窗口由分区、排序和帧共同决定：分区决定和谁一起算，排序决定先后关系，帧决定当前行能看到窗口中的哪些行。很多窗口函数 bug 来自只写了 ORDER BY，却不知道默认帧并不…"
tags:
  - "数据库"
  - "SQL"
  - "深度解析"
category: "数据库"
---

# SQL 学习资料：窗口函数帧排序和TopN问题深度解析

[返回索引](../SQL学习资料.md)

## 学习目标

- 深入理解窗口分区、排序和窗口帧。
- 能正确处理 TopN、最新一条、累计统计、并列排名。
- 能识别窗口函数中的默认帧陷阱。

## 理论导读

窗口函数不是简单的“高级聚合”。它把每一行放在一个窗口上下文里计算。窗口由分区、排序和帧共同决定：分区决定和谁一起算，排序决定先后关系，帧决定当前行能看到窗口中的哪些行。很多窗口函数 bug 来自只写了 `ORDER BY`，却不知道默认帧并不是整个分区。

## TopN 模式

每个岗位最新 3 条投递：

```sql
WITH ranked AS (
    SELECT
        a.*,
        ROW_NUMBER() OVER (
            PARTITION BY job_id
            ORDER BY applied_at DESC, application_id DESC
        ) AS rn
    FROM applications a
)
SELECT *
FROM ranked
WHERE rn <= 3;
```

是否保留并列：

- 不保留并列：`ROW_NUMBER`。
- 保留并列且跳号：`RANK`。
- 保留并列不跳号：`DENSE_RANK`。

## 窗口帧

累计投递数：

```sql
COUNT(*) OVER (
    PARTITION BY job_id
    ORDER BY applied_at
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
)
```

整个分区最大值：

```sql
MAX(applied_at) OVER (
    PARTITION BY job_id
)
```

`LAST_VALUE` 正确写法：

```sql
LAST_VALUE(status) OVER (
    PARTITION BY candidate_id
    ORDER BY applied_at
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
```

## ROWS 和 RANGE

- `ROWS` 按物理行计数。
- `RANGE` 按排序值范围，排序值相同的 peer 行可能被一起纳入。

如果排序列有重复，`RANGE` 和 `ROWS` 结果可能不同。为了可预测，很多业务累计统计更适合显式 `ROWS`。

## 性能注意

窗口函数通常需要按 `PARTITION BY + ORDER BY` 排序。优化方向：

- 为分区和排序列建立合适索引。
- 减少窗口前输入行数。
- 只计算必要窗口函数。
- 避免对巨大分区做多个不同排序窗口。

## 练习

1. 每个候选人最新投递一条。
2. 每个岗位投递时间 Top3。
3. 对比 `ROWS` 和 `RANGE` 在重复时间下的累计结果。
4. 使用 `LAG` 计算候选人两次投递间隔。

## 验收

- 能解释分区、排序、帧三者的作用。
- 能根据是否保留并列选择排名函数。
- 能说明 `LAST_VALUE` 默认帧陷阱。

## 重点

- 窗口函数保留明细行，窗口帧决定每行计算范围。

## 难点

- 默认帧和数据库方言细节容易导致结果看似合理但实际错误。

## 易错

> **易错：** `LAST_VALUE` 不指定完整窗口帧。
>
> 正确做法：明确写出 `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`。

