---
title: "AI RAG 学习资料：RAG 系统架构和生命周期深度解析"
date: 2026-06-20
description: "RAG 是一个持续运行的信息系统。它有两个生命周期：知识库生命周期和查询生命周期。知识库生命周期决定“系统知道什么、什么时候知道、谁能看到”；查询生命周期决定“一次用户问题如何被理解、检索、证据化和回答”。"
tags:
  - "AI"
  - "核心概念"
  - "AI RAG"
  - "深度解析"
category: "AI"
---

# AI RAG 学习资料：RAG 系统架构和生命周期深度解析

[返回索引](../AI RAG学习资料.md)

## 学习目标

- 从系统生命周期理解 RAG，而不是只看一次问答链路。
- 掌握数据面、查询面、评估面、安全面和运维面的职责边界。
- 能画出生产 RAG 的状态迁移和版本治理模型。

## 理论导读

RAG 是一个持续运行的信息系统。它有两个生命周期：知识库生命周期和查询生命周期。知识库生命周期决定“系统知道什么、什么时候知道、谁能看到”；查询生命周期决定“一次用户问题如何被理解、检索、证据化和回答”。

如果只看查询链路，会忽略大量生产问题：文档更新没有触发索引重建，旧 chunk 没删除，缓存没有失效，权限字段丢失，评测集和索引版本不匹配，回答引用到已废弃文档。

## 核心心智模型

把 RAG 看成三条流水线：

```text
数据流水线：source -> parse -> chunk -> metadata -> embed -> index -> validate
查询流水线：question -> plan -> retrieve -> rerank -> pack -> generate -> verify
治理流水线：eval -> monitor -> audit -> rollback -> improve -> release
```

这三条流水线必须通过版本号连接：

- 文档版本。
- chunk 策略版本。
- embedding 模型版本。
- 索引版本。
- rerank 模型版本。
- prompt 版本。
- LLM 版本。
- 评测集版本。

## 状态模型

### 文档状态

```text
discovered -> parsed -> chunked -> embedded -> indexed -> validated -> active
     |            |          |          |          |           |
     v            v          v          v          v           v
  rejected     parse_failed chunk_failed embed_failed index_failed deprecated
```

每个状态都应该可查询。生产中常见问题是文档状态不可见，导致“明明上传了文档，为什么搜不到”无法定位。

### Query 状态

```text
received -> normalized -> planned -> retrieved -> reranked -> packed -> generated -> verified -> returned
```

任何阶段失败都要有降级策略。例如 rerank 超时时可返回只经过 hybrid retrieval 的结果，但必须降低置信度或提示证据质量。

## 架构分层

| 层 | 职责 | 不该做什么 |
| --- | --- | --- |
| Connector | 拉取文档和结构化数据 | 不做业务解释 |
| Parser | 解析格式和结构 | 不决定最终答案 |
| Indexer | 构建检索索引 | 不绕过权限字段 |
| Retriever | 快速召回候选 | 不保证最终证据充分 |
| Reranker | 精排候选证据 | 不负责生成答案 |
| Packer | 证据预算和格式化 | 不引入无来源结论 |
| Generator | 基于证据表达答案 | 不访问未授权数据 |
| Verifier | 引用、拒答、安全校验 | 不替代人工责任 |

## 关键设计决策

### 1. 索引是否强一致

内部知识库多数可以接受最终一致，但要向用户暴露“索引更新时间”。如果是法律、运维故障、价格等高风险知识，必须有更严格的更新和回滚机制。

### 2. 检索和权限谁先执行

权限应尽可能前置。多租户系统至少要在索引查询条件中加入 tenant 和 role；如果向量库过滤能力不足，要考虑按租户分索引或做检索后但打包前的硬校验。

### 3. 上下文预算如何分配

预算不是平均分。一般优先级：

```text
系统规则 > 安全约束 > 用户问题 > 高可信证据 > 低可信背景 > 历史摘要
```

## 例子：一次失败回答的生命周期追踪

```json
{
  "trace_id": "rag-001",
  "index_version": "kb_2026_06_07",
  "query_plan": ["auth v2 change", "migration auth token"],
  "retrieve_top_k": 50,
  "correct_evidence_rank": 17,
  "rerank_top_k": 5,
  "packed_evidence": ["E1", "E2", "E3"],
  "failure": "required evidence ranked 17 and not packed"
}
```

这说明问题不在生成层，而在重排和证据覆盖策略。

## 练习

为一个“企业制度问答 RAG”设计：

- 文档状态机。
- Query 状态机。
- 版本字段。
- 每个阶段的失败码。
- 每个阶段的降级策略。

## 验收

- 能画出数据、查询、治理三条流水线。
- 能说明一次答案由哪些版本共同决定。
- 能定位一次失败发生在哪个状态。
- 能设计索引更新和缓存失效规则。

## 重点

RAG 的生产质量来自生命周期管理，而不是单次回答效果。

## 难点

难点是版本组合爆炸。索引、prompt、模型、评测集同时变化时，必须能回放和分离变量。

## 易错

> **易错：** 只记录最终答案和用户反馈。
>
> 正确做法：记录完整 trace，让每次回答都能还原到具体数据版本、检索候选、排序分数和上下文包。

