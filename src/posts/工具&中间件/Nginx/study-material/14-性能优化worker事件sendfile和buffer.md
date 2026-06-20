---
title: "Nginx学习资料：性能优化、worker、事件、sendfile 和 buffer"
date: 2026-06-20
description: "Nginx 性能调优不是背参数。最大连接数受 worker 数、workerconnections、文件描述符、upstream 连接、系统端口和内核队列共同影响。静态文件、反向代理、小响应、大下载、长连接的瓶颈不同。"
tags:
  - "工具&中间件"
  - "Nginx"
category: "工具&中间件"
---

# Nginx学习资料：性能优化、worker、事件、sendfile 和 buffer

[返回索引](../Nginx学习资料.md)

## 学习目标

- 理解 worker_processes、worker_connections、文件描述符和事件模型。
- 掌握 sendfile、keepalive、buffer、gzip 等性能相关配置。
- 能根据瓶颈调优。

## 理论导读

Nginx 性能调优不是背参数。最大连接数受 worker 数、worker_connections、文件描述符、upstream 连接、系统端口和内核队列共同影响。静态文件、反向代理、小响应、大下载、长连接的瓶颈不同。

## 基础配置

```nginx
worker_processes auto;

events {
    worker_connections 4096;
    use epoll;
}

http {
    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
}
```

## 连接数估算

反向代理一个请求通常至少占用：

- 客户端到 Nginx 连接。
- Nginx 到 upstream 连接。

所以不能只按客户端连接数估算 worker_connections。

## buffer

proxy buffer 影响：

- upstream 响应是否被 Nginx 缓冲。
- 慢客户端是否拖住 upstream。
- 磁盘临时文件使用。

## 练习

1. 压测静态文件。
2. 压测反向代理。
3. 调整 keepalive 和 worker_connections，观察连接和延迟。

## 验收

- 能解释 worker_connections 上限。
- 能说明 sendfile 适用场景。
- 能根据日志和系统指标判断瓶颈。

## 易错

> **易错：** 只改 Nginx 配置，不调整 ulimit 和系统参数。
>
> 正确做法：Nginx、systemd、内核和上游一起评估。

