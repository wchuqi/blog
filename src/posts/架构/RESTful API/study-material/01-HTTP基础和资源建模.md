---
title: "RESTful API学习资料：HTTP基础和资源建模"
date: 2026-06-20
description: "HTTP 是 RESTful API 最常见的应用层协议。一次 HTTP 交互包含请求方法、URI、协议版本、头、可选请求体，以及响应状态码、响应头、可选响应体。RESTful API 借用 HTTP 现成语义，让代理、网关、浏览器、缓存、…"
tags:
  - "架构"
  - "RESTful API"
category: "架构"
---

# RESTful API学习资料：HTTP基础和资源建模

[返回索引](../RESTful API学习资料.md)

## 学习目标

- 掌握 HTTP 请求和响应的组成。
- 能从业务名词中抽象资源。
- 能区分集合资源、单个资源、子资源和关系资源。

## 理论导读

HTTP 是 RESTful API 最常见的应用层协议。一次 HTTP 交互包含请求方法、URI、协议版本、头、可选请求体，以及响应状态码、响应头、可选响应体。RESTful API 借用 HTTP 现成语义，让代理、网关、浏览器、缓存、监控和测试工具都能理解接口行为。

资源建模是设计 RESTful API 的第一步。资源不一定是数据库表，也不一定是一行记录。它可以是一个业务概念、一个集合、一个计算结果、一个长任务、一个关系或一个状态视图。

## 核心心智模型

把 API 看成“远程资料柜”。URI 是抽屉编号，HTTP 方法是操作方式，表示是拿出来的文件副本。你不会要求资料柜执行 `doCreateOrder`，你会把“订单集合”这个抽屉打开并放入一份新订单申请。

## 知识点详解

### 集合资源

集合资源代表一组同类资源，例如 `/users`、`/orders`、`/products`。通常支持 `GET` 查询集合，`POST` 创建新成员。

### 单个资源

单个资源代表集合中的一个对象，例如 `/orders/1001`。通常支持 `GET`、`PUT`、`PATCH`、`DELETE`。

### 子资源

子资源表达从属关系，例如 `/orders/1001/items`。适合生命周期依赖父资源的对象。

### 关系资源

当关系本身有属性时，应把关系建模为资源。例如用户加入团队不是简单字段，而是成员关系：

```http
POST /team-memberships
Content-Type: application/json

{
  "teamId": "t1",
  "userId": "u1",
  "role": "admin"
}
```

### 动作资源

有些业务动作可以抽象为资源或状态转移。例如支付订单可以是创建支付单：

```http
POST /payments
Content-Type: application/json

{
  "orderId": "1001",
  "method": "ALIPAY"
}
```

如果动作很难抽象为稳定资源，可以使用命令式子资源，如 `POST /orders/1001/cancellation-requests`，但要保持语义清楚。

## 例子

| 业务需求 | 推荐资源 | 说明 |
| --- | --- | --- |
| 创建订单 | `POST /orders` | 向订单集合添加成员 |
| 查询订单详情 | `GET /orders/{id}` | 读取单个资源 |
| 取消订单 | `POST /orders/{id}/cancellation-requests` | 取消申请是动作资源 |
| 查询用户订单 | `GET /orders?userId={id}` | 从订单集合按用户过滤 |
| 修改收货地址 | `PATCH /orders/{id}/shipping-address` | 子资源局部修改 |

## 练习

为“在线课程平台”设计课程、章节、课时、报名、学习进度、评论、作业提交的资源模型。

## 验收

- 每个路径都能说出它代表的资源。
- 能说明资源是否有独立生命周期。
- 能判断使用路径嵌套还是查询参数。

> **重点：** 先建模资源，再选择方法；不要先从“我要写哪个 Controller 方法”开始。
>
> **难点：** 动作、流程和状态变化要转化成资源创建、资源修改或状态转移。
>
> **易错：** 把数据库表直接暴露成 API 资源，可能泄露内部结构并限制未来重构。
