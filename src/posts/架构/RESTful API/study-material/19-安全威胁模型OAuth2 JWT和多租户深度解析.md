---
title: "RESTful API学习资料：安全威胁模型OAuth2 JWT和多租户深度解析"
date: 2026-06-20
description: "API 安全的失败通常不是“没登录”，而是“登录后访问了不该访问的资源”。RESTful API 的授权必须围绕资源和动作展开。一个用户能访问 /orders/1001，不是因为他有 ORDERREAD 这个字符串权限，而是因为他对这个订单…"
tags:
  - "架构"
  - "RESTful API"
  - "深度解析"
category: "架构"
---

# RESTful API学习资料：安全威胁模型OAuth2 JWT和多租户深度解析

[返回索引](../RESTful API学习资料.md)

## 学习目标

- 从威胁模型角度设计 RESTful API 安全。
- 深入理解认证、授权、OAuth2、JWT、Cookie、CORS、CSRF 的边界。
- 能处理多租户、资源级授权、审计和敏感数据保护。

## 理论导读

API 安全的失败通常不是“没登录”，而是“登录后访问了不该访问的资源”。RESTful API 的授权必须围绕资源和动作展开。一个用户能访问 `/orders/1001`，不是因为他有 `ORDER_READ` 这个字符串权限，而是因为他对这个订单有读取关系：订单归属本人、所属租户一致、角色允许、数据范围允许。

## 威胁建模框架

| 威胁 | 典型表现 | 防护 |
| --- | --- | --- |
| 身份伪造 | token 被盗、签名伪造 | TLS、签名校验、短期 token、密钥轮换 |
| 越权访问 | 修改 ID 查看他人数据 | 资源级授权、租户隔离 |
| 权限提升 | 普通用户调用管理员接口 | RBAC/ABAC、服务端校验 |
| 重放攻击 | 抓包后重复提交 | nonce、时间戳、签名、幂等 |
| 数据泄露 | 响应返回敏感字段 | 字段白名单、脱敏、日志过滤 |
| 注入攻击 | SQL/NoSQL/命令注入 | 参数化、输入校验、输出编码 |
| 滥用接口 | 暴力登录、刷券、爬取 | 限流、风控、验证码、审计 |

## 认证方式取舍

### Bearer Token

适合移动端、前后端分离、第三方 API。风险是“谁拿到谁能用”，所以不能放 URL，日志必须过滤。

### Cookie Session

适合浏览器应用。优点是和浏览器机制配合好，缺点是要处理 CSRF。

Cookie 安全属性：

```text
HttpOnly: 防止 JS 读取
Secure: 仅 HTTPS 传输
SameSite: 降低 CSRF 风险
```

### JWT

JWT 是自包含令牌，适合跨服务验证身份声明。它的风险：

- token 未过期前难以主动撤销。
- 权限变化无法立刻生效，除非查权限版本或缩短有效期。
- payload 只是编码，不是加密，不能放敏感数据。
- 算法和密钥管理错误会导致严重漏洞。

更稳妥的实践：

- access token 短有效期。
- refresh token 可撤销。
- 关键权限变更检查用户版本或会话版本。
- 定期轮换签名密钥。

## OAuth2边界

OAuth2 主要解决第三方授权访问资源，不等于登录协议。登录场景通常结合 OpenID Connect。面试中要避免把 OAuth2、JWT、SSO 混成一个东西。

常见角色：

- Resource Owner：资源所有者。
- Client：第三方应用。
- Authorization Server：授权服务器。
- Resource Server：资源服务器。

## CORS和CSRF

CORS 是浏览器限制跨域读取响应的机制，不是服务端访问控制。服务端接口仍可能被 Postman、curl、服务端程序调用。

CSRF 是浏览器自动带 Cookie 导致的跨站请求风险。使用 Cookie 认证时要考虑：

- `SameSite=Lax/Strict`
- CSRF Token
- 对高风险操作校验 Origin/Referer

Bearer Token 放在 Authorization Header 时，CSRF 风险通常低一些，但 XSS 泄露 token 风险更突出。

## 多租户授权

多租户 API 必须在每次资源访问时校验租户边界。

```text
tenant_id from token/session
tenant_id from resource
tenant_id from request path/header
```

不要信任客户端传入的 `tenantId`。如果路径中有 `/tenants/{tenantId}`，也必须和身份中的租户或授权范围匹配。

### 数据范围规则

| 身份 | 可访问数据 |
| --- | --- |
| 普通用户 | 自己拥有或被授权的资源 |
| 租户管理员 | 本租户资源 |
| 平台客服 | 被工单授权或审计允许的资源 |
| 系统任务 | 明确服务账号范围 |

## 安全响应设计

- 错误中不要返回内部异常、SQL、文件路径、服务器 IP。
- token 过期可以提示重新登录，但不要泄露签名、密钥或完整 token。
- 对资源不存在和无权访问是否都返回 `404`，应按安全策略统一。
- 日志中脱敏手机号、邮箱、身份证号、银行卡、token。

## 练习

设计一个 SaaS 订单 API：

- 用户只能查看本租户订单。
- 租户管理员可以查看本租户所有订单。
- 平台客服必须通过工单临时授权查看订单。
- 所有客服访问都要审计。
- 导出订单需要二次确认和限流。

写出认证方式、授权判断、审计字段和错误响应。

## 验收

- 能区分认证、授权、OAuth2、OIDC、JWT、CORS、CSRF。
- 能设计资源级授权和多租户隔离。
- 能识别 IDOR、过度返回、token 泄露和重放攻击。

> **重点：** API 授权必须落到资源、动作、租户和数据范围，不能只检查是否登录。
>
> **难点：** JWT 的“无状态验证”和“权限实时撤销”天然冲突，需要短 token、版本检查或服务端会话配合。
>
> **易错：** 把客户端传入的 `userId` 或 `tenantId` 当作可信授权依据。
