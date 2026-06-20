---
title: "Spring Boot 学习资料：Spring Boot 4 迁移和版本兼容"
date: 2026-06-20
description: "主版本升级会触及 JDK 基线、Spring Framework 版本、Jakarta EE 版本、第三方 starter、构建插件、配置属性、自动配置类路径、测试工具和生产镜像。升级失败往往不是 Boot 本身启动不了，而是某个第三方依赖…"
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 学习资料：Spring Boot 4 迁移和版本兼容

[返回索引](../SpringBoot学习资料.md)

## 学习目标

- 理解 Spring Boot 主版本升级的风险点。
- 掌握从 Boot 3.x 迁移到 4.0.x 的检查路径。
- 能制定可验证、可回滚的升级计划。

## 理论导读

主版本升级会触及 JDK 基线、Spring Framework 版本、Jakarta EE 版本、第三方 starter、构建插件、配置属性、自动配置类路径、测试工具和生产镜像。升级失败往往不是 Boot 本身启动不了，而是某个第三方依赖、弃用配置或自定义自动配置与新版本不兼容。

## 核心心智模型

升级像更换地基和管线：不能只换门牌号。必须检查依赖图、编译错误、运行时自动配置、测试结果、性能指标和回滚方案。

## 知识点详解

### 版本基准

截至 2026-06-06，官方文档展示的最新稳定版是 Spring Boot 4.0.6，并保留 3.5.14、3.4.13、3.3.13 等稳定维护线。新项目应优先评估 4.0.6；存量项目如果依赖生态尚未支持，可先停留在受支持的 3.5.x 维护线。

### 环境基线

- Java：至少 Java 17，官方说明兼容到 Java 26。
- Spring Framework：7.0.7 或更高。
- Maven：3.6.3 或更高。
- Gradle：8.x 中 8.14 或更高，或 9.x。
- Servlet 容器：Tomcat 11.0.x 或 Jetty 12.1.x，Servlet 6.1；外部容器需要 Servlet 6.1+。
- Native Image：GraalVM 25 或更高，Native Build Tools 0.11.5。

### 迁移检查清单

1. JDK 版本和运行镜像。
2. Maven/Gradle 插件版本。
3. Boot 父版本或 BOM。
4. 第三方 starter 是否支持 Boot 4。
5. Spring Cloud、ORM、数据库驱动、Security 扩展兼容性。
6. 编译错误和弃用 API。
7. 配置属性迁移。
8. 自动配置条件报告变化。
9. 测试切片行为变化。
10. Actuator 端点和安全策略。
11. 容器镜像、JVM 参数、Native Image 元数据。
12. 性能基线对比。

### 渐进升级策略

- 先升级到当前 3.x 最新维护版本。
- 修复所有弃用警告和测试问题。
- 再升级 Boot 4。
- 保持小步提交，每一步可回滚。
- 每次升级后运行自动化测试和关键接口压测。

### 依赖冲突

Boot BOM 管理一组已验证依赖。覆盖版本前必须确认兼容性。第三方 starter 如果还绑定旧 Spring Framework 或旧 Jakarta API，可能在运行时出现 `ClassNotFoundException`、`NoSuchMethodError` 或 Bean 装配失败。

## 例子

Maven 版本切换：

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.6</version>
    <relativePath/>
</parent>
```

升级后观察自动配置：

```powershell
mvn test
java -jar target/app.jar --debug
```

## 练习

1. 选一个 Boot 3.5 示例项目。
2. 先把依赖升级到 3.5 最新维护版。
3. 修复弃用警告。
4. 切换到 4.0.x。
5. 对比启动日志、conditions、关键接口测试结果。

## 验收

- 编译和测试全部通过。
- 自动配置报告无意外负匹配。
- Actuator 健康和指标正常。
- 数据库迁移脚本没有重复执行或失败。
- 有明确回滚版本和配置。

## 重点

- 主版本升级要先查生态兼容性。
- 不要覆盖 BOM 版本来“强行解决”冲突。
- 自动化测试是升级底线。

## 难点

- 运行时错误可能只在特定 Profile、特定依赖路径或生产配置下出现。
- 第三方 starter 兼容性常常晚于 Boot 主版本发布。

## 易错

> **易错：** 直接把版本号改成 4.0.x 后上线。
>
> 正确做法：先建立测试和观测基线，逐步升级，验证依赖、配置、自动配置和运行行为。
