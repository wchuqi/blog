---
title: "SQL 面试知识点：JOIN连接和子查询"
date: 2026-06-20
description: "INNER JOIN 只返回两边都匹配的行；LEFT JOIN 保留左表所有行，右表无匹配时补 NULL。LEFT JOIN 常用于“主表全量 + 可选关联信息”的场景。"
tags:
  - "数据库"
  - "SQL"
  - "面试"
category: "数据库"
---

# SQL 面试知识点：JOIN连接和子查询

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../SQL学习资料.md)

## 一、JOIN 连接和子查询

### 1. INNER JOIN 和 LEFT JOIN 有什么区别？

**参考答案：**

INNER JOIN 只返回两边都匹配的行；LEFT JOIN 保留左表所有行，右表无匹配时补 NULL。LEFT JOIN 常用于“主表全量 + 可选关联信息”的场景。

### 2. LEFT JOIN 后在 WHERE 中写右表条件有什么风险？

**参考答案：**

LEFT JOIN 会先补 NULL，再执行 WHERE。如果 WHERE 中写 `right_col = 'x'`，右表未匹配行的 `right_col` 是 NULL，条件结果为 UNKNOWN，会被过滤，效果接近 INNER JOIN。

```sql
-- 保留所有候选人，只匹配 screening 投递
SELECT c.name, a.application_id
FROM candidates c
LEFT JOIN applications a
  ON a.candidate_id = c.candidate_id
 AND a.status = 'screening';
```

> **重点：** 右表过滤条件放 ON 还是 WHERE，语义可能完全不同。

### 3. JOIN 为什么会导致统计结果翻倍？

**参考答案：**

JOIN 会按匹配行配对。一对多或多对多连接会放大行数，如果随后 `COUNT(*)`，统计的是连接后的行数，不一定是原业务实体数。例如投递连接面试后，一个投递多轮面试会变成多行。

> **易错：** 用 `DISTINCT` 掩盖 JOIN 粒度错误。

### 4. 半连接和反连接是什么？

**参考答案：**

半连接只判断右表是否存在匹配，不返回右表列，常用 `EXISTS`；反连接判断不存在，常用 `NOT EXISTS`。

```sql
SELECT c.*
FROM candidates c
WHERE EXISTS (
    SELECT 1 FROM applications a
    WHERE a.candidate_id = c.candidate_id
);
```

### 5. `EXISTS` 和 `IN` 怎么选？

**参考答案：**

表达存在性时 `EXISTS` 更直接，尤其是相关子查询和可能含 NULL 的反向判断中更稳妥。`IN` 适合小集合或明确非 NULL 的列表。实际性能要看优化器，很多数据库会改写为半连接。

### 6. CTE 一定能提升性能吗？

**参考答案：**

不一定。CTE 主要提升可读性，优化器可能内联，也可能物化；不同数据库版本策略不同。复杂 SQL 用 CTE 分层后仍要看执行计划。

### 7. 相关子查询有什么性能风险？

**参考答案：**

相关子查询依赖外层行，如果优化器不能改写，可能对外层每行执行一次内层查询。可以考虑改写为 JOIN + GROUP BY 或 EXISTS，并通过执行计划验证。

