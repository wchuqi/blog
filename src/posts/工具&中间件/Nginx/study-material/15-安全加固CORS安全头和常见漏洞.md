---
title: "Nginx学习资料：安全加固、CORS、安全头和常见漏洞"
date: 2026-06-20
description: "Nginx 处于入口层，错误配置会暴露内部文件、错误转发 Host、缓存私有响应或绕过鉴权。安全配置不能只靠几行 header，还要包含路径、代理头、访问控制、上传大小、超时和日志审计。"
tags:
  - "工具&中间件"
  - "Nginx"
category: "工具&中间件"
---

# Nginx学习资料：安全加固、CORS、安全头和常见漏洞

[返回索引](../Nginx学习资料.md)

## 学习目标

- 掌握 Nginx 入口安全加固。
- 正确配置 CORS、安全头、隐藏文件保护。
- 避免路径穿越、Host header 和代理头风险。

## 理论导读

Nginx 处于入口层，错误配置会暴露内部文件、错误转发 Host、缓存私有响应或绕过鉴权。安全配置不能只靠几行 header，还要包含路径、代理头、访问控制、上传大小、超时和日志审计。

## 安全头

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## 禁止隐藏文件

```nginx
location ~ /\.(?!well-known) {
    deny all;
}
```

## CORS

CORS 应按允许域名白名单配置，不要无脑 `*` 加凭据。

## 请求限制

```nginx
client_max_body_size 20m;
client_body_timeout 15s;
```

## 练习

1. 禁止访问 `.git`。
2. 配置安全头。
3. 设计 CORS 白名单。

## 验收

- 能解释 CORS 和 Cookie 凭据风险。
- 能防止隐藏文件泄漏。
- 能说明 Host header 风险。

## 易错

> **易错：** `Access-Control-Allow-Origin *` 同时允许凭据。
>
> 正确做法：凭据请求必须使用明确可信 Origin。

