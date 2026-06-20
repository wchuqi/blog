---
title: "Java 学习资料：Web 开发、HTTP、Servlet 和 Spring 生态"
date: 2026-06-20
description: "完成本章后，你应该能："
tags:
  - "开发语言"
  - "Java"
category: "开发语言"
---

# Java 学习资料：Web 开发、HTTP、Servlet 和 Spring 生态

[返回索引](../Java学习资料.md)

## 学习目标

完成本章后，你应该能：

- 理解 HTTP 请求响应模型。
- 知道 Servlet 和 Filter 的基本职责。
- 理解 Spring / Spring Boot 的核心思想。
- 构建一个简单 REST API。
- 掌握参数校验、异常处理、日志和分层结构。

## 理论导读：Web 应用是在请求进入和响应返回之间编排业务

Java Web 开发的主线是一条请求处理链：客户端发出 HTTP 请求，服务器解析 method、URL、header 和 body，框架把请求路由到 Controller，业务服务执行用例，仓库访问数据库，最后结果被序列化成 JSON 并带着状态码返回。Servlet、Filter、Spring MVC、Spring Boot 都是在这条链上承担不同职责。

HTTP 是应用对外的协议边界。GET、POST、PUT、PATCH、DELETE 表达操作语义，状态码表达处理结果，Header 携带认证、内容类型、追踪标识等上下文，Body 承载 JSON 或表单数据。Controller 不应该塞满业务细节，它更像入口翻译器：把 HTTP 输入转换成应用请求，把应用结果转换成 HTTP 响应。

Spring 的核心价值是对象协作管理。IoC / DI 把对象创建和依赖组装交给容器，让业务类更专注于职责；AOP 和代理让事务、日志、安全等横切逻辑包在方法调用外面；Spring Boot 则用自动配置降低启动成本。但这些便利也有边界，例如事务依赖代理，同类自调用可能绕过代理，配置和 Bean 生命周期错误会影响整个应用。

## 一、HTTP 基础

请求包括：

- Method
- URL
- Header
- Body

常见方法：

| 方法 | 语义 |
| --- | --- |
| GET | 查询 |
| POST | 创建或提交 |
| PUT | 整体更新 |
| PATCH | 部分更新 |
| DELETE | 删除 |

常见状态码：

| 状态码 | 含义 |
| --- | --- |
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 成功但无响应体 |
| 400 | 请求错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 不存在 |
| 409 | 冲突 |
| 500 | 服务端错误 |

## 二、JSON

Java 常用 JSON 库：

- Jackson
- Gson
- JSON-B

Jackson 示例：

```java
ObjectMapper mapper = new ObjectMapper();
String json = mapper.writeValueAsString(new UserDto(1, "Alice"));
UserDto user = mapper.readValue(json, UserDto.class);
```

record 很适合 DTO：

```java
public record UserDto(long id, String name) {}
```

## 三、Servlet

Servlet 是 Java Web 基础规范。

```java
public class HelloServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.getWriter().write("hello");
    }
}
```

Filter：

```java
public class LogFilter implements Filter {
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        chain.doFilter(request, response);
    }
}
```

## 四、Spring 核心思想

Spring 核心：

- IoC / DI
- AOP
- 事务管理
- 数据访问抽象
- Web MVC
- 配置管理

DI 示例：

```java
@Service
public class UserService {
    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }
}
```

> **重点：** 推荐构造器注入，避免字段注入。

## 五、Spring Boot REST API

```java
@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public UserDto findById(@PathVariable long id) {
        return service.findById(id);
    }
}
```

## 六、分层结构

常见分层：

```text
controller -> application/service -> domain -> repository -> database
```

建议：

- Controller 处理 HTTP。
- Service 表达用例。
- Domain 表达业务规则。
- Repository 处理持久化。

## 七、参数校验

```java
public record CreateUserRequest(
        @NotBlank String name,
        @Email String email
) {}
```

```java
@PostMapping
public UserDto create(@Valid @RequestBody CreateUserRequest request) {
    return service.create(request);
}
```

## 八、统一异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public ErrorResponse handle(BusinessException e) {
        return new ErrorResponse(e.code(), e.getMessage());
    }
}
```

## 九、事务

```java
@Transactional
public void transfer(long from, long to, BigDecimal amount) {
    accountRepository.debit(from, amount);
    accountRepository.credit(to, amount);
}
```

注意：

- 事务边界。
- 传播行为。
- 隔离级别。
- 自调用导致事务不生效。

> **易错：** Spring 事务通常基于代理，同类内部方法自调用可能绕过代理。

## 十、配置

`application.yml`：

```yaml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/app
```

建议：

- 不提交生产密钥。
- 使用环境变量或密钥管理。
- 区分 dev/test/prod。

## 十一、可观测性

关注：

- 日志
- 指标
- trace
- health check
- profiling

Spring Boot 常用：

- Actuator
- Micrometer
- OpenTelemetry

## 练习

构建用户 API：

- `POST /users`
- `GET /users/{id}`
- `PUT /users/{id}`
- `DELETE /users/{id}`
- 参数校验。
- 统一异常处理。
- 单元测试和集成测试。

## 验收

- 能解释 HTTP 方法和状态码。
- 能说明 Servlet、Filter、Controller。
- 能解释 Spring IoC。
- 能构建 REST API。
- 能说明 Spring 事务常见失效原因。
