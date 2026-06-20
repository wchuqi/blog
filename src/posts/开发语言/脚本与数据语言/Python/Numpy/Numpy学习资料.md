---
title: "NumPy学习资料"
date: 2026-06-20
description: "这是一套面向 Python 数据处理、算法实现、机器学习基础和面试准备的 NumPy 中文学习资料。内容从 ndarray 心智模型、dtype、shape、strides 和内存布局开始，逐步推进到索引切片、视图拷贝、广播、ufunc、统…"
tags:
  - "开发语言"
  - "Numpy"
  - "学习资料总览"
category: "开发语言"
---

# NumPy学习资料

这是一套面向 Python 数据处理、算法实现、机器学习基础和面试准备的 NumPy 中文学习资料。内容从 `ndarray` 心智模型、dtype、shape、strides 和内存布局开始，逐步推进到索引切片、视图拷贝、广播、ufunc、统计随机、线性代数、性能优化、生态互操作、数值稳定性和综合项目。

版本基准：NumPy 2.4.6、Python 3.10+。目录名按用户要求使用 `Numpy`，正文使用官方常见写法 `NumPy`。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览、定位和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 环境安装、数组对象和基础操作 | [01-环境安装数组对象和基础操作.md](study-material/01-环境安装数组对象和基础操作.md) |
| 2 | dtype、shape、strides 和内存布局 | [02-dtypeShapeStrides和内存布局.md](study-material/02-dtypeShapeStrides和内存布局.md) |
| 3 | 数组创建、转换、保存和读取 | [03-数组创建转换保存和读取.md](study-material/03-数组创建转换保存和读取.md) |
| 4 | 索引、切片、视图和拷贝 | [04-索引切片视图和拷贝.md](study-material/04-索引切片视图和拷贝.md) |
| 5 | 广播机制和向量化计算 | [05-广播机制和向量化计算.md](study-material/05-广播机制和向量化计算.md) |
| 6 | ufunc、聚合、排序和集合运算 | [06-ufunc聚合排序和集合运算.md](study-material/06-ufunc聚合排序和集合运算.md) |
| 7 | 随机数、统计和采样 | [07-随机数统计和采样.md](study-material/07-随机数统计和采样.md) |
| 8 | 线性代数、FFT 和矩阵计算 | [08-线性代数FFT和矩阵计算.md](study-material/08-线性代数FFT和矩阵计算.md) |
| 9 | 缺失值、掩码、异常值和数值稳定性 | [09-缺失值掩码异常值和数值稳定性.md](study-material/09-缺失值掩码异常值和数值稳定性.md) |
| 10 | 性能优化、内存诊断和大数组处理 | [10-性能优化内存诊断和大数组处理.md](study-material/10-性能优化内存诊断和大数组处理.md) |
| 11 | Pandas、SciPy、机器学习和图像生态互操作 | [11-PandasSciPy机器学习和图像生态互操作.md](study-material/11-PandasSciPy机器学习和图像生态互操作.md) |
| 12 | 测试、调试和工程化规范 | [12-测试调试和工程化规范.md](study-material/12-测试调试和工程化规范.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | NumPy 完整知识点清单 | [14-NumPy完整知识点清单.md](study-material/14-NumPy完整知识点清单.md) |
| 15 | 综合练习项目 | [15-综合练习项目.md](study-material/15-综合练习项目.md) |

## 使用建议

先读 [Numpy学习路线图.md](Numpy学习路线图.md)，再按上表顺序推进。若目标是数据分析，重点看第 1、3、4、5、6、7、11 章；若目标是算法和机器学习基础，重点看第 2、5、8、9、10、12 章。

准备面试时先看 [13-面试知识点整理.md](study-material/13-面试知识点整理.md)，再按类别阅读 `study-material/面试知识点/`。

## 推荐产出

学习过程中至少完成三个产出：一个纯 NumPy 数据清洗脚本、一个向量化指标计算模块、一个小型图像或特征工程项目。最后用 [15-综合练习项目.md](study-material/15-综合练习项目.md) 做综合验收。

