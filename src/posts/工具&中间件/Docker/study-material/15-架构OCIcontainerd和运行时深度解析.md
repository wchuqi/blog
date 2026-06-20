---
title: "Docker学习资料：架构、OCI、containerd 和运行时深度解析"
date: 2026-06-20
description: "Docker 不是一个单独程序完成所有事情。用户看到的是 docker 命令，背后有一条分层链路：CLI 把请求发给 Docker daemon；daemon 负责高级对象管理，例如镜像、容器、网络、卷；daemon 再调用 contain…"
tags:
  - "工具&中间件"
  - "Docker"
  - "深度解析"
category: "工具&中间件"
---

# Docker学习资料：架构、OCI、containerd 和运行时深度解析

[返回索引](../Docker学习资料.md)

## 学习目标

- 能解释从 `docker run` 到容器进程启动的完整链路。
- 理解 Docker daemon、containerd、containerd-shim、runc、OCI 的职责边界。
- 能判断故障发生在 CLI、daemon、镜像分发、运行时、应用进程还是宿主机。

## 理论导读

Docker 不是一个单独程序完成所有事情。用户看到的是 `docker` 命令，背后有一条分层链路：CLI 把请求发给 Docker daemon；daemon 负责高级对象管理，例如镜像、容器、网络、卷；daemon 再调用 containerd 管理容器生命周期和镜像内容；containerd 通过 shim 管理具体容器任务；runc 根据 OCI Runtime Spec 创建 Linux 容器。

这个拆分的意义是职责隔离。Docker daemon 可以重启，容器进程不应该因此全部退出；containerd 更接近标准容器运行时；runc 是一次性创建容器的低层工具，创建完成后不长期管理业务进程。

## 核心心智模型

把 Docker 架构想成“调度单据到车间执行”：

- Docker CLI：提交单据。
- Docker daemon：审核单据，准备镜像、网络、卷、元数据。
- containerd：管理执行任务和镜像内容。
- containerd-shim：守在具体容器旁边，转发 IO、收集退出码，让容器不依赖 daemon 进程。
- runc：按 OCI 配置真正创建隔离环境并启动进程。

## `docker run` 背后的步骤

以 `docker run -d --name web -p 8080:80 nginx:alpine` 为例，简化链路如下：

1. CLI 解析命令参数，把创建容器请求发送给 Docker daemon。
2. daemon 判断本地是否存在 `nginx:alpine`，不存在则解析 registry、repository、tag。
3. daemon 拉取 manifest、config 和 layer，校验 digest，解压或挂载为本地镜像层。
4. daemon 创建容器元数据，准备容器可写层。
5. daemon 创建或选择网络，分配 IP，准备 veth、bridge、DNS 记录和端口发布规则。
6. daemon 准备 mount，包括 rootfs、volume、bind mount、tmpfs。
7. daemon 生成 OCI runtime config，包括进程命令、环境变量、工作目录、namespace、cgroup、capability、seccomp。
8. containerd 创建 task，shim 启动，runc 按 OCI config 创建容器进程。
9. 容器 PID 1 启动，Docker 记录状态，日志从 stdout/stderr 进入日志驱动。

> **重点：** `docker run` 不是一个动作，而是镜像解析、对象创建、网络配置、挂载配置、运行时启动的组合。

## OCI 是什么

OCI 主要提供两个关键规范：

- OCI Image Spec：描述镜像内容如何组织，包括 manifest、config、layer、media type。
- OCI Runtime Spec：描述如何运行容器，包括 rootfs、process、mounts、linux namespaces、cgroups、capabilities。

OCI 的价值是让镜像和运行时不被单一厂商工具锁死。符合 OCI 的镜像可以被不同容器工具使用，符合 OCI Runtime Spec 的运行时也能运行标准容器配置。

## Docker daemon 和 containerd 的边界

| 组件 | 主要职责 | 不该混淆的点 |
| --- | --- | --- |
| Docker daemon | Docker API、镜像管理、容器元数据、网络、卷、构建入口 | 它不是唯一低层运行时 |
| containerd | 镜像内容、snapshot、容器 task 生命周期 | 它更底层，不负责 Docker 全部用户体验 |
| containerd-shim | 持有容器 stdio、等待退出、报告状态 | 它让容器能在 daemon 重启时继续运行 |
| runc | 按 OCI config 创建容器 | 它通常创建后退出，不长期守护业务进程 |

## Docker Desktop 的特殊性

在 Windows 和 macOS 上，Linux 容器通常运行在 Docker Desktop 管理的 Linux VM 中。这会影响：

- 文件挂载性能：宿主机路径需要跨虚拟化边界。
- 网络语义：`localhost`、`host.docker.internal`、端口转发与原生 Linux 不完全一样。
- 磁盘位置：镜像、容器和 volume 实际存储在 VM 的磁盘镜像中。
- 权限表现：Windows/macOS 文件权限和 Linux UID/GID 语义存在转换。

> **易错：** 在 Docker Desktop 下看到的宿主机路径，不等于容器真正运行的 Linux 文件系统路径。

## 例子：观察运行时链路

Linux 上可以观察 daemon、containerd 和 shim 进程：

```bash
ps -ef | grep -E 'dockerd|containerd|containerd-shim|runc'
docker run -d --name runtime-demo nginx:alpine
docker inspect runtime-demo --format '{{.State.Pid}}'
ps -ef | grep containerd-shim
docker rm -f runtime-demo
```

Windows Docker Desktop 环境中，这些进程多在内部 Linux VM 中，不能完全按 Linux 宿主机方式观察。

## 练习

1. 画出 `docker run` 的 9 步链路，并标注每一步可能失败的原因。
2. 用 `docker inspect` 找到容器的 PID、Entrypoint、Cmd、Mounts、NetworkSettings。
3. 停止 Docker daemon 或重启 Docker Desktop，观察已有容器状态变化。

## 验收

- 能解释 daemon 重启和容器进程之间的关系。
- 能说明 OCI Image Spec 和 Runtime Spec 分别描述什么。
- 能把启动失败归类到镜像、配置、网络、挂载、运行时或应用层。

## 难点

- Docker 的用户界面隐藏了 containerd 和 runc，导致很多人把所有行为都归因于 daemon。
- Desktop 环境和 Linux 原生环境差异大，排障时必须先确认真实运行位置。

## 易错

> **易错：** 认为 Docker daemon 一退出，所有容器必然退出。
>
> 正确做法：理解 shim 和 containerd 的作用，再结合具体系统和 Docker 配置验证。

