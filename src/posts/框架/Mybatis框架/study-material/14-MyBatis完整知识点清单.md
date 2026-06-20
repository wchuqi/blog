---
title: "MyBatis 完整知识点清单"
date: 2026-06-20
description: "MyBatis Core 3.5.19。"
tags:
  - "框架"
  - "Mybatis框架"
  - "知识清单"
category: "框架"
---

# MyBatis 完整知识点清单

[返回索引](../Mybatis学习资料.md)

## 版本和定位

- MyBatis Core `3.5.19`。
- MyBatis Spring Boot Starter `4.0.x`。
- Spring Boot 4 集成要求 Java 17+。
- MyBatis 是 SQL Mapper，不是完整 ORM。
- MyBatis-Plus 是增强工具，不是 MyBatis 官方核心。

## 一、基础架构

- JDBC 与 MyBatis。
- MyBatis 与 JPA/Hibernate。
- SqlSessionFactory。
- SqlSession。
- Configuration。
- MapperRegistry。
- MapperProxy。
- MapperMethod。

## 二、执行链路

- MappedStatement。
- SqlSource。
- DynamicSqlSource。
- RawSqlSource。
- BoundSql。
- CacheKey。
- RowBounds。
- Executor。
- SimpleExecutor。
- ReuseExecutor。
- BatchExecutor。
- StatementHandler。
- ParameterHandler。
- ResultSetHandler。
- TypeHandler。
- ObjectFactory。

## 三、Mapper 映射

- Mapper 接口。
- XML namespace。
- statement id。
- `@Mapper`。
- `@MapperScan`。
- mapper-locations。
- 注解 SQL。
- Provider SQL。
- 方法重载风险。
- 返回单对象、List、Map、Cursor。

## 四、动态 SQL

- `#{}`。
- `${}`。
- SQL 注入。
- OGNL。
- `if`。
- `choose`。
- `where`。
- `trim`。
- `set`。
- `foreach`。
- `bind`。
- `@Param`。
- ParamNameResolver。
- ParameterMapping。
- additionalParameters。
- BoundSql 调试。
- 排序字段白名单。

## 五、结果映射

- resultType。
- resultMap。
- id。
- result。
- association。
- collection。
- discriminator。
- 自动映射。
- 驼峰映射。
- 列别名。
- 嵌套查询。
- 嵌套结果。
- 对象折叠。
- `<id>` 去重规则。
- 一对多 join 分页陷阱。
- N+1。

## 六、缓存和延迟加载

- 一级缓存。
- CacheKey 命中规则。
- localCacheScope。
- 二级缓存。
- namespace cache。
- namespace 缓存边界。
- cache-ref。
- 缓存失效。
- 分布式一致性风险。
- 延迟加载。
- aggressiveLazyLoading。

## 七、插件和扩展

- Interceptor。
- Invocation。
- Plugin.wrap。
- 插件代理链。
- Executor 拦截。
- StatementHandler 拦截。
- ParameterHandler 拦截。
- ResultSetHandler 拦截。
- 分页插件。
- 自动 count 风险。
- 数据权限插件风险。
- 慢 SQL 插件。
- TypeHandler。
- 枚举映射。
- JSON 字段映射。

## 八、Spring Boot 集成

- mybatis-spring-boot-starter。
- SqlSessionFactoryBean。
- SqlSessionTemplate。
- TransactionSynchronizationManager。
- SqlSession 事务绑定。
- MapperFactoryBean。
- Spring 事务。
- DataSourceTransactionManager。
- 多数据源。
- Mapper 测试。
- Testcontainers。

## 九、性能

- 慢 SQL。
- statementId 追踪。
- traceId 聚合 SQL 次数。
- SQL 日志。
- BoundSql。
- EXPLAIN。
- 索引。
- N+1。
- 大 offset 分页。
- 批量写。
- 流式查询。
- fetchSize。
- 连接池。
- 锁等待。

## 十、安全和规范

- 禁止用户输入进入 `${}`。
- 动态排序白名单。
- 模糊查询安全写法。
- SQL 日志脱敏。
- XML namespace 规范。
- 多参数 `@Param`。
- join 列别名。
- 列表分页上限。
- 二级缓存谨慎开启。

## 十一、工具生态

- MyBatis Generator。
- MyBatis Dynamic SQL。
- MyBatis-Plus。
- 分页插件。
- 代码生成覆盖风险。

## 十二、迁移和排障

- Core/starter 版本区别。
- Spring Boot 兼容性。
- 插件兼容性。
- `Invalid bound statement`。
- `Parameter not found`。
- 字段映射 null。
- TooManyResults。
- SQL 语法错误。
- 版本冲突。

## 复习检查

- 能画出 Mapper 到 JDBC 的执行链路。
- 能解释 `#{}` 和 `${}`。
- 能写复杂 ResultMap 并避免 N+1。
- 能解释一级缓存和二级缓存。
- 能说明插件拦截器原理。
- 能在 Spring Boot 中正确配置事务和测试。
- 能排查慢 SQL 和 SQL 注入风险。
