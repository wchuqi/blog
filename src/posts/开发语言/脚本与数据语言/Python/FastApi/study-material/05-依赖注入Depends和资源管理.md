---
title: "FastAPI学习资料：依赖注入、Depends 和资源管理"
date: 2026-06-20
description: "FastAPI 的依赖注入不是传统 Java 容器式 DI，而是请求级依赖解析系统。每个请求进入路由前，FastAPI 会根据函数签名构建依赖树，解析子依赖，执行校验，并把结果注入到路由函数。"
tags:
  - "开发语言"
  - "FastApi"
category: "开发语言"
---

# FastAPI学习资料：依赖注入、Depends 和资源管理

[返回索引](../FastApi学习资料.md)

## 学习目标

- 理解 `Depends` 的用途和依赖解析机制。
- 会使用子依赖、依赖缓存、类依赖、`yield` 依赖。
- 能用依赖表达认证、权限、数据库会话和配置。

## 理论导读

FastAPI 的依赖注入不是传统 Java 容器式 DI，而是请求级依赖解析系统。每个请求进入路由前，FastAPI 会根据函数签名构建依赖树，解析子依赖，执行校验，并把结果注入到路由函数。

默认情况下，同一个依赖在一次请求中会缓存，避免重复执行。使用 `yield` 的依赖适合管理请求级资源，例如数据库会话：`yield` 前创建资源，`yield` 后释放资源。

## 核心心智模型

把依赖树想成“请求上下文流水线”：认证依赖产出当前用户，权限依赖读取当前用户，数据库依赖产出会话，业务函数拿到已经准备好的上下文。

## 示例

```python
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status

app = FastAPI()


class User:
    def __init__(self, username: str, is_admin: bool = False):
        self.username = username
        self.is_admin = is_admin


async def get_current_user(token: str | None = None) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing token")
    return User(username="alice", is_admin=True)


async def require_admin(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="admin required")
    return user


@app.get("/admin")
async def admin_page(user: Annotated[User, Depends(require_admin)]):
    return {"user": user.username}
```

## `yield` 依赖

```python
async def get_session():
    session = create_session()
    try:
        yield session
    finally:
        await session.close()
```

如果在 `yield` 依赖中捕获异常，通常要重新抛出，避免隐藏真实失败。

## 练习

实现三个依赖：

1. `get_settings` 返回配置。
2. `get_db` 返回请求级数据库会话。
3. `get_current_user` 读取 token 并返回用户。

## 验收

- 能解释依赖树和子依赖。
- 能说明同一请求内依赖缓存的意义。
- 能用 `dependency_overrides` 编写测试替身。

## 重点

- `Depends` 是 FastAPI 组织横切能力的核心：认证、权限、数据库、配置、限流都可以通过它接入。

## 难点

- 依赖既参与参数解析，又参与资源生命周期，还可能抛出 HTTP 错误。设计时要让每个依赖职责单一。

## 易错

> **易错：** 把数据库 session 做成全局对象给所有请求共用。
>
> 正确做法：连接池可以是应用级资源，会话或事务应是请求级资源。

