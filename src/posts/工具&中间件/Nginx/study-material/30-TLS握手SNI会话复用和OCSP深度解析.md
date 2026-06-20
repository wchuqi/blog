---
title: "Nginx学习资料：TLS 握手、SNI、会话复用和 OCSP 深度解析"
date: 2026-06-20
description: "TLS 建立在 HTTP 请求之前。客户端在握手中通过 SNI 告诉服务端访问哪个域名，Nginx 根据 SNI 选择证书。证书链不完整、域名不匹配、协议版本不兼容、会话缓存配置不当都会导致失败或性能差。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：TLS 握手、SNI、会话复用和 OCSP 深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 理解 TLS 握手、证书链、SNI、会话复用。
- 掌握证书续期、OCSP stapling 和 TLS 性能。
- 能排查证书和握手错误。

## 理论导读

TLS 建立在 HTTP 请求之前。客户端在握手中通过 SNI 告诉服务端访问哪个域名，Nginx 根据 SNI 选择证书。证书链不完整、域名不匹配、协议版本不兼容、会话缓存配置不当都会导致失败或性能差。

## SNI

同一个 IP 多证书依赖 SNI。老旧客户端不支持 SNI 时可能拿到默认 server 证书。

## 会话复用

```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

会话复用减少握手成本，但要结合安全策略和版本。

## OCSP stapling

服务端把证书状态响应随握手提供给客户端，减少客户端查询 CA 的延迟。配置需要正确证书链和 resolver。

## 排查

```bash
openssl s_client -connect example.com:443 -servername example.com -showcerts
curl -v https://example.com/
```

## 验收

- 能解释 SNI 作用。
- 能排查证书链不完整。
- 能说明证书续期和 reload。

## 易错

> **易错：** 多域名 HTTPS 配了证书但没按 SNI 验证。
>
> 正确做法：用 `openssl s_client -servername` 分别验证每个域名。

