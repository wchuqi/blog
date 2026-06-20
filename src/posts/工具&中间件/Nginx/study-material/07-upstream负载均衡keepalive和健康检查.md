---
title: "Nginx学习资料：upstream、负载均衡、keepalive 和健康检查"
date: 2026-06-20
description: "upstream 定义后端服务器池。Nginx 根据策略选择后端。开 upstream keepalive 可以复用 Nginx 到后端的连接，降低握手成本。但失败重试、超时和请求幂等性必须设计，否则可能重复提交。"
tags:
  - "工具&中间件"
  - "Nginx"
category: "工具&中间件"
---

# Nginx学习资料：upstream、负载均衡、keepalive 和健康检查

[返回索引](../Nginx学习资料.md)

## 学习目标

- 掌握 upstream 组、负载均衡策略、失败重试和 keepalive。
- 理解被动健康检查和主动健康检查边界。
- 能设计后端服务代理池。

## 理论导读

upstream 定义后端服务器池。Nginx 根据策略选择后端。开 upstream keepalive 可以复用 Nginx 到后端的连接，降低握手成本。但失败重试、超时和请求幂等性必须设计，否则可能重复提交。

## upstream

```nginx
upstream backend {
    server 10.0.0.1:8080 max_fails=3 fail_timeout=30s;
    server 10.0.0.2:8080 max_fails=3 fail_timeout=30s;
    keepalive 64;
}

location /api/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
}
```

## 常见策略

- round robin：默认轮询。
- least_conn：最少连接。
- ip_hash：按客户端 IP 粘滞。
- hash：按指定 key。

## 失败重试

```nginx
proxy_next_upstream error timeout http_502 http_503 http_504;
```

对非幂等请求要谨慎重试，避免重复下单、重复支付。

## 练习

1. 配置两个后端，观察轮询。
2. 关闭一个后端，观察失败和重试。
3. 开启 upstream keepalive。

## 验收

- 能解释 `max_fails` 和 `fail_timeout`。
- 能说明 keepalive 配置要配合 HTTP/1.1。
- 能判断哪些请求不适合重试。

## 重点

- upstream keepalive 是 Nginx 到后端的连接复用。
- 失败重试可能造成业务重复。
- 健康检查能力与版本和模块有关。

## 易错

> **易错：** 对所有 POST 请求开启失败重试。
>
> 正确做法：非幂等请求要由业务幂等保障，或限制重试条件。

