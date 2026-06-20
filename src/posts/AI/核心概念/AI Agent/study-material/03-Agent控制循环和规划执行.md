---
title: "AI Agent学习资料：Agent控制循环和规划执行"
date: 2026-06-20
description: "Agent 的核心是循环：观察当前状态，决定下一步动作，调用工具，观察结果，更新状态，再决定是否继续。这个循环让 Agent 能处理不确定任务，但也带来风险：无限循环、错误工具调用、目标漂移、成本失控。"
tags:
  - "AI"
  - "核心概念"
  - "AI Agent"
category: "AI"
---

# AI Agent学习资料：Agent控制循环和规划执行

[返回索引](../AI Agent学习资料.md)

## 学习目标

- 掌握 Agent 的核心控制循环。
- 理解 ReAct、Plan-and-Execute 和反思修复。
- 能设计停止条件、重试预算和失败处理。

## 理论导读

Agent 的核心是循环：观察当前状态，决定下一步动作，调用工具，观察结果，更新状态，再决定是否继续。这个循环让 Agent 能处理不确定任务，但也带来风险：无限循环、错误工具调用、目标漂移、成本失控。

## 基本控制循环

```pseudo
state = initialize(task)

while not done:
    context = build_context(state)
    action = model.decide(context)

    if policy.reject(action):
        return escalate(action)

    result = tool.execute(action)
    state = update_state(state, action, result)

    evaluation = evaluate(state)
    if evaluation.success:
        return final_answer(state)

    if retry_budget_exhausted(state):
        return escalate(state)
```

## ReAct模式

ReAct = Reasoning + Acting。模型交替进行推理和动作：

```text
Thought: 我需要知道订单状态。
Action: get_order(order_id)
Observation: 订单已发货。
Thought: 已发货不能普通退款，需要售后流程。
Action: create_after_sales_ticket(order_id)
```

优点：适合工具交互和逐步推理。

风险：如果没有外部控制，Thought 可能幻觉，Action 可能越权。

## Plan-and-Execute模式

先生成计划，再执行：

```text
Plan:
1. 查询订单。
2. 查询退款规则。
3. 判断是否可退款。
4. 需要时创建工单。
```

优点：适合长任务、需要审查计划的任务。

风险：计划可能过时，执行中需要重新规划。

## 停止条件

Agent 必须有外部停止条件：

- 达成验收标准。
- 工具返回明确结果。
- 用户已确认。
- 达到重试上限。
- 遇到权限或安全阻塞。
- 成本或时间超限。

## 重试策略

| 失败 | 策略 |
| --- | --- |
| 工具临时失败 | 有限重试，指数退避 |
| 参数错误 | 让 Agent 修正一次 |
| 权限不足 | 不重试，转审批 |
| 规格冲突 | 停止，转人工 |
| 同一失败重复出现 | 总结根因，转人工 |

## 例子

数据分析 Agent：

```text
用户：分析本月销售下降原因。
1. 读取销售数据。
2. 读取渠道数据。
3. 检查是否有缺失值。
4. 计算同比环比。
5. 找出下降贡献最大的品类。
6. 生成图表。
7. 输出结论和证据。
```

## 练习

为“代码修复 Agent”写控制循环，必须包含：

- 读取问题描述。
- 搜索相关文件。
- 生成计划。
- 修改代码。
- 运行测试。
- 失败修复。
- 达到上限转人工。

## 验收

- 能写出 Agent loop。
- 能区分 ReAct 和 Plan-and-Execute。
- 能设计停止条件和重试策略。

## 重点

Agent 的自由度必须由控制循环管理。没有停止条件和重试预算，Agent 可能无限消耗成本。

## 难点

难点是动态重规划。执行中发现新信息后，Agent 需要更新计划，但不能借此无限扩大范围。

## 易错

> **易错：** 让 Agent 自己判断所有停止条件。
>
> 正确做法：关键停止条件由系统、测试、权限和用户确认控制。

