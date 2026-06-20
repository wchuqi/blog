---
title: "AI Agent学习资料：工具调用Function Calling和MCP"
date: 2026-06-20
description: "工具调用是 Agent 从“会说”变成“会做”的关键。模型根据上下文选择工具和参数，系统执行工具，再把结果反馈给模型。工具调用必须结构化、受权限控制、可审计。"
tags:
  - "AI"
  - "核心概念"
  - "AI Agent"
category: "AI"
---

# AI Agent学习资料：工具调用Function Calling和MCP

[返回索引](../AI Agent学习资料.md)

## 学习目标

- 理解工具调用的机制和风险。
- 掌握 function calling、工具 schema、MCP 的边界。
- 能设计安全、可验证的工具接口。

## 理论导读

工具调用是 Agent 从“会说”变成“会做”的关键。模型根据上下文选择工具和参数，系统执行工具，再把结果反馈给模型。工具调用必须结构化、受权限控制、可审计。

## 工具调用机制

```text
用户目标 -> 模型选择工具 -> 生成结构化参数 -> 系统校验参数 -> 执行工具 -> 返回结构化结果 -> 模型继续推理
```

工具 schema 示例：

```json
{
  "name": "get_order",
  "description": "根据订单ID查询订单状态",
  "parameters": {
    "type": "object",
    "properties": {
      "order_id": { "type": "string" }
    },
    "required": ["order_id"]
  }
}
```

## 工具设计原则

- 工具职责单一。
- 参数结构化。
- 返回结果结构化。
- 错误可分类。
- 有权限边界。
- 幂等优先。
- 高风险操作需要确认。
- 不把任意 shell、SQL、HTTP 暴露给模型。

## MCP是什么

MCP 即 Model Context Protocol，可以理解为模型应用连接外部工具、资源和提示模板的一种标准协议。它的价值是让不同 Agent 客户端能以统一方式发现和调用工具、读取资源、使用提示模板。

MCP 常见元素：

- Tools：可调用动作。
- Resources：可读取上下文资源。
- Prompts：可复用提示模板。
- Client：Agent 或模型应用。
- Server：提供工具和资源的一侧。

## Function Calling vs MCP

| 对比 | Function Calling | MCP |
| --- | --- | --- |
| 关注点 | 单个模型调用如何选择函数 | 模型应用如何连接工具和资源生态 |
| 作用范围 | API 层工具调用 | 协议层工具和上下文集成 |
| 适合 | 应用内部工具 | 跨工具、跨客户端复用 |
| 风险 | 参数幻觉、越权调用 | 工具发现、权限和服务信任 |

## 工具错误处理

| 错误 | 处理 |
| --- | --- |
| 参数缺失 | 要求模型补齐或询问用户 |
| 参数非法 | 返回结构化校验错误 |
| 权限不足 | 转人工或请求授权 |
| 外部系统失败 | 有限重试 |
| 结果为空 | 让模型判断是否换工具或询问用户 |
| 高风险动作 | 必须用户确认 |

## 例子

危险工具：

```json
{
  "name": "run_sql",
  "description": "执行任意SQL"
}
```

更安全的工具：

```json
{
  "name": "get_customer_orders",
  "description": "只读查询指定客户订单",
  "parameters": {
    "type": "object",
    "properties": {
      "customer_id": { "type": "string" },
      "limit": { "type": "integer", "maximum": 20 }
    },
    "required": ["customer_id"]
  }
}
```

## 练习

为“客服退款 Agent”设计 5 个工具：

- 查询订单。
- 查询退款规则。
- 创建售后工单。
- 发送用户通知。
- 发起退款审批。

每个工具写出参数、返回、权限和错误。

## 验收

- 能解释工具调用完整链路。
- 能设计结构化工具 schema。
- 能说明 MCP 与 function calling 的区别。
- 能识别危险工具接口。

## 重点

工具是 Agent 的行动边界。工具设计得越粗糙，Agent 风险越高。

## 难点

难点是工具粒度。太细会导致调用链复杂，太粗会隐藏风险和副作用。

## 易错

> **易错：** 给 Agent 暴露万能工具，例如任意 shell、任意 SQL、任意 HTTP。
>
> 正确做法：把高风险能力封装成窄接口，并加权限、审计和确认。

