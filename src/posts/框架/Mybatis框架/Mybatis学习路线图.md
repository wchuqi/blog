---
title: "MyBatis 学习路线图"
date: 2026-06-20
description: "版本基准：MyBatis Core 3.5.19，Spring Boot 集成以 MyBatis Spring Boot Starter 4.0.x 为基准。学习前建议具备 Java、JDBC、SQL、Spring Boot、事务和基本数据…"
tags:
  - "框架"
  - "Mybatis框架"
  - "学习路线图"
category: "框架"
---

# MyBatis 学习路线图

版本基准：MyBatis Core `3.5.19`，Spring Boot 集成以 MyBatis Spring Boot Starter `4.0.x` 为基准。学习前建议具备 Java、JDBC、SQL、Spring Boot、事务和基本数据库索引知识。

## 阶段 1：基础认知

- 目标：理解 MyBatis 是 SQL Mapper，不是完整 ORM。
- 需要掌握：Mapper 接口、XML、SqlSession、参数绑定、结果映射。
- 例子：`UserMapper.selectById(1)` 最终执行一条 SQL 并把 ResultSet 映射成 User。
- 练习：写一个用户表 CRUD Mapper。
- 验收：能解释 MyBatis 与 JDBC、JPA/Hibernate 的差异。
- 重点：MyBatis 让 SQL 可控，映射可配置。
- 易错：以为 MyBatis 会自动管理对象状态和脏检查。

## 阶段 2：核心执行链路

- 目标：能说清 Mapper 方法到 JDBC 执行之间发生了什么。
- 需要掌握：MapperProxy、MappedStatement、SqlSource、BoundSql、Executor、StatementHandler、ParameterHandler、ResultSetHandler、TypeHandler。
- 例子：Mapper 方法参数如何变成 PreparedStatement 参数。
- 练习：打开 MyBatis 日志，观察最终 SQL 和参数。
- 验收：能画出 MyBatis 执行链路。
- 重点：MyBatis 的核心是把方法调用转成 MappedStatement 执行。
- 难点：动态 SQL、参数名解析和结果映射在执行链路中交织。

## 阶段 3：SQL 和映射能力

- 目标：掌握 XML、注解、动态 SQL、ResultMap 和关联映射。
- 需要掌握：`#{}`、`${}`、`if`、`choose`、`foreach`、`trim`、`resultMap`、嵌套查询、嵌套结果。
- 例子：按条件分页查询订单，并映射订单与明细。
- 练习：实现订单查询条件组合和批量查询。
- 验收：能避免 SQL 注入、空 where、N+1、字段映射错误。
- 重点：SQL 可控是优势，SQL 安全和维护是责任。
- 易错：把 `${}` 当成普通参数占位。

## 阶段 4：缓存、插件和集成

- 目标：理解一级缓存、二级缓存、插件拦截器、Spring Boot 集成和事务。
- 需要掌握：SqlSession 生命周期、local cache、namespace cache、Interceptor、Page 分页插件原理、SqlSessionTemplate、Spring 事务。
- 例子：同一个 SqlSession 内两次 select 为什么可能命中一级缓存。
- 练习：写一个慢 SQL 日志插件。
- 验收：能说明缓存失效规则和插件拦截点。
- 难点：Spring 管理 SqlSession 后，缓存和事务边界要结合理解。

## 阶段 5：生产排障和规范

- 目标：能排查生产中的 SQL、映射、事务、性能和安全问题。
- 需要掌握：慢 SQL、N+1、分页、批量写、动态 SQL 日志、参数绑定失败、二级缓存风险、数据库索引、SQL 注入。
- 例子：接口 P99 升高，定位到 MyBatis 嵌套查询触发 N+1。
- 练习：给订单列表查询做 explain、加索引、改写 SQL。
- 验收：能写出 MyBatis 生产规范和排障流程。

## 推荐学习节奏

| 周期 | 学习重点 | 产出 |
| --- | --- | --- |
| 第 1 周 | Mapper、XML、参数、ResultMap | 用户/订单 CRUD |
| 第 2 周 | 执行链路、动态 SQL、关联映射 | 复杂条件查询 |
| 第 3 周 | 缓存、插件、Spring Boot 集成 | 慢 SQL 插件和事务实验 |
| 第 4 周 | 性能、安全、面试、综合项目 | 排障手册和面试答案 |

## 最终能力清单

- 能解释 Mapper 方法执行链路。
- 能写安全、可维护的动态 SQL。
- 能设计复杂 ResultMap 并识别 N+1。
- 能解释一级缓存、二级缓存、插件拦截器。
- 能在 Spring Boot 中正确配置 Mapper、事务、测试。
- 能排查慢 SQL、参数绑定、结果映射和 SQL 注入风险。

