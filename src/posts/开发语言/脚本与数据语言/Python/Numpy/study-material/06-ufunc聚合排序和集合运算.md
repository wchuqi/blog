---
title: "NumPy学习资料：ufunc、聚合、排序和集合运算"
date: 2026-06-20
description: "ufunc 是 NumPy 的通用函数，例如 np.add、np.sqrt、np.maximum。它们通常支持广播、逐元素计算、指定输出数组和条件计算。聚合函数沿指定 axis 折叠维度。"
tags:
  - "开发语言"
  - "Numpy"
category: "开发语言"
---

# NumPy学习资料：ufunc、聚合、排序和集合运算

[返回索引](../Numpy学习资料.md)

## 学习目标

- 理解 ufunc 的逐元素计算模型。
- 掌握聚合、排序、去重和集合运算。
- 会使用 `where`、`out`、`axis` 优化表达。

## 理论导读

ufunc 是 NumPy 的通用函数，例如 `np.add`、`np.sqrt`、`np.maximum`。它们通常支持广播、逐元素计算、指定输出数组和条件计算。聚合函数沿指定 axis 折叠维度。

## 示例

```python
import numpy as np

x = np.array([-1, 0, 1, 2])
np.maximum(x, 0)

y = np.empty_like(x)
np.multiply(x, 2, out=y)

a = np.array([[3, 1], [2, 4]])
print(a.sum(axis=0))
print(np.sort(a, axis=1))
print(np.unique(a))
```

## 常见函数

| 类别 | 函数 |
| --- | --- |
| 算术 | `add`、`subtract`、`multiply`、`divide` |
| 比较 | `greater`、`equal`、`isclose` |
| 聚合 | `sum`、`mean`、`std`、`min`、`max` |
| 逻辑 | `any`、`all`、`where` |
| 排序 | `sort`、`argsort`、`argpartition` |
| 集合 | `unique`、`intersect1d`、`isin` |

## 练习

给定一组商品价格和库存，计算总库存价值，筛选库存低于阈值的商品，并输出价格最高的前 5 个索引。

## 验收

- 能解释 ufunc 和普通 Python 函数的差异。
- 能使用 `argsort` 返回排序索引。
- 能用 `np.where` 做条件选择。

## 重点

- `axis` 和 `keepdims` 决定聚合后形状。

## 难点

- `argmax`、`argsort` 返回的是索引，不是值；后续需要用这些索引取原数组。

## 易错

> **易错：** 用 `==` 比较浮点计算结果。
>
> 正确做法：使用 `np.isclose` 或 `numpy.testing.assert_allclose`。

