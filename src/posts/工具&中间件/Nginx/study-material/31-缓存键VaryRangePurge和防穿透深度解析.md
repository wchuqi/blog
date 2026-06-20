---
title: "Nginx学习资料：缓存键、Vary、Range、Purge 和防穿透深度解析"
date: 2026-06-20
description: "key 必须包含所有影响响应的维度。若响应因 header、cookie、语言、设备不同而不同，cache key 必须区分或禁止缓存。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：缓存键、Vary、Range、Purge 和防穿透深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 深入理解 proxy_cache key 设计。
- 掌握 Vary、Range、Set-Cookie、Authorization 对缓存的影响。
- 设计缓存穿透和击穿保护。

## cache key

```nginx
proxy_cache_key "$scheme$request_method$host$request_uri";
```

key 必须包含所有影响响应的维度。若响应因 header、cookie、语言、设备不同而不同，cache key 必须区分或禁止缓存。

## Vary

上游 `Vary` 表示响应随某些请求头变化。代理缓存如果忽略这些维度，可能返回错误版本。

## Range

大文件断点续传涉及 Range 请求。缓存 Range 响应要谨慎，避免缓存碎片化或错误 partial content。

## purge

开源 Nginx 没有统一内置 purge 能力，常通过模块、文件删除、版本化 URL 或短 TTL 解决。生产要明确失效路径。

## 防击穿

```nginx
proxy_cache_lock on;
proxy_cache_use_stale updating error timeout http_500 http_502 http_503 http_504;
```

cache lock 可减少同一缓存 miss 并发回源。

## 验收

- 能设计 cache key。
- 能说明用户态响应为什么不能共享缓存。
- 能使用 stale 和 cache lock 保护上游。

## 易错

> **易错：** cache key 不包含 Host，多个域名共享错缓存。
>
> 正确做法：cache key 至少包含 scheme、host、URI，必要时包含方法和关键 header。

