---
title: "Pandas学习资料：Index、对齐机制和选择过滤"
date: 2026-06-20
description: "Pandas 的 Index 是数据标签。loc 按标签选择，iloc 按整数位置选择。运算时 Pandas 会按标签对齐，这让不同来源的数据能安全合并计算，但索引不一致时会出现缺失值。"
tags:
  - "开发语言"
  - "Pandas"
category: "开发语言"
---

# Pandas学习资料：Index、对齐机制和选择过滤

[返回索引](../Pandas学习资料.md)

## 学习目标

- 掌握 `Index`、`loc`、`iloc`、布尔过滤。
- 理解按标签对齐和按位置访问的区别。
- 避免链式赋值和索引错位问题。

## 理论导读

Pandas 的 Index 是数据标签。`loc` 按标签选择，`iloc` 按整数位置选择。运算时 Pandas 会按标签对齐，这让不同来源的数据能安全合并计算，但索引不一致时会出现缺失值。

## 示例

```python
import pandas as pd

df = pd.DataFrame(
    {"amount": [100, 200, 300], "city": ["A", "B", "A"]},
    index=["o1", "o2", "o3"],
)

print(df.loc["o1", "amount"])
print(df.iloc[0, 0])
print(df[df["city"] == "A"])
```

## 对齐示例

```python
s1 = pd.Series([10, 20], index=["a", "b"])
s2 = pd.Series([1, 2], index=["b", "c"])
print(s1 + s2)
```

## 练习

给订单表设置订单号为索引，用 `loc` 查询指定订单，用布尔过滤查询金额大于 100 的订单。

## 验收

- 能区分 `loc` 和 `iloc`。
- 能解释 Series 运算为什么会按 index 对齐。
- 能用布尔条件过滤行。

## 重点

- 修改数据时优先使用 `.loc[row_mask, col] = value`。

## 难点

- 链式选择可能产生临时对象，赋值是否写回不直观。

## 易错

> **易错：** 使用 `df[df["city"] == "A"]["amount"] = 0` 赋值。
>
> 正确做法：使用 `df.loc[df["city"] == "A", "amount"] = 0`。

