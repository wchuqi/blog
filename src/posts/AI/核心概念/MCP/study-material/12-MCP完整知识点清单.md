---
title: "MCP 学习资料：完整知识点清单"
date: 2026-06-20
description: "这份清单用于检查 MCP 学习覆盖是否完整。它从基础术语、协议机制、能力模型、传输、实现、安全、生产治理和面试维度列出必须掌握的范围。"
tags:
  - "AI"
  - "核心概念"
  - "MCP"
  - "知识清单"
category: "AI"
---

# MCP 学习资料：完整知识点清单

[返回索引](../MCP学习资料.md)

这份清单用于检查 MCP 学习覆盖是否完整。它从基础术语、协议机制、能力模型、传输、实现、安全、生产治理和面试维度列出必须掌握的范围。

## 一、基础和架构

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| MCP 定位 | AI 应用连接外部上下文、工具和工作流的标准协议 | [00-总览与心智模型.md](00-总览与心智模型.md) |
| 核心角色 | host、client、server、external system | [01-基础术语架构和角色.md](01-基础术语架构和角色.md) |
| 能力分类 | tools、resources、prompts、roots、sampling、elicitation | [00-总览与心智模型.md](00-总览与心智模型.md) |
| 相邻概念 | function calling、REST、OpenAPI、RAG、Agent、插件 | [00-总览与心智模型.md](00-总览与心智模型.md) |

## 二、协议机制

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| JSON-RPC | request、response、notification、error | [02-协议生命周期JSON-RPC和能力协商.md](02-协议生命周期JSON-RPC和能力协商.md) |
| 生命周期 | initialize、initialized、operation、shutdown | [02-协议生命周期JSON-RPC和能力协商.md](02-协议生命周期JSON-RPC和能力协商.md) |
| 能力协商 | client capabilities、server capabilities、protocolVersion | [02-协议生命周期JSON-RPC和能力协商.md](02-协议生命周期JSON-RPC和能力协商.md) |
| 错误和取消 | 协议错误、业务错误、工具错误、取消、进度 | [02-协议生命周期JSON-RPC和能力协商.md](02-协议生命周期JSON-RPC和能力协商.md) |

## 三、传输和部署

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| stdio | 本地进程、stdin/stdout、日志污染风险 | [03-传输层stdio和StreamableHTTP.md](03-传输层stdio和StreamableHTTP.md) |
| Streamable HTTP | 远程部署、认证、会话、重连、观测 | [03-传输层stdio和StreamableHTTP.md](03-传输层stdio和StreamableHTTP.md) |
| 旧 SSE | 早期远程传输、兼容和迁移风险 | [03-传输层stdio和StreamableHTTP.md](03-传输层stdio和StreamableHTTP.md) |
| 幂等重试 | 远程调用重试和有副作用工具 | [03-传输层stdio和StreamableHTTP.md](03-传输层stdio和StreamableHTTP.md) |

## 四、服务端能力

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| Resources | URI、resource template、权限、内容大小 | [04-服务端能力ResourcesPromptsTools.md](04-服务端能力ResourcesPromptsTools.md) |
| Prompts | 提示模板、参数、任务结构 | [04-服务端能力ResourcesPromptsTools.md](04-服务端能力ResourcesPromptsTools.md) |
| Tools | 工具列表、工具调用、Schema、结构化输出 | [04-服务端能力ResourcesPromptsTools.md](04-服务端能力ResourcesPromptsTools.md) |
| 能力变化 | listChanged、动态权限、host 刷新 | [04-服务端能力ResourcesPromptsTools.md](04-服务端能力ResourcesPromptsTools.md) |

## 五、客户端能力

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| Roots | 工作区边界、路径校验、root 变化 | [05-客户端能力RootsSamplingElicitation.md](05-客户端能力RootsSamplingElicitation.md) |
| Sampling | server 请求 host 调用模型、成本和安全 | [05-客户端能力RootsSamplingElicitation.md](05-客户端能力RootsSamplingElicitation.md) |
| Elicitation | server 请求用户补充信息、确认和隐私 | [05-客户端能力RootsSamplingElicitation.md](05-客户端能力RootsSamplingElicitation.md) |
| 降级策略 | client 不支持能力时如何处理 | [05-客户端能力RootsSamplingElicitation.md](05-客户端能力RootsSamplingElicitation.md) |

## 六、工具设计和实现

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| Schema | required、enum、范围、长度、additionalProperties | [06-工具Schema结构化输出和错误处理.md](06-工具Schema结构化输出和错误处理.md) |
| 结构化输出 | content、structuredContent、机器可读结果 | [06-工具Schema结构化输出和错误处理.md](06-工具Schema结构化输出和错误处理.md) |
| 错误处理 | 参数错误、权限错误、业务冲突、外部失败 | [06-工具Schema结构化输出和错误处理.md](06-工具Schema结构化输出和错误处理.md) |
| 幂等 | idempotency key、重试、取消和补偿 | [06-工具Schema结构化输出和错误处理.md](06-工具Schema结构化输出和错误处理.md) |
| 调试 | MCP Inspector、协议测试、日志 | [08-实现调试和MCPInspector.md](08-实现调试和MCPInspector.md) |

## 七、安全和治理

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 信任边界 | 用户、host、模型、server、外部系统 | [07-授权安全信任边界和权限治理.md](07-授权安全信任边界和权限治理.md) |
| 提示注入 | 资源内容不可信、工具调用防护 | [07-授权安全信任边界和权限治理.md](07-授权安全信任边界和权限治理.md) |
| Token passthrough | token 透传风险和替代方案 | [07-授权安全信任边界和权限治理.md](07-授权安全信任边界和权限治理.md) |
| Confused deputy | 授权绑定用户意图、目标资源和动作 | [07-授权安全信任边界和权限治理.md](07-授权安全信任边界和权限治理.md) |
| 高危工具 | 分级、确认、审批、审计、回滚 | [07-授权安全信任边界和权限治理.md](07-授权安全信任边界和权限治理.md) |

## 八、生产架构

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| MCP 网关 | 认证、授权、策略、限流、审计 | [09-生产架构网关注册观测和版本治理.md](09-生产架构网关注册观测和版本治理.md) |
| Server registry | owner、版本、能力、scope、风险等级 | [09-生产架构网关注册观测和版本治理.md](09-生产架构网关注册观测和版本治理.md) |
| 可观测性 | tool 调用次数、延迟、错误、trace、成本 | [09-生产架构网关注册观测和版本治理.md](09-生产架构网关注册观测和版本治理.md) |
| 版本治理 | Schema、描述、权限、兼容性、灰度 | [09-生产架构网关注册观测和版本治理.md](09-生产架构网关注册观测和版本治理.md) |
| 综合项目 | 招聘系统 MCP server 设计和实现 | [10-综合练习项目.md](10-综合练习项目.md) |

## 九、深度机制

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 协议状态机 | 初始化前、初始化中、运行期、关闭期的合法消息和状态转移 | [13-协议状态机消息路由取消和进度深度解析.md](13-协议状态机消息路由取消和进度深度解析.md) |
| 消息路由 | request id、notification、并发请求、取消、进度、长任务上下文 | [13-协议状态机消息路由取消和进度深度解析.md](13-协议状态机消息路由取消和进度深度解析.md) |
| 工具选择链路 | list、策略过滤、模型选择、用户确认、server 校验、外部执行、结果注入 | [14-工具调用决策Schema约束和权限执行深度解析.md](14-工具调用决策Schema约束和权限执行深度解析.md) |
| 工具注解 | readOnly、destructive、idempotent、openWorld 等提示不是安全边界 | [14-工具调用决策Schema约束和权限执行深度解析.md](14-工具调用决策Schema约束和权限执行深度解析.md) |
| HTTP 会话 | `MCP-Session-Id`、认证头、重连、幂等、网关路由 | [15-StreamableHTTP会话网关和可靠性深度解析.md](15-StreamableHTTP会话网关和可靠性深度解析.md) |
| OAuth 深度 | Protected Resource Metadata、resource 参数、audience 绑定、PKCE、scope challenge | [16-OAuth授权安全威胁和Token治理深度解析.md](16-OAuth授权安全威胁和Token治理深度解析.md) |
| 生产平台 | registry、gateway、policy engine、audit、trace、版本兼容 | [17-MCP生产平台注册发现观测和版本治理深度解析.md](17-MCP生产平台注册发现观测和版本治理深度解析.md) |
| Agent 集成 | 工具规划、资源注入、RAG 证据、上下文污染、长期记忆和恢复 | [18-MCP与AgentRAGContextEngineering集成深度解析.md](18-MCP与AgentRAGContextEngineering集成深度解析.md) |
| 深度实验 | 协议、工具、安全、HTTP、Agent 场景实验 | [19-MCP深度实验手册和自测题.md](19-MCP深度实验手册和自测题.md) |

## 十、高频易错清单

- 把 MCP server 当成模型服务。
- 把所有能力都做成 tool。
- 暴露万能 `execute` 工具。
- 输入 Schema 过宽。
- 高危工具没有确认和审计。
- Resource 内容直接当可信指令。
- 使用服务端超级 token 访问所有系统。
- 忽略 stdio stdout 日志污染协议。
- 远程 MCP 没有认证、授权和租户隔离。
- 不区分协议错误和工具业务错误。
- 不做幂等，导致重试重复执行。
- Tool 描述变化不做版本评审。
- 认为工具注解等于权限控制。
- 远程 MCP 不校验 token audience。
- HTTP 重试导致高危工具重复执行。
- 让资源内容影响系统指令和工具权限。

## 十一、最终验收清单

- 能解释 MCP 的角色、能力和生命周期。
- 能手写 initialize 和 tools/call 消息。
- 能区分 stdio 和 Streamable HTTP。
- 能设计 resource、prompt、tool。
- 能写严格工具 Schema。
- 能设计结构化输出和错误模型。
- 能说明 Roots、Sampling、Elicitation 的用途和风险。
- 能识别提示注入、token 透传和 confused deputy。
- 能实现并调试一个最小 MCP server。
- 能为企业 MCP 设计网关、注册、审计、观测和版本治理。
- 能完成综合项目并通过面试场景追问。
- 能解释 MCP 协议状态机、工具调用链路、OAuth 令牌绑定、HTTP 会话可靠性和 Agent 集成风险。

## 十二、官方资料入口

- MCP 2025-11-25 Specification: https://modelcontextprotocol.io/specification/2025-11-25
- Tools: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
- Transports: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- Lifecycle: https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
