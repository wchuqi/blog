---
title: "SQL 学习资料：JOIN连接匹配和半连接反连接"
date: 2026-06-20
description: "JOIN 的本质是按照条件把两个结果集配对。它不是简单“把两张表拼起来”，而是根据匹配关系生成新行。如果一边一行匹配另一边多行，结果行数就会放大；如果没有匹配，内连接会丢行，外连接会保留主表行并把另一边补 NULL。很多统计翻倍、丢数据、分…"
tags:
  - "数据库"
  - "SQL"
category: "数据库"
---

# SQL 学习资料：JOIN连接匹配和半连接反连接

[返回索引](../SQL学习资料.md)

## 学习目标

- 掌握 INNER JOIN、LEFT JOIN、RIGHT JOIN、FULL JOIN、CROSS JOIN。
- 理解连接匹配会改变行数。
- 掌握半连接和反连接的写法。
- 避免外连接被 WHERE 条件误改成内连接效果。

## 理论导读

JOIN 的本质是按照条件把两个结果集配对。它不是简单“把两张表拼起来”，而是根据匹配关系生成新行。如果一边一行匹配另一边多行，结果行数就会放大；如果没有匹配，内连接会丢行，外连接会保留主表行并把另一边补 NULL。很多统计翻倍、丢数据、分页异常都来自 JOIN 粒度没想清楚。

## 常见 JOIN

```sql
SELECT c.name, j.title, a.status
FROM applications a
JOIN candidates c ON c.candidate_id = a.candidate_id
JOIN jobs j ON j.job_id = a.job_id;
```

LEFT JOIN：

```sql
SELECT c.name, a.application_id
FROM candidates c
LEFT JOIN applications a
  ON a.candidate_id = c.candidate_id;
```

## 外连接过滤位置

错误写法：

```sql
SELECT c.name, a.application_id
FROM candidates c
LEFT JOIN applications a
  ON a.candidate_id = c.candidate_id
WHERE a.status = 'screening';
```

这个 `WHERE` 会过滤掉右表为 NULL 的行，使结果类似内连接。若想保留所有候选人，只筛选右表匹配条件，应写在 `ON`：

```sql
SELECT c.name, a.application_id
FROM candidates c
LEFT JOIN applications a
  ON a.candidate_id = c.candidate_id
 AND a.status = 'screening';
```

## 半连接：存在即可

查询有投递记录的候选人：

```sql
SELECT c.*
FROM candidates c
WHERE EXISTS (
    SELECT 1
    FROM applications a
    WHERE a.candidate_id = c.candidate_id
);
```

半连接不需要返回右表列，只关心是否存在。相比 JOIN 后 DISTINCT，它更直接表达意图。

## 反连接：不存在

查询没有面试记录的投递：

```sql
SELECT a.*
FROM applications a
WHERE NOT EXISTS (
    SELECT 1
    FROM interviews i
    WHERE i.application_id = a.application_id
);
```

也可：

```sql
SELECT a.*
FROM applications a
LEFT JOIN interviews i
  ON i.application_id = a.application_id
WHERE i.interview_id IS NULL;
```

## JOIN 行数心智模型

| 关系 | 结果风险 |
| --- | --- |
| 一对一 | 行数通常不变 |
| 一对多 | 主表行可能被放大 |
| 多对多 | 行数可能爆炸 |
| 外连接 | 未匹配侧补 NULL |
| 半连接 | 不放大左表行 |

## 练习

1. 查询每个投递对应的候选人和岗位。
2. 查询所有候选人及其投递记录，包含未投递候选人。
3. 查询有 Offer 的候选人，用 EXISTS 实现。
4. 查询没有面试的投递，用 `NOT EXISTS` 和 `LEFT JOIN` 各写一版。

## 验收

- 能解释 LEFT JOIN 中 `ON` 和 `WHERE` 条件的差异。
- 能判断 JOIN 是否会放大行数。
- 能用 EXISTS 表达半连接。

## 重点

- JOIN 前先确认关系基数：一对一、一对多还是多对多。
- 只判断存在性时优先考虑 EXISTS。

## 难点

- 外连接补 NULL 后再进入 WHERE，很多条件会把补出来的行过滤掉。

## 易错

> **易错：** JOIN 后发现重复，就直接加 `DISTINCT`。
>
> 正确做法：先确认连接条件和业务粒度，避免用 DISTINCT 掩盖错误 JOIN。

