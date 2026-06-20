---
title: "Spring Boot 4 学习资料：打包部署、容器镜像、AOT 和 Native"
date: 2026-06-20
description: "Spring Boot Maven Plugin 会把应用和依赖重打包成可执行 jar。"
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 4 学习资料：打包部署、容器镜像、AOT 和 Native

[返回索引](../SpringBoot4学习资料.md)

## 学习目标

- 掌握 Boot jar 打包、运行和分层。
- 理解容器镜像构建、配置注入、健康检查。
- 了解 AOT 和 GraalVM Native Image 的适用边界。

## 可执行 jar

```bash
mvn package
java -jar target/app.jar --spring.profiles.active=prod
```

Spring Boot Maven Plugin 会把应用和依赖重打包成可执行 jar。

## 分层 jar

Boot 支持分层，把依赖、快照依赖、资源、应用类拆成不同层，利于容器镜像缓存。

```bash
java -Djarmode=tools -jar target/app.jar extract --layers
```

## 构建 OCI 镜像

```bash
mvn spring-boot:build-image
```

适合不手写 Dockerfile 的场景。企业生产中也常使用自定义 Dockerfile，以满足基础镜像、安全扫描、证书、字体、时区等要求。

## 容器运行注意点

- 配置通过环境变量或挂载注入。
- JVM 内存要考虑容器限制。
- readiness/liveness 分开。
- 日志输出到 stdout/stderr。
- 不在镜像中打入生产密钥。

## AOT 和 Native

AOT 在构建期提前处理部分运行期推断工作，Native Image 可以减少启动时间和内存，但会增加构建复杂度，并对反射、动态代理、资源访问提出更高要求。

适合：

- Serverless。
- CLI。
- 冷启动敏感服务。
- 高密度部署。

不一定适合：

- 大量动态反射框架。
- 构建时间敏感项目。
- 团队缺少 Native 排障经验。

## 练习

1. 打包可执行 jar 并运行。
2. 构建 OCI 镜像。
3. 配置容器环境变量覆盖端口。
4. 尝试 AOT 构建并记录反射相关问题。

## 验收

- 能解释 Boot 可执行 jar 的价值。
- 能构建并运行容器镜像。
- 能说明 Native Image 的收益和风险。
