---
title: "Spring Cloud 学习资料：Kubernetes 云原生部署和服务发现"
date: 2026-06-20
description: "Kubernetes 已经提供服务发现、配置、Secret、负载均衡和健康检查能力。Spring Cloud Kubernetes 把这些平台能力映射到 Spring Cloud 抽象中，例如 DiscoveryClient、配置加载和负载…"
tags:
  - "框架"
  - "SpringCloud框架"
category: "框架"
---

# Spring Cloud 学习资料：Kubernetes 云原生部署和服务发现

[返回索引](../SpringCloud学习资料.md)

## 学习目标

- 理解 Spring Cloud 与 Kubernetes 平台能力的重叠和互补。
- 掌握 Kubernetes 服务发现、ConfigMap/Secret、探针、滚动发布、HPA、Spring Cloud Kubernetes 的适用场景。
- 能判断使用注册中心、Kubernetes DNS、Spring Cloud Kubernetes Discovery 或 Service Mesh 的取舍。
- 能排查 Pod Ready 但应用不可用、服务发现重复、配置未更新、滚动发布流量损失。

## 理论导读

Kubernetes 已经提供服务发现、配置、Secret、负载均衡和健康检查能力。Spring Cloud Kubernetes 把这些平台能力映射到 Spring Cloud 抽象中，例如 DiscoveryClient、配置加载和负载均衡。是否使用它，取决于你是否希望应用继续使用 Spring Cloud 的服务发现和配置模型。

云原生部署的关键不是把 Jar 放进容器，而是让应用遵守平台契约：启动快、健康检查准确、优雅停机、配置外置、日志输出到 stdout、指标可抓取、资源限制明确。

## 核心心智模型

```text
Kubernetes Service
  -> 稳定虚拟地址
Endpoints/EndpointSlice
  -> 当前 Pod 实例列表
Readiness Probe
  -> 是否接收流量
Liveness Probe
  -> 是否需要重启
ConfigMap/Secret
  -> 配置和密钥
```

Spring Cloud Kubernetes 可以把这些信息接入 Spring 应用内部。

## 知识点详解

### 1. 服务发现选择

| 方案 | 适合 |
| --- | --- |
| Kubernetes DNS | 简单、平台原生、少依赖 |
| Spring Cloud Kubernetes Discovery | 需要 DiscoveryClient、Feign/Gateway `lb://`、metadata |
| Consul/Eureka | 非 K8s 或混合环境，有现成治理体系 |
| Service Mesh | 平台统一流量治理、mTLS、灰度、观测 |

### 2. ConfigMap 和 Secret

Kubernetes ConfigMap 适合非敏感配置，Secret 适合密钥。但 Secret 默认不是强加密保险箱，需要结合集群加密、RBAC、外部 Secret 管理系统。

### 3. 探针

Spring Boot Actuator 可暴露 readiness/liveness：

```yaml
management:
  endpoint:
    health:
      probes:
        enabled: true
```

Kubernetes：

```yaml
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
```

readiness 决定是否接流量；liveness 决定是否重启。不要把下游数据库短暂不可用直接做成 liveness 失败，否则会造成重启风暴。

### 4. 优雅停机

滚动发布时，旧 Pod 应先从流量中摘除，再处理完存量请求。

关注：

- `terminationGracePeriodSeconds`。
- Spring Boot graceful shutdown。
- readiness 先失败。
- Gateway/Service Mesh 连接排空。

### 5. 资源限制和 JVM

容器中必须设置 requests/limits。JVM 会感知容器限制，但仍要监控：

- 堆内存。
- 直接内存。
- 线程数。
- Metaspace。
- Native Image 资源。

### 6. 排查场景

Pod Ready 但接口 500：

- readiness 是否只检查进程存活，没有检查关键依赖。
- 应用启动后异步初始化是否未完成。
- 配置和 Secret 是否挂载正确。

服务调用不到：

- Service selector 是否匹配 Pod label。
- EndpointSlice 是否有实例。
- NetworkPolicy 是否阻断。
- Feign 使用的是 K8s DNS 还是 DiscoveryClient。

## 练习

1. 为 order-service 编写 Deployment 和 Service。
2. 配置 readiness/liveness。
3. 使用 ConfigMap 注入非敏感配置。
4. 使用 Secret 注入数据库密码。
5. 滚动更新时观察请求是否丢失。

## 验收

- 能区分 readiness 和 liveness。
- 能说明 Spring Cloud Kubernetes 的适用场景。
- 能排查 Service 没有 Endpoints 的问题。
- 能设计优雅停机。

## 重点

- Kubernetes 已经提供很多 Cloud 能力，应用侧组件要按需使用。
- 探针错误会直接影响发布和稳定性。
- Secret 管理需要平台安全配合。

## 难点

- Service Mesh、Gateway、Spring Cloud LoadBalancer 可能重复治理流量。
- 配置刷新和滚动发布之间要有明确策略。

## 易错

> **易错：** 把所有依赖健康都放进 liveness，导致下游故障时应用反复重启。
>
> 正确做法：liveness 判断应用是否需要重启，readiness 判断是否可以接流量。

