---
title: "Spring Boot 学习路线图"
date: 2026-06-20
description: "版本基准：2026-06-06 核对的最新稳定版是 Spring Boot 4.0.6。官方系统要求包括 Java 17+、Spring Framework 7.0.7+、Maven 3.6.3+、Gradle 8.14+/9.x、Serv…"
tags:
  - "框架"
  - "SpringBoot框架"
  - "学习路线图"
category: "框架"
---

# Spring Boot 学习路线图

版本基准：2026-06-06 核对的最新稳定版是 Spring Boot 4.0.6。官方系统要求包括 Java 17+、Spring Framework 7.0.7+、Maven 3.6.3+、Gradle 8.14+/9.x、Servlet 6.1 容器和 GraalVM 25+。学习时兼顾仍常见的 3.5.x 项目维护和迁移；开始前建议具备 Java、Maven 或 Gradle、HTTP、SQL、基本 Spring IoC 概念。

## 阶段 1：基础认知

- 目标：知道 Spring Boot 解决什么问题，能创建并运行一个最小 Web 项目。
- 需要掌握：Starter、自动配置、内嵌服务器、`@SpringBootApplication`、Maven/Gradle、`application.yml`。
- 例子：用 Spring Initializr 创建 `spring-boot-starter-webmvc` 项目，写一个 `GET /hello`。
- 练习：实现用户列表查询接口，支持配置端口和日志级别。
- 验收：能解释为什么添加 starter 后不用手写 Tomcat、DispatcherServlet、JSON 转换器配置。
- 重点：Boot 的价值不是替代 Spring，而是用约定、依赖管理和自动配置降低 Spring 应用装配成本。
- 易错：把 Spring Boot 当成新的 Web 框架。正确理解是：Boot 是 Spring 应用的快速装配和生产就绪体系。

## 阶段 2：核心能力

- 目标：理解启动流程、Bean 装配、条件化自动配置、配置优先级和 Profile。
- 需要掌握：`SpringApplication.run`、ApplicationContext、Environment、`@ConditionalOnClass`、`@ConditionalOnMissingBean`、`@ConfigurationProperties`。
- 例子：自定义一个配置类，在某个类存在且用户未声明 Bean 时才生效。
- 练习：做一个 `pay.enabled=true` 才启用的支付客户端 Bean。
- 验收：能通过 `--debug` 或 Actuator `conditions` 解释某个自动配置为什么生效或不生效。
- 重点：排查 Boot 问题要看“类路径、配置属性、已有 Bean、Profile、条件评估”。
- 难点：配置来源和自动配置条件共同决定最终行为，不能只看一处代码。

## 阶段 3：业务开发

- 目标：能完成常规后端服务：REST API、校验、异常处理、数据库访问、事务、安全。
- 需要掌握：Spring MVC、Validation、`@ControllerAdvice`、Spring Data JDBC/JPA、事务传播、Spring Security filter chain。
- 例子：订单创建接口，校验入参，写入数据库，返回统一错误响应。
- 练习：实现一个带登录、角色权限、分页查询、事务回滚的订单模块。
- 验收：能写出测试覆盖 Controller、Service、Repository，并能说明事务边界。
- 重点：Controller 管协议，Service 管业务事务，Repository 管持久化，不要互相泄漏职责。
- 易错：在 Controller 中拼业务流程，或者在 Repository 层吞掉异常导致事务无法回滚。

## 阶段 4：测试和质量

- 目标：建立从单元测试、切片测试到集成测试的测试策略。
- 需要掌握：JUnit Jupiter、Mockito、`@WebMvcTest`、`@DataJpaTest`、`@SpringBootTest`、Testcontainers、`@ServiceConnection`。
- 例子：用 Testcontainers 启动 PostgreSQL，验证数据库迁移和 Repository 查询。
- 练习：给订单模块补齐 Controller 切片测试和服务集成测试。
- 验收：测试能在干净机器上运行，不依赖本地手工安装的数据库。
- 重点：测试不是都用 `@SpringBootTest`，要按加载范围选择工具。
- 难点：测试配置和生产配置隔离，避免测试误连真实资源。

## 阶段 5：生产运维

- 目标：能把应用可观测、可发布、可诊断。
- 需要掌握：Actuator、health/readiness/liveness、metrics、tracing、structured logging、graceful shutdown、容器镜像、配置外置化。
- 例子：暴露 Prometheus 指标，配置 `/actuator/health/readiness` 给 Kubernetes 探针。
- 练习：为订单服务增加指标、慢 SQL 日志、异常告警标签和优雅停机。
- 验收：线上问题能通过日志、指标、trace、heap dump、thread dump 缩小范围。
- 重点：生产就绪不只是能启动，还要能观测、能限权、能回滚、能定位。
- 易错：公开暴露 `/actuator/env`、`/actuator/heapdump` 等敏感端点。

## 阶段 6：进阶和迁移

- 目标：能处理复杂依赖、性能瓶颈、Boot 3 到 4 迁移和 Native Image。
- 需要掌握：依赖版本管理、BOM、AOT、GraalVM Native Image、Jakarta EE 命名空间、Spring Framework 7 兼容性、弃用属性。
- 例子：把 Boot 3.5 项目升级到 4.0，逐步修复依赖、测试和自动配置变更。
- 练习：生成迁移清单：JDK、插件、依赖、配置、测试、容器镜像、运行参数。
- 验收：升级后完整测试通过，Actuator conditions 无意外失效，关键接口性能无明显退化。
- 重点：升级不是改版本号，而是验证依赖图、配置键、自动配置和运行时行为。
- 易错：直接覆盖父版本，不检查第三方 starter 是否支持 Boot 4。

## 推荐学习节奏

| 周期 | 学习重点 | 产出 |
| --- | --- | --- |
| 第 1 周 | Boot 基础、项目结构、配置 | 可运行 REST 项目 |
| 第 2 周 | 自动配置、Web、异常、校验 | 规范 API 模块 |
| 第 3 周 | 数据访问、事务、迁移 | 带数据库的业务模块 |
| 第 4 周 | Security、测试、Testcontainers | 可测试的安全业务服务 |
| 第 5 周 | Actuator、日志、指标、部署 | 可观测容器化服务 |
| 第 6 周 | 性能、排障、迁移、面试表达 | 项目复盘和面试答案 |

## 最终能力清单

- 能从零创建、配置、打包、部署 Spring Boot 服务。
- 能解释自动配置生效规则和排查失败原因。
- 能设计 REST API、异常模型、校验、事务边界和安全规则。
- 能写分层测试和容器化集成测试。
- 能使用 Actuator、日志、metrics、tracing 定位生产问题。
- 能完成 Boot 3.x 到 4.x 的升级评估和验证。
