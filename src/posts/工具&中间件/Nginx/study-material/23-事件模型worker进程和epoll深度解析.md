---
title: "Nginx学习资料：事件模型、worker 进程和 epoll 深度解析"
date: 2026-06-20
description: "Nginx 通过少量 worker 进程和事件循环处理大量连接。worker 不为每个连接创建线程，而是把 socket 事件注册到内核事件机制，如 Linux epoll。事件就绪后 worker 执行读写和请求处理。任何阻塞 worke…"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：事件模型、worker 进程和 epoll 深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 理解 master/worker 和事件驱动模型。
- 掌握 worker_connections、accept、epoll 和连接处理。
- 能解释高并发连接能力和阻塞风险。

## 理论导读

Nginx 通过少量 worker 进程和事件循环处理大量连接。worker 不为每个连接创建线程，而是把 socket 事件注册到内核事件机制，如 Linux epoll。事件就绪后 worker 执行读写和请求处理。任何阻塞 worker 的操作都会影响该 worker 上的其他连接。

## master/worker

- master：读取配置、管理 worker、处理信号。
- worker：处理连接、请求、代理、日志。

reload 时 master 启动新 worker，旧 worker 优雅退出。

## 连接上限

理论上：

```text
max_connections ≈ worker_processes * worker_connections
```

反向代理时还要计算 upstream 连接。系统文件描述符上限也必须足够。

## accept 惊群和 reuseport

多 worker 监听同一端口需要协调 accept。现代配置可使用相关机制减少竞争，但要结合系统和版本验证。

## 练习

1. 调整 worker_processes 和 worker_connections。
2. 使用 `ss` 查看连接。
3. 压测静态文件，观察 worker CPU。

## 验收

- 能解释 worker 事件循环。
- 能估算连接上限。
- 能说明阻塞操作为什么危险。

## 易错

> **易错：** 认为 worker_connections 就是客户端最大连接数。
>
> 正确做法：反向代理时客户端和 upstream 连接都占资源。

