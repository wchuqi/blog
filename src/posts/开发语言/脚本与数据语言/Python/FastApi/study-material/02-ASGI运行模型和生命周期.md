---
title: "FastAPI学习资料：ASGI运行模型和生命周期"
date: 2026-06-20
description: "ASGI 是 Python 异步 Web 应用和服务器之间的协议。Uvicorn 负责网络监听和协议处理，FastAPI 应用按照 ASGI 接口接收 scope、receive、send。对开发者而言，最重要的是知道请求不是直接“调用一个…"
tags:
  - "开发语言"
  - "FastApi"
category: "开发语言"
---

# FastAPI学习资料：ASGI运行模型和生命周期

[返回索引](../FastApi学习资料.md)

## 学习目标

- 理解 ASGI、事件循环、worker 进程和应用生命周期。
- 能区分启动阶段、请求阶段、关闭阶段。
- 能正确初始化数据库连接池、缓存客户端和其他共享资源。

## 理论导读

ASGI 是 Python 异步 Web 应用和服务器之间的协议。Uvicorn 负责网络监听和协议处理，FastAPI 应用按照 ASGI 接口接收 `scope`、`receive`、`send`。对开发者而言，最重要的是知道请求不是直接“调用一个函数”那么简单，而是经过服务器、应用、路由、中间件和依赖解析。

生命周期用于启动和关闭资源。数据库连接池、HTTP 客户端、缓存客户端等应在应用启动时创建，在关闭时释放。不要在每个请求里重复创建昂贵资源，也不要把请求级资源错误地做成全局单例。

## 核心心智模型

ASGI 应用像一个“请求调度器”。每个请求带着自己的上下文进入应用，共享资源挂在应用生命周期里，请求级资源挂在依赖里。

## 生命周期示例

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.cache = {}
    yield
    app.state.cache.clear()


app = FastAPI(lifespan=lifespan)
```

## sync 和 async 边界

| 写法 | 适合场景 | 风险 |
| --- | --- | --- |
| `def` 路由 | 调用阻塞库、CPU 短任务 | 线程池耗尽 |
| `async def` 路由 | 调用异步数据库、异步 HTTP 客户端 | 内部调用阻塞 IO 会卡住事件循环 |
| 后台任务 | 响应后执行短任务 | 不适合可靠任务队列 |
| 多 worker | 多进程并发 | 内存和连接池会按进程复制 |

## 练习

1. 使用 `lifespan` 初始化一个模拟缓存。
2. 在接口里读取 `request.app.state.cache`。
3. 写一个 `async def` 接口，故意调用 `time.sleep`，观察并发请求阻塞。

## 验收

- 能解释 `lifespan` 和请求依赖的边界。
- 能判断一个库是否适合放在 `async def` 路由中直接调用。
- 能说明多 worker 下全局变量为什么不共享。

## 重点

- 生命周期管理应用级资源，依赖管理请求级资源。
- 多进程部署时，每个 worker 都有自己的内存空间和资源池。

## 难点

- async 并发不是并行计算。它适合等待网络和磁盘 IO，不适合直接执行重 CPU 任务。

## 易错

> **易错：** 在 `async def` 中调用阻塞数据库驱动或 `requests.get()`。
>
> 正确做法：使用异步驱动和异步客户端，或把阻塞调用隔离到线程池、任务队列或同步路由。

