---
title: "SQL 学习资料：SQL方言差异和迁移兼容深度解析"
date: 2026-06-20
description: "SQL 有标准，但生产数据库都有方言。分页、日期函数、字符串拼接、UPSERT、JSON、布尔类型、NULL 排序、标识符引号、事务隔离实现都可能不同。迁移时最危险的不是语法报错，而是语法能跑但语义变了，例如 NULL 排序、时间时区、字符…"
tags:
  - "数据库"
  - "SQL"
  - "深度解析"
category: "数据库"
---

# SQL 学习资料：SQL方言差异和迁移兼容深度解析

[返回索引](../SQL学习资料.md)

## 学习目标

- 了解 PostgreSQL、MySQL、SQL Server、Oracle 常见 SQL 方言差异。
- 能识别迁移时高风险语法和语义。
- 能制定 SQL 迁移检查清单。

## 理论导读

SQL 有标准，但生产数据库都有方言。分页、日期函数、字符串拼接、UPSERT、JSON、布尔类型、NULL 排序、标识符引号、事务隔离实现都可能不同。迁移时最危险的不是语法报错，而是语法能跑但语义变了，例如 NULL 排序、时间时区、字符串比较、隔离级别行为差异。

## 常见差异

| 主题 | PostgreSQL | MySQL | SQL Server | Oracle |
| --- | --- | --- | --- | --- |
| 分页 | `LIMIT/OFFSET` | `LIMIT/OFFSET` | `OFFSET FETCH` | `FETCH FIRST` |
| UPSERT | `ON CONFLICT` | `ON DUPLICATE KEY` | `MERGE` | `MERGE` |
| 字符串拼接 | `||` | `CONCAT()` | `+` 或 `CONCAT()` | `||` |
| 当前时间 | `now()` | `now()` | `GETDATE()` | `SYSDATE` |
| 布尔 | `boolean` | 常用 `TINYINT(1)` | `bit` | 无原生 boolean 表列传统用法 |
| 标识符引号 | `"name"` | `` `name` `` | `[name]` 或 `"name"` | `"name"` |

## 迁移高风险点

- `LIMIT` 到 `FETCH`。
- `AUTO_INCREMENT`、`SERIAL`、`IDENTITY`、序列。
- `ON CONFLICT` 和 `MERGE` 并发语义。
- 空字符串和 NULL，Oracle 中空字符串常按 NULL 处理。
- 日期时间、时区、精度。
- 字符集、排序规则、大小写敏感。
- JSON 操作符。
- 正则表达式函数。
- CTE 是否物化。
- 隔离级别同名不同实现。

## 迁移检查流程

```text
收集 SQL
  -> 按 DDL、DML、查询、报表、存储过程分类
  -> 标记方言函数和特殊语法
  -> 改写到目标数据库
  -> 构造边界数据：NULL、空字符串、重复值、时区
  -> 对比结果集
  -> 对比执行计划
  -> 压测关键 SQL
```

## 练习

1. 把 MySQL 的 `LIMIT 20, 10` 改成标准偏移写法。
2. 把 PostgreSQL `ON CONFLICT` 改写成 MySQL UPSERT。
3. 列出你项目中 5 个数据库特定函数。

## 验收

- 能说出至少 8 类 SQL 方言差异。
- 能解释迁移时为什么必须构造 NULL 和时间边界数据。
- 能写出迁移检查清单。

## 重点

- SQL 可迁移性不是只看语法，还要看语义和执行计划。

## 难点

- 同名隔离级别、同名函数、同样排序写法可能在不同数据库中结果不同。

## 易错

> **易错：** SQL 能执行就认为迁移成功。
>
> 正确做法：结果集、边界语义、性能计划和并发行为都要验证。

