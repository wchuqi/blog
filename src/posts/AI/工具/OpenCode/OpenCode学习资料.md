---
title: "OpenCode 学习资料"
date: 2026-06-20
description: "这是一份面向工程实践、团队落地和面试复习的 OpenCode 中文学习资料。OpenCode 是一个开源 AI coding agent，可通过终端界面、桌面应用或 IDE 扩展使用；本资料以终端和项目工程化使用为主。"
tags:
  - "AI"
  - "工具"
  - "OpenCode"
  - "学习资料总览"
category: "AI"
---

# OpenCode 学习资料

这是一份面向工程实践、团队落地和面试复习的 OpenCode 中文学习资料。OpenCode 是一个开源 AI coding agent，可通过终端界面、桌面应用或 IDE 扩展使用；本资料以终端和项目工程化使用为主。

资料目标不是只记命令，而是建立“代码库上下文 -> Agent 计划/执行 -> 工具权限 -> 变更验证 -> 团队治理”的完整心智模型。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 安装、初始化和项目约定 | [01-安装初始化和项目约定.md](study-material/01-安装初始化和项目约定.md) |
| 2 | TUI、CLI 和日常工作流 | [02-TUICLI和日常工作流.md](study-material/02-TUICLI和日常工作流.md) |
| 3 | 配置体系、模型和 Provider | [03-配置体系模型和Provider.md](study-material/03-配置体系模型和Provider.md) |
| 4 | 工具、权限和安全边界 | [04-工具权限和安全边界.md](study-material/04-工具权限和安全边界.md) |
| 5 | Agents、Plan/Build 和子 Agent | [05-Agents和工作模式.md](study-material/05-Agents和工作模式.md) |
| 6 | 自定义命令、Rules 和 AGENTS.md | [06-自定义命令Rules和AGENTS.md](study-material/06-自定义命令Rules和AGENTS.md) |
| 7 | MCP、自定义工具和插件扩展 | [07-MCP自定义工具和插件扩展.md](study-material/07-MCP自定义工具和插件扩展.md) |
| 8 | 调试、回滚、排障和成本控制 | [08-调试回滚排障和成本控制.md](study-material/08-调试回滚排障和成本控制.md) |
| 9 | 团队落地、审计和生产治理 | [09-团队落地审计和生产治理.md](study-material/09-团队落地审计和生产治理.md) |
| 10 | 综合练习项目 | [10-综合练习项目.md](study-material/10-综合练习项目.md) |
| 11 | 面试知识点整理 | [11-面试知识点整理.md](study-material/11-面试知识点整理.md) |
| 12 | 完整知识点清单 | [12-OpenCode完整知识点清单.md](study-material/12-OpenCode完整知识点清单.md) |
| 13 | 执行架构、会话状态和工具调用生命周期深度解析 | [13-执行架构会话状态和工具调用生命周期深度解析.md](study-material/13-执行架构会话状态和工具调用生命周期深度解析.md) |
| 14 | 配置解析、覆盖顺序和版本治理深度解析 | [14-配置解析覆盖顺序和版本治理深度解析.md](study-material/14-配置解析覆盖顺序和版本治理深度解析.md) |
| 15 | 权限匹配算法、风险建模和策略模板深度解析 | [15-权限匹配算法风险建模和策略模板深度解析.md](study-material/15-权限匹配算法风险建模和策略模板深度解析.md) |
| 16 | Agent 调度、子 Agent 协作和上下文压缩深度解析 | [16-Agent调度子Agent协作和上下文压缩深度解析.md](study-material/16-Agent调度子Agent协作和上下文压缩深度解析.md) |
| 17 | 上下文工程、AGENTS.md 和命令系统深度解析 | [17-上下文工程AGENTS和命令系统深度解析.md](study-material/17-上下文工程AGENTS和命令系统深度解析.md) |
| 18 | MCP、自定义工具、插件和供应链安全深度解析 | [18-MCP自定义工具插件和供应链安全深度解析.md](study-material/18-MCP自定义工具插件和供应链安全深度解析.md) |
| 19 | 生产故障案例、排障剧本和恢复流程深度解析 | [19-生产故障案例排障剧本和恢复流程深度解析.md](study-material/19-生产故障案例排障剧本和恢复流程深度解析.md) |
| 20 | 团队平台化、度量体系和组织治理深度解析 | [20-团队平台化度量体系和组织治理深度解析.md](study-material/20-团队平台化度量体系和组织治理深度解析.md) |

## 使用建议

- 入门学习：按 00 到 02 阅读，先能在真实项目里问问题、建计划、执行小改动。
- 工程实践：重点读 03 到 08，掌握配置层、权限层、工具层和排障链路。
- 深度进阶：重点读 13 到 20，理解执行架构、配置解析、权限算法、Agent 协作、上下文工程、扩展安全和平台化治理。
- 团队落地：重点读 06、09、10、18、20，把 OpenCode 固化为可审查的研发流程。
- 面试复习：先读 12 完整清单，再读 11 和 `study-material/面试知识点/`。
- 日常查用：优先看 04 的权限策略、06 的命令模板、08 的回滚排障。

## 参考资料

- OpenCode Intro: https://opencode.ai/docs/
- OpenCode Config: https://opencode.ai/docs/config/
- OpenCode CLI: https://opencode.ai/docs/cli/
- OpenCode Tools: https://opencode.ai/docs/tools/
- OpenCode Permissions: https://opencode.ai/docs/permissions/
- OpenCode Agents: https://opencode.ai/docs/agents/
- OpenCode Commands: https://opencode.ai/docs/commands/
- OpenCode MCP servers: https://opencode.ai/docs/mcp-servers/
- OpenCode Custom Tools: https://opencode.ai/docs/custom-tools/
- OpenCode Plugins: https://opencode.ai/docs/plugins/

> 资料基于 2026-06-08 可访问的官方文档整理；OpenCode 发展很快，实际安装命令、模型名和配置字段以官方文档为准。
