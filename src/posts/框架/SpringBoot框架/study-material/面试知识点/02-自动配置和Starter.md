---
title: "Spring Boot 4 面试知识点：自动配置和 Starter"
date: 2026-06-20
description: "Boot 通过 @EnableAutoConfiguration 导入候选自动配置类，从 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.im…"
tags:
  - "框架"
  - "SpringBoot框架"
  - "面试"
category: "框架"
---

# Spring Boot 4 面试知识点：自动配置和 Starter

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../SpringBoot4学习资料.md)

## 一、自动配置和 Starter

### 1. Spring Boot 自动配置原理是什么？

**参考答案：**

Boot 通过 `@EnableAutoConfiguration` 导入候选自动配置类，从 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 读取类名，再根据条件注解评估是否生效。满足条件的自动配置会注册默认 Bean，通常用 `@ConditionalOnMissingBean` 给用户自定义 Bean 让路。

> **重点：** 候选导入、条件评估、Bean 注册是三个阶段。

### 2. Starter 和自动配置有什么区别？

**参考答案：**

Starter 主要聚合依赖；自动配置类提供默认配置和 Bean。引入 Starter 后 classpath 出现相关依赖，从而让对应自动配置条件满足。

> **易错：** Starter 本身通常不是功能实现，它是依赖入口。

### 3. `@ConditionalOnMissingBean` 有什么作用？

**参考答案：**

它表示当容器中缺少某类 Bean 时才注册默认 Bean，目的是让用户自定义配置优先于 Boot 默认配置。

> **重点：** 自动配置应该提供默认值，而不是抢用户配置。

### 4. 如何排查自动配置为什么没生效？

**参考答案：**

先确认依赖是否存在，再确认自动配置类是否在 imports 文件中，检查是否被 exclude，然后打开 `--debug` 或 `/actuator/conditions` 查看条件报告，最后看是否用户已经定义了同类型 Bean。

> **难点：** 自动配置类被导入不等于内部 Bean 一定创建。

### 5. 如何写一个自定义 Starter？

**参考答案：**

创建 starter 模块，定义属性类、自动配置类、默认 Bean，并在 `AutoConfiguration.imports` 中声明自动配置类。默认 Bean 应使用条件注解，避免强行覆盖用户配置。

> **易错：** 第三方 Starter 不应命名为 `spring-boot-starter-*`，这个命名留给官方。
