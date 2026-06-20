---
title: "RESTful API学习资料：URI路径查询和命名规范"
date: 2026-06-20
description: "URI 是资源的稳定地址。路径一般表达资源层级，查询参数表达对集合资源的筛选、排序、分页、投影或搜索条件。好的 URI 不暴露技术细节，不依赖临时状态，不把复杂动作硬塞进路径。"
tags:
  - "架构"
  - "RESTful API"
category: "架构"
---

# RESTful API学习资料：URI路径查询和命名规范

[返回索引](../RESTful API学习资料.md)

## 学习目标

- 掌握 URI 路径和查询参数的分工。
- 能制定一致的命名规范。
- 能避免过度嵌套、动词路径和不稳定标识符。

## 理论导读

URI 是资源的稳定地址。路径一般表达资源层级，查询参数表达对集合资源的筛选、排序、分页、投影或搜索条件。好的 URI 不暴露技术细节，不依赖临时状态，不把复杂动作硬塞进路径。

## 核心心智模型

路径像文件夹位置，查询参数像查看文件夹时使用的过滤器。`/orders/1001` 是某个订单，`/orders?status=PAID` 是订单集合的一个视图。

## 知识点详解

### 路径命名

- 使用名词复数：`/users`、`/orders`。
- 使用小写和连字符：`/shipping-addresses`。
- 使用稳定 ID：`/users/{userId}`。
- 避免文件扩展名：优先用 `Accept` 表示格式。

### 查询参数

查询参数适合表达：

- 过滤：`status=PAID`
- 排序：`sort=-createdAt,totalAmount`
- 分页：`page=1&pageSize=20` 或 `cursor=xxx&limit=20`
- 字段投影：`fields=id,name,status`
- 关系展开：`include=items,payment`

### 嵌套边界

当子资源离开父资源没有意义时可以嵌套，例如 `/orders/{id}/items`。如果资源有独立查询入口，不要只放在深层嵌套里，例如订单应该也能通过 `/orders/{id}` 访问。

### 命名一致性

| 决策点 | 推荐 | 避免 |
| --- | --- | --- |
| 单词分隔 | `shipping-addresses` | `shipping_address`、`shippingAddresses` 混用 |
| 集合名称 | 复数名词 | 动词短语 |
| 资源 ID | 稳定业务 ID 或不可猜测 ID | 手机号、邮箱等敏感标识 |
| 操作结果 | 状态码加响应体 | 统一返回 `200` 再靠 message 判断 |

## 例子

```http
GET /products?categoryId=c1&priceMin=100&priceMax=500&sort=-sales&page=1&pageSize=20
```

这个接口表示从商品集合中筛选一个视图，而不是一个新资源。

## 练习

把下面接口改造成 RESTful 风格：

```text
/getUserInfo
/createNewOrder
/deleteProductById
/queryPaidOrdersByUser
/updateOrderStatus
```

## 验收

- 能说出路径参数和查询参数的分工。
- 能制定团队级 URI 命名规范。
- 能识别过深嵌套和动作路径。

> **重点：** 路径定位资源，查询参数描述集合视图。
>
> **难点：** 业务上“属于某对象”的数据，不一定必须在 URI 上无限嵌套。
>
> **易错：** 在 URI 中放敏感信息，如手机号、身份证号、邮箱，会进入日志、浏览器历史和网关监控。
