---
title: "Prompt Engineering 学习资料：完整知识点清单"
date: 2026-06-20
description: "大语言模型、生成式 AI、token、上下文窗口。"
tags:
  - "AI"
  - "工程实践"
  - "Prompt Engineering"
  - "知识清单"
category: "AI"
---

# Prompt Engineering 学习资料：完整知识点清单

[返回索引](../Prompt Engineering学习资料.md)

## 1. 基础和术语

- 大语言模型、生成式 AI、token、上下文窗口。
- system/developer/user/assistant 角色。
- 指令遵循、非确定性、温度、采样。
- 幻觉、拒答、不确定性。
- zero-shot、few-shot、反例、prompt chaining。

## 2. Prompt 结构

- 身份、任务、目标、受众。
- 输入资料、上下文边界、引用编号。
- 规则、禁止事项、异常处理。
- 输出格式、字段、枚举、schema。
- Markdown、XML、分隔符、标签属性。

## 3. 任务设计

- 分类、摘要、改写、抽取、问答、评审、规划、代码生成。
- 任务拆解、阶段化输出、证据优先。
- 多方案比较、自检、约束清单。
- 复杂推理任务的中间产物设计。

## 4. 上下文和示例

- few-shot 示例选择。
- 反例和边界样例。
- 长上下文排序和压缩。
- 上下文优先级和冲突处理。
- 资料不足时拒答。

## 5. 结构化输出

- JSON、YAML、Markdown 表格。
- JSON Schema、字段类型、枚举、缺失值。
- 格式校验、解析失败重试。
- 下游程序解析和容错。

## 6. RAG 和知识注入

- 检索、重排、上下文拼装。
- 引用、来源、日期、版本。
- grounded answer、拒答、冲突说明。
- 检索评估和生成评估分离。
- 长上下文与 RAG 的取舍。

## 7. 工具调用

- 函数调用、工具 schema、参数校验。
- 工具选择规则、失败处理。
- 写操作确认、权限最小化、审计。
- 工具结果与模型推测的边界。

## 8. Agent 和工作流

- 计划、执行、观察、修正。
- 多轮状态、记忆、检查点。
- 停止条件、追问条件、人工确认。
- 任务编排、工具链、回滚。

## 9. 评估和迭代

- 测试集、评分规则、人工评审。
- LLM-as-judge、A/B 测试、线上监控。
- 准确率、格式合规率、幻觉率、安全指标。
- 失败案例归因和 prompt 迭代记录。

## 10. 版本和生产化

- prompt as code。
- 模型版本固定。
- prompt 变更评审。
- 灰度发布、回滚、日志。
- 成本、延迟、token 预算。

## 11. 安全

- 直接提示注入、间接提示注入。
- 数据泄露、系统提示词泄露。
- 越权工具调用、敏感信息脱敏。
- 输入过滤、输出审计、红队测试。
- 高风险领域人工审核。

## 12. 容易遗漏的高级点

- 不同模型对同一 prompt 的行为差异。
- 指令冲突和优先级。
- 外部资料中的伪指令隔离。
- RAG 引用准确性评估。
- 工具调用中的参数幻觉。
- 多轮会话中的状态污染。
- prompt 修改导致的回归。
- 成本和质量之间的取舍。

## 13. 深度机制清单

- token 化、上下文位置、注意力稀释和采样参数对输出的影响。
- 指令层级、冲突处理和上下文隔离。
- few-shot 示例选择、排序、反例和动态示例检索。
- schema 设计、解析失败、修复 prompt、重试和降级。
- RAG 查询改写、chunk、重排、上下文压缩、引用校验。
- 工具路由、工具描述、参数校验、权限、审计和写操作确认。
- Agent 状态机、计划、记忆生命周期、最大步数和失败恢复。
- Prompt 评估集分层、指标体系、LLM-as-judge 风险和线上 A/B。
- 直接/间接提示注入、红队样例库和多层防护。
- PromptOps：版本、灰度、回滚、成本、延迟和团队治理。

## 14. 深度阅读路径

| 目标 | 推荐文件 |
| --- | --- |
| 理解模型行为 | [15-LLM机制和Prompt行为深度解析.md](15-LLM机制和Prompt行为深度解析.md) |
| 解决指令冲突和注入 | [16-指令层级冲突和上下文隔离深度解析.md](16-指令层级冲突和上下文隔离深度解析.md)、[23-提示注入红队防护和安全架构深度解析.md](23-提示注入红队防护和安全架构深度解析.md) |
| 提升输出稳定性 | [17-Few-shot示例选择和Prompt模式库深度解析.md](17-Few-shot示例选择和Prompt模式库深度解析.md)、[18-结构化输出Schema约束解析失败和修复深度解析.md](18-结构化输出Schema约束解析失败和修复深度解析.md) |
| 做 RAG 和知识库 | [19-RAG检索重排上下文压缩和引用评估深度解析.md](19-RAG检索重排上下文压缩和引用评估深度解析.md) |
| 做工具调用和 Agent | [20-工具调用决策路由参数校验和权限深度解析.md](20-工具调用决策路由参数校验和权限深度解析.md)、[21-Agent规划记忆状态机和失败恢复深度解析.md](21-Agent规划记忆状态机和失败恢复深度解析.md) |
| 上线生产系统 | [22-Prompt评估实验设计统计和线上监控深度解析.md](22-Prompt评估实验设计统计和线上监控深度解析.md)、[24-PromptOps成本延迟版本灰度和治理深度解析.md](24-PromptOps成本延迟版本灰度和治理深度解析.md)、[25-行业场景案例库和Prompt评审清单.md](25-行业场景案例库和Prompt评审清单.md) |

## 15. 高级专题阅读路径

| 目标 | 推荐文件 |
| --- | --- |
| 系统掌握 prompting 技术谱系 | [26-Prompt技术谱系和推理模式深度解析.md](26-Prompt技术谱系和推理模式深度解析.md) |
| 理解解码和约束生成 | [27-解码采样约束生成和结构化输出机制深度解析.md](27-解码采样约束生成和结构化输出机制深度解析.md) |
| 做长上下文和记忆治理 | [28-Context Engineering上下文工程和记忆压缩深度解析.md](28-Context Engineering上下文工程和记忆压缩深度解析.md) |
| 做可量化 RAG 评估 | [29-RAG指标体系召回精排评估和数据治理深度解析.md](29-RAG指标体系召回精排评估和数据治理深度解析.md) |
| 做可控 Agent | [30-Agent控制架构ReAct规划反思和工作流编排深度解析.md](30-Agent控制架构ReAct规划反思和工作流编排深度解析.md) |
| 做自动 prompt 优化 | [31-自动Prompt优化APE评估驱动和元提示深度解析.md](31-自动Prompt优化APE评估驱动和元提示深度解析.md) |
| 做安全架构评审 | [32-安全威胁建模OWASP和权限隔离深度解析.md](32-安全威胁建模OWASP和权限隔离深度解析.md) |
| 做多模态和代码类应用 | [33-多模态Prompt和代码Prompt深度解析.md](33-多模态Prompt和代码Prompt深度解析.md) |
| 做平台化 PromptOps | [34-生产架构蓝图PromptOps平台化深度解析.md](34-生产架构蓝图PromptOps平台化深度解析.md) |

## 16. 高级知识点清单

- Prompt 技术谱系：zero-shot、few-shot、CoT、self-consistency、least-to-most、ReAct、critique-revise、verifier、APE。
- 解码机制：logits、temperature、top-p、max tokens、stop sequence、约束生成。
- 结构化输出机制：prompt 约束、schema 约束、程序校验、业务校验、修复链路。
- Context Engineering：上下文预算、排序、压缩、状态化记忆、污染防护。
- RAG 指标：Recall@k、Precision@k、MRR、nDCG、faithfulness、citation accuracy、abstention accuracy。
- Agent 控制架构：planner、router、executor、observer、verifier、memory、guardrail、human gate。
- 自动 Prompt 优化：候选生成、元提示、失败样例驱动、train/dev/test 分离、防过拟合。
- 安全威胁建模：资产、攻击面、prompt injection、sensitive information disclosure、insecure output handling、excessive agency。
- 多模态 Prompt：可见信息边界、位置引用、OCR 风险、截图分析、表格和代码场景。
- PromptOps 平台化：registry、renderer、context builder、model gateway、tool gateway、validator、eval runner、telemetry。

## 17. 最终自查清单

- 是否定义了成功标准？
- 是否清楚区分规则和输入资料？
- 是否规定了资料不足时的行为？
- 是否有固定输出格式？
- 是否有示例和反例？
- 是否能被程序校验？
- 是否有评估集？
- 是否考虑提示注入？
- 是否记录版本和模型参数？
- 是否有失败恢复和人工审核机制？
- 是否有上下文预算和记忆压缩策略？
- 是否把检索、生成和端到端指标分层评估？
- 是否为 Agent 设置状态机、最大步数和 human gate？
- 是否把 prompt 纳入 registry、评估、灰度、监控和回滚？
