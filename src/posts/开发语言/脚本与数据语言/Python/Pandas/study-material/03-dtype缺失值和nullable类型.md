---
title: "Pandas学习资料：dtype、缺失值和 nullable 类型"
date: 2026-06-20
description: "Pandas dtype 决定列的存储、计算和缺失值行为。传统 NumPy 整数列不能存储 NaN，Pandas 提供 nullable dtype，例如 Int64、boolean、string，用于更自然地表达缺失值。"
tags:
  - "开发语言"
  - "Pandas"
category: "开发语言"
---

# Pandas学习资料：dtype、缺失值和 nullable 类型

[返回索引](../Pandas学习资料.md)

## 学习目标

- 掌握常见 dtype 和 nullable dtype。
- 理解 `NaN`、`NA`、`None` 的差异和影响。
- 会做缺失值检查、填充、删除和类型转换。

## 理论导读

Pandas dtype 决定列的存储、计算和缺失值行为。传统 NumPy 整数列不能存储 `NaN`，Pandas 提供 nullable dtype，例如 `Int64`、`boolean`、`string`，用于更自然地表达缺失值。

缺失值处理要结合业务语义。删除、填充、保留都会影响指标口径。

## 示例

```python
import pandas as pd

df = pd.DataFrame(
    {
        "user_id": pd.Series([1, None, 3], dtype="Int64"),
        "name": pd.Series(["a", None, "c"], dtype="string"),
        "paid": pd.Series([True, None, False], dtype="boolean"),
    }
)

print(df.dtypes)
print(df.isna().sum())
```

## 常用处理

```python
df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
df["date"] = pd.to_datetime(df["date"], errors="coerce")
df["city"] = df["city"].fillna("未知")
df = df.dropna(subset=["amount"])
```

## 练习

读取一份包含金额、日期、是否会员、手机号的脏数据，转换为合适 dtype，并统计缺失值。

## 验收

- 能检查每列 dtype。
- 能用 nullable dtype 表达整数和布尔缺失。
- 能解释缺失值填充对指标的影响。

## 重点

- dtype 是数据契约，不能只靠后续计算自动推断。

## 难点

- 同一列混入字符串和数字时，可能退化为 object，影响性能和结果。

## 易错

> **易错：** 把缺失金额填成 0，导致销售额被人为压低。
>
> 正确做法：先确认缺失代表“确实为 0”还是“未知”。

