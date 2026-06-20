---
title: "Docker学习资料：Docker Compose 多容器编排"
date: 2026-06-20
description: "Compose 把一组 docker run 参数写成声明式 YAML。它适合本地开发、测试环境、小型单机部署和中间件组合。Compose 的核心对象是 project，project 下有多个 service。每个 service 可以创…"
tags:
  - "工具&中间件"
  - "Docker"
category: "工具&中间件"
---

# Docker学习资料：Docker Compose 多容器编排

[返回索引](../Docker学习资料.md)

## 学习目标

- 使用 Compose 定义多容器开发环境。
- 掌握 service、network、volume、environment、depends_on、healthcheck。
- 理解 Compose 适合单机编排，不等于 Kubernetes。

## 理论导读

Compose 把一组 `docker run` 参数写成声明式 YAML。它适合本地开发、测试环境、小型单机部署和中间件组合。Compose 的核心对象是 project，project 下有多个 service。每个 service 可以创建一个或多个容器，并自动加入项目网络。

## 核心心智模型

Compose 文件是“应用拓扑图”：服务怎么构建、怎么启动、挂载什么数据、暴露什么端口、连接哪些网络。服务名就是默认 DNS 名称。

## 知识点详解

### 最小 Compose 示例

```yaml
services:
  web:
    build: .
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/app
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  pgdata:
```

### 常用命令

```powershell
docker compose up -d
docker compose ps
docker compose logs -f web
docker compose exec web sh
docker compose down
docker compose down -v
```

### depends_on 的边界

`depends_on` 控制启动顺序，不天然保证应用已经可用。要配合 `healthcheck` 和应用层重试。数据库启动进程存在，不代表已经接受连接。

## 例子

开发场景中，Web 服务代码用 bind mount，数据库用 volume。生产镜像中通常不挂源码，而使用构建好的镜像和外部配置。

## 练习

1. 写一个 Web + Redis 的 Compose 文件。
2. 添加 PostgreSQL，并让 Web 通过服务名连接。
3. 使用 `docker compose down -v` 删除 volume，观察数据变化。

## 验收

- 能写出三服务 Compose 文件。
- 能解释 project、service、container 的关系。
- 能用 Compose 查看日志、进入容器、重建镜像。

## 重点

- Compose 默认给项目创建网络，服务名可作为 DNS 名。
- `down -v` 会删除声明的匿名或命名 volume，使用前要确认数据价值。
- Compose 是单机开发和小规模编排工具，不负责复杂集群调度。

## 难点

- YAML 缩进错误会导致配置语义变化。
- 变量来源可能包括 shell 环境、`.env` 文件和 Compose 文件内默认值。

## 易错

> **易错：** 认为 `depends_on` 能保证数据库完全可用。
>
> 正确做法：增加 healthcheck，并让应用启动时具备连接重试。

