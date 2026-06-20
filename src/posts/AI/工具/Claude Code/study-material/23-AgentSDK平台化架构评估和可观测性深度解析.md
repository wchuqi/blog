---
title: "Claude Code 学习资料：Agent SDK 平台化架构、评估和可观测性深度解析"
date: 2026-06-20
description: "SDK 平台化不是把 CLI 命令包一层 HTTP。真正的平台化需要："
tags:
  - "AI"
  - "工具"
  - "Claude Code"
  - "深度解析"
category: "AI"
---

# Claude Code 学习资料：Agent SDK 平台化架构、评估和可观测性深度解析

[返回索引](../Claude Code学习资料.md)

## 学习目标

- 理解从个人 CLI 使用到 SDK 平台化的架构变化。
- 能设计 AI PR Reviewer、迁移助手、批量仓库分析等 Agent 应用。
- 能建立评估、审计、成本和可观测性体系。

## 理论导读

SDK 平台化不是把 CLI 命令包一层 HTTP。真正的平台化需要：

```text
任务入口 -> 上下文收集 -> 权限控制 -> Agent 执行 -> 工具调用 -> 结构化输出 -> 人工审批 -> 审计和评估
```

如果没有评估和审计，Agent 应用越自动化，风险越大。

## 平台架构

```text
Frontend / Bot / CI
  -> Task API
  -> Context Builder
  -> Policy Engine
  -> Agent Runtime
  -> Tool Layer / MCP
  -> Result Validator
  -> Human Review
  -> Audit Store / Metrics
```

### 1. Task API

负责接收任务，规范输入：

- repo。
- commit/PR/branch。
- task type。
- allowed tools。
- budget。
- output schema。

### 2. Context Builder

负责收集最小上下文：

- diff。
- 相关文件。
- CI 日志。
- Issue 背景。
- 项目规则。
- 历史类似问题。

不能把全仓库和所有日志直接塞给 Agent。

### 3. Policy Engine

负责权限：

- 文件范围。
- 命令范围。
- MCP 工具。
- 数据脱敏。
- 用户角色。
- 人工确认点。

### 4. Agent Runtime

负责模型调用、工具循环、超时、重试和停止条件。

### 5. Result Validator

校验输出：

- JSON schema 是否有效。
- 是否包含必填字段。
- 是否引用真实文件。
- 是否声称运行了未运行的测试。
- 是否包含敏感数据。

## 输出 Schema 设计

以 PR Review 为例：

```json
{
  "summary": "string",
  "findings": [
    {
      "severity": "critical|high|medium|low",
      "file": "string",
      "line": "number optional",
      "category": "bug|security|regression|test-gap",
      "evidence": "string",
      "recommendation": "string"
    }
  ],
  "tests_reviewed": ["string"],
  "limitations": ["string"]
}
```

## 评估体系

### 离线评估

构建历史样例：

- 真 bug PR。
- 安全漏洞 PR。
- 无问题 PR。
- 测试缺失 PR。
- 大型重构 PR。
- 误导性 diff。

指标：

- bug 发现率。
- 误报率。
- 严重度排序准确性。
- 引用准确率。
- 格式合规率。
- 平均成本和延迟。

### 在线评估

跟踪：

- 开发者采纳率。
- 被驳回率。
- review 周期变化。
- CI 失败率变化。
- 返工次数。
- 人工节省时间。
- 事故和误阻断。

> **重点：** 不能只用“生成了多少评论”衡量效果。高误报会消耗团队注意力。

## 可观测性

需要记录：

- task_id、repo、commit。
- 模型和版本。
- 输入摘要。
- 工具调用序列。
- 权限决策。
- 输出。
- 人工反馈。
- 成本、延迟、token。
- 错误和重试。

隐私原则：保存摘要和引用，不保存不必要源码、密钥或个人数据。

## 失败和降级

| 失败 | 降级策略 |
| --- | --- |
| 上下文收集失败 | 只输出无法审查和缺失项 |
| 工具超时 | 限制范围，返回部分结果 |
| 输出 schema 失败 | 自动修复一次，失败后人工处理 |
| 权限不足 | 请求授权或降级只读 |
| 成本超预算 | 停止并输出已完成分析 |

## 例子：AI PR Reviewer 最小架构

```text
输入：PR diff + changed files + CI result
上下文：只取 changed files 和直接依赖文件
权限：只读仓库和 CI，不允许写文件
输出：findings JSON
人工：开发者选择采纳、忽略、标记误报
评估：每周统计采纳率、误报率和高严重度命中率
```

## 练习

1. 为 AI PR Reviewer 设计 20 条离线评估样例。
2. 设计 Result Validator，检查输出是否引用真实文件。
3. 设计成本预算：每个 PR 最大调用次数、最大上下文、最大运行时间。

## 验收

- 能画出 SDK 平台化架构。
- 能设计输出 schema 和评估指标。
- 能说明审计和隐私如何处理。
- 能设计失败降级策略。

## 重点

- SDK 平台化必须有策略引擎、评估集和审计。
- 结构化输出是自动化系统的基础。
- 人工反馈是持续改进数据源。

## 易错

- **易错：** 用一次成功 demo 判断系统可上线。
  正确做法：用历史样例和在线反馈持续评估。
- **易错：** 保存完整输入输出方便排查。
  正确做法：按最小必要原则保存摘要、引用和审计字段。

