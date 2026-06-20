---
title: "SDD与Harness Engineering学习资料：验证体系、Evals和质量度量"
date: 2026-06-20
description: "没有度量，就无法判断 Harness 是否真的提高了工程质量。单次任务测试通过只能说明这次候选输出通过了某些检查，不能说明系统长期可靠。Evals 的作用是用一组代表性任务持续评估 Agent + Harness 的表现。"
tags:
  - "AI"
  - "工程实践"
  - "SDD与Harness Engineering"
category: "AI"
---

# SDD与Harness Engineering学习资料：验证体系、Evals和质量度量

[返回索引](../SDD与Harness Engineering学习资料.md)

## 学习目标

- 掌握 Harness 中验证体系的层次。
- 理解 Evals 如何评估 Agent 和 Harness。
- 能设计质量指标，判断改进是否有效。

## 理论导读

没有度量，就无法判断 Harness 是否真的提高了工程质量。单次任务测试通过只能说明这次候选输出通过了某些检查，不能说明系统长期可靠。Evals 的作用是用一组代表性任务持续评估 Agent + Harness 的表现。

## 核心心智模型

```text
Tests 验证一次变更。
Evals 验证一套 Agent 工作系统。
Metrics 观察长期趋势。
```

## 验证体系分层

| 层次 | 验证对象 | 例子 |
| --- | --- | --- |
| L1 语法和类型 | 代码是否可编译 | typecheck、compile |
| L2 单元行为 | 函数和类行为 | unit tests |
| L3 集成行为 | 模块协作 | integration tests |
| L4 业务契约 | 是否满足规格 | contract tests、BDD |
| L5 架构规则 | 是否破坏边界 | dependency checks |
| L6 安全合规 | 是否引入风险 | SAST、secret scan |
| L7 生产信号 | 是否影响运行 | logs、metrics、traces |
| L8 人工评审 | 是否符合业务和设计 | code review |

## Evals设计

### 1. Eval任务集

Eval 任务应覆盖：

- 简单功能新增。
- bug 修复。
- 边界条件补全。
- 跨模块修改。
- 高风险拒绝场景。
- 规格冲突场景。
- 测试失败修复场景。
- 不应修改范围测试。

示例：

```yaml
eval_id: order-cancel-idempotency
task: 修复订单重复取消导致重复退款
input:
  spec: specs/order-cancel.md
  failing_test: OrderCancelIdempotencyTest
expected:
  must_pass:
    - OrderCancelIdempotencyTest
  must_not_modify:
    - src/payment/GatewayClient.java
  must_explain:
    - idempotency_key_strategy
```

### 2. 评分维度

| 指标 | 含义 |
| --- | --- |
| task_success_rate | 任务完成率 |
| first_pass_rate | 首次通过率 |
| regression_rate | 引入回归比例 |
| scope_violation_rate | 越界修改比例 |
| approval_violation_rate | 违规绕过审批比例 |
| test_selection_accuracy | 测试选择是否准确 |
| context_precision | 给的上下文是否相关 |
| context_recall | 是否漏掉关键上下文 |
| mean_repair_attempts | 平均修复次数 |
| human_escalation_quality | 转人工是否及时且信息完整 |

### 3. 质量指标解读

指标要组合看：

- 成功率高但越界修改高：Harness 太宽。
- 成功率低但转人工多：规则可能太严或上下文不足。
- 首次通过低但最终通过高：Agent 能修，但验证反馈可能不清晰。
- 回归率高：测试选择或架构检查不足。
- 成本高：上下文过大、重试过多或任务粒度过大。

## 验证矩阵

把规格映射到验证：

| 规格 | 验证方式 | 自动化程度 | 失败处理 |
| --- | --- | --- | --- |
| 幂等 | 重复请求测试 | 自动 | Agent 修复，最多 2 次 |
| 权限 | 权限矩阵测试 | 自动 | 失败即阻塞 |
| 支付安全 | 人工评审 + 集成测试 | 半自动 | 必须审批 |
| P95 延迟 | 性能测试 | 自动或周期性 | 超阈值转性能分析 |
| 合规脱敏 | 日志扫描 | 自动 | 失败即阻塞 |

## 例子：Harness改进是否有效

问题：Agent 经常漏掉幂等测试。

改进：

- 在规格中标记 `idempotency: required`。
- Context Builder 必选幂等策略文档。
- Verifier Runner 对带幂等标记的任务自动运行幂等测试。

观察指标：

- `test_selection_accuracy` 是否提高。
- `regression_rate` 是否下降。
- `mean_repair_attempts` 是否下降。

## 练习

为一个“用户注册功能”设计 Eval 集，至少 6 个任务。每个任务要有：

- 输入规格。
- 预期行为。
- 禁止行为。
- 必跑测试。
- 评分指标。

## 验收

- 能区分测试、Eval 和指标。
- 能设计 Eval 任务集。
- 能用指标判断 Harness 改进是否有效。

## 重点

Evals 评估的是 Agent + Harness 的整体系统，不只是模型本身。

## 难点

难点是构造代表性任务。Eval 太简单会虚高，太脱离日常会没有指导价值。

## 易错

> **易错：** 只用任务成功率评价 Harness。
>
> 正确做法：同时看越界修改、回归、成本、转人工质量和风险拦截能力。

