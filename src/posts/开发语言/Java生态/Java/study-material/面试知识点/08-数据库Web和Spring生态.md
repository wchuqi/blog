---
title: "Java 面试知识点：数据库、Web 和 Spring 生态"
date: 2026-06-20
description: "PreparedStatement 使用参数绑定，SQL 结构和参数值分离，参数不会被当作 SQL 语法执行。"
tags:
  - "开发语言"
  - "Java"
  - "面试"
category: "开发语言"
---

# Java 面试知识点：数据库、Web 和 Spring 生态

[返回面试索引](../22-面试知识点整理.md)

[返回学习资料索引](../../Java学习资料.md)

## 一、数据库

### 64. PreparedStatement 为什么能防 SQL 注入？

**参考答案：**

PreparedStatement 使用参数绑定，SQL 结构和参数值分离，参数不会被当作 SQL 语法执行。

### 65. 事务 ACID 是什么？

**参考答案：**

原子性、一致性、隔离性、持久性。它们描述事务从执行、并发隔离到提交后的可靠性。

### 66. 数据库连接池为什么不能无限大？

**参考答案：**

连接池过大会占用数据库资源，增加上下文切换和锁竞争，甚至压垮数据库。连接数应结合数据库容量、请求耗时和并发量设置。

### 67. N+1 问题是什么？

**参考答案：**

先查询 N 条主记录，再为每条记录单独查询关联数据，导致 1+N 次查询。可通过 join、批量查询、fetch strategy 或 DTO 查询解决。

## 二、Web 和 Spring

### 68. Spring IoC / DI 是什么？

**参考答案：**

IoC 是控制反转，对象创建和依赖管理交给容器。DI 是依赖注入，容器把对象需要的依赖传入对象，常用构造器注入。

### 69. Spring AOP 常用于什么？

**参考答案：**

日志、事务、权限、监控、缓存等横切逻辑。Spring AOP 通常基于代理。

### 70. Spring 事务为什么会失效？

**参考答案：**

常见原因包括方法不是 public、自调用绕过代理、异常被捕获不抛出、抛出 checked exception 未配置 rollback、对象不是 Spring Bean。

### 71. REST API 如何做统一异常处理？

**参考答案：**

使用全局异常处理，例如 Spring 的 `@RestControllerAdvice` 和 `@ExceptionHandler`，把业务异常转换为统一错误响应。

