---
title: "RESTful API学习资料：认证授权安全和CORS"
date: 2026-06-20
description: "认证回答“你是谁”，授权回答“你能做什么”。RESTful API 应默认运行在 TLS 之上，所有敏感操作都要做认证、授权、输入校验、审计和限流。安全不是只加一个登录接口，而是贯穿资源访问边界。"
tags:
  - "架构"
  - "RESTful API"
category: "架构"
---

# RESTful API学习资料：认证授权安全和CORS

[返回索引](../RESTful API学习资料.md)

## 学习目标

- 区分认证和授权。
- 掌握 Token、Cookie、OAuth2、JWT、CORS 的 API 设计影响。
- 能识别 RESTful API 常见安全风险。

## 理论导读

认证回答“你是谁”，授权回答“你能做什么”。RESTful API 应默认运行在 TLS 之上，所有敏感操作都要做认证、授权、输入校验、审计和限流。安全不是只加一个登录接口，而是贯穿资源访问边界。

## 核心心智模型

认证像验身份证，授权像查门禁权限。身份证是真的，不代表你能进所有房间。

## 知识点详解

### Bearer Token

```http
GET /me HTTP/1.1
Authorization: Bearer eyJhbGciOi...
```

Bearer Token 谁持有谁可用，所以必须通过 HTTPS 传输，不能写进 URL。

### Cookie 会话

浏览器场景常用 Cookie。需要配置 `HttpOnly`、`Secure`、`SameSite`，并处理 CSRF 风险。

### JWT

JWT 适合跨服务传递已签名声明，但不是万能会话方案。要关注过期时间、撤销、密钥轮换、声明最小化。

### CORS

CORS 是浏览器安全策略，不是服务端认证机制。服务端允许跨域时，需要明确来源、方法、头和是否允许凭证。

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```

如果允许凭证，不能使用通配符 `*`。

### 常见风险

| 风险 | 说明 | 防护 |
| --- | --- | --- |
| IDOR | 修改 ID 访问他人资源 | 每次按资源做授权 |
| Token 泄露 | URL、日志、前端存储泄露 | 不放 URL，缩短有效期 |
| 越权 | 只校验登录不校验角色和归属 | RBAC/ABAC/资源归属检查 |
| 过度返回 | 返回敏感字段 | 响应字段白名单 |
| 重放攻击 | 请求被重复发送 | 时间戳、nonce、签名、幂等键 |

## 练习

设计一个“用户查看自己的订单”和“客服查看任意订单”的授权模型，说明资源归属、角色和审计字段。

## 验收

- 能区分 `401` 和 `403`。
- 能说清 CORS 解决什么问题、不解决什么问题。
- 能指出 IDOR 和过度返回的风险。

> **重点：** 授权必须围绕资源做，不能只在菜单或前端按钮上控制。
>
> **难点：** JWT 无状态验证和主动注销、权限实时变更之间存在天然张力。
>
> **易错：** 把 CORS 当成安全认证；CORS 只是浏览器是否允许前端读取响应的规则。
