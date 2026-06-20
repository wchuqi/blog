---
title: "SQL 学习资料：SQL环境表结构和样例数据"
date: 2026-06-20
description: "学习 SQL 不能只看语法片段。没有稳定样例数据，就很难验证连接是否重复、外连接是否丢行、窗口排序是否正确、事务并发是否会重复写。这里使用招聘系统作为练习域，因为它天然包含一对多、多对多、状态流转、时间排序、去重、统计和并发写入。"
tags:
  - "数据库"
  - "SQL"
category: "数据库"
---

# SQL 学习资料：SQL环境表结构和样例数据

[返回索引](../SQL学习资料.md)

## 学习目标

- 准备一套可复用的练习表。
- 理解样例业务中的实体、关系和约束。
- 能用同一批数据练习查询、连接、聚合、事务和性能。

## 理论导读

学习 SQL 不能只看语法片段。没有稳定样例数据，就很难验证连接是否重复、外连接是否丢行、窗口排序是否正确、事务并发是否会重复写。这里使用招聘系统作为练习域，因为它天然包含一对多、多对多、状态流转、时间排序、去重、统计和并发写入。

## 样例实体

| 表 | 含义 |
| --- | --- |
| departments | 部门 |
| jobs | 岗位 |
| candidates | 候选人 |
| applications | 投递 |
| interviews | 面试 |
| offers | Offer |

## 建表示例

```sql
CREATE TABLE departments (
    department_id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE jobs (
    job_id INTEGER PRIMARY KEY,
    department_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    min_salary INTEGER,
    max_salary INTEGER,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    CHECK (min_salary IS NULL OR max_salary IS NULL OR min_salary <= max_salary)
);

CREATE TABLE candidates (
    candidate_id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    city VARCHAR(50),
    years_experience INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE applications (
    application_id INTEGER PRIMARY KEY,
    candidate_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL,
    applied_at TIMESTAMP NOT NULL,
    source VARCHAR(50),
    FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id),
    FOREIGN KEY (job_id) REFERENCES jobs(job_id),
    UNIQUE (candidate_id, job_id)
);

CREATE TABLE interviews (
    interview_id INTEGER PRIMARY KEY,
    application_id INTEGER NOT NULL,
    round_no INTEGER NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    result VARCHAR(30),
    FOREIGN KEY (application_id) REFERENCES applications(application_id),
    UNIQUE (application_id, round_no)
);

CREATE TABLE offers (
    offer_id INTEGER PRIMARY KEY,
    application_id INTEGER NOT NULL UNIQUE,
    offered_salary INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL,
    offered_at TIMESTAMP NOT NULL,
    FOREIGN KEY (application_id) REFERENCES applications(application_id)
);
```

## 样例数据

```sql
INSERT INTO departments (department_id, name) VALUES
(1, 'Engineering'),
(2, 'Data'),
(3, 'Product');

INSERT INTO jobs (job_id, department_id, title, city, min_salary, max_salary, status, created_at) VALUES
(101, 1, 'Java Backend Engineer', 'Shanghai', 25000, 45000, 'open', '2026-01-02 09:00:00'),
(102, 1, 'Platform Engineer', 'Beijing', 30000, 50000, 'open', '2026-01-05 09:00:00'),
(201, 2, 'Data Analyst', 'Shanghai', 18000, 32000, 'open', '2026-01-08 09:00:00'),
(301, 3, 'Product Manager', 'Shenzhen', 22000, 40000, 'closed', '2026-01-10 09:00:00');

INSERT INTO candidates (candidate_id, name, email, city, years_experience, created_at) VALUES
(1, 'Alice', 'alice@example.com', 'Shanghai', 5, '2026-02-01 10:00:00'),
(2, 'Bob', 'bob@example.com', 'Beijing', 3, '2026-02-02 10:00:00'),
(3, 'Cindy', 'cindy@example.com', NULL, 8, '2026-02-03 10:00:00'),
(4, 'David', 'david@example.com', 'Shanghai', 1, '2026-02-04 10:00:00');

INSERT INTO applications (application_id, candidate_id, job_id, status, applied_at, source) VALUES
(1001, 1, 101, 'interviewing', '2026-03-01 09:00:00', 'referral'),
(1002, 1, 201, 'rejected', '2026-03-02 09:00:00', 'website'),
(1003, 2, 101, 'screening', '2026-03-03 09:00:00', 'website'),
(1004, 3, 102, 'offered', '2026-03-04 09:00:00', NULL),
(1005, 4, 201, 'screening', '2026-03-05 09:00:00', 'website');

INSERT INTO interviews (interview_id, application_id, round_no, scheduled_at, result) VALUES
(1, 1001, 1, '2026-03-06 14:00:00', 'pass'),
(2, 1001, 2, '2026-03-08 14:00:00', NULL),
(3, 1004, 1, '2026-03-07 15:00:00', 'pass');

INSERT INTO offers (offer_id, application_id, offered_salary, status, offered_at) VALUES
(1, 1004, 42000, 'sent', '2026-03-10 10:00:00');
```

## 方言提示

- PostgreSQL、MySQL、SQL Server、Oracle 的自增主键语法不同，本资料先使用显式整数主键方便跨库练习。
- `TIMESTAMP` 字面量多数数据库可识别，但日期函数差异很大。
- `LIMIT/OFFSET` 不是所有数据库都支持，SQL Server 常用 `OFFSET ... FETCH`，Oracle 新版本也支持 `FETCH FIRST`。

## 练习

1. 把以上表结构和数据导入你的练习数据库。
2. 为 `applications(job_id, applied_at)` 创建索引。
3. 写 SQL 检查每个唯一约束是否符合业务预期。

## 验收

- 能说明每张表的业务含义。
- 能解释 `UNIQUE(candidate_id, job_id)` 为什么必要。
- 能基于样例数据写出至少 10 条查询。

## 重点

- 样例数据中的 NULL、重复投递约束、外键关系都是后续练习的基础。

## 易错

> **易错：** 只创建表不创建约束。
>
> 正确做法：主键、外键、唯一约束和检查约束都应作为建模的一部分。

