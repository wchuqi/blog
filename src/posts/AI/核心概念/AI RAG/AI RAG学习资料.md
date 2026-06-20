---
title: "AI RAG 学习资料"
date: 2026-06-20
description: "这是一份面向工程实践和面试准备的 AI RAG 中文学习资料。资料按知识点拆分到 study-material/ 目录，覆盖从基础概念、知识库建设、Embedding 与检索，到重排、证据打包、评估、安全、生产化和进阶 RAG。"
tags:
  - "AI"
  - "核心概念"
  - "AI RAG"
  - "学习资料总览"
category: "AI"
---

# AI RAG 学习资料

这是一份面向工程实践和面试准备的 AI RAG 中文学习资料。资料按知识点拆分到 `study-material/` 目录，覆盖从基础概念、知识库建设、Embedding 与检索，到重排、证据打包、评估、安全、生产化和进阶 RAG。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | RAG 基础术语和适用边界 | [01-RAG基础术语和适用边界.md](study-material/01-RAG基础术语和适用边界.md) |
| 2 | 知识库建设、文档解析、切分和元数据 | [02-知识库建设文档解析切分和元数据.md](study-material/02-知识库建设文档解析切分和元数据.md) |
| 3 | Embedding、向量索引和相似度检索 | [03-Embedding向量索引和相似度检索.md](study-material/03-Embedding向量索引和相似度检索.md) |
| 4 | 查询改写、混合检索和多路召回 | [04-查询改写混合检索和多路召回.md](study-material/04-查询改写混合检索和多路召回.md) |
| 5 | 重排、上下文压缩和证据打包 | [05-重排上下文压缩和证据打包.md](study-material/05-重排上下文压缩和证据打包.md) |
| 6 | 生成、引用、拒答和答案忠实性 | [06-生成引用拒答和答案忠实性.md](study-material/06-生成引用拒答和答案忠实性.md) |
| 7 | 评估指标、测试集和失败归因 | [07-评估指标测试集和失败归因.md](study-material/07-评估指标测试集和失败归因.md) |
| 8 | 安全、权限、隐私和提示注入防护 | [08-安全权限隐私和提示注入防护.md](study-material/08-安全权限隐私和提示注入防护.md) |
| 9 | 生产架构、成本、延迟、缓存和可观测性 | [09-生产架构成本延迟缓存和可观测性.md](study-material/09-生产架构成本延迟缓存和可观测性.md) |
| 10 | GraphRAG、多跳检索和 Agentic RAG | [10-GraphRAG多跳检索和AgenticRAG.md](study-material/10-GraphRAG多跳检索和AgenticRAG.md) |
| 11 | 综合练习项目 | [11-综合练习项目.md](study-material/11-综合练习项目.md) |
| 12 | 完整知识点清单 | [12-AI RAG完整知识点清单.md](study-material/12-AI RAG完整知识点清单.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | RAG 系统架构和生命周期深度解析 | [14-RAG系统架构和生命周期深度解析.md](study-material/14-RAG系统架构和生命周期深度解析.md) |
| 15 | 文档解析、结构化切分和增量索引深度解析 | [15-文档解析结构化切分和增量索引深度解析.md](study-material/15-文档解析结构化切分和增量索引深度解析.md) |
| 16 | Embedding、相似度、ANN 索引和向量库调参深度解析 | [16-Embedding相似度ANN索引和向量库调参深度解析.md](study-material/16-Embedding相似度ANN索引和向量库调参深度解析.md) |
| 17 | BM25、稀疏检索、Hybrid 融合和排序算法深度解析 | [17-BM25稀疏检索Hybrid融合和排序算法深度解析.md](study-material/17-BM25稀疏检索Hybrid融合和排序算法深度解析.md) |
| 18 | Rerank、Late Interaction、上下文压缩和证据覆盖深度解析 | [18-RerankLateInteraction上下文压缩和证据覆盖深度解析.md](study-material/18-RerankLateInteraction上下文压缩和证据覆盖深度解析.md) |
| 19 | 查询规划、多跳检索、GraphRAG 和 Agentic RAG 深度解析 | [19-查询规划多跳检索GraphRAG和AgenticRAG深度解析.md](study-material/19-查询规划多跳检索GraphRAG和AgenticRAG深度解析.md) |
| 20 | 生成约束、引用校验、拒答和忠实性深度解析 | [20-生成约束引用校验拒答和忠实性深度解析.md](study-material/20-生成约束引用校验拒答和忠实性深度解析.md) |
| 21 | RAG 评估实验设计、指标体系和失败归因深度解析 | [21-RAG评估实验设计指标体系和失败归因深度解析.md](study-material/21-RAG评估实验设计指标体系和失败归因深度解析.md) |
| 22 | 安全、权限、隐私、注入攻击和数据治理深度解析 | [22-安全权限隐私注入攻击和数据治理深度解析.md](study-material/22-安全权限隐私注入攻击和数据治理深度解析.md) |
| 23 | 生产架构、延迟成本、缓存观测和发布治理深度解析 | [23-生产架构延迟成本缓存观测和发布治理深度解析.md](study-material/23-生产架构延迟成本缓存观测和发布治理深度解析.md) |
| 24 | 行业场景、架构设计案例库和方案评审清单 | [24-行业场景架构设计案例库和方案评审清单.md](study-material/24-行业场景架构设计案例库和方案评审清单.md) |
| 25 | RAG 面试深水区题库和追问 | [25-RAG面试深水区题库和追问.md](study-material/25-RAG面试深水区题库和追问.md) |

## 使用建议

- 入门学习：按 00 到 06 顺序阅读，先建立完整流水线。
- 工程落地：重点读 02 到 09，关注数据质量、评估、权限和可观测性。
- 面试复习：先读 12 完整清单，再读 13 和 `study-material/面试知识点/`。
- 做项目：读 11，按任务清单实现一个最小可用 RAG，再逐步加入混合检索、重排和评估。
- 深度进阶：重点读 14 到 25，理解索引机制、融合排序、证据充分性、攻击面、生产发布和系统设计追问。

## 环境假设

- 你知道 LLM 的基本输入输出方式，但不要求掌握模型训练。
- 代码示例以 Python 风格伪代码为主，强调系统设计和数据流。
- 工具可替换：向量库、LLM、Embedding 模型和编排框架都不是学习重点本身。

## 参考资料

- Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks: https://arxiv.org/abs/2005.11401
- LlamaIndex RAG 文档: https://docs.llamaindex.ai/en/stable/understanding/rag/
- LangChain RAG 教程: https://python.langchain.com/docs/tutorials/rag/
- OpenAI Embeddings Guide: https://platform.openai.com/docs/guides/embeddings
- OpenAI File Search Guide: https://platform.openai.com/docs/guides/tools-file-search
- Weaviate Hybrid Search: https://weaviate.io/developers/weaviate/search/hybrid
- Qdrant Filtering: https://qdrant.tech/documentation/concepts/filtering/
- Ragas Metrics: https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/
- OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- HNSW 论文: https://arxiv.org/abs/1603.09320
- ColBERT 论文: https://arxiv.org/abs/2004.12832
- GraphRAG 论文: https://arxiv.org/abs/2404.16130
