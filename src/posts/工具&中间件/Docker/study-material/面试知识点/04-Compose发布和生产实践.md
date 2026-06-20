---
title: "Docker面试知识点：Compose、发布和生产实践"
date: 2026-06-20
description: "Compose 用 YAML 描述多个容器服务的构建、启动、网络、卷、环境变量和依赖关系，适合本地开发、测试环境和小型单机部署。它把多条 docker run 命令固化为可维护配置。"
tags:
  - "工具&中间件"
  - "Docker"
  - "面试"
category: "工具&中间件"
---

# Docker面试知识点：Compose、发布和生产实践

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../Docker学习资料.md)

## 一、Compose

### 1. Docker Compose 解决什么问题？

**参考答案：**

Compose 用 YAML 描述多个容器服务的构建、启动、网络、卷、环境变量和依赖关系，适合本地开发、测试环境和小型单机部署。它把多条 `docker run` 命令固化为可维护配置。

### 2. depends_on 能保证数据库可用吗？

**参考答案：**

不能完全保证。`depends_on` 主要控制启动顺序；数据库进程启动不代表已经能接受连接。应配合 healthcheck，并让应用具备连接重试能力。

> **易错：** 把启动顺序当成可用性保证。

### 3. docker compose down 和 down -v 有什么区别？

**参考答案：**

`down` 删除容器和默认网络；`down -v` 还会删除 Compose 声明的 volume。后者可能删除数据库数据，执行前必须确认。

## 二、发布

### 4. 生产为什么不建议使用 latest？

**参考答案：**

`latest` 是可变 tag，不能保证每次拉取的镜像内容一致，也不利于回滚和审计。生产应使用明确版本，并记录 digest、Git commit 和构建信息。

### 5. Docker 在 CI/CD 中通常怎么用？

**参考答案：**

CI 中先测试源码，再构建镜像，进行镜像级测试、漏洞扫描和敏感信息扫描，随后推送 registry。部署系统根据版本或 digest 拉取镜像并运行。

### 6. Docker 和 Kubernetes 是什么关系？

**参考答案：**

Docker 常用于构建镜像和本地运行容器；Kubernetes 负责集群调度、服务发现、扩缩容、自愈、滚动发布等。Kubernetes 运行的是符合 OCI 规范的容器镜像，不要求一定使用 Docker daemon 作为运行时。

> **重点：** Docker 是容器和镜像工具链，Kubernetes 是集群编排平台。

