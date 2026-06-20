---
title: "Nginx学习资料：日志、监控、stubstatus 和可观测性"
date: 2026-06-20
description: "Nginx 是流量入口，日志字段决定排障能力。只记录默认 access log 往往无法区分客户端慢、Nginx 慢、upstream 慢还是网络失败。生产日志应包含 request id、upstream 地址、upstream 状态、请…"
tags:
  - "工具&中间件"
  - "Nginx"
category: "工具&中间件"
---

# Nginx学习资料：日志、监控、stub_status 和可观测性

[返回索引](../Nginx学习资料.md)

## 学习目标

- 配置 access_log、error_log 和 log_format。
- 使用 request id、upstream 时间字段定位问题。
- 掌握基础状态监控。

## 理论导读

Nginx 是流量入口，日志字段决定排障能力。只记录默认 access log 往往无法区分客户端慢、Nginx 慢、upstream 慢还是网络失败。生产日志应包含 request id、upstream 地址、upstream 状态、请求时间、upstream 响应时间。

## 日志格式

```nginx
log_format main '$remote_addr $request_id $host "$request" '
                '$status $body_bytes_sent '
                'rt=$request_time '
                'uct=$upstream_connect_time '
                'uht=$upstream_header_time '
                'urt=$upstream_response_time '
                'ua="$http_user_agent"';

access_log /var/log/nginx/access.log main;
error_log /var/log/nginx/error.log warn;
```

## stub_status

```nginx
location /nginx_status {
    stub_status;
    allow 127.0.0.1;
    deny all;
}
```

## 练习

1. 增加 upstream 响应时间字段。
2. 用 curl 带 request id。
3. 配置 stub_status 并限制访问。

## 验收

- 能解释 `$request_time` 和 `$upstream_response_time`。
- 能用日志判断 502/504 来源。
- 能保护状态接口。

## 易错

> **易错：** 没有记录 upstream 地址和耗时，故障时无法定位哪个后端慢。
>
> 正确做法：生产日志必须带 upstream 相关字段。

