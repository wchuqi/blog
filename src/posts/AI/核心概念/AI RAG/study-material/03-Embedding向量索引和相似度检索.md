---
title: "AI RAG 学习资料：Embedding、向量索引和相似度检索"
date: 2026-06-20
description: "Embedding 模型把文本转成高维向量，让语义相近的文本在向量空间中距离更近。向量检索不是“理解文档”，而是用向量距离近似判断文本相关性。"
tags:
  - "AI"
  - "核心概念"
  - "AI RAG"
category: "AI"
---

# AI RAG 学习资料：Embedding、向量索引和相似度检索

[返回索引](../AI RAG学习资料.md)

## 学习目标

- 理解 Embedding 如何把文本映射为向量。
- 掌握相似度计算、ANN 索引和向量检索的关键参数。
- 能判断纯向量检索的局限。

## 理论导读

Embedding 模型把文本转成高维向量，让语义相近的文本在向量空间中距离更近。向量检索不是“理解文档”，而是用向量距离近似判断文本相关性。

对 RAG 来说，embedding 的质量、索引参数、过滤规则和相似度阈值共同决定召回结果。

## 核心心智模型

可以把向量空间想象成一张语义地图：

- “如何重置密码”和“忘记密码怎么办”在地图上很近。
- “Java class loader”和“类加载器双亲委派”在地图上很近。
- “ERROR 401”和“认证失败”可能近，也可能因为错误码太短而不稳定。

这就是为什么技术文档常常需要关键词检索和向量检索结合。

## 知识点详解

### 相似度指标

| 指标 | 说明 | 注意点 |
| --- | --- | --- |
| Cosine similarity | 看方向相似度 | 常用于归一化语义向量 |
| Dot product | 看内积大小 | 受向量范数影响 |
| Euclidean distance | 看空间距离 | 高维下解释性较弱 |

如果向量库要求选择距离函数，必须与 embedding 模型推荐方式一致。

### ANN 索引

大规模向量不能每次全量扫描，常用 ANN, Approximate Nearest Neighbor, 近似最近邻索引。

| 索引 | 特点 | 权衡 |
| --- | --- | --- |
| HNSW | 图结构，高召回，查询快 | 内存占用较高 |
| IVF | 先聚类再搜索部分桶 | 需要调 nprobe |
| PQ | 压缩向量，省内存 | 精度下降 |

### 检索决策顺序

```text
1. 根据用户和业务条件做 metadata filter。
2. 对 query 生成 embedding。
3. 在过滤后的候选空间做 ANN 搜索。
4. 取 top-k 或超过阈值的结果。
5. 去重、补父文档、交给重排。
```

顺序很重要。权限过滤不能放到模型生成之后，否则模型可能已经看到了不该看的内容。

## 例子

```python
def vector_retrieve(query, user):
    filters = {
        "product": user.current_product,
        "permission": {"contains": user.role},
        "version": {"gte": "2026.1"}
    }
    qvec = embed(query)
    candidates = vector_store.search(
        vector=qvec,
        top_k=30,
        filters=filters
    )
    return dedupe_by_doc_and_section(candidates)
```

## 练习

构造 20 个技术问答问题，记录：

- 纯向量检索 top-10 命中了哪些 chunk。
- 哪些问题漏掉了关键文档。
- 漏检原因是术语不匹配、chunk 切分、metadata 过滤还是 embedding 模型问题。

## 验收

- 能解释 cosine、dot product 和向量归一化。
- 能说明 HNSW 等 ANN 索引的近似含义。
- 能判断何时需要混合检索。
- 能解释为什么 top-k 越大不一定越好。

## 重点

向量检索解决语义相似，不保证事实充分、版本正确或权限安全。

## 难点

难点是召回和噪声的平衡：top-k 太小会漏证据，top-k 太大会增加重排成本和上下文噪声。

## 易错

> **易错：** 看到相似度高就认为文档足以回答。
>
> 正确做法：把相似度当作候选信号，再做重排、证据覆盖和答案约束。

