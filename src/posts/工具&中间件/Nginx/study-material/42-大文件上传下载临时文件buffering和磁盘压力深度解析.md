---
title: "Nginx学习资料：大文件上传下载、临时文件、buffering 和磁盘压力深度解析"
date: 2026-06-20
description: "Nginx 处理大文件时可能把请求体或上游响应写入临时文件。配置不当会造成磁盘写满、延迟升高或 upstream 被慢客户端拖住。上传下载业务要单独规划 body size、buffer、temp path、磁盘、超时和限速。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：大文件上传下载、临时文件、buffering 和磁盘压力深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 理解大请求体和大响应体在 Nginx 的缓冲路径。
- 掌握 client body 临时文件、proxy temp file 和磁盘压力。
- 能设计上传下载服务的配置和容量。

## 理论导读

Nginx 处理大文件时可能把请求体或上游响应写入临时文件。配置不当会造成磁盘写满、延迟升高或 upstream 被慢客户端拖住。上传下载业务要单独规划 body size、buffer、temp path、磁盘、超时和限速。

## 上传

```nginx
client_max_body_size 1g;
client_body_buffer_size 1m;
client_body_temp_path /data/nginx/client_temp;
```

请求体超过 buffer 会落临时文件。磁盘必须有容量和监控。

## proxy request buffering

```nginx
proxy_request_buffering on;
```

开启时 Nginx 先收完整请求体再发给 upstream，保护 upstream，但增加磁盘和延迟。关闭适合流式上传，但 upstream 会直接面对慢客户端。

## 下载和响应缓冲

```nginx
proxy_buffering on;
proxy_temp_path /data/nginx/proxy_temp;
```

慢客户端下载大响应时，Nginx 可能使用临时文件。

## 练习

1. 上传大文件，观察 client_temp。
2. 下载大文件，观察 proxy_temp。
3. 比较 proxy_request_buffering on/off。

## 验收

- 能说明临时文件何时产生。
- 能设计大文件磁盘容量和告警。
- 能根据业务选择 buffering。

## 易错

> **易错：** 上传接口只改 `client_max_body_size`，不规划临时目录磁盘。
>
> 正确做法：同时规划 buffer、temp path、磁盘、超时和上游处理能力。

