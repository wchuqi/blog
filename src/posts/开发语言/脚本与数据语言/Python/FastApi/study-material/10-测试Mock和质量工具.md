---
title: "FastAPI学习资料：测试、Mock 和质量工具"
date: 2026-06-20
description: "FastAPI 测试的优势在于依赖注入可覆盖。你可以把真实数据库、真实认证、真实外部服务替换成测试依赖，直接通过 HTTP 客户端调用应用，而不是只测试内部函数。"
tags:
  - "开发语言"
  - "FastApi"
category: "开发语言"
---

# FastAPI学习资料：测试、Mock 和质量工具

[返回索引](../FastApi学习资料.md)

## 学习目标

- 会写接口测试、依赖覆盖测试和数据库测试。
- 掌握 `TestClient`、pytest fixture、`dependency_overrides`。
- 建立质量工具链：格式化、类型检查、Lint、覆盖率。

## 理论导读

FastAPI 测试的优势在于依赖注入可覆盖。你可以把真实数据库、真实认证、真实外部服务替换成测试依赖，直接通过 HTTP 客户端调用应用，而不是只测试内部函数。

测试应覆盖 API 契约：状态码、响应结构、错误模型、权限边界和数据库副作用。不要只断言“请求成功”。

## 核心心智模型

测试客户端模拟真实 HTTP 调用，依赖覆盖提供可控环境。两者结合能验证接口层和业务层之间的契约。

## 示例

```python
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import get_current_user


def fake_user():
    return {"id": 1, "role": "admin"}


def test_admin_api():
    app.dependency_overrides[get_current_user] = fake_user
    try:
        client = TestClient(app)
        response = client.get("/admin")
        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()
```

## 工具链建议

```powershell
pip install pytest pytest-cov ruff mypy
pytest
pytest --cov=app
ruff check app tests
mypy app
```

## 练习

为用户登录接口写测试：

- 登录成功返回 token。
- 密码错误返回 401。
- 缺少字段返回 422。
- 普通用户访问管理员接口返回 403。

## 验收

- 能覆盖成功路径和失败路径。
- 测试之间不共享脏状态。
- 依赖覆盖在测试结束后清理。

## 重点

- API 测试要断言状态码、响应字段和关键副作用。
- 外部服务调用要 Mock，避免测试不稳定。

## 难点

- 异步数据库测试需要清晰的事件循环、事务和 fixture 生命周期设计。

## 易错

> **易错：** 测试中覆盖依赖后不清理，导致后续用例污染。
>
> 正确做法：用 fixture 或 `try/finally` 清理 `app.dependency_overrides`。

