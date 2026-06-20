---
title: "Docker学习资料"
date: 2026-06-20
description: "这是一份面向后端开发、运维和 DevOps 入门到进阶的 Docker 学习资料。详细内容按知识点拆分到 study-material/ 目录，建议配合本机 Docker Desktop、Linux Docker Engine 或远程实验机…"
tags:
  - "工具&中间件"
  - "Docker"
  - "学习资料总览"
category: "工具&中间件"
---

# Docker学习资料

这是一份面向后端开发、运维和 DevOps 入门到进阶的 Docker 学习资料。详细内容按知识点拆分到 `study-material/` 目录，建议配合本机 Docker Desktop、Linux Docker Engine 或远程实验机练习。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 安装环境和基本命令 | [01-安装环境和基本命令.md](study-material/01-安装环境和基本命令.md) |
| 2 | 镜像、Dockerfile 和构建上下文 | [02-镜像Dockerfile和构建上下文.md](study-material/02-镜像Dockerfile和构建上下文.md) |
| 3 | 容器生命周期和资源隔离 | [03-容器生命周期和资源隔离.md](study-material/03-容器生命周期和资源隔离.md) |
| 4 | 数据卷、绑定挂载和持久化 | [04-数据卷绑定挂载和持久化.md](study-material/04-数据卷绑定挂载和持久化.md) |
| 5 | 网络、端口、DNS 和服务发现 | [05-网络端口DNS和服务发现.md](study-material/05-网络端口DNS和服务发现.md) |
| 6 | Docker Compose 多容器编排 | [06-DockerCompose多容器编排.md](study-material/06-DockerCompose多容器编排.md) |
| 7 | 仓库、标签、推送和版本管理 | [07-仓库标签推送和版本管理.md](study-material/07-仓库标签推送和版本管理.md) |
| 8 | 安全、权限、Secrets 和供应链 | [08-安全权限Secrets和镜像供应链.md](study-material/08-安全权限Secrets和镜像供应链.md) |
| 9 | 日志、监控、排障和性能 | [09-日志监控排障和性能.md](study-material/09-日志监控排障和性能.md) |
| 10 | 生产实践、CI 和发布 | [10-生产实践CI和发布.md](study-material/10-生产实践CI和发布.md) |
| 11 | 综合练习项目 | [11-综合练习项目.md](study-material/11-综合练习项目.md) |
| 12 | 命令速查 | [12-命令速查.md](study-material/12-命令速查.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | Docker 完整知识点清单 | [14-Docker完整知识点清单.md](study-material/14-Docker完整知识点清单.md) |
| 15 | 架构、OCI、containerd 和运行时深度解析 | [15-架构OCIcontainerd和运行时深度解析.md](study-material/15-架构OCIcontainerd和运行时深度解析.md) |
| 16 | 镜像分层、overlay2、BuildKit 和缓存深度解析 | [16-镜像分层overlay2BuildKit和缓存深度解析.md](study-material/16-镜像分层overlay2BuildKit和缓存深度解析.md) |
| 17 | namespace、cgroup、capability 和安全边界深度解析 | [17-namespacecgroupCapability和安全边界深度解析.md](study-material/17-namespacecgroupCapability和安全边界深度解析.md) |
| 18 | Docker 网络、iptables、DNS 和端口发布深度解析 | [18-Docker网络iptablesDNS和端口发布深度解析.md](study-material/18-Docker网络iptablesDNS和端口发布深度解析.md) |
| 19 | 存储驱动、volume 权限和数据可靠性深度解析 | [19-存储驱动volume权限和数据可靠性深度解析.md](study-material/19-存储驱动volume权限和数据可靠性深度解析.md) |
| 20 | Compose 规范、变量解析和多环境配置深度解析 | [20-Compose规范变量解析和多环境配置深度解析.md](study-material/20-Compose规范变量解析和多环境配置深度解析.md) |
| 21 | 生产发布、供应链和可观测性深度解析 | [21-生产发布供应链和可观测性深度解析.md](study-material/21-生产发布供应链和可观测性深度解析.md) |
| 22 | 故障案例和排障剧本深度版 | [22-故障案例和排障剧本深度版.md](study-material/22-故障案例和排障剧本深度版.md) |
| 23 | 深度实验手册和能力验收 | [23-深度实验手册和能力验收.md](study-material/23-深度实验手册和能力验收.md) |

## 使用建议

- 初学：按 00 到 06 顺序学习，先能独立运行一个 Web 服务、数据库和 Compose 环境。
- 工作使用：重点看 02、04、05、06、08、09、10，关注镜像可复现、数据安全、网络定位和发布流程。
- 深入掌握：按 15 到 23 学习底层架构、运行时、存储、网络、安全边界、生产供应链和故障剧本。
- 面试复习：先读 14 完整清单，再读 13 和 `面试知识点/` 下的问题。
- 排障速查：优先看 09、12、22，结合 `docker inspect`、`docker logs`、`docker exec`、`docker network inspect`。
