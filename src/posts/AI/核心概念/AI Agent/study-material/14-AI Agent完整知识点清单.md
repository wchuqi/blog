---
title: "AI Agent完整知识点清单"
date: 2026-06-20
description: "这份清单用于检查是否真正掌握 AI Agent。它不是术语列表，而是覆盖架构、算法、状态、权限、评估、生产和排障的完整检查表。"
tags:
  - "AI"
  - "核心概念"
  - "AI Agent"
  - "知识清单"
category: "AI"
---

# AI Agent完整知识点清单

[返回索引](../AI Agent学习资料.md)

这份清单用于检查是否真正掌握 AI Agent。它不是术语列表，而是覆盖架构、算法、状态、权限、评估、生产和排障的完整检查表。

## 1. 基础概念和边界

- Agent、Workflow、Chatbot、Copilot、RPA。
- 目标、环境、动作、观察、状态、反馈。
- LLM 在 Agent 中的职责和边界。
- 单 Agent、多 Agent、Agentic workflow。
- 什么时候不应该 Agent 化。
- 自主性和风险之间的关系。

## 2. Agent控制循环

- observe、plan、act、verify、reflect。
- ReAct。
- Plan-and-Execute。
- Router。
- Planner。
- Executor。
- Critic。
- 状态机。
- 停止条件。
- 重试预算。
- 动态重规划。
- checkpoint。
- human-in-the-loop。
- 同一失败重复出现时的转人工规则。

## 3. 控制平面和数据平面

- Agent Gateway。
- Intent Parser。
- Runtime Loop。
- Policy Engine。
- Approval Gate。
- Verifier。
- State Store。
- Trace Store。
- Tool Router。
- Tool Adapter。
- Sandbox。
- Retriever。
- Memory Store。
- 控制平面负责决策、策略、状态、验证。
- 数据平面负责执行工具、检索、读写资源。

## 4. 工具调用和协议

- function calling。
- 工具 schema。
- 工具元数据：risk_level、idempotent、side_effects、timeout、retry_policy。
- 参数校验。
- 工具错误分类。
- 工具结果结构化。
- 幂等工具。
- Tool Router。
- MCP tools。
- MCP resources。
- MCP prompts。
- MCP server/client 边界。
- 工具发现、选择、执行、审计完整链路。

## 5. 工具权限和沙箱

- 用户身份。
- Agent 角色。
- 工具风险等级。
- 数据分类。
- 环境隔离：dev、staging、prod。
- 文件系统边界。
- 网络边界。
- 环境变量边界。
- 命令白名单。
- CPU、内存、时间和输出大小限制。
- 高风险工具审批。
- 副作用操作审计。
- 工具回滚和补偿。

## 6. 上下文工程和RAG

- query understanding。
- query rewrite。
- candidate retrieval。
- hybrid search。
- reranking。
- context compression。
- citation binding。
- no-answer handling。
- 文档分块。
- 权威性排序。
- 新鲜度和版本。
- 敏感数据过滤。
- 检索召回率和精确率。
- 上下文污染和 prompt injection。

## 7. 记忆系统

- 短期记忆。
- 长期记忆。
- 语义记忆。
- 情景记忆。
- 程序记忆。
- 记忆写入策略。
- 记忆来源。
- 记忆过期。
- 记忆删除。
- 记忆和当前事实冲突处理。
- 用户偏好和公司政策优先级。
- 错误记忆污染治理。

## 8. 多Agent协作

- Supervisor-Worker。
- Planner-Executor。
- Critic/Reviewer。
- Debate。
- Blackboard。
- Pipeline。
- Market-style routing。
- 共享状态。
- 黑板事实、假设、决策和产物。
- 资源锁。
- 乐观并发。
- 版本控制。
- 事实冲突。
- 目标冲突。
- 评价冲突。
- 外部 verifier 裁决。

## 9. 安全和Guardrails

- prompt injection。
- data leakage。
- tool abuse。
- permission boundary。
- PII redaction。
- external content as untrusted data。
- policy engine。
- human approval。
- sensitive action gating。
- audit log。
- red team cases。
- 拒答策略。
- 高风险动作二次确认。

## 10. Evals和红队

- result eval。
- process eval。
- safety eval。
- regression eval。
- adversarial eval。
- online eval。
- Eval 样本分层。
- 评分 rubric。
- TSR: Task Success Rate。
- FPR: First Pass Rate。
- TCA: Tool Call Accuracy。
- BVR: Boundary Violation Rate。
- HEP: Human Escalation Precision。
- HER: Human Escalation Recall。
- RR: Regression Rate。
- CPK: Cost Per Task。
- P95 latency。
- 红队 prompt injection。
- 相似实体混淆。
- 无答案和低证据问题。

## 11. 可观测性

- trace。
- trajectory。
- tool call log。
- state transition log。
- approval log。
- retrieval log。
- memory write log。
- safety block log。
- cost metrics。
- latency metrics。
- failure taxonomy。
- 回放和复盘。

## 12. 生产工程

- API Gateway。
- Model Gateway。
- Agent Orchestrator。
- Tool Service。
- Vector Store。
- Memory Store。
- State Store。
- Trace Store。
- Eval Dashboard。
- timeout。
- retry。
- fallback。
- cache。
- checkpoint。
- idempotency。
- rollout。
- rollback。
- versioning。
- budget limit。
- concurrency control。

## 13. 版本治理

- 模型版本。
- prompt 版本。
- tool schema 版本。
- policy 版本。
- retriever 版本。
- embedding/index 版本。
- memory policy 版本。
- eval set 版本。
- 发布批次。
- 灰度和回滚。

## 14. 故障分类

- 目标误解。
- 上下文缺失。
- 上下文污染。
- 检索召回不足。
- 检索排序错误。
- 记忆污染。
- 工具误用。
- 权限过宽。
- 权限过窄。
- 状态漂移。
- 无限循环。
- 验证缺失。
- 成本失控。
- 高风险误执行。
- 人工介入缺失。

## 15. 框架选型

- OpenAI Agents SDK。
- LangChain Agents。
- LangGraph。
- MCP。
- CrewAI。
- AutoGen。
- 原生 API + 自研编排。
- 简单工具调用不必上复杂框架。
- 高风险系统必须自定义 Policy、Eval、Trace。

## 16. 面试高频深度追问

- Agent 和 workflow 有什么本质区别。
- Agent 控制平面如何设计。
- Tool Router 为什么不能只是调用函数。
- MCP 接入后为什么仍需要权限和沙箱。
- RAG 检索排序如何设计。
- 如何防止记忆污染。
- 多 Agent 如何解决共享状态冲突。
- 如何设计 Eval 样本分布。
- Boundary Violation Rate 为什么重要。
- prompt injection 如何防。
- Agent 线上事故如何复盘。
- 如何控制成本和延迟。
- 如何做灰度、回滚和版本治理。

## 17. 最终掌握标准

- 能画出生产级 Agent 架构图。
- 能写 Agent 控制循环和状态机。
- 能区分控制平面和数据平面。
- 能设计工具 schema、权限、沙箱和错误语义。
- 能设计 RAG 排序、引用绑定和无答案策略。
- 能设计记忆写入、冲突和删除机制。
- 能设计多 Agent 黑板和冲突处理。
- 能设计 Eval、红队和在线监控。
- 能做生产事故复盘并产出防复发动作。

