---
title: "FastAPI面试知识点：路由、请求响应和 Pydantic"
date: 2026-06-20
description: "路径模板中的变量来自 path；简单类型参数默认多来自 query；Pydantic 模型默认来自 body；使用 Path、Query、Header、Cookie、Body 可以显式声明来源和约束。"
tags:
  - "开发语言"
  - "FastApi"
  - "面试"
category: "开发语言"
---

# FastAPI面试知识点：路由、请求响应和 Pydantic

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../FastApi学习资料.md)

## 一、路由、请求响应和 Pydantic

### 1. FastAPI 如何判断参数来自哪里？

**参考答案：**

路径模板中的变量来自 path；简单类型参数默认多来自 query；Pydantic 模型默认来自 body；使用 `Path`、`Query`、`Header`、`Cookie`、`Body` 可以显式声明来源和约束。

> **易错：** 只说“看参数名”，忽略类型和显式声明也会影响来源。

### 2. 为什么 `/users/me` 要写在 `/users/{user_id}` 前面？

**参考答案：**

FastAPI 的路径操作按注册顺序匹配。如果动态路径先注册，`/users/me` 会被 `/users/{user_id}` 捕获，`me` 会被当作 `user_id`。

> **重点：** 路由顺序是可导致线上 bug 的细节，应写测试覆盖。

### 3. 422 错误通常代表什么？

**参考答案：**

422 通常表示请求已经到达接口，但参数、请求体或字段类型不符合 FastAPI/Pydantic 的校验规则。例如缺少必填字段、类型转换失败、字段长度不满足约束。

> **易错：** 把所有 422 都归为后端异常。大多数情况下是请求契约不匹配。

### 4. `response_model` 有什么作用？

**参考答案：**

`response_model` 用来声明响应契约，会影响 OpenAPI 文档，也会参与响应序列化和字段过滤。它可以避免返回内部字段，但不能替代安全设计和权限控制。

> **重点：** 它不是“只生成文档”。

### 5. Pydantic v2 在 FastAPI 中主要做什么？

**参考答案：**

Pydantic v2 负责请求数据校验、类型转换、错误信息生成、响应序列化和 Schema 生成。常见 API 包括 `BaseModel`、`Field`、`model_validate`、`model_dump` 和校验器。

> **难点：** 校验和序列化是两个方向，分别发生在输入和输出边界。

