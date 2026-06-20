---
title: "Codex学习资料"
date: 2026-06-20
description: "这是一份索引文件。详细内容按知识点拆分到 study-material/ 目录，适合系统学习、面试复习和团队落地参考。"
tags:
  - "AI"
  - "工具"
  - "Codex"
  - "学习资料总览"
category: "AI"
---

# Codex学习资料

这是一份索引文件。详细内容按知识点拆分到 `study-material/` 目录，适合系统学习、面试复习和团队落地参考。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | Codex产品形态和适用场景 | [01-Codex产品形态和适用场景.md](study-material/01-Codex产品形态和适用场景.md) |
| 2 | 上下文工程和任务提示词 | [02-上下文工程和任务提示词.md](study-material/02-上下文工程和任务提示词.md) |
| 3 | AGENTS.md仓库规范 | [03-AGENTS仓库规范.md](study-material/03-AGENTS仓库规范.md) |
| 4 | CLI工作流和配置 | [04-CLI工作流和配置.md](study-material/04-CLI工作流和配置.md) |
| 5 | IDE和Cloud工作流 | [05-IDE和Cloud工作流.md](study-material/05-IDE和Cloud工作流.md) |
| 6 | 权限沙箱和安全边界 | [06-权限沙箱和安全边界.md](study-material/06-权限沙箱和安全边界.md) |
| 7 | 代码修改测试和审查 | [07-代码修改测试和审查.md](study-material/07-代码修改测试和审查.md) |
| 8 | MCP工具和自动化集成 | [08-MCP工具和自动化集成.md](study-material/08-MCP工具和自动化集成.md) |
| 9 | 排障恢复和反模式 | [09-排障恢复和反模式.md](study-material/09-排障恢复和反模式.md) |
| 10 | 团队落地和生产实践 | [10-团队落地和生产实践.md](study-material/10-团队落地和生产实践.md) |
| 11 | 执行生命周期和上下文决策深度解析 | [11-执行生命周期和上下文决策深度解析.md](study-material/11-执行生命周期和上下文决策深度解析.md) |
| 12 | 配置权限沙箱审批和自动审查深度解析 | [12-配置权限沙箱审批和自动审查深度解析.md](study-material/12-配置权限沙箱审批和自动审查深度解析.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | 完整知识点清单 | [14-Codex完整知识点清单.md](study-material/14-Codex完整知识点清单.md) |
| 15 | 综合练习和验收 | [15-综合练习和验收.md](study-material/15-综合练习和验收.md) |
| 16 | MCP工具协议安全和集成深度解析 | [16-MCP工具协议安全和集成深度解析.md](study-material/16-MCP工具协议安全和集成深度解析.md) |
| 17 | 模型选择长上下文和成本治理深度解析 | [17-模型选择长上下文和成本治理深度解析.md](study-material/17-模型选择长上下文和成本治理深度解析.md) |
| 18 | 团队治理可观测性和审计深度解析 | [18-团队治理可观测性和审计深度解析.md](study-material/18-团队治理可观测性和审计深度解析.md) |
| 19 | 深度面试题和场景推演 | [19-深度面试题和场景推演.md](study-material/19-深度面试题和场景推演.md) |

## 使用建议

- 初学：按 00 到 07 顺序阅读，先学会安全地让 Codex 读代码、改代码、跑测试。
- 进阶：重点读 11、12、16、17、18，理解执行生命周期、配置优先级、安全模型、MCP 工具和治理审计。
- 工程落地：重点看 03、06、07、08、10、12、18、15，把规范写进仓库和团队流程。
- 面试复习：先读 14 的完整清单，再看 13、19 和 `面试知识点/` 下的分类问答。
- 排障参考：优先看 06 和 09，确认权限、沙箱、网络、上下文和验证链路。

## 主要官方资料

- OpenAI Codex 文档首页：https://developers.openai.com/codex
- Codex quickstart：https://developers.openai.com/codex/quickstart
- Codex CLI：https://developers.openai.com/codex/cli
- Codex Cloud：https://developers.openai.com/codex/cloud
- Codex configuration：https://developers.openai.com/codex/config
- Sandbox and approvals：https://developers.openai.com/codex/agent-approvals-security
- AGENTS.md：https://developers.openai.com/codex/agents.md
- Codex security：https://developers.openai.com/codex/security
- Codex MCP：https://developers.openai.com/codex/mcp
- Codex workflows：https://developers.openai.com/codex/workflows
- Codex models：https://developers.openai.com/codex/models

> **易错：** Codex 文档、CLI 参数和模型能力会持续变化。学习时应优先核对官方文档，而不是只记固定命令。
