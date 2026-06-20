---
title: "Nginx学习资料：stream 四层代理、TCP 和 UDP"
date: 2026-06-20
description: "http 模块处理 HTTP 协议，能看 URI、header、status。stream 模块处理 TCP/UDP 层，只看连接和字节流，适合 MySQL、Redis、TLS 透传、TCP 服务转发。四层代理无法按 HTTP 路径路由。"
tags:
  - "工具&中间件"
  - "Nginx"
category: "工具&中间件"
---

# Nginx学习资料：stream 四层代理、TCP 和 UDP

[返回索引](../Nginx学习资料.md)

## 学习目标

- 理解 http 和 stream 的区别。
- 配置 TCP/UDP 四层代理。
- 掌握四层日志、超时和负载均衡。

## 理论导读

http 模块处理 HTTP 协议，能看 URI、header、status。stream 模块处理 TCP/UDP 层，只看连接和字节流，适合 MySQL、Redis、TLS 透传、TCP 服务转发。四层代理无法按 HTTP 路径路由。

## TCP 代理

```nginx
stream {
    upstream redis_backend {
        server 10.0.0.1:6379;
        server 10.0.0.2:6379;
    }

    server {
        listen 6379;
        proxy_pass redis_backend;
        proxy_timeout 30s;
        proxy_connect_timeout 3s;
    }
}
```

## 练习

1. 配置 TCP echo 服务代理。
2. 配置 Redis 四层转发实验。
3. 观察 stream 日志字段。

## 验收

- 能区分 http proxy 和 stream proxy。
- 能说明四层代理不能按 URI 路由。
- 能配置 TCP upstream。

## 易错

> **易错：** 希望 stream 根据 HTTP path 分流。
>
> 正确做法：HTTP 路由使用 http 模块；stream 只做四层连接代理。

