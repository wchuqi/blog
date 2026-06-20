---
title: "RESTful API学习资料：RESTful API设计实战项目"
date: 2026-06-20
description: "设计一套“电商订单 API”，覆盖 RESTful API 的主要能力：资源建模、方法语义、状态码、错误响应、安全、分页、幂等、缓存、版本、OpenAPI 和生产治理。"
tags:
  - "架构"
  - "RESTful API"
category: "架构"
---

# RESTful API学习资料：RESTful API设计实战项目

[返回索引](../RESTful API学习资料.md)

## 项目目标

设计一套“电商订单 API”，覆盖 RESTful API 的主要能力：资源建模、方法语义、状态码、错误响应、安全、分页、幂等、缓存、版本、OpenAPI 和生产治理。

## 业务范围

- 用户浏览商品。
- 用户创建订单。
- 用户支付订单。
- 用户取消订单。
- 用户查询订单列表和详情。
- 商家发货。
- 用户申请退款。
- 客服查看订单和处理售后。

## 资源清单

| 资源 | URI 示例 | 说明 |
| --- | --- | --- |
| 商品集合 | `/products` | 支持分页、过滤、排序 |
| 商品详情 | `/products/{productId}` | 可缓存 |
| 订单集合 | `/orders` | 创建和查询订单 |
| 订单详情 | `/orders/{orderId}` | 用户只能访问自己的订单 |
| 订单项 | `/orders/{orderId}/items` | 订单子资源 |
| 支付单 | `/payments` | 创建支付请求，必须幂等 |
| 取消申请 | `/orders/{orderId}/cancellation-requests` | 动作资源 |
| 退款申请 | `/refunds` | 独立资源 |
| 发货记录 | `/shipments` | 商家操作 |

## 必做接口

```http
GET /products?categoryId=c1&sort=-sales&page=1&pageSize=20
GET /products/{productId}
POST /orders
GET /orders?status=PAID&page=1&pageSize=20
GET /orders/{orderId}
POST /payments
POST /orders/{orderId}/cancellation-requests
POST /refunds
POST /shipments
```

## 关键设计要求

- `POST /payments` 必须支持 `Idempotency-Key`。
- 用户订单接口必须做资源归属校验。
- 商品详情支持 `ETag` 和条件 GET。
- 修改用户资料或订单备注时使用 `If-Match` 防止覆盖。
- 错误响应采用统一 Problem Details 风格。
- 订单列表支持分页、状态过滤和排序。
- OpenAPI 文档必须包含成功和失败响应示例。

## 示例：创建订单

```http
POST /orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "items": [
    {
      "productId": "p1",
      "quantity": 2
    }
  ],
  "shippingAddressId": "addr1"
}
```

```http
HTTP/1.1 201 Created
Location: /orders/1001
Content-Type: application/json
```

```json
{
  "id": "1001",
  "status": "CREATED",
  "totalAmount": 39800,
  "currency": "CNY"
}
```

## 验收标准

- 资源模型清晰，没有大量动词路径。
- HTTP 方法、状态码和错误响应语义正确。
- 高风险操作具备幂等、防重和审计设计。
- 查询接口有分页上限和排序白名单。
- 安全设计覆盖认证、授权、CORS、敏感字段和限流。
- 有 OpenAPI 文档和契约测试思路。

## 扩展任务

- 增加异步导入订单接口，使用 `202 Accepted` 和任务资源 `/import-jobs/{jobId}`。
- 增加 Webhook 回调支付结果，并设计签名校验和重放防护。
- 增加 API 网关限流规则和监控指标。

> **重点：** 项目练习要把“设计理由”写出来，不能只列接口。
>
> **难点：** 支付、退款、发货都涉及状态机、幂等和并发，必须明确重复请求和乱序事件的处理。
>
> **易错：** 创建订单、支付、退款都用同一个 `POST /orderAction`，会让权限、审计、幂等和错误处理混乱。
