---
title: "Spring Framework 7 面试知识点：Web 和数据访问"
date: 2026-06-20
description: "请求先进入 Filter，再进入 DispatcherServlet。DispatcherServlet 通过 HandlerMapping 找到 Controller 方法，通过 HandlerAdapter 调用它，期间由参数解析器处理…"
tags:
  - "框架"
  - "SpringFramework7"
  - "面试"
category: "框架"
---

# Spring Framework 7 面试知识点：Web 和数据访问

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../SpringFramework7学习资料.md)

## 一、Web MVC、WebFlux 和数据访问

### 1. Spring MVC 请求处理流程是什么？

**参考答案：**

请求先进入 Filter，再进入 DispatcherServlet。DispatcherServlet 通过 HandlerMapping 找到 Controller 方法，通过 HandlerAdapter 调用它，期间由参数解析器处理入参，由返回值处理器和消息转换器处理返回，异常则交给异常解析器或 ControllerAdvice。

> **重点：** DispatcherServlet 是统一调度入口。

### 2. Filter 和 Interceptor 有什么区别？

**参考答案：**

Filter 是 Servlet 标准组件，在 DispatcherServlet 前后执行，不直接理解 Spring MVC Handler。Interceptor 是 Spring MVC 组件，在 Handler 调用前后执行，可以拿到 Handler 信息。

> **易错：** 认证链路常在 Filter 层，业务审计和接口耗时常在 Interceptor 层。

### 3. `@RequestBody` 和 `@ModelAttribute` 有什么区别？

**参考答案：**

`@RequestBody` 从请求体读取 JSON、XML 等内容，并通过消息转换器转成对象。`@ModelAttribute` 主要从请求参数或表单数据绑定对象。

> **重点：** JSON 解析依赖 HttpMessageConverter。

### 4. Spring MVC 如何做统一异常处理？

**参考答案：**

可以使用 `@ControllerAdvice` 或 `@RestControllerAdvice` 配合 `@ExceptionHandler`，把业务异常、校验异常、系统异常转换为统一 HTTP 状态码和响应体。

> **易错：** 不要把内部堆栈和 SQL 暴露给客户端。

### 5. MVC 和 WebFlux 怎么选？

**参考答案：**

大多数传统 CRUD、JDBC、JPA、MyBatis 系统优先 MVC。WebFlux 适合整条链路都支持非阻塞的高并发 IO、流式响应、长连接场景。如果中间大量阻塞调用，WebFlux 收益有限且调试成本更高。

> **难点：** WebFlux 的关键是非阻塞链路，不是返回类型换成 Mono/Flux。

### 6. Spring JDBC 的异常转换有什么价值？

**参考答案：**

Spring 把数据库厂商相关的 SQLException 转换为统一的 DataAccessException 层级，例如唯一键冲突、SQL 语法错误、查无结果等，业务层可以处理稳定的异常类型。

> **重点：** `@Repository` 参与持久层异常转换。
