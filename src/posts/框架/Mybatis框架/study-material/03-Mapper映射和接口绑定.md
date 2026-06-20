---
title: "MyBatis 学习资料：Mapper 映射和接口绑定"
date: 2026-06-20
description: "Mapper 是 MyBatis 的入口。你定义 Java 接口，MyBatis 为它创建动态代理。代理不会执行接口方法里的代码，而是根据“接口全限定名 + 方法名”找到对应的 MappedStatement。XML 中的 namespac…"
tags:
  - "框架"
  - "Mybatis框架"
category: "框架"
---

# MyBatis 学习资料：Mapper 映射和接口绑定

[返回索引](../Mybatis学习资料.md)

## 学习目标

- 掌握 Mapper 接口、XML namespace、SQL id 的绑定规则。
- 能选择 XML、注解或混合方式。
- 理解 MapperProxy 动态代理和方法分派。
- 能排查 statement 找不到、重载方法、参数名、XML 加载和注解冲突问题。

## 理论导读

Mapper 是 MyBatis 的入口。你定义 Java 接口，MyBatis 为它创建动态代理。代理不会执行接口方法里的代码，而是根据“接口全限定名 + 方法名”找到对应的 MappedStatement。XML 中的 `namespace` 必须与接口全限定名匹配，SQL 标签的 `id` 必须与方法名匹配。

这种设计让 Java 方法和 SQL 分离，但也要求命名、路径、参数和返回值严格一致。

## 核心心智模型

```text
UserMapper.selectById
  -> namespace = com.example.UserMapper
  -> statementId = com.example.UserMapper.selectById
  -> XML 中找到 <select id="selectById">
  -> 执行 SQL
```

## 知识点详解

### XML Mapper

```xml
<mapper namespace="com.example.demo.mapper.UserMapper">
    <select id="selectById" parameterType="long" resultType="com.example.demo.domain.User">
        select id, username, email
        from users
        where id = #{id}
    </select>
</mapper>
```

接口：

```java
public interface UserMapper {
    User selectById(Long id);
}
```

### 注解 Mapper

```java
public interface UserMapper {
    @Select("select id, username, email from users where id = #{id}")
    User selectById(Long id);
}
```

注解适合简单 SQL。复杂动态 SQL、ResultMap、长 SQL 更适合 XML。

### XML 和注解取舍

| 方式 | 适合 | 风险 |
| --- | --- | --- |
| XML | 复杂 SQL、动态 SQL、ResultMap | 文件路径和 namespace 易错 |
| 注解 | 简单查询、小项目 | 长 SQL 难维护 |
| Provider | 动态构造 SQL | 可读性和调试成本高 |

### 方法重载风险

Mapper 接口不推荐重载方法。MyBatis statement id 通常按方法名绑定，重载会让映射不清晰，维护成本高。

```java
// 不推荐
User select(Long id);
User select(String username);
```

推荐明确命名：

```java
User selectById(Long id);
User selectByUsername(String username);
```

### 返回值类型

常见返回：

- 单对象：`User`。
- 列表：`List<User>`。
- Map：`Map<String, Object>`。
- 影响行数：`int`。
- Cursor：大结果集流式处理。

返回单对象但 SQL 返回多行时会报错或行为不符合预期。必须保证查询语义唯一。

## 例子：分页查询接口

```java
public interface OrderMapper {
    List<Order> selectPage(@Param("status") String status,
                           @Param("offset") int offset,
                           @Param("limit") int limit);
}
```

```xml
<select id="selectPage" resultType="com.example.Order">
    select id, status, created_at
    from orders
    where status = #{status}
    order by created_at desc
    limit #{limit} offset #{offset}
</select>
```

多参数建议使用 `@Param`，避免参数名解析不稳定。

## 练习

1. 写 XML Mapper 和注解 Mapper 各一个。
2. 故意让 namespace 和接口名不一致，观察错误。
3. 写两个重载方法，观察维护问题。
4. 给多参数方法去掉 `@Param`，观察 XML 中参数引用变化。

## 验收

- 能解释 namespace/id 绑定规则。
- 能判断 XML 和注解的适用场景。
- 能说明为什么不推荐 Mapper 方法重载。
- 能排查 `Invalid bound statement`。

## 重点

- Mapper 接口由动态代理实现。
- statement id 是接口全限定名和方法名的组合。
- 多参数方法应显式使用 `@Param`。

## 难点

- 多模块项目 XML 路径、资源打包和扫描配置容易错。
- 注解和 XML 混用时要避免同一 statement 重复定义。

## 易错

> **易错：** XML 文件名和接口名一样，就以为一定能绑定。
>
> 正确做法：真正决定绑定的是 XML 的 namespace、SQL id 和 XML 是否被加载。

