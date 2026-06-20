---
title: "MCP 学习资料：协议生命周期、JSON-RPC 和能力协商"
date: 2026-06-20
description: "MCP 的协议层不是“随便发 JSON”。它建立在 JSON-RPC 2.0 的请求、响应和通知模型之上。请求需要 id，响应要匹配 id，通知没有响应。生命周期从初始化开始，双方先交换版本、能力和实现信息，然后进入运行期。"
tags:
  - "AI"
  - "核心概念"
  - "MCP"
category: "AI"
---

# MCP 学习资料：协议生命周期、JSON-RPC 和能力协商

[返回索引](../MCP学习资料.md)

## 学习目标

- 理解 MCP 使用 JSON-RPC 2.0 消息模型。
- 掌握 initialize、initialized、运行期请求和关闭流程。
- 能解释能力协商的意义和兼容性处理。
- 能设计错误处理、取消、进度和日志的基本策略。

## 理论导读

MCP 的协议层不是“随便发 JSON”。它建立在 JSON-RPC 2.0 的请求、响应和通知模型之上。请求需要 `id`，响应要匹配 `id`，通知没有响应。生命周期从初始化开始，双方先交换版本、能力和实现信息，然后进入运行期。

能力协商是 MCP 的关键机制。不同 host 和 server 可能支持不同版本、不同能力。初始化阶段明确双方能力，可以避免客户端调用不存在的能力，也便于服务端根据客户端能力决定是否使用 roots、sampling、elicitation 等反向能力。

## 核心心智模型

```text
连接建立
  -> client: initialize
  -> server: initialize result
  -> client: initialized notification
  -> operation: list/read/call/get/notifications
  -> shutdown/close
```

## 知识点详解

### 1. JSON-RPC 消息类型

请求：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

成功响应：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": []
  }
}
```

错误响应：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params"
  }
}
```

通知：

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}
```

### 2. 初始化

客户端发送 `initialize`，通常包含：

- `protocolVersion`：客户端希望使用的协议版本。
- `capabilities`：客户端能力，例如 roots、sampling、elicitation。
- `clientInfo`：客户端名称和版本。

服务端返回：

- `protocolVersion`：最终协商使用的协议版本。
- `capabilities`：服务端能力，例如 tools、resources、prompts。
- `serverInfo`：服务端名称和版本。

简化示例：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "roots": {},
      "sampling": {},
      "elicitation": {}
    },
    "clientInfo": {
      "name": "job-assistant-host",
      "version": "1.0.0"
    }
  }
}
```

### 3. 能力协商

能力协商回答两个问题：

- Client 能给 server 提供什么能力。
- Server 能给 client 提供什么能力。

常见 server capabilities：

```json
{
  "tools": {},
  "resources": {
    "subscribe": true,
    "listChanged": true
  },
  "prompts": {
    "listChanged": true
  }
}
```

常见 client capabilities：

```json
{
  "roots": {
    "listChanged": true
  },
  "sampling": {},
  "elicitation": {}
}
```

> **重点：** 能力不存在时不能假设可调用。服务端要根据客户端能力决定是否发起 roots、sampling 或 elicitation 请求。

### 4. 请求、通知和状态变化

运行期常见请求：

- `tools/list`
- `tools/call`
- `resources/list`
- `resources/read`
- `prompts/list`
- `prompts/get`
- `roots/list`
- `sampling/createMessage`
- `elicitation/create`

常见通知：

- 初始化完成通知。
- 列表变化通知。
- 进度通知。
- 日志通知。
- 取消通知。

通知没有响应，因此不能用通知承载必须确认成功的高风险动作。

### 5. 错误、取消和进度

错误要分层：

- 协议错误：JSON-RPC 格式错误、方法不存在、参数无效。
- 业务错误：外部系统返回权限不足、资源不存在、状态冲突。
- 工具执行错误：命令失败、超时、校验失败。
- 安全拒绝：权限不足、高危操作未确认、策略禁止。

取消和进度用于长任务：

- 长时间工具调用应支持取消。
- 批处理、搜索、索引构建应发进度。
- 取消不等于外部系统一定回滚，必须明确幂等和补偿。

## 例子

工具调用请求：

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "search_candidates",
    "arguments": {
      "keyword": "PostgreSQL",
      "city": "Shanghai"
    }
  }
}
```

工具调用结果：

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 12 candidates."
      }
    ],
    "structuredContent": {
      "count": 12
    }
  }
}
```

## 练习

1. 手写一组 `initialize` 和 `initialized` 消息。
2. 为一个不支持 tools 的 server 设计能力返回。
3. 设计一个工具超时后的错误返回。
4. 说明通知为什么不能用于必须确认成功的操作。

## 验收

- 能区分 request、response、notification。
- 能解释初始化的三个阶段。
- 能说明能力协商如何影响运行期调用。
- 能为工具执行失败设计错误分类。

## 重点

- MCP 运行在 JSON-RPC 2.0 消息模型之上。
- 初始化是协议兼容和能力边界的基础。
- 请求有响应，通知无响应。

## 难点

- 协议错误和业务错误不要混在一起。
- 取消长任务时，外部系统状态可能已经变化。
- 能力协商不是文档装饰，而是运行期行为约束。

## 易错

> **易错：** 服务端未声明 tools 能力，客户端仍直接调用 `tools/list`。
>
> 正确做法：客户端根据初始化返回的 server capabilities 决定可用功能。

