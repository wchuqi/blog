---
title: "Pandas面试知识点：基础对象、Index 和选择过滤"
date: 2026-06-20
description: "Series 是带 Index 的一维数据；DataFrame 是带行 Index 和列 Index 的二维表格，可以看作多个 Series 按列组成。DataFrame 每列可以有不同 dtype。"
tags:
  - "开发语言"
  - "Pandas"
  - "面试"
category: "开发语言"
---

# Pandas面试知识点：基础对象、Index 和选择过滤

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../Pandas学习资料.md)

## 一、基础对象、Index 和选择过滤

### 1. Series 和 DataFrame 有什么区别？

**参考答案：**

Series 是带 Index 的一维数据；DataFrame 是带行 Index 和列 Index 的二维表格，可以看作多个 Series 按列组成。DataFrame 每列可以有不同 dtype。

> **重点：** Pandas 对象是带标签的数据结构，不只是数组。

### 2. Pandas 和 NumPy 的核心区别是什么？

**参考答案：**

NumPy 面向同类型数组和数值计算；Pandas 面向带标签的表格数据，支持不同列 dtype、索引对齐、缺失值、groupby、merge 和丰富 IO。

> **易错：** 只说 Pandas 是 NumPy 的高级封装，忽略索引和表格语义。

### 3. `loc` 和 `iloc` 有什么区别？

**参考答案：**

`loc` 按标签选择行列，`iloc` 按整数位置选择行列。标签不一定等于位置，因此不能混用。

> **重点：** 回答时最好举例说明 index 为订单号时 `loc` 的意义。

### 4. 什么是索引对齐？

**参考答案：**

Pandas 在 Series 或 DataFrame 运算时通常按 Index 标签对齐，而不是单纯按位置。对不上的标签会产生缺失值。

> **难点：** 索引对齐既能防止错位计算，也可能因索引异常产生 NaN。

