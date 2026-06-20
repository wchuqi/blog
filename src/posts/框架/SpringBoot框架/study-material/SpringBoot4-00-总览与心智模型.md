---
title: "Spring Boot 4 学习资料：总览与心智模型"
date: 2026-06-20
description: "Spring Boot 的核心价值不是让你少写几行 XML，而是把 Spring 应用开发中重复、易错、难统一的部分标准化：依赖版本、默认 Bean、嵌入式服务器、配置加载、健康检查、指标、日志、测试切片、打包部署。"
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 4 学习资料：总览与心智模型

[返回索引](../SpringBoot4学习资料.md)

## 学习目标

- 理解 Spring Boot 的定位和边界。
- 建立“启动器、自动配置、外部化配置、生产化端点”四个心智模型。
- 明确 Spring Boot 4.x 与 Spring Framework 7.x 的关系。

## 理论导读

Spring Boot 的核心价值不是让你少写几行 XML，而是把 Spring 应用开发中重复、易错、难统一的部分标准化：依赖版本、默认 Bean、嵌入式服务器、配置加载、健康检查、指标、日志、测试切片、打包部署。

如果 Spring Framework 是底层能力库，那么 Spring Boot 是应用装配和生产运行的协调层。它根据 classpath、配置属性、当前 Web 类型、用户是否已经提供 Bean 等条件，决定是否创建一组默认组件。

## 四个核心心智模型

### 1. Starter 像“能力包”

引入 `spring-boot-starter-webmvc`，不是只引入一个 jar，而是引入一组经过版本协调的依赖：Spring MVC、Jackson、Validation、嵌入式服务器、日志等。

> **重点：** Starter 不写业务逻辑，它主要负责聚合依赖。

### 2. 自动配置像“有条件的默认方案”

Boot 会说：“如果 classpath 里有某个类、配置中启用了某个功能、用户没有自己定义 Bean，那么我提供一个默认 Bean。”

> **易错：** 自动配置不是强制配置。多数自动配置会用 `@ConditionalOnMissingBean` 给用户配置让路。

### 3. 外部化配置像“运行时控制面板”

同一份应用包，在 dev、test、prod 环境中通过配置改变端口、数据库、日志级别、缓存、线程池、功能开关。配置来源有优先级，最终合并成 Environment。

### 4. Actuator 像“生产观察窗口”

Actuator 提供健康检查、指标、环境、日志级别、线程、构建信息等端点。它让应用能被 Kubernetes、Prometheus、告警系统和运维平台理解。

## Boot 与 Framework 对比

| 对比项 | Spring Framework | Spring Boot |
| --- | --- | --- |
| 定位 | 基础设施框架 | 应用快速开发和生产化框架 |
| 核心能力 | IoC、AOP、事务、MVC、WebFlux | 自动配置、Starter、Actuator、打包、外部化配置 |
| 主要问题 | 如何组织对象和框架能力 | 如何快速、统一、可观测地运行应用 |
| 依赖关系 | 不依赖 Boot | 依赖 Framework |

## `@SpringBootApplication` 展开

```java
@SpringBootApplication
public class OrderApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderApplication.class, args);
    }
}
```

它组合了：

- `@SpringBootConfiguration`：标记 Boot 配置类。
- `@EnableAutoConfiguration`：启用自动配置。
- `@ComponentScan`：从当前包向下扫描组件。

> **易错：** 主启动类放错包层级会导致组件扫描不到业务类。

## 练习

1. 创建 Boot 4 Web MVC 应用，写 `/hello` 接口。
2. 排除一个自动配置类，观察启动日志和 Bean 差异。
3. 打开 Actuator health 端点。

## 验收

- 能解释 Starter、自动配置、外部化配置、Actuator 的职责。
- 能说清 Boot 和 Framework 的边界。
- 能把 `@SpringBootApplication` 展开讲清楚。

## 难点

Spring Boot 的难点不在“怎么创建项目”，而在“为什么某个 Bean 自动出现、为什么某个配置生效、为什么某个自动配置没有生效”。
