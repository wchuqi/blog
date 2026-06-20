---
title: "MyBatis 面试知识点：缓存、插件和 Spring 集成"
date: 2026-06-20
description: "一级缓存是 SqlSession 级别缓存。同一个 SqlSession 内，相同 statement 和参数的查询可能命中缓存。更新、提交、回滚、关闭会清理缓存。Spring 集成下 SqlSession 通常与事务绑定。"
tags:
  - "框架"
  - "Mybatis框架"
  - "面试"
category: "框架"
---

# MyBatis 面试知识点：缓存、插件和 Spring 集成

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../Mybatis学习资料.md)

## 一、缓存

### 1. MyBatis 一级缓存是什么？

**参考答案：**

一级缓存是 SqlSession 级别缓存。同一个 SqlSession 内，相同 statement 和参数的查询可能命中缓存。更新、提交、回滚、关闭会清理缓存。Spring 集成下 SqlSession 通常与事务绑定。

### 2. 二级缓存为什么生产中要谨慎？

**参考答案：**

二级缓存是 namespace 级别，不是天然分布式缓存。多表 join、跨 namespace 更新、多实例部署都会带来一致性风险。生产中如果需要缓存，通常更推荐业务层 Redis/Caffeine，并明确 key、TTL 和失效策略。

## 二、插件

### 3. MyBatis 插件能拦截哪些对象？

**参考答案：**

MyBatis 插件能拦截 Executor、StatementHandler、ParameterHandler、ResultSetHandler 四类核心对象。分页、SQL 日志、审计、脱敏等插件通常基于这些拦截点实现。

### 4. 分页插件的基本原理是什么？

**参考答案：**

分页插件通常拦截 Executor 或 StatementHandler，在 SQL 执行前改写 SQL，加上 limit/offset 或数据库方言分页语法，并可能生成 count SQL 查询总数。复杂 SQL 的 count 改写可能不准确，插件顺序也可能冲突。

> **重点：** 分页插件本质是 SQL 改写，不是数据库自动优化。

## 三、Spring 集成

### 5. SqlSessionTemplate 有什么作用？

**参考答案：**

SqlSessionTemplate 是 MyBatis-Spring 提供的线程安全 SqlSession 代理。它把 SqlSession 与 Spring 事务同步，确保同一事务内 Mapper 操作使用正确的连接和事务资源。Spring 项目中通常通过 Mapper Bean 使用它，而不是手动 openSession。

### 6. MyBatis 事务应该放在哪里？

**参考答案：**

事务通常放在 Service 用例层，而不是 Mapper 层。一个业务用例可能调用多个 Mapper，应由 Service 的 `@Transactional` 管理整体提交或回滚。

### 7. Spring 项目中手动 `openSession()` 有什么风险？

**参考答案：**

手动 openSession 可能绕过 Spring 事务管理，导致连接、提交、回滚和资源释放不一致。正确做法是注入 Mapper 或使用 Spring 管理的 SqlSessionTemplate。

