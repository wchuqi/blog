---
title: "Spring Cloud 学习路线图"
date: 2026-06-20
description: "版本基准：2026-06-06 核对的最新稳定版是 Spring Cloud Release Train 2025.1.1，官方文档显示支持 Spring Boot 4.0.2。学习前建议已经掌握 Spring Boot、REST API、…"
tags:
  - "框架"
  - "SpringCloud框架"
  - "学习路线图"
category: "框架"
---

# Spring Cloud 学习路线图

版本基准：2026-06-06 核对的最新稳定版是 Spring Cloud Release Train `2025.1.1`，官方文档显示支持 Spring Boot `4.0.2`。学习前建议已经掌握 Spring Boot、REST API、Spring Security、数据库事务、HTTP、Docker/Kubernetes 基础。

## 阶段 1：分布式系统基础认知

- 目标：理解 Spring Cloud 解决的是分布式系统中的通用模式，而不是替代 Spring Boot。
- 需要掌握：服务拆分、服务注册发现、配置外部化、网关、服务间调用、熔断、消息驱动、可观测性。
- 例子：订单服务调用库存服务，库存服务扩容后调用方不用写死 IP。
- 练习：画出“客户端 -> Gateway -> 订单服务 -> 库存服务 -> 消息队列”的调用图。
- 验收：能说清 Spring Cloud、Spring Boot、Kubernetes、Service Mesh 的边界。
- 重点：分布式系统的核心难题是网络不可靠、实例动态变化、局部失败、配置分散和观测困难。
- 易错：把 Spring Cloud 当成“微服务全家桶”，什么项目都强行拆服务。

## 阶段 2：版本、依赖和工程结构

- 目标：能正确选择 Spring Cloud Release Train、Spring Boot 版本、BOM 和 starter。
- 需要掌握：Release Train、BOM、依赖管理、Boot 兼容版本、旧组件替代关系。
- 例子：`2025.1.1` 对应 Boot `4.0.2`，不要随意混用 Boot 3.x 和 Cloud 2025.1.x。
- 练习：创建一个多模块项目：gateway、order-service、inventory-service、config-server。
- 验收：能解释为什么 Spring Cloud 不直接写 `spring-cloud-xxx` 单个版本，而是使用 release train BOM。
- 重点：Cloud 和 Boot 版本必须成套验证。
- 易错：手工覆盖 BOM 管理的依赖版本，导致运行时 `NoSuchMethodError`。

## 阶段 3：核心通信能力

- 目标：掌握服务发现、负载均衡、OpenFeign、Gateway 的调用链路。
- 需要掌握：DiscoveryClient、ServiceInstance、Spring Cloud LoadBalancer、Feign 契约、Gateway Route Predicate、Filter。
- 例子：`lb://inventory-service` 通过服务名解析到健康实例，再按负载均衡算法选择实例。
- 练习：实现订单服务通过 Feign 调库存服务，Gateway 统一暴露 `/api/orders/**`。
- 验收：能排查“服务注册了但调用不到”“Gateway 路由没匹配”“Feign 404/超时”。
- 重点：服务名解析、实例选择、超时、重试和降级是同一条调用链。
- 难点：重试可能放大流量，必须结合幂等和熔断。

## 阶段 4：配置、韧性和消息

- 目标：掌握配置中心、动态刷新、熔断隔离、消息驱动和最终一致性。
- 需要掌握：Config Server、`spring.config.import`、Bus、Resilience4j、Retry、Bulkhead、RateLimiter、Stream Binder、消费组、DLQ。
- 例子：配置中心修改库存阈值后通过 Bus 刷新服务；库存扣减失败时订单服务触发熔断。
- 练习：实现 outbox 或事件驱动订单创建流程。
- 验收：能解释动态刷新边界、熔断打开条件、消息重复消费幂等方案。
- 重点：分布式系统默认会失败，设计必须包含失败路径。
- 难点：配置刷新、重试、熔断、消息重放都可能改变系统行为。

## 阶段 5：生产治理和排障

- 目标：能在生产环境诊断 Spring Cloud 应用的问题。
- 需要掌握：Actuator、Micrometer、Tracing、Gateway metrics、LoadBalancer 日志、Feign 日志、CircuitBreaker 指标、配置端点安全、Kubernetes 探针。
- 例子：P99 升高时，从 Gateway 指标定位到订单服务，再从 trace 定位到库存 Feign 调用超时。
- 练习：制造库存服务超时，观察 Gateway、Feign、CircuitBreaker、日志和 trace。
- 验收：能写出一份“服务间调用失败”的证据链和恢复动作。
- 重点：先看证据链，再改配置。
- 易错：看到超时就盲目增加超时时间，导致线程和连接池堆积。

## 推荐学习节奏

| 周期 | 学习重点 | 产出 |
| --- | --- | --- |
| 第 1 周 | 总览、版本、服务发现 | 服务调用链路图和最小多服务项目 |
| 第 2 周 | OpenFeign、Gateway、Config | 网关转发、服务调用、配置中心 |
| 第 3 周 | 熔断、限流、消息驱动 | 故障保护和事件驱动订单流程 |
| 第 4 周 | Kubernetes、安全、可观测性 | 生产部署方案和排障手册 |
| 第 5 周 | 迁移、面试、综合项目 | 完整项目复盘和面试题答案 |

## 最终能力清单

- 能正确选择 Spring Cloud Release Train 和 Spring Boot 版本。
- 能构建 Gateway、服务发现、Feign 调用、配置中心、熔断、消息驱动的最小系统。
- 能解释 `lb://`、Gateway route、Feign、LoadBalancer、CircuitBreaker 的执行链路。
- 能设计超时、重试、熔断、限流、隔离、幂等和补偿。
- 能基于日志、指标、trace、Actuator 排查生产问题。
- 能回答 Spring Cloud 常见面试题，并用真实场景说明边界和风险。

