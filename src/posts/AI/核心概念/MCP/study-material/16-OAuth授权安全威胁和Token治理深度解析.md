---
title: "MCP 学习资料：OAuth 授权、安全威胁和 Token 治理深度解析"
date: 2026-06-20
description: "远程 MCP server 代表用户访问外部资源，授权问题比普通工具调用更复杂。错误做法是 host 把一个万能 API token 传给 server。正确做法是让授权绑定到目标资源、用户、scope、audience 和会话，使 tok…"
tags:
  - "AI"
  - "核心概念"
  - "MCP"
  - "深度解析"
category: "AI"
---

# MCP 学习资料：OAuth 授权、安全威胁和 Token 治理深度解析

[返回索引](../MCP学习资料.md)

## 学习目标

- 理解远程 MCP 授权为什么不能简单传 token。
- 掌握 OAuth、resource 参数、audience、scope、PKCE 和 token challenge 的安全意义。
- 能设计防 token passthrough、confused deputy 和跨资源 token 滥用的方案。

## 理论导读

远程 MCP server 代表用户访问外部资源，授权问题比普通工具调用更复杂。错误做法是 host 把一个万能 API token 传给 server。正确做法是让授权绑定到目标资源、用户、scope、audience 和会话，使 token 只能被预期 server 用于预期资源。

## 核心心智模型

```text
User -> Host -> Authorization Server -> MCP Server -> Resource Server

Token must answer:
  who is the user
  who is the client
  who is the intended resource
  what scopes are allowed
  when it expires
```

## 知识点详解

### 1. Token passthrough 为什么危险

风险：

- server 获得过宽权限。
- token 被日志或内存泄露。
- token 可被拿去访问非预期资源。
- 无法证明用户是否明确同意本次动作。
- 多 server 串联时 token 扩散。

> **重点：** token 是权限载体，不是普通参数。

### 2. Audience 绑定

Token 应绑定 intended audience。一个发给知识库 MCP server 的 token，不应该能访问工单 MCP server。

检查：

- token `aud` 是否匹配当前 server。
- token 是否由可信 issuer 签发。
- scope 是否覆盖请求动作。
- token 是否过期。

### 3. Resource 参数

OAuth 的 resource indicator 用于声明客户端想访问哪个资源服务器。它能减少 token 被错误用于其他资源的风险。

设计原则：

- 每个 MCP server 或资源服务有明确 resource identifier。
- 授权请求带 resource。
- server 校验 token audience/resource。
- 不接受 audience 不匹配 token。

### 4. PKCE 和授权码安全

交互式授权应使用 PKCE，防止授权码被拦截后滥用。对桌面应用、CLI、浏览器 host 都很重要。

关键点：

- client 生成 code verifier。
- 授权请求带 code challenge。
- 换 token 时提交 verifier。
- 授权服务器验证匹配。

### 5. Scope 设计

Scope 不应过粗。

差：

```text
ats.full_access
```

更好：

```text
candidate.read
candidate.search
interview.create
application.status.update
```

Scope 要和 tool 风险对应，高危 tool 使用更窄 scope。

### 6. Token challenge 和渐进授权

当用户调用未授权工具时，server 不应直接失败为普通错误，而应返回可引导授权的错误或 challenge。Host 再决定是否向用户发起授权流程。

场景：

- 用户首次调用 calendar.create_event。
- 当前 token 只有 read scope。
- server 要求 create scope。
- host 展示授权请求。

### 7. Confused deputy 防护

授权不只校验 token，还要校验用户意图：

- tool 是否由用户明确触发。
- 参数是否展示给用户确认。
- 资源是否属于当前用户/租户。
- token audience 是否匹配当前 server。
- state 是否绑定当前授权会话。

## 例子

安全授权链路：

```text
1. User 要求创建面试。
2. Host 发现需要 interview.create scope。
3. Host 发起 OAuth 授权，请求 resource=ats-mcp。
4. Authorization Server 返回 audience=ats-mcp 的短期 token。
5. MCP Server 校验 issuer、audience、scope、expiry。
6. Server 调用 ATS，ATS 再校验用户对候选人和岗位的权限。
```

## 练习

1. 设计一个 MCP server 的 scope 列表。
2. 写出 token 校验步骤。
3. 说明 audience 不匹配时为什么必须拒绝。
4. 为高危工具设计渐进授权流程。

## 验收

- 能解释 token passthrough、audience、resource、scope、PKCE。
- 能设计远程 MCP 授权流程。
- 能说明 confused deputy 如何发生以及如何防。

## 重点

- Token 必须绑定目标资源和权限范围。
- 授权成功不等于所有业务动作都允许。
- 外部系统仍要做资源级权限校验。

## 难点

- MCP server 可能同时是 OAuth resource server 和下游 API client。
- 多 server、多资源、多租户时 token 边界容易混乱。

## 易错

> **易错：** 只校验 token 签名，不校验 audience 和 scope。
>
> 正确做法：签名、issuer、audience、expiry、scope、tenant、resource 都要校验。

