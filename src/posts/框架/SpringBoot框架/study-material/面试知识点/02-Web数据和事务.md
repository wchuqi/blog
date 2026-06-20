---
title: "Spring Boot 面试知识点：Web、数据和事务"
date: 2026-06-20
description: "请求先经过 Servlet Filter 链，再进入 DispatcherServlet。DispatcherServlet 通过 HandlerMapping 找到处理器，通过 HandlerAdapter 调用 Controller 方…"
tags:
  - "框架"
  - "SpringBoot框架"
  - "面试"
category: "框架"
---

# Spring Boot 面试知识点：Web、数据和事务

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../SpringBoot学习资料.md)

## 一、Web

### 1. Spring MVC 一次请求的执行流程是什么？

**参考答案：**

请求先经过 Servlet Filter 链，再进入 DispatcherServlet。DispatcherServlet 通过 HandlerMapping 找到处理器，通过 HandlerAdapter 调用 Controller 方法，完成参数绑定和校验。方法返回后，由消息转换器把对象写成 JSON 等响应格式，异常则交给异常解析器或 `@ControllerAdvice` 处理。

> **重点：** 说清 DispatcherServlet、HandlerMapping、HandlerAdapter、参数绑定、消息转换器、异常处理。

### 2. 如何设计统一异常处理？

**参考答案：**

使用 `@RestControllerAdvice` 和 `@ExceptionHandler` 把校验错误、业务异常、资源不存在、系统异常转换为统一错误响应。响应中通常包含 `code`、`message`、`traceId`，并使用正确 HTTP 状态码。

协议层错误用 HTTP 状态码表达，业务层细节用错误码表达。

> **易错：** 所有错误都返回 200，会让网关、监控和客户端语义混乱。

### 3. MVC 和 WebFlux 怎么选？

**参考答案：**

常规 CRUD、同步数据库和传统 Servlet 生态优先选择 MVC。只有在上下游链路、数据库驱动、客户端 SDK 和团队能力都支持响应式时，WebFlux 才能发挥非阻塞优势。响应式链路中混入阻塞调用会伤害性能。

> **重点：** 选择 WebFlux 要看完整链路，不是只看框架本身。

## 二、数据访问

### 4. JDBC、Spring Data JDBC、JPA 怎么选？

**参考答案：**

JDBC 适合 SQL 可控、简单高效的场景；Spring Data JDBC 适合聚合清晰、对象关系不复杂的模型；JPA 适合复杂对象关系和 ORM 能力，但要警惕 N+1、懒加载和脏检查成本。

面试中最好结合项目说明为什么选择某一种，而不是说哪一种绝对更好。

> **难点：** ORM 提升开发效率，但隐藏 SQL 成本，性能问题要看实际 SQL。

### 5. 为什么要用 Flyway 或 Liquibase？

**参考答案：**

数据库结构也是应用的一部分，需要版本化、可追踪、可重复执行。Flyway/Liquibase 能把建表、加字段、建索引等变更随应用发布，避免手工改库导致环境不一致。

生产中已执行的迁移脚本不要随意修改，应新增脚本继续演进。

> **重点：** 数据库迁移解决的是环境一致性和发布可追踪性。

## 三、事务

### 6. `@Transactional` 为什么有时会失效？

**参考答案：**

常见原因包括同类内部方法调用绕过代理、方法不是 public、异常被捕获没有抛出、数据库不支持事务、异步线程中使用原线程事务、注解放在不被 Spring 管理的对象上。

Spring 声明式事务依赖代理机制，所以调用路径必须经过代理对象。

> **重点：** 事务失效高频答案一定要说“代理”和“异常回滚规则”。

### 7. 默认哪些异常会触发事务回滚？

**参考答案：**

默认运行时异常和 Error 会触发回滚，受检异常默认不一定回滚。需要对受检异常回滚时，可以设置 `rollbackFor`。

```java
@Transactional(rollbackFor = IOException.class)
public void importOrders() throws IOException {
}
```

> **易错：** 以为所有异常都会回滚。

### 8. `REQUIRED` 和 `REQUIRES_NEW` 有什么区别？

**参考答案：**

`REQUIRED` 是默认传播行为，有事务就加入，没有就新建。`REQUIRES_NEW` 总是新建一个事务，外层事务会被挂起。后者常用于审计日志等希望独立提交的场景，但要谨慎，因为它可能造成外层回滚而内层已经提交。

> **难点：** 独立事务提升隔离性，也会带来一致性语义差异。

