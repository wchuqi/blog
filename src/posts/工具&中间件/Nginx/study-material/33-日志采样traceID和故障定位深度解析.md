---
title: "Nginx学习资料：日志采样、trace id 和故障定位深度解析"
date: 2026-06-20
description: "如果上游已有 trace id，可以用 map 优先保留。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：日志采样、trace id 和故障定位深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 设计可用于链路排障的日志格式。
- 掌握 trace id 透传和生成。
- 通过日志定位客户端、Nginx、upstream 问题。

## 日志字段设计

```nginx
log_format trace '$time_iso8601 $request_id $remote_addr $host '
                 '"$request" $status rt=$request_time '
                 'uaddr=$upstream_addr ustatus=$upstream_status '
                 'uct=$upstream_connect_time urt=$upstream_response_time';
```

## trace id

```nginx
proxy_set_header X-Request-ID $request_id;
add_header X-Request-ID $request_id always;
```

如果上游已有 trace id，可以用 map 优先保留。

## 采样

高流量服务可按状态码、路径、随机采样或错误全量记录。采样不能影响错误排查。

## 故障定位

- `request_time` 高，`upstream_response_time` 低：可能客户端慢或响应发送慢。
- upstream connect time 高：连接后端慢。
- upstream status 502/504：后端连接或超时。
- 499：客户端断开，可能是用户取消、客户端超时或 Nginx 响应慢。

## 验收

- 能设计包含 upstream 的日志。
- 能透传 request id。
- 能根据时间字段判断瓶颈。

