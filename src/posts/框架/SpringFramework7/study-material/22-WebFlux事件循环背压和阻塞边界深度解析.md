---
title: "Spring Framework 7 学习资料：WebFlux 事件循环、背压和阻塞边界深度解析"
date: 2026-06-20
description: "WebFlux 的价值来自非阻塞 IO 和背压协议，而不是把返回值包成 Mono 或 Flux。"
tags:
  - "框架"
  - "SpringFramework7"
  - "深度解析"
category: "框架"
---

# Spring Framework 7 学习资料：WebFlux 事件循环、背压和阻塞边界深度解析

[返回索引](../SpringFramework7学习资料.md)

## 学习目标

- 理解 WebFlux 的线程模型和响应式边界。
- 掌握背压、冷流、热流、调度器、阻塞隔离。
- 能判断 WebFlux 是否适合当前业务。

## 响应式不是异步语法糖

WebFlux 的价值来自非阻塞 IO 和背压协议，而不是把返回值包成 `Mono` 或 `Flux`。

```text
请求进入事件循环线程
  -> 组装响应式链
  -> 遇到非阻塞 IO 注册回调
  -> 线程释放去处理其他请求
  -> IO 就绪后继续推进链路
```

如果链路中执行阻塞 JDBC、`Thread.sleep()`、大文件同步读写，事件循环线程就会被占住，模型优势会消失。

## Mono 和 Flux 心智模型

| 类型 | 含义 | 类比 |
| --- | --- | --- |
| `Mono<T>` | 0 或 1 个结果 | 一次异步查询 |
| `Flux<T>` | 0 到 N 个结果 | 数据流、事件流 |

冷流通常在订阅时才开始执行。没有订阅，链路可能不会真正运行。

## 背压

背压是下游向上游表达处理能力：

```text
Subscriber request(10)
  -> Publisher 最多发送 10 个元素
  -> Subscriber 处理完再继续 request(n)
```

没有背压时，上游推送过快会造成内存堆积。WebFlux 基于 Reactive Streams，让消费者能控制节奏。

## 线程调度

常见调度器：

| 调度器 | 适合场景 |
| --- | --- |
| event loop | 非阻塞网络 IO |
| boundedElastic | 有边界的阻塞任务隔离 |
| parallel | CPU 密集小任务 |
| single | 单线程顺序任务 |

阻塞调用必须隔离：

```java
Mono.fromCallable(() -> blockingRepository.findById(id))
    .subscribeOn(Schedulers.boundedElastic());
```

> **易错：** 隔离阻塞只是止损，不等于 WebFlux 最佳实践。大量阻塞业务优先选 MVC。

## WebClient 调用链

```java
Mono<User> user = webClient.get()
    .uri("/users/{id}", id)
    .retrieve()
    .bodyToMono(User.class)
    .timeout(Duration.ofSeconds(2))
    .retryWhen(Retry.backoff(2, Duration.ofMillis(100)));
```

重试要谨慎：非幂等请求重试可能造成重复写入。需要幂等键、业务去重或只对安全读请求重试。

## 常见错误

| 错误 | 后果 |
| --- | --- |
| 在 event loop 上阻塞 | 少量请求拖慢大量连接 |
| 滥用 `block()` | 破坏响应式链路，可能死锁 |
| 忽略超时 | 下游慢导致资源堆积 |
| 无限重试 | 放大故障 |
| 响应式和 ThreadLocal 混用 | 上下文丢失 |

## 适用边界

适合 WebFlux：

- SSE、WebSocket、流式响应。
- 高并发 IO 且下游也是非阻塞客户端。
- 需要背压控制的数据流。

不优先使用 WebFlux：

- 传统 CRUD + JDBC/JPA/MyBatis。
- 团队缺少响应式调试经验。
- 业务主要是 CPU 密集计算。

## 练习

1. 写 SSE 接口，每秒推送一条事件。
2. 用 WebClient 调用远程接口，配置 timeout 和有限重试。
3. 在链路中加入 `Thread.sleep()`，压测观察延迟变化。
4. 用 `boundedElastic` 隔离阻塞调用，再比较结果。

## 验收

- 能解释背压和非阻塞 IO 的关系。
- 能判断 `block()` 和阻塞 JDBC 的风险。
- 能给出 MVC 与 WebFlux 的选型理由。
