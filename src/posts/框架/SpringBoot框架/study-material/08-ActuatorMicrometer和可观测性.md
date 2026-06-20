---
title: "Spring Boot 4 学习资料：Actuator、Micrometer 和可观测性"
date: 2026-06-20
description: "生产系统不能只靠“应用启动了”判断健康。它需要告诉平台：进程是否活着、是否准备接流量、数据库是否可用、请求延迟如何、错误率是否上升、线程和连接池是否耗尽。"
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 4 学习资料：Actuator、Micrometer 和可观测性

[返回索引](../SpringBoot4学习资料.md)

## 学习目标

- 掌握 Actuator 端点、健康检查、指标、日志级别。
- 理解 Micrometer 在指标系统中的角色。
- 会为生产环境设计 readiness、liveness、Prometheus 指标和脱敏策略。

## 理论导读

生产系统不能只靠“应用启动了”判断健康。它需要告诉平台：进程是否活着、是否准备接流量、数据库是否可用、请求延迟如何、错误率是否上升、线程和连接池是否耗尽。

Spring Boot Actuator 提供应用管理端点，Micrometer 提供指标门面，让同一套指标可以对接 Prometheus、OTLP 等后端。

## 启用 Actuator

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,loggers
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when_authorized
```

## 常用端点

| 端点 | 用途 |
| --- | --- |
| `/actuator/health` | 健康检查 |
| `/actuator/metrics` | 指标查询 |
| `/actuator/prometheus` | Prometheus 抓取 |
| `/actuator/loggers` | 查看和调整日志级别 |
| `/actuator/env` | 查看环境属性，注意安全 |
| `/actuator/conditions` | 自动配置条件报告 |

## 健康检查

```java
@Component
class PaymentHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        boolean ok = checkPaymentGateway();
        return ok ? Health.up().build() : Health.down().withDetail("reason", "timeout").build();
    }
}
```

> **易错：** 把所有下游依赖都放进 liveness。下游短暂故障会导致平台重启应用，反而扩大故障。

## 自定义指标

```java
@Service
class OrderMetrics {
    private final Counter createdCounter;

    OrderMetrics(MeterRegistry registry) {
        this.createdCounter = Counter.builder("orders.created")
            .description("created orders")
            .register(registry);
    }

    void recordCreated() {
        createdCounter.increment();
    }
}
```

## 可观测性三件套

| 类型 | 关注点 |
| --- | --- |
| Logs | 单次事件和上下文 |
| Metrics | 聚合趋势和告警 |
| Traces | 跨服务调用链路 |

## 安全边界

- 生产不要暴露所有 Actuator 端点到公网。
- `env`、`configprops`、`heapdump`、`threaddump` 等端点需要严格权限。
- 敏感配置要脱敏。
- 管理端口可以和业务端口分离。

## 练习

1. 启用 health、metrics、prometheus。
2. 增加自定义 HealthIndicator。
3. 增加订单创建 Counter。
4. 通过 loggers 端点临时调整某个包 DEBUG 日志。

## 验收

- 能设计 liveness/readiness。
- 能说明 Actuator 端点安全风险。
- 能用指标定位错误率、延迟、连接池问题。
