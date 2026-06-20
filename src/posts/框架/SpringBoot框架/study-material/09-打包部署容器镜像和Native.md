---
title: "Spring Boot 学习资料：打包、部署、容器镜像和 Native"
date: 2026-06-20
description: "Boot 应用常见交付形式是可执行 Jar 或容器镜像。可执行 Jar 适合传统虚拟机或直接 JVM 部署；容器镜像适合 Kubernetes 和云原生环境；Native Image 适合启动快、内存敏感、实例频繁扩缩的场景，但构建复杂度和…"
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 学习资料：打包、部署、容器镜像和 Native

[返回索引](../SpringBoot学习资料.md)

## 学习目标

- 掌握可执行 Jar、容器镜像、分层 Jar 和配置外置化。
- 理解 JVM 部署和 Native Image 部署的取舍。
- 能写出基础部署检查清单。

## 理论导读

Boot 应用常见交付形式是可执行 Jar 或容器镜像。可执行 Jar 适合传统虚拟机或直接 JVM 部署；容器镜像适合 Kubernetes 和云原生环境；Native Image 适合启动快、内存敏感、实例频繁扩缩的场景，但构建复杂度和兼容性验证成本更高。

## 核心心智模型

部署不是把 Jar 丢上去运行，而是把“应用、配置、运行时、网络、健康检查、日志、资源限制、回滚策略”一起交付。

## 知识点详解

### 可执行 Jar

```powershell
mvn package
java -jar target/order-service-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

Boot 插件会重新打包 Jar，使其可直接运行。

### 容器镜像

Boot 构建插件支持使用 buildpacks 生成 OCI 镜像：

```powershell
mvn spring-boot:build-image -Dspring-boot.build-image.imageName=example/order-service:1.0.0
```

也可以写 Dockerfile，但要注意基础镜像、非 root 用户、时区、证书、资源限制和镜像层缓存。

### 分层 Jar

分层能把依赖、快照依赖、资源、应用代码拆成不同层，提升容器构建缓存命中率。

### Native Image 和 AOT

Spring Boot 支持 AOT 处理和 GraalVM Native Image。优点是启动快、内存占用低；代价是构建慢、反射/动态代理/资源加载需要更多元数据，第三方库兼容性必须验证。

### 外部化配置

部署环境应注入：

- Profile
- 数据库连接
- 密钥和证书
- 日志级别
- JVM 参数
- 管理端点暴露策略

## 例子

```dockerfile
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY target/order-service.jar app.jar
USER 10001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

## 练习

1. 打包订单服务为可执行 Jar。
2. 构建容器镜像。
3. 通过环境变量注入数据库地址。
4. 配置容器资源限制和健康检查。
5. 对比 JVM Jar 和 Native Image 的启动时间、内存占用。

## 验收

- 容器中应用以非 root 用户运行。
- 镜像不包含源码和本地密钥。
- 生产配置不写入镜像。
- 健康检查能正确反映 readiness。

## 重点

- 镜像是不可变制品，配置应由环境注入。
- Native Image 是部署选项，不是所有服务的默认答案。
- 发布必须可回滚。

## 难点

- 容器内存限制和 JVM 堆大小、直接内存、线程栈需要统一考虑。
- Native Image 下反射、序列化、动态代理问题更容易暴露。

## 易错

> **易错：** 把 `application-prod.yml` 和密钥一起打进镜像。
>
> 正确做法：镜像只包含应用和非敏感默认配置，敏感值通过 Secret 注入。

