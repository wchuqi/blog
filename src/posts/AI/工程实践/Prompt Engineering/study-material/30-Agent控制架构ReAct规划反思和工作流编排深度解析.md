---
title: "Prompt Engineering 学习资料：Agent 控制架构、ReAct、规划、反思和工作流编排深度解析"
date: 2026-06-20
description: "自由 ReAct 让模型反复 Thought/Action/Observation。它直观，但生产风险大："
tags:
  - "AI"
  - "工程实践"
  - "Prompt Engineering"
  - "深度解析"
category: "AI"
---

# Prompt Engineering 学习资料：Agent 控制架构、ReAct、规划、反思和工作流编排深度解析

[返回索引](../Prompt Engineering学习资料.md)

## 学习目标

- 掌握 Agent 从自由 ReAct 到受控 workflow 的架构演进。
- 能设计 planner、executor、verifier、memory、tool router。
- 能解释反思、自检、人工确认和最大步数的工程价值。

## Agent 架构组件

| 组件 | 职责 |
| --- | --- |
| Planner | 把目标拆成步骤 |
| Router | 选择工具或子流程 |
| Executor | 执行工具调用或生成 |
| Observer | 接收工具结果 |
| Verifier | 校验步骤是否成功 |
| Memory | 保存状态和偏好 |
| Guardrail | 安全、权限、输出拦截 |
| Human gate | 高风险操作人工确认 |

## 自由 ReAct 的问题

自由 ReAct 让模型反复 Thought/Action/Observation。它直观，但生产风险大：

- 难预测步数。
- 容易循环。
- Thought 难审计。
- 容易被 Observation 注入。
- 工具权限难控制。

## 受控工作流

把 Agent 限制在状态机中：

```text
CLARIFY -> PLAN -> EXECUTE_STEP -> VERIFY_STEP -> NEXT_STEP -> FINAL
                         |               |
                         v               v
                    RECOVER/ASK_USER   HUMAN_REVIEW
```

Prompt 只负责当前状态允许的判断，而不是一次性决定全部行为。

## Planner 设计

Planner 输出不要太自由：

```json
{
  "plan": [
    {
      "step_id": "s1",
      "goal": "解析用户偏好",
      "allowed_tools": [],
      "success_criteria": "得到岗位、城市、年限"
    }
  ]
}
```

计划必须有成功标准，否则无法验证。

## Verifier 设计

Verifier 检查：

- 工具是否调用成功。
- 返回是否足够。
- 是否满足当前步骤成功标准。
- 是否出现安全风险。
- 是否需要用户确认。

## Reflection 的边界

反思可以帮助模型发现错误，但不能替代外部校验。

适合：

- 检查遗漏约束。
- 检查输出格式。
- 总结失败原因。

不适合：

- 权限判定。
- 数据库写入确认。
- 精确事实校验。

## Agent 观测指标

- 平均步数。
- 工具调用成功率。
- 循环终止次数。
- 人工确认率。
- 任务完成率。
- 高风险拦截率。
- 每任务成本。
- 每任务 P95 延迟。

## 练习

设计一个“自动整理学习资料 Agent”：

- Planner 输出 schema。
- 工具列表。
- 每个状态的允许动作。
- Verifier 规则。
- 最大步数。
- 失败恢复。

## 验收

- 能说出 Agent 架构组件。
- 能把 ReAct 改造成受控 workflow。
- 能设计 verifier 和 human gate。

## 难点

Agent 工程能力的关键不是让模型更自由，而是把自由度放在有校验、有权限、有停止条件的边界内。

