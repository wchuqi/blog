---
title: "AI Agent学习资料：Agent控制平面和数据平面深度架构"
date: 2026-06-20
description: "很多 Agent demo 把模型调用、工具调用、状态更新和权限判断写在一个函数里。这种写法能跑通，但无法生产化：权限难审计，工具错误难复盘，状态无法恢复，评估无法回放。"
tags:
  - "AI"
  - "核心概念"
  - "AI Agent"
category: "AI"
---

# AI Agent学习资料：Agent控制平面和数据平面深度架构

[返回索引](../AI Agent学习资料.md)

## 学习目标

- 理解 Agent 系统为什么要区分控制平面和数据平面。
- 掌握 Agent Runtime、Policy Engine、Tool Router、State Store、Trace Store 的职责边界。
- 能设计一个可恢复、可审计、可治理的 Agent 运行时。

## 理论导读

很多 Agent demo 把模型调用、工具调用、状态更新和权限判断写在一个函数里。这种写法能跑通，但无法生产化：权限难审计，工具错误难复盘，状态无法恢复，评估无法回放。

生产级 Agent 应拆成两层：

- 控制平面：决定能不能做、下一步做什么、什么时候停、是否转人工。
- 数据平面：执行具体动作，如检索、调用 API、读写文件、发送消息。

## 核心心智模型

```text
控制平面像调度中心：管策略、状态、计划、验证、审批。
数据平面像执行队伍：查数据、调工具、写结果、返回观测。
```

## 架构图

```text
User Request
    |
    v
Agent Gateway
    |
    v
+---------------------- Control Plane ----------------------+
| Intent Parser -> Policy Engine -> Planner -> Runtime Loop |
|                    |              |          |             |
|                    v              v          v             |
|              State Store    Approval Gate   Verifier       |
+-------------------------+-------------------------------+-+
                          |
                          v
+---------------------- Data Plane -------------------------+
| Tool Router -> Tool Adapter -> External System / Sandbox  |
| Retriever   -> Vector DB / Search                         |
| Memory      -> Memory Store                               |
+----------------------------------------------------------+
                          |
                          v
                    Trace / Metrics
```

## 控制平面组件

| 组件 | 职责 | 不应该做 |
| --- | --- | --- |
| Agent Gateway | 鉴权、限流、租户识别 | 直接执行业务动作 |
| Intent Parser | 识别任务类型、风险、缺失参数 | 直接相信用户所有描述 |
| Planner | 拆解任务、生成候选路径 | 绕过策略执行 |
| Runtime Loop | 管理状态、重试、停止、恢复 | 无限循环 |
| Policy Engine | 权限、审批、风险规则 | 只靠 prompt |
| Verifier | 判断结果是否满足标准 | 只看模型自评 |
| Approval Gate | 人工确认高风险动作 | 把审批藏在模型内部 |

## 数据平面组件

| 组件 | 职责 | 风险 |
| --- | --- | --- |
| Tool Router | 分发工具调用、校验参数 | 工具过宽导致越权 |
| Tool Adapter | 适配外部 API | 错误码语义不一致 |
| Retriever | 检索文档和知识 | 上下文污染 |
| Memory Store | 保存任务和用户记忆 | 错误记忆长期污染 |
| Sandbox | 隔离代码、文件、命令 | 沙箱逃逸或权限过宽 |

## 状态模型

```text
RECEIVED
-> INTENT_PARSED
-> CONTEXT_READY
-> PLAN_READY
-> WAITING_APPROVAL
-> EXECUTING
-> VERIFYING
-> REPAIRING
-> COMPLETED
```

异常状态：

```text
BLOCKED_BY_POLICY
BLOCKED_BY_MISSING_CONTEXT
FAILED_BY_TOOL
FAILED_BY_VERIFICATION
ESCALATED_TO_HUMAN
ABORTED_BY_BUDGET
```

每个状态都应记录：

- 输入。
- 决策依据。
- 调用工具。
- 输出。
- 错误。
- 下一状态。

## 控制循环伪代码

```pseudo
state = create_task(user_request)

while true:
    if budget.exceeded(state):
        return abort("ABORTED_BY_BUDGET", state)

    context = context_builder.build(state)
    decision = model.decide(context, state)

    policy_result = policy_engine.check(decision, state)
    if policy_result.requires_approval:
        return wait_for_human(policy_result)
    if policy_result.denied:
        return block(policy_result)

    result = tool_router.execute(decision.action)
    state_store.append(state.task_id, decision, result)

    verification = verifier.check(state, result)
    if verification.success:
        return complete(state)

    if retry_budget.exhausted(state, verification.failure_type):
        return escalate_to_human(state, verification)

    state = repair_context(state, verification)
```

## 决策规则

| 场景 | 控制平面动作 |
| --- | --- |
| 用户目标缺参数 | 追问用户，不猜测 |
| 工具参数越权 | 拒绝并记录 |
| 工具失败一次 | 根据错误类型有限重试 |
| 同类错误重复 | 停止自动修复，转人工 |
| 高风险动作 | 进入审批状态 |
| 验证不足 | 不允许标记完成 |

## 例子

财务报销 Agent：

- 控制平面决定是否允许审批。
- 数据平面读取发票、查询预算、创建审批单。
- Policy Engine 规定超过 5000 元必须经理审批。
- Verifier 检查发票金额、税号、预算科目。

## 练习

为“代码修复 Agent”设计控制平面和数据平面。至少包含：

- 状态机。
- Tool Router。
- 沙箱。
- Policy Engine。
- Verifier。
- Trace Store。
- 转人工条件。

## 验收

- 能区分控制平面和数据平面。
- 能画出 Agent Runtime 架构。
- 能定义状态转移和异常状态。
- 能写出停止条件、预算和转人工规则。

## 重点

生产级 Agent 的可靠性主要来自控制平面，而不是模型单次输出质量。

## 难点

难点是职责边界。模型可以建议动作，但是否执行动作应由控制平面的策略和状态决定。

## 易错

> **易错：** 把所有控制逻辑写进 prompt。
>
> 正确做法：prompt 可以表达意图，但权限、状态、预算、验证必须由代码和系统策略执行。

