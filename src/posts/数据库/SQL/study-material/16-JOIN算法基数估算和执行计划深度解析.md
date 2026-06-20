---
title: "SQL 学习资料：JOIN算法基数估算和执行计划深度解析"
date: 2026-06-20
description: "SQL 写的是逻辑连接，数据库执行时必须选择物理算法。小表驱动大表索引查找可能适合 Nested Loop；两边大表等值连接可能适合 Hash Join；两边已经有序或可利用索引顺序时可能适合 Merge Join。优化器选择依赖基数估算，…"
tags:
  - "数据库"
  - "SQL"
  - "深度解析"
category: "数据库"
---

# SQL 学习资料：JOIN算法基数估算和执行计划深度解析

[返回索引](../SQL学习资料.md)

## 学习目标

- 理解 Nested Loop、Hash Join、Merge Join 的适用场景。
- 掌握基数估算为什么影响执行计划。
- 能分析 JOIN 慢查询中的扫描、连接、排序和行数放大。

## 理论导读

SQL 写的是逻辑连接，数据库执行时必须选择物理算法。小表驱动大表索引查找可能适合 Nested Loop；两边大表等值连接可能适合 Hash Join；两边已经有序或可利用索引顺序时可能适合 Merge Join。优化器选择依赖基数估算，如果估算行数错了，就可能选错 JOIN 顺序和算法。

## JOIN 算法

| 算法 | 适合场景 | 风险 |
| --- | --- | --- |
| Nested Loop | 外表小，内表有索引 | 外表估小但实际很大时灾难 |
| Hash Join | 大表等值连接 | 需要内存，可能溢写磁盘 |
| Merge Join | 两边按连接键有序 | 排序成本可能高 |

## Nested Loop

```text
for each row in outer:
    lookup matching rows in inner
```

如果外表 100 行，内表索引查找很快，效果很好。如果外表实际 100 万行，内表每次查找一次，成本会放大。

## Hash Join

```text
build hash table on smaller input
scan larger input and probe hash table
```

适合等值连接。风险是 build 侧太大导致内存不足、分批或落盘。

## Merge Join

```text
sort both sides by join key
walk two ordered streams
```

如果两侧本来就按连接键有序，或可利用索引顺序，Merge Join 很高效。

## 基数估算

优化器会估算：

- 表总行数。
- 条件选择性。
- 列值分布。
- NULL 比例。
- distinct 值数量。
- 多列相关性，很多数据库估算困难。

估算错误常见原因：

- 统计信息过期。
- 条件相关性强。
- 数据倾斜。
- 函数包列无法使用统计。
- 参数值分布差异大。

## JOIN 慢查询排查

```text
看执行计划
  -> 哪张表先扫
  -> 每步估算行数和实际行数差距
  -> JOIN 算法
  -> 是否有重复放大
  -> 是否额外排序或 hash 溢出
  -> 索引是否支持连接键和过滤条件
```

## 例子：先聚合再 JOIN

错误风险：先 JOIN 明细再统计，行数可能放大。

```sql
SELECT d.name, COUNT(*)
FROM departments d
JOIN jobs j ON j.department_id = d.department_id
JOIN applications a ON a.job_id = j.job_id
JOIN interviews i ON i.application_id = a.application_id
GROUP BY d.name;
```

如果一个投递有多轮面试，统计的是面试行数，不是投递数。应先明确业务粒度。

## 练习

1. 解释一个一对多 JOIN 为什么会放大行数。
2. 为 `applications(candidate_id)` 和 `applications(job_id)` 设计索引。
3. 对比 EXISTS 和 JOIN + DISTINCT 的执行计划。

## 验收

- 能说出三种 JOIN 算法的适用场景。
- 能解释基数估算错误的后果。
- 能从执行计划中发现 JOIN 行数放大。

## 重点

- JOIN 性能问题常常是行数估错、顺序选错或粒度错。

## 难点

- 优化器选择不是看 SQL 文本长度，而是看成本估算和统计信息。

## 易错

> **易错：** JOIN 慢就盲目加索引。
>
> 正确做法：先看 JOIN 算法、驱动表、估算行数和实际行数。

