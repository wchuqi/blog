---
title: "AI Context Engineering 学习资料"
date: 2026-06-20
description: "这是一份面向工程实践和面试准备的 AI Context Engineering 中文学习资料。资料重点关注大模型应用中“上下文如何被构造、选择、压缩、传递、记忆、评估和保护”。"
tags:
  - "AI"
  - "工程实践"
  - "AI Context Engineering"
  - "学习资料总览"
category: "AI"
---

# AI Context Engineering 学习资料

这是一份面向工程实践和面试准备的 AI Context Engineering 中文学习资料。资料重点关注大模型应用中“上下文如何被构造、选择、压缩、传递、记忆、评估和保护”。

Context Engineering 可以理解为 AI 应用的“运行时信息架构”：prompt 是其中一部分，RAG、工具结果、会话状态、长期记忆、权限策略、输出 schema 和评估日志也都是上下文系统的一部分。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 基础术语、上下文窗口和 token 预算 | [01-基础术语上下文窗口和Token预算.md](study-material/01-基础术语上下文窗口和Token预算.md) |
| 2 | 上下文来源、指令层级和信任边界 | [02-上下文来源指令层级和信任边界.md](study-material/02-上下文来源指令层级和信任边界.md) |
| 3 | 上下文建模、槽位和拼装流水线 | [03-上下文建模槽位和拼装流水线.md](study-material/03-上下文建模槽位和拼装流水线.md) |
| 4 | RAG、检索、重排和证据注入 | [04-RAG检索重排和证据注入.md](study-material/04-RAG检索重排和证据注入.md) |
| 5 | 长上下文、压缩和摘要 | [05-长上下文压缩和摘要.md](study-material/05-长上下文压缩和摘要.md) |
| 6 | 记忆系统和状态管理 | [06-记忆系统和状态管理.md](study-material/06-记忆系统和状态管理.md) |
| 7 | 工具调用、工具结果和权限上下文 | [07-工具调用工具结果和权限上下文.md](study-material/07-工具调用工具结果和权限上下文.md) |
| 8 | Agent 工作流和上下文生命周期 | [08-Agent工作流和上下文生命周期.md](study-material/08-Agent工作流和上下文生命周期.md) |
| 9 | 多模态和代码上下文工程 | [09-多模态和代码上下文工程.md](study-material/09-多模态和代码上下文工程.md) |
| 10 | 安全、防注入和上下文污染治理 | [10-安全防注入和上下文污染治理.md](study-material/10-安全防注入和上下文污染治理.md) |
| 11 | 评估、监控和 ContextOps | [11-评估监控和ContextOps.md](study-material/11-评估监控和ContextOps.md) |
| 12 | 综合练习项目 | [12-综合练习项目.md](study-material/12-综合练习项目.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | 完整知识点清单 | [14-AI Context Engineering完整知识点清单.md](study-material/14-AI Context Engineering完整知识点清单.md) |
| 15 | Context Engineering 架构分层和数据流 | [15-架构分层和数据流深度解析.md](study-material/15-架构分层和数据流深度解析.md) |
| 16 | 上下文窗口、注意力限制和信息位置效应 | [16-上下文窗口注意力限制和信息位置效应深度解析.md](study-material/16-上下文窗口注意力限制和信息位置效应深度解析.md) |
| 17 | 上下文选择、排序、预算和冲突算法 | [17-上下文选择排序预算和冲突算法深度解析.md](study-material/17-上下文选择排序预算和冲突算法深度解析.md) |
| 18 | RAG 证据工程、查询规划和上下文打包 | [18-RAG证据工程查询规划和上下文打包深度解析.md](study-material/18-RAG证据工程查询规划和上下文打包深度解析.md) |
| 19 | 记忆写入、合并、遗忘和隐私治理 | [19-记忆写入合并遗忘和隐私治理深度解析.md](study-material/19-记忆写入合并遗忘和隐私治理深度解析.md) |
| 20 | MCP、工具协议和外部系统上下文 | [20-MCP工具协议和外部系统上下文深度解析.md](study-material/20-MCP工具协议和外部系统上下文深度解析.md) |
| 21 | Agent 控制流、状态机和上下文恢复 | [21-Agent控制流状态机和上下文恢复深度解析.md](study-material/21-Agent控制流状态机和上下文恢复深度解析.md) |
| 22 | 安全威胁建模、隔离和红队测试 | [22-安全威胁建模隔离和红队测试深度解析.md](study-material/22-安全威胁建模隔离和红队测试深度解析.md) |
| 23 | 评估实验设计、指标体系和失败归因 | [23-评估实验设计指标体系和失败归因深度解析.md](study-material/23-评估实验设计指标体系和失败归因深度解析.md) |
| 24 | 生产架构、缓存、成本和 ContextOps 平台化 | [24-生产架构缓存成本和ContextOps平台化深度解析.md](study-material/24-生产架构缓存成本和ContextOps平台化深度解析.md) |

## 使用建议

- 入门学习：先读 00 到 03，建立上下文工程的基本语言。
- 做 RAG：重点读 04、05、10、11。
- 做 Agent：重点读 06、07、08、10。
- 做生产落地：重点读 03、10、11、12、14。
- 深度进阶：重点读 15 到 24，理解架构分层、选择算法、协议边界、安全威胁建模和生产治理。
- 面试复习：先读 14 完整清单，再读 13 和 `study-material/面试知识点/`。

## 环境假设

- 你已经了解基本 Prompt Engineering。
- 你知道 LLM 是通过输入上下文生成输出，但不要求掌握模型训练细节。
- 代码示例以 Python 风格伪代码为主，强调架构和数据流，不绑定具体框架。

## 参考资料

- LangChain Context Engineering: https://docs.langchain.com/oss/python/langchain/context-engineering
- LangChain Agents and Middleware: https://docs.langchain.com/oss/python/langchain/agents
- LangGraph Memory: https://langchain-ai.github.io/langgraph/concepts/memory/
- OpenAI Prompt Engineering Guide: https://platform.openai.com/docs/guides/prompt-engineering
- OpenAI Conversation State Guide: https://platform.openai.com/docs/guides/conversation-state
- OpenAI File Search Guide: https://platform.openai.com/docs/guides/tools-file-search
- Anthropic Prompt Engineering Overview: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
- Anthropic Prompt Caching: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- Anthropic Memory Tool: https://docs.anthropic.com/en/docs/claude-code/memory
- Anthropic Model Context Protocol: https://docs.anthropic.com/en/docs/mcp
- Model Context Protocol Specification: https://modelcontextprotocol.io/specification/latest
- OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
