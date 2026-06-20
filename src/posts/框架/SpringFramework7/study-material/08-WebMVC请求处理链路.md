---
title: "Spring Framework 7 学习资料：Web MVC 请求处理链路"
date: 2026-06-20
description: "Spring MVC 是基于 Servlet 的阻塞式 Web 框架。它把一个 HTTP 请求拆成多个阶段：统一入口、查找处理器、适配调用、解析参数、执行 Controller、处理返回值、消息转换、异常处理。"
tags:
  - "框架"
  - "SpringFramework7"
category: "框架"
---

# Spring Framework 7 学习资料：Web MVC 请求处理链路

[返回索引](../SpringFramework7学习资料.md)

## 学习目标

- 掌握 Spring MVC 请求处理全过程。
- 理解 HandlerMapping、HandlerAdapter、参数解析、返回值处理。
- 会编写 REST API、统一异常处理和参数校验。

## 理论导读

Spring MVC 是基于 Servlet 的阻塞式 Web 框架。它把一个 HTTP 请求拆成多个阶段：统一入口、查找处理器、适配调用、解析参数、执行 Controller、处理返回值、消息转换、异常处理。

核心入口是 `DispatcherServlet`。它像前台调度员，不直接处理所有业务，而是协调 MVC 组件完成请求。

## 请求链路

```text
HTTP 请求
  -> Filter
  -> DispatcherServlet
  -> HandlerMapping 找 Controller 方法
  -> HandlerInterceptor preHandle
  -> HandlerAdapter 调用方法
  -> HandlerMethodArgumentResolver 解析参数
  -> Controller 方法
  -> HandlerMethodReturnValueHandler 处理返回值
  -> HttpMessageConverter 转 JSON
  -> HandlerInterceptor postHandle/afterCompletion
  -> HTTP 响应
```

## REST Controller 示例

```java
@RestController
@RequestMapping("/api/orders")
class OrderController {
    private final OrderService orderService;

    OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        OrderResponse response = orderService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    OrderResponse detail(@PathVariable long id) {
        return orderService.detail(id);
    }
}
```

## 参数来源

| 注解 | 来源 |
| --- | --- |
| `@PathVariable` | URL 路径变量 |
| `@RequestParam` | 查询参数或表单参数 |
| `@RequestHeader` | 请求头 |
| `@CookieValue` | Cookie |
| `@RequestBody` | 请求体 |
| `@ModelAttribute` | 表单对象或模型属性 |

## 消息转换

`HttpMessageConverter` 负责 Java 对象和 HTTP body 的转换。REST API 中最常见的是 JSON 转换。

> **易错：** Controller 返回对象能变成 JSON，不是因为 Java 自动会，而是因为 MVC 找到了合适的消息转换器。

## 统一异常处理

```java
@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<ApiError> notFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ApiError("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest()
            .body(new ApiError("VALIDATION_FAILED", "invalid request"));
    }
}
```

## Filter 与 Interceptor

| 对比项 | Filter | HandlerInterceptor |
| --- | --- | --- |
| 标准 | Servlet 标准 | Spring MVC |
| 位置 | DispatcherServlet 前后 | Handler 调用前后 |
| 能否拿到 Handler | 不直接知道 | 可以拿到 |
| 常见用途 | 编码、CORS、安全链路 | 登录态、审计、接口耗时 |

## 练习

1. 写订单 REST API：创建、详情、分页查询。
2. 增加请求参数校验和统一错误响应。
3. 写一个 Interceptor，记录接口耗时和请求 ID。

## 验收

- 能从请求入口追踪到 JSON 响应。
- 能解释 404、415、400、500 常见原因。
- 能区分 Filter、Interceptor、ControllerAdvice 的职责。

## 难点

MVC 排障要沿请求链路逐段定位：请求是否进入容器、路径是否匹配、参数是否能解析、消息转换器是否存在、异常是否被正确处理。
