---
title: "MCP 面试知识点：Tools、Resources 和 Prompts"
date: 2026-06-20
description: "好的 MCP tool 要具备："
tags:
  - "AI"
  - "核心概念"
  - "MCP"
  - "面试"
category: "AI"
---

# MCP 面试知识点：Tools、Resources 和 Prompts

[返回面试索引](../11-面试知识点整理.md)

[返回学习资料索引](../../MCP学习资料.md)

## 一、Tools、Resources 和 Prompts

### 1. 如何设计一个好的 MCP tool？

**参考答案：**

好的 MCP tool 要具备：

- 清晰稳定的名称。
- 明确描述何时使用、做什么、有什么限制。
- 严格 inputSchema。
- 可读文本输出和结构化输出。
- 明确错误类型。
- 权限、确认、审计和幂等控制。

不应该设计万能 `execute` 工具，而应该拆成业务语义明确的工具。

> **重点：** Tool 是协议、模型行为和安全治理的交汇点。

### 2. Tool 的 inputSchema 为什么重要？

**参考答案：**

inputSchema 限制模型可传参数，影响 host 校验、server 校验和工具安全。严格 Schema 可以减少错误调用和注入风险。

应使用 required、enum、min/max、maxLength、additionalProperties false 等约束。

```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 20
    }
  },
  "additionalProperties": false
}
```

> **易错：** Schema 写得很宽，实际把安全压力全部丢给 handler。

### 3. Resource URI 应该怎么设计？

**参考答案：**

Resource URI 应稳定、可解释、可权限校验。例如：

```text
repo://file/src/index.ts
ats://candidate/{candidate_id}/profile
db://schema/public/application
```

要避免把敏感 token、临时签名或复杂查询语句塞进 URI。动态资源可用 resource template。

> **重点：** URI 是资源身份，不是权限本身。读取时仍要校验用户权限。

### 4. Prompt 在 MCP 中有什么价值？

**参考答案：**

Prompt 是 server 提供的可复用任务模板。它能把外部系统的专业任务组织成稳定模式，例如“根据候选人和岗位生成面试问题”。

Prompt 的价值不是替代工具，而是降低用户和模型组织任务的成本。它可以引用 resource，也可以指导后续 tool 使用。

> **难点：** Prompt 内容也可能引入提示注入风险，不能让 prompt 绕过 host 的指令层级。

### 5. 如何处理工具返回结果？

**参考答案：**

工具结果应同时考虑模型阅读和程序处理：

- `content`：给模型或用户阅读的文本、图片等内容。
- `structuredContent`：给 host 渲染、后续工具调用和测试断言的机器可读数据。

返回内容要最小化，敏感字段要脱敏，列表要分页。

> **重点：** 结构化输出能提高可靠性、可测试性和可观测性。

