---
title: "FastAPI学习资料：Pydantic v2、校验、序列化和 OpenAPI"
date: 2026-06-20
description: "Pydantic 是 FastAPI 的数据层核心。请求进入时，外部 JSON、查询参数和路径参数会被转换并校验成 Python 对象；响应返回时，Python 对象会被序列化成 JSON 兼容结构。Pydantic v2 使用 model…"
tags:
  - "开发语言"
  - "FastApi"
category: "开发语言"
---

# FastAPI学习资料：Pydantic v2、校验、序列化和 OpenAPI

[返回索引](../FastApi学习资料.md)

## 学习目标

- 掌握 Pydantic v2 在 FastAPI 中的输入输出作用。
- 会使用字段约束、嵌套模型、枚举、校验器和序列化。
- 理解 OpenAPI Schema 如何从类型声明生成。

## 理论导读

Pydantic 是 FastAPI 的数据层核心。请求进入时，外部 JSON、查询参数和路径参数会被转换并校验成 Python 对象；响应返回时，Python 对象会被序列化成 JSON 兼容结构。Pydantic v2 使用 `model_validate`、`model_dump`、`field_validator`、`model_config` 等 API。

OpenAPI 文档来自路由、参数、模型和响应声明。文档不是额外维护的一份说明，而是契约声明的派生产物。

## 核心心智模型

Pydantic 模型像“边界门禁”：外部数据进入系统前要过门禁，内部对象出去前也要过门禁。门禁规则越清楚，接口越稳定。

## 示例

```python
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class OrderStatus(StrEnum):
    pending = "pending"
    paid = "paid"
    canceled = "canceled"


class OrderCreate(BaseModel):
    sku: str = Field(min_length=3, max_length=32)
    quantity: int = Field(gt=0, le=100)

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: str) -> str:
        return value.strip().upper()


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sku: str
    quantity: int
    status: OrderStatus
```

## 常见模型拆分

| 模型 | 用途 | 示例字段 |
| --- | --- | --- |
| `UserCreate` | 创建请求 | email、password |
| `UserUpdate` | 更新请求 | nickname、avatar |
| `UserRead` | 对外响应 | id、email、nickname |
| `UserInDB` | 内部持久化 | password_hash、deleted_at |

## 练习

为用户模块设计 `UserCreate`、`UserLogin`、`UserRead`、`UserInDB` 四个模型，要求密码只出现在创建和登录输入中，不能出现在响应模型中。

## 验收

- 能说出 Pydantic v2 常见 API 和 v1 的差异方向。
- 能用字段约束减少手写 if 校验。
- 能解释为什么 OpenAPI 文档能自动更新。

## 重点

- Pydantic 负责边界数据，不应该承担全部业务规则。
- API 模型要面向外部契约，不能直接等同于数据库表。

## 难点

- 校验、转换、序列化发生在不同阶段。不要把“接收数据时的校验”和“返回数据时的过滤”混为一谈。

## 易错

> **易错：** 在响应模型里包含 `password_hash`，再指望前端“不展示”。
>
> 正确做法：响应模型从设计上不包含敏感字段，并用测试验证响应 JSON。

