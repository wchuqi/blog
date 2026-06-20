---
title: "Nginx学习资料：upstream 负载均衡、失败重试和 keepalive 深度解析"
date: 2026-06-20
description: "upstream 是 Nginx 到后端的连接池和选择逻辑。负载均衡策略决定选谁，失败策略决定什么时候换后端，keepalive 决定是否复用到后端的空闲连接。错误重试是双刃剑：读请求可提升可用性，写请求可能造成重复业务。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：upstream 负载均衡、失败重试和 keepalive 深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 深入理解 upstream 选择、失败标记、重试和连接复用。
- 能设计不会重复提交的代理重试策略。
- 掌握 upstream keepalive 的真实含义。

## 理论导读

upstream 是 Nginx 到后端的连接池和选择逻辑。负载均衡策略决定选谁，失败策略决定什么时候换后端，keepalive 决定是否复用到后端的空闲连接。错误重试是双刃剑：读请求可提升可用性，写请求可能造成重复业务。

## keepalive 边界

```nginx
upstream backend {
    server 10.0.0.1:8080;
    keepalive 64;
}

proxy_http_version 1.1;
proxy_set_header Connection "";
```

keepalive 是每 worker 到 upstream 的空闲连接缓存，不是客户端 keepalive。

## 失败重试

```nginx
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_next_upstream_tries 2;
```

要结合方法：

- GET 可较安全重试。
- POST/PUT 需要业务幂等。
- 已经把请求体发给后端后，重试风险更高。

## 练习

1. 后端随机返回 502，观察重试。
2. POST 请求重试，设计幂等键。
3. 查看 upstream keepalive 连接。

## 验收

- 能解释 upstream keepalive。
- 能说明重试和幂等关系。
- 能配置重试次数限制。

## 易错

> **易错：** 为了降低 502 对所有请求开多次重试。
>
> 正确做法：按方法和业务幂等性区分重试策略。

