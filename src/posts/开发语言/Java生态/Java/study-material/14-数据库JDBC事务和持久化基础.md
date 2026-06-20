---
title: "Java 学习资料：数据库、JDBC、事务和持久化基础"
date: 2026-06-20
description: "完成本章后，你应该能："
tags:
  - "开发语言"
  - "Java"
category: "开发语言"
---

# Java 学习资料：数据库、JDBC、事务和持久化基础

[返回索引](../Java学习资料.md)

## 学习目标

完成本章后，你应该能：

- 使用 JDBC 执行查询和更新。
- 理解连接池和资源释放。
- 掌握事务 ACID、隔离级别和常见异常。
- 知道 SQL 注入防护。
- 理解 ORM 的价值和风险。

## 理论导读：持久化是在对象世界和关系世界之间搭桥

Java 程序里的对象活在内存中，数据库里的数据活在表、行、列、索引和事务里。JDBC、连接池、事务、ORM 解决的都是同一个问题：如何让内存中的业务操作可靠地落到数据库，并在失败、并发、网络延迟、连接成本、SQL 注入等现实条件下仍然保持正确。它不是简单的“调用一个查询方法”，而是跨系统边界的一次协作。

JDBC 是最直接的桥：`Connection` 表示一条数据库连接，`PreparedStatement` 表示带参数的 SQL，`ResultSet` 表示查询结果游标。连接很昂贵，所以真实项目用连接池复用连接；SQL 参数来自外部时必须绑定参数，而不是字符串拼接；结果集、语句和连接都需要及时关闭，否则桥上的资源会被耗尽。

事务像把多步数据库操作装进一个不可拆开的业务动作里。转账不是“扣款成功”和“加款失败”两个独立事件，而应该是要么都成功、要么都回滚。隔离级别决定并发事务彼此能看到什么，ORM 则在对象和表之间自动做大量映射工作，但它不会替代 SQL、索引、锁和事务边界的理解。

## 一、JDBC 基础

```java
String sql = "select id, name from users where id = ?";

try (Connection connection = dataSource.getConnection();
     PreparedStatement statement = connection.prepareStatement(sql)) {
    statement.setLong(1, id);
    try (ResultSet rs = statement.executeQuery()) {
        if (rs.next()) {
            return new User(rs.getLong("id"), rs.getString("name"));
        }
        return null;
    }
}
```

> **重点：** 使用 `PreparedStatement`，不要拼接 SQL 参数。

## 二、资源释放

JDBC 资源：

- Connection
- Statement / PreparedStatement
- ResultSet

都应正确关闭。使用 try-with-resources。

## 三、连接池

每次创建数据库连接成本高，实际项目使用连接池。

常见连接池：

- HikariCP
- Druid
- c3p0，较旧

关键参数：

- 最大连接数
- 最小空闲连接
- 连接超时
- 空闲超时
- 最大生命周期

> **易错：** 连接池不是越大越好，过大可能压垮数据库。

## 四、事务 ACID

| 特性 | 含义 |
| --- | --- |
| Atomicity | 原子性 |
| Consistency | 一致性 |
| Isolation | 隔离性 |
| Durability | 持久性 |

JDBC 事务：

```java
connection.setAutoCommit(false);
try {
    updateA(connection);
    updateB(connection);
    connection.commit();
} catch (Exception e) {
    connection.rollback();
    throw e;
}
```

## 五、隔离级别

| 隔离级别 | 可能问题 |
| --- | --- |
| READ UNCOMMITTED | 脏读、不可重复读、幻读 |
| READ COMMITTED | 不可重复读、幻读 |
| REPEATABLE READ | 幻读，取决于数据库实现 |
| SERIALIZABLE | 性能成本最高 |

> **重点：** Java 侧理解隔离级别时必须结合具体数据库，例如 MySQL、PostgreSQL 行为不同。

## 六、SQL 注入

坏例子：

```java
String sql = "select * from users where name = '" + name + "'";
```

正确：

```java
PreparedStatement statement = connection.prepareStatement(
        "select * from users where name = ?"
);
statement.setString(1, name);
```

## 七、批处理

```java
try (PreparedStatement statement = connection.prepareStatement(
        "insert into users(name) values (?)")) {
    for (String name : names) {
        statement.setString(1, name);
        statement.addBatch();
    }
    statement.executeBatch();
}
```

## 八、ORM 基础

ORM 解决：

- 对象和表映射。
- CRUD 简化。
- 关系映射。
- 延迟加载。
- 脏检查。

常见：

- JPA
- Hibernate
- MyBatis，严格说不是完整 ORM，更接近 SQL Mapper

> **易错：** ORM 不能替代 SQL 能力。复杂查询、索引、事务和锁仍需要理解数据库。

## 九、N+1 问题

场景：

1. 查询订单列表。
2. 每个订单再查一次用户。

结果：1 + N 次查询。

解决：

- join fetch
- 批量查询
- DTO 查询
- 合理配置 fetch strategy

## 十、事务边界

事务应放在业务用例边界，而不是 DAO 单个方法里随意开启。

注意：

- 事务过大影响并发。
- 事务过小无法保证一致性。
- 网络调用不应长时间占用数据库事务。

## 练习

实现用户仓库：

- `createUser`
- `findById`
- `updateName`
- `deleteById`
- 使用 PreparedStatement。
- 使用事务完成转账场景。

## 验收

- 能写 JDBC 查询。
- 能说明连接池作用。
- 能解释 ACID。
- 能说明 SQL 注入防护。
- 能解释 N+1 问题。
