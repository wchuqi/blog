---
title: "Spring Boot 4 学习资料：完整知识点清单"
date: 2026-06-20
description: "Spring Boot 4.0.6 稳定版。"
tags:
  - "框架"
  - "SpringBoot框架"
  - "知识清单"
category: "框架"
---

# Spring Boot 4 学习资料：完整知识点清单

[返回索引](../SpringBoot4学习资料.md)

## 版本和边界

- Spring Boot 4.0.6 稳定版。
- 4.1.0-RC1 是 Preview，不作为生产默认基准。
- Boot 与 Spring Framework 的关系。
- Boot 与 Spring Cloud、Spring Security、Spring Data 的边界。
- Java、Jakarta、Servlet、Reactor、Maven/Gradle 前置知识。

## 核心基础

- `@SpringBootApplication`。
- `SpringApplication.run()`。
- `WebApplicationType`。
- Banner、ApplicationArguments、ApplicationRunner、CommandLineRunner。
- 启动事件、监听器、初始化器。
- FailureAnalyzer。

## 自动配置

- `@EnableAutoConfiguration`。
- `@AutoConfiguration`。
- `AutoConfiguration.imports`。
- 自动配置排序。
- 条件注解：class、bean、property、resource、web、single candidate。
- `@ConditionalOnMissingBean` 让路机制。
- Condition Evaluation Report。
- 自定义 Starter。

## 依赖管理

- Starter。
- Parent。
- BOM。
- Maven/Gradle 插件。
- 依赖树排查。
- 版本覆盖风险。
- 官方 Starter 和第三方 Starter 命名约定。

## 配置系统

- ConfigData。
- `application.yml`。
- Profile。
- 命令行参数。
- 环境变量。
- `spring.config.import`。
- `@ConfigurationProperties`。
- Binder。
- 宽松绑定。
- 配置校验。
- 配置元数据。
- 敏感值脱敏。

## Web

- Web MVC 自动配置。
- WebFlux 自动配置。
- 嵌入式 Tomcat、Jetty、Undertow、Reactor Netty。
- Jackson 自动配置。
- Validation。
- Error MVC。
- 静态资源。
- CORS。
- 文件上传。
- 问题详情和统一错误响应。

## 数据访问

- DataSource 自动配置。
- HikariCP。
- JdbcTemplate。
- JPA。
- TransactionManager。
- Flyway。
- Liquibase。
- SQL 初始化。
- 多数据源边界。
- 连接池容量规划。

## 测试

- `spring-boot-starter-test`。
- `@SpringBootTest`。
- `@WebMvcTest`。
- `@JsonTest`。
- `@DataJpaTest`。
- `@JdbcTest`。
- `@MockBean`。
- Testcontainers。
- DynamicPropertySource。
- 测试上下文缓存。

## Actuator 和可观测性

- health、info、metrics、prometheus、loggers、env、conditions。
- readiness、liveness。
- HealthIndicator。
- Micrometer。
- MeterRegistry。
- Observability。
- 日志、指标、追踪。
- 管理端口和端点安全。

## 部署和性能

- 可执行 jar。
- 分层 jar。
- OCI 镜像。
- Buildpacks。
- AOT。
- Native Image。
- JVM 容器内存。
- 启动优化。
- 连接池、线程池、超时、重试。

## 生产排障

- 自动配置不生效。
- 配置不生效。
- 端口占用。
- Bean 冲突。
- 数据源连接失败。
- 健康检查失败。
- 指标缺失。
- 测试上下文过慢。
- 依赖版本冲突。
- Boot 升级失败。

## 源码机制必会

- `SpringApplication` 构造和 run 主线。
- `ConfigDataEnvironmentPostProcessor`。
- `AutoConfigurationImportSelector`。
- `OnClassCondition`、`OnBeanCondition`、`OnPropertyCondition`。
- `ConditionEvaluationReport`。
- `Binder` 和 `ConfigurationPropertySource`。
- `ServletWebServerApplicationContext`。
- `WebServerFactoryCustomizer`。
- Actuator endpoint discovery。

## 完成标准

- 能写 Boot 应用，也能解释默认 Bean 从哪里来。
- 能用条件报告排查自动配置。
- 能定位配置来源和覆盖关系。
- 能设计生产可观测性和安全端点。
- 能完成自定义 Starter 和深度实验。
