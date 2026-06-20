---
title: "Docker学习资料：网络、端口、DNS 和服务发现"
date: 2026-06-20
description: "Docker 默认使用 bridge 网络。容器加入同一个用户自定义 bridge 网络后，可以通过容器名或 Compose 服务名互相解析。端口发布 -p 是把宿主机端口转发到容器端口，它只解决“宿主机或外部访问容器”的问题，不是容器之间…"
tags:
  - "工具&中间件"
  - "Docker"
category: "工具&中间件"
---

# Docker学习资料：网络、端口、DNS 和服务发现

[返回索引](../Docker学习资料.md)

## 学习目标

- 理解 Docker 网络驱动和容器通信方式。
- 掌握端口发布、容器 DNS、服务名访问。
- 能排查容器网络不通、端口冲突和 DNS 问题。

## 理论导读

Docker 默认使用 bridge 网络。容器加入同一个用户自定义 bridge 网络后，可以通过容器名或 Compose 服务名互相解析。端口发布 `-p` 是把宿主机端口转发到容器端口，它只解决“宿主机或外部访问容器”的问题，不是容器之间通信的必要条件。

## 核心心智模型

区分三条路径：

- 容器访问容器：同一 Docker 网络内用服务名和容器端口。
- 宿主机访问容器：使用 `-p` 发布到宿主机端口。
- 容器访问宿主机：Docker Desktop 常用 `host.docker.internal`，Linux 需要额外配置或网关地址。

## 知识点详解

### 网络驱动

- bridge：单机默认网络，最常用。
- host：容器共享宿主机网络命名空间，隔离弱但性能路径短。
- none：无网络。
- overlay：跨主机网络，常见于 Swarm 等场景。
- macvlan：容器像局域网内独立主机，配置复杂。

### 端口发布

```powershell
docker run -d --name web -p 8080:80 nginx:alpine
```

`8080` 是宿主机端口，`80` 是容器端口。容器之间访问时通常不需要走宿主机映射端口。

### 用户自定义网络

```powershell
docker network create appnet
docker run -d --name redis --network appnet redis:7-alpine
docker run --rm --network appnet redis:7-alpine redis-cli -h redis ping
```

用户自定义 bridge 网络提供内置 DNS，默认 `bridge` 网络能力较弱，不建议作为复杂应用网络。

## 例子

```powershell
docker network inspect appnet
docker exec -it redis sh
docker run --rm --network appnet nicolaka/netshoot nslookup redis
```

## 练习

1. 创建两个网络，让容器分别加入不同网络，验证互通性。
2. 让一个容器同时加入两个网络，观察它能访问哪些服务。
3. 不发布端口，验证同网络容器仍可通过容器端口访问。

## 验收

- 能解释 `ports` 和 `expose` 的区别。
- 能用服务名连接同网络容器。
- 能定位端口占用、DNS 解析失败、网络未加入等问题。

## 重点

- 容器 IP 是临时实现细节，不要写死依赖。
- 同网络容器用容器端口，不用宿主机映射端口。
- 生产排障要区分应用监听地址、容器端口、宿主机端口、防火墙。

## 难点

- 端口发布背后涉及 NAT、代理或内核转发，具体实现受 Docker 版本和系统影响。
- 容器内 `localhost` 指容器自己，不是宿主机，也不是其他容器。

## 易错

> **易错：** 在 Web 容器里用 `localhost:5432` 连接数据库容器。
>
> 正确做法：同一网络下使用数据库服务名，如 `postgres:5432`。

