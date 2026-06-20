---
title: "Nginx学习资料：TLS、HTTPS、证书和安全配置"
date: 2026-06-20
description: "Nginx 常作为 TLS 终止点。客户端和 Nginx 建立 TLS，Nginx 再用 HTTP 或 HTTPS 连接后端。TLS 配置不仅是证书路径，还包括协议版本、证书链、SNI、多域名、会话复用和安全头。证书过期是生产高频事故。"
tags:
  - "工具&中间件"
  - "Nginx"
category: "工具&中间件"
---

# Nginx学习资料：TLS、HTTPS、证书和安全配置

[返回索引](../Nginx学习资料.md)

## 学习目标

- 配置 HTTPS 站点。
- 理解证书链、SNI、TLS 协议版本、加密套件。
- 掌握常见 TLS 安全配置和续期风险。

## 理论导读

Nginx 常作为 TLS 终止点。客户端和 Nginx 建立 TLS，Nginx 再用 HTTP 或 HTTPS 连接后端。TLS 配置不仅是证书路径，还包括协议版本、证书链、SNI、多域名、会话复用和安全头。证书过期是生产高频事故。

## 基础 HTTPS

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
}
```

## HTTP 跳 HTTPS

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

## 安全头

```nginx
add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options "nosniff" always;
```

HSTS 要谨慎，尤其是 preload 和子域名策略。

## 练习

1. 配置 HTTPS。
2. 用 `openssl s_client` 检查证书链。
3. 配置 HTTP 到 HTTPS 跳转。

## 验收

- 能解释 fullchain 和 private key。
- 能说明 SNI 作用。
- 能列出证书过期监控要求。

## 重点

- 证书链必须完整。
- 多域名 HTTPS 依赖 SNI。
- 证书续期要自动化并监控。

## 易错

> **易错：** 只更新证书文件但忘记 reload。
>
> 正确做法：更新证书后 reload，并用外部探测验证新证书生效。

