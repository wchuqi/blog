---
title: "Spring Framework 7 学习资料：数据访问异常体系和 JDBC"
date: 2026-06-20
description: "JDBC 原生 API 样板代码多：获取连接、创建语句、绑定参数、处理结果集、关闭资源、转换异常。Spring JDBC 用模板方法把固定流程封装起来，让开发者关注 SQL 和映射逻辑。"
tags:
  - "框架"
  - "SpringFramework7"
category: "框架"
---

# Spring Framework 7 学习资料：数据访问异常体系和 JDBC

[返回索引](../SpringFramework7学习资料.md)

## 学习目标

- 理解 Spring JDBC 的价值。
- 掌握 `JdbcTemplate`、事务配合、异常转换。
- 能判断什么时候使用 JDBC、JPA、MyBatis 或 Spring Data。

## 理论导读

JDBC 原生 API 样板代码多：获取连接、创建语句、绑定参数、处理结果集、关闭资源、转换异常。Spring JDBC 用模板方法把固定流程封装起来，让开发者关注 SQL 和映射逻辑。

Spring 的数据访问异常体系把数据库厂商相关异常转换为统一的 `DataAccessException` 层级，便于上层处理。

## JdbcTemplate 示例

```java
@Repository
class OrderRepository {
    private final JdbcTemplate jdbcTemplate;

    OrderRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    Order findById(long id) {
        return jdbcTemplate.queryForObject(
            "select id, order_no, amount from orders where id = ?",
            (rs, rowNum) -> new Order(
                rs.getLong("id"),
                rs.getString("order_no"),
                rs.getBigDecimal("amount")
            ),
            id
        );
    }
}
```

## 异常转换

| 原始问题 | Spring 异常方向 |
| --- | --- |
| 唯一键冲突 | `DuplicateKeyException` |
| 找不到结果 | `EmptyResultDataAccessException` |
| SQL 语法错误 | `BadSqlGrammarException` |
| 连接资源失败 | `DataAccessResourceFailureException` |

> **重点：** `DataAccessException` 是运行时异常。它让数据访问层不必把所有 SQL 异常向业务层泄漏。

## Repository 注解

`@Repository` 不只是语义标识，还参与异常转换。Spring 可以通过后置处理器把持久层异常翻译为统一的数据访问异常。

## 批处理

```java
jdbcTemplate.batchUpdate(
    "insert into orders(order_no, amount) values (?, ?)",
    orders,
    100,
    (ps, order) -> {
        ps.setString(1, order.orderNo());
        ps.setBigDecimal(2, order.amount());
    }
);
```

## 技术选择

| 技术 | 适合场景 |
| --- | --- |
| JdbcTemplate | SQL 明确、轻量、性能可控 |
| JPA | 领域模型和对象关系映射较重 |
| MyBatis | SQL 可控且需要映射配置 |
| Spring Data | 仓储模式、快速开发、多数据源生态 |

## 易错

> **易错：** 在事务方法中使用了另一个没有被同一事务管理器管理的数据源。
>
> 正确做法：确认 `DataSource`、`JdbcTemplate`、`PlatformTransactionManager` 指向同一资源。

> **易错：** 把 SQL 异常吞掉后返回默认值。
>
> 正确做法：区分“查无数据”和“系统错误”，不要用空对象掩盖数据库故障。

## 练习

1. 用 `JdbcTemplate` 实现订单增删改查。
2. 制造唯一键冲突，观察异常类型。
3. 在 `@Transactional` Service 中调用两个 Repository，验证统一提交或回滚。

## 验收

- 能写出安全的参数化 SQL。
- 能解释异常转换的价值。
- 能说明 JDBC 和事务管理器的关系。
