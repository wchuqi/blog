---
title: "Docker学习资料：镜像分层、overlay2、BuildKit 和缓存深度解析"
date: 2026-06-20
description: "镜像不是一个压缩包，而是元数据和多个文件系统层的组合。registry 存储的是内容寻址的 blob；本地运行时会把层准备成可挂载的 rootfs。overlay2 通过叠加多个只读层和一个可写层，让容器看到统一文件系统。构建时，Build…"
tags:
  - "工具&中间件"
  - "Docker"
  - "深度解析"
category: "工具&中间件"
---

# Docker学习资料：镜像分层、overlay2、BuildKit 和缓存深度解析

[返回索引](../Docker学习资料.md)

## 学习目标

- 理解镜像 manifest、config、layer、digest、diffID 的关系。
- 掌握 overlay2 的 lowerdir、upperdir、workdir、merged 和 copy-on-write。
- 理解 BuildKit 的缓存、secret mount、cache mount、多阶段和多架构构建。

## 理论导读

镜像不是一个压缩包，而是元数据和多个文件系统层的组合。registry 存储的是内容寻址的 blob；本地运行时会把层准备成可挂载的 rootfs。overlay2 通过叠加多个只读层和一个可写层，让容器看到统一文件系统。构建时，BuildKit 不只是逐行执行 Dockerfile，它会把构建转换为低层构建图，尽量并行、复用和导入导出缓存。

## 镜像对象模型

一个镜像通常包含：

- manifest：列出 config 和 layers 的 digest、大小、media type。
- config：包含环境变量、Entrypoint、Cmd、工作目录、历史记录、rootfs diffIDs。
- layer：文件系统差异包，通常是 tar gzip 等压缩形式。
- digest：内容哈希，用于校验和不可变引用。

tag 指向 manifest，manifest 指向 config 和 layers。tag 可以变，digest 不随意变。

```text
repository:tag
  -> manifest digest
       -> config digest
       -> layer digest 1
       -> layer digest 2
       -> layer digest 3
```

## overlay2 机制

overlay2 挂载一般涉及：

- lowerdir：镜像只读层，可有多个。
- upperdir：容器可写层。
- workdir：overlay 文件系统工作目录。
- merged：容器最终看到的合并目录。

当容器读取文件时，如果 upperdir 没有，就从 lowerdir 读取。当容器修改 lowerdir 中已有文件时，会触发 copy-on-write：先把文件复制到 upperdir，再修改 upperdir 中的副本。当容器删除 lowerdir 中的文件时，会在 upperdir 写入 whiteout 标记，让 merged 视图中看不到该文件。

> **重点：** 删除镜像层中的大文件并不会让最终镜像一定变小。如果大文件在前一层已经存在，后一层删除只是增加 whiteout 标记。

## Dockerfile 层设计规则

### 依赖层前置

```dockerfile
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
```

依赖描述文件不变时，`npm ci` 层可复用；源码变化只影响后面的层。

### 同层清理

错误示例：

```dockerfile
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*
```

更合理：

```dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```

因为清理必须发生在产生缓存文件的同一层里，否则前一层仍保存缓存内容。

## BuildKit 深度能力

### cache mount

cache mount 适合包管理器缓存，加快构建，但不把缓存写入最终镜像层。

```dockerfile
# syntax=docker/dockerfile:1
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -DskipTests package
```

### secret mount

构建时需要私有仓库 token 时，不要用 `ARG TOKEN`。secret mount 在构建期间临时可用，不进入镜像层。

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
```

```bash
docker build --secret id=npmrc,src=.npmrc -t app:local .
```

### 多架构构建

多架构镜像通常由 manifest list 指向不同平台的 manifest。相同 tag 在 `linux/amd64` 和 `linux/arm64` 机器上可能拉到不同镜像内容。

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t registry.example.com/app:1.0 --push .
```

## 缓存失效规则

- Dockerfile 指令文本变化会影响缓存。
- `COPY`、`ADD` 参与文件内容变化会影响缓存。
- 前置层失效会导致后续层重新计算。
- `RUN apt-get update` 这类命令本身不会自动因为远程仓库变化而失效，可能需要主动刷新。
- 构建参数 `ARG` 参与某层命令时会影响该层缓存。

## 例子：分析镜像历史

```bash
docker build -t cache-demo .
docker image history cache-demo
docker inspect cache-demo --format '{{json .RootFS.Layers}}'
docker system df -v
```

## 练习

1. 构造一个 Dockerfile，先复制全部源码再安装依赖，记录构建时间；再调整为依赖文件前置，比较缓存命中。
2. 构建一个包含大文件再删除的镜像，观察镜像体积。
3. 使用 BuildKit cache mount 构建 Maven、npm 或 pip 项目。
4. 用 secret mount 访问私有依赖，确认 secret 不在镜像历史中。

## 验收

- 能解释为什么“删除文件不一定减小镜像”。
- 能画出 tag、manifest、config、layer 的关系。
- 能设计一个构建快、体积合理、密钥不泄漏的 Dockerfile。

## 难点

- layer digest 是压缩内容哈希，diffID 是未压缩层内容哈希，排查镜像底层时要区分。
- BuildKit 缓存可以导入导出，CI 中如果没有缓存策略，每次构建仍可能很慢。

## 易错

> **易错：** 用 `ARG` 传私有 token，然后认为构建完就消失了。
>
> 正确做法：使用 BuildKit secret mount，避免 secret 进入层、历史记录和日志。

