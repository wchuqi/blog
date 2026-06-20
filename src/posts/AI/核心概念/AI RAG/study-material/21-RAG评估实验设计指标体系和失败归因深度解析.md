---
title: "AI RAG 学习资料：RAG 评估实验设计、指标体系和失败归因深度解析"
date: 2026-06-20
description: "RAG 优化很容易“改一个参数，看几个问题，感觉更好”。这不可靠。可靠评估需要固定数据、固定问题、固定标注、固定版本，并把指标拆到链路每一层。"
tags:
  - "AI"
  - "核心概念"
  - "AI RAG"
  - "深度解析"
  - "实践练习"
category: "AI"
---

# AI RAG 学习资料：RAG 评估实验设计、指标体系和失败归因深度解析

[返回索引](../AI RAG学习资料.md)

## 学习目标

- 掌握 RAG 离线评估和线上监控的实验设计。
- 理解检索指标、生成指标和业务指标的关系。
- 能设计一次可靠的 RAG 改动评估。

## 理论导读

RAG 优化很容易“改一个参数，看几个问题，感觉更好”。这不可靠。可靠评估需要固定数据、固定问题、固定标注、固定版本，并把指标拆到链路每一层。

## 评测集分层

| 类型 | 目的 |
| --- | --- |
| Simple factual | 检查基础事实召回 |
| Exact identifier | 检查错误码、函数名、条款号 |
| Comparison | 检查多证据对比 |
| Multi-hop | 检查查询规划和证据链 |
| Insufficient evidence | 检查拒答 |
| Permission | 检查越权 |
| Injection | 检查提示注入 |
| Conflict | 检查冲突处理 |

## 指标闭环

```text
recall@k 低 -> 召回问题
recall@k 高但 MRR 低 -> 排序问题
证据进上下文但答案错 -> 生成忠实性问题
答案对但引用错 -> citation alignment 问题
该拒不拒 -> refusal policy 问题
```

## 对照实验

每次只改一个主要变量：

- chunk 策略 A vs B。
- embedding 模型 A vs B。
- top-k 10 vs 30。
- hybrid alpha 0.3 vs 0.7。
- 有 rerank vs 无 rerank。
- prompt v2 vs v3。

如果同时改 embedding、chunk 和 prompt，指标变好也不知道是谁带来的。

## 标注规范

每条样例应标注：

```json
{
  "question": "...",
  "question_type": "comparison",
  "required_evidence": ["doc1#sec2", "doc2#sec4"],
  "acceptable_answer_points": [],
  "unacceptable_claims": [],
  "permission_context": "employee",
  "expected_behavior": "answer|refuse|ask_clarification"
}
```

## 线上监控

| 指标 | 用途 |
| --- | --- |
| no_answer_rate | 证据不足或检索失败趋势 |
| citation_missing_rate | 引用格式或生成问题 |
| retrieval_empty_rate | 知识库或过滤问题 |
| p95 latency | 用户体验和成本 |
| token per answer | 成本治理 |
| feedback negative rate | 业务满意度 |
| safety block rate | 攻击或误杀趋势 |

## 练习

设计一次“引入 reranker”的实验：

- 假设。
- 评测集。
- 对照组。
- 指标。
- 通过标准。
- 回滚条件。

## 验收

- 能设计覆盖不同问题类型的评测集。
- 能解释指标变化对应哪一层问题。
- 能做单变量对照实验。
- 能将离线指标和线上监控连接起来。

## 重点

RAG 评估要同时回答：查到了吗、排对了吗、放进上下文了吗、答忠实了吗、引用对了吗。

## 难点

难点是标注成本。高质量 required evidence 标注比最终答案标注更有价值，但也更耗时。

## 易错

> **易错：** 只用 LLM-as-judge 给最终答案打分。
>
> 正确做法：先用可解释的检索和引用指标定位链路，再把 LLM-as-judge 作为辅助。

