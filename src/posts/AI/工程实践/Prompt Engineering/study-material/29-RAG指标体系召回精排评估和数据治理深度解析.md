---
title: "Prompt Engineering 学习资料：RAG 指标体系、召回、精排、评估和数据治理深度解析"
date: 2026-06-20
description: "正确文档是否出现在前 k 个结果中。"
tags:
  - "AI"
  - "工程实践"
  - "Prompt Engineering"
  - "深度解析"
category: "AI"
---

# Prompt Engineering 学习资料：RAG 指标体系、召回、精排、评估和数据治理深度解析

[返回索引](../Prompt Engineering学习资料.md)

## 学习目标

- 掌握 RAG 的检索指标、生成指标和端到端指标。
- 能用指标定位召回、重排、上下文和生成问题。
- 理解文档治理对 RAG 质量上限的影响。

## RAG 评估分层

| 层 | 评估对象 | 指标 |
| --- | --- | --- |
| 检索 | 是否找到了正确 chunk | Recall@k、Precision@k、MRR、nDCG |
| 重排 | 正确证据是否排前 | nDCG、MRR、top-1 hit |
| 上下文 | 拼装内容是否可用 | 噪声率、覆盖率、冲突率 |
| 生成 | 答案是否正确 | groundedness、faithfulness、引用准确率 |
| 端到端 | 用户是否满意 | 任务成功率、人工复核率、投诉率 |

## 检索指标

### Recall@k

正确文档是否出现在前 k 个结果中。

```text
Recall@k = 前 k 个结果中命中的相关文档数 / 所有相关文档数
```

如果 Recall@k 低，prompt 再好也拿不到证据。

### Precision@k

前 k 个结果中有多少是相关的。

```text
Precision@k = 前 k 个结果中相关文档数 / k
```

Precision 低会导致上下文噪声高。

### MRR

关注第一个正确结果排在第几位。

```text
MRR = average(1 / rank_of_first_relevant_doc)
```

适合问答任务，因为模型更容易使用靠前证据。

### nDCG

考虑相关性等级和排序位置。适合多个证据、相关性强弱不同的场景。

## 生成指标

### Faithfulness

答案是否忠实于上下文。即结论能否被引用资料支持。

### Answer Relevance

答案是否回答了用户问题，而不是只复述资料。

### Citation Accuracy

引用是否真实存在且支持对应结论。

### Abstention Accuracy

资料不足时是否正确拒答；资料足够时是否不过度拒答。

## 文档治理

RAG 质量常常不是模型问题，而是文档问题：

- 文档过期。
- 标题缺失。
- 多版本冲突。
- 权限混乱。
- chunk 缺上下文。
- OCR 错误。
- 表格结构丢失。
- 文档没有来源和日期。

## Chunk 策略

| 策略 | 适用 |
| --- | --- |
| 固定长度 chunk | 简单文本 |
| 按标题层级 chunk | 文档结构清晰 |
| 滑动窗口 chunk | 上下文依赖强 |
| 表格专用 chunk | 数据表、政策表 |
| 语义 chunk | 段落边界明显 |

## Prompt 在 RAG 中的高级职责

Prompt 要做的不是“回答问题”，而是：

- 使用证据。
- 标注引用。
- 识别资料不足。
- 处理冲突。
- 不混入常识。
- 把不确定性暴露给用户。

## 练习

建立一个 30 条问题的 RAG 评估集，每条标注：

- 相关 doc_id。
- 必须引用的 chunk。
- 是否允许拒答。
- 是否存在冲突资料。
- 期望答案要点。

## 验收

- 能计算 Recall@k、Precision@k、MRR。
- 能说明 RAG 错误来自哪一层。
- 能提出文档治理改进方案。

## 易错

> **易错：** 只看最终答案准确率。
>
> 正确做法：检索、重排、上下文、生成和端到端分层评估。

