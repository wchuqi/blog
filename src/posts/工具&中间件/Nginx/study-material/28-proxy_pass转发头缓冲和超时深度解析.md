---
title: "Nginx学习资料：proxypass、转发头、缓冲和超时深度解析"
date: 2026-06-20
description: "请求 /api/users 通常转为 /users。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：proxy_pass、转发头、缓冲和超时深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 深入理解 `proxy_pass` 带不带 URI 的差异。
- 掌握请求头、响应缓冲、临时文件和超时。
- 能排查路径错、真实 IP 错、上游超时和慢客户端。

## proxy_pass URI 规则

```nginx
location /api/ {
    proxy_pass http://backend/;
}
```

请求 `/api/users` 通常转为 `/users`。

```nginx
location /api/ {
    proxy_pass http://backend;
}
```

请求 URI 通常保持原始路径转发。

这一区别是 Nginx 面试和事故高频点。

## 转发头

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

若前面还有代理，应先正确配置 real_ip，否则 `$remote_addr` 可能只是上一层代理。

## buffering

开启 buffering 可让 Nginx 先读 upstream 响应，再慢慢发给慢客户端，保护 upstream。关闭 buffering 适合流式响应。

## 超时

- connect timeout：建连。
- send timeout：发请求到 upstream。
- read timeout：等 upstream 响应。

## 练习

1. 比较 proxy_pass 带 `/` 和不带 `/`。
2. 配置后端打印收到的 URI 和 header。
3. 模拟慢客户端和慢 upstream。

## 验收

- 能解释 proxy_pass URI 替换。
- 能配置真实 IP 和协议头。
- 能根据 502/504 日志定位超时阶段。

## 易错

> **易错：** 改 `location /api/` 后没同步检查 proxy_pass 尾部 `/`。
>
> 正确做法：每次路径变更都用后端 echo 请求 URI 验证。

