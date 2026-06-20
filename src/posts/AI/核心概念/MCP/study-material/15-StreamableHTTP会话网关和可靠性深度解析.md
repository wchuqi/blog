---
title: "MCP 学习资料：Streamable HTTP、会话、网关和可靠性深度解析"
date: 2026-06-20
description: "远程 MCP 一旦进入企业环境，就会遇到 HTTP 基础设施问题：负载均衡、会话亲和、认证头、网关策略、连接中断、超时重试、幂等、日志和 trace。Streamable HTTP 让 MCP 可以远程化，但也要求你按网络服务标准治理它。"
tags:
  - "AI"
  - "核心概念"
  - "MCP"
  - "深度解析"
category: "AI"
---

# MCP 学习资料：Streamable HTTP、会话、网关和可靠性深度解析

[返回索引](../MCP学习资料.md)

## 学习目标

- 深入理解远程 MCP 的 HTTP 会话、认证、重连、重试和网关路由。
- 能设计 Streamable HTTP MCP server 的可靠性和安全策略。
- 能解释为什么远程 MCP 不是“把 stdio 搬到 HTTP 上”。

## 理论导读

远程 MCP 一旦进入企业环境，就会遇到 HTTP 基础设施问题：负载均衡、会话亲和、认证头、网关策略、连接中断、超时重试、幂等、日志和 trace。Streamable HTTP 让 MCP 可以远程化，但也要求你按网络服务标准治理它。

## 核心心智模型

```text
Host
  -> HTTP MCP Client
      -> Gateway
          -> Auth / Policy / Routing / Audit
              -> MCP Server Instance
                  -> External System
```

## 知识点详解

### 1. 会话语义

远程 MCP 通常需要会话标识来维持初始化后的上下文。常见设计会使用类似 `MCP-Session-Id` 的头或等价会话机制。

会话要回答：

- 初始化结果属于哪个会话。
- 后续请求如何路由到正确上下文。
- server 是否有内存状态。
- 重连后能否恢复。
- 会话何时过期。

### 2. 网关路由

如果 server 是无状态的，网关可以自由负载均衡。如果 server 保存会话状态，网关需要：

- sticky session。
- 共享会话存储。
- 会话迁移。
- 或强制 server 无状态化。

生产建议：

- 尽量让 MCP server 无状态。
- 把任务状态、幂等记录和审计写入外部存储。
- 会话只保存协议上下文和短期缓存。

### 3. 认证头和授权上下文

远程请求必须携带认证信息。网关或 server 要把认证信息解析为：

- user id。
- tenant id。
- scopes。
- audience。
- session id。
- risk context。

不要把原始 token 传到所有下游。下游调用应使用受限凭据或按真实用户换取目标系统 token。

### 4. 重试和幂等

HTTP 超时不等于 server 没执行。典型事故：

```text
client 调用 create_ticket
  -> server 创建成功
  -> HTTP 响应超时
  -> client 重试
  -> server 创建第二张工单
```

解决：

- 有副作用工具要求 idempotency key。
- server 在执行前记录 key。
- 重试先查询 key 的已知结果。
- 外部系统支持幂等更好。
- 对不可幂等动作禁止自动重试。

### 5. 断线和流式响应

远程连接可能中断。需要定义：

- 客户端断线后任务是否继续。
- 是否能重新获取结果。
- 进度消息是否可补发。
- 重连后如何查询 task 状态。

长任务更适合 task 化，而不是依赖一个长 HTTP 连接。

### 6. 网关策略

MCP 网关应能理解：

- 当前调用的是哪个 tool。
- tool 风险等级。
- 参数摘要。
- 用户和租户。
- server 版本。
- 是否需要确认。
- 是否超过限流。

示例策略：

```text
if tool.destructive and not user_confirmed:
  deny

if tool.name == "run_query" and args.limit > 1000:
  deny

if tenant.rate("tools/call") > threshold:
  throttle
```

### 7. 可观测字段

关键日志：

```text
trace_id
session_id
request_id
server_name
server_version
tool_name
user_id
tenant_id
auth_scope
latency_ms
error_type
idempotency_key
confirm_id
```

## 例子

远程创建面试的可靠流程：

```text
1. Host 生成 trace_id 和 idempotency_key。
2. Gateway 校验用户和工具权限。
3. Server 检查 idempotency_key 是否已执行。
4. Server 创建面试。
5. Server 写审计。
6. 响应超时时，client 重试同 key。
7. Server 返回第一次执行结果。
```

## 练习

1. 为远程 MCP server 设计 session 过期策略。
2. 设计一个不可自动重试工具的网关规则。
3. 写出创建工单工具的幂等流程。
4. 说明 sticky session 和无状态 server 的取舍。

## 验收

- 能解释远程 MCP 会话和路由问题。
- 能设计有副作用工具的幂等策略。
- 能说明网关为什么要理解 MCP tool 语义。

## 重点

- 远程 MCP 是网络服务，需要认证、授权、可靠性和观测。
- HTTP 超时不等于操作未发生。
- 高危工具不能盲目重试。

## 难点

- 会话状态、任务状态和业务状态要分开。
- 网关既要处理 HTTP，也要理解 MCP 协议语义。

## 易错

> **易错：** 远程 MCP tool call 失败就自动重试。
>
> 正确做法：先判断工具是否幂等；有副作用工具必须使用 idempotency key 或禁止自动重试。

