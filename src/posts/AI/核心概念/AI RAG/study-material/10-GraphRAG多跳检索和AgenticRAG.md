---
title: "AI RAG 学习资料：GraphRAG、多跳检索和 Agentic RAG"
date: 2026-06-20
description: "基础 RAG 适合从文档中找相关片段并回答。复杂问题可能需要跨多个实体、关系、版本、数据库和工具进行多步检索。此时可以引入 GraphRAG 或 Agentic RAG。"
tags:
  - "AI"
  - "核心概念"
  - "AI RAG"
category: "AI"
---

# AI RAG 学习资料：GraphRAG、多跳检索和 Agentic RAG

[返回索引](../AI RAG学习资料.md)

## 学习目标

- 理解 GraphRAG、多跳检索和 Agentic RAG 的适用场景。
- 能设计多源、多步骤证据获取流程。
- 能判断进阶 RAG 是否值得引入。

## 理论导读

基础 RAG 适合从文档中找相关片段并回答。复杂问题可能需要跨多个实体、关系、版本、数据库和工具进行多步检索。此时可以引入 GraphRAG 或 Agentic RAG。

## 核心心智模型

基础 RAG 像查资料回答单题；GraphRAG 像沿着实体关系网找线索；Agentic RAG 像让一个有工具的研究助理分步规划、查询、验证和总结。

## GraphRAG

GraphRAG 通常包含：

```text
文档 -> 实体抽取 -> 关系抽取 -> 图构建 -> 社区/路径检索 -> 文本证据回填 -> 生成
```

适合：

- 实体关系密集。
- 问题需要多跳路径。
- 文档分散但实体之间有关联。
- 需要全局摘要或关系分析。

不适合：

- 简单 FAQ。
- 知识库小且结构清晰。
- 没有高质量实体抽取能力。
- 没有评估集证明图检索收益。

## Agentic RAG

Agentic RAG 让模型参与检索规划：

```text
分析问题 -> 选择工具 -> 检索 -> 检查证据缺口 -> 继续检索 -> 综合回答
```

它适合复杂研究、排障和多源问题，但更难控制成本、延迟和稳定性。

## 多跳检索例子

问题：

```text
某客户出现退款失败，是否和最近支付 API 的认证变更有关？
```

可能需要：

- SQL 查询客户退款失败日志。
- 检索支付 API 变更文档。
- 检索错误码解释。
- 检索客户使用的 SDK 版本。
- 合成证据链。

## 练习

设计一个检索路由器：

```python
def route(question):
    if asks_for_current_record(question):
        return ["sql"]
    if asks_for_relationship_path(question):
        return ["graph", "vector"]
    if contains_error_code(question):
        return ["bm25", "vector"]
    if needs_comparison(question):
        return ["hybrid", "multi_query"]
    return ["hybrid"]
```

扩展它，让每个路由都有超时、权限和失败回退。

## 验收

- 能解释 GraphRAG 和普通 RAG 的区别。
- 能说明 Agentic RAG 的收益和风险。
- 能为复杂问题拆分检索步骤。
- 能设计多源证据合成和失败回退。

## 重点

进阶 RAG 的价值来自证据结构和任务复杂度，而不是名词本身。

## 难点

难点是控制不确定性。Agent 每多一步检索，就多一次成本、延迟和错误传播。

## 易错

> **易错：** 基础 RAG 没有评估好就上 GraphRAG 或 Agentic RAG。
>
> 正确做法：先建立基础 RAG 基线和评测集，再用指标证明进阶方案带来收益。

