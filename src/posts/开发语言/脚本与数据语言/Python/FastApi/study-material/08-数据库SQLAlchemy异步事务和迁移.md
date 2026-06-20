---
title: "FastAPI学习资料：数据库、SQLAlchemy、事务和迁移"
date: 2026-06-20
description: "FastAPI 不内置 ORM。数据库集成通常依赖 SQLAlchemy、SQLModel、Tortoise ORM 或原生驱动。生产项目要明确连接池是应用级资源，Session 是请求级工作单元，事务边界由业务用例决定。"
tags:
  - "开发语言"
  - "FastApi"
category: "开发语言"
---

# FastAPI学习资料：数据库、SQLAlchemy、事务和迁移

[返回索引](../FastApi学习资料.md)

## 学习目标

- 会把 SQLAlchemy 2.x 和 FastAPI 集成。
- 理解连接池、Session、事务和请求生命周期。
- 掌握 Alembic 迁移的基本流程。

## 理论导读

FastAPI 不内置 ORM。数据库集成通常依赖 SQLAlchemy、SQLModel、Tortoise ORM 或原生驱动。生产项目要明确连接池是应用级资源，Session 是请求级工作单元，事务边界由业务用例决定。

异步数据库并不自动更快。它适合高并发 IO 等待场景，但如果数据库本身慢、索引缺失、连接池过小或事务过长，async 也不能解决根因。

## 核心心智模型

Session 不是“数据库连接对象”，而是一次业务操作的工作台。它跟踪对象变化、组织 SQL、提交或回滚事务。请求结束时必须关闭。

## 异步 Session 依赖示例

```python
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

engine = create_async_engine(
    "postgresql+asyncpg://user:password@localhost:5432/app",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
```

## 事务模式

```python
async def create_order(session: AsyncSession, payload: OrderCreate):
    async with session.begin():
        order = Order(...)
        session.add(order)
    return order
```

## Alembic 基本流程

```powershell
alembic init migrations
alembic revision --autogenerate -m "create users"
alembic upgrade head
alembic downgrade -1
```

## 练习

实现用户表和订单表，要求：

- 使用 Alembic 生成迁移。
- 创建订单时校验用户存在。
- 库存扣减和订单创建在同一事务中。
- 测试中每个用例回滚数据库变更。

## 验收

- 能解释 engine、connection、session、transaction 的区别。
- 能定位连接池耗尽、事务未提交、懒加载异常等问题。
- 能写迁移脚本并回滚。

## 重点

- 请求级 Session 必须关闭。
- 事务边界应围绕业务一致性，而不是简单围绕单个 SQL。

## 难点

- ORM 对象生命周期、懒加载和异步上下文容易互相影响，需要通过显式查询和清晰的响应模型控制。

## 易错

> **易错：** 在路由函数里手动创建 Session 但异常时不关闭。
>
> 正确做法：使用 `yield` 依赖或上下文管理器统一管理 Session 生命周期。

