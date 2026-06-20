---
title: "RESTful API学习资料：状态码错误模型和ProblemDetails"
date: 2026-06-20
description: "状态码是协议层结果，告诉通用组件请求大体发生了什么。业务错误码是业务层结果，告诉调用方具体规则。两者应该配合，而不是互相替代。统一返回 200 再塞业务错误，会让网关、监控、重试和客户端错误处理失效。"
tags:
  - "架构"
  - "RESTful API"
category: "架构"
---

# RESTful API学习资料：状态码错误模型和ProblemDetails

[返回索引](../RESTful API学习资料.md)

## 学习目标

- 掌握常见 HTTP 状态码的边界。
- 能设计统一错误响应模型。
- 理解 RFC 7807/RFC 9457 Problem Details 风格的价值。

## 理论导读

状态码是协议层结果，告诉通用组件请求大体发生了什么。业务错误码是业务层结果，告诉调用方具体规则。两者应该配合，而不是互相替代。统一返回 `200` 再塞业务错误，会让网关、监控、重试和客户端错误处理失效。

## 状态码速查

| 状态码 | 含义 | 常见场景 |
| --- | --- | --- |
| `200 OK` | 成功并返回内容 | 查询、更新后返回资源 |
| `201 Created` | 已创建 | 创建资源 |
| `202 Accepted` | 已接受但异步处理 | 导入任务、批处理 |
| `204 No Content` | 成功但无响应体 | 删除、无需返回的更新 |
| `304 Not Modified` | 缓存仍有效 | 条件 GET |
| `400 Bad Request` | 请求格式或参数错误 | JSON 格式错误、参数类型错误 |
| `401 Unauthorized` | 未认证或认证无效 | token 缺失或过期 |
| `403 Forbidden` | 已认证但无权限 | 访问他人资源 |
| `404 Not Found` | 资源不存在 | ID 不存在 |
| `409 Conflict` | 当前资源状态冲突 | 重复创建、库存冲突、版本冲突 |
| `412 Precondition Failed` | 条件请求失败 | `If-Match` 不匹配 |
| `422 Unprocessable Content` | 语法正确但业务校验失败 | 字段合法但业务规则不满足 |
| `429 Too Many Requests` | 限流 | 超过调用频率 |
| `500 Internal Server Error` | 服务端未预期错误 | 程序缺陷 |
| `503 Service Unavailable` | 服务暂不可用 | 依赖故障、维护、过载 |

## 错误响应模型

```json
{
  "type": "https://api.example.com/problems/validation-error",
  "title": "Validation failed",
  "status": 422,
  "code": "ORDER_ADDRESS_INVALID",
  "detail": "Shipping address is incomplete.",
  "instance": "/orders",
  "traceId": "6b7f1e4a",
  "errors": [
    {
      "field": "shippingAddress.city",
      "message": "city is required"
    }
  ]
}
```

## 核心心智模型

状态码像交通信号灯，业务错误码像路边详细提示。红灯只告诉你不能走，详细提示告诉你是施工、事故还是道路封闭。

## 练习

为以下场景选择状态码：token 过期、库存不足、JSON 语法错误、重复支付、请求过快、服务依赖超时。

## 验收

- 能解释 `400`、`401`、`403`、`404`、`409`、`422` 的区别。
- 错误响应能被前端展示、日志检索和客服定位。
- 不会在错误响应里泄露堆栈、SQL、密钥、内部主机名。

> **重点：** 状态码服务于通用协议处理，业务错误码服务于业务分支处理。
>
> **难点：** `409` 和 `422` 的边界：前者偏资源当前状态冲突，后者偏请求内容不满足业务规则。
>
> **易错：** 把所有异常都包装成 `200`，会让监控成功率、重试策略和客户端异常处理全部失真。
