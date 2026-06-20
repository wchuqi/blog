---
title: "Nginx学习资料：Nginx Ingress、Kubernetes、服务发现和边界深度解析"
date: 2026-06-20
description: "Kubernetes 中通常不是手工维护 Nginx 配置，而是由 Ingress Controller 监听 Kubernetes API，把 Ingress、Service、Endpoint 等资源转换为 Nginx 配置并 reloa…"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：Nginx Ingress、Kubernetes、服务发现和边界深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 理解手写 Nginx 和 Nginx Ingress Controller 的区别。
- 掌握 Ingress、Service、Endpoint 和配置生成关系。
- 知道 Kubernetes 环境下的排障边界。

## 理论导读

Kubernetes 中通常不是手工维护 Nginx 配置，而是由 Ingress Controller 监听 Kubernetes API，把 Ingress、Service、Endpoint 等资源转换为 Nginx 配置并 reload 或动态更新。排障时要看 Kubernetes 资源、Controller 日志和生成后的 Nginx 配置。

## 关键对象

- Ingress：路由规则。
- Service：服务抽象。
- Endpoint/EndpointSlice：后端 Pod 地址。
- Ingress Controller：生成并应用 Nginx 配置。

## 常见问题

- Ingress pathType 理解错误。
- Service selector 不匹配。
- Pod not ready。
- 注解配置冲突。
- Controller reload 频繁。
- client IP 丢失。

## 练习

1. 创建 Ingress 转发到 Service。
2. 删除 Pod，观察 Endpoint 更新。
3. 查看 Controller 生成的 Nginx 配置。

## 验收

- 能区分 Ingress 和 Nginx 配置。
- 能排查 Service 无 Endpoint。
- 能说明注解不是通用 Nginx 指令。

## 易错

> **易错：** 直接修改 Ingress Controller 容器内 nginx.conf。
>
> 正确做法：修改 Kubernetes 资源或 Controller 配置源。

