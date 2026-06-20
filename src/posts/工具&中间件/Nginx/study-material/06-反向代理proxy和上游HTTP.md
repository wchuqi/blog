---
title: "Nginx学习资料：反向代理 proxy 和上游 HTTP"
date: 2026-06-20
description: "反向代理是 Nginx 最常见用途。客户端连接 Nginx，Nginx 再作为客户端连接 upstream。Nginx 可以改写 URI、添加 header、缓存响应、缓冲请求和响应。任何一侧的超时、连接失败、路径替换错误都可能表现为 50…"
tags:
  - "工具&中间件"
  - "Nginx"
category: "工具&中间件"
---

# Nginx学习资料：反向代理 proxy 和上游 HTTP

[返回索引](../Nginx学习资料.md)

## 学习目标

- 掌握 `proxy_pass`、转发头、超时和缓冲。
- 理解客户端、Nginx、upstream 三者的连接关系。
- 能排查 502、504、上游路径错误。

## 理论导读

反向代理是 Nginx 最常见用途。客户端连接 Nginx，Nginx 再作为客户端连接 upstream。Nginx 可以改写 URI、添加 header、缓存响应、缓冲请求和响应。任何一侧的超时、连接失败、路径替换错误都可能表现为 502/504。

## 基础配置

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 超时

```nginx
proxy_connect_timeout 3s;
proxy_send_timeout 30s;
proxy_read_timeout 30s;
```

- connect：连接 upstream 超时。
- send：向 upstream 发送请求超时。
- read：等待 upstream 响应超时。

## 缓冲

```nginx
proxy_buffering on;
proxy_buffers 16 16k;
proxy_buffer_size 16k;
```

缓冲可保护后端免受慢客户端影响，但对流式响应可能需要关闭。

## 练习

1. 配置 `/api/` 代理到本地服务。
2. 后端故意 sleep，观察 504。
3. 后端停掉，观察 502。

## 验收

- 能解释 proxy 三类超时。
- 能说明 `X-Forwarded-For`。
- 能区分 502 和 504 常见原因。

## 重点

- Nginx 是 upstream 的客户端。
- 转发 header 决定应用看到的 Host、IP、协议。
- `proxy_pass` 路径替换很容易出错。

## 易错

> **易错：** 忘记设置 `X-Forwarded-Proto`，后端生成错误 http/https 链接。
>
> 正确做法：代理 HTTPS 入口时传递真实协议。

