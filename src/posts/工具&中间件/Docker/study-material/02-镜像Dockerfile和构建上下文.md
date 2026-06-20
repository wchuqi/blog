---
title: "Docker学习资料：镜像、Dockerfile 和构建上下文"
date: 2026-06-20
description: "Docker 镜像由多层只读文件系统叠加而成。Dockerfile 中多数指令会生成新层，构建时 Docker 会按顺序执行指令并尽量复用缓存。缓存命中依赖指令文本和参与该指令的文件内容，所以 Dockerfile 的顺序会直接影响构建速度…"
tags:
  - "工具&中间件"
  - "Docker"
category: "工具&中间件"
---

# Docker学习资料：镜像、Dockerfile 和构建上下文

[返回索引](../Docker学习资料.md)

## 学习目标

- 理解镜像分层、Dockerfile 指令、构建上下文和缓存。
- 能写出可复现、体积合理、安全的 Dockerfile。
- 掌握多阶段构建和 `.dockerignore`。

## 理论导读

Docker 镜像由多层只读文件系统叠加而成。Dockerfile 中多数指令会生成新层，构建时 Docker 会按顺序执行指令并尽量复用缓存。缓存命中依赖指令文本和参与该指令的文件内容，所以 Dockerfile 的顺序会直接影响构建速度。

构建上下文是 `docker build` 发送给构建器的一组文件。命令 `docker build -t app .` 中最后的 `.` 就是上下文目录。上下文过大不仅慢，还可能把密钥、日志、依赖缓存、Git 历史发送给构建器。

## 核心心智模型

构建镜像像做千层饼：每条指令叠一层。前面的层变化会让后面缓存全部失效。优秀的 Dockerfile 会把“不常变化的依赖安装”放前面，把“经常变化的源码复制”放后面。

## 知识点详解

### 常见 Dockerfile 指令

- `FROM`：指定基础镜像。
- `WORKDIR`：设置工作目录。
- `COPY`：从构建上下文复制文件。
- `RUN`：构建时执行命令。
- `ENV`：设置环境变量。
- `EXPOSE`：声明容器内服务端口，不自动发布宿主机端口。
- `USER`：指定运行用户。
- `ENTRYPOINT`：主入口命令。
- `CMD`：默认参数或默认命令。

### ENTRYPOINT 和 CMD

`ENTRYPOINT` 更像固定可执行程序，`CMD` 更像默认参数。两者都存在时，容器启动命令通常是 `ENTRYPOINT + CMD`。如果应用镜像必须固定启动某个程序，用 `ENTRYPOINT`；如果只是给默认启动命令，用 `CMD`。

### 多阶段构建

多阶段构建把编译环境和运行环境分开。第一阶段安装编译工具并产出二进制或构建结果，最终阶段只复制运行所需文件，减少镜像体积和攻击面。

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/target/app.jar /app/app.jar
USER 10001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

### .dockerignore

```gitignore
.git
target
node_modules
.env
*.log
Dockerfile*
docker-compose*.yml
```

`.dockerignore` 控制哪些文件不进入构建上下文。它不是镜像内忽略文件，而是构建输入过滤器。

## 例子

```powershell
docker build -t demo/app:1.0 .
docker image history demo/app:1.0
docker run --rm demo/app:1.0
```

## 练习

1. 为一个简单 Web 项目写 Dockerfile。
2. 故意修改依赖文件和源码文件，观察缓存命中差异。
3. 用多阶段构建把最终镜像体积减小。

## 验收

- 能解释构建上下文和 `.dockerignore`。
- 能说明 Dockerfile 指令顺序为什么影响构建速度。
- 能写出包含非 root 用户、多阶段构建和固定基础镜像标签的 Dockerfile。

## 重点

- 镜像层是只读的，容器运行时再叠加可写层。
- 生产镜像应尽量小、可复现、少权限、少工具。
- 不要把密钥写入 Dockerfile、构建参数或镜像层。

## 难点

- 构建缓存不仅看命令，还看参与文件内容。
- `ARG` 是构建期变量，`ENV` 是镜像运行期默认环境变量。
- `EXPOSE` 只声明端口，真正发布端口要用 `-p` 或 Compose `ports`。

## 易错

> **易错：** `COPY . .` 之前没有 `.dockerignore`，导致密钥和无关文件进入构建上下文。
>
> 正确做法：先写 `.dockerignore`，再设计 Dockerfile。

> **易错：** 生产长期使用 `latest` 基础镜像。
>
> 正确做法：固定明确版本，关键场景使用 digest 锁定。

