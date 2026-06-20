---
title: "Pandas学习资料：groupby、聚合、transform 和透视表"
date: 2026-06-20
description: "groupby 的核心是 split-apply-combine：按键拆分数据，对每组计算，再合并结果。聚合会降低粒度，transform 通常返回与原数据等长的结果，适合构造组内特征。"
tags:
  - "开发语言"
  - "Pandas"
category: "开发语言"
---

# Pandas学习资料：groupby、聚合、transform 和透视表

[返回索引](../Pandas学习资料.md)

## 学习目标

- 掌握 `groupby`、`agg`、`transform`、`filter`。
- 会使用 `pivot_table` 做多维汇总。
- 理解聚合后粒度变化。

## 理论导读

`groupby` 的核心是 split-apply-combine：按键拆分数据，对每组计算，再合并结果。聚合会降低粒度，`transform` 通常返回与原数据等长的结果，适合构造组内特征。

## 示例

```python
import pandas as pd

df = pd.DataFrame(
    {
        "user_id": [1, 1, 2, 2],
        "amount": [10, 20, 30, 40],
        "month": ["2026-01", "2026-01", "2026-01", "2026-02"],
    }
)

summary = df.groupby("user_id").agg(
    order_count=("amount", "size"),
    total_amount=("amount", "sum"),
    avg_amount=("amount", "mean"),
)

df["user_total"] = df.groupby("user_id")["amount"].transform("sum")
```

## agg 与 transform

| 方法 | 输出粒度 | 场景 |
| --- | --- | --- |
| `agg` | 每组一行或少量行 | 汇总报表 |
| `transform` | 与原表等长 | 组内标准化、占比 |
| `apply` | 灵活但慢 | 无法用内置方法表达的复杂逻辑 |

## 练习

按用户统计订单数、总金额、最近订单时间，并为每条订单添加“占该用户总消费比例”。

## 验收

- 能写命名聚合。
- 能解释聚合后行数变化。
- 能用 transform 构造组内特征。

## 重点

- groupby 前先确认分组键是否有缺失和粒度是否正确。

## 难点

- 多级索引结果需要根据后续用途决定是否 `reset_index`。

## 易错

> **易错：** groupby 后得到多级列名，不处理就继续 merge。
>
> 正确做法：使用命名聚合或整理列名。

