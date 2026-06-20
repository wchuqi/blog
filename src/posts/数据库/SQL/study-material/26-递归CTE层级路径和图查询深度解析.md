---
title: "SQL 学习资料：递归CTE层级路径和图查询深度解析"
date: 2026-06-20
description: "普通 SQL 擅长处理固定层级的表连接，但组织架构、目录树、上下级关系、依赖图这类数据层级不固定。递归 CTE 提供了在 SQL 内迭代扩展结果集的能力：先给出起点，再不断根据上一轮结果查下一层，直到没有新行或达到限制。它很强，但也容易因为…"
tags:
  - "数据库"
  - "SQL"
  - "深度解析"
category: "数据库"
---

# SQL 学习资料：递归CTE层级路径和图查询深度解析

[返回索引](../SQL学习资料.md)

## 学习目标

- 掌握递归 CTE 的 anchor、recursive member 和终止条件。
- 能查询组织架构、岗位分类、推荐链路等层级数据。
- 理解环检测、深度限制、路径构造和性能风险。

## 理论导读

普通 SQL 擅长处理固定层级的表连接，但组织架构、目录树、上下级关系、依赖图这类数据层级不固定。递归 CTE 提供了在 SQL 内迭代扩展结果集的能力：先给出起点，再不断根据上一轮结果查下一层，直到没有新行或达到限制。它很强，但也容易因为环、深度过大或重复路径导致性能问题。

## 基础结构

```sql
WITH RECURSIVE tree AS (
    -- anchor
    SELECT id, parent_id, name, 1 AS depth
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    -- recursive member
    SELECT c.id, c.parent_id, c.name, t.depth + 1
    FROM categories c
    JOIN tree t ON c.parent_id = t.id
)
SELECT *
FROM tree;
```

SQL Server 语法使用 CTE 递归但不写 `RECURSIVE`；Oracle 也有层级查询 `CONNECT BY` 和递归子查询因子，方言差异要查目标数据库。

## 招聘场景：部门层级

```sql
CREATE TABLE org_units (
    unit_id INTEGER PRIMARY KEY,
    parent_unit_id INTEGER,
    name VARCHAR(100) NOT NULL
);
```

查询某部门所有子部门：

```sql
WITH RECURSIVE sub_units AS (
    SELECT unit_id, parent_unit_id, name, 0 AS depth
    FROM org_units
    WHERE unit_id = 10

    UNION ALL

    SELECT u.unit_id, u.parent_unit_id, u.name, s.depth + 1
    FROM org_units u
    JOIN sub_units s ON u.parent_unit_id = s.unit_id
)
SELECT *
FROM sub_units
ORDER BY depth, unit_id;
```

## 路径构造

PostgreSQL 风格：

```sql
WITH RECURSIVE sub_units AS (
    SELECT unit_id, parent_unit_id, name, 0 AS depth,
           CAST(name AS VARCHAR(1000)) AS path
    FROM org_units
    WHERE parent_unit_id IS NULL

    UNION ALL

    SELECT u.unit_id, u.parent_unit_id, u.name, s.depth + 1,
           s.path || '/' || u.name
    FROM org_units u
    JOIN sub_units s ON u.parent_unit_id = s.unit_id
)
SELECT *
FROM sub_units;
```

MySQL 使用 `CONCAT(s.path, '/', u.name)`，SQL Server 常用 `s.path + '/' + u.name`。

## 环检测

层级数据如果出现 A -> B -> C -> A，会无限递归或直到数据库限制报错。通用思路：

- 设置最大深度。
- 维护路径，拒绝已出现节点。
- 写入时用约束或事务检查防止形成环。

示意：

```sql
WITH RECURSIVE walk AS (
    SELECT unit_id, parent_unit_id, name, 0 AS depth,
           CAST(',' || unit_id || ',' AS VARCHAR(1000)) AS visited
    FROM org_units
    WHERE unit_id = 10

    UNION ALL

    SELECT u.unit_id, u.parent_unit_id, u.name, w.depth + 1,
           w.visited || u.unit_id || ','
    FROM org_units u
    JOIN walk w ON u.parent_unit_id = w.unit_id
    WHERE w.depth < 20
      AND w.visited NOT LIKE '%,' || u.unit_id || ',%'
)
SELECT *
FROM walk;
```

字符串拼接语法按数据库调整。

## 性能注意

- 给 `parent_id` 建索引。
- 限制起点和深度。
- 避免在递归成员中做重聚合或复杂函数。
- 大图查询考虑专门图数据库、闭包表、路径枚举或物化路径。
- 递归 CTE 适合中小层级，不适合无限制全图遍历。

## 建模替代方案

| 模型 | 优点 | 缺点 |
| --- | --- | --- |
| 邻接表 | 写入简单 | 查询子树需递归 |
| 路径枚举 | 查询路径方便 | 移动节点更新多 |
| 闭包表 | 查询祖先后代快 | 写入和存储成本高 |
| 嵌套集合 | 子树查询快 | 更新复杂 |

## 练习

1. 建部门树，查询所有子部门。
2. 查询每个节点的完整路径。
3. 构造环，验证深度限制和环检测。
4. 比较邻接表和闭包表的查询写法。

## 验收

- 能写递归 CTE。
- 能解释 anchor、recursive member 和终止条件。
- 能说明环检测和性能风险。

## 重点

- 递归 CTE 必须有明确收敛条件和深度保护。

## 难点

- 跨数据库递归语法和字符串路径处理差异明显。

## 易错

> **易错：** 对全表层级无条件递归。
>
> 正确做法：限定起点、深度、路径，并为父节点列建索引。

