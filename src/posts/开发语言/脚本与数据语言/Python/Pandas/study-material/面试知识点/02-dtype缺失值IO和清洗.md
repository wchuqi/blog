---
title: "Pandas面试知识点：dtype、缺失值、IO 和清洗"
date: 2026-06-20
description: "dtype 决定列的存储、计算、缺失值表示和性能。错误 dtype 会导致金额不能求和、日期不能重采样、字符串占用大量内存或 ID 丢失前导 0。"
tags:
  - "开发语言"
  - "Pandas"
  - "面试"
category: "开发语言"
---

# Pandas面试知识点：dtype、缺失值、IO 和清洗

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../Pandas学习资料.md)

## 一、dtype、缺失值、IO 和清洗

### 1. 为什么 Pandas 中 dtype 很重要？

**参考答案：**

dtype 决定列的存储、计算、缺失值表示和性能。错误 dtype 会导致金额不能求和、日期不能重采样、字符串占用大量内存或 ID 丢失前导 0。

> **重点：** dtype 是数据契约。

### 2. `NaN`、`NA`、`None` 有什么区别？

**参考答案：**

`NaN` 常来自浮点缺失；`None` 是 Python 对象缺失；`pd.NA` 是 Pandas nullable dtype 中更统一的缺失标记。实际行为会受列 dtype 影响。

> **难点：** 不同缺失值和 dtype 组合会影响比较、聚合和类型转换。

### 3. 读取 CSV 时要注意哪些参数？

**参考答案：**

常见参数包括 `usecols`、`dtype`、`parse_dates`、`encoding`、`sep`、`na_values`、`chunksize`。ID 类字段通常应按字符串读取，金额和日期要显式转换或校验。

> **易错：** 让 Pandas 自动推断所有类型。

### 4. `apply` 为什么容易被滥用？

**参考答案：**

逐行 `apply(axis=1)` 往往在 Python 层循环，性能差且难以优化。很多逻辑可以用向量化、`map`、`where`、`groupby.transform` 或 merge 实现。

> **重点：** 不是不能用 apply，而是要先考虑内置向量化能力。

