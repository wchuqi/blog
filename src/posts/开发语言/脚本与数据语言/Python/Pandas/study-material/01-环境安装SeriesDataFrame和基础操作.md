---
title: "Pandas学习资料：环境安装、Series、DataFrame 和基础操作"
date: 2026-06-20
description: "Series 是带索引的一维数据，DataFrame 是由多列 Series 组成的二维表格。每列可以有不同 dtype，这是 Pandas 相比 NumPy 二维数组的重要差异。"
tags:
  - "开发语言"
  - "Pandas"
category: "开发语言"
---

# Pandas学习资料：环境安装、Series、DataFrame 和基础操作

[返回索引](../Pandas学习资料.md)

## 学习目标

- 安装并验证 Pandas。
- 掌握 Series、DataFrame、基础属性、选择列和基础统计。
- 形成先检查数据结构再处理的习惯。

## 理论导读

Series 是带索引的一维数据，DataFrame 是由多列 Series 组成的二维表格。每列可以有不同 dtype，这是 Pandas 相比 NumPy 二维数组的重要差异。

## 安装和验证

```powershell
pip install pandas
python -c "import pandas as pd; print(pd.__version__)"
```

## 基础示例

```python
import pandas as pd

df = pd.DataFrame(
    {
        "user_id": [1, 2, 3],
        "city": ["上海", "北京", "深圳"],
        "amount": [99.0, 199.0, 50.0],
    }
)

print(df.shape)
print(df.dtypes)
print(df.head())
print(df["amount"].mean())
print(df.describe(include="all"))
```

## 常用检查

| 操作 | 目的 |
| --- | --- |
| `df.head()` | 看样例 |
| `df.info()` | 看列、非空数、dtype |
| `df.describe()` | 看统计摘要 |
| `df.isna().sum()` | 看缺失值 |
| `df.duplicated().sum()` | 看重复行 |
| `df["col"].value_counts()` | 看枚举分布 |

## 练习

创建一个员工表，包含姓名、部门、入职日期、薪资，计算每个部门人数和薪资均值。

## 验收

- 能创建 Series 和 DataFrame。
- 能查看行列数、字段类型和缺失值。
- 能选取单列、多列和基础统计。

## 重点

- 真实项目中第一步永远是数据探查，不是马上写清洗逻辑。

## 难点

- DataFrame 每列 dtype 可以不同，很多运算会因某一列 dtype 错误而失败。

## 易错

> **易错：** 读取数据后不看 `dtypes`，直接做金额或日期计算。
>
> 正确做法：读取后先检查字段类型和缺失情况。

