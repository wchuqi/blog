---
title: "Pandas学习资料"
date: 2026-06-20
description: "这是一套面向 Python 数据分析、数据清洗、报表处理、特征工程和面试准备的 Pandas 中文学习资料。内容从 Series/DataFrame、Index 和对齐机制开始，逐步推进到 dtype、缺失值、IO、清洗转换、groupby…"
tags:
  - "开发语言"
  - "Pandas"
  - "学习资料总览"
category: "开发语言"
---

# Pandas学习资料

这是一套面向 Python 数据分析、数据清洗、报表处理、特征工程和面试准备的 Pandas 中文学习资料。内容从 Series/DataFrame、Index 和对齐机制开始，逐步推进到 dtype、缺失值、IO、清洗转换、groupby、merge、时间序列、性能优化、工程化测试和综合项目。

版本基准：Pandas 3.0.3、Python 3.10+、NumPy 2.x。目录名按用户要求使用 `Pandas`。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览、定位和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 环境安装、Series、DataFrame 和基础操作 | [01-环境安装SeriesDataFrame和基础操作.md](study-material/01-环境安装SeriesDataFrame和基础操作.md) |
| 2 | Index、对齐机制和选择过滤 | [02-Index对齐机制和选择过滤.md](study-material/02-Index对齐机制和选择过滤.md) |
| 3 | dtype、缺失值和 nullable 类型 | [03-dtype缺失值和nullable类型.md](study-material/03-dtype缺失值和nullable类型.md) |
| 4 | 数据读取、写出和文件格式 | [04-数据读取写出和文件格式.md](study-material/04-数据读取写出和文件格式.md) |
| 5 | 数据清洗、转换和特征构造 | [05-数据清洗转换和特征构造.md](study-material/05-数据清洗转换和特征构造.md) |
| 6 | groupby、聚合、transform 和透视表 | [06-groupby聚合transform和透视表.md](study-material/06-groupby聚合transform和透视表.md) |
| 7 | concat、merge、join 和关系型数据处理 | [07-concatMergeJoin和关系型数据处理.md](study-material/07-concatMergeJoin和关系型数据处理.md) |
| 8 | 时间序列、窗口计算和重采样 | [08-时间序列窗口计算和重采样.md](study-material/08-时间序列窗口计算和重采样.md) |
| 9 | 字符串、分类数据和文本清洗 | [09-字符串分类数据和文本清洗.md](study-material/09-字符串分类数据和文本清洗.md) |
| 10 | 性能优化、内存诊断和大数据边界 | [10-性能优化内存诊断和大数据边界.md](study-material/10-性能优化内存诊断和大数据边界.md) |
| 11 | 可视化、报表导出和生态互操作 | [11-可视化报表导出和生态互操作.md](study-material/11-可视化报表导出和生态互操作.md) |
| 12 | 测试、调试和数据管道工程化 | [12-测试调试和数据管道工程化.md](study-material/12-测试调试和数据管道工程化.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | Pandas 完整知识点清单 | [14-Pandas完整知识点清单.md](study-material/14-Pandas完整知识点清单.md) |
| 15 | 综合练习项目 | [15-综合练习项目.md](study-material/15-综合练习项目.md) |

## 使用建议

先读 [Pandas学习路线图.md](Pandas学习路线图.md)，再按上表顺序推进。做数据清洗和分析重点看第 1 到 7 章；做时间序列重点看第 8 章；做生产数据管道重点看第 10 到 12 章。

准备面试时先看 [13-面试知识点整理.md](study-material/13-面试知识点整理.md)，再按类别阅读 `study-material/面试知识点/`。

## 推荐产出

学习过程中至少完成三个产出：一个 CSV 清洗脚本、一个销售分析报表、一个可测试的数据管道项目。最后用 [15-综合练习项目.md](study-material/15-综合练习项目.md) 做综合验收。

