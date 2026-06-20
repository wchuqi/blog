---
title: "Nginx学习资料：realip、X-Forwarded-For、PROXY protocol 和信任链深度解析"
date: 2026-06-20
description: "真实 IP 不是简单读取一个 header。X-Forwarded-For 可由客户端伪造，只有来自可信代理的 header 才能信任。Nginx 必须明确哪些上游代理可信，并只从可信链中提取真实 IP。四层负载均衡可用 PROXY pro…"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：real_ip、X-Forwarded-For、PROXY protocol 和信任链深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 设计真实客户端 IP 信任链。
- 掌握 `X-Forwarded-For`、`real_ip_header`、`set_real_ip_from` 和 PROXY protocol。
- 避免伪造 IP 绕过限流和访问控制。

## 理论导读

真实 IP 不是简单读取一个 header。`X-Forwarded-For` 可由客户端伪造，只有来自可信代理的 header 才能信任。Nginx 必须明确哪些上游代理可信，并只从可信链中提取真实 IP。四层负载均衡可用 PROXY protocol 传递原始地址。

## X-Forwarded-For

```text
client, proxy1, proxy2
```

链路越长越容易混乱。应用和 Nginx 必须统一信任边界。

## real_ip 配置

```nginx
set_real_ip_from 10.0.0.0/8;
real_ip_header X-Forwarded-For;
real_ip_recursive on;
```

只信任内网代理段。不要信任全网。

## PROXY protocol

```nginx
server {
    listen 80 proxy_protocol;
    real_ip_header proxy_protocol;
}
```

适合四层 LB 向 Nginx 传递真实源地址。前提是 LB 确实发送 PROXY protocol，否则协议不匹配。

## 风险

- 客户端伪造 XFF 绕过 IP 白名单。
- 多层代理信任链不一致。
- Nginx 和应用各自解析不同 IP。
- 限流 key 用错。

## 练习

1. 伪造 X-Forwarded-For，观察未配置 real_ip 的风险。
2. 配置可信代理段后验证 `$remote_addr`。
3. 设计 CDN/LB/Nginx/App 的真实 IP 链路。

## 验收

- 能说明 XFF 不能无条件信任。
- 能配置 real_ip 信任代理。
- 能解释 PROXY protocol 适用场景。

## 易错

> **易错：** `set_real_ip_from 0.0.0.0/0`。
>
> 正确做法：只信任明确的上游代理 IP 段。

