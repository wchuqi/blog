---
title: "Nginx学习资料：DNS resolver、动态 upstream、容器和 Kubernetes 深度解析"
date: 2026-06-20
description: "Nginx 配置中的域名不一定每次请求都重新解析。静态 upstream 域名通常在启动或 reload 时解析。容器和 Kubernetes 环境中后端 IP 可能变化，如果 Nginx 没有正确动态解析或通过稳定 Service 访问，…"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：DNS resolver、动态 upstream、容器和 Kubernetes 深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 理解 Nginx 对 upstream 域名解析的时机。
- 掌握 resolver、变量 proxy_pass 和容器 IP 变化风险。
- 知道 Kubernetes/Ingress 环境下的边界。

## 理论导读

Nginx 配置中的域名不一定每次请求都重新解析。静态 upstream 域名通常在启动或 reload 时解析。容器和 Kubernetes 环境中后端 IP 可能变化，如果 Nginx 没有正确动态解析或通过稳定 Service 访问，就可能代理到旧 IP。

## 静态解析风险

```nginx
upstream app {
    server app.example.internal:8080;
}
```

如果域名 IP 变化，Nginx 可能需要 reload 才更新，取决于配置和模块能力。

## resolver

```nginx
resolver 10.96.0.10 valid=30s ipv6=off;

location / {
    set $backend http://app.default.svc.cluster.local:8080;
    proxy_pass $backend;
}
```

变量形式 proxy_pass 可触发运行时解析，但也改变 proxy_pass URI 语义和性能，需要谨慎验证。

## Kubernetes 边界

- 使用 Service ClusterIP 通常比直接 Pod IP 稳定。
- Ingress Controller 会根据资源生成 Nginx 配置。
- 手写 Nginx 和 Ingress Controller 行为不同。
- readiness/liveness 和 upstream 健康不是一回事。

## 练习

1. 后端域名 IP 改变，观察 Nginx 是否更新。
2. 配置 resolver 和变量 proxy_pass。
3. 在 K8s 中比较 Service 名和 Pod IP。

## 验收

- 能解释 Nginx DNS 解析时机。
- 能说明容器 IP 变化风险。
- 能区分 Nginx 和 Ingress Controller。

## 易错

> **易错：** 容器后端 IP 变化后，不 reload Nginx，继续访问旧 IP。
>
> 正确做法：使用稳定 Service、动态解析或由平台控制配置刷新。

