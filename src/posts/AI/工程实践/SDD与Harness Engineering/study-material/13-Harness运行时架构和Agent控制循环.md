---
title: "SDD与Harness Engineering学习资料：Harness运行时架构和Agent控制循环"
date: 2026-06-20
description: "Harness 的深度不在“有一个 Agent 工具”，而在它能否稳定管理多步执行。一个真实 Agent 任务会经历上下文收集、计划、工具调用、结果观察、错误修正、验证、总结和交接。每一步都需要状态记录和控制策略。"
tags:
  - "AI"
  - "工程实践"
  - "SDD与Harness Engineering"
category: "AI"
---

# SDD与Harness Engineering学习资料：Harness运行时架构和Agent控制循环

[返回索引](../SDD与Harness Engineering学习资料.md)

## 学习目标

- 理解 Harness 的运行时架构。
- 掌握 Agent 控制循环、状态模型和中断恢复。
- 能设计一个可审计的 Agent 执行系统。

## 理论导读

Harness 的深度不在“有一个 Agent 工具”，而在它能否稳定管理多步执行。一个真实 Agent 任务会经历上下文收集、计划、工具调用、结果观察、错误修正、验证、总结和交接。每一步都需要状态记录和控制策略。

## 核心心智模型

```text
Harness = Policy + Context + Tools + Runtime + Verifiers + Observability
```

其中 Runtime 是核心：它决定 Agent 如何循环、何时停止、何时重试、何时转人工。

## 运行时架构

```text
            +------------------+
Spec Store  |                  |  Policy Store
----------> | Context Builder  | <----------
            +--------+---------+
                     |
                     v
            +------------------+
            | Agent Runtime    |
            | plan/act/observe |
            +---+----------+---+
                |          |
                v          v
          Tool Gateway   Verifier Runner
                |          |
                v          v
          Workspace     Test/Lint/Eval
                \          /
                 v        v
              Trace Store
                     |
                     v
              Review/Approval
```

## 状态模型

Agent 任务可以建模为状态机：

```text
CREATED
-> CONTEXT_LOADING
-> PLANNING
-> WAITING_APPROVAL
-> EXECUTING
-> VERIFYING
-> REPAIRING
-> SUMMARIZING
-> COMPLETED
```

异常状态：

```text
BLOCKED_BY_SPEC_CONFLICT
BLOCKED_BY_PERMISSION
FAILED_BY_VALIDATION
FAILED_BY_TOOL
ESCALATED_TO_HUMAN
ABORTED
```

状态机的价值是避免 Agent 无限循环或在未知状态下继续修改代码。

## Agent控制循环

典型循环：

```pseudo
task = load_task()
policy = load_policy(task)
context = build_context(task, policy)

while not done:
    observation = summarize_workspace()
    action = agent.decide(task, context, observation)

    if violates_policy(action):
        escalate_or_reject(action)
        continue

    result = tool_gateway.execute(action)
    trace.record(action, result)

    if action.type == "edit":
        verification = verifier.run_required_checks()
        trace.record(verification)

        if verification.failed:
            if retry_budget_exhausted():
                escalate_to_human()
                break
            context = add_failure_feedback(context, verification)
            continue

    if acceptance_criteria_met(task):
        done = true
```

## 关键控制点

### 1. 停止条件

停止条件必须外部定义：

- 所有强制验证通过。
- 所有规格验收标准被覆盖。
- 没有未审批高风险修改。
- Agent 输出变更摘要和残余风险。

### 2. 重试预算

重试需要预算：

| 场景 | 策略 |
| --- | --- |
| 同一个测试失败 1 次 | 允许修复 |
| 同一个测试失败 2 次 | 要求重新分析根因 |
| 同一个测试失败 3 次 | 转人工 |
| 权限被拒绝 | 不允许绕过，转审批 |
| 规格冲突 | 不允许继续执行 |

### 3. 工具网关

Tool Gateway 不只是转发调用，还要做：

- 参数校验。
- 权限校验。
- 敏感信息脱敏。
- 输出摘要。
- 速率限制。
- 审计记录。
- 错误归类。

## 深度例子

Agent 想运行：

```text
Remove-Item -Recurse *
```

不合格 Harness：靠 prompt 说“不要删除文件”。

合格 Harness：

- Tool Gateway 识别危险删除。
- Policy 判断超出允许范围。
- Runtime 把任务转入 `BLOCKED_BY_PERMISSION`。
- Trace 记录被拒绝操作。
- Review 提示用户是否允许特定路径删除。

## 练习

设计一个 Agent Runtime 状态机，覆盖：

- 正常完成。
- 测试失败后修复。
- 规格冲突。
- 权限审批。
- 工具故障。
- 人工接管。

## 验收

- 能画出 Harness 运行时架构。
- 能写出 Agent 控制循环。
- 能说明停止条件、重试预算和审批点。

## 重点

Harness 的核心是控制循环。没有状态和控制点，Agent 只是一个会调用工具的聊天模型。

## 难点

难点是让 Agent 有足够自由完成任务，同时在关键风险点被 Runtime 拦截。

## 易错

> **易错：** 失败后无限让 Agent 自修。
>
> 正确做法：失败重试必须有预算、分类和转人工条件。

