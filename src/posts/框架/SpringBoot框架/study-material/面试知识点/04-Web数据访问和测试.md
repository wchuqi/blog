---
title: "Spring Boot 4 面试知识点：Web、数据访问和测试"
date: 2026-06-20
description: "通常会配置嵌入式 Web 服务器、DispatcherServlet、Spring MVC 基础组件、Jackson 消息转换、错误处理、静态资源、格式化等。具体是否生效取决于 classpath 和配置条件。"
tags:
  - "框架"
  - "SpringBoot框架"
  - "面试"
category: "框架"
---

# Spring Boot 4 面试知识点：Web、数据访问和测试

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../SpringBoot4学习资料.md)

## 一、Web、数据访问和测试

### 1. 引入 Web Starter 后 Boot 自动配置了什么？

**参考答案：**

通常会配置嵌入式 Web 服务器、DispatcherServlet、Spring MVC 基础组件、Jackson 消息转换、错误处理、静态资源、格式化等。具体是否生效取决于 classpath 和配置条件。

> **重点：** Web Starter 带来的是一组默认 Web 基础设施。

### 2. Boot 如何启动嵌入式 Tomcat？

**参考答案：**

Servlet Web 应用会创建 `ServletWebServerApplicationContext`。容器 refresh 过程中创建 WebServer，获取 `ServletWebServerFactory`，注册 ServletContextInitializer、DispatcherServlet、Filter 等，然后启动嵌入式服务器。

> **难点：** Boot 把 Web 服务器作为应用内部对象启动，而不是依赖外部容器。

### 3. Boot 数据源自动配置依赖什么条件？

**参考答案：**

通常依赖 classpath 中存在 JDBC 和连接池相关类，并且存在数据源 URL、驱动或嵌入式数据库条件。满足后 Boot 创建 DataSource、JdbcTemplate、TransactionManager 等默认 Bean。

> **易错：** DataSource 创建成功不代表数据库连接参数合理，也不代表事务边界正确。

### 4. Flyway 和 Hibernate ddl-auto 怎么选？

**参考答案：**

生产数据库结构变更应使用 Flyway 或 Liquibase 管理版本化迁移。`ddl-auto=update` 不适合生产，因为它不可审计、难回滚、可能产生意外结构变更。

> **重点：** 数据库结构是生产资产，需要迁移脚本和回滚策略。

### 5. `@SpringBootTest` 和测试切片怎么选？

**参考答案：**

`@SpringBootTest` 启动完整应用上下文，适合跨层集成；`@WebMvcTest`、`@DataJpaTest`、`@JsonTest` 等切片只启动相关部分，适合快速定位特定层行为。

> **易错：** 所有测试都用 `@SpringBootTest` 会慢且定位困难。
