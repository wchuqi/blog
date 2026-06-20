---
title: "AI Context Engineering 学习资料：完整知识点清单"
date: 2026-06-20
description: "这份清单用于检查学习覆盖度、面试准备和项目评审。Context Engineering 横跨 prompt、RAG、Agent、记忆、工具、安全和生产治理，不能只理解为“整理上下文”。"
tags:
  - "AI"
  - "工程实践"
  - "AI Context Engineering"
  - "知识清单"
category: "AI"
---

# AI Context Engineering 学习资料：完整知识点清单

[返回索引](../AI Context Engineering学习资料.md)

这份清单用于检查学习覆盖度、面试准备和项目评审。Context Engineering 横跨 prompt、RAG、Agent、记忆、工具、安全和生产治理，不能只理解为“整理上下文”。

## 一、基础和术语

- Context window：模型一次调用可接收的上下文容量。
- Token budget：按上下文类别分配 token，控制成本、延迟和噪声。
- Context slot：上下文槽位，如系统规则、用户请求、历史摘要、检索证据、工具结果、输出 schema。
- Context assembly：把多个来源的信息按规则拼装成最终输入。
- Context compression：对历史、文档或工具结果做摘要、抽取、结构化或裁剪。
- Context poisoning：上下文被恶意、过期、错误或低可信内容污染。
- ContextOps：上下文策略的版本、评估、回放、监控和治理。

## 二、核心心智模型

- 上下文是模型的临时工作台，不是长期事实库。
- Prompt 是上下文的一部分，不等于上下文全部。
- RAG 是证据上下文工程。
- Agent memory 是状态上下文工程。
- Tool calling 是动作上下文和权限上下文工程。
- Long context 是容量能力，不是信息质量保证。

## 三、上下文来源

- 系统规则和开发者规则。
- 当前用户请求。
- 会话历史原文。
- 会话历史摘要。
- 结构化任务状态。
- 用户画像和偏好。
- 检索文档和引用片段。
- 工具调用结果。
- 外部 API 返回。
- 文件、图片、表格、代码仓库。
- 示例和 few-shot 样例。
- 输出格式、schema、rubric 和评估标准。

## 四、指令层级和信任边界

- 指令与资料分离。
- 不可信资料显式包裹。
- 工具结果不能自动变成新指令。
- 用户输入不能伪造系统消息。
- 历史消息中的旧指令需要时效判断。
- 高风险动作由外部权限网关批准，不能只靠模型自律。

## 五、上下文建模

- 槽位设计：每类上下文有名称、来源、权限、预算和生命周期。
- 元数据设计：source、timestamp、version、trust_level、scope、expiry。
- 拼装顺序：稳定规则、任务状态、当前请求、证据、工具结果、输出契约。
- 冲突策略：权威度优先、当前任务优先、用户确认优先、最新版本优先。
- 裁剪策略：保留目标、约束、已确认事实、关键证据、未解决问题。

## 六、RAG 和证据上下文

- 文档加载和清洗。
- chunk size、overlap 和结构化切分。
- embedding 检索、关键词检索、hybrid search。
- metadata filter。
- rerank。
- 去重和多样性控制。
- 上下文压缩。
- 引用和证据链。
- 检索失败时的拒答。
- 召回率、MRR、nDCG、faithfulness、answer relevance。

## 七、长上下文和压缩

- 滑动窗口。
- rolling summary。
- map-reduce summary。
- extractive compression。
- abstractive compression。
- query-focused compression。
- 状态化摘要。
- 压缩损失评估。
- 原文回溯机制。
- 长上下文中的位置偏差和噪声问题。

## 八、记忆和状态

- 短期工作记忆。
- 长期语义记忆。
- 情节记忆。
- 程序性记忆。
- 用户偏好记忆。
- 任务状态和 checkpoint。
- 记忆写入条件。
- 记忆更新和删除。
- 记忆冲突和过期。
- 记忆隐私和用户可控性。

## 九、工具调用上下文

- 工具描述。
- 参数 schema。
- 工具选择路由。
- 参数校验。
- 工具执行权限。
- 工具结果摘要。
- 错误和重试上下文。
- 幂等性和副作用。
- 审计日志。
- 人工确认。

## 十、Agent 生命周期

- 计划。
- 行动。
- 观察。
- 反思。
- 状态更新。
- 任务切换。
- 中断恢复。
- handoff。
- 多 Agent 上下文隔离。
- 工作流编排和 deterministic control。

## 十一、多模态和代码上下文

- 图片区域、OCR、视觉证据。
- 表格 schema 和数据采样。
- 代码仓库结构。
- 依赖、配置和测试结果。
- 文件变更摘要。
- 编译错误和堆栈信息压缩。
- 代码 Agent 的 workspace state。

## 十二、安全和风险

- Prompt injection。
- Tool-output injection。
- RAG poisoning。
- Memory poisoning。
- Data exfiltration。
- Sensitive data leakage。
- Over-permissioned tools。
- Cross-session contamination。
- Hallucinated citations。
- Unsafe action execution。

## 十三、评估和监控

- 上下文覆盖率。
- 上下文相关性。
- 上下文可信度。
- 压缩保真度。
- 检索召回率。
- 引用准确率。
- 答案忠实度。
- 工具调用准确率。
- token 成本。
- 延迟。
- 拒答质量。
- 安全拦截率。
- 回放测试和 A/B 测试。

## 十四、生产治理

- 上下文模板版本化。
- 检索配置版本化。
- 记忆 schema 版本化。
- 工具 schema 版本化。
- 实验记录。
- 线上观测。
- 失败样本归因。
- 数据治理。
- 隐私和合规。
- 灰度发布和回滚。

## 十五、面试高频考点

- Context Engineering 和 Prompt Engineering 的区别。
- RAG 失败如何定位。
- 长上下文和向量检索怎么取舍。
- Agent 记忆如何设计。
- 工具结果如何防注入。
- 多轮对话如何压缩历史。
- 如何评估上下文策略。
- 如何处理上下文冲突。
- 如何避免敏感信息泄漏。
- 如何做生产级 ContextOps。

## 十六、深度掌握标准

达到中高级水平时，不只会解释概念，还应能回答以下问题：

- 架构分层：上下文构造的数据平面、控制平面和观测平面分别负责什么。
- 窗口机制：为什么长上下文模型仍会受到噪声、位置、冲突和输出预算限制。
- 选择算法：如何用 relevance、authority、recency、risk、token_cost 和 conflict_penalty 排序。
- 预算策略：不同任务如何动态分配 evidence、state、tool_results、schema 和 answer_budget。
- RAG 证据工程：如何做 query planning、multi-hop retrieval、evidence coverage 和 citation binding。
- 记忆治理：记忆何时写入、如何合并、如何遗忘、如何处理隐私和用户撤销。
- 工具协议：MCP 或其他工具协议如何暴露 tools/resources/prompts，以及工具结果如何进入上下文。
- Agent 控制：如何用状态机、checkpoint、retry budget 和 handoff 控制 Agent 生命周期。
- 安全威胁建模：如何防 prompt injection、tool-output injection、RAG poisoning 和 memory poisoning。
- 评估归因：如何从失败样本判断问题来自数据、检索、排序、压缩、打包、生成、工具还是安全层。
- 生产治理：如何版本化 prompt、槽位、检索、压缩、记忆、工具、安全策略和评测集。

## 完整性自检

- 我能画出一次 LLM 调用的上下文包结构。
- 我能解释每个槽位的来源、权限、预算和生命周期。
- 我能设计检索、重排、压缩和引用流程。
- 我能设计短期状态和长期记忆。
- 我能识别不可信上下文并隔离其指令权限。
- 我能为上下文策略建立离线评估和线上监控。
- 我能在失败后判断问题来自检索、压缩、状态、工具、指令冲突还是模型边界。
- 我能解释一个上下文片段为什么被选择、为什么被舍弃、为什么排在当前位置。
- 我能为生产系统设计 ContextOps trace，并用它做灰度、回放和回滚。
