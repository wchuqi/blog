---
title: "AI Agent学习资料：Evals观测和可追踪性"
date: 2026-06-20
description: "Agent 评估比普通模型评估更复杂，因为它不仅生成文本，还会调用工具、改变状态、产生中间决策。评估必须覆盖结果是否正确、工具是否选对、过程是否安全、成本是否可控、失败是否可恢复。"
tags:
  - "AI"
  - "核心概念"
  - "AI Agent"
category: "AI"
---

# AI Agent学习资料：Evals观测和可追踪性

[返回索引](../AI Agent学习资料.md)

## 学习目标

- 理解如何评估 Agent 系统。
- 掌握 trace、trajectory、任务评估、回归集和在线监控。
- 能设计 Agent 质量指标。

## 理论导读

Agent 评估比普通模型评估更复杂，因为它不仅生成文本，还会调用工具、改变状态、产生中间决策。评估必须覆盖结果是否正确、工具是否选对、过程是否安全、成本是否可控、失败是否可恢复。

## 观测对象

- 用户请求。
- 构造的上下文。
- 模型输入和输出。
- 工具调用。
- 工具参数。
- 工具返回。
- 状态变更。
- 安全拦截。
- 人工审批。
- 最终结果。

## Trace字段

```json
{
  "task_id": "task-001",
  "goal": "查询订单并判断能否退款",
  "model": "model-name",
  "tools_called": ["get_order", "get_refund_policy"],
  "tool_errors": [],
  "risk_level": "medium",
  "human_approval": false,
  "final_status": "completed"
}
```

## Eval类型

| 类型 | 评估内容 |
| --- | --- |
| 结果评估 | 最终答案是否正确 |
| 过程评估 | 工具选择和步骤是否合理 |
| 安全评估 | 是否越权或泄露 |
| 鲁棒性评估 | 错误输入和工具失败下表现 |
| 回归评估 | 新版本是否破坏旧能力 |
| 成本评估 | token、时间、工具调用次数 |

## 关键指标

- 任务成功率。
- 首次成功率。
- 工具调用准确率。
- 越权调用率。
- 人工介入率。
- 误拒率和误放率。
- 平均任务耗时。
- 平均 token 成本。
- 回归率。
- 用户纠错率。

## 例子

客服 Agent Eval：

```yaml
case_id: refund-shipped-order
input: "我的订单已经发货了，帮我退款"
expected:
  must_call:
    - get_order
    - get_refund_policy
  must_not_call:
    - issue_refund
  final:
    - 告知用户需要走售后流程
    - 不直接退款
```

## 练习

为“代码修复 Agent”设计 8 个 Eval cases，覆盖：

- 简单 bug。
- 测试失败。
- 权限禁止。
- 规格冲突。
- 无关重构。
- 依赖新增。
- 安全问题。
- 人工介入。

## 验收

- 能设计 Agent trace。
- 能区分结果评估和过程评估。
- 能设计回归评估集。
- 能解释误拒和误放。

## 重点

Agent 评估必须评估过程。最终答案正确但越权调用工具，仍然是不合格。

## 难点

难点是标注标准。很多 Agent 任务没有唯一答案，因此需要 rubric 和风险分级。

## 易错

> **易错：** 只看最终回复是否正确。
>
> 正确做法：同时检查工具、权限、状态、成本和安全。

