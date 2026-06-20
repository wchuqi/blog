---
title: "Docker学习资料：安全、权限、Secrets 和镜像供应链"
date: 2026-06-20
description: "Docker 提供隔离，但不是绝对安全边界。容器共享宿主机内核，错误的权限、挂载和特权参数会显著放大风险。安全 Docker 镜像应遵循最小权限、最小依赖、可扫描、可追溯、密钥不入镜像的原则。"
tags:
  - "工具&中间件"
  - "Docker"
category: "工具&中间件"
---

# Docker学习资料：安全、权限、Secrets 和镜像供应链

[返回索引](../Docker学习资料.md)

## 学习目标

- 掌握容器安全的主要风险点。
- 使用非 root 用户、最小镜像、只读文件系统和能力限制。
- 理解密钥处理、镜像扫描和供应链追溯。

## 理论导读

Docker 提供隔离，但不是绝对安全边界。容器共享宿主机内核，错误的权限、挂载和特权参数会显著放大风险。安全 Docker 镜像应遵循最小权限、最小依赖、可扫描、可追溯、密钥不入镜像的原则。

## 核心心智模型

容器安全看四层：

- 镜像来源：基础镜像是否可信，依赖是否有漏洞。
- 构建过程：是否泄露密钥，是否可复现。
- 运行权限：是否 root、是否 privileged、挂载是否过宽。
- 运行环境：网络、日志、配置、补丁和审计是否可控。

## 知识点详解

### 非 root 用户

```dockerfile
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY app.jar /app/app.jar
RUN adduser --system --uid 10001 appuser
USER 10001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

非 root 不能解决所有问题，但能降低容器逃逸或文件误写后的影响。

### 危险参数

- `--privileged`：几乎放开所有能力，生产应极慎用。
- `-v /:/host`：挂载宿主机根目录，风险极高。
- 挂载 Docker socket：容器可控制宿主机 Docker daemon，接近宿主机 root 权限。
- `--network host`：弱化网络隔离。

### Secrets

不要把密码写入 Dockerfile、镜像层或 Git 仓库。开发环境可用 `.env`，生产环境应使用部署平台的 secret 管理能力，如 Kubernetes Secret、Vault、云厂商 Secret Manager、CI secret。

### 镜像供应链

- 固定基础镜像版本。
- 生成 SBOM。
- 扫描漏洞。
- 记录 digest。
- 对关键镜像签名或做来源证明。

## 例子

```powershell
docker run --rm --read-only --tmpfs /tmp --cap-drop ALL nginx:alpine
```

这个命令演示只读文件系统和能力收缩。真实应用可能还需要为缓存、PID 文件、临时文件单独挂载可写目录。

## 练习

1. 将一个 root 运行的镜像改成非 root。
2. 尝试使用只读文件系统启动应用，补齐必要 tmpfs。
3. 扫描镜像漏洞并记录高危项处理方式。

## 验收

- 能指出 Dockerfile 中泄露密钥的方式。
- 能说明 Docker socket 挂载为什么危险。
- 能给生产容器配置基本安全参数。

## 重点

- 密钥不能进入镜像层。
- 非 root、最小权限、最小镜像是安全基线。
- 镜像安全既包括运行时，也包括构建和供应链。

## 难点

- 容器内 root 和宿主机 root 不完全等价，但错误挂载、内核漏洞和 Docker socket 会打破边界。
- 漏洞扫描结果需要结合实际包是否被调用、是否可触达、是否有补丁综合判断。

## 易错

> **易错：** 为了解决权限问题直接加 `--privileged`。
>
> 正确做法：先定位缺少的具体 capability、设备或挂载，再最小授权。

