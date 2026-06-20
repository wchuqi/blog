---
title: "RESTful API学习资料：OpenAPI契约测试和文档"
date: 2026-06-20
description: "OpenAPI 用机器可读格式描述 API，包括路径、方法、参数、请求体、响应体、状态码、安全方案和数据模型。它可以生成文档、Mock、SDK、测试用例和网关校验规则。"
tags:
  - "架构"
  - "RESTful API"
category: "架构"
---

# RESTful API学习资料：OpenAPI契约测试和文档

[返回索引](../RESTful API学习资料.md)

## 学习目标

- 理解 API 文档是契约，不是事后说明书。
- 掌握 OpenAPI 的核心结构。
- 能用契约测试降低联调和发布风险。

## 理论导读

OpenAPI 用机器可读格式描述 API，包括路径、方法、参数、请求体、响应体、状态码、安全方案和数据模型。它可以生成文档、Mock、SDK、测试用例和网关校验规则。

## 核心心智模型

OpenAPI 像建筑蓝图。施工前用它对齐，施工中用它检查，交付后用它维护。

## OpenAPI 片段

```yaml
openapi: 3.1.0
info:
  title: Order API
  version: 1.0.0
paths:
  /orders/{orderId}:
    get:
      summary: Get order by id
      parameters:
        - name: orderId
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Order detail
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Order"
        "404":
          description: Order not found
components:
  schemas:
    Order:
      type: object
      required: [id, status]
      properties:
        id:
          type: string
        status:
          type: string
          enum: [CREATED, PAID, CANCELLED]
```

## 契约测试

契约测试检查实现是否符合文档，也检查消费者是否按契约调用。常见方式：

- 根据 OpenAPI 校验请求和响应。
- 使用 Mock Server 支持前端并行开发。
- 对关键接口做 Consumer-Driven Contract 测试。
- 在 CI 中检查破坏性变更。

## 文档质量检查

- 每个状态码都有响应示例。
- 每个字段有类型、含义、是否必填、可空性。
- 枚举值有说明。
- 错误响应统一。
- 认证方案明确。
- 分页、过滤、排序规则明确。

## 练习

为 `POST /orders` 写 OpenAPI 片段，包含请求体、`201`、`400`、`409`、`422` 响应。

## 验收

- 能阅读并编写基本 OpenAPI 文档。
- 能说明文档和实现漂移的风险。
- 能设计 CI 中的契约检查点。

> **重点：** API 文档应先于或同步于实现，不能只靠口头约定。
>
> **难点：** 文档中的字段可空性、默认值、枚举扩展和错误响应最容易漏。
>
> **易错：** 文档只写成功响应，不写错误响应，联调时前端无法可靠处理异常。
