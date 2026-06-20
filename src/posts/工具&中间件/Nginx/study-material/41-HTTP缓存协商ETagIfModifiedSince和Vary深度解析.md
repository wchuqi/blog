---
title: "Nginx学习资料：HTTP 缓存协商、ETag、If-Modified-Since 和 Vary 深度解析"
date: 2026-06-20
description: "HTTP 缓存不只是 expires 30d。浏览器可使用强缓存直接不请求，也可发送条件请求让服务端返回 304。代理缓存还要处理 Vary、Range、Set-Cookie 等影响响应的维度。缓存策略错误会导致旧资源、错用户数据和回源风暴…"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：HTTP 缓存协商、ETag、If-Modified-Since 和 Vary 深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 理解强缓存和协商缓存。
- 掌握 ETag、Last-Modified、If-None-Match、If-Modified-Since。
- 处理 Vary、Range 和代理缓存一致性。

## 理论导读

HTTP 缓存不只是 `expires 30d`。浏览器可使用强缓存直接不请求，也可发送条件请求让服务端返回 304。代理缓存还要处理 Vary、Range、Set-Cookie 等影响响应的维度。缓存策略错误会导致旧资源、错用户数据和回源风暴。

## 强缓存

```nginx
expires 30d;
add_header Cache-Control "public, immutable";
```

适合文件名带 hash 的静态资源。

## 协商缓存

- ETag/If-None-Match。
- Last-Modified/If-Modified-Since。

命中时返回 304，减少响应体传输。

## Vary

`Vary: Accept-Encoding` 表示不同 Accept-Encoding 响应不同。若代理缓存忽略 Vary，可能返回错误压缩版本。

## 练习

1. 用 curl 发送 If-None-Match。
2. 比较 200 和 304。
3. 配置 assets 长缓存和 HTML no-cache。

## 验收

- 能区分强缓存和协商缓存。
- 能解释 Vary 对 cache key 的影响。
- 能设计前端发布缓存策略。

## 易错

> **易错：** HTML 和 hash assets 使用同样长缓存。
>
> 正确做法：HTML 短缓存或 no-cache，hash assets 长缓存。

