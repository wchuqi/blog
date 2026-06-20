---
title: "Nginx面试知识点：反向代理和 upstream"
date: 2026-06-20
description: "在前缀 location 中，proxypass http://backend/; 通常会用 / 替换匹配的 location 前缀；proxypass http://backend; 通常保留原始 URI 转发。路径问题是 Nginx 高…"
tags:
  - "工具&中间件"
  - "Nginx"
  - "面试"
category: "工具&中间件"
---

# Nginx面试知识点：反向代理和 upstream

[返回面试索引](../21-面试知识点整理.md)

[返回学习资料索引](../../Nginx学习资料.md)

## 一、反向代理

### 1. proxy_pass 带 URI 和不带 URI 有什么区别？

**参考答案：**

在前缀 location 中，`proxy_pass http://backend/;` 通常会用 `/` 替换匹配的 location 前缀；`proxy_pass http://backend;` 通常保留原始 URI 转发。路径问题是 Nginx 高频故障点。

### 2. 常见代理头有哪些？

**参考答案：**

`Host`、`X-Real-IP`、`X-Forwarded-For`、`X-Forwarded-Proto`。它们让后端知道原始域名、客户端 IP 和协议。

### 3. 502 和 504 有什么区别？

**参考答案：**

502 通常表示 upstream 连接失败、响应非法、后端关闭等；504 通常表示 upstream 响应超时。要结合 error_log 和 upstream 时间字段判断。

### 4. upstream keepalive 是什么？

**参考答案：**

它复用 Nginx worker 到 upstream 的空闲连接，减少建连成本。需要配合 HTTP/1.1 和 `proxy_set_header Connection ""`。

### 5. proxy_next_upstream 有什么风险？

**参考答案：**

失败重试可能让非幂等请求重复提交，例如下单、支付。必须结合请求方法、业务幂等和重试次数。

