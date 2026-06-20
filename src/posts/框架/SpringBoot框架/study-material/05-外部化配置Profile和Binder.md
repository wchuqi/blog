---
title: "Spring Boot 4 学习资料：外部化配置、Profile 和 Binder"
date: 2026-06-20
description: "Spring Boot 配置系统允许同一个应用包在不同环境中运行。端口、数据库、日志、线程池、开关、密钥位置都可以通过外部配置控制。"
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 4 学习资料：外部化配置、Profile 和 Binder

[返回索引](../SpringBoot4学习资料.md)

## 学习目标

- 掌握 Boot 配置来源和优先级。
- 理解 Profile、ConfigData、配置绑定和宽松绑定。
- 会排查配置不生效、类型绑定失败、环境变量覆盖问题。

## 理论导读

Spring Boot 配置系统允许同一个应用包在不同环境中运行。端口、数据库、日志、线程池、开关、密钥位置都可以通过外部配置控制。

真正难的是：配置来源很多，优先级不同，Profile 会激活额外配置文件，环境变量命名会被宽松绑定转换，最终生效值可能不是你看到的第一个值。

## 常见配置来源

- 命令行参数。
- Java 系统属性。
- OS 环境变量。
- `application.yml`。
- `application-{profile}.yml`。
- `spring.config.import` 导入的配置。
- 测试注解配置。
- 默认属性。

> **重点：** 排查配置问题必须问“最终 Environment 中这个 key 的值来自哪里”。

## Profile

```yaml
spring:
  profiles:
    active: dev
```

`application-dev.yml`：

```yaml
server:
  port: 8081
```

生产环境不要把 active profile 写死在包内配置。通常由启动参数、环境变量或部署平台注入。

## 类型安全配置

```java
@ConfigurationProperties(prefix = "app.payment")
public record PaymentProperties(
    boolean enabled,
    Duration timeout,
    URI endpoint
) {
}
```

启用：

```java
@EnableConfigurationProperties(PaymentProperties.class)
@Configuration
class PaymentConfig {
}
```

配置：

```yaml
app:
  payment:
    enabled: true
    timeout: 2s
    endpoint: https://pay.example.com
```

## 宽松绑定

这些形式通常可绑定到同一属性：

```text
app.payment.timeout
app.payment-timeout
APP_PAYMENT_TIMEOUT
```

> **难点：** 环境变量不支持点号，Boot 会做名称转换。容器和 Kubernetes 中最容易出现“以为没覆盖，实际覆盖了”的情况。

## 配置校验

```java
@Validated
@ConfigurationProperties(prefix = "app.payment")
public record PaymentProperties(
    @NotNull URI endpoint,
    @Positive Duration timeout
) {
}
```

配置缺失或非法时启动失败，比运行中失败更安全。

## 易错

> **易错：** 用 `@Value` 到处散落读取配置。
>
> 正确做法：业务配置优先集中到 `@ConfigurationProperties`，便于校验、测试和生成元数据。

> **易错：** 把密码直接写进 Git 里的 `application-prod.yml`。
>
> 正确做法：生产 secrets 由环境变量、密钥管理系统或挂载文件提供。

## 练习

1. 定义 `PaymentProperties`，绑定 Duration、URI、枚举。
2. 用环境变量覆盖 YAML 配置。
3. 故意设置非法 Duration，观察启动失败。
4. 用 Actuator env 端点查看配置来源，注意脱敏。

## 验收

- 能解释 Profile 和配置来源优先级。
- 能写带校验的配置属性类。
- 能定位配置不生效的来源和覆盖关系。
