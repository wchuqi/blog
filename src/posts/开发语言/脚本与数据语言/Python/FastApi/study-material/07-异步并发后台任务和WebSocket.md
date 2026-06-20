---
title: "FastAPI学习资料：异步并发、后台任务和 WebSocket"
date: 2026-06-20
description: "FastAPI 支持同步和异步路由。异步路由适合调用异步数据库、异步 HTTP 客户端、异步缓存客户端等 IO 密集型操作。同步阻塞代码放进 async def 会阻塞事件循环，影响同一 worker 的其他请求。"
tags:
  - "开发语言"
  - "FastApi"
category: "开发语言"
---

# FastAPI学习资料：异步并发、后台任务和 WebSocket

[返回索引](../FastApi学习资料.md)

## 学习目标

- 理解 async/await、事件循环和阻塞调用的边界。
- 会使用后台任务和 WebSocket。
- 能判断什么时候需要任务队列。

## 理论导读

FastAPI 支持同步和异步路由。异步路由适合调用异步数据库、异步 HTTP 客户端、异步缓存客户端等 IO 密集型操作。同步阻塞代码放进 `async def` 会阻塞事件循环，影响同一 worker 的其他请求。

后台任务适合响应后执行短小、允许失败影响较低的动作，例如写审计日志、发送轻量通知。不适合可靠投递、重试、长耗时任务和跨进程任务调度，这些应使用 Celery、RQ、Dramatiq 或消息队列。

## 核心心智模型

事件循环像一个单线程调度员，遇到 `await` 才能把时间让给其他任务。如果你在它面前执行阻塞操作，所有协作任务都得等。

## 示例

```python
from fastapi import BackgroundTasks, FastAPI, WebSocket

app = FastAPI()


def write_audit_log(message: str) -> None:
    print(message)


@app.post("/payments")
async def pay(background_tasks: BackgroundTasks):
    background_tasks.add_task(write_audit_log, "payment created")
    return {"status": "accepted"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        text = await websocket.receive_text()
        await websocket.send_text(f"echo: {text}")
```

## 判断规则

| 需求 | 推荐方式 |
| --- | --- |
| 等待异步数据库查询 | `async def` + 异步驱动 |
| 调用同步 SDK | 同步路由或线程池隔离 |
| 发送短日志 | `BackgroundTasks` |
| 发送必须成功的短信 | 任务队列 |
| 长时间双向通信 | WebSocket |
| CPU 密集计算 | 进程池、独立服务或任务系统 |

## 练习

写一个接口调用异步 HTTP 客户端请求外部服务，再写一个错误版本使用 `requests`，用并发压测观察差异。

## 验收

- 能解释 `async def` 何时有收益。
- 能说明后台任务的可靠性边界。
- 能实现一个简单 WebSocket echo。

## 重点

- async 的价值在于释放等待时间，不是提升单个 CPU 任务速度。

## 难点

- 真实系统中阻塞可能藏在第三方 SDK、DNS、文件 IO、日志 handler 或数据库驱动里。

## 易错

> **易错：** 用 `BackgroundTasks` 做订单支付、扣库存、发货等关键流程。
>
> 正确做法：关键异步流程需要持久化状态、重试、幂等和监控，应使用任务队列或事件系统。

