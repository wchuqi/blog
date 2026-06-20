---
title: "Nginx学习资料：proxycache 和缓存一致性"
date: 2026-06-20
description: "Nginx proxycache 可以在代理层缓存上游响应，降低后端压力。但缓存必须定义清楚 key、有效期、哪些状态码可缓存、哪些请求绕过缓存、缓存失效如何处理。缓存错误会导致用户看到旧数据或他人数据。"
tags:
  - "工具&中间件"
  - "Nginx"
category: "工具&中间件"
---

# Nginx学习资料：proxy_cache 和缓存一致性

[返回索引](../Nginx学习资料.md)

## 学习目标

- 掌握 Nginx 代理缓存基础配置。
- 理解 cache key、TTL、bypass、purge、stale。
- 能避免缓存动态内容和用户私有数据。

## 理论导读

Nginx proxy_cache 可以在代理层缓存上游响应，降低后端压力。但缓存必须定义清楚 key、有效期、哪些状态码可缓存、哪些请求绕过缓存、缓存失效如何处理。缓存错误会导致用户看到旧数据或他人数据。

## 基础配置

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=mycache:100m max_size=10g inactive=60m;

location / {
    proxy_cache mycache;
    proxy_cache_key "$scheme$host$request_uri";
    proxy_cache_valid 200 10m;
    proxy_pass http://backend;
}
```

## cache bypass

```nginx
proxy_cache_bypass $http_authorization;
proxy_no_cache $http_authorization;
```

有用户身份、购物车、个性化内容通常不能共享缓存。

## stale

```nginx
proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
```

后端异常时返回旧缓存可提高可用性，但要明确业务可接受旧数据。

## 练习

1. 配置 proxy_cache。
2. 用响应头观察 HIT/MISS。
3. 对带 Authorization 的请求禁用缓存。

## 验收

- 能解释 cache key。
- 能说明哪些请求不能缓存。
- 能使用 stale 保护后端。

## 重点

- 缓存 key 必须覆盖影响响应的维度。
- 用户私有数据不能共享缓存。
- stale 是可用性和新鲜度权衡。

## 易错

> **易错：** 缓存带 Cookie 或 Authorization 的个性化响应。
>
> 正确做法：对身份相关请求 bypass/no_cache，或把身份维度纳入 cache key 但通常不建议。

