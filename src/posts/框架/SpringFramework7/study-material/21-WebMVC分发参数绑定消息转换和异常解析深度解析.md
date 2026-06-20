---
title: "Spring Framework 7 学习资料：Web MVC 分发、参数绑定、消息转换和异常解析深度解析"
date: 2026-06-20
description: "重点： Controller 方法调用只是中间一小段，前后还有匹配、拦截、绑定、转换、异常解析。"
tags:
  - "框架"
  - "SpringFramework7"
  - "深度解析"
category: "框架"
---

# Spring Framework 7 学习资料：Web MVC 分发、参数绑定、消息转换和异常解析深度解析

[返回索引](../SpringFramework7学习资料.md)

## 学习目标

- 能把一次 MVC 请求讲到核心组件协作级别。
- 掌握 HandlerMapping、HandlerAdapter、ArgumentResolver、ReturnValueHandler、MessageConverter。
- 能系统定位 404、400、415、406、500。

## DispatcherServlet 分发主线

```text
doDispatch(request, response)
  -> checkMultipart()
  -> getHandler()
      HandlerMapping 返回 HandlerExecutionChain
  -> getHandlerAdapter()
  -> applyPreHandle()
  -> ha.handle()
      RequestMappingHandlerAdapter 调用 Controller
  -> applyDefaultViewName()
  -> applyPostHandle()
  -> processDispatchResult()
      渲染或写响应，处理异常
  -> triggerAfterCompletion()
```

> **重点：** Controller 方法调用只是中间一小段，前后还有匹配、拦截、绑定、转换、异常解析。

## HandlerMapping 如何匹配

`RequestMappingHandlerMapping` 会在启动时扫描 Controller，把路径、HTTP 方法、consumes、produces、params、headers 等条件注册成映射。

请求到来时按条件匹配：

```text
路径匹配
  -> HTTP method 匹配
  -> params/headers 匹配
  -> consumes 匹配 Content-Type
  -> produces 匹配 Accept
  -> 多候选时选择最具体匹配
```

| 状态码 | 可能阶段 |
| --- | --- |
| 404 | 没有路径匹配或 Handler 不存在 |
| 405 | 路径存在但 HTTP 方法不匹配 |
| 415 | Content-Type 不符合 consumes 或无转换器 |
| 406 | Accept 无法满足 produces |

## 参数解析器

Controller 参数不是反射硬塞进去的，而是由一组 `HandlerMethodArgumentResolver` 逐个判断是否支持。

| 参数 | 解析器方向 |
| --- | --- |
| `@PathVariable` | 路径变量 |
| `@RequestParam` | 查询参数、表单参数 |
| `@RequestBody` | 消息转换器读取 body |
| `@ModelAttribute` | 数据绑定 |
| `Principal` | 安全上下文 |
| `HttpServletRequest` | 原生 Servlet 对象 |

> **难点：** 参数绑定失败、类型转换失败、校验失败是不同问题，异常类型也不同。

## 消息转换器选择

`HttpMessageConverter` 根据目标类型和媒体类型决定能否读写：

```text
读取请求体：
  Content-Type + Java 参数类型 -> canRead()

写响应体：
  Accept + Java 返回类型 -> canWrite()
```

JSON 请求失败常见原因：

- 请求头没有 `Content-Type: application/json`。
- JSON 结构和 DTO 不匹配。
- 缺少 JSON 转换器依赖。
- DTO 构造器、record、字段可见性不满足序列化规则。

## 返回值处理

`HandlerMethodReturnValueHandler` 决定 Controller 返回值怎么处理：

- `ResponseEntity`：状态码、头、body 都可控。
- `@ResponseBody` 或 `@RestController`：写 body。
- `String`：可能是视图名，也可能是 body，取决于注解。
- 异步类型：进入异步处理流程。

## 异常解析顺序

异常可能由以下组件处理：

- `@ExceptionHandler`。
- `@ControllerAdvice`。
- `ResponseStatusExceptionResolver`。
- `DefaultHandlerExceptionResolver`。

> **易错：** 全局异常处理器捕获 `Exception` 后一律返回 200，会破坏 HTTP 语义和监控。

## 排障剧本

### 404

1. Controller 是否注册。
2. 请求路径是否包含 context path。
3. HTTP 方法是否正确。
4. 类级别和方法级别路径组合是否正确。
5. 是否被网关重写。

### 400

1. 查询参数是否缺失。
2. 类型转换是否失败。
3. JSON 是否合法。
4. Bean Validation 是否失败。

### 415

1. Content-Type 是否正确。
2. `consumes` 是否限制。
3. 是否有可读 MessageConverter。

## 练习

1. 写一个接口，同时设置 `consumes` 和 `produces`，用不同请求头测试 415 和 406。
2. 自定义 `HandlerMethodArgumentResolver`，解析 `@CurrentUser` 参数。
3. 自定义 `ResponseBodyAdvice`，给响应增加 traceId。

## 验收

- 能画出 MVC 从请求到响应的完整链路。
- 能根据状态码定位到匹配、绑定、转换或异常处理阶段。
- 能写自定义参数解析器并解释注册位置。
