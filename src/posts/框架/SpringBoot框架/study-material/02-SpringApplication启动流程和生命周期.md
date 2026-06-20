---
title: "Spring Boot 4 学习资料：SpringApplication 启动流程和生命周期"
date: 2026-06-20
description: "Boot 应用入口通常只有一行："
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 4 学习资料：SpringApplication 启动流程和生命周期

[返回索引](../SpringBoot4学习资料.md)

## 学习目标

- 掌握 `SpringApplication.run()` 主线。
- 理解 Boot 如何判断应用类型、准备 Environment、创建 ApplicationContext。
- 会使用启动事件、Runner、ApplicationArguments。

## 理论导读

Boot 应用入口通常只有一行：

```java
SpringApplication.run(OrderApplication.class, args);
```

这行代码背后做了大量工作：推断 Web 类型、加载启动监听器、准备环境、创建上下文、加载 BeanDefinition、刷新容器、启动 Web 服务器、执行 Runner。

## 启动主线

```text
new SpringApplication(primarySources)
  -> 推断 WebApplicationType
  -> 加载 ApplicationContextInitializer
  -> 加载 ApplicationListener
  -> 推断 main class

run(args)
  -> 创建 BootstrapContext
  -> 发布 starting 事件
  -> 准备 Environment
  -> 打印 banner
  -> 创建 ApplicationContext
  -> prepareContext()
  -> refreshContext()
      -> Spring Framework refresh()
      -> 嵌入式 Web 容器启动
  -> afterRefresh()
  -> 发布 started 事件
  -> 执行 ApplicationRunner / CommandLineRunner
  -> 发布 ready 事件
```

> **重点：** Boot 启动主线包住了 Spring Framework 的 `refresh()`，并在前后增加环境、监听器、Web 容器、Runner、可观测性等能力。

## WebApplicationType

Boot 会根据 classpath 推断应用类型：

| 类型 | 说明 |
| --- | --- |
| SERVLET | Spring MVC/Tomcat/Jetty/Undertow |
| REACTIVE | WebFlux/Reactor Netty |
| NONE | 非 Web 应用 |

> **易错：** 同时引入 Web MVC 和 WebFlux 时，默认 Web 类型选择可能不是你以为的结果。应明确依赖和配置。

## Runner

```java
@Component
class DataInitializer implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) {
        if (args.containsOption("init-data")) {
            System.out.println("init data");
        }
    }
}
```

Runner 适合应用启动后执行轻量初始化。不要在 Runner 中做长时间阻塞任务，避免应用迟迟不能 ready。

## 启动失败分析

Boot 有 FailureAnalyzer 机制，可以把部分底层异常转换为更可读的诊断信息。例如端口占用、Bean 冲突、配置绑定失败等。

## 练习

1. 写一个 `ApplicationRunner` 打印命令行参数。
2. 设置 `spring.main.web-application-type=none`，观察是否启动 Web 服务器。
3. 故意占用端口，观察 Boot 的失败分析。

## 验收

- 能按阶段讲出 `SpringApplication.run()`。
- 能解释 Boot 和 Framework 启动流程的嵌套关系。
- 能判断 Runner 的适用边界。

## 难点

很多启动问题发生在 `refresh()` 之前，例如 ConfigData 加载、Environment 准备、Web 类型推断；不能把所有启动失败都归因于 Bean 创建。
