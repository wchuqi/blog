---
title: "AI Context Engineering 学习资料：RAG、检索、重排和证据注入"
date: 2026-06-20
description: "RAG 的目标不是“给模型接一个向量库”，而是在回答时把足够相关、足够可信、足够完整的证据放到上下文中。一个 RAG 系统失败，可能是文档切分不合理、召回不到、排序错、压缩丢信息、引用不准确、prompt 没要求忠实，也可能是问题本身超出资…"
tags:
  - "AI"
  - "工程实践"
  - "AI Context Engineering"
category: "AI"
---

# AI Context Engineering 学习资料：RAG、检索、重排和证据注入

[返回索引](../AI Context Engineering学习资料.md)

## 学习目标

- 理解 RAG 是证据上下文工程。
- 掌握检索、重排、压缩和引用的基本流程。
- 能定位 RAG 失败原因。

## 理论导读

RAG 的目标不是“给模型接一个向量库”，而是在回答时把足够相关、足够可信、足够完整的证据放到上下文中。一个 RAG 系统失败，可能是文档切分不合理、召回不到、排序错、压缩丢信息、引用不准确、prompt 没要求忠实，也可能是问题本身超出资料范围。

## 标准流程

```text
query rewrite -> retrieve -> metadata filter -> rerank -> deduplicate
-> contextual compress -> pack evidence -> answer with citations
```

## 关键机制

| 环节 | 目标 | 常见问题 |
| --- | --- | --- |
| 切分 | 让片段可检索且语义完整 | chunk 太碎或太大 |
| 检索 | 找到候选证据 | query 表达不匹配 |
| 过滤 | 限定版本、权限、时间 | 混入旧文档 |
| 重排 | 提升真正相关片段 | top-k 相似但无答案 |
| 压缩 | 减少 token 噪声 | 摘要丢关键限制 |
| 引用 | 支持可验证回答 | 引用不存在或不支持结论 |

## 例子

```python
def rag_answer(question):
    rewritten = rewrite_query(question)
    candidates = hybrid_search(rewritten, filters={"doc_status": "active"})
    ranked = rerank(question, candidates)[:8]
    evidence = compress_for_question(question, ranked)
    context = pack_evidence(evidence, require_citations=True)
    return llm.answer(question=question, context=context)
```

## 失败归因

| 现象 | 可能原因 | 排查方式 |
| --- | --- | --- |
| 答案编造 | 没检索到证据或 prompt 没约束忠实 | 查看最终上下文 |
| 答非所问 | query rewrite 错或 rerank 错 | 对比候选列表 |
| 引用错误 | 引用格式和证据 ID 没绑定 | 检查引用生成逻辑 |
| 使用旧资料 | metadata filter 缺失 | 检查版本字段 |
| 漏掉关键条件 | chunk 切分破坏上下文 | 回看原文邻近段落 |

## 练习

建立一个 20 条问题的小评测集，每条标注应该命中的文档片段。运行 RAG 后记录：是否召回、是否被重排到前 5、答案是否忠实、引用是否正确。

## 验收

- 能解释 RAG 每一步的输入输出。
- 能从最终上下文回溯到原始文档。
- 能区分召回失败、排序失败和生成失败。

## 重点

RAG 的上下文质量取决于证据链，不取决于是否使用了某个向量数据库。

## 难点

难点是“足够完整”：有些问题需要多个片段拼起来回答，只召回一个高相似片段反而会误导模型。

## 易错

> **易错：** 只用 embedding 相似度作为唯一选择标准。
>
> 正确做法：结合关键词、元数据、重排、去重、多样性和引用校验。

