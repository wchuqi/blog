---
title: "MCP 学习资料：工具 Schema、结构化输出和错误处理"
date: 2026-06-20
description: "Tool 是 MCP 最容易产生价值也最容易出事故的能力。模型会根据工具名称、描述和 Schema 判断何时调用工具。Schema 过宽，模型容易传错参数；描述不清，模型容易误用；错误处理不清，host 和模型无法知道是否应该重试、改参或停…"
tags:
  - "AI"
  - "核心概念"
  - "MCP"
category: "AI"
---

# MCP 学习资料：工具 Schema、结构化输出和错误处理

[返回索引](../MCP学习资料.md)

## 学习目标

- 能设计清晰、严格、可验证的 MCP tool Schema。
- 掌握结构化输出、文本输出和错误返回的边界。
- 能处理参数校验、业务错误、超时、取消和幂等。

## 理论导读

Tool 是 MCP 最容易产生价值也最容易出事故的能力。模型会根据工具名称、描述和 Schema 判断何时调用工具。Schema 过宽，模型容易传错参数；描述不清，模型容易误用；错误处理不清，host 和模型无法知道是否应该重试、改参或停止。

好工具不是“能执行”，而是“可发现、可理解、可约束、可审计、可恢复”。

## 核心心智模型

```text
Tool Contract =
  name + description + inputSchema + outputSchema/structuredContent
  + permission + side effect + error model + audit
```

## 知识点详解

### 1. 工具命名和描述

命名原则：

- 使用业务动作：`search_candidates`、`create_interview`。
- 避免万能词：`execute`、`run`、`do_anything`。
- 名称稳定，避免频繁改名。

描述要说明：

- 工具做什么。
- 何时使用。
- 参数含义。
- 是否有副作用。
- 限制和风险。

### 2. 输入 Schema

输入 Schema 应尽量严格：

```json
{
  "type": "object",
  "properties": {
    "keyword": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "city": {
      "type": "string",
      "enum": ["Shanghai", "Beijing", "Shenzhen", "Remote"]
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50,
      "default": 10
    }
  },
  "required": ["keyword"],
  "additionalProperties": false
}
```

关键点：

- 用 enum 限制可选值。
- 用 min/max 限制长度和数量。
- 禁止额外字段。
- 对高危字段使用更严格类型。
- 不让模型传入原始 SQL、shell、URL 白名单外地址。

### 3. 结构化输出

工具结果通常要同时服务模型阅读和程序处理：

```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 3 candidates matching PostgreSQL in Shanghai."
    }
  ],
  "structuredContent": {
    "count": 3,
    "candidates": [
      {
        "id": "c_1001",
        "name": "Alice",
        "skills": ["PostgreSQL", "Java"]
      }
    ]
  }
}
```

文本适合给模型读，结构化数据适合 host 渲染、后续调用和测试断言。

### 4. 错误处理

错误要给出可行动信息：

| 错误类型 | 示例 | 处理 |
| --- | --- | --- |
| 参数错误 | `city` 不在 enum | 让模型或用户修正参数 |
| 权限错误 | 用户无权查看候选人 | 停止，不要重试 |
| 业务冲突 | 面试时间冲突 | 提供可选时间 |
| 外部依赖失败 | ATS 超时 | 可重试或降级 |
| 策略拒绝 | 高危操作未确认 | 请求确认或拒绝 |

工具执行失败不一定是 JSON-RPC 协议失败。协议成功返回的结果里也可以表达工具业务失败。要区分“消息没送到”和“工具执行失败”。

### 5. 幂等和重试

有副作用工具必须考虑：

- 请求是否可重试。
- 是否有 idempotency key。
- 重试是否会重复创建资源。
- 取消时外部系统是否已经执行。

示例字段：

```json
{
  "idempotency_key": "create_interview_20260608_c1001_j2001",
  "candidate_id": "c1001",
  "job_id": "j2001",
  "start_time": "2026-06-10T10:00:00+08:00"
}
```

### 6. 高危工具设计

高危工具包括：

- 删除、转账、发布、部署、扩容。
- 执行 SQL 或 shell。
- 修改权限。
- 发送邮件或外部通知。
- 访问敏感数据。

控制措施：

- 最小参数集。
- dry-run。
- 二次确认。
- 策略检查。
- 审计日志。
- 回滚或补偿方案。

## 例子

不好的工具：

```json
{
  "name": "run_sql",
  "description": "Run any SQL",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sql": { "type": "string" }
    }
  }
}
```

更好的拆分：

```json
{
  "name": "search_candidates",
  "description": "Search candidates by controlled filters. This tool never returns private contact details.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "skill": { "type": "string", "maxLength": 50 },
      "city": { "type": "string", "maxLength": 50 },
      "limit": { "type": "integer", "minimum": 1, "maximum": 20 }
    },
    "required": ["skill"],
    "additionalProperties": false
  }
}
```

## 练习

1. 把一个万能 SQL 工具拆成 4 个受控查询工具。
2. 为 `create_interview` 设计 Schema、错误类型和幂等字段。
3. 为一个删除工具添加 dry-run 和确认参数。

## 验收

- 能写出严格 JSON Schema。
- 能区分协议错误和工具业务错误。
- 能设计结构化输出。
- 能说明有副作用工具的幂等和重试风险。

## 重点

- Tool Schema 是模型行为和系统安全的共同约束。
- 结构化输出让结果可测试、可渲染、可组合。
- 高危工具必须有确认、审计和回滚。

## 难点

- 工具描述会影响模型选择工具的方式。
- 错误返回要让模型知道是改参数、重试、请求权限还是停止。

## 易错

> **易错：** Schema 只写 `type: object`，不限制字段。
>
> 正确做法：明确 required、enum、长度、范围和 `additionalProperties: false`。

