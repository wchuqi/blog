---
title: "AI Agent学习资料"
date: 2026-06-20
description: "这是一份面向软件工程和架构学习的 AI Agent 系统学习资料。它不只解释“智能体是什么”，而是围绕可落地的 Agent 系统展开：任务循环、工具调用、上下文、记忆、MCP、多 Agent、Guardrails、评估、可观测性、部署成本、…"
tags:
  - "AI"
  - "核心概念"
  - "AI Agent"
  - "学习资料总览"
category: "AI"
---

# AI Agent学习资料

这是一份面向软件工程和架构学习的 AI Agent 系统学习资料。它不只解释“智能体是什么”，而是围绕可落地的 Agent 系统展开：任务循环、工具调用、上下文、记忆、MCP、多 Agent、Guardrails、评估、可观测性、部署成本、框架选型和面试表达。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览与心智模型 | [study-material/00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 基础概念和边界 | [study-material/01-基础概念和边界.md](study-material/01-基础概念和边界.md) |
| 2 | LLM能力模型和Agent状态 | [study-material/02-LLM能力模型和Agent状态.md](study-material/02-LLM能力模型和Agent状态.md) |
| 3 | Agent控制循环和规划执行 | [study-material/03-Agent控制循环和规划执行.md](study-material/03-Agent控制循环和规划执行.md) |
| 4 | 工具调用FunctionCalling和MCP | [study-material/04-工具调用FunctionCalling和MCP.md](study-material/04-工具调用FunctionCalling和MCP.md) |
| 5 | 上下文工程RAG和记忆 | [study-material/05-上下文工程RAG和记忆.md](study-material/05-上下文工程RAG和记忆.md) |
| 6 | 工作流Agent和多Agent模式 | [study-material/06-工作流Agent和多Agent模式.md](study-material/06-工作流Agent和多Agent模式.md) |
| 7 | 任务分解路由调度和状态机 | [study-material/07-任务分解路由调度和状态机.md](study-material/07-任务分解路由调度和状态机.md) |
| 8 | Guardrails权限安全和人类介入 | [study-material/08-Guardrails权限安全和人类介入.md](study-material/08-Guardrails权限安全和人类介入.md) |
| 9 | Evals观测和可追踪性 | [study-material/09-Evals观测和可追踪性.md](study-material/09-Evals观测和可追踪性.md) |
| 10 | 生产工程部署成本和性能 | [study-material/10-生产工程部署成本和性能.md](study-material/10-生产工程部署成本和性能.md) |
| 11 | 常见框架和选型 | [study-material/11-常见框架和选型.md](study-material/11-常见框架和选型.md) |
| 12 | 综合练习项目 | [study-material/12-综合练习项目.md](study-material/12-综合练习项目.md) |
| 13 | 面试知识点整理 | [study-material/13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | 完整知识点清单 | [study-material/14-AI Agent完整知识点清单.md](study-material/14-AI Agent完整知识点清单.md) |
| 15 | 深度故障案例和反模式 | [study-material/15-深度故障案例和反模式.md](study-material/15-深度故障案例和反模式.md) |
| 16 | Agent控制平面和数据平面深度架构 | [study-material/16-Agent控制平面和数据平面深度架构.md](study-material/16-Agent控制平面和数据平面深度架构.md) |
| 17 | 工具协议MCP沙箱和权限深度解析 | [study-material/17-工具协议MCP沙箱和权限深度解析.md](study-material/17-工具协议MCP沙箱和权限深度解析.md) |
| 18 | RAG记忆检索排序和一致性深度解析 | [study-material/18-RAG记忆检索排序和一致性深度解析.md](study-material/18-RAG记忆检索排序和一致性深度解析.md) |
| 19 | 多Agent协作冲突一致性和黑板机制 | [study-material/19-多Agent协作冲突一致性和黑板机制.md](study-material/19-多Agent协作冲突一致性和黑板机制.md) |
| 20 | Evals红队统计指标和在线监控深度解析 | [study-material/20-Evals红队统计指标和在线监控深度解析.md](study-material/20-Evals红队统计指标和在线监控深度解析.md) |
| 21 | 生产治理成本可靠性和事故复盘深度解析 | [study-material/21-生产治理成本可靠性和事故复盘深度解析.md](study-material/21-生产治理成本可靠性和事故复盘深度解析.md) |

## 使用建议

- 入门理解：读 `00`、`01`、`03`。
- 想开发 Agent 应用：读 `04`、`05`、`07`、`08`。
- 想做生产落地：读 `09`、`10`、`15`。
- 想深入底层机制和架构治理：读 `16` 到 `21`。
- 想准备面试：读 `13-面试知识点整理.md` 和 `面试知识点/` 目录。
- 想做作品集：完成 `12-综合练习项目.md`。

## 参考资料

- OpenAI Agents SDK: <https://openai.github.io/openai-agents-python/>
- OpenAI function calling: <https://platform.openai.com/docs/guides/function-calling>
- Anthropic Building Effective Agents: <https://www.anthropic.com/engineering/building-effective-agents>
- LangChain Agents: <https://docs.langchain.com/oss/python/langchain/agents>
- LangGraph documentation: <https://langchain-ai.github.io/langgraph/>
- Model Context Protocol: <https://modelcontextprotocol.io/>
- ReAct paper: <https://arxiv.org/abs/2210.03629>
