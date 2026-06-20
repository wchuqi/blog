---
title: "Prompt Engineering 学习资料：Context Engineering、上下文工程和记忆压缩深度解析"
date: 2026-06-20
description: "Prompt writing 关注“写什么指令”。Context Engineering 关注“模型这次调用应该看到哪些信息、以什么顺序、带什么元数据、保留多久、如何压缩、如何防注入”。"
tags:
  - "AI"
  - "工程实践"
  - "Prompt Engineering"
  - "深度解析"
category: "AI"
---

# Prompt Engineering 学习资料：Context Engineering、上下文工程和记忆压缩深度解析

[返回索引](../Prompt Engineering学习资料.md)

## 学习目标

- 理解 Context Engineering 与传统 prompt writing 的区别。
- 掌握上下文选择、排序、压缩、记忆、状态和冲突治理。
- 能为长任务设计上下文预算和记忆策略。

## 什么是 Context Engineering

Prompt writing 关注“写什么指令”。Context Engineering 关注“模型这次调用应该看到哪些信息、以什么顺序、带什么元数据、保留多久、如何压缩、如何防注入”。

一次模型调用的上下文通常包括：

- 系统规则。
- 当前用户请求。
- 历史摘要。
- 任务状态。
- 检索文档。
- 工具结果。
- 示例。
- 安全策略。

## 上下文预算

上下文窗口有限，即使很大也有成本和注意力问题。需要给每类内容分预算：

| 内容 | 预算原则 |
| --- | --- |
| 系统规则 | 短、稳定、不可缺 |
| 用户当前请求 | 原文保留 |
| 历史对话 | 摘要和状态化 |
| 检索资料 | 只放相关证据 |
| 工具结果 | 结构化摘要 |
| 示例 | 只放高价值样例 |

## 上下文排序策略

常见排序：

```text
稳定规则 -> 任务目标 -> 输出格式 -> 当前输入 -> 检索资料 -> 工具结果 -> 示例
```

但不同任务可调整：

- RAG：资料和引用规则靠近问题。
- JSON：schema 靠近输出指令。
- Agent：当前状态和允许动作靠近工具规则。
- 安全：不可信资料必须明确包裹。

## 记忆压缩

多轮任务不能无限保留历史。压缩策略：

### 摘要压缩

把历史对话总结成短文本。风险是丢细节。

### 状态压缩

把历史转成结构化状态。更适合 Agent。

```json
{
  "confirmed": {
    "target_role": "Backend Engineer",
    "city": "Shanghai"
  },
  "open_questions": ["expected_salary"],
  "decisions": [],
  "risks": []
}
```

### 证据压缩

只保留支持结论的证据片段。适合 RAG。

## 上下文污染

污染来源：

- 历史对话中过期要求。
- 外部资料中的恶意指令。
- 工具返回中的错误状态。
- 示例中的旧 schema。
- 用户输入伪造系统信息。

防护：

- 每类上下文标注来源。
- 历史摘要带时间和有效期。
- 当前任务优先于历史。
- 外部资料不具备指令权限。
- schema 版本和示例版本一致。

## 上下文选择算法思维

可以把上下文选择看作排序问题：

```text
score = relevance + authority + recency + diversity - risk - token_cost
```

其中：

- relevance：和当前问题相关。
- authority：来源可信。
- recency：是否最新。
- diversity：是否覆盖不同证据。
- risk：是否不可信或含注入。
- token_cost：占用上下文成本。

## 练习

为一个“长期求职助手”设计上下文系统：

- 哪些信息保留为长期记忆？
- 哪些信息只保留当前会话？
- 哪些信息每次从工具查询？
- 历史如何压缩？
- 用户要求和旧偏好冲突时怎么处理？

## 验收

- 能区分 prompt writing 和 context engineering。
- 能设计上下文预算。
- 能用结构化状态替代冗长历史。
- 能识别上下文污染。

## 难点

上下文工程的本质是“选择”。不选择会导致 prompt 变长、噪声变多、成本变高、风险变大。高级 Prompt Engineering 必须能决定什么不放进上下文。

