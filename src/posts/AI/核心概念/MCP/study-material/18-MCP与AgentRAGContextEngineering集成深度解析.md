---
title: "MCP 学习资料：MCP 与 Agent、RAG、Context Engineering 集成深度解析"
date: 2026-06-20
description: "MCP 不是 Agent 框架，但 Agent 经常通过 MCP 获得工具和上下文。MCP 也不是 RAG，但 Resources 和 Tools 可以成为检索和证据入口。MCP 更不是 Context Engineering 的全部，但它…"
tags:
  - "AI"
  - "核心概念"
  - "MCP"
  - "深度解析"
category: "AI"
---

# MCP 学习资料：MCP 与 Agent、RAG、Context Engineering 集成深度解析

[返回索引](../MCP学习资料.md)

## 学习目标

- 理解 MCP 在 Agent、RAG、Context Engineering 中的位置。
- 能设计工具选择、资源注入、证据引用、上下文预算和记忆治理。
- 能识别多轮 Agent 使用 MCP 时的上下文污染和权限扩散风险。

## 理论导读

MCP 不是 Agent 框架，但 Agent 经常通过 MCP 获得工具和上下文。MCP 也不是 RAG，但 Resources 和 Tools 可以成为检索和证据入口。MCP 更不是 Context Engineering 的全部，但它会决定哪些外部信息进入上下文、哪些动作被执行、结果如何反馈给模型。

所以 MCP 的深度应用必须放进“模型决策循环”里理解。

## 核心心智模型

```text
Agent loop:
  observe -> plan -> select context/tool -> act -> observe result -> update state

MCP touches:
  context discovery
  tool execution
  evidence retrieval
  user elicitation
  result injection
```

## 知识点详解

### 1. MCP 与 RAG

RAG 关注检索证据。MCP 可以提供：

- resource：可读文档或资源。
- tool：动态检索、搜索、过滤、重排。
- prompt：证据总结模板。

设计问题：

- 证据是否可追溯。
- resource URI 是否可引用。
- 检索结果是否带权限过滤。
- 结果是否过大。
- 是否把恶意文档指令注入模型。

### 2. MCP 与 Agent

Agent 关注多步规划和执行。MCP 提供执行能力，但 Agent 必须管理：

- 工具候选空间。
- 工具调用顺序。
- 中间结果。
- 错误恢复。
- 用户确认。
- 长任务状态。

Agent 不应直接获得所有工具。Host 应按任务、用户和上下文过滤可用工具。

### 3. MCP 与 Context Engineering

MCP 影响上下文工程的多个环节：

- 选择哪些 resources 注入。
- 选择哪些 tool descriptions 暴露给模型。
- 工具结果如何压缩。
- 多轮中哪些结果保留。
- 外部文本如何隔离。
- 权限和信任标签如何进入上下文。

### 4. 工具候选集控制

工具太多会导致：

- 模型选择困难。
- token 成本上升。
- 误用高危工具。
- 描述冲突。

控制方式：

- 按任务路由工具。
- 按用户权限过滤工具。
- 按风险隐藏高危工具，直到用户明确请求。
- 给工具分组。
- 使用少量高质量工具替代大量重叠工具。

### 5. 结果注入和上下文污染

Tool/resource 返回结果可能包含：

- 正常业务数据。
- 外部用户文本。
- 恶意提示。
- 错误信息。
- 下游系统 HTML 或 Markdown。

处理方式：

- 给结果打来源标签。
- 外部文本作为数据，不作为指令。
- 高危后续工具仍需确认。
- 对长结果摘要并保留 URI。
- 结构化字段和自然语言分离。

### 6. 长期记忆和 MCP

Agent 可能把 MCP 结果写入记忆。风险：

- 把敏感数据长期保存。
- 把临时权限结果永久化。
- 把提示注入写进记忆。
- 跨租户污染。

治理：

- 记忆写入审批。
- 数据分类。
- TTL。
- 租户隔离。
- 可删除和可审计。

## 例子

招聘 Agent 工作流：

```text
User: 帮我找 5 个适合 PostgreSQL DBA 岗位的候选人，并安排第一轮面试。

1. Host 暴露 search_candidates、candidate profile resource、create_interview。
2. Agent 调用 search_candidates。
3. Agent 读取候选人 resource。
4. Agent 用 prompt 总结匹配度。
5. Agent 向用户展示候选人和建议。
6. 用户确认安排前 2 人。
7. Agent 调用 create_interview。
8. 结果写审计，不把候选人隐私写入长期记忆。
```

## 练习

1. 为一个 Agent 任务设计工具候选集过滤规则。
2. 把 RAG 检索结果设计成 MCP resource 和 tool。
3. 设计工具结果进入上下文的压缩和信任标签。
4. 判断哪些 MCP 结果不应写入长期记忆。

## 验收

- 能说明 MCP 和 RAG/Agent/Context Engineering 的边界。
- 能设计多轮工具调用的上下文和权限控制。
- 能识别结果注入和记忆污染风险。

## 重点

- MCP 是 Agent 的外部能力层，不是 Agent 全部。
- 工具候选集必须按任务和权限过滤。
- 外部结果进入上下文后仍是不可信数据。

## 难点

- 多轮工具结果会累积影响模型后续决策。
- RAG 证据、工具结果和用户指令混在上下文中时，信任边界容易模糊。

## 易错

> **易错：** 把所有 MCP server 的所有工具一次性暴露给 Agent。
>
> 正确做法：按任务、用户、风险和阶段动态选择工具候选集。

