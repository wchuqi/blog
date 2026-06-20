---
title: "AI RAG 学习资料：BM25、稀疏检索、Hybrid 融合和排序算法深度解析"
date: 2026-06-20
description: "RAG 不能只依赖语义向量。企业知识库有大量精确标识：错误码、配置项、函数名、SKU、订单号、版本号、法规条款号。它们对 embedding 来说可能只是短文本或稀有词，但对答案至关重要。"
tags:
  - "AI"
  - "核心概念"
  - "AI RAG"
  - "深度解析"
category: "AI"
---

# AI RAG 学习资料：BM25、稀疏检索、Hybrid 融合和排序算法深度解析

[返回索引](../AI RAG学习资料.md)

## 学习目标

- 理解 BM25 为什么在 RAG 中仍然重要。
- 掌握稀疏检索和稠密检索的互补性。
- 能设计 Hybrid 融合、RRF 和 rerank 前候选构造策略。

## 理论导读

RAG 不能只依赖语义向量。企业知识库有大量精确标识：错误码、配置项、函数名、SKU、订单号、版本号、法规条款号。它们对 embedding 来说可能只是短文本或稀有词，但对答案至关重要。

## BM25 机制

BM25 的核心直觉：

- 查询词在文档中出现越多，相关性越高。
- 但词频收益递减。
- 出现在很多文档里的词区分度低。
- 文档长度需要归一化，避免长文天然占优。

简化理解：

```text
score(query, doc) = sum(IDF(term) * term_frequency_saturation * length_normalization)
```

关键参数：

| 参数 | 含义 | 影响 |
| --- | --- | --- |
| k1 | 词频饱和速度 | 越大越重视重复词 |
| b | 文档长度归一化 | 越大越惩罚长文 |

## 稀疏 vs 稠密

| 维度 | 稀疏检索 BM25 | 稠密检索 Embedding |
| --- | --- | --- |
| 优势 | 精确词、错误码、函数名 | 语义、同义表达 |
| 劣势 | 同义词弱、语义弱 | 专有词和短文本不稳 |
| 可解释性 | 较强 | 较弱 |
| 调试 | 看命中词 | 看向量空间和样例 |

## Hybrid 融合策略

### 分数加权

```text
final_score = alpha * dense_score + (1 - alpha) * sparse_score
```

问题：dense_score 和 sparse_score 的分布不同，直接相加可能失真。需要归一化或按排名融合。

### Reciprocal Rank Fusion

RRF 按排名融合，不依赖原始分数：

```text
score(d) = sum(1 / (k + rank_i(d)))
```

优点是鲁棒，适合不同检索器分数不可比的场景。

### 候选构造

推荐：

```text
bm25_top_50 + dense_top_50 + metadata_top_20 -> dedupe -> rerank_top_10
```

不要在融合前过早裁剪，否则某个通道的正确证据可能被丢掉。

## 排序调试

如果答案失败，查看：

- 正确证据在哪个通道被召回。
- 正确证据的 BM25 rank 和 dense rank。
- 融合后 rank。
- rerank 后 rank。
- 最终是否进入上下文。

## 练习

选一组包含错误码、函数名、自然语言描述的问题，比较：

- BM25 only。
- Dense only。
- Weighted hybrid。
- RRF hybrid。
- Hybrid + rerank。

记录每类问题的最佳策略。

## 验收

- 能解释 BM25 的 IDF 和长度归一化。
- 能说明为什么 Hybrid 常优于纯向量。
- 能设计 RRF 融合。
- 能用 rank 变化定位排序问题。

## 重点

Hybrid 检索不是“多加一个搜索器”，而是为不同证据类型建立互补召回通道。

## 难点

难点是分数不可比。不同检索器的分数尺度不同，直接加权需要谨慎。

## 易错

> **易错：** 用 dense_score 和 bm25_score 直接相加。
>
> 正确做法：先做分数归一化，或使用基于排名的 RRF，再交给 reranker。

