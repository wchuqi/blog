---
title: "SDD与Harness Engineering学习资料"
date: 2026-06-20
description: "这是一份关于 Specification-Driven Development 和 Harness Engineering 的学习资料。这里的 SDD 按当前 AI 辅助软件工程语境中的“规格驱动开发”理解，而不是安全开发生命周期、安全设计…"
tags:
  - "AI"
  - "工程实践"
  - "SDD与Harness Engineering"
  - "学习资料总览"
category: "AI"
---

# SDD与Harness Engineering学习资料

这是一份关于 `Specification-Driven Development` 和 `Harness Engineering` 的学习资料。这里的 SDD 按当前 AI 辅助软件工程语境中的“规格驱动开发”理解，而不是安全开发生命周期、安全设计文档或传统系统设计文档。

核心问题是：当 AI Agent 可以直接写代码时，工程师的主要价值会从“逐行实现”转向“定义意图、边界、上下文、工具、验证和反馈闭环”。SDD 负责把意图变成可审查的规格，Harness Engineering 负责把 Agent 放进可控、可观测、可验证的工程环境。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [study-material/00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | SDD开发模式 | [study-material/01-SDD开发模式.md](study-material/01-SDD开发模式.md) |
| 2 | 规格文档层次和工作流 | [study-material/02-规格文档层次和工作流.md](study-material/02-规格文档层次和工作流.md) |
| 3 | Harness Engineering基础 | [study-material/03-Harness Engineering基础.md](study-material/03-Harness Engineering基础.md) |
| 4 | Agent运行时上下文工具和权限 | [study-material/04-Agent运行时上下文工具和权限.md](study-material/04-Agent运行时上下文工具和权限.md) |
| 5 | 验证反馈和可观测性 | [study-material/05-验证反馈和可观测性.md](study-material/05-验证反馈和可观测性.md) |
| 6 | SDD到Harness的落地流程 | [study-material/06-SDD到Harness的落地流程.md](study-material/06-SDD到Harness的落地流程.md) |
| 7 | 团队治理安全和风险 | [study-material/07-团队治理安全和风险.md](study-material/07-团队治理安全和风险.md) |
| 8 | 综合练习项目 | [study-material/08-综合练习项目.md](study-material/08-综合练习项目.md) |
| 9 | 完整知识点清单 | [study-material/09-SDD与Harness Engineering完整知识点清单.md](study-material/09-SDD与Harness Engineering完整知识点清单.md) |
| 10 | 面试知识点整理 | [study-material/10-面试知识点整理.md](study-material/10-面试知识点整理.md) |
| 11 | SDD深度机制：规格正确性和可执行契约 | [study-material/11-SDD深度机制规格正确性和可执行契约.md](study-material/11-SDD深度机制规格正确性和可执行契约.md) |
| 12 | 规格解析、冲突消解和版本治理 | [study-material/12-规格解析冲突消解和版本治理.md](study-material/12-规格解析冲突消解和版本治理.md) |
| 13 | Harness运行时架构和Agent控制循环 | [study-material/13-Harness运行时架构和Agent控制循环.md](study-material/13-Harness运行时架构和Agent控制循环.md) |
| 14 | 上下文检索选择和工具调度算法 | [study-material/14-上下文检索选择和工具调度算法.md](study-material/14-上下文检索选择和工具调度算法.md) |
| 15 | 验证体系、Evals和质量度量 | [study-material/15-验证体系Evals和质量度量.md](study-material/15-验证体系Evals和质量度量.md) |
| 16 | 故障推演和深度排障案例 | [study-material/16-故障推演和深度排障案例.md](study-material/16-故障推演和深度排障案例.md) |
| 17 | 组织落地成熟度和平台化架构 | [study-material/17-组织落地成熟度和平台化架构.md](study-material/17-组织落地成熟度和平台化架构.md) |

## 使用建议

- 想快速理解概念：读 `00`、`01`、`03`。
- 想落地到团队流程：读 `02`、`04`、`05`、`06`、`07`。
- 想深入机制和架构设计：读 `11` 到 `17`。
- 想准备面试：读 `10-面试知识点整理.md` 和 `面试知识点/` 目录。
- 想做作品集：完成 `08-综合练习项目.md`，产出一个小型 Agent Harness 设计文档。

## 参考资料

- GitHub Spec Kit: <https://github.github.com/spec-kit/>
- GitHub spec-kit 仓库: <https://github.com/github/spec-kit>
- Kiro Specs 文档: <https://kiro.dev/docs/specs/>
- Kiro Spec Correctness: <https://kiro.dev/docs/specs/correctness/>
- OpenAI Harness Engineering: <https://openai.com/index/harness-engineering>
- Thoughtworks AI Coding Sensors: <https://www.thoughtworks.com/insights/blog/generative-ai/harness-engineering-agent-feedback-exploring-ai-coding-sensors>
