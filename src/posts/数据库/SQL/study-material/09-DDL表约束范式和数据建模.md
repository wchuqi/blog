---
title: "SQL 学习资料：DDL表约束范式和数据建模"
date: 2026-06-20
description: "DDL 是业务模型的骨架。一个表结构不仅存数据，还表达“什么数据是合法的”。如果候选人邮箱必须唯一，应该有唯一约束；如果薪资下限不能大于上限，应该有检查约束；如果投递必须关联存在的候选人和岗位，应该有外键或等价的数据完整性策略。没有约束的系…"
tags:
  - "数据库"
  - "SQL"
category: "数据库"
---

# SQL 学习资料：DDL表约束范式和数据建模

[返回索引](../SQL学习资料.md)

## 学习目标

- 掌握表、列、主键、外键、唯一、检查、默认值和索引的建模作用。
- 理解范式和反范式的取舍。
- 能把业务规则落到数据库约束。

## 理论导读

DDL 是业务模型的骨架。一个表结构不仅存数据，还表达“什么数据是合法的”。如果候选人邮箱必须唯一，应该有唯一约束；如果薪资下限不能大于上限，应该有检查约束；如果投递必须关联存在的候选人和岗位，应该有外键或等价的数据完整性策略。没有约束的系统，把所有正确性压力都推给应用代码，遇到并发、脚本导入、后台修复时很容易破坏数据。

## 约束类型

| 约束 | 作用 |
| --- | --- |
| PRIMARY KEY | 定义行身份 |
| FOREIGN KEY | 保证引用完整性 |
| UNIQUE | 保证业务唯一 |
| NOT NULL | 禁止缺失 |
| CHECK | 保证取值规则 |
| DEFAULT | 提供默认值 |

## 建模例子

```sql
CREATE TABLE applications (
    application_id INTEGER PRIMARY KEY,
    candidate_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL,
    applied_at TIMESTAMP NOT NULL,
    source VARCHAR(50),
    FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id),
    FOREIGN KEY (job_id) REFERENCES jobs(job_id),
    UNIQUE (candidate_id, job_id),
    CHECK (status IN ('screening', 'interviewing', 'offered', 'rejected', 'cancelled'))
);
```

## 范式

- 第一范式：列值保持原子，不把多个值塞进一个字段。
- 第二范式：非主属性依赖整个主键。
- 第三范式：非主属性不依赖其他非主属性。

范式减少冗余和更新异常，但过度范式化可能让查询复杂。反范式可以提升读取性能，但必须有同步和一致性方案。

## 反范式场景

| 场景 | 做法 | 风险 |
| --- | --- | --- |
| 高频报表 | 汇总表 | 延迟和一致性 |
| 搜索列表 | 冗余展示字段 | 更新同步 |
| 大宽表分析 | 预计算字段 | 存储增加 |

## 练习

1. 为投递状态增加 CHECK 约束。
2. 设计“面试评价”表，要求每轮面试只能有一条评价。
3. 说明岗位表中部门名称是否应该冗余。

## 验收

- 能把业务唯一规则转换为 UNIQUE。
- 能解释外键的价值和成本。
- 能说明范式和反范式取舍。

## 重点

- 约束是数据质量的最后防线。

## 难点

- 分布式系统、分库分表或高写入场景可能弱化外键，但不等于不要完整性设计。

## 易错

> **易错：** 为了“灵活”把状态、标签、配置都塞进字符串或 JSON。
>
> 正确做法：核心业务字段优先结构化，并用约束保护。

