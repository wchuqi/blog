---
title: "Nginx学习资料：HTTP/2、WebSocket、gRPC 和长连接"
date: 2026-06-20
description: "不同协议对代理要求不同。WebSocket 需要 HTTP Upgrade 头；gRPC 基于 HTTP/2，需要对应模块和配置；长连接和流式响应需要合理超时和 buffering。把所有请求都按普通短 HTTP 请求配置，会导致连接断开、…"
tags:
  - "工具&中间件"
  - "Nginx"
category: "工具&中间件"
---

# Nginx学习资料：HTTP/2、WebSocket、gRPC 和长连接

[返回索引](../Nginx学习资料.md)

## 学习目标

- 理解 HTTP/2、WebSocket、gRPC 代理的配置差异。
- 掌握长连接、升级请求和超时。
- 避免流式响应被错误缓冲。

## 理论导读

不同协议对代理要求不同。WebSocket 需要 HTTP Upgrade 头；gRPC 基于 HTTP/2，需要对应模块和配置；长连接和流式响应需要合理超时和 buffering。把所有请求都按普通短 HTTP 请求配置，会导致连接断开、消息延迟或 504。

## WebSocket

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    "" close;
}

location /ws/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 1h;
}
```

## gRPC

```nginx
location /grpc.Service/ {
    grpc_pass grpc://grpc_backend;
}
```

gRPC 错误码和 HTTP 错误码排查要结合客户端和后端日志。

## 长连接和流式响应

```nginx
proxy_buffering off;
proxy_read_timeout 1h;
```

适合 SSE、流式下载等场景，但会增加后端和 Nginx 连接占用。

## 练习

1. 配置 WebSocket 代理。
2. 模拟后端长时间无数据，观察超时。
3. 对流式响应关闭 buffering。

## 验收

- 能解释 Upgrade 头。
- 能说明 HTTP/2 和 gRPC 代理差异。
- 能根据业务设置长连接超时。

## 重点

- WebSocket 必须处理 Upgrade。
- 流式响应可能需要关闭 proxy buffering。
- 长连接会占用 worker 连接和 upstream 资源。

## 易错

> **易错：** WebSocket 代理忘记 `proxy_http_version 1.1` 和 Upgrade 头。
>
> 正确做法：显式设置 Upgrade、Connection 和合理 read timeout。

