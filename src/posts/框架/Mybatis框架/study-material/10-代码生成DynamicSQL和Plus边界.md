---
title: "MyBatis 学习资料：代码生成、Dynamic SQL 和 MyBatis-Plus 边界"
date: 2026-06-20
description: "MyBatis Generator 根据数据库表生成 Mapper、实体和 XML。适合表结构稳定、CRUD 多的项目。"
tags:
  - "框架"
  - "Mybatis框架"
category: "框架"
---

# MyBatis 学习资料：代码生成、Dynamic SQL 和 MyBatis-Plus 边界

[返回索引](../Mybatis学习资料.md)

## 学习目标

- 理解 MyBatis Generator、MyBatis Dynamic SQL、MyBatis-Plus 的定位。
- 能判断什么时候使用代码生成，什么时候手写 SQL。
- 避免把增强工具当成 MyBatis 核心机制。

## MyBatis Generator

MyBatis Generator 根据数据库表生成 Mapper、实体和 XML。适合表结构稳定、CRUD 多的项目。

风险：

- 生成代码覆盖手写修改。
- 表结构设计问题被带到代码里。
- 复杂业务 SQL 仍要手写。

## MyBatis Dynamic SQL

Dynamic SQL 用 Java DSL 构建 SQL，减少 XML 动态 SQL。

适合：

- 希望类型化构造查询。
- 动态条件很多。
- 团队能接受 Java DSL。

风险：

- SQL 可读性不如直接 XML。
- 复杂 SQL 仍可能难维护。

## MyBatis-Plus

MyBatis-Plus 是常见增强框架，提供：

- BaseMapper CRUD。
- 条件构造器。
- 分页插件。
- 逻辑删除。
- 自动填充。

边界：

- 它不是 MyBatis 官方核心。
- 复杂 SQL、执行链路、事务、缓存、插件本质仍要理解 MyBatis。
- Wrapper 拼接条件也要防止误用和性能问题。

## 选择建议

| 场景 | 建议 |
| --- | --- |
| 简单 CRUD 很多 | Generator 或 MyBatis-Plus |
| 复杂查询和报表 | 手写 XML |
| 强类型动态查询 | MyBatis Dynamic SQL |
| 面试和底层理解 | 先学 MyBatis Core |

## 练习

1. 用 Generator 生成用户表 Mapper。
2. 对比生成 XML 和手写 XML。
3. 用 Dynamic SQL 写条件查询。
4. 分析 MyBatis-Plus Wrapper 生成的 SQL。

## 验收

- 能说清三类工具定位。
- 能解释为什么先学 MyBatis Core。
- 能判断复杂 SQL 是否适合生成。

## 重点

- 工具提高效率，不替代 SQL 能力。
- 复杂业务 SQL 要保持可读、可审查、可优化。

## 易错

> **易错：** 只学 MyBatis-Plus，不理解 MyBatis 执行链路。
>
> 正确做法：先掌握 MyBatis Core，再使用增强工具提高效率。

