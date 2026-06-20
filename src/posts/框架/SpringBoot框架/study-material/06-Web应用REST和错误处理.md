---
title: "Spring Boot 4 学习资料：Web 应用、REST 和错误处理"
date: 2026-06-20
description: "引入 Web Starter 后，Boot 会根据 classpath 自动配置 Spring MVC、JSON 转换、嵌入式服务器、错误处理、静态资源、国际化、格式化等能力。开发者写 Controller 时，背后已有大量默认 Bean。"
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 4 学习资料：Web 应用、REST 和错误处理

[返回索引](../SpringBoot4学习资料.md)

## 学习目标

- 掌握 Boot Web MVC 自动配置带来的默认能力。
- 会写 REST API、参数校验、统一错误响应。
- 理解嵌入式服务器、Jackson、静态资源和错误处理默认行为。

## 理论导读

引入 Web Starter 后，Boot 会根据 classpath 自动配置 Spring MVC、JSON 转换、嵌入式服务器、错误处理、静态资源、国际化、格式化等能力。开发者写 Controller 时，背后已有大量默认 Bean。

## REST 示例

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
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(orderService.create(request));
    }

    @GetMapping("/{id}")
    OrderResponse detail(@PathVariable long id) {
        return orderService.detail(id);
    }
}
```

## 统一错误响应

```java
@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(OrderNotFoundException.class)
    ResponseEntity<ApiError> notFound(OrderNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ApiError("ORDER_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex) {
        var fields = ex.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .toList();
        return ResponseEntity.badRequest()
            .body(new ApiError("VALIDATION_FAILED", fields.toString()));
    }
}
```

## 常见自动配置能力

| 能力 | 来源 |
| --- | --- |
| 嵌入式服务器 | Web Server 自动配置 |
| DispatcherServlet | MVC 自动配置 |
| JSON | Jackson 自动配置 |
| Validation | Validation Starter |
| 静态资源 | Web Properties |
| 错误页 | Error MVC 自动配置 |

## Web MVC 与 WebFlux

| 场景 | 推荐 |
| --- | --- |
| 传统 CRUD、JDBC、JPA、MyBatis | Web MVC |
| SSE、流式响应、非阻塞链路 | WebFlux |
| 大量阻塞调用 | 不优先 WebFlux |

## 易错

> **易错：** 全局异常处理器把所有异常返回 200。
>
> 正确做法：使用合适 HTTP 状态码，让客户端、网关和监控能正确识别。

> **易错：** API 直接返回 JPA Entity。
>
> 正确做法：使用 DTO，避免懒加载、字段泄漏和序列化循环。

## 练习

1. 实现订单创建、详情、分页接口。
2. 增加 Bean Validation 和统一错误响应。
3. 构造 400、404、409、500，并记录响应体。
4. 修改 Jackson 日期格式，观察 JSON 输出。

## 验收

- 能说明 Web Starter 自动提供了哪些能力。
- 能写生产可用的错误响应。
- 能区分 MVC 和 WebFlux 选型。
