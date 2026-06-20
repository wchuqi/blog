---
title: "Pandas学习资料：concat、merge、join 和关系型数据处理"
date: 2026-06-20
description: "concat 用于拼接同结构或相似结构的数据；merge 用于按键关联表；join 更偏索引关联。关联操作会改变行数和列数，必须检查主键唯一性、缺失匹配和重复匹配。"
tags:
  - "开发语言"
  - "Pandas"
category: "开发语言"
---

# Pandas学习资料：concat、merge、join 和关系型数据处理

[返回索引](../Pandas学习资料.md)

## 学习目标

- 掌握纵向拼接、横向关联和索引 join。
- 理解一对一、一对多、多对多关联。
- 会检查 merge 后行数和主键唯一性。

## 理论导读

`concat` 用于拼接同结构或相似结构的数据；`merge` 用于按键关联表；`join` 更偏索引关联。关联操作会改变行数和列数，必须检查主键唯一性、缺失匹配和重复匹配。

## 示例

```python
import pandas as pd

orders = pd.DataFrame({"order_id": [1, 2], "user_id": [10, 20], "amount": [99, 199]})
users = pd.DataFrame({"user_id": [10, 20], "city": ["上海", "北京"]})

result = orders.merge(users, on="user_id", how="left", validate="many_to_one")
```

## 关联类型

| how | 含义 |
| --- | --- |
| `inner` | 只保留两边匹配 |
| `left` | 保留左表全部 |
| `right` | 保留右表全部 |
| `outer` | 保留两边全部 |

## 练习

把订单表、用户表、商品表关联成分析宽表，检查关联前后订单行数是否变化。

## 验收

- 能区分 concat 和 merge。
- 能使用 `validate` 检查关联关系。
- 能处理重复键和未匹配行。

## 重点

- merge 后必须检查行数、主键唯一性和关键字段缺失率。

## 难点

- 多对多关联会造成行数乘法膨胀，可能是严重业务错误。

## 易错

> **易错：** merge 后不检查行数，导致金额汇总翻倍。
>
> 正确做法：关联前检查键唯一性，关联时使用 `validate`，关联后校验总行数和金额。

