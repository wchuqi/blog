---
title: "Spring Boot 4 学习资料：Actuator 端点、健康检查、指标和追踪深度解析"
date: 2026-06-20
description: "端点存在，不代表通过 HTTP 暴露；暴露也不代表可以匿名访问。"
tags:
  - "框架"
  - "SpringBoot框架"
  - "深度解析"
category: "框架"
---

# Spring Boot 4 学习资料：Actuator 端点、健康检查、指标和追踪深度解析

[返回索引](../SpringBoot4学习资料.md)

## 学习目标

- 理解 Actuator 端点如何发现和暴露。
- 掌握健康检查分组、指标注册、日志级别动态调整。
- 能设计生产可观测性和安全策略。

## Actuator 端点模型

```text
Endpoint Bean
  -> EndpointDiscoverer 发现
  -> 按技术适配 Web/JMX
  -> 根据 exposure 配置决定暴露
  -> 安全层控制访问
```

端点存在，不代表通过 HTTP 暴露；暴露也不代表可以匿名访问。

## Health 分组

```yaml
management:
  endpoint:
    health:
      probes:
        enabled: true
      group:
        readiness:
          include: db,payment
        liveness:
          include: ping
```

> **重点：** liveness 判断进程是否需要重启；readiness 判断是否应该接流量。不要把临时下游故障放进 liveness。

## HealthIndicator 设计

```java
@Component
class PaymentHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        try {
            return pingPayment() ? Health.up().build()
                : Health.down().withDetail("reason", "unavailable").build();
        } catch (Exception ex) {
            return Health.down(ex).build();
        }
    }
}
```

健康检查必须快，有超时，不能压垮下游。

## 指标命名

好的指标：

- 名称稳定。
- 标签维度有限。
- 单位明确。
- 不把 userId、orderId 作为标签。

```java
Timer.Sample sample = Timer.start(registry);
try {
    return orderService.create(command);
} finally {
    sample.stop(Timer.builder("orders.create")
        .tag("result", "success")
        .register(registry));
}
```

> **易错：** 高基数标签会让指标系统爆炸，例如把订单号作为 tag。

## 动态日志

`/actuator/loggers` 可以临时调整日志级别，适合生产排障。但要有权限控制和操作审计。

## 练习

1. 配置 readiness/liveness 分组。
2. 写一个有超时保护的 HealthIndicator。
3. 增加 Timer 和 Counter 指标。
4. 动态打开某个包 DEBUG 日志，排查后恢复。

## 验收

- 能解释 endpoint 发现、暴露和安全的区别。
- 能设计健康检查分组。
- 能避免高基数指标。
