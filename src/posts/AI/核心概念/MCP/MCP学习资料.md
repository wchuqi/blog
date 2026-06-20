---
title: "MCP 学习资料"
date: 2026-06-20
description: "这是一份 Model Context Protocol（MCP）学习资料索引。资料按知识点拆分到 study-material/ 目录，覆盖 MCP 的协议模型、生命周期、传输、Resources、Prompts、Tools、Roots、S…"
tags:
  - "AI"
  - "核心概念"
  - "MCP"
  - "学习资料总览"
category: "AI"
---

# MCP 学习资料

这是一份 Model Context Protocol（MCP）学习资料索引。资料按知识点拆分到 `study-material/` 目录，覆盖 MCP 的协议模型、生命周期、传输、Resources、Prompts、Tools、Roots、Sampling、Elicitation、安全授权、实现调试、生产治理和面试复习。

MCP 规范更新较快。本文以官方 2025-11-25 规范为主线整理，并把容易过时的版本差异单独标注。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 基础术语、架构和角色 | [01-基础术语架构和角色.md](study-material/01-基础术语架构和角色.md) |
| 2 | 协议生命周期、JSON-RPC 和能力协商 | [02-协议生命周期JSON-RPC和能力协商.md](study-material/02-协议生命周期JSON-RPC和能力协商.md) |
| 3 | 传输层：stdio 和 Streamable HTTP | [03-传输层stdio和StreamableHTTP.md](study-material/03-传输层stdio和StreamableHTTP.md) |
| 4 | 服务端能力：Resources、Prompts、Tools | [04-服务端能力ResourcesPromptsTools.md](study-material/04-服务端能力ResourcesPromptsTools.md) |
| 5 | 客户端能力：Roots、Sampling、Elicitation | [05-客户端能力RootsSamplingElicitation.md](study-material/05-客户端能力RootsSamplingElicitation.md) |
| 6 | 工具 Schema、结构化输出和错误处理 | [06-工具Schema结构化输出和错误处理.md](study-material/06-工具Schema结构化输出和错误处理.md) |
| 7 | 授权、安全、信任边界和权限治理 | [07-授权安全信任边界和权限治理.md](study-material/07-授权安全信任边界和权限治理.md) |
| 8 | 实现、调试和 MCP Inspector | [08-实现调试和MCPInspector.md](study-material/08-实现调试和MCPInspector.md) |
| 9 | 生产架构、网关、注册、观测和版本治理 | [09-生产架构网关注册观测和版本治理.md](study-material/09-生产架构网关注册观测和版本治理.md) |
| 10 | 综合练习项目 | [10-综合练习项目.md](study-material/10-综合练习项目.md) |
| 11 | 面试知识点整理 | [11-面试知识点整理.md](study-material/11-面试知识点整理.md) |
| 12 | MCP 完整知识点清单 | [12-MCP完整知识点清单.md](study-material/12-MCP完整知识点清单.md) |
| 13 | 协议状态机、消息路由、取消和进度深度解析 | [13-协议状态机消息路由取消和进度深度解析.md](study-material/13-协议状态机消息路由取消和进度深度解析.md) |
| 14 | 工具调用决策、Schema 约束和权限执行深度解析 | [14-工具调用决策Schema约束和权限执行深度解析.md](study-material/14-工具调用决策Schema约束和权限执行深度解析.md) |
| 15 | Streamable HTTP、会话、网关和可靠性深度解析 | [15-StreamableHTTP会话网关和可靠性深度解析.md](study-material/15-StreamableHTTP会话网关和可靠性深度解析.md) |
| 16 | OAuth 授权、安全威胁和 Token 治理深度解析 | [16-OAuth授权安全威胁和Token治理深度解析.md](study-material/16-OAuth授权安全威胁和Token治理深度解析.md) |
| 17 | MCP 生产平台、注册发现、观测和版本治理深度解析 | [17-MCP生产平台注册发现观测和版本治理深度解析.md](study-material/17-MCP生产平台注册发现观测和版本治理深度解析.md) |
| 18 | MCP 与 Agent、RAG、Context Engineering 集成深度解析 | [18-MCP与AgentRAGContextEngineering集成深度解析.md](study-material/18-MCP与AgentRAGContextEngineering集成深度解析.md) |
| 19 | MCP 深度实验手册和自测题 | [19-MCP深度实验手册和自测题.md](study-material/19-MCP深度实验手册和自测题.md) |

## 使用建议

- 初学：按 0 到 6 顺序学习，先理解协议角色，再实现一个本地 stdio MCP server。
- 后端工程：重点读 2、3、6、7、8、9，关注协议、权限、错误处理和生产集成。
- AI 应用工程：重点读 4、5、6、10，理解模型如何通过 MCP 使用外部上下文和工具。
- 安全和平台治理：重点读 7、9、12，关注授权、工具权限、数据泄露和审计。
- 面试复习：先读 [12-MCP完整知识点清单.md](study-material/12-MCP完整知识点清单.md)，再读 [11-面试知识点整理.md](study-material/11-面试知识点整理.md)。
- 深度机制专项：重点读 13、14、15、16、17、18、19，用实验验证协议状态、权限链路和生产治理。

## 环境假设

- 学习对象：已经了解 HTTP、JSON、基本 LLM 工具调用或 Agent 概念的后端/AI 工程师。
- 示例语言：以 TypeScript/JavaScript 和伪代码为主，概念可迁移到 Python、Java、Go。
- 规范基线：MCP 2025-11-25 官方规范。
- 典型场景：把文件系统、数据库、搜索、工单、RAG、CI/CD、内部平台能力暴露给 AI 应用。

## 学习验收

完成本资料后，你应该能够：

- 解释 MCP 的 host、client、server、tool、resource、prompt、root、sampling、elicitation。
- 描述 MCP 初始化、能力协商、请求响应、通知和关闭流程。
- 区分 stdio、Streamable HTTP 和旧 SSE 方案的适用场景。
- 设计一个工具 Schema，并处理参数校验、结构化输出和错误返回。
- 识别 MCP 中的提示注入、越权工具调用、token 透传、confused deputy 和数据泄露风险。
- 实现并调试一个最小 MCP server。
- 为企业内部 MCP server 设计权限、审计、网关、版本和观测方案。
- 解释 MCP 深层机制：状态机、消息路由、任务/取消、工具选择链路、HTTP 会话、OAuth audience 绑定、网关策略和 Agent 集成。

## 参考资料

- Official MCP Specification 2025-11-25: https://modelcontextprotocol.io/specification/2025-11-25
- MCP Tools specification: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
- MCP Transports specification: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- MCP Lifecycle specification: https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
