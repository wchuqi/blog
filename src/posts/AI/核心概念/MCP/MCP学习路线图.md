---
title: "MCP 学习路线图"
date: 2026-06-20
description: "这份路线图面向希望系统掌握 Model Context Protocol 的 AI 应用工程师、后端工程师、平台工程师和面试准备者。MCP 的核心价值是把外部系统能力以统一协议暴露给 AI 应用，但真正难点不在“调一个工具”，而在协议边界、…"
tags:
  - "AI"
  - "核心概念"
  - "MCP"
  - "学习路线图"
category: "AI"
---

# MCP 学习路线图

这份路线图面向希望系统掌握 Model Context Protocol 的 AI 应用工程师、后端工程师、平台工程师和面试准备者。MCP 的核心价值是把外部系统能力以统一协议暴露给 AI 应用，但真正难点不在“调一个工具”，而在协议边界、权限、安全、可观测和生产治理。

## 阶段 1：基础认知

- 目标：理解 MCP 解决什么问题，能区分 host、client、server、tool、resource、prompt。
- 需要掌握：MCP 定义、三方角色、上下文注入、工具调用、协议边界。
- 例子：一个桌面 AI 应用作为 host，连接一个文件系统 MCP server 和一个 GitHub MCP server。
- 练习：画出 host、client、server、外部系统之间的数据流图。
- 验收：能解释 MCP 和普通 REST API、函数调用、插件系统的区别。
- 重点：MCP 是 AI 应用和外部上下文/工具之间的协议，不是模型本身。
- 易错：把 MCP server 当成“模型服务”。MCP server 通常不负责推理，而是暴露资源、提示和工具。

## 阶段 2：协议和生命周期

- 目标：能读懂 MCP JSON-RPC 消息，理解初始化、能力协商、通知和错误处理。
- 需要掌握：JSON-RPC 2.0、request、response、notification、initialize、initialized、capabilities、protocolVersion。
- 例子：客户端发送 `initialize`，服务端返回支持 `tools`、`resources` 或 `prompts`。
- 练习：手写一组初始化和工具调用 JSON 消息。
- 验收：能说明为什么能力协商能降低客户端和服务端版本不匹配风险。
- 重点：初始化阶段确定双方能做什么，运行阶段只能依赖协商出的能力。
- 易错：客户端直接调用未声明能力，导致兼容性和安全问题。

## 阶段 3：传输层和连接模型

- 目标：理解本地 stdio 和远程 Streamable HTTP 的差异。
- 需要掌握：stdio、Streamable HTTP、session、重连、消息边界、旧 SSE 兼容风险。
- 例子：本地命令行启动一个 stdio server；远程平台使用 HTTP 暴露 MCP endpoint。
- 练习：比较本地文件系统 MCP server 和远程知识库 MCP server 的部署模型。
- 验收：能为本地开发、企业内网、SaaS 集成分别选择传输方式。
- 重点：传输方式影响权限模型、部署方式、认证方式和观测方式。
- 易错：把远程 HTTP MCP 当成本地工具一样信任，忽略网络身份认证和授权。

## 阶段 4：服务端能力

- 目标：掌握 Resources、Prompts、Tools 三类服务端能力。
- 需要掌握：资源 URI、资源模板、提示模板、工具列表、工具调用、输入 Schema、结构化输出。
- 例子：数据库 MCP server 暴露表结构为 resource，暴露 SQL 查询为 tool，暴露 SQL 解释模板为 prompt。
- 练习：设计一个招聘系统 MCP server，包含候选人查询工具和岗位资源。
- 验收：能说明何时用 resource，何时用 tool，何时用 prompt。
- 重点：resource 是上下文，prompt 是可复用任务模板，tool 是可执行动作。
- 易错：把所有能力都做成 tool，导致只读上下文也被建模成高风险动作。

## 阶段 5：客户端能力和人机协作

- 目标：理解 Roots、Sampling、Elicitation 如何让 server 反向请求客户端能力或用户输入。
- 需要掌握：roots/list、sampling/createMessage、elicitation/create、用户确认、权限边界。
- 例子：server 需要知道工作区根目录，通过 Roots 获取允许访问范围。
- 练习：设计一个需要用户确认的部署工具调用流程。
- 验收：能说明为什么 Sampling 和 Elicitation 必须受 host 控制。
- 重点：MCP 是双向协议，server 也可能请求客户端能力，但不能绕过 host 的安全边界。
- 易错：server 自行调用模型或诱导用户输入敏感信息，破坏 host 的治理链路。

## 阶段 6：安全和生产治理

- 目标：能把 MCP 放进真实企业环境，设计权限、审计、隔离、版本和观测。
- 需要掌握：OAuth 授权、最小权限、工具审批、提示注入、token passthrough 风险、confused deputy、审计日志、MCP 网关。
- 例子：内部工单 MCP server 只允许查询当前用户有权限的工单，删除工单需要二次确认。
- 练习：为一个“数据库查询 MCP server”写安全评审清单。
- 验收：能识别高危工具、敏感资源、越权路径和回滚机制。
- 重点：AI 工具调用的权限应该绑定真实用户和上下文，而不是给模型一个万能账号。
- 易错：把 API token 直接透传给 MCP server，导致权限边界失控。

## 阶段 7：深度机制和系统设计

- 目标：理解 MCP 在复杂 Agent、远程 server、企业平台和高危工具场景下的深层机制。
- 需要掌握：协议状态机、请求路由、长任务模式、取消、进度、工具选择链路、工具注解、Streamable HTTP 会话、OAuth resource 参数、token audience、MCP 网关策略、Agent/RAG/Context Engineering 集成。
- 例子：一个 Agent 先通过 resource 读取候选人资料，再用 prompt 组织分析，最后经高危 tool 更新状态，全链路经过网关授权、用户确认和审计。
- 练习：完成深度实验手册中的协议消息、工具误用、token audience 校验、远程重试幂等和提示注入实验。
- 验收：能从协议、模型、权限、网络、外部系统五层解释一次 MCP tool call 的成功或失败。
- 重点：深度不是会写 server demo，而是能解释每个边界如何防止误用和越权。
- 易错：只从 SDK 视角学习 MCP，忽略协议、状态、授权和生产平台。

## 推荐学习节奏

| 周期 | 学习重点 | 产出 |
| --- | --- | --- |
| 第 1 周 | MCP 基础、架构角色、JSON-RPC 生命周期 | 一张 MCP 数据流图和消息样例 |
| 第 2 周 | stdio、Streamable HTTP、Resources、Prompts、Tools | 一个本地 MCP server 原型 |
| 第 3 周 | Schema、结构化输出、错误处理、调试 | 一个可被 Inspector 调试的工具集 |
| 第 4 周 | Roots、Sampling、Elicitation、安全授权 | 一份权限和安全评审文档 |
| 第 5 周 | 生产架构、网关、观测、版本治理 | 一个企业 MCP 平台方案 |
| 第 6 周 | 综合项目和面试复盘 | 完成招聘系统 MCP server 设计与答辩 |
| 第 7 周 | 协议状态机、OAuth、HTTP 会话、工具决策和 Agent 集成 | 完成深度实验报告和系统设计答辩 |

## 最终能力清单

- 能把 MCP 放在 AI 应用架构中定位。
- 能读写核心 JSON-RPC 消息。
- 能实现工具、资源、提示三类能力。
- 能处理传输、能力协商、错误、取消和进度。
- 能设计 MCP 权限边界和安全策略。
- 能解释 MCP 与 function calling、插件、OpenAPI、RAG、Agent 框架的关系。
- 能面向生产设计网关、注册、审计、观测和版本治理。
- 能回答 MCP 深度追问：为什么不能 token passthrough、为什么工具注解不是安全边界、为什么远程重试需要幂等、为什么 resource 内容不能当可信指令。
