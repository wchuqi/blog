---
title: "MCP 学习资料：传输层：stdio 和 Streamable HTTP"
date: 2026-06-20
description: "MCP 的协议消息可以通过不同传输承载。传输层解决的是“消息怎么到达对方”，不是“消息语义是什么”。本地工具通常用 stdio，因为 host 可以直接启动 server 进程；远程服务通常用 Streamable HTTP，因为它适合跨网…"
tags:
  - "AI"
  - "核心概念"
  - "MCP"
category: "AI"
---

# MCP 学习资料：传输层：stdio 和 Streamable HTTP

[返回索引](../MCP学习资料.md)

## 学习目标

- 理解 MCP 消息和传输层的关系。
- 掌握 stdio 和 Streamable HTTP 的适用场景。
- 理解远程 MCP 的会话、认证、连接恢复和观测要求。
- 认识旧 HTTP+SSE 方案的兼容风险。

## 理论导读

MCP 的协议消息可以通过不同传输承载。传输层解决的是“消息怎么到达对方”，不是“消息语义是什么”。本地工具通常用 stdio，因为 host 可以直接启动 server 进程；远程服务通常用 Streamable HTTP，因为它适合跨网络、认证、负载均衡和平台化部署。

传输选择会改变安全模型。本地 stdio 更像启动一个本机插件，风险在本机权限和命令执行；远程 HTTP 更像访问 SaaS 或企业服务，风险在身份认证、跨租户隔离、网络暴露和授权。

## 核心心智模型

```text
MCP JSON-RPC message
  -> Transport framing
      -> stdio: 本地进程 stdin/stdout
      -> Streamable HTTP: 网络请求、响应、流式消息、session
```

## 知识点详解

### 1. stdio

stdio 传输适合本地 server：

- Host 启动 server 子进程。
- Client 通过 stdin/stdout 与 server 交换 MCP 消息。
- Server 可以访问本地文件、命令、开发工具。
- 部署简单，适合 IDE、桌面应用和本地开发。

适合：

- 文件系统工具。
- 本地 Git 工具。
- 本地数据库开发实例。
- CLI 包装工具。

风险：

- server 进程拥有本机权限。
- 命令注入会直接影响本机。
- stdout/stderr 日志边界要处理好，避免破坏协议消息。
- server 安装来源要可信。

### 2. Streamable HTTP

Streamable HTTP 适合远程 MCP server：

- 可以通过 HTTP endpoint 暴露 MCP 能力。
- 支持网络部署、认证、网关、负载均衡和观测。
- 适合企业内部平台或 SaaS。
- 需要处理会话、连接中断、授权和跨租户隔离。

适合：

- 企业知识库。
- 工单系统。
- 云资源管理。
- 远程代码平台。
- 共享 MCP 工具平台。

风险：

- 远程 server 身份必须验证。
- 用户权限不能只靠模型上下文传递。
- 高危工具必须有确认和审计。
- 网络重试可能造成重复执行，要考虑幂等。

### 3. 旧 SSE 方案和版本兼容

早期 MCP 远程传输使用 HTTP+SSE。现代规范主推 Streamable HTTP。学习和生产时要注意：

- 不同客户端和 server 可能支持不同传输。
- 文档、SDK、示例可能仍使用旧 SSE。
- 平台迁移时要明确协议版本和传输版本。
- 网关需要兼容或拒绝旧传输。

> **重点：** 传输差异不改变 MCP 的核心能力语义，但会改变部署、安全和运维方式。

### 4. 会话和重连

远程传输要回答：

- 会话如何标识。
- 连接断开后是否可恢复。
- 请求是否可以安全重试。
- 流式消息是否会重复。
- server 是否保存会话状态。

高风险工具调用不要依赖简单 HTTP 重试。应使用业务幂等键、状态机或显式确认。

### 5. 传输层观测

生产中至少记录：

- server 名称和版本。
- 协议版本。
- 传输类型。
- session id。
- request id。
- tool name。
- 调用用户和租户。
- 延迟、错误码、取消、超时。

## 例子

本地 stdio server 配置思路：

```json
{
  "mcpServers": {
    "local-files": {
      "command": "node",
      "args": ["./dist/file-server.js"],
      "env": {
        "ALLOWED_ROOT": "D:/workspace/job_search"
      }
    }
  }
}
```

远程 HTTP server 设计：

```text
Host
  -> Enterprise MCP Gateway
      -> authn/authz
      -> rate limit
      -> audit log
      -> MCP server: ticket, knowledge, database
```

## 练习

1. 判断本地文件读取、企业工单查询、云资源删除分别适合哪种传输。
2. 为远程 MCP server 设计一次工具调用的审计字段。
3. 解释网络重试为什么会让有副作用工具变危险。

## 验收

- 能区分 stdio 和 Streamable HTTP。
- 能说明传输选择对安全和部署的影响。
- 能识别旧 SSE 文档或实现的兼容风险。
- 能设计远程 MCP 的基础观测字段。

## 重点

- stdio 适合本地进程，Streamable HTTP 适合远程服务。
- 远程 MCP 必须有认证、授权、审计和租户隔离。
- 有副作用工具必须考虑幂等和重试。

## 难点

- 传输层错误和工具执行错误要分开。
- 断线重连时，要避免重复执行高危动作。
- 网关既要理解 HTTP，也要理解 MCP 的工具语义。

## 易错

> **易错：** 把远程 MCP server 当成本地可信插件使用。
>
> 正确做法：远程 server 必须按网络服务治理，做身份认证、授权、速率限制、日志和隔离。

