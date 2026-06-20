---
title: "Nginx学习资料：Nginx完整知识点清单"
date: 2026-06-20
description: "master/worker。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "知识清单"
category: "工具&中间件"
---

# Nginx学习资料：Nginx完整知识点清单

[返回索引](../Nginx学习资料.md)

## 1. 基础

- master/worker。
- events/http/server/location/upstream/stream context。
- reload、restart、信号。
- 模块化架构。

## 2. 匹配和路由

- listen 地址端口。
- default_server。
- server_name 精确、通配符、正则。
- location 精确、前缀、正则、`^~`。
- URI 规范化。
- root、alias、try_files。
- rewrite、return、internal redirect。

## 3. 代理和 upstream

- proxy_pass URI 替换。
- proxy_set_header。
- proxy_connect/send/read_timeout。
- proxy_buffering。
- upstream 负载均衡。
- keepalive。
- proxy_next_upstream。

## 4. TLS 和协议

- TLS 终止。
- 证书链。
- SNI。
- HTTP/2。
- WebSocket。
- gRPC。
- HSTS。

## 5. 缓存和限流

- proxy_cache_path。
- proxy_cache_key。
- cache bypass/no_cache。
- stale。
- limit_req。
- limit_conn。
- real_ip。

## 6. 日志和排障

- access_log。
- error_log。
- request_time。
- upstream_response_time。
- 499、502、504。
- nginx -T。
- curl --resolve。

## 7. 性能

- worker_processes。
- worker_connections。
- epoll/kqueue。
- sendfile。
- tcp_nopush。
- keepalive。
- buffer。
- 文件描述符。
- 内核队列。

## 8. 安全

- 隐藏文件保护。
- CORS。
- 安全头。
- Host header。
- body size。
- 访问控制。
- Basic auth。
- TLS 策略。

## 9. 深度机制

- 请求处理阶段。
- 配置 merge。
- location 匹配算法。
- proxy_pass URI 规则。
- upstream 失败重试。
- TLS 握手和会话复用。
- 缓存 key 和 Vary。
- 限流漏桶语义。

## 10. 学习验收

- 能推导请求命中的 server/location。
- 能解释 root/alias/proxy_pass。
- 能排查 404/499/502/504。
- 能设计生产反向代理、TLS、缓存、限流和日志。

## 11. 协议和解析深度清单

- HTTP 请求行、header、body 解析。
- URI 规范化、percent decode、merge slashes。
- 变量求值时机和缓存。
- internal redirect 和 named location。
- HTTP/1.1 keepalive、HTTP/2 stream、HTTP/3/QUIC 边界。
- WebSocket Upgrade 和 gRPC 状态映射。

## 12. 真实 IP、DNS 和服务发现清单

- real_ip_header。
- set_real_ip_from。
- X-Forwarded-For 信任链。
- PROXY protocol。
- resolver 和 DNS TTL。
- 容器 IP 变化。
- Kubernetes Service、Endpoint、Ingress Controller。

## 13. 大文件、缓存和性能清单

- client_body_buffer_size。
- client_body_temp_path。
- proxy_request_buffering。
- proxy_buffering。
- proxy_temp_path。
- sendfile、aio、directio。
- ETag、Last-Modified、If-None-Match、If-Modified-Since。
- Range、slice、cache lock、stale。

## 14. 安全攻防和生产治理清单

- Host header injection。
- request smuggling。
- path traversal。
- alias 配置泄漏。
- SSRF through proxy。
- header trust boundary。
- zero-downtime reload。
- worker_shutdown_timeout。
- capacity model、timeout matrix、SLA。
