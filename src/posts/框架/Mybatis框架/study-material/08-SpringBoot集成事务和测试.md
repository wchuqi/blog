---
title: "MyBatis 学习资料：Spring Boot 集成、事务和测试"
date: 2026-06-20
description: "在 Spring Boot 项目中，你通常不直接手动创建 SqlSessionFactory。starter 会根据 DataSource、配置属性、Mapper 扫描自动创建 MyBatis 相关 Bean。Mapper 接口最终是 Sp…"
tags:
  - "框架"
  - "Mybatis框架"
category: "框架"
---

# MyBatis 学习资料：Spring Boot 集成、事务和测试

[返回索引](../Mybatis学习资料.md)

## 学习目标

- 理解 MyBatis 与 Spring Boot 自动配置的集成方式。
- 掌握 SqlSessionFactory、SqlSessionTemplate、MapperScannerConfigurer 的角色。
- 理解 Spring 事务如何管理 MyBatis SqlSession。
- 能写 Mapper 集成测试，并避免误连生产数据库。

## 理论导读

在 Spring Boot 项目中，你通常不直接手动创建 SqlSessionFactory。starter 会根据 DataSource、配置属性、Mapper 扫描自动创建 MyBatis 相关 Bean。Mapper 接口最终是 Spring Bean，业务 Service 注入 Mapper 后参与 Spring 事务。

理解集成机制的关键是：Spring 用 SqlSessionTemplate 包装 SqlSession，使它线程安全，并将 SqlSession 绑定到当前事务。这样同一个事务内的 Mapper 操作使用同一个事务资源。

## 核心组件

| 组件 | 作用 |
| --- | --- |
| SqlSessionFactory | 创建 SqlSession |
| SqlSessionTemplate | Spring 管理的线程安全 SqlSession 代理 |
| MapperFactoryBean | 创建 Mapper 代理 Bean |
| @MapperScan | 扫描 Mapper 接口 |
| DataSourceTransactionManager | JDBC 事务管理 |

## Spring 事务绑定 SqlSession 的机制

在 Spring 事务中，MyBatis-Spring 会把 SqlSession 与当前线程事务资源绑定：

```text
进入 @Transactional 方法
  -> Spring 开启数据库连接事务
  -> 第一次调用 Mapper
  -> SqlSessionTemplate 获取或创建 SqlSession
  -> SqlSession 绑定到 TransactionSynchronizationManager
  -> 后续 Mapper 复用同一事务资源
  -> 方法成功提交，失败回滚
  -> 关闭/释放 SqlSession
```

这解释了为什么同一事务内的多个 Mapper 操作可以一起提交或回滚，也解释了为什么手动 `openSession()` 会绕开 Spring 管理。

## 一级缓存和 Spring 事务

Spring 集成下，同一个事务通常复用同一个 SqlSession，因此一级缓存可能在事务范围内生效。没有事务时，每次 Mapper 调用可能使用不同 SqlSession，一级缓存效果就不明显。

```text
无事务：
  mapper.selectById(1) -> SqlSession A
  mapper.selectById(1) -> SqlSession B

有事务：
  mapper.selectById(1) -> SqlSession T
  mapper.selectById(1) -> SqlSession T，可能命中一级缓存
```

> **重点：** 讨论一级缓存时必须说明 SqlSession 生命周期；在 Spring 中它常和事务边界相关。

## 事务示例

```java
@Service
class OrderService {
    private final OrderMapper orderMapper;
    private final OrderItemMapper itemMapper;

    OrderService(OrderMapper orderMapper, OrderItemMapper itemMapper) {
        this.orderMapper = orderMapper;
        this.itemMapper = itemMapper;
    }

    @Transactional
    public void createOrder(CreateOrderCommand command) {
        orderMapper.insert(command.toOrder());
        itemMapper.batchInsert(command.toItems());
    }
}
```

如果第二步失败，Spring 事务会回滚同一连接上的数据库操作。

## 常见事务误区

- Mapper 方法本身通常不放事务，事务放 Service 用例层。
- 同类内部调用导致 `@Transactional` 不生效。
- 异常被捕获后不抛出会导致提交。
- 多数据源要明确事务管理器。
- 批处理和事务边界要一起设计。

## 测试

推荐使用 Testcontainers 或测试数据库。不要让测试连接开发共享库或生产库。

```java
@SpringBootTest
@Transactional
class UserMapperTest {
    @Autowired
    UserMapper userMapper;

    @Test
    void shouldSelectById() {
        User user = userMapper.selectById(1L);
        assertThat(user).isNotNull();
    }
}
```

更完整的数据库测试应执行迁移脚本，验证真实 SQL 和索引。

## 练习

1. 在 Spring Boot 4 中配置 MyBatis starter。
2. 用 `@MapperScan` 扫描 Mapper。
3. 编写一个 Service 事务，故意制造异常验证回滚。
4. 写 Mapper 集成测试。
5. 用 Testcontainers 替代本地数据库。

## 验收

- 能说明 SqlSessionTemplate 的作用。
- 能解释 Spring 事务如何影响 MyBatis SqlSession。
- 能写可靠的 Mapper 测试。
- 能排查 Mapper Bean 找不到和 XML 未加载。

## 重点

- Spring Boot starter 自动配置 MyBatis 基础 Bean。
- 事务边界应在 Service 层。
- 测试必须隔离真实生产环境。

## 难点

- 多数据源和批处理会让事务配置复杂化。
- Spring 管理下不要手动乱开 SqlSession。

## 易错

> **易错：** 在 Spring 项目中手动 `openSession()` 并绕过事务管理。
>
> 正确做法：通过 Spring 注入 Mapper，由 Spring 管理 SqlSession 和事务。
