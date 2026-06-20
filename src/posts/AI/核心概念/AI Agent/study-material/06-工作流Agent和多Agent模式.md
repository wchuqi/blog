---
title: "AI Agent学习资料：工作流Agent和多Agent模式"
date: 2026-06-20
description: "很多可靠的 AI 系统不是完全自主 Agent，而是 workflow 和 Agent 的混合。固定步骤用 workflow，更稳定、更便宜；不确定决策交给 Agent，更灵活。多 Agent 则是把不同职责分给多个模型角色或执行器。"
tags:
  - "AI"
  - "核心概念"
  - "AI Agent"
category: "AI"
---

# AI Agent学习资料：工作流Agent和多Agent模式

[返回索引](../AI Agent学习资料.md)

## 学习目标

- 区分 workflow、agentic workflow 和 multi-agent。
- 掌握常见多 Agent 架构模式。
- 能判断什么时候需要多 Agent。

## 理论导读

很多可靠的 AI 系统不是完全自主 Agent，而是 workflow 和 Agent 的混合。固定步骤用 workflow，更稳定、更便宜；不确定决策交给 Agent，更灵活。多 Agent 则是把不同职责分给多个模型角色或执行器。

## 模式对比

| 模式 | 特征 | 适用 |
| --- | --- | --- |
| 固定工作流 | 步骤固定 | 文档摘要、格式转换 |
| Agentic workflow | 某些步骤由模型决策 | 客服分流、代码审查 |
| 单 Agent | 一个 Agent 控制任务 | 简单工具任务 |
| 多 Agent | 多角色协作 | 复杂研究、软件开发 |

## 常见多Agent模式

### 1. Supervisor-Worker

Supervisor 负责分配任务和检查结果，Worker 负责执行。

适合：任务可拆分、需要统一控制。

风险：Supervisor 判断错误会影响全局。

### 2. Planner-Executor

Planner 生成计划，Executor 执行计划。

适合：长任务和需要计划审查的任务。

风险：计划过时，需要动态重规划。

### 3. Critic / Reviewer

一个 Agent 生成，另一个 Agent 审查。

适合：写作、代码、推理结果审查。

风险：Critic 也可能错，不能替代真实验证。

### 4. Blackboard

多个 Agent 共享一个工作区或黑板，逐步补充结果。

适合：研究、头脑风暴、复杂分析。

风险：状态冲突和责任不清。

### 5. Debate

多个 Agent 提出不同观点，再由裁判选择。

适合：开放问题分析。

风险：成本高，可能制造表面多样性。

## 拆分Agent的原则

只有满足以下条件才考虑多 Agent：

- 任务天然有不同专业角色。
- 不同角色需要不同工具权限。
- 可以独立验证每个角色的产出。
- 拆分后降低复杂度或风险。
- 协作成本低于收益。

## 例子

软件开发多 Agent：

```text
Requirement Agent: 澄清需求和规格
Implementation Agent: 修改代码
Test Agent: 生成和运行测试
Review Agent: 检查风险和总结
Supervisor: 控制流程和权限
```

## 练习

为“市场调研报告生成系统”设计多 Agent 架构：

- Research Agent。
- Data Agent。
- Writing Agent。
- Review Agent。
- Supervisor。

写出每个 Agent 的输入、输出、工具和验收标准。

## 验收

- 能区分 workflow 和 Agent。
- 能列出常见多 Agent 模式。
- 能说明多 Agent 的收益和成本。

## 重点

多 Agent 的目标是降低复杂度、隔离权限、提高可验证性，不是增加角色感。

## 难点

难点是协调。多 Agent 会带来状态同步、责任边界、冲突解决和成本问题。

## 易错

> **易错：** 把一个任务拆成很多虚拟角色，以为这样更智能。
>
> 正确做法：只有当角色有明确职责、工具权限和验证方式时才拆分。

