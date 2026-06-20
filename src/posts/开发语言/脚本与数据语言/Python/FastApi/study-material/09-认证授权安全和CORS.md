---
title: "FastAPI学习资料：认证授权、安全和 CORS"
date: 2026-06-20
description: "认证解决“你是谁”，授权解决“你能做什么”。FastAPI 提供安全工具和 OpenAPI 集成，但不会替你设计完整权限模型。生产系统需要密码哈希、Token 过期、刷新、撤销、权限检查、审计日志和 Secret 管理。"
tags:
  - "开发语言"
  - "FastApi"
category: "开发语言"
---

# FastAPI学习资料：认证授权、安全和 CORS

[返回索引](../FastApi学习资料.md)

## 学习目标

- 理解认证和授权的区别。
- 会实现 OAuth2 Bearer Token/JWT 风格的认证依赖。
- 掌握 CORS、密码存储、Secret 管理和常见 API 安全风险。

## 理论导读

认证解决“你是谁”，授权解决“你能做什么”。FastAPI 提供安全工具和 OpenAPI 集成，但不会替你设计完整权限模型。生产系统需要密码哈希、Token 过期、刷新、撤销、权限检查、审计日志和 Secret 管理。

CORS 是浏览器安全策略，不是后端认证机制。允许所有 Origin 并携带凭证通常是不安全的。

## 核心心智模型

认证依赖产出当前用户，授权依赖基于当前用户和资源上下文做决策。不要把权限判断散落在每个路由里。

## 示例

```python
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


async def get_current_user(
    token: Annotated[str, Security(oauth2_scheme)],
):
    if token != "demo":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"id": 1, "role": "admin"}


async def require_admin(user: Annotated[dict, Depends(get_current_user)]):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="admin required")
    return user
```

## CORS 示例

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://admin.example.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

## 练习

实现登录、获取当前用户、管理员接口三个功能，并为普通用户访问管理员接口编写 403 测试。

## 验收

- 能解释 401 和 403 的区别。
- 密码使用安全哈希，不明文存储。
- Token 有过期时间，Secret 不写死在代码里。

## 重点

- 权限检查应靠后端强制执行，前端隐藏按钮不是安全策略。
- Secret 应来自环境变量或安全配置系统。

## 难点

- 多租户、资源级权限、Token 撤销和刷新机制比简单 JWT 示例复杂得多。

## 易错

> **易错：** JWT 一旦签发就完全不可控。
>
> 正确做法：结合短过期时间、刷新 Token、版本号、黑名单或服务端会话策略处理撤销需求。

