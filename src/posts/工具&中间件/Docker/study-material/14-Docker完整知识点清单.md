---
title: "Docker学习资料：Docker完整知识点清单"
date: 2026-06-20
description: "Docker Engine、Docker CLI、Docker daemon、containerd、runc。"
tags:
  - "工具&中间件"
  - "Docker"
  - "知识清单"
category: "工具&中间件"
---

# Docker学习资料：Docker完整知识点清单

[返回索引](../Docker学习资料.md)

## 1. 基础和术语

- Docker Engine、Docker CLI、Docker daemon、containerd、runc。
- 镜像、容器、仓库、tag、digest、manifest。
- Dockerfile、构建上下文、`.dockerignore`。
- volume、bind mount、tmpfs。
- bridge、host、none、overlay、macvlan 网络。
- Compose project、service、network、volume。

## 2. 核心机制

- 镜像分层和联合文件系统。
- 容器可写层和镜像只读层。
- namespace：pid、net、mnt、uts、ipc、user。
- cgroup：CPU、内存、IO、进程数限制和统计。
- 容器生命周期和 PID 1。
- Docker 网络 NAT、端口发布、内置 DNS。
- volume 生命周期和挂载遮挡规则。

## 3. 日常操作

- run、start、stop、restart、rm。
- pull、build、tag、push、rmi。
- logs、exec、inspect、events、stats。
- network create/connect/inspect。
- volume create/inspect/rm。
- compose up/down/logs/exec/config。

## 4. 镜像构建

- Dockerfile 指令：FROM、RUN、COPY、ADD、WORKDIR、ENV、ARG、EXPOSE、USER、ENTRYPOINT、CMD、HEALTHCHECK。
- 构建缓存命中规则。
- 多阶段构建。
- 基础镜像选择：alpine、slim、distroless、完整发行版。
- 多架构构建和 manifest。
- 构建密钥和 BuildKit。

## 5. 容器运行

- 前台进程和容器退出。
- 环境变量和配置注入。
- 重启策略。
- 健康检查。
- 资源限制。
- 日志输出和日志驱动。
- 信号处理和优雅退出。

## 6. 网络

- 容器内 `localhost` 语义。
- 服务名 DNS 解析。
- 端口发布和容器端口。
- 容器访问宿主机。
- 网络隔离和多网络连接。
- DNS、代理、防火墙、安全组排查。

## 7. 存储

- 容器可写层适用边界。
- volume 备份、恢复、迁移。
- bind mount 权限和路径差异。
- tmpfs 临时数据。
- 数据库容器持久化。
- 日志、镜像、volume、构建缓存磁盘占用。

## 8. Compose

- Compose 文件结构。
- service 配置：image、build、ports、expose、environment、env_file、volumes、networks、depends_on、healthcheck。
- `.env` 变量替换。
- project name 和资源命名。
- profiles。
- `down -v` 风险。

## 9. 安全

- 非 root 用户。
- capability 收缩。
- seccomp、AppArmor、SELinux。
- 只读文件系统和 tmpfs。
- `--privileged` 风险。
- Docker socket 挂载风险。
- Secret 管理。
- 镜像漏洞扫描、SBOM、签名、digest。

## 10. 生产和团队实践

- 镜像标签策略。
- CI 构建、测试、扫描、推送。
- 配置外置和密钥管理。
- 蓝绿、滚动、金丝雀、回滚。
- 日志采集和指标监控。
- Docker 与 Kubernetes 边界。

## 11. 排障和恢复

- 容器启动失败。
- 端口冲突。
- DNS 解析失败。
- volume 权限错误。
- 容器 OOM。
- 镜像拉取失败。
- 磁盘空间不足。
- 构建缓存异常。
- Docker daemon 异常。

## 12. 高风险操作

- `docker system prune -a --volumes`。
- `docker compose down -v`。
- 挂载宿主机根目录。
- 使用 `--privileged`。
- 删除未备份 volume。
- 在生产使用可变 tag 作为唯一版本依据。

## 13. 学习验收清单

- 能独立写 Dockerfile 和 Compose 文件。
- 能解释镜像构建缓存和分层。
- 能正确选择 volume、bind mount、tmpfs。
- 能排查容器启动、网络、权限和资源问题。
- 能设计镜像版本、CI 构建和回滚策略。
- 能说明 Docker 安全基线和常见危险配置。

## 14. 深度架构清单

- Docker CLI 到 Docker daemon 的 API 调用边界。
- daemon 与 containerd、containerd-shim、runc 的职责拆分。
- OCI Image Spec 和 OCI Runtime Spec 的作用。
- 镜像 manifest、config、layer tar、diffID、chainID、digest。
- containerd content store、snapshotter、runtime task 的大致职责。
- 容器创建时 rootfs、mount、namespace、cgroup、capability、seccomp、network 的准备顺序。
- Docker Desktop 中 Linux VM 对路径、网络、性能和宿主机语义的影响。

## 15. 深度构建清单

- BuildKit 与传统 builder 的差异。
- LLB 构建图、并行构建和缓存导入导出。
- cache mount、secret mount、ssh mount。
- 多阶段构建的产物边界和安全边界。
- 多架构镜像、manifest list、buildx builder。
- 构建上下文大小、`.dockerignore` 匹配风险、远程上下文。
- 依赖层排序、包管理缓存、可复现构建和基础镜像更新策略。

## 16. 深度网络清单

- docker0、veth pair、network namespace、bridge。
- NAT、端口发布、用户态代理或内核转发。
- iptables/nftables 链路、MASQUERADE、DNAT。
- 容器 DNS 解析、服务名、别名、搜索域。
- host 网络、macvlan、overlay 的适用边界。
- 容器访问宿主机、宿主机访问容器、跨主机访问的不同路径。
- 网络排障命令：`ss`、`ip addr`、`ip route`、`iptables`、`nslookup`、`tcpdump`、`conntrack`。

## 17. 深度存储清单

- overlay2 lowerdir、upperdir、workdir、merged。
- copy-on-write 的性能和语义影响。
- whiteout 文件和删除语义。
- volume 初始化规则和挂载遮挡。
- UID/GID 权限、rootless Docker、user namespace。
- 数据库容器 fsync、日志、备份、一致性和恢复。
- Docker 日志文件、构建缓存、volume、镜像层的磁盘占用归因。

## 18. 深度安全和生产清单

- capability 最小化、seccomp、AppArmor、SELinux。
- rootless Docker 和 userns-remap。
- Docker socket 暴露风险模型。
- 镜像漏洞扫描、SBOM、签名、来源证明。
- tag、digest、registry 权限、镜像保留策略。
- CI/CD 中 secret 泄漏路径：构建日志、镜像层、环境变量、缓存。
- 运行时安全：只读根文件系统、tmpfs、资源限制、网络隔离、日志审计。
