---
title: "Docker学习路线图"
date: 2026-06-20
description: "目标：理解 Docker 解决的问题，区分镜像、容器、仓库、Dockerfile、Compose。"
tags:
  - "工具&中间件"
  - "Docker"
  - "学习路线图"
category: "工具&中间件"
---

# Docker学习路线图

## 阶段 1：基础认知

- 目标：理解 Docker 解决的问题，区分镜像、容器、仓库、Dockerfile、Compose。
- 需要掌握：Docker Engine、Docker CLI、镜像分层、容器进程、端口映射、数据卷。
- 例子：运行 `nginx`、`redis`、`postgres`，观察容器状态和日志。
- 练习：用 `docker run` 启动一个 Nginx，将宿主机 `8080` 映射到容器 `80`。
- 验收：能解释“镜像是模板，容器是运行中的进程隔离环境”。
- 重点：Docker 不是虚拟机，它共享宿主机内核。
- 易错：把容器当成完整服务器，在容器里长期手工修改配置。

## 阶段 2：镜像构建和容器运行

- 目标：能写出可维护、可缓存、体积合理的 Dockerfile。
- 需要掌握：构建上下文、`.dockerignore`、多阶段构建、`ENTRYPOINT` 和 `CMD`、构建缓存。
- 例子：为一个 Java、Node 或 Python 项目构建生产镜像。
- 练习：构建一个最小 Web 服务镜像，并用环境变量控制端口或配置。
- 验收：能解释 Dockerfile 每条指令如何影响镜像层和缓存。
- 重点：构建上下文会被发送给 Docker daemon，不能把敏感文件放进去。
- 易错：把源码、密钥、构建缓存、依赖下载目录全部塞进最终镜像。

## 阶段 3：网络、存储和多容器协作

- 目标：能让多个容器稳定通信，能正确保存状态数据。
- 需要掌握：bridge 网络、端口发布、容器 DNS、volume、bind mount、Compose service。
- 例子：用 Compose 启动 Web、PostgreSQL、Redis 三个服务。
- 练习：实现 Web 服务通过服务名连接数据库，而不是写死 IP。
- 验收：能排查“宿主机能访问但容器不能访问”“容器删了数据没了”等问题。
- 重点：容器 IP 不应作为长期依赖，服务名和网络才是稳定抽象。
- 易错：数据库数据直接放在容器可写层，删除容器后数据丢失。

## 阶段 4：安全、发布和生产实践

- 目标：能把 Docker 用在真实团队开发、CI 构建、测试环境和生产发布中。
- 需要掌握：非 root 用户、只读文件系统、镜像扫描、标签策略、私有仓库、日志驱动、资源限制。
- 例子：CI 构建镜像，推送到 registry，再由部署系统拉取固定 digest。
- 练习：为镜像加非 root 用户、健康检查和资源限制。
- 验收：能说明为什么生产发布不能只依赖 `latest` 标签。
- 重点：镜像是供应链产物，必须可追溯、可扫描、可回滚。
- 易错：把数据库密码写进 Dockerfile 或镜像层。

## 阶段 5：排障和深入机制

- 目标：能定位容器启动失败、网络不通、磁盘膨胀、性能异常和权限问题。
- 需要掌握：`inspect`、`events`、`stats`、日志、namespace、cgroup、overlay2、iptables/nftables。
- 例子：容器反复重启、端口占用、volume 权限错误、镜像构建缓存失效。
- 练习：故意制造启动命令错误、端口冲突和挂载路径权限问题，并写排障记录。
- 验收：能从现象推到 Docker 层、应用层、宿主机层的边界。
- 重点：Docker 排障要先分层，避免在错误层面浪费时间。
- 易错：看到容器 exited 就直接重建镜像，没有先看日志和退出码。

## 阶段 6：底层架构和生产深水区

- 目标：能从 Docker CLI 一路解释到 daemon、containerd、runc、OCI spec、namespace、cgroup、overlay2、iptables 和 registry。
- 需要掌握：OCI image/runtime spec、containerd shim、PID 1 信号、copy-on-write、BuildKit LLB、capability、seccomp、日志驱动、digest 和 SBOM。
- 例子：解释一次 `docker run -p 8080:80 nginx` 背后发生的镜像解析、容器创建、网络配置、挂载和进程启动步骤。
- 练习：按 23 的实验手册完成运行时、网络、存储、安全和故障注入实验。
- 验收：能用分层模型判断问题属于应用、镜像、运行时、网络、存储、宿主机还是供应链。
- 重点：深入 Docker 不是背命令，而是掌握对象状态、运行路径和失败边界。
- 易错：把所有问题都归因于 Docker，忽略应用监听地址、镜像入口、宿主机防火墙、DNS、磁盘和权限。

## 推荐学习节奏

| 周期 | 学习重点 | 产出 |
| --- | --- | --- |
| 第 1 周 | 基本概念、安装、run/logs/exec | 能运行和进入常见容器 |
| 第 2 周 | Dockerfile、镜像构建、缓存 | 一个可复现的应用镜像 |
| 第 3 周 | 网络、存储、Compose | 一个三服务开发环境 |
| 第 4 周 | 安全、CI、排障 | 一份生产化 Docker 清单和排障手册 |
| 第 5 周 | 架构、overlay2、BuildKit、runtime | 一张 Docker 底层链路图和缓存分析记录 |
| 第 6 周 | 网络、存储、安全、故障注入 | 一份生产排障剧本和能力验收报告 |

## 最终能力清单

- 能独立编写 Dockerfile 和 Compose 文件。
- 能解释镜像分层、容器生命周期、网络和 volume 的核心机制。
- 能处理常见启动、网络、权限、日志、磁盘和性能问题。
- 能设计团队可维护的镜像标签、仓库、CI 构建和发布策略。
- 能在面试中回答 Docker 与虚拟机、Kubernetes、Compose、namespace、cgroup、overlay2 的关系。
- 能解释 `docker run`、`docker build`、`docker compose up` 背后的解析顺序、对象创建顺序和失败边界。
