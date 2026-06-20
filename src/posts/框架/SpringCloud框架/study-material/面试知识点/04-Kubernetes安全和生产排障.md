---
title: "Spring Cloud 面试知识点：Kubernetes、安全和生产排障"
date: 2026-06-20
description: "如果只需要简单服务调用，Kubernetes DNS 和 Service 足够。Spring Cloud Kubernetes 的价值是把 Kubernetes 服务、配置等平台能力接入 Spring Cloud DiscoveryClie…"
tags:
  - "框架"
  - "SpringCloud框架"
  - "面试"
category: "框架"
---

# Spring Cloud 面试知识点：Kubernetes、安全和生产排障

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../SpringCloud学习资料.md)

## 一、Kubernetes

### 1. Kubernetes 已有 Service 发现，为什么还需要 Spring Cloud Kubernetes？

**参考答案：**

如果只需要简单服务调用，Kubernetes DNS 和 Service 足够。Spring Cloud Kubernetes 的价值是把 Kubernetes 服务、配置等平台能力接入 Spring Cloud DiscoveryClient、LoadBalancer 和配置模型，让 Feign、Gateway 的 `lb://` 等应用侧抽象继续工作。是否使用取决于团队是否需要这些抽象。

### 2. readiness 和 liveness 有什么区别？

**参考答案：**

readiness 表示 Pod 是否可以接收流量；liveness 表示应用是否需要被重启。下游数据库短暂不可用通常不应直接导致 liveness 失败，否则可能造成重启风暴。

> **重点：** readiness 控流量，liveness 控重启。

## 二、安全

### 3. 微服务安全为什么不能只依赖 Gateway？

**参考答案：**

Gateway 是外部入口，但内部服务也可能被绕过、误暴露或受到横向访问。业务服务应校验用户身份、服务身份和业务权限，管理端点也要保护。网关做粗粒度入口保护，业务服务做最终授权。

### 4. 用户身份和服务身份有什么区别？

**参考答案：**

用户身份表示当前用户是谁、有什么 scope；服务身份表示调用方服务是谁、是否有权调用目标服务。用户能下单不代表 order-service 可以访问 payment-service 的所有接口。服务间认证可以用 mTLS、client credentials、服务账号 Token 或 Service Mesh workload identity。

## 三、生产排障

### 5. 一个跨服务请求 P99 升高，你怎么排查？

**参考答案：**

从 Gateway 指标看 routeId、状态码和延迟，拿 traceId 串起 order-service、Feign 调用、inventory-service 和数据库。检查 Feign 超时、LoadBalancer 是否选到异常实例、CircuitBreaker 状态、下游服务线程/连接池/GC、数据库慢查询和最近发布配置。止血动作包括回滚、限流、熔断、降级、扩容。

> **重点：** Spring Cloud 排障必须从入口到下游串证据链。

### 6. 消息积压怎么排查？

**参考答案：**

先比较生产速率和消费速率，再看消费者错误率、重试、DLQ、分区数量、消费组实例数和下游依赖耗时。毒消息要进入 DLQ，消费者要有幂等，扩容前要确认分区数是否支持并行消费。

### 7. 配置中心改错导致故障怎么恢复？

**参考答案：**

先确认最终生效值来自 Config Server、环境变量还是命令行。止血可以回滚配置提交、临时覆盖配置或回滚服务。之后检查 Bus 刷新范围、配置校验是否缺失、变更审核和灰度是否缺失，并补充非法值校验。

## 四、场景题

### 8. 订单服务调用库存服务，库存服务故障时如何保护订单服务？

**参考答案：**

订单服务对库存调用设置连接超时和读取超时；读接口可谨慎重试，写接口必须有幂等键才考虑重试；配置 CircuitBreaker，在失败率或慢调用率超过阈值时快速失败；用 Bulkhead 限制库存调用并发；Gateway 可以对创建订单限流；日志、指标和 trace 必须能定位库存调用失败。

> **重点：** 保护策略要按业务语义组合，不能只加一个 fallback。

