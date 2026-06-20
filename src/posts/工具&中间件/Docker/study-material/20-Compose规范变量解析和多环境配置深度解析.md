---
title: "Docker学习资料：Compose 规范、变量解析和多环境配置深度解析"
date: 2026-06-20
description: "Compose 的复杂度不在“写 YAML”，而在配置解析和运行边界。一个 Compose 项目会根据项目名创建带前缀的网络、容器、volume。变量可能来自 shell 环境、.env 文件、Compose 文件默认值和 envfile，…"
tags:
  - "工具&中间件"
  - "Docker"
  - "深度解析"
category: "工具&中间件"
---

# Docker学习资料：Compose 规范、变量解析和多环境配置深度解析

[返回索引](../Docker学习资料.md)

## 学习目标

- 理解 Compose project、service、profile、network、volume 的对象模型。
- 掌握变量解析、配置合并、多环境覆盖和启动顺序边界。
- 能设计可维护的开发、测试和准生产 Compose 配置。

## 理论导读

Compose 的复杂度不在“写 YAML”，而在配置解析和运行边界。一个 Compose 项目会根据项目名创建带前缀的网络、容器、volume。变量可能来自 shell 环境、`.env` 文件、Compose 文件默认值和 `env_file`，不同位置的变量作用不同。多文件合并时，映射、列表和标量字段的覆盖规则也会影响最终结果。

## 对象模型

- project：一次 Compose 应用实例，决定资源名前缀。
- service：服务定义，可以扩展为一个或多个容器。
- container：service 的运行实例。
- network：服务通信边界。
- volume：持久化数据对象。
- profile：按场景启用部分服务。

```bash
docker compose -p demo up -d
docker compose ls
docker compose ps
```

## 配置解析顺序

推荐先执行：

```bash
docker compose config
```

它会输出解析后的最终配置，有助于发现变量替换、路径、端口和合并问题。

### `.env` 与 `env_file`

`.env` 常用于 Compose 文件中的变量替换：

```yaml
services:
  app:
    image: "${APP_IMAGE:-app:local}"
```

`env_file` 用于把变量注入容器环境：

```yaml
services:
  app:
    env_file:
      - app.env
```

> **易错：** `.env` 和 `env_file` 不是一回事。前者偏 Compose 解析，后者偏容器运行环境注入。

## 多文件覆盖

常见模式：

```bash
docker compose -f compose.yml -f compose.dev.yml up -d
docker compose -f compose.yml -f compose.prod.yml config
```

设计建议：

- `compose.yml` 放通用服务拓扑。
- `compose.dev.yml` 放开发挂载、调试端口、mock 服务。
- `compose.prod.yml` 放生产镜像、资源限制、日志和安全参数。

不要让开发覆盖文件改变核心服务名，否则会破坏服务发现和脚本稳定性。

## depends_on 和健康检查

`depends_on` 的关键边界：

- 控制服务启动顺序。
- 不保证应用协议可用，除非结合 healthcheck 条件。
- 不替代应用层重试。

```yaml
depends_on:
  db:
    condition: service_healthy
```

真实系统中，应用仍应对数据库连接失败进行重试，因为运行过程中数据库也可能重启。

## profiles

profiles 适合按场景启用服务：

```yaml
services:
  adminer:
    image: adminer
    profiles: ["debug"]
```

```bash
docker compose --profile debug up -d
```

## 配置设计原则

- 服务名稳定，避免频繁变更。
- 内部服务不随意发布宿主机端口。
- 有状态服务显式使用 named volume。
- secret 不写入镜像，不提交到仓库。
- `docker compose config` 作为提交前检查。
- `down -v` 写入文档并标明删除数据风险。

## 练习

1. 写 `compose.yml`、`compose.dev.yml`、`compose.prod.yml` 三个文件，并比较 `config` 输出。
2. 用 `.env` 控制镜像 tag，用 `env_file` 注入应用运行变量。
3. 使用 profile 增加调试工具服务。
4. 故意制造变量未定义，观察 Compose 报警和默认值行为。

## 验收

- 能解释 Compose 变量替换和容器环境变量注入的区别。
- 能用 `docker compose config` 找到最终配置。
- 能设计一个不暴露内部服务端口、支持多环境覆盖的 Compose 项目。

## 难点

- 多文件合并后最终结果不总是直觉上的“追加”，必须看 `config`。
- 环境变量优先级容易和应用框架自身配置优先级叠加，排障时要分开。

## 易错

> **易错：** 在 Compose 文件中写了 `${DB_PASSWORD}`，以为它自动进入容器环境。
>
> 正确做法：变量替换只是生成 Compose 配置；容器是否有该环境变量取决于 `environment` 或 `env_file`。

