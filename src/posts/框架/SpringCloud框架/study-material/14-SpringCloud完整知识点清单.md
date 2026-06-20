---
title: "Spring Cloud 完整知识点清单"
date: 2026-06-20
description: "Spring Cloud Release Train 2025.1.1，2026-06-06 核对为官方 latest stable。"
tags:
  - "框架"
  - "SpringCloud框架"
  - "知识清单"
category: "框架"
---

# Spring Cloud 完整知识点清单

[返回索引](../SpringCloud学习资料.md)

## 版本和定位

- Spring Cloud Release Train `2025.1.1`，2026-06-06 核对为官方 latest stable。
- 官方文档显示支持 Spring Boot `4.0.2`。
- 维护线包括 `2025.0.2`、`2024.0.3`、`2023.0.6`。
- Spring Cloud 是 Spring Boot 分布式系统工具集，不是微服务充分条件。

## 一、基础架构

- 微服务边界。
- 分布式系统失败模式。
- Spring Boot 与 Spring Cloud 边界。
- Spring Cloud 与 Kubernetes、Service Mesh 边界。
- Release Train、BOM、starter。
- 旧组件替代：Ribbon、Hystrix、Zuul。

## 二、服务注册发现

- DiscoveryClient。
- ServiceInstance。
- 注册中心。
- 健康检查。
- 实例元数据。
- Spring Cloud LoadBalancer。
- `lb://` 解析。
- ServiceInstanceListSupplier。
- zone/region/metadata 过滤。
- 灰度实例选择。
- 优雅下线和客户端缓存。
- 实例缓存。
- Kubernetes DNS 与 Spring Cloud Kubernetes Discovery。

## 三、服务间调用

- OpenFeign。
- Contract。
- Encoder/Decoder。
- ErrorDecoder。
- RequestInterceptor。
- Feign 动态代理。
- Contract 和 MethodMetadata。
- Encoder/Decoder/ErrorDecoder。
- 超时。
- 重试。
- Header 传播。
- 事务边界风险。
- Token 传播。
- DTO 契约。
- 幂等键。

## 四、Gateway

- Route。
- Predicate。
- GatewayFilter。
- GlobalFilter。
- RoutePredicateHandlerMapping。
- ReactiveLoadBalancerClientFilter。
- NettyRoutingFilter。
- 路径改写。
- `StripPrefix`。
- `RewritePath`。
- `lb://` 转发。
- 限流。
- 熔断。
- CORS。
- WebFlux 阻塞风险。
- Gateway Actuator 和 metrics。

## 五、配置中心

- Config Server。
- Config Client。
- 配置仓库结构。
- `spring.config.import`。
- 配置数据加载阶段。
- Profile 配置。
- PropertySource。
- `/actuator/refresh`。
- 刷新作用域。
- 不可刷新配置。
- Spring Cloud Bus。
- 配置加密。
- Secret 管理。
- 配置审计和回滚。

## 六、韧性治理

- Timeout。
- Retry。
- CircuitBreaker。
- CLOSED/OPEN/HALF_OPEN。
- slidingWindowSize。
- minimumNumberOfCalls。
- slowCallDurationThreshold。
- Bulkhead。
- RateLimiter。
- TimeLimiter。
- fallback。
- 重试风暴。
- 熔断误触发。
- 幂等和保护策略。

## 七、消息驱动

- Spring Cloud Stream。
- binder。
- binding。
- destination。
- consumer group。
- partition。
- DLQ。
- 重试。
- outbox。
- 消费幂等。
- ack 边界。
- 重复消费原因。
- 事件版本。
- Schema 演进。
- 顺序性。
- 消息堆积排查。

## 八、Kubernetes 和云原生

- Kubernetes Service。
- EndpointSlice。
- ConfigMap。
- Secret。
- readiness。
- liveness。
- graceful shutdown。
- rolling update。
- HPA。
- Spring Cloud Kubernetes。
- Service Mesh 取舍。

## 九、安全

- Gateway 认证。
- Resource Server。
- JWT。
- Token Relay。
- Token Exchange。
- 服务间认证。
- mTLS。
- 租户上下文。
- Actuator 端点保护。
- 内部接口最小授权。

## 十、可观测性和排障

- traceId。
- routeId、serviceId、instanceId。
- Gateway route metrics。
- Feign 日志和指标。
- LoadBalancer 选择日志。
- CircuitBreaker 指标。
- Stream 消费延迟和 DLQ。
- Actuator health、metrics、env、configprops、gateway。
- P95/P99。
- 级联故障。
- 故障复盘。

## 十一、迁移和兼容

- Boot/Cloud 版本矩阵。
- BOM 版本管理。
- 依赖树分析。
- bootstrap 到 config import。
- Ribbon 到 LoadBalancer。
- Hystrix 到 CircuitBreaker。
- Zuul 到 Gateway。
- 内部 starter 兼容。
- 灰度发布和回滚。

## 十二、项目实践

- 多模块项目结构。
- Gateway 入口。
- Config Server。
- Feign 调用。
- 熔断限流。
- Stream 事件。
- Kubernetes 部署。
- 安全和观测。
- 故障演练。

## 复习检查

- 能画出跨服务调用链。
- 能解释 `lb://` 到真实实例的过程。
- 能设计 Feign 超时、错误处理和幂等。
- 能排查 Gateway 路由问题。
- 能说明 Config 动态刷新边界。
- 能区分 Retry、CircuitBreaker、Bulkhead、RateLimiter。
- 能设计 outbox 和消费者幂等。
- 能解释 Kubernetes 和 Spring Cloud 的能力重叠。
- 能从 Gateway 到下游服务构建排障证据链。
