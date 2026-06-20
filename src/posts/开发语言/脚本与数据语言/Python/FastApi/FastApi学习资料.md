---
title: "FastAPI学习资料"
date: 2026-06-20
description: "这是一套面向 Python 后端开发与面试准备的 FastAPI 中文学习资料。内容从 ASGI 心智模型、路由和请求响应开始，逐步推进到 Pydantic v2、依赖注入、异步并发、数据库、安全、测试、部署、性能排障和综合项目。"
tags:
  - "开发语言"
  - "FastApi"
  - "学习资料总览"
category: "开发语言"
---

# FastAPI学习资料

这是一套面向 Python 后端开发与面试准备的 FastAPI 中文学习资料。内容从 ASGI 心智模型、路由和请求响应开始，逐步推进到 Pydantic v2、依赖注入、异步并发、数据库、安全、测试、部署、性能排障和综合项目。

版本基准：FastAPI 0.136.3、Python 3.10+、Pydantic v2、Starlette、Uvicorn。目录名按用户要求使用 `FastApi`，正文使用官方常见写法 `FastAPI`。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览、定位和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 版本环境和项目结构 | [01-版本环境和项目结构.md](study-material/01-版本环境和项目结构.md) |
| 2 | ASGI 运行模型和生命周期 | [02-ASGI运行模型和生命周期.md](study-material/02-ASGI运行模型和生命周期.md) |
| 3 | 路由、参数、请求体和响应模型 | [03-路由参数请求体和响应模型.md](study-material/03-路由参数请求体和响应模型.md) |
| 4 | Pydantic v2、校验、序列化和 OpenAPI | [04-PydanticV2校验序列化和OpenAPI.md](study-material/04-PydanticV2校验序列化和OpenAPI.md) |
| 5 | 依赖注入、Depends 和资源管理 | [05-依赖注入Depends和资源管理.md](study-material/05-依赖注入Depends和资源管理.md) |
| 6 | 异常处理、状态码和错误模型 | [06-异常处理状态码和错误模型.md](study-material/06-异常处理状态码和错误模型.md) |
| 7 | 异步并发、后台任务和 WebSocket | [07-异步并发后台任务和WebSocket.md](study-material/07-异步并发后台任务和WebSocket.md) |
| 8 | 数据库、SQLAlchemy、事务和迁移 | [08-数据库SQLAlchemy异步事务和迁移.md](study-material/08-数据库SQLAlchemy异步事务和迁移.md) |
| 9 | 认证授权、安全和 CORS | [09-认证授权安全和CORS.md](study-material/09-认证授权安全和CORS.md) |
| 10 | 测试、Mock 和质量工具 | [10-测试Mock和质量工具.md](study-material/10-测试Mock和质量工具.md) |
| 11 | 部署、容器、进程模型和可观测性 | [11-部署容器进程模型和可观测性.md](study-material/11-部署容器进程模型和可观测性.md) |
| 12 | 性能优化、排障和生产规范 | [12-性能优化排障和生产规范.md](study-material/12-性能优化排障和生产规范.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | FastAPI 完整知识点清单 | [14-FastAPI完整知识点清单.md](study-material/14-FastAPI完整知识点清单.md) |
| 15 | 综合练习项目 | [15-综合练习项目.md](study-material/15-综合练习项目.md) |

## 使用建议

先读 [FastApi学习路线图.md](FastApi学习路线图.md)，再按上表顺序推进。每章都包含学习目标、理论导读、心智模型、例子、练习、验收标准、重点、难点和易错点。

准备面试时先看 [13-面试知识点整理.md](study-material/13-面试知识点整理.md)，再按类别阅读 `study-material/面试知识点/`。做项目时重点看第 1、3、5、8、9、10、11、15 章。

## 推荐产出

学习过程中至少完成三个产出：一个 CRUD API、一个带认证和数据库事务的业务服务、一个可容器化部署并具备日志和健康检查的生产模板项目。
