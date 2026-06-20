---
title: "Spring Boot 学习资料：Actuator、可观测性和生产就绪"
date: 2026-06-20
description: "生产环境的问题通常不是“代码能否启动”，而是“出问题时能否定位，扩容时能否判断，发布时能否平滑，异常时能否隔离”。Spring Boot Actuator 提供应用运行状态窗口，是运维、SRE 和开发共同使用的诊断入口。"
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 学习资料：Actuator、可观测性和生产就绪

[返回索引](../SpringBoot学习资料.md)

## 学习目标

- 掌握 Actuator 常用端点和安全暴露策略。
- 理解 health、metrics、logs、tracing、readiness、liveness 的职责。
- 能为服务设计上线前的生产就绪清单。

## 理论导读

生产环境的问题通常不是“代码能否启动”，而是“出问题时能否定位，扩容时能否判断，发布时能否平滑，异常时能否隔离”。Spring Boot Actuator 提供应用运行状态窗口，是运维、SRE 和开发共同使用的诊断入口。

## 核心心智模型

Actuator 是应用仪表盘：

- health 告诉平台是否可接流量。
- metrics 告诉你系统是否变慢或异常。
- logs 告诉你发生了什么。
- traces 告诉你一次请求经过哪里。
- dumps 告诉你 JVM 内部卡在哪里。

## 知识点详解

### 常用端点

| 端点 | 用途 | 生产建议 |
| --- | --- | --- |
| `health` | 健康检查 | 可有限公开 |
| `info` | 版本和构建信息 | 可有限公开 |
| `metrics` | 指标 | 内网或认证 |
| `prometheus` | Prometheus 抓取 | 内网或认证 |
| `loggers` | 动态日志级别 | 严格认证 |
| `env` | 环境属性 | 不公开 |
| `configprops` | 配置绑定 | 不公开 |
| `heapdump` | 堆转储 | 不公开 |
| `threaddump` | 线程转储 | 严格认证 |
| `conditions` | 自动配置报告 | 非生产或严格认证 |

### 健康探针

Kubernetes 常用：

- liveness：进程是否需要重启。
- readiness：是否可以接收流量。

错误设计会导致故障扩大。例如把外部支付服务短暂不可用纳入 liveness，可能让应用不断重启。

### 指标和追踪

Boot 通过 Micrometer 统一指标门面，常见指标包括 HTTP 请求耗时、JVM 内存、GC、线程、连接池、数据库调用等。Tracing 用于关联跨服务调用，常结合 OpenTelemetry、Zipkin 或云厂商 APM。

### 日志

生产日志应包含时间、级别、traceId、spanId、请求路径、业务关键字段和异常堆栈。不要打印密码、Token、身份证号等敏感信息。

## 例子

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when_authorized
  metrics:
    tags:
      application: order-service
```

## 练习

1. 给订单服务引入 Actuator。
2. 暴露 `health`、`info`、`metrics`、`prometheus`。
3. 配置 readiness/liveness。
4. 增加订单创建成功和失败计数器。
5. 验证敏感端点不能匿名访问。

## 验收

- `/actuator/health/readiness` 可用于发布探针。
- Prometheus 能抓取 HTTP、JVM、业务指标。
- 日志包含 traceId 且不泄漏敏感信息。
- 敏感端点有认证或完全不暴露。

## 重点

- Actuator 是生产诊断入口，必须配合安全策略。
- readiness 和 liveness 语义不能混用。
- 指标、日志、trace 要能互相串联。

## 难点

- 健康检查过严会造成误杀，过松会让坏实例接流量。
- 指标标签不能无限增长，高基数标签会拖垮监控系统。

## 易错

> **易错：** 在公网暴露 `/actuator/env` 和 `/actuator/heapdump`。
>
> 正确做法：只暴露必要端点，并用网络、认证、授权三层限制管理端点。

