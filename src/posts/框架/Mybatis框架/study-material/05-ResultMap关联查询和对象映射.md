---
title: "MyBatis 学习资料：ResultMap、关联查询和对象映射"
date: 2026-06-20
description: "数据库返回的是二维表 ResultSet，Java 业务常用对象图。ResultMap 负责把行列数据映射成对象。简单场景可以用 resultType 自动映射，复杂场景必须使用 resultMap 明确列与属性、主键、关联对象和集合。"
tags:
  - "框架"
  - "Mybatis框架"
category: "框架"
---

# MyBatis 学习资料：ResultMap、关联查询和对象映射

[返回索引](../Mybatis学习资料.md)

## 学习目标

- 掌握 resultType、resultMap、自动映射、手动映射的区别。
- 理解 association、collection、嵌套查询、嵌套结果和 N+1 问题。
- 能设计复杂对象映射，同时避免重复对象、懒加载异常和性能灾难。
- 能排查字段为 null、集合重复、关联对象缺失和查询次数过多。

## 理论导读

数据库返回的是二维表 ResultSet，Java 业务常用对象图。ResultMap 负责把行列数据映射成对象。简单场景可以用 resultType 自动映射，复杂场景必须使用 resultMap 明确列与属性、主键、关联对象和集合。

关联映射是 MyBatis 最容易出性能问题的地方。嵌套查询写起来直观，但可能触发 N+1；嵌套结果一次 join 查出所有数据，但需要正确配置 id 去重，否则集合会重复或对象合并错误。

## 核心心智模型

```text
ResultSet 行
  -> ResultSetHandler
  -> 根据 ResultMap 找列名和属性
  -> TypeHandler 转换类型
  -> ObjectFactory 创建对象
  -> association/collection 组装对象图
```

## resultType 和 resultMap

`resultType` 适合列名和属性名简单对应：

```xml
<select id="selectById" resultType="User">
    select id, username, email from users where id = #{id}
</select>
```

`resultMap` 适合复杂映射：

```xml
<resultMap id="userMap" type="User">
    <id property="id" column="id"/>
    <result property="username" column="user_name"/>
    <result property="email" column="email"/>
</resultMap>
```

`<id>` 很重要，它用于对象去重和缓存 key 构造。复杂 join 映射中缺少 id 会导致重复对象或性能问题。

## association 一对一

```xml
<resultMap id="orderMap" type="Order">
    <id property="id" column="order_id"/>
    <result property="status" column="order_status"/>
    <association property="user" javaType="User">
        <id property="id" column="user_id"/>
        <result property="username" column="user_name"/>
    </association>
</resultMap>
```

适合订单和用户信息 join 查询。

## collection 一对多

```xml
<resultMap id="orderWithItemsMap" type="Order">
    <id property="id" column="order_id"/>
    <result property="status" column="order_status"/>
    <collection property="items" ofType="OrderItem">
        <id property="id" column="item_id"/>
        <result property="sku" column="sku"/>
        <result property="quantity" column="quantity"/>
    </collection>
</resultMap>
```

注意 SQL join 后一张订单会出现多行，MyBatis 依赖 `<id>` 判断哪些行属于同一个 Order。

## 嵌套结果如何折叠对象

一对多 join 查询返回的是扁平行：

```text
order_id | order_status | item_id | sku
1        | PAID         | 10      | A
1        | PAID         | 11      | B
```

Java 期望的是：

```text
Order(id=1, items=[Item(10), Item(11)])
```

ResultSetHandler 会根据 ResultMap 中的 `<id>` 生成对象 key。如果两行的 order `<id>` 相同，就复用同一个 Order；collection 中 item `<id>` 不同，就追加不同 Item。

因此：

- 主对象必须配置 `<id>`。
- 子对象也应配置 `<id>`。
- join SQL 中冲突列必须用别名。
- 如果 `<id>` 配错，可能出现重复父对象、重复子对象或数据被错误合并。

> **难点：** ResultMap 的 `<id>` 不只是标记主键，它参与对象去重和嵌套结果组装。

## 嵌套查询和 N+1

嵌套查询：

```xml
<collection property="items"
            column="id"
            select="selectItemsByOrderId"/>
```

如果查 100 个订单，每个订单再查一次明细，就会出现 1 + 100 次查询。小数据看不出问题，生产上可能导致接口突然变慢。

解决：

- join + 嵌套结果。
- 分两次批量查询：先查订单，再 `where order_id in (...)` 查明细，在 Java 组装。
- 限制分页大小。
- 用日志和监控观察 SQL 次数。

## 嵌套查询与嵌套结果取舍

| 方式 | 优点 | 风险 |
| --- | --- | --- |
| 嵌套查询 | SQL 分开，语义简单，可延迟加载 | N+1，查询次数不可控 |
| 嵌套结果 | 一次 join，减少查询次数 | 行膨胀，映射复杂，列别名要求高 |
| 两次批量查询 | 性能和可控性平衡 | 需要 Java 组装对象图 |

生产列表接口常用“两次批量查询”：

```text
select orders where ... limit 20
select items where order_id in (...)
Java 按 order_id 分组组装
```

它避免了 N+1，也避免了一次 join 导致分页不准确或行数膨胀。

## 分页和一对多 join 的陷阱

对一对多 join 结果直接分页可能出错：

```sql
select o.*, i.*
from orders o
left join order_items i on o.id = i.order_id
order by o.id desc
limit 20
```

这里 `limit 20` 限制的是 join 后的行，不是 20 个订单。如果一个订单有 10 个明细，可能只返回 2 个订单。

正确做法：

1. 先分页查询订单 id。
2. 再按 id 查询订单和明细。
3. 或使用窗口函数/子查询保证先分页主表。

## 字段映射策略

常见问题：

- 数据库列 `user_name`，Java 属性 `userName`。
- 未开启 `mapUnderscoreToCamelCase`。
- SQL 中没有给重复列加别名。
- join 后多个表都有 `id`，结果覆盖。

推荐 join 查询都显式别名：

```sql
select
  o.id as order_id,
  o.status as order_status,
  u.id as user_id,
  u.username as user_name
from orders o
join users u on o.user_id = u.id
```

## 练习

1. 实现订单和用户一对一映射。
2. 实现订单和明细一对多映射。
3. 分别用嵌套查询和嵌套结果实现，统计 SQL 次数。
4. 故意去掉 `<id>`，观察集合重复或对象异常。
5. 用两次批量查询替代 N+1。

## 验收

- 能区分 resultType 和 resultMap。
- 能解释 association 和 collection。
- 能说明 N+1 的形成原因和解决方式。
- 能用列别名避免 join 字段冲突。
- 能解释嵌套结果如何根据 `<id>` 折叠对象。
- 能说明一对多 join 直接分页的问题。

## 重点

- 复杂映射优先使用 resultMap。
- `<id>` 是对象去重和关联映射的关键。
- 嵌套查询容易 N+1。

## 难点

- 一对多 join 映射会把多行折叠成对象图，必须理解去重规则。
- 自动映射方便，但复杂 join 中容易误映射。

## 易错

> **易错：** join 多表时都叫 `id`，不写别名。
>
> 正确做法：所有冲突列显式别名，并在 resultMap 中明确映射。
