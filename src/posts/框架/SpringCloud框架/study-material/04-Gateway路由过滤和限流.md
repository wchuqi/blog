---
title: "Spring Cloud 学习资料：Gateway 路由、过滤和限流"
date: 2026-06-20
description: "Gateway 位于外部客户端和内部服务之间，是流量入口。它可以做认证前置、路径路由、Header 处理、灰度标记、限流、熔断、跨域、日志、指标、协议适配。Spring Cloud Gateway 基于 WebFlux/Reactive 模…"
tags:
  - "框架"
  - "SpringCloud框架"
category: "框架"
---

# Spring Cloud 学习资料：Gateway 路由、过滤和限流

[返回索引](../SpringCloud学习资料.md)

## 学习目标

- 理解 Spring Cloud Gateway 的定位：统一入口、路由、过滤、安全边界和流量治理。
- 掌握 Route、Predicate、Filter、GlobalFilter、`lb://`、路径改写、限流和观测。
- 能排查路由不匹配、路径被错误改写、Header 丢失、WebFlux 阻塞、限流误伤和下游超时。
- 能设计生产网关规则，而不是把 Gateway 当简单反向代理。

## 理论导读

Gateway 位于外部客户端和内部服务之间，是流量入口。它可以做认证前置、路径路由、Header 处理、灰度标记、限流、熔断、跨域、日志、指标、协议适配。Spring Cloud Gateway 基于 WebFlux/Reactive 模型，适合高并发 IO 转发，但不适合在过滤器里执行阻塞数据库查询或长时间同步逻辑。

网关的危险在于它处于所有流量入口。一条错误路由、错误限流或阻塞过滤器，影响面可能是全站。

## 核心心智模型

```text
Request
  -> Route Predicate 判断是否匹配
  -> Gateway Filter 链处理请求
  -> lb:// serviceName 解析实例
  -> 转发到下游服务
  -> 响应经过 Filter 链返回
```

Route 决定去哪，Predicate 决定是否匹配，Filter 决定转发前后做什么。

## 知识点详解

### 1. Route 结构

```yaml
spring:
  cloud:
    gateway:
      server:
        webflux:
          routes:
            - id: order-route
              uri: lb://order-service
              predicates:
                - Path=/api/orders/**
              filters:
                - StripPrefix=1
                - AddRequestHeader=X-Gateway, spring-cloud-gateway
```

匹配 `/api/orders/1` 后，`StripPrefix=1` 会去掉 `/api`，下游收到 `/orders/1`。

### 2. Predicate 匹配规则

常见 Predicate：

- Path。
- Method。
- Header。
- Query。
- Host。
- Cookie。
- After/Before/Between。
- Weight。

路由不匹配时，不要只看 Path。Method、Host、Header、Query 都可能让路由失败。

### 3. Filter 类型

| 类型 | 作用 |
| --- | --- |
| GatewayFilter | 绑定到某条 route |
| GlobalFilter | 对所有 route 生效 |
| 内置 Filter | 路径改写、Header、熔断、限流等 |
| 自定义 Filter | 实现业务网关逻辑 |

过滤器顺序很重要。认证、路径改写、限流、日志、转发前后处理，顺序错误会导致行为不符合预期。

### 4. Gateway 的请求处理链

一次请求进入 Gateway 后，大致经历：

```text
Netty 接收请求
  -> WebFlux HandlerMapping
  -> RoutePredicateHandlerMapping 找匹配 Route
  -> 构建 GatewayFilter 链
  -> GlobalFilter + Route Filter 按顺序执行
  -> ReactiveLoadBalancerClientFilter 处理 lb://
  -> NettyRoutingFilter 转发请求
  -> NettyWriteResponseFilter 写回响应
```

这个链路解释了 Gateway 排障重点：

- Predicate 没匹配，请求根本不会进入目标 route 的 filters。
- 路径改写发生在转发前，改错后下游 Controller 会 404。
- `lb://` 会触发负载均衡过滤器，否则不会走服务发现。
- 响应写回也是过滤链的一部分，后置 Filter 可以记录耗时和状态码。

> **难点：** Gateway 的过滤器分全局和路由两类，且有前置/后置效果。排查时要看实际 filter order，而不是只看 YAML 顺序。

### 5. 路径改写

路径改写是 Gateway 常见问题来源。

```yaml
filters:
  - StripPrefix=1
```

如果前端请求 `/api/orders/1`，下游 Controller 是 `/orders/{id}`，需要 StripPrefix。如果下游 Controller 也是 `/api/orders/{id}`，再 StripPrefix 就会 404。

复杂改写使用 RewritePath：

```yaml
filters:
  - RewritePath=/api/(?<segment>.*), /${segment}
```

### 6. 限流

网关限流保护后端服务，常见按 IP、用户、租户、API key、路径限流。

限流策略必须考虑：

- key 选择是否公平。
- 是否会误伤 NAT 后大量用户。
- 高峰期返回 429 还是排队。
- 限流指标和告警。
- 与下游服务自身限流是否叠加。

### 7. 自定义过滤器设计

自定义 Filter 应保持轻量：

- 只做 Header 校验、上下文注入、简单路由标记、日志和指标。
- 不做阻塞数据库查询。
- 不在网关里写复杂业务规则。
- 出错时返回清晰状态码和错误码。
- 所有关键判断都要有日志或指标。

示意：

```java
@Component
class TraceGlobalFilter implements GlobalFilter, Ordered {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String traceId = Optional.ofNullable(exchange.getRequest().getHeaders().getFirst("X-Trace-Id"))
                .orElse(UUID.randomUUID().toString());
        ServerHttpRequest request = exchange.getRequest().mutate()
                .header("X-Trace-Id", traceId)
                .build();
        return chain.filter(exchange.mutate().request(request).build());
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
```

### 8. Gateway 和安全

Gateway 可以做统一认证，但内部服务仍应有基本保护。只依赖网关安全，会在绕过网关、内部横向移动、测试环境暴露时出问题。

推荐：

- Gateway 做外部认证、基础授权、限流。
- 内部服务校验服务间身份或用户上下文。
- 关键操作在业务服务做最终授权。

### 9. WebFlux 阻塞风险

Gateway 基于响应式模型。不要在 Gateway Filter 里：

- 直接 JDBC 查询。
- 调用阻塞 SDK。
- `Thread.sleep`。
- 做 CPU 密集计算。

阻塞会占用事件循环线程，导致整个网关吞吐下降。

### 10. Gateway 排查路径

路由没匹配：

1. 看 route id 是否加载。
2. 看 Path/Method/Host/Header Predicate。
3. 看上下文路径和前缀。
4. 开启 Gateway 相关 debug 日志。

下游 404：

1. 确认 Gateway 是否匹配。
2. 看 StripPrefix/RewritePath 后的实际路径。
3. 确认下游 Controller 路径。

超时：

1. 看下游服务耗时。
2. 看 LoadBalancer 是否选到异常实例。
3. 看 Gateway 连接池和 Netty 指标。
4. 看是否有阻塞 Filter。

## 例子：订单网关路由

```yaml
spring:
  cloud:
    gateway:
      server:
        webflux:
          routes:
            - id: order-service
              uri: lb://order-service
              predicates:
                - Path=/api/orders/**
              filters:
                - StripPrefix=1
                - AddRequestHeader=X-Source, gateway
```

## 练习

1. 配置 `/api/orders/**` 转发到 order-service。
2. 使用 `StripPrefix` 让下游 Controller 接收 `/orders/**`。
3. 增加请求日志 GlobalFilter，记录 routeId、path、traceId。
4. 给 `/api/orders/**` 增加限流。
5. 故意写错 RewritePath，观察 404 并修复。

## 验收

- 能解释 Route、Predicate、Filter 的关系。
- 能判断请求为什么没有匹配某条路由。
- 能说明 `lb://` 如何结合服务发现。
- 能列出 Gateway Filter 中不能做阻塞操作的原因。
- 能设计基本限流策略。

## 重点

- Gateway 是入口治理点，但不是所有业务逻辑的堆放处。
- 路由匹配和路径改写是 Gateway 排障核心。
- 网关限流要结合用户、租户、路径和后端容量。

## 难点

- 多条 route 的匹配和过滤器顺序会产生复杂行为。
- Gateway 响应式模型下阻塞操作的影响面很大。

## 易错

> **易错：** 在 Gateway Filter 中查数据库做复杂权限判断。
>
> 正确做法：网关做轻量认证和粗粒度授权，细粒度业务授权放在业务服务，并避免阻塞事件循环。
