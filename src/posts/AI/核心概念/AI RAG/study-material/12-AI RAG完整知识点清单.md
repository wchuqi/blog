---
title: "AI RAG 学习资料：AI RAG 完整知识点清单"
date: 2026-06-20
description: "完整 RAG 能力 = 数据治理 + 检索排序 + 上下文工程 + 证据生成 + 评估安全 + 生产运维。"
tags:
  - "AI"
  - "核心概念"
  - "AI RAG"
  - "知识清单"
category: "AI"
---

# AI RAG 学习资料：AI RAG 完整知识点清单

[返回索引](../AI RAG学习资料.md)

## 一、基础和边界

- RAG 定义、目标、适用场景。
- RAG 与微调、长上下文、搜索、SQL、知识图谱、Agent 的区别。
- 检索增强生成的典型数据流。
- 幻觉、忠实性、引用和拒答。
- 动态知识、私有知识、可追溯知识。

## 二、知识库建设

- 文档源管理：文件、网页、数据库、工单、代码仓库。
- 文档解析：PDF、HTML、Markdown、Word、表格、图片 OCR。
- 清洗和规范化：去广告、去页眉页脚、编码统一、语言识别。
- 切分策略：固定长度、标题层级、语义切分、滑动窗口、父子 chunk。
- 元数据：source、version、section、permission、owner、updated_at、hash。
- 去重、过期、删除、增量更新。
- 文档质量审计和数据血缘。

## 三、Embedding 和索引

- Embedding 模型选择。
- 向量维度、归一化、cosine、dot product、L2。
- ANN 索引：HNSW、IVF、PQ。
- 索引参数：top-k、efSearch、nprobe、阈值。
- 向量库与搜索引擎职责。
- 多语言、跨语言、领域术语和短文本问题。
- 索引版本和回滚。

## 四、检索策略

- Query rewrite、query expansion、multi-query、HyDE。
- BM25、dense retrieval、hybrid search。
- Metadata filter、权限过滤、时间过滤、版本过滤。
- Result fusion、Reciprocal Rank Fusion。
- Parent-child retrieval。
- Multi-hop retrieval。
- SQL、Graph、Web 多源路由。

## 五、重排和上下文

- Reranker 工作方式。
- 召回 top-n 与重排 top-m。
- 去重、冲突检测、来源可信度。
- 上下文压缩：抽取式、摘要式、结构化裁剪。
- 证据覆盖检查。
- Evidence id、source、version、trust 标注。
- 上下文预算和 token 成本。

## 六、生成和后处理

- 基于证据回答的 prompt。
- 引用格式和引用校验。
- 答案 schema。
- 拒答、追问和升级人工。
- 冲突证据处理。
- 事实性、完整性、简洁性和可读性平衡。

## 七、评估和排障

- Golden set 构建。
- 检索指标：recall@k、precision@k、MRR、nDCG。
- 生成指标：faithfulness、answer relevance、citation accuracy。
- 拒答准确率、安全测试。
- Trace 回放。
- 失败归因：数据、解析、切分、召回、重排、打包、生成、安全。
- A/B 测试和回归测试。

## 八、安全和治理

- Prompt injection。
- Tool-output injection。
- Context poisoning。
- Data exfiltration。
- 多租户和权限隔离。
- PII、密钥、合同、隐私信息脱敏。
- 审计日志。
- 来源可信度和内容准入。

## 九、生产化

- 摄取流水线。
- 查询服务。
- 模型网关。
- 缓存策略。
- 成本和延迟优化。
- 限流、降级、超时和重试。
- 监控指标。
- 索引、prompt、模型和评测集版本化。
- 灰度发布和回滚。

## 十、进阶专题

- GraphRAG。
- Agentic RAG。
- 多模态 RAG。
- 结构化数据 RAG。
- 代码 RAG。
- 个性化和记忆结合。
- 联邦检索和跨系统检索。
- 主动学习和反馈闭环。

## 十一、面试考察点

- 能否讲清 RAG 全链路。
- 能否指出向量检索局限。
- 能否设计 chunk 和 metadata。
- 能否构建评测集。
- 能否定位失败层级。
- 能否处理权限和提示注入。
- 能否做成本延迟优化。
- 能否根据场景选择普通 RAG、GraphRAG 或 Agentic RAG。

## 十二、深水区机制必查

| 机制 | 必须掌握的问题 | 对应资料 |
| --- | --- | --- |
| 生命周期 | 一次回答由哪些版本共同决定，如何回放 | [14-RAG系统架构和生命周期深度解析.md](14-RAG系统架构和生命周期深度解析.md) |
| 文档摄取 | PDF、表格、代码、父子 chunk 和增量索引如何处理 | [15-文档解析结构化切分和增量索引深度解析.md](15-文档解析结构化切分和增量索引深度解析.md) |
| 向量索引 | HNSW 参数、相似度、过滤和阈值如何影响召回 | [16-Embedding相似度ANN索引和向量库调参深度解析.md](16-Embedding相似度ANN索引和向量库调参深度解析.md) |
| Hybrid 排序 | BM25、dense、RRF 和分数不可比如何处理 | [17-BM25稀疏检索Hybrid融合和排序算法深度解析.md](17-BM25稀疏检索Hybrid融合和排序算法深度解析.md) |
| 重排和证据 | cross-encoder、late interaction、证据覆盖如何设计 | [18-RerankLateInteraction上下文压缩和证据覆盖深度解析.md](18-RerankLateInteraction上下文压缩和证据覆盖深度解析.md) |
| 复杂检索 | 查询规划、多跳、GraphRAG、Agentic RAG 何时使用 | [19-查询规划多跳检索GraphRAG和AgenticRAG深度解析.md](19-查询规划多跳检索GraphRAG和AgenticRAG深度解析.md) |
| 忠实性 | claim 级引用校验、拒答和冲突证据如何处理 | [20-生成约束引用校验拒答和忠实性深度解析.md](20-生成约束引用校验拒答和忠实性深度解析.md) |
| 评估 | 如何设计评测集、指标闭环和对照实验 | [21-RAG评估实验设计指标体系和失败归因深度解析.md](21-RAG评估实验设计指标体系和失败归因深度解析.md) |
| 安全 | indirect injection、多租户、隐私、数据污染如何防 | [22-安全权限隐私注入攻击和数据治理深度解析.md](22-安全权限隐私注入攻击和数据治理深度解析.md) |
| 生产 | 延迟预算、成本模型、版本化缓存和灰度发布如何做 | [23-生产架构延迟成本缓存观测和发布治理深度解析.md](23-生产架构延迟成本缓存观测和发布治理深度解析.md) |

## 重点

完整 RAG 能力 = 数据治理 + 检索排序 + 上下文工程 + 证据生成 + 评估安全 + 生产运维。

## 难点

真正难的是跨层优化。单独调 prompt、top-k 或 chunk size 都可能局部有效，但没有 trace 和评测集就无法稳定改进。

## 易错

> **易错：** 把“RAG 完整知识点”缩减成 embedding、向量库和 prompt。
>
> 正确做法：把 RAG 当成生产信息检索和生成系统来学习。
