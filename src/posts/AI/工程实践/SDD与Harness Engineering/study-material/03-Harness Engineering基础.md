---
title: "SDD与Harness Engineering学习资料：Harness Engineering基础"
date: 2026-06-20
description: "Harness Engineering 是围绕 AI Agent 构建工程化运行外壳的实践。这个外壳包括上下文装配、工具权限、沙箱、工作流、测试、检查器、反馈、日志、恢复和治理。它的目标是让 Agent 的行为从“看运气的生成”变成“可控的…"
tags:
  - "AI"
  - "工程实践"
  - "SDD与Harness Engineering"
category: "AI"
---

# SDD与Harness Engineering学习资料：Harness Engineering基础

[返回索引](../SDD与Harness Engineering学习资料.md)

## 学习目标

- 理解 Harness Engineering 的定义和边界。
- 能说清楚它与 prompt engineering、context engineering、Agent engineering 的区别。
- 能识别一个 Agent Harness 的核心组件。

## 理论导读

Harness Engineering 是围绕 AI Agent 构建工程化运行外壳的实践。这个外壳包括上下文装配、工具权限、沙箱、工作流、测试、检查器、反馈、日志、恢复和治理。它的目标是让 Agent 的行为从“看运气的生成”变成“可控的工程过程”。

它不是传统测试 harness 的简单改名。传统测试 harness 主要帮助运行测试和替代依赖；AI Agent Harness 要管理的是一个能观察、推理、调用工具、修改代码并持续运行的执行主体。

## 核心心智模型

```text
Agent = Model + Harness + Environment
```

- Model：推理和生成能力。
- Harness：约束、工具、流程、验证、观测。
- Environment：代码库、依赖、数据、服务、组织规则。

模型决定上限的一部分，Harness 决定结果能否稳定落地。

## 知识点详解

### 1. Harness 的核心组件

| 组件 | 作用 | 例子 |
| --- | --- | --- |
| 上下文装配 | 给 Agent 正确材料 | 规格、相关代码、历史 PR |
| 工具接口 | 让 Agent 能行动 | 文件编辑、测试、搜索、浏览器 |
| 权限模型 | 限制可做事项 | 禁止删除生产配置 |
| 工作流 | 定义执行顺序 | 先读规格，再计划，再实现，再测试 |
| 验证器 | 判断结果是否合格 | 单测、lint、类型检查、架构检查 |
| 观测系统 | 记录过程和失败 | trajectory、日志、命令输出摘要 |
| 恢复机制 | 失败后可继续 | checkpoint、回滚、重试策略 |
| 治理规则 | 团队级约束 | 审批、审计、成本限制、安全策略 |

### 2. 与相关概念对比

| 概念 | 关注点 | 局限 |
| --- | --- | --- |
| Prompt Engineering | 如何写好单次指令 | 难处理长任务和复杂环境 |
| Context Engineering | 给模型什么上下文 | 不一定控制工具、权限和验证 |
| Agent Engineering | 设计 Agent 能力和流程 | 范围更宽，Harness 是其中的运行外壳 |
| Platform Engineering | 给开发者提供平台 | Harness 可作为 AI Agent 的平台层 |
| DevOps | 交付、运行和反馈 | Harness 借鉴其自动化和观测思想 |

### 3. Harness 为什么会兴起

AI 编码 Agent 的失败通常不是“不会写代码”这么简单，而是：

- 不知道项目真实架构。
- 看不到关键业务规则。
- 修改范围失控。
- 测试不完整。
- 遇到失败后盲目重试。
- 忘记历史决策。
- 无法判断任务是否真正完成。

Harness Engineering 正是把这些问题转化为工程设施。

## 例子

一个最小 Agent Harness：

```text
输入：
- feature spec
- 相关源码路径
- 测试命令
- 禁止修改路径

流程：
1. Agent 总结规格。
2. Agent 列出计划。
3. Agent 编辑文件。
4. Harness 自动运行测试。
5. 失败则把错误摘要反馈给 Agent。
6. 成功后生成变更摘要和风险点。

输出：
- patch
- 测试结果
- 规格覆盖说明
- 未解决风险
```

## 练习

为一个 Java 后端项目设计最小 Harness。要求写出：

- Agent 可以读取哪些目录。
- Agent 可以修改哪些目录。
- 必须运行哪些测试。
- 失败时重试几次。
- 哪些情况必须转人工。

## 验收

- 能画出 Agent Harness 的组件图。
- 能区分“提示词问题”和“Harness 问题”。
- 能为一个仓库写出最小可用 Harness 规则。

## 重点

Harness Engineering 的本质是把不可靠的自由生成，转化为带约束、带验证、带观测的工程执行。

## 难点

难点是权衡自由度和安全性。约束太少，Agent 会漂移；约束太多，Agent 无法完成复杂任务。

## 易错

> **易错：** 把 Harness 理解成一个工具或一个平台名字。
>
> 正确做法：把 Harness 理解成一组工程实践，可以由现成工具、脚本、CI、规则文件、权限系统和人工评审共同组成。

