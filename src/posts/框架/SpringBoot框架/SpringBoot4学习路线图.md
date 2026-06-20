---
title: "Spring Boot 4 学习路线图"
date: 2026-06-20
description: "版本基准：Spring Boot 4.0.6 稳定版；4.1.0-RC1 作为 Preview 了解，不作为生产默认基准。"
tags:
  - "框架"
  - "SpringBoot框架"
  - "学习路线图"
category: "框架"
---

# Spring Boot 4 学习路线图

版本基准：Spring Boot `4.0.6` 稳定版；`4.1.0-RC1` 作为 Preview 了解，不作为生产默认基准。

## 阶段 1：基础认知

- 目标：理解 Spring Boot 解决的问题，以及它和 Spring Framework 的边界。
- 需要掌握：自动配置、Starter、BOM、嵌入式 Web 容器、外部化配置、Actuator。
- 例子：用 `spring-boot-starter-webmvc` 写一个 REST API。
- 练习：创建最小 Boot 应用，禁用某个自动配置并观察启动差异。
- 验收：能解释 Boot 是“约定 + 自动配置 + 生产集成”，不是 Spring Framework 的替代品。
- 重点：Spring Boot 依赖 Spring Framework。
- 易错：把 `@SpringBootApplication` 当成“万能注解”，不理解它组合了哪些能力。

## 阶段 2：核心机制

- 目标：掌握 `SpringApplication`、自动配置、条件装配、配置加载和绑定。
- 需要掌握：启动事件、Environment、ApplicationContextFactory、AutoConfiguration.imports、Condition、Binder。
- 例子：写一个自定义 Starter，根据 classpath 和属性条件自动注册 Bean。
- 练习：打开 condition evaluation report，解释某个自动配置为什么生效或不生效。
- 验收：能根据报告定位自动配置失败原因。
- 重点：自动配置是“有条件的默认配置”，不是强制覆盖用户配置。
- 难点：配置优先级和条件评估共同决定最终运行行为。

## 阶段 3：Web、数据和测试

- 目标：能开发可测试、可排障的生产级 Web 应用。
- 需要掌握：Web MVC/WebFlux Starter、Jackson、Validation、统一错误、DataSource、事务、Flyway/Liquibase、测试切片。
- 例子：订单 API，包含数据库迁移、事务、统一错误响应、Actuator 健康检查。
- 练习：用 Testcontainers 启动真实 PostgreSQL 做集成测试。
- 验收：能区分 `@WebMvcTest`、`@DataJdbcTest`、`@SpringBootTest` 的适用边界。
- 易错：所有测试都用 `@SpringBootTest`，导致慢且定位困难。

## 阶段 4：生产化

- 目标：掌握配置安全、可观测性、打包部署、性能和故障排查。
- 需要掌握：Actuator 端点、Micrometer、健康分组、日志级别、容器镜像、分层 jar、AOT、Native、连接池调优。
- 例子：暴露 readiness/liveness，配置 Prometheus 指标，构建 OCI 镜像。
- 练习：模拟 DB 断开、配置错误、端口冲突、依赖冲突、慢接口并写复盘。
- 验收：能从启动日志、Actuator、指标和条件报告定位问题。

## 阶段 5：源码和升级

- 目标：能阅读 Boot 核心源码，独立评估版本升级影响。
- 需要掌握：自动配置导入、条件排序、ConfigData、Binder、WebServerApplicationContext、Actuator 端点发现。
- 例子：从 Boot 3.x 迁移到 Boot 4.x，列出 Spring Framework、Jakarta、Starter、插件、测试影响。
- 练习：实现一个企业内部 Starter。
- 验收：能解释 Starter 被引入后为什么某些 Bean 自动出现。

## 推荐学习节奏

| 周期 | 学习重点 | 产出 |
| --- | --- | --- |
| 第 1 周 | Boot 基础、Starter、项目结构 | 最小 REST API |
| 第 2 周 | 启动流程、自动配置、配置系统 | 自定义 Starter Demo |
| 第 3 周 | Web、数据访问、事务、迁移 | 订单 API |
| 第 4 周 | 测试、Actuator、可观测性 | 测试套件和监控端点 |
| 第 5 周 | 部署、安全、性能、排障 | 容器镜像和故障复盘 |
| 第 6 周 | 源码、升级、面试复盘 | 深度实验和面试 Q&A |

## 最终能力清单

- 会搭建 Spring Boot 4.x 项目并管理依赖版本。
- 会解释启动流程和自动配置生效规则。
- 会排查配置不生效、Bean 冲突、端口占用、健康检查失败。
- 会设计生产级配置、日志、指标、追踪、健康检查。
- 会写切片测试和真实依赖集成测试。
- 会评估 Boot 版本升级风险。
