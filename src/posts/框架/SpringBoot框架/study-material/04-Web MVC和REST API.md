---
title: "Spring Boot 学习资料：Web MVC 和 REST API"
date: 2026-06-20
description: "Spring Boot 的 Web starter 自动配置了内嵌 Servlet 容器、DispatcherServlet、MVC 基础组件、Jackson、校验、错误处理、静态资源和 Actuator Web 暴露。开发者看到的是 @R…"
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 学习资料：Web MVC 和 REST API

[返回索引](../SpringBoot学习资料.md)

## 学习目标

- 能解释一次 HTTP 请求在 Spring MVC 中从 Filter 到 Controller 再到响应序列化的完整链路。
- 掌握路由匹配、参数绑定、校验、消息转换、异常处理、CORS、文件上传和错误响应模型。
- 能设计稳定、可演进、可测试的 REST API，而不是只写能跑通的 Controller。
- 能区分 Spring MVC 与 WebFlux 的运行模型和选型边界。

## 理论导读

Spring Boot 的 Web starter 自动配置了内嵌 Servlet 容器、`DispatcherServlet`、MVC 基础组件、Jackson、校验、错误处理、静态资源和 Actuator Web 暴露。开发者看到的是 `@RestController` 和 `@GetMapping`，但真正执行时经历了过滤器链、安全链、请求映射、方法参数解析、类型转换、校验、业务调用、返回值处理、消息转换和异常处理。

REST API 的质量不只取决于 Controller 代码是否简洁，还取决于协议语义是否稳定：状态码、错误码、幂等性、分页、排序、过滤、版本演进、认证授权、追踪 ID、超时和限流都属于接口设计的一部分。

## 核心心智模型

一次 MVC 请求可以这样理解：

```text
Client
  -> Servlet Container
  -> Filter chain
  -> Spring Security filters
  -> DispatcherServlet
  -> HandlerMapping 选择 Controller 方法
  -> HandlerAdapter 调用方法
  -> ArgumentResolver 解析参数
  -> Validator 校验入参
  -> Service 执行业务
  -> ReturnValueHandler 处理返回值
  -> HttpMessageConverter 序列化响应
  -> Client
```

Spring MVC 的核心不是“URL 调方法”这么简单，而是把 HTTP 协议模型和 Java 方法调用模型连接起来。

## 知识点详解

### 1. Web 自动配置提供了什么

引入 `spring-boot-starter-web` 后，Boot 通常会提供：

- 内嵌 Tomcat 或其他 Servlet 容器。
- `DispatcherServlet`。
- `RequestMappingHandlerMapping` 和 `RequestMappingHandlerAdapter`。
- JSON 消息转换器。
- Bean Validation 集成。
- 静态资源处理。
- 默认错误处理。
- Web MVC 配置扩展点。

如果你声明了某些核心 Bean，默认配置可能退让；如果你使用 `@EnableWebMvc`，可能接管 MVC 配置，导致 Boot 默认配置减少或失效。

> **易错：** 为了改一个小配置直接加 `@EnableWebMvc`。
>
> 正确做法：优先使用属性、`WebMvcConfigurer` 或定制器，只在明确要完全接管 MVC 时使用 `@EnableWebMvc`。

### 2. 路由匹配规则

Controller 方法匹配不只看路径，还看：

- HTTP 方法：GET、POST、PUT、PATCH、DELETE。
- 路径模式：`/orders/{id}`。
- 请求参数条件：`params = "status"`。
- Header 条件：`headers = "X-Tenant"`。
- 请求体媒体类型：`consumes = "application/json"`。
- 响应媒体类型：`produces = "application/json"`。

示例：

```java
@GetMapping(value = "/orders/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
OrderResponse findById(@PathVariable Long id) {
    return orderService.findById(id);
}
```

路由冲突常见原因：

- 两个方法路径过于相似。
- 静态资源路径和 API 路径冲突。
- `consumes` 或 `produces` 不匹配导致 415 或 406。
- 上下文路径 `server.servlet.context-path` 被忽略。
- Security 返回 401/403，被前端误判为路由问题。

### 3. 参数绑定和类型转换

常见参数来源：

| 注解 | 来源 | 例子 |
| --- | --- | --- |
| `@PathVariable` | 路径变量 | `/orders/{id}` |
| `@RequestParam` | 查询参数或表单参数 | `?page=0&size=20` |
| `@RequestBody` | 请求体 | JSON body |
| `@RequestHeader` | Header | `X-Request-Id` |
| `@CookieValue` | Cookie | session id |
| `@ModelAttribute` | 表单或查询对象 | 复杂查询条件 |

```java
public record OrderQuery(
        OrderStatus status,
        @Min(0) int page,
        @Min(1) @Max(200) int size) {
}

@GetMapping("/orders")
PageResponse<OrderResponse> search(@Valid OrderQuery query) {
    return orderService.search(query);
}
```

参数绑定失败和校验失败不是同一种错误：

- 类型转换失败：例如 `id=abc` 绑定到 `Long`。
- JSON 解析失败：请求体不是合法 JSON。
- 校验失败：JSON 合法，但业务约束不满足。

这些错误应统一映射到可预测的错误响应。

### 4. DTO、领域对象和持久化对象要分离

不要直接把 JPA Entity 暴露给外部 API：

- Entity 字段变化会破坏接口兼容性。
- 懒加载字段可能触发序列化异常或 N+1。
- 敏感字段可能泄漏。
- 双向关联可能造成循环序列化。

推荐结构：

```text
Controller
  -> Request DTO
  -> Service
  -> Domain Model / Entity
  -> Response DTO
```

```java
public record CreateOrderRequest(
        @NotBlank String productId,
        @Min(1) int quantity) {
}

public record OrderResponse(
        Long id,
        String productId,
        int quantity,
        String status) {
    static OrderResponse from(Order order) {
        return new OrderResponse(order.id(), order.productId(), order.quantity(), order.status().name());
    }
}
```

### 5. 统一错误响应

错误响应应该稳定，方便客户端处理和日志排查。一个常见结构：

```java
public record ApiError(
        String code,
        String message,
        String traceId,
        List<FieldErrorItem> fields) {
}

public record FieldErrorItem(
        String field,
        String message) {
}
```

```java
@RestControllerAdvice
class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<FieldErrorItem> fields = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldErrorItem(error.getField(), error.getDefaultMessage()))
                .toList();
        return ResponseEntity.badRequest()
                .body(new ApiError("VALIDATION_FAILED", "参数校验失败", request.getHeader("X-Trace-Id"), fields));
    }

    @ExceptionHandler(OrderNotFoundException.class)
    ResponseEntity<ApiError> notFound(OrderNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError("ORDER_NOT_FOUND", ex.getMessage(), request.getHeader("X-Trace-Id"), List.of()));
    }
}
```

HTTP 状态码表达协议层结果，业务错误码表达业务语义。

| 场景 | 状态码 |
| --- | --- |
| 参数格式错误或校验失败 | 400 |
| 未认证 | 401 |
| 已认证但无权限 | 403 |
| 资源不存在 | 404 |
| 媒体类型不支持 | 415 |
| 业务冲突，如重复创建 | 409 |
| 服务端未预期错误 | 500 |

### 6. 幂等性和接口语义

接口设计要考虑重试。网络超时后客户端不知道服务端是否成功，如果接口不幂等，重试可能造成重复下单、重复扣款。

常见做法：

- `GET` 不产生副作用。
- `PUT` 用于整体替换，天然更接近幂等。
- `POST` 创建资源时使用幂等键，例如 `Idempotency-Key`。
- 对支付、下单、库存扣减使用唯一约束和业务流水号防重复。

### 7. JSON 序列化和兼容性

Jackson 会把 Java 对象转换为 JSON。需要统一约定：

- 时间格式和时区。
- 枚举使用 name 还是 code。
- null 字段是否输出。
- 未知字段是否忽略。
- BigDecimal 精度。

不要在每个 Controller 手动处理 JSON；使用属性、Jackson 定制器或模块集中配置。

### 8. CORS、CSRF 和浏览器限制

CORS 是浏览器跨域访问控制；它不是服务端认证。后端允许跨域只代表浏览器可以发请求，不代表请求可信。

CSRF 是跨站请求伪造防护。基于 Cookie Session 的应用通常需要 CSRF；无状态 Bearer Token API 常见做法是禁用 CSRF，但必须保证 Token 不自动附带。

### 9. MVC 和 WebFlux 选型

| 维度 | Spring MVC | WebFlux |
| --- | --- | --- |
| 底层模型 | Servlet 阻塞模型 | Reactive 非阻塞模型 |
| 常见服务器 | Tomcat、Jetty | Reactor Netty，也可运行在部分 Servlet 容器 |
| 数据访问 | JDBC/JPA 常见 | R2DBC 或响应式客户端 |
| 开发成本 | 团队熟悉，生态成熟 | 链式异步，调试和心智负担更高 |
| 适合场景 | 常规 CRUD、管理后台、同步事务 | 大量外部 IO、流式响应、端到端响应式 |

> **重点：** 如果数据库、SDK、团队代码都还是阻塞式，只把 Controller 改成 WebFlux 通常不会带来收益，反而可能因为阻塞事件循环造成性能问题。

## 例子：订单 API

```java
@RestController
@RequestMapping("/orders")
class OrderController {
    private final OrderService orderService;

    OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<OrderResponse> create(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateOrderRequest request) {
        OrderResponse created = orderService.create(idempotencyKey, request);
        URI location = URI.create("/orders/" + created.id());
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/{id}")
    OrderResponse findById(@PathVariable Long id) {
        return orderService.findById(id);
    }
}
```

## 练习

1. 实现订单创建、查询、分页查询 API。
2. 增加统一错误响应，包含 `code`、`message`、`traceId`、`fields`。
3. 给创建接口增加幂等键。
4. 给查询接口增加分页大小上限。
5. 写 `@WebMvcTest` 覆盖 201、400、404、409。

## 验收

- 参数非法返回 400，字段错误可定位。
- 资源不存在返回 404，不泄漏内部异常栈。
- 重复幂等键不会重复创建订单。
- Controller 不直接访问数据库。
- API 返回 DTO，不暴露 Entity。

## 重点

- Spring MVC 是一条完整请求处理管线，不只是注解映射。
- REST API 要把状态码、错误码、幂等性、分页和安全作为协议设计的一部分。
- DTO 分层能保护接口兼容性和数据安全。

## 难点

- 路由匹配条件较多，路径、方法、Header、媒体类型都可能影响结果。
- JSON 序列化可能触发懒加载、循环引用、时区和精度问题。
- CORS、CSRF、认证授权经常被混在一起，需要按安全机制边界拆开。

## 易错

> **易错：** 所有异常都返回 200，然后在 body 里写错误码。
>
> 正确做法：HTTP 状态码表达协议层结果，业务错误码表达业务层细节。

> **易错：** Controller 直接返回 JPA Entity。
>
> 正确做法：使用 Response DTO，明确控制字段、格式和兼容性。

