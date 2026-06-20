---
title: "AI Context Engineering 学习资料：Agent 控制流、状态机和上下文恢复深度解析"
date: 2026-06-20
description: "Agent 的失败常表现为循环、重复调用工具、忘记目标、忽略用户约束、错误恢复失败。这些问题通常不是“模型不够聪明”，而是控制流和状态设计不清晰。深度 Context Engineering 会把 Agent 任务变成显式状态机，而不是无限…"
tags:
  - "AI"
  - "工程实践"
  - "AI Context Engineering"
  - "深度解析"
category: "AI"
---

# AI Context Engineering 学习资料：Agent 控制流、状态机和上下文恢复深度解析

[返回索引](../AI Context Engineering学习资料.md)

## 学习目标

- 深入理解 Agent 的控制流和上下文生命周期。
- 能设计状态机、checkpoint、恢复和人工接管。
- 能减少 Agent 重复、跑偏和遗忘。

## 理论导读

Agent 的失败常表现为循环、重复调用工具、忘记目标、忽略用户约束、错误恢复失败。这些问题通常不是“模型不够聪明”，而是控制流和状态设计不清晰。深度 Context Engineering 会把 Agent 任务变成显式状态机，而不是无限自由对话。

## 状态机模型

```text
INIT -> PLAN -> ACT -> OBSERVE -> UPDATE -> DECIDE
                         |             |
                         v             v
                      ERROR        NEED_CONFIRM
                         |             |
                         v             v
                      RECOVER       WAIT_USER
```

每个状态应定义：

- 输入上下文。
- 允许动作。
- 退出条件。
- 错误处理。
- 需要记录的状态。

## checkpoint 内容

```json
{
  "task_id": "ctx-eng-study",
  "phase": "write_deep_dive",
  "goal": "深化 AI Context Engineering 学习资料",
  "constraints": ["中文", "分文件", "深入机制"],
  "completed_files": ["15", "16", "17"],
  "pending_files": ["18", "19", "20"],
  "last_verified": "markdown links ok",
  "risk": "索引和实际文件可能不一致"
}
```

## 上下文恢复

恢复时不要注入完整历史，而应注入：

- 当前目标。
- 硬约束。
- 已完成动作。
- 当前状态。
- 最近失败或阻塞。
- 下一步计划。
- 必要证据。

## 防循环机制

| 问题 | 机制 |
| --- | --- |
| 重复调用同一工具 | 记录 recent_actions 和参数 |
| 计划过期 | 每轮检查 goal 和 constraints |
| 工具失败重试过多 | retry budget |
| 模型跑题 | 状态机限制允许动作 |
| 无法完成 | 明确 blocked 条件 |

## 人工接管

需要人工确认的情况：

- 高风险工具。
- 目标不明确。
- 上下文冲突无法自动解决。
- 多次失败重试。
- 涉及隐私、金钱、发送、删除、发布。

## 练习

为一个“自动修复代码并提交 PR”的 Agent 设计状态机，说明每个状态的上下文、工具、退出条件和人工确认点。

## 验收

- 能画出 Agent 状态机。
- 能设计 checkpoint。
- 能解释如何从中断中恢复。
- 能防止重复工具调用和无限循环。

## 重点

Agent 的上下文不是聊天历史，而是可执行状态。状态机越清晰，模型越不容易在长任务中失控。

## 难点

难点是自由度和稳定性的平衡。完全自由的 Agent 灵活但难控，完全固定的流程稳定但适应性差。

## 易错

> **易错：** 让模型自己在每轮决定所有流程。
>
> 正确做法：用程序状态机限制阶段、动作和恢复路径，让模型在受控范围内做判断。

