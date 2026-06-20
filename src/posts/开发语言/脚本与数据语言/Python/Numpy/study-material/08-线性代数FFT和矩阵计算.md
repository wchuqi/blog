---
title: "NumPy学习资料：线性代数、FFT 和矩阵计算"
date: 2026-06-20
description: "NumPy 的 linalg 模块提供基础线性代数能力，底层通常调用 BLAS/LAPACK。矩阵计算要注意 shape、dtype、条件数和数值稳定性。很多时候求解方程比显式求逆更稳定。"
tags:
  - "开发语言"
  - "Numpy"
category: "开发语言"
---

# NumPy学习资料：线性代数、FFT 和矩阵计算

[返回索引](../Numpy学习资料.md)

## 学习目标

- 掌握矩阵乘法、求解线性方程、特征值、SVD 的基本用法。
- 区分逐元素运算和矩阵运算。
- 了解 FFT 的适用场景。

## 理论导读

NumPy 的 `linalg` 模块提供基础线性代数能力，底层通常调用 BLAS/LAPACK。矩阵计算要注意 shape、dtype、条件数和数值稳定性。很多时候求解方程比显式求逆更稳定。

## 示例

```python
import numpy as np

A = np.array([[3.0, 1.0], [1.0, 2.0]])
b = np.array([9.0, 8.0])

x = np.linalg.solve(A, b)
print(x)

U, S, Vt = np.linalg.svd(A)
```

## 运算区别

| 写法 | 含义 |
| --- | --- |
| `A * B` | 逐元素乘法 |
| `A @ B` | 矩阵乘法 |
| `np.dot(A, B)` | 点积或矩阵乘法，依维度而定 |
| `np.linalg.solve(A, b)` | 解线性方程 |
| `np.linalg.inv(A)` | 求逆，通常不应只为解方程而用 |

## FFT 简例

```python
signal = np.sin(np.linspace(0, 2 * np.pi, 128))
spectrum = np.fft.rfft(signal)
```

## 练习

用 NumPy 实现最小二乘线性回归，并比较 `np.linalg.solve` 和 `np.linalg.lstsq`。

## 验收

- 能区分 `*` 和 `@`。
- 能解释为什么解方程时优先用 `solve`。
- 能说明 SVD 在降维、压缩或稳定计算中的作用。

## 重点

- 线性代数代码的正确性高度依赖 shape 和数值稳定性。

## 难点

- 矩阵接近奇异时，结果可能对微小扰动非常敏感。

## 易错

> **易错：** 使用 `np.linalg.inv(A) @ b` 解方程。
>
> 正确做法：使用 `np.linalg.solve(A, b)` 或根据问题使用 `lstsq`。

