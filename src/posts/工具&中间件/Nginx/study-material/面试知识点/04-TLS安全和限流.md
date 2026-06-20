---
title: "Nginx面试知识点：TLS、安全和限流"
date: 2026-06-20
description: "SNI 是 TLS 握手中的 server name indication，客户端在握手时告诉服务端要访问的域名，Nginx 根据它选择证书和 server。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "面试"
category: "工具&中间件"
---

# Nginx面试知识点：TLS、安全和限流

[返回面试索引](../21-面试知识点整理.md)

[返回学习资料索引](../../Nginx学习资料.md)

## 一、TLS 和安全

### 1. SNI 是什么？

**参考答案：**

SNI 是 TLS 握手中的 server name indication，客户端在握手时告诉服务端要访问的域名，Nginx 根据它选择证书和 server。

### 2. HSTS 有什么作用和风险？

**参考答案：**

HSTS 让浏览器强制使用 HTTPS，提高安全性。但配置过长或包含子域后，错误很难快速回滚，必须确认 HTTPS 全站稳定后再开启。

### 3. limit_req 和 limit_conn 区别？

**参考答案：**

`limit_req` 限制请求速率，`limit_conn` 限制并发连接数。前者保护 QPS，后者保护连接资源。

### 4. CORS 为什么不能随便配置 `*`？

**参考答案：**

如果允许凭据请求，不能使用通配 Origin。CORS 应按可信 Origin 白名单配置，避免跨站读取敏感响应。

