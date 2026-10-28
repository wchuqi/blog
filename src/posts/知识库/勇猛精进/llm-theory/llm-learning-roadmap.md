---
title: 自学 AI 大模型应用开发的正确顺序（程序员路线图）
date: 2025-12-30
description: 面向程序员的大模型应用开发完整学习路线：从前置基础、提示工程、RAG、Agent 到微调、部署与安全合规，附常用概念速查表和核心模块说明。
tags:
  - "大模型"
  - "学习路线"
  - "RAG"
  - "Agent"
  - "LoRA"
review:
  created: 2025-12-30
  lastReview: 2025-12-30
  reps: 0
  interval: 0
  ease: 2.5
noReview: true
---

自学 AI 大模型应用开发（面向程序员），**顺序不要弄反了**。下面按阶段整理完整路线图，目标是成为 AI 大模型全栈应用专家。

## 学习路线图

### 第一步：AI/ML 基本概念

- 模型
- 推理
- Token
- Embedding

### 前置基础

**Python for AI**

- PyTorch 基础
- NumPy、Pandas
- 异步编程

**环境与 API 基础**

- 虚拟环境
- Docker
- REST/gRPC
- JSON

### 应用层入门

**提示工程（Prompt Engineering）**

- Zero-shot / Few-shot
- CoT（思维链）
- 结构化输出

**LLM API 调用**

- OpenAI / Claude API
- 参数调优
- 流式响应

### 检索增强与框架

**向量数据库与检索**

- Chroma / Faiss
- 相似度计算
- 混合检索

**编排框架基础**

- LangChain 核心组件
- LlamaIndex 基础

**高级 RAG 技术**

- 查询重写
- 重排序（Rerank）
- 知识图谱融合

### Agent 与工具

- ReAct 模式
- Function Calling
- 自定义工具

Agent 是从 ChatGPT 到自主智能体的进化方向：传统对话只能给建议（比如推荐旅行景点），用户仍要自己查机票、订酒店；而 Agent 通过"工具 → 行动 → 观察 → 反馈 → 推理"的循环，能自主拆解任务并执行步骤。

### 进阶专题

**高效微调（PEFT）**

- LoRA / QLoRA
- 特定任务微调
- 数据准备

**评估与监控（Eval & Ops）**

- Ragas / TruLens
- LangSmith
- 性能追踪

**生产级部署**

- 模型服务化（Serving）
- K8s
- Serverless

**性能优化与扩展**

- 缓存策略
- 批处理
- 延迟优化

**安全与合规**

- 提示注入防御
- 数据隐私
- Guardrails

**多模态应用**

- 图像 / 音频集成
- 跨模态交互

## 大模型常用概念速查表

| 概念 | 功能简介 | 使用频率 |
| --- | --- | --- |
| LLM | 大语言模型，用于生成与理解文本 | ★★★★★ |
| Prompt | 给模型的指令，用于引导生成结果 | ★★★★★ |
| Embedding | 文本向量化，支持检索与相似度判断 | ★★★★★ |
| RAG | 结合检索 + 生成，让模型"带知识回答" | ★★★★★ |
| Fine-tuning | 在特定任务上继续训练，提高准确率 | ★★★★ |
| LoRA | 低成本微调方式，参数更小、速度更快 | ★★★★ |
| Function Calling | 让模型调用外部工具或接口 | ★★★★ |
| Agent | 能自主拆解任务、执行步骤的智能体 | ★★★★ |
| Vector DB | 存储向量数据，用于检索、知识库构建 | ★★★★ |
| Tokenizer | 把文本切成 token，供模型理解 | ★★★ |
| Chain-of-Thought | 让模型展示推理步骤，提高逻辑能力 | ★★★ |
| System Prompt | 设定模型"角色与行为规则"的系统指令 | ★★★ |
| API Key | 调用模型服务的身份凭证 | ★★★ |
| Checkpoint | 模型权重文件，用于训练与部署 | ★★★ |
| Sampling | 控制生成随机度（top-p、temperature） | ★★ |
| RLHF | 用人类反馈优化模型表现 | ★★ |
| DPO | 新型对齐方式，替代 RLHF | ★★ |

## 常用核心模块介绍

### 1. Transformer（骨干架构）

大模型的"主框架"，几乎所有主流模型都基于 Transformer。它负责处理上下文关系、捕捉语义和结构信息。

文件形式一般为：模型结构定义文件 + 权重文件，大小从 GB 到数十 GB 不等。常见路径：`*/models/transformer`。

### 2. LoRA 微调模块

小型可训练模块，用于注入新知识、领域特性；相比全量微调更节省显存和时间。文件格式多为 `.safetensors`，参数量小（几 MB ~ 几百 MB）。若未正确加载 LoRA，会出现效果不明显的情况。放置路径：`*/models/lora`。

### 3. Embedding（向量嵌入）

文本、图像等信息转成向量的集合，是 RAG 检索与相似度判断的关键。典型应用：公司财务制度、员工手册、合同条款、产品 FAQ 的向量化（如 law-embedding、medical-vectors）。路径示例：`*/embeddings/*.pt`。

### 4. Tokenizer（分词器）

把文本切成 token 的字典与规则，相当于"模型的语言输入方式"。如果 tokenizer 与模型不匹配，会出现乱码、理解错误等情况。常见格式：`tokenizer.model` / `vocab.json`，放置路径：`*/models/tokenizer`。

### 5. VAE / 解码模块

在多模态大模型中用于将 latent 表示还原为图像/音频/特征；在文本模型中用于解码生成结果。不同 VAE 会显著影响最终输出质量。文件格式一般为 `.ckpt` / `.safetensors`，位置：`*/models/VAE`。

> 来源：视频转录/图文整理
