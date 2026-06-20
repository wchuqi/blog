---
title: "NumPy学习资料：dtype、shape、strides 和内存布局"
date: 2026-06-20
description: "dtype 决定单个元素的字节数和解释方式。shape 决定逻辑维度。strides 决定每个维度移动一步跨越多少字节。C order 通常最后一维连续，F order 通常第一维连续。"
tags:
  - "开发语言"
  - "Numpy"
category: "开发语言"
---

# NumPy学习资料：dtype、shape、strides 和内存布局

[返回索引](../Numpy学习资料.md)

## 学习目标

- 理解 dtype、shape、strides、C/F 连续性。
- 能估算数组内存占用。
- 能判断转置、reshape、astype 是否可能复制数据。

## 理论导读

`dtype` 决定单个元素的字节数和解释方式。`shape` 决定逻辑维度。`strides` 决定每个维度移动一步跨越多少字节。C order 通常最后一维连续，F order 通常第一维连续。

内存布局会影响性能。连续数组对底层循环和 BLAS 更友好；非连续视图可能导致函数内部复制或访问效率下降。

## 示例

```python
import numpy as np

a = np.arange(12, dtype=np.float64).reshape(3, 4)
t = a.T

print(a.flags["C_CONTIGUOUS"], a.strides)
print(t.flags["C_CONTIGUOUS"], t.strides)
print(a.nbytes)  # 12 * 8 = 96
```

## dtype 选择

| dtype | 适合场景 | 风险 |
| --- | --- | --- |
| `float64` | 默认数值计算、统计、线性代数 | 内存较大 |
| `float32` | 图像、深度学习、内存敏感场景 | 精度较低 |
| `int64` | 默认整数计算 | 跨平台和文件格式要注意 |
| `bool` | mask | 不能表达缺失 |
| `object` | 混合对象 | 性能差，失去 NumPy 优势 |

## 练习

创建一个 10000x1000 的 `float64` 数组和 `float32` 数组，比较 `nbytes`。

## 验收

- 能根据 shape 和 dtype 估算内存。
- 能解释转置为什么通常是视图。
- 能说出 `object` dtype 的性能风险。

## 重点

- `dtype` 不只是类型，也是内存和精度策略。

## 难点

- 非连续数组可能看起来 shape 正确，但底层访问模式完全不同。

## 易错

> **易错：** 为了省内存盲目改成 `float32`。
>
> 正确做法：先确认精度要求、数值范围和下游库兼容性，再选择 dtype。

