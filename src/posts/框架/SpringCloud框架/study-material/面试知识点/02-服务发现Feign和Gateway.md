---
title: "Spring Cloud 面试知识点：服务发现、Feign 和 Gateway"
date: 2026-06-20
description: "lb://inventory-service 中的 inventory-service 是逻辑服务名。Spring Cloud 会通过 DiscoveryClient 或对应实例供应器拿到服务实例列表，再由 Spring Cloud Loa…"
tags:
  - "框架"
  - "SpringCloud框架"
  - "面试"
category: "框架"
---

# Spring Cloud 面试知识点：服务发现、Feign 和 Gateway

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../SpringCloud学习资料.md)

## 一、服务发现和负载均衡

### 1. `lb://inventory-service` 是怎么工作的？

**参考答案：**

`lb://inventory-service` 中的 `inventory-service` 是逻辑服务名。Spring Cloud 会通过 DiscoveryClient 或对应实例供应器拿到服务实例列表，再由 Spring Cloud LoadBalancer 按策略选择一个实例，把逻辑地址替换成真实 host 和 port，然后执行 HTTP 请求。

> **重点：** 服务发现负责拿实例列表，LoadBalancer 负责选实例。

### 2. 服务注册了但调用失败，你怎么排查？

**参考答案：**

先确认调用方拿到的实例列表是否正确，再看实例 readiness、注册中心健康状态、客户端缓存、网络策略、服务名是否一致、端口是否正确。然后检查调用超时、熔断和日志。注册中心有实例不等于实例可用。

> **难点：** 注册表、客户端缓存、Kubernetes readiness 可能短暂不一致。

## 二、OpenFeign

### 3. OpenFeign 的执行链路是什么？

**参考答案：**

业务调用 Feign 接口时，Feign 动态代理根据 Contract 解析注解，Encoder 编码请求，RequestInterceptor 添加 Header，LoadBalancer 选择实例，HTTP Client 发送请求，Decoder 解码响应，非 2xx 状态可由 ErrorDecoder 转换异常。

> **重点：** Feign 是声明式 HTTP 客户端，不是本地 RPC。

### 4. Feign 调用为什么必须配置超时？

**参考答案：**

远程调用可能慢或无响应。如果没有超时，上游线程和连接会长时间占用，最终导致线程池、连接池耗尽，形成级联故障。超时要结合接口 SLA、总体请求预算、重试和熔断一起设计。

> **易错：** 看到超时就简单调大 readTimeout，可能让堆积更严重。

### 5. Feign 重试有什么风险？

**参考答案：**

重试会放大下游流量。非幂等写请求如果没有幂等键，重试可能造成重复扣款、重复下单。多层重试叠加会形成重试风暴。只应对可恢复、幂等的失败谨慎重试，并使用退避和总体超时预算。

## 三、Gateway

### 6. Gateway 的 Route、Predicate、Filter 分别是什么？

**参考答案：**

Route 是一条路由规则，定义 id、目标 uri、Predicate 和 Filter。Predicate 决定请求是否匹配这条 Route，例如 Path、Method、Header。Filter 在转发前后修改请求或响应，例如 StripPrefix、RewritePath、AddHeader、限流、熔断。

> **重点：** Predicate 决定是否匹配，Filter 决定匹配后怎么处理。

### 7. Gateway 404 怎么排查？

**参考答案：**

先看请求是否匹配到 route，再看 Path/Method/Host/Header 条件。若 route 匹配但下游 404，重点检查 StripPrefix 或 RewritePath 后的实际路径是否与下游 Controller 一致。还要确认 `lb://` 服务名是否正确解析到目标服务。

### 8. 为什么 Gateway Filter 里不能做阻塞操作？

**参考答案：**

Spring Cloud Gateway 基于 WebFlux/Reactive 模型，事件循环线程数量有限。如果在 Filter 中做阻塞数据库查询、阻塞 HTTP 调用或长时间计算，会阻塞事件循环，影响整个网关吞吐和延迟。

> **重点：** 网关是入口组件，阻塞 Filter 的影响面很大。

