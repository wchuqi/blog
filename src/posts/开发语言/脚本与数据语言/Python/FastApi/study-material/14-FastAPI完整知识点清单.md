---
title: "FastAPI学习资料：FastAPI完整知识点清单"
date: 2026-06-20
description: "FastAPI 定位：API 框架、类型标注驱动、自动文档。"
tags:
  - "开发语言"
  - "FastApi"
  - "知识清单"
category: "开发语言"
---

# FastAPI学习资料：FastAPI完整知识点清单

[返回索引](../FastApi学习资料.md)

## 1. 基础和定位

- FastAPI 定位：API 框架、类型标注驱动、自动文档。
- 适用场景：REST API、微服务、内部工具、AI 服务接口。
- 边界：不内置 ORM、任务队列、权限系统、业务架构。
- 技术栈：ASGI、Starlette、Pydantic、Uvicorn。

## 2. 环境和项目结构

- Python 版本选择。
- `fastapi[standard]` 安装。
- `fastapi dev`、`fastapi run`、`uvicorn`。
- `pyproject.toml`、依赖锁定、环境变量。
- 分层目录：api、schemas、services、repositories、db、core、tests。

## 3. ASGI 和运行模型

- ASGI scope、receive、send。
- 请求生命周期。
- 中间件执行顺序。
- 应用 lifespan。
- sync/async 路由。
- worker 进程和线程池。

## 4. 路由和参数

- `APIRouter`。
- 路由注册顺序。
- path、query、header、cookie、body、form、file。
- `Annotated`、`Path`、`Query`、`Body`。
- 状态码、tags、summary、description。

## 5. Pydantic v2 和 Schema

- `BaseModel`、`Field`。
- `model_validate`、`model_dump`。
- 字段校验器和模型校验器。
- 嵌套模型、枚举、泛型模型。
- 输入模型和输出模型拆分。
- OpenAPI Schema 生成。

## 6. 响应和异常

- `response_model`。
- JSONResponse、StreamingResponse、FileResponse。
- `HTTPException`。
- 自定义异常处理器。
- 统一错误码。
- 422 校验错误处理。

## 7. 依赖注入

- `Depends`、`Security`。
- 子依赖和依赖树。
- 请求内依赖缓存。
- `yield` 依赖和资源释放。
- 类依赖、参数化依赖。
- 测试中的依赖覆盖。

## 8. 数据库

- SQLAlchemy 2.x 同步和异步模式。
- Engine、Session、Transaction、Connection Pool。
- Alembic 迁移。
- N+1、分页、索引。
- 事务一致性和回滚。
- 测试数据库和 fixture。

## 9. 安全

- 认证与授权。
- OAuth2 Password Bearer、JWT。
- 密码哈希。
- CORS。
- CSRF、XSS、注入、敏感信息泄露。
- Secret 管理和环境隔离。

## 10. 异步和实时能力

- async/await。
- 阻塞 IO 风险。
- 后台任务。
- WebSocket。
- 任务队列边界。
- CPU 密集任务处理策略。

## 11. 测试和质量

- `TestClient`。
- pytest fixture。
- 依赖覆盖。
- Mock 外部服务。
- 数据库事务回滚测试。
- ruff、mypy、coverage。

## 12. 部署和运维

- 容器镜像。
- 反向代理和 HTTPS。
- worker 数和资源限制。
- 健康检查和优雅关闭。
- 日志、指标、追踪。
- 数据库连接池和迁移流程。

## 13. 性能和排障

- 慢 SQL。
- 事件循环阻塞。
- 连接池耗尽。
- 响应序列化成本。
- 422、401、403、500 诊断。
- 压测和 profiling。

## 14. 版本和兼容性

- FastAPI、Starlette、Pydantic、Uvicorn 版本联动。
- Pydantic v1 到 v2 差异。
- 升级前回归测试。
- 依赖固定和安全更新。

## 自检

- 是否能画出一次请求的完整链路？
- 是否能解释路由匹配顺序和依赖解析顺序？
- 是否能设计输入、输出、错误和认证模型？
- 是否能给数据库 Session、事务和连接池画边界？
- 是否能把本地 demo 改造成可测试、可部署的服务？

