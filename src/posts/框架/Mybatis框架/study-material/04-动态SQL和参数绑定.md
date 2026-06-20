---
title: "MyBatis 学习资料：动态 SQL 和参数绑定"
date: 2026-06-20
description: "动态 SQL 是 MyBatis 的核心能力之一。业务查询通常不是固定 SQL，而是按条件拼接：状态可选、时间范围可选、关键字可选、批量 ID 可选。MyBatis 用 XML 标签和 OGNL 表达式生成最终 SQL。"
tags:
  - "框架"
  - "Mybatis框架"
category: "框架"
---

# MyBatis 学习资料：动态 SQL 和参数绑定

[返回索引](../Mybatis学习资料.md)

## 学习目标

- 深入理解 `#{}` 和 `${}` 的区别。
- 掌握 `if`、`choose`、`trim`、`where`、`set`、`foreach`、`bind` 等动态 SQL。
- 理解 ParamNameResolver、OGNL、BoundSql 和参数映射。
- 能写安全、可维护、可调试的动态 SQL。

## 理论导读

动态 SQL 是 MyBatis 的核心能力之一。业务查询通常不是固定 SQL，而是按条件拼接：状态可选、时间范围可选、关键字可选、批量 ID 可选。MyBatis 用 XML 标签和 OGNL 表达式生成最终 SQL。

动态 SQL 的风险同样大：空 where、错误 and/or、批量 in 为空、`${}` SQL 注入、排序字段注入、参数名找不到、foreach 参数过长。真正掌握动态 SQL，要看最终 BoundSql，而不是只看 XML。

## 核心心智模型

```text
方法参数
  -> ParamNameResolver 解析参数名
  -> OGNL 判断动态标签
  -> 生成最终 SQL 文本
  -> #{} 生成 ? 和 ParameterMapping
  -> ParameterHandler 绑定参数
```

## `#{}` 和 `${}`

| 写法 | 机制 | 是否预编译参数 | 风险 |
| --- | --- | --- | --- |
| `#{name}` | 生成 `?`，通过 PreparedStatement 绑定 | 是 | 安全 |
| `${name}` | 直接字符串替换进 SQL | 否 | SQL 注入 |

安全写法：

```xml
where username = #{username}
```

危险写法：

```xml
where username = '${username}'
```

如果 `username` 是 `a' or '1'='1`，`${}` 会拼成危险 SQL。

`${}` 的少数合理场景是表名、列名、排序方向这类不能用 `?` 绑定的位置，但必须白名单校验。

## 常用动态标签

### if

```xml
<if test="status != null and status != ''">
    and status = #{status}
</if>
```

### where

`where` 会自动处理前导 `and/or`。

```xml
<where>
    <if test="status != null">
        and status = #{status}
    </if>
    <if test="keyword != null">
        and title like concat('%', #{keyword}, '%')
    </if>
</where>
```

### set

适合动态更新，自动处理末尾逗号。

```xml
<update id="updateUser">
    update users
    <set>
        <if test="username != null">username = #{username},</if>
        <if test="email != null">email = #{email},</if>
    </set>
    where id = #{id}
</update>
```

### foreach

```xml
<select id="selectByIds" resultType="User">
    select id, username
    from users
    where id in
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>
```

`ids` 为空时可能生成非法 SQL，需要在业务层或 SQL 层处理。

### choose

```xml
<choose>
    <when test="id != null">
        id = #{id}
    </when>
    <when test="username != null">
        username = #{username}
    </when>
    <otherwise>
        1 = 0
    </otherwise>
</choose>
```

## 参数名解析

单参数时，MyBatis 可以直接引用。多参数时推荐 `@Param`：

```java
List<Order> select(@Param("status") String status,
                   @Param("startTime") LocalDateTime startTime,
                   @Param("endTime") LocalDateTime endTime);
```

XML：

```xml
<if test="startTime != null">
    and created_at &gt;= #{startTime}
</if>
```

没有 `@Param` 时，可能需要用 `param1`、`param2`，可读性差且容易错。

## ParamNameResolver 深入

Mapper 方法参数进入 MyBatis 后，会被 ParamNameResolver 解析成可供 OGNL 使用的名字。

典型规则：

```text
单个简单参数：
  可以用任意名字引用，但推荐和 @Param 保持一致

单个对象参数：
  直接访问对象属性，如 #{username}

多个参数且有 @Param：
  使用 @Param 指定名，同时也可能有 param1、param2

多个参数且无 @Param：
  只能稳定依赖 param1、param2，不建议依赖编译参数名
```

示例：

```java
List<User> search(@Param("status") String status,
                  @Param("keyword") String keyword);
```

XML：

```xml
<if test="status != null">
    and status = #{status}
</if>
<if test="keyword != null and keyword != ''">
    and username like concat('%', #{keyword}, '%')
</if>
```

如果没有 `@Param`，XML 写 `#{status}` 很可能找不到参数。

## OGNL 表达式边界

动态 SQL 的 `test` 使用 OGNL。它能访问属性、集合、Map key，但要注意：

- `author.name` 要求 `author` 非 null，否则可能判断失败或报错。
- 字符串空值要同时判断 null 和 `''`。
- 集合要判断 `list != null and list.size > 0`。
- Map key 和对象属性不要混淆。

安全写法：

```xml
<if test="query != null and query.keyword != null and query.keyword != ''">
    and title like concat('%', #{query.keyword}, '%')
</if>
```

## BoundSql 和 ParameterMapping

动态 SQL 计算后会生成 BoundSql：

```text
sql = select * from users where status = ? and age >= ?
parameterMappings = [status, minAge]
parameterObject = 查询对象
```

ParameterHandler 会按 parameterMappings 的顺序绑定参数。插件或拦截器如果改写 SQL，必须保证：

- `?` 数量和 ParameterMapping 数量一致。
- 参数顺序一致。
- 新增参数要放入 additionalParameters 或新 BoundSql。

这就是分页插件、数据权限插件容易出错的地方。

## 排序字段白名单

排序列不能用 `#{}`：

```xml
order by #{sort}
```

这会变成 `order by ?`，数据库会把它当值，不是列名。使用 `${}` 前必须白名单：

```java
String sortColumn = switch (request.sort()) {
    case "createdAt" -> "created_at";
    case "amount" -> "amount";
    default -> "id";
};
```

```xml
order by ${sortColumn} desc
```

## 例子：订单查询

```xml
<select id="search" resultType="Order">
    select id, user_id, status, amount, created_at
    from orders
    <where>
        <if test="status != null">
            and status = #{status}
        </if>
        <if test="userId != null">
            and user_id = #{userId}
        </if>
        <if test="startTime != null">
            and created_at &gt;= #{startTime}
        </if>
        <if test="endTime != null">
            and created_at &lt; #{endTime}
        </if>
    </where>
    order by created_at desc
    limit #{limit} offset #{offset}
</select>
```

## 练习

1. 实现订单多条件查询。
2. 给批量 ID 查询处理空集合。
3. 实现安全排序白名单。
4. 打开日志观察 BoundSql。
5. 故意用 `${keyword}` 拼接查询，解释风险。

## 验收

- 能清楚解释 `#{}` 和 `${}`。
- 能使用 where/set/foreach 避免非法 SQL。
- 能处理多参数命名。
- 能设计排序字段白名单。
- 能根据 BoundSql 排查动态 SQL。

## 重点

- `#{}` 是参数绑定，`${}` 是字符串替换。
- 动态 SQL 必须观察最终 SQL。
- 多参数方法用 `@Param`。

## 难点

- OGNL 表达式和参数对象结构不一致会导致条件不生效。
- foreach 空集合、超大集合和数据库参数数量限制要特别处理。

## 易错

> **易错：** 用 `${}` 处理用户输入。
>
> 正确做法：普通值一律用 `#{}`；必须拼接标识符时使用服务端白名单。
