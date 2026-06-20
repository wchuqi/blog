---
title: "Nginx学习资料：HTTP/1.1、HTTP/2、HTTP/3、队头阻塞和协议选择深度解析"
date: 2026-06-20
description: "基于 QUIC/UDP，目标是降低 TCP 层队头阻塞和改善连接迁移。具体支持取决于 Nginx 版本、构建模块和环境，生产启用前必须验证。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：HTTP/1.1、HTTP/2、HTTP/3、队头阻塞和协议选择深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 理解 HTTP/1.1、HTTP/2、HTTP/3 的差异。
- 掌握多路复用、队头阻塞、TLS 和代理边界。
- 能为不同业务选择协议。

## HTTP/1.1

特点：

- keepalive 复用连接。
- 一个连接同一时间处理能力有限。
- 浏览器通常开多个连接。

## HTTP/2

特点：

- 单连接多路复用多个 stream。
- header 压缩。
- 应用层减少 HTTP/1.1 队头阻塞。
- TCP 层仍可能受丢包影响。

## HTTP/3

基于 QUIC/UDP，目标是降低 TCP 层队头阻塞和改善连接迁移。具体支持取决于 Nginx 版本、构建模块和环境，生产启用前必须验证。

## 协议选择

- 普通 Web：HTTP/2 常见。
- gRPC：通常需要 HTTP/2。
- WebSocket：HTTP/1.1 Upgrade 常见。
- UDP/QUIC：需要额外网络和客户端支持。

## 验收

- 能解释 HTTP/2 多路复用。
- 能说明 HTTP/3 不是无条件可用。
- 能根据业务和环境选择协议。

