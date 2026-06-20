---
title: "AI RAG 学习资料：Rerank、Late Interaction、上下文压缩和证据覆盖深度解析"
date: 2026-06-20
description: "召回只回答“可能相关吗”，重排要回答“是否直接有助于回答当前问题”。但即便 rerank 分数高，也不代表证据充分。证据充分性要看问题需要哪些维度，而不是只看片段相关性。"
tags:
  - "AI"
  - "核心概念"
  - "AI RAG"
  - "深度解析"
category: "AI"
---

# AI RAG 学习资料：Rerank、Late Interaction、上下文压缩和证据覆盖深度解析

[返回索引](../AI RAG学习资料.md)

## 学习目标

- 深入理解 reranker、cross-encoder 和 late interaction 的差异。
- 掌握证据覆盖和上下文压缩的评估方式。
- 能设计“相关但不充分”的识别机制。

## 理论导读

召回只回答“可能相关吗”，重排要回答“是否直接有助于回答当前问题”。但即便 rerank 分数高，也不代表证据充分。证据充分性要看问题需要哪些维度，而不是只看片段相关性。

## Rerank 模型类型

| 类型 | 输入 | 特点 |
| --- | --- | --- |
| Bi-encoder | query 和 doc 分别编码 | 快，适合召回 |
| Cross-encoder | query 和 doc 拼接编码 | 精，慢，适合重排 |
| Late interaction | token 级交互后聚合 | 兼顾效率和细粒度匹配 |

Cross-encoder 能看到 query 和 doc 的交互，因此更容易判断“这个片段是否直接回答问题”。但它通常要对每个候选分别打分，成本高。

## Late Interaction 直觉

Late interaction 不把整段文本压成一个向量，而保留 token 级表示，让 query 的每个 token 去匹配文档 token，再聚合分数。它比单向量更细，比完整 cross-encoder 更可扩展。

适合：

- 技术术语多。
- 需要细粒度匹配。
- 候选量较大但要求高精度。

## 证据覆盖

相关性和充分性不同：

```text
问题：v1 到 v2 的认证变化有哪些？

相关证据：v2 使用 Authorization header。
不充分原因：缺 v1 认证方式，缺迁移影响。
```

覆盖表：

```json
{
  "requirements": ["v1_auth", "v2_auth", "migration_impact"],
  "coverage": {
    "v1_auth": [],
    "v2_auth": ["E1"],
    "migration_impact": ["E2"]
  },
  "decision": "continue_retrieval_or_partial_answer"
}
```

## 上下文压缩风险

压缩必须保留：

- 否定词：不支持、禁止、废弃。
- 条件：仅限企业版、仅限管理员。
- 时间：自 2026-05-01 起。
- 例外：除试用期员工外。
- 数值和单位。
- 来源和版本。

这些信息丢失会导致答案看似正确但实际错误。

## 练习

为 10 个复杂问题标注 requirements，然后检查 top-10 证据：

- 哪些证据相关但不充分。
- 哪些 requirement 缺失。
- 是否需要继续检索。
- 是否应该拒答。

## 验收

- 能解释 bi-encoder、cross-encoder、late interaction 的差异。
- 能区分 relevance 和 sufficiency。
- 能设计证据覆盖表。
- 能指出上下文压缩会丢失哪些关键限定。

## 重点

重排解决“哪个更相关”，证据覆盖解决“证据是否足够”。

## 难点

难点是复杂问题的 requirements 识别。没有 requirements，就无法判断证据是否充分。

## 易错

> **易错：** rerank top-5 后直接生成。
>
> 正确做法：在生成前检查证据覆盖，缺关键维度时继续检索、追问或拒答。

