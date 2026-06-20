---
title: "Spring Boot 学习资料：测试体系和 Testcontainers"
date: 2026-06-20
description: "Boot 测试的核心不是“所有测试都启动 Spring”。测试加载的上下文越大，越接近真实环境，也越慢、越脆弱。好的测试体系应该像金字塔：大量快速单元测试，中等数量切片测试，少量但关键的完整集成测试。对于数据库、Redis、Kafka 这类…"
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 学习资料：测试体系和 Testcontainers

[返回索引](../SpringBoot学习资料.md)

## 学习目标

- 能按风险选择单元测试、切片测试、集成测试和端到端测试。
- 掌握 `@WebMvcTest`、`@DataJpaTest`、`@SpringBootTest`、MockMvc、Testcontainers 和测试配置隔离。
- 理解 Spring 测试上下文缓存、Mock 使用边界、数据库容器生命周期和 CI 稳定性。
- 能写出能发现真实装配问题、真实 SQL 问题、迁移脚本问题的测试。

## 理论导读

Boot 测试的核心不是“所有测试都启动 Spring”。测试加载的上下文越大，越接近真实环境，也越慢、越脆弱。好的测试体系应该像金字塔：大量快速单元测试，中等数量切片测试，少量但关键的完整集成测试。对于数据库、Redis、Kafka 这类外部依赖，Testcontainers 可以提供接近生产的真实服务，避免 H2 和本地环境造成误判。

测试不是为了提高覆盖率数字，而是为了降低变更风险。Controller 测试要发现参数校验和错误响应问题；Repository 测试要发现 SQL、映射、迁移脚本问题；Service 测试要发现业务规则和事务边界问题；完整集成测试要发现自动配置和跨层协作问题。

## 核心心智模型

```text
单元测试：一个类，最快，定位最清晰
切片测试：一层框架集成，例如 MVC/JPA
集成测试：多个 Spring Bean 和真实依赖协作
端到端测试：从 HTTP 到数据库的完整流程
```

测试范围越大，越能发现装配问题，但反馈越慢。不要用最大范围测试替代所有小范围测试。

## 知识点详解

### 1. 测试类型选择

| 类型 | 工具 | 适合验证 | 不适合 |
| --- | --- | --- | --- |
| 单元测试 | JUnit、Mockito | 纯业务规则、边界条件 | Spring 装配 |
| MVC 切片 | `@WebMvcTest`、MockMvc | 路由、参数绑定、校验、异常处理 | Service/Repository 真实协作 |
| JPA 切片 | `@DataJpaTest` | Entity 映射、Repository、SQL | Web 和完整业务流程 |
| 完整集成 | `@SpringBootTest` | 自动配置、事务、跨层流程 | 大量细粒度用例 |
| 外部依赖 | Testcontainers | PostgreSQL、Redis、Kafka 真实行为 | 纯逻辑快速反馈 |

### 2. MVC 切片测试

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    OrderService orderService;

    @Test
    void shouldReturnBadRequestWhenQuantityInvalid() throws Exception {
        mockMvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"p1\",\"quantity\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }
}
```

MVC 切片通常 mock Service，因为它关注 Web 层行为。不要在 `@WebMvcTest` 中强行加载数据库。

### 3. JPA 切片测试

```java
@DataJpaTest
class OrderRepositoryTest {
    @Autowired
    OrderRepository repository;

    @Test
    void shouldFindByStatus() {
        repository.save(Order.create("p1", 1));
        List<Order> orders = repository.findByStatus(OrderStatus.CREATED);
        assertThat(orders).hasSize(1);
    }
}
```

如果生产用 PostgreSQL，Repository 测试尽量也用 PostgreSQL Testcontainer，而不是 H2。H2 的 SQL 方言、锁行为、JSON 类型、时间类型和索引行为都可能与 PostgreSQL 不同。

### 4. Testcontainers 和 `@ServiceConnection`

```java
@SpringBootTest
@Testcontainers
class OrderIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @Autowired
    OrderService orderService;

    @Test
    void shouldCreateOrder() {
        OrderResponse response = orderService.create("key-1", new CreateOrderRequest("p1", 1));
        assertThat(response.id()).isNotNull();
    }
}
```

Testcontainers 的价值：

- 使用真实数据库版本。
- 验证 Flyway/Liquibase 脚本。
- 避免开发机共享数据库污染。
- CI 环境更可重复。

成本：

- 需要 Docker。
- 启动慢于内存数据库。
- CI 需要配置容器运行能力。

### 5. Spring 测试上下文缓存

Spring 会缓存测试上下文。相同配置的测试可以复用上下文，速度更快；不同 Profile、不同属性、不同 Mock Bean 可能导致新建上下文。

导致测试变慢的常见做法：

- 每个测试类都随意改 `@SpringBootTest(properties=...)`。
- 过度使用 `@DirtiesContext`。
- 每个测试类使用不同 Mock 组合。
- 把所有测试都写成完整集成测试。

优化思路：

- 按测试类型分层。
- 复用统一测试配置。
- 少用 `@DirtiesContext`。
- 集成测试集中覆盖关键路径。

### 6. Mock 的边界

Mock 适合隔离外部依赖和复杂协作者，但过度 Mock 会让测试只验证“你怎么写”，而不是“系统是否真的能工作”。

合理使用：

- Controller 测试 mock Service。
- Service 单元测试 mock Repository 或外部网关。
- 集成测试尽量少 mock，使用真实 Spring Bean。
- 第三方 HTTP 可以用 MockWebServer/WireMock。
- 数据库、Kafka、Redis 用 Testcontainers 更接近真实。

### 7. 测试配置隔离

测试必须防止误连生产：

```yaml
spring:
  profiles:
    active: test
```

更稳妥的是在测试启动时明确覆盖 datasource，或使用 Testcontainers 自动注入。CI 中不要依赖开发机环境变量。

### 8. CI 稳定性

CI 中常见失败：

- Docker 不可用。
- 容器镜像拉取慢。
- 端口冲突。
- 测试顺序依赖。
- 本地时区和 CI 时区不同。
- 异步任务未等待完成。
- 数据库状态未清理。

解决：

- 使用随机端口。
- 每个测试用例清理数据或事务回滚。
- 固定时钟 `Clock`。
- 明确等待异步结果。
- 为容器配置复用策略或预拉镜像。

## 例子：完整测试组合

```text
OrderServiceTest
  -> 纯业务规则：库存不足、状态流转

OrderControllerTest
  -> 400、404、201、错误响应格式

OrderRepositoryTest
  -> SQL、唯一约束、分页、索引相关查询

OrderIntegrationTest
  -> HTTP -> Service -> Transaction -> PostgreSQL -> Flyway
```

## 练习

1. 给订单 Controller 写 `@WebMvcTest`，覆盖校验和异常处理。
2. 给 Repository 写 PostgreSQL Testcontainer 测试，验证唯一约束。
3. 给 Service 写单元测试，覆盖业务状态机。
4. 写一个完整集成测试，验证 Flyway、事务和真实 SQL。
5. 故意把一个字段迁移脚本写错，确认测试能失败。

## 验收

- 测试不依赖本地固定数据库。
- Controller 测试能覆盖参数绑定、校验和错误响应。
- Repository 测试能发现生产数据库方言问题。
- 集成测试能验证迁移脚本和事务行为。
- CI 中测试顺序随机也能稳定通过。

## 重点

- 按风险选择最小必要测试范围。
- 数据访问测试尽量使用真实数据库容器。
- 测试配置必须隔离生产环境。
- 上下文缓存是 Boot 测试速度的关键。

## 难点

- Mock 过度会掩盖真实装配问题。
- Testcontainers 提升真实性，但带来容器和 CI 成本。
- 异步、时间、外部依赖和数据库状态是测试不稳定的主要来源。

## 易错

> **易错：** 所有测试都加 `@SpringBootTest`。
>
> 正确做法：Controller 用切片，Repository 用切片或容器，跨层流程再用完整集成测试。

> **易错：** 用 H2 证明 PostgreSQL SQL 没问题。
>
> 正确做法：关键 Repository 和迁移脚本使用与生产一致的数据库版本测试。

