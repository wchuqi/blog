---
title: "Spring Boot 4 学习资料：Starter、BOM 和依赖管理"
date: 2026-06-20
description: "Spring Boot 项目通常不为每个依赖手写版本号，这是因为 Boot 通过 BOM 管理了一组经过兼容性测试的依赖版本。Starter 聚合依赖，BOM 控制版本，Maven/Gradle 插件负责运行和打包。"
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 4 学习资料：Starter、BOM 和依赖管理

[返回索引](../SpringBoot4学习资料.md)

## 学习目标

- 理解 Starter、BOM、Parent、Plugin 的职责。
- 掌握 Boot 如何减少依赖冲突。
- 会排查依赖版本不兼容和类冲突。

## 理论导读

Spring Boot 项目通常不为每个依赖手写版本号，这是因为 Boot 通过 BOM 管理了一组经过兼容性测试的依赖版本。Starter 聚合依赖，BOM 控制版本，Maven/Gradle 插件负责运行和打包。

## 三个角色

| 角色 | 作用 |
| --- | --- |
| Starter | 聚合一组功能依赖 |
| BOM | 管理依赖版本 |
| Plugin | 运行、重打包、构建镜像、AOT 等 |

## Parent 方式

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.6</version>
</parent>
```

优点：简单，默认插件和资源配置完善。

## BOM 方式

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>4.0.6</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

适合公司已有父 POM 的项目。

## 依赖冲突排查

```bash
mvn dependency:tree
mvn dependency:tree -Dincludes=com.fasterxml.jackson.core
mvn dependency:tree -Dverbose
```

排查顺序：

1. 看冲突类来自哪个 jar。
2. 看版本是否被手工覆盖。
3. 看是否绕过 Boot BOM。
4. 看是否混用了不兼容的 Spring Cloud、Spring Security、第三方 Starter。
5. 使用 `mvn dependency:tree` 找最近路径和传递来源。

## 自定义 Starter 结构

```text
audit-spring-boot-starter/
  pom.xml
  src/main/java/com/example/audit/
    AuditClient.java
    AuditAutoConfiguration.java
    AuditProperties.java
  src/main/resources/META-INF/spring/
    org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

Starter 命名约定：

- 官方：`spring-boot-starter-*`
- 第三方：`*-spring-boot-starter`

## 易错

> **易错：** 为了解决一个漏洞随意升级单个核心依赖。
>
> 正确做法：优先升级 Boot 补丁版本；必须单独覆盖时做完整回归测试。

> **易错：** 同时引入多个功能重叠的 Starter，导致多个实现类竞争。
>
> 正确做法：用 dependency tree 和条件报告确认到底哪个自动配置生效。

## 练习

1. 用 parent 和 BOM 两种方式创建项目。
2. 故意覆盖 Jackson 版本，观察依赖树变化。
3. 创建一个最小自定义 Starter。

## 验收

- 能解释 Starter、BOM、Plugin 的区别。
- 能使用依赖树定位版本冲突。
- 能设计不会强行覆盖用户 Bean 的 Starter。
