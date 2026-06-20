---
title: "Spring Framework 7 学习资料：WebFlux 响应式编程"
date: 2026-06-20
description: "WebFlux 是 Spring 的响应式 Web 框架，基于 Reactive Streams 和 Reactor。它适合高并发长连接、流式响应、IO 密集且依赖链路也支持非阻塞的场景。"
tags:
  - "框架"
  - "SpringFramework7"
category: "框架"
---

# Spring Framework 7 学习资料：WebFlux 响应式编程

[返回索引](../SpringFramework7学习资料.md)

## 学习目标

- 理解 WebFlux 和 MVC 的模型差异。
- 掌握 Mono、Flux、背压、非阻塞边界。
- 知道什么时候不该使用 WebFlux。

## 理论导读

WebFlux 是 Spring 的响应式 Web 框架，基于 Reactive Streams 和 Reactor。它适合高并发长连接、流式响应、IO 密集且依赖链路也支持非阻塞的场景。

WebFlux 不是 MVC 的“高级替代品”。如果数据库、远程调用、文件 IO 都是阻塞式，强行使用 WebFlux 可能更难调试，性能也未必更好。

## 核心类型

| 类型 | 含义 |
| --- | --- |
| `Mono<T>` | 0 或 1 个异步结果 |
| `Flux<T>` | 0 到 N 个异步结果流 |
| Scheduler | 控制执行线程 |
| Backpressure | 下游按能力请求数据 |

## 例子：响应式 Controller

```java
@RestController
@RequestMapping("/api/events")
class EventController {
    private final EventService eventService;

    EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping("/{id}")
    Mono<EventResponse> detail(@PathVariable String id) {
        return eventService.findById(id);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    Flux<EventResponse> stream() {
        return eventService.streamEvents();
    }
}
```

## 非阻塞边界

WebFlux 应尽量配合非阻塞客户端和驱动：

- WebClient，而不是阻塞式 RestTemplate。
- R2DBC，而不是 JDBC。
- 响应式 Redis、MongoDB 客户端。

> **易错：** 在 WebFlux handler 中直接调用阻塞 JDBC，会占用事件循环线程，导致吞吐下降和延迟抖动。

## MVC 与 WebFlux 对比

| 对比项 | Spring MVC | Spring WebFlux |
| --- | --- | --- |
| 编程模型 | Servlet 阻塞模型 | 响应式非阻塞模型 |
| 常见返回 | 对象、ResponseEntity | Mono、Flux |
| 适用场景 | 大多数传统 CRUD 和业务系统 | 流式、高并发 IO、响应式链路 |
| 调试难度 | 较低 | 较高 |
| 数据库配合 | JDBC/JPA/MyBatis | R2DBC 等非阻塞驱动 |

## 背压心智模型

背压可以理解为“消费者告诉生产者自己还能吃多少”。没有背压时，上游无限推数据会压垮下游内存或线程池；有背压时，数据流按下游请求节奏推进。

## 练习

1. 写一个返回 `Mono<User>` 的查询接口。
2. 写一个 SSE 流式接口，每秒推送一次事件。
3. 故意在 WebFlux 中调用 `Thread.sleep`，观察并发请求延迟。

## 验收

- 能解释 Mono 和 Flux 的差异。
- 能判断 MVC 和 WebFlux 的选型边界。
- 能指出阻塞调用对 WebFlux 的破坏。

## 难点

WebFlux 难在整条调用链都要尊重响应式模型。只有入口是 WebFlux，而中间全是阻塞调用，收益很有限。
