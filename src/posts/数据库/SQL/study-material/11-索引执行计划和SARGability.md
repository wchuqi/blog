---
title: "SQL 学习资料：索引执行计划和SARGability"
date: 2026-06-20
description: "索引不是“越多越快”。索引是额外的数据结构，读取时可以减少扫描，写入时需要维护，存储也有成本。优化 SQL 的关键不是看到 WHERE 就建索引，而是理解谓词是否能利用索引、索引列顺序是否匹配过滤和排序、返回行数是否足够少、执行计划估算是否…"
tags:
  - "数据库"
  - "SQL"
category: "数据库"
---

# SQL 学习资料：索引执行计划和SARGability

[返回索引](../SQL学习资料.md)

## 学习目标

- 理解索引如何帮助过滤、排序、连接和覆盖查询。
- 掌握组合索引、选择性、SARGability。
- 能读基础执行计划并定位慢查询原因。

## 理论导读

索引不是“越多越快”。索引是额外的数据结构，读取时可以减少扫描，写入时需要维护，存储也有成本。优化 SQL 的关键不是看到 WHERE 就建索引，而是理解谓词是否能利用索引、索引列顺序是否匹配过滤和排序、返回行数是否足够少、执行计划估算是否准确。

## SARGability

SARGable 表示谓词能有效利用索引查找。不可 SARGable 的典型写法：

```sql
WHERE DATE(applied_at) = '2026-03-01'
```

更好：

```sql
WHERE applied_at >= '2026-03-01'
  AND applied_at < '2026-03-02'
```

## 组合索引

```sql
CREATE INDEX idx_applications_job_time
ON applications (job_id, applied_at DESC, application_id DESC);
```

适合：

```sql
SELECT *
FROM applications
WHERE job_id = 101
ORDER BY applied_at DESC, application_id DESC
LIMIT 20;
```

组合索引列顺序要服务：

- 等值过滤。
- 范围过滤。
- 排序。
- 覆盖查询。

## 执行计划关注点

| 线索 | 含义 |
| --- | --- |
| Scan 类型 | 全表扫描、索引扫描、范围扫描 |
| Rows | 估算行数和实际行数 |
| Join 类型 | Nested Loop、Hash Join、Merge Join |
| Sort | 是否额外排序 |
| Filter | 是否扫描后再过滤 |
| Cost | 优化器估算成本，不同数据库不可横向比较 |

## 索引失效常见原因

- 函数包列。
- 隐式类型转换。
- 前导通配：`LIKE '%abc'`。
- 低选择性列单独建索引。
- 组合索引列顺序不匹配。
- OR 条件复杂。
- 统计信息过期。

## 练习

1. 为 `applications(job_id, applied_at)` 建索引。
2. 对比日期函数包列和范围查询的执行计划。
3. 查询某岗位最新投递，观察是否需要额外排序。
4. 找一个低选择性字段，解释为什么单独索引收益小。

## 验收

- 能解释 SARGability。
- 能说明组合索引列顺序。
- 能读执行计划中的扫描、连接、排序。

## 重点

- 索引优化要服务具体查询，不是孤立建索引。

## 难点

- 优化器基于统计信息和成本估算选择计划，估错行数会导致选错算法。

## 易错

> **易错：** 慢查询就给 WHERE 每个字段都单独建索引。
>
> 正确做法：按查询模式设计组合索引，并验证执行计划。

