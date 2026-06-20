---
title: "NumPy学习资料：NumPy完整知识点清单"
date: 2026-06-20
description: "NumPy 与 Python list 的区别。"
tags:
  - "开发语言"
  - "Numpy"
  - "知识清单"
category: "开发语言"
---

# NumPy学习资料：NumPy完整知识点清单

[返回索引](../Numpy学习资料.md)

## 1. 基础定位

- NumPy 与 Python list 的区别。
- NumPy 在 Pandas、SciPy、机器学习、图像处理中的位置。
- `ndarray`、shape、axis、dtype、strides。

## 2. 数组创建和属性

- `array`、`asarray`、`zeros`、`ones`、`empty`、`arange`、`linspace`、`eye`。
- `ndim`、`shape`、`size`、`dtype`、`itemsize`、`nbytes`。
- `reshape`、`ravel`、`flatten`、`transpose`。

## 3. dtype 和内存

- 整数、浮点、布尔、字符串、object dtype。
- C order、F order、连续性。
- strides 和视图。
- `astype`、精度、溢出、内存估算。

## 4. 索引和选择

- 基础索引。
- 切片。
- 布尔 mask。
- 整数数组索引。
- 混合索引。
- `where`、`take`、`put`。
- view/copy 判断。

## 5. 广播和向量化

- 从右向左对齐广播规则。
- `None`/`np.newaxis`。
- `keepdims`。
- 向量化表达式。
- 中间数组和内存风险。

## 6. ufunc 和聚合

- 算术 ufunc。
- 比较和逻辑 ufunc。
- `out`、`where`。
- `sum`、`mean`、`std`、`min`、`max`。
- `argmax`、`argsort`、`argpartition`。
- `unique`、`isin`、集合运算。

## 7. 随机和统计

- `np.random.default_rng`。
- 正态、均匀、二项分布。
- 采样和打乱。
- 均值、中位数、方差、分位数、协方差。
- 可复现性。

## 8. 线性代数和信号

- 矩阵乘法。
- `solve`、`lstsq`、`eig`、`svd`。
- 条件数和数值稳定性。
- FFT 基础。

## 9. 缺失值和数值稳定性

- `nan`、`inf`。
- `isnan`、`isfinite`。
- `nanmean` 等函数。
- 容差比较。
- 溢出、下溢和 dtype 精度。

## 10. 性能和工程化

- Python 循环开销。
- 临时数组。
- 连续性。
- 分块处理。
- memmap。
- Numba/Cython/Dask 边界。
- `numpy.testing`。

## 自检

- 是否能从 shape 推导广播结果？
- 是否能判断常见索引是否返回拷贝？
- 是否能解释 `strides`？
- 是否能估算大数组内存？
- 是否能写容差断言测试？
- 是否能避免浮点精确比较和矩阵显式求逆？

