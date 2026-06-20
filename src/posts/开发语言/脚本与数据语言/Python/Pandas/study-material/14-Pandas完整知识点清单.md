---
title: "Pandas学习资料：Pandas完整知识点清单"
date: 2026-06-20
description: "DataFrame。"
tags:
  - "开发语言"
  - "Pandas"
  - "知识清单"
category: "开发语言"
---

# Pandas学习资料：Pandas完整知识点清单

[返回索引](../Pandas学习资料.md)

## 1. 基础对象

- Series。
- DataFrame。
- Index、MultiIndex。
- 行列标签。
- shape、columns、dtypes、info、describe。

## 2. 选择和对齐

- `loc`、`iloc`。
- 单列、多列选择。
- 布尔过滤。
- query。
- 排序。
- 索引对齐。
- 链式赋值风险。

## 3. dtype 和缺失值

- 数值、字符串、布尔、category、datetime。
- nullable dtype。
- `NA`、`NaN`、`None`。
- `isna`、`fillna`、`dropna`。
- 类型转换。

## 4. IO

- CSV、Excel、Parquet、JSON、SQL。
- 编码、分隔符、表头、列选择。
- dtype、parse_dates。
- chunksize。
- 导出 index 控制。

## 5. 清洗转换

- rename、drop、drop_duplicates。
- assign、pipe。
- map、replace。
- where、mask、clip。
- 字符串处理。
- 异常值处理。

## 6. 聚合和透视

- groupby。
- agg、transform、filter、apply。
- pivot、pivot_table、crosstab。
- 多级索引整理。

## 7. 关联和拼接

- concat。
- merge。
- join。
- validate。
- indicator。
- 主键唯一性。
- 行数膨胀检查。

## 8. 时间序列

- to_datetime。
- DatetimeIndex。
- 时区。
- resample。
- rolling、expanding。
- shift、diff。
- 时间字段提取。

## 9. 性能和内存

- memory_usage。
- object dtype 风险。
- category。
- usecols、dtype。
- 分块读取。
- 向量化替代 apply。
- Copy-on-Write 相关拷贝意识。
- Pandas 边界和替代工具。

## 10. 工程化

- 函数化数据管道。
- 字段契约。
- 数据质量断言。
- pandas.testing。
- 日志和配置。
- 可复现输出。

## 自检

- 是否能解释两个 Series 相加为什么会出现缺失？
- 是否能判断 `loc`、`iloc`、布尔过滤的适用场景？
- 是否能处理缺失金额和缺失用户 ID？
- 是否能检查 merge 后行数是否异常？
- 是否能把 notebook 逻辑拆成可测试函数？

