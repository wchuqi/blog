---
title: "Claude Code 学习资料"
date: 2026-06-20
description: "这是一份面向工程实践、团队落地和面试准备的 Claude Code 中文学习资料。资料目标不是罗列命令，而是帮助你形成“如何让 AI 编码 Agent 安全地理解项目、执行任务、验证结果、扩展能力、进入团队流程”的完整能力。"
tags:
  - "AI"
  - "工具"
  - "Claude Code"
  - "学习资料总览"
category: "AI"
---

# Claude Code 学习资料

这是一份面向工程实践、团队落地和面试准备的 Claude Code 中文学习资料。资料目标不是罗列命令，而是帮助你形成“如何让 AI 编码 Agent 安全地理解项目、执行任务、验证结果、扩展能力、进入团队流程”的完整能力。

Claude Code 的关键不是某个提示词模板，而是上下文管理、权限控制、任务拆解、工具调用、验证闭环和可审计的团队规范。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 安装、登录和运行环境 | [01-安装登录和运行环境.md](study-material/01-安装登录和运行环境.md) |
| 2 | CLI 命令、交互模式和批处理 | [02-CLI命令交互模式和批处理.md](study-material/02-CLI命令交互模式和批处理.md) |
| 3 | 项目记忆、`CLAUDE.md` 和上下文治理 | [03-项目记忆CLAUDEmd和上下文治理.md](study-material/03-项目记忆CLAUDEmd和上下文治理.md) |
| 4 | 权限模式、设置层级和安全边界 | [04-权限模式设置层级和安全边界.md](study-material/04-权限模式设置层级和安全边界.md) |
| 5 | 工具调用、文件编辑和开发闭环 | [05-工具调用文件编辑和开发闭环.md](study-material/05-工具调用文件编辑和开发闭环.md) |
| 6 | MCP 外部工具和数据源集成 | [06-MCP外部工具和数据源集成.md](study-material/06-MCP外部工具和数据源集成.md) |
| 7 | Hooks 自动化和事件治理 | [07-Hooks自动化和事件治理.md](study-material/07-Hooks自动化和事件治理.md) |
| 8 | Skills、Slash Commands 和插件复用 | [08-SkillsSlashCommands和插件复用.md](study-material/08-SkillsSlashCommands和插件复用.md) |
| 9 | Subagents、后台会话和并行工作 | [09-Subagents后台会话和并行工作.md](study-material/09-Subagents后台会话和并行工作.md) |
| 10 | IDE、桌面、Web 和团队协作 | [10-IDE桌面Web和团队协作.md](study-material/10-IDE桌面Web和团队协作.md) |
| 11 | Agent SDK 和程序化集成 | [11-AgentSDK和程序化集成.md](study-material/11-AgentSDK和程序化集成.md) |
| 12 | 安全、成本、排障和生产治理 | [12-安全成本排障和生产治理.md](study-material/12-安全成本排障和生产治理.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | 完整知识点清单 | [14-Claude Code完整知识点清单.md](study-material/14-Claude Code完整知识点清单.md) |
| 15 | 综合练习项目和能力验收 | [15-综合练习项目和能力验收.md](study-material/15-综合练习项目和能力验收.md) |
| 16 | Agent 执行循环和状态机深度解析 | [16-Agent执行循环和状态机深度解析.md](study-material/16-Agent执行循环和状态机深度解析.md) |
| 17 | 上下文装载、记忆检索和压缩深度解析 | [17-上下文装载记忆检索和压缩深度解析.md](study-material/17-上下文装载记忆检索和压缩深度解析.md) |
| 18 | 配置层级、权限决策和工具路由深度解析 | [18-配置层级权限决策和工具路由深度解析.md](study-material/18-配置层级权限决策和工具路由深度解析.md) |
| 19 | 文件编辑、命令执行和验证闭环深度解析 | [19-文件编辑命令执行和验证闭环深度解析.md](study-material/19-文件编辑命令执行和验证闭环深度解析.md) |
| 20 | MCP 协议、工具 Schema 和权限隔离深度解析 | [20-MCP协议工具Schema和权限隔离深度解析.md](study-material/20-MCP协议工具Schema和权限隔离深度解析.md) |
| 21 | Hooks 事件生命周期和自动化治理深度解析 | [21-Hooks事件生命周期和自动化治理深度解析.md](study-material/21-Hooks事件生命周期和自动化治理深度解析.md) |
| 22 | Skills、Subagents、插件和并行编排深度解析 | [22-SkillsSubagents插件和并行编排深度解析.md](study-material/22-SkillsSubagents插件和并行编排深度解析.md) |
| 23 | Agent SDK 平台化架构、评估和可观测性深度解析 | [23-AgentSDK平台化架构评估和可观测性深度解析.md](study-material/23-AgentSDK平台化架构评估和可观测性深度解析.md) |
| 24 | 团队落地案例库和排障剧本深度版 | [24-团队落地案例库和排障剧本深度版.md](study-material/24-团队落地案例库和排障剧本深度版.md) |

## 使用建议

- 入门学习：先读 00 到 03，建立 Claude Code 的工作模型、上下文模型和基本命令习惯。
- 工程实践：重点读 04、05、06、07、08、09，掌握权限、工具、扩展和并行工作。
- 深度进阶：重点读 16 到 24，理解 Agent 执行循环、上下文生命周期、权限决策、工具路由、MCP、Hooks、Subagents、SDK 和团队治理。
- 团队落地：重点读 10、11、12、15、23、24，把个人效率转成可治理的团队流程。
- 面试复习：先读 14 完整清单，再读 13 和 `study-material/面试知识点/`。
- 日常查用：遇到命令细节时优先执行 `claude --help`、`claude <command> --help`、会话内 `/help` 和 `claude doctor`，因为 Claude Code 版本变化较快。

## 参考资料

- Claude Code 官方文档首页：https://docs.claude.com/en/docs/claude-code/overview
- Claude Code CLI Reference：https://docs.claude.com/en/docs/claude-code/cli-reference
- Claude Code Settings：https://docs.claude.com/en/docs/claude-code/settings
- Claude Code Memory：https://docs.claude.com/en/docs/claude-code/memory
- Claude Code MCP：https://docs.claude.com/en/docs/claude-code/mcp
- Claude Code Hooks：https://docs.claude.com/en/docs/claude-code/hooks
- Claude Code Subagents：https://docs.claude.com/en/docs/claude-code/sub-agents
- Claude Code Skills：https://docs.claude.com/en/docs/claude-code/skills
- Claude Agent SDK：https://docs.claude.com/en/docs/claude-code/sdk
