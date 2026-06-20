---
title: "Spring Boot 4 学习资料：测试体系、切片测试和 Testcontainers"
date: 2026-06-20
description: "Spring Boot 测试的目标不是所有测试都启动完整应用，而是用最小必要上下文验证目标行为。Controller 映射用 Web 切片，Repository 用数据切片，跨层流程才用 @SpringBootTest。"
tags:
  - "框架"
  - "SpringBoot框架"
category: "框架"
---

# Spring Boot 4 学习资料：测试体系、切片测试和 Testcontainers

[返回索引](../SpringBoot4学习资料.md)

## 学习目标

- 掌握 Boot 测试注解和测试切片。
- 会选择单元测试、切片测试、集成测试和容器化测试。
- 理解上下文缓存和测试性能。

## 理论导读

Spring Boot 测试的目标不是所有测试都启动完整应用，而是用最小必要上下文验证目标行为。Controller 映射用 Web 切片，Repository 用数据切片，跨层流程才用 `@SpringBootTest`。

## 常用测试类型

| 类型 | 注解 | 适合验证 |
| --- | --- | --- |
| 普通单元测试 | 无 Spring 注解 | 纯业务逻辑 |
| Web MVC 切片 | `@WebMvcTest` | Controller、参数绑定、异常处理 |
| JSON 切片 | `@JsonTest` | Jackson 序列化 |
| JDBC 切片 | `@JdbcTest` | JdbcTemplate、SQL |
| JPA 切片 | `@DataJpaTest` | Entity、Repository |
| 完整集成 | `@SpringBootTest` | 真实装配和跨层流程 |

## Web 切片示例

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired
    MockMvc mockMvc;

    @MockBean
    OrderService orderService;

    @Test
    void createOrder() throws Exception {
        given(orderService.create(any())).willReturn(new OrderResponse(1L));

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"orderNo\":\"A1001\",\"amount\":10.00}"))
            .andExpect(status().isCreated());
    }
}
```

## Testcontainers

```java
@SpringBootTest
@Testcontainers
class OrderRepositoryIT {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

> **重点：** Testcontainers 用真实依赖替代内存模拟，适合验证 SQL、迁移脚本、数据库方言和事务行为。

## 上下文缓存

Spring 测试会缓存 ApplicationContext。配置相同的测试类可以复用上下文；配置频繁变化会导致重复启动。

> **易错：** 到处使用 `@DirtiesContext` 或随机改测试属性，会显著拖慢测试。

## 练习

1. 为 Controller 写 `@WebMvcTest`。
2. 为 JSON DTO 写 `@JsonTest`。
3. 用 Testcontainers + PostgreSQL 验证 Flyway 迁移。
4. 比较 `@WebMvcTest` 和 `@SpringBootTest` 启动耗时。

## 验收

- 能按目标选择测试粒度。
- 能解释测试上下文缓存。
- 能写真实数据库集成测试。
