---
title: "Spring Boot 4 学习资料：安全配置、Secrets 和生产边界"
date: 2026-06-20
description: "Spring Boot 提供很多开箱即用能力，但生产安全不是默认全自动完成的。配置文件、环境变量、Actuator 端点、日志、错误响应、跨域、文件上传、反序列化都可能成为风险入口。"
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 4 学习资料：安全配置、Secrets 和生产边界

[返回索引](../SpringBoot4学习资料.md)

## 学习目标

- 理解 Boot 应用生产配置安全边界。
- 掌握 Secrets 管理、Actuator 暴露控制、错误响应脱敏。
- 知道 Spring Security 与 Boot 自动配置的关系。

## 理论导读

Spring Boot 提供很多开箱即用能力，但生产安全不是默认全自动完成的。配置文件、环境变量、Actuator 端点、日志、错误响应、跨域、文件上传、反序列化都可能成为风险入口。

## Secrets 管理

不要把生产密码提交到 Git：

```yaml
spring:
  datasource:
    password: ${DB_PASSWORD}
```

常见来源：

- 环境变量。
- Kubernetes Secret 挂载。
- 云厂商 Secret Manager。
- Vault。
- 加密配置文件加部署期解密。

## Actuator 安全

```yaml
management:
  server:
    port: 9001
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    env:
      show-values: never
```

> **易错：** 生产暴露 `/actuator/env`、`/actuator/heapdump` 到公网。它们可能泄漏配置、内存和敏感信息。

## 错误响应

生产错误响应应包含：

- 稳定错误码。
- 可读提示。
- requestId/traceId。
- 合适 HTTP 状态码。

不应包含：

- 堆栈。
- SQL。
- 内部路径。
- 密钥。

## Spring Security 自动配置

引入 `spring-boot-starter-security` 后，Boot 会默认启用安全配置。实际项目通常需要自定义 SecurityFilterChain。

```java
@Bean
SecurityFilterChain apiSecurity(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health").permitAll()
            .anyRequest().authenticated()
        )
        .build();
}
```

## 练习

1. 把数据库密码改为环境变量注入。
2. 限制 Actuator 暴露端点。
3. 为错误响应增加 traceId。
4. 引入 Security Starter，观察默认行为。

## 验收

- 能列出 Boot 应用至少 10 个生产安全风险。
- 能设计 Actuator 暴露策略。
- 能说明配置脱敏和错误脱敏的必要性。
