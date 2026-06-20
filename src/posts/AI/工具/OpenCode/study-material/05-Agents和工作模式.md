---
title: "OpenCode 学习资料：Agents 和工作模式"
date: 2026-06-20
description: "Agent 是 OpenCode 中的“角色 + 模型 + 权限 + 工作模式”组合。不同 Agent 不只是名字不同，而是风险等级和任务边界不同。"
tags:
  - "AI"
  - "工具"
  - "OpenCode"
category: "AI"
---

# OpenCode 学习资料：Agents 和工作模式

[返回索引](../OpenCode学习资料.md)

## 学习目标

- 理解 primary agent 和 subagent 的区别。
- 掌握 Build、Plan、General、Explore、Scout 的适用场景。
- 会设计自定义 Agent 的提示词、模型和权限。

## 理论导读

Agent 是 OpenCode 中的“角色 + 模型 + 权限 + 工作模式”组合。不同 Agent 不只是名字不同，而是风险等级和任务边界不同。

官方内置的 primary agent 包括 Build 和 Plan。Build 适合实际开发，Plan 适合只分析和制定方案。内置 subagent 包括 General、Explore 和 Scout，分别偏通用执行、只读代码探索和外部依赖研究。

## Agent 类型

| 类型 | 交互方式 | 典型用途 |
| --- | --- | --- |
| Primary agent | 你直接对话，可切换 | 主任务推进 |
| Subagent | 被主 Agent 调用，也可 `@` 提及 | 专项研究、并行探索 |
| Hidden system agent | 系统自动使用 | 标题、摘要、上下文压缩 |

## 内置 Agent

| Agent | 模式 | 适合场景 | 风险 |
| --- | --- | --- | --- |
| Build | primary | 开发、修改、执行命令 | 改动风险最高 |
| Plan | primary | 分析、设计、评审 | 方向错误但不直接改文件 |
| General | subagent | 多步骤通用任务 | 可能修改文件 |
| Explore | subagent | 只读搜索和代码理解 | 风险较低 |
| Scout | subagent | 外部文档和依赖源码研究 | 上下文膨胀、依赖不准 |

## 自定义 Agent 示例

```markdown
---
description: Review code changes for security risks
mode: subagent
model: anthropic/claude-sonnet-4-5
permission:
  read: allow
  grep: allow
  glob: allow
  bash:
    "git diff*": allow
  edit: deny
---

You are a security review agent.

Focus on:
- authentication and authorization
- secrets and token handling
- unsafe shell or file operations
- data deletion and privacy risks

Return findings with file paths, severity, risk, and suggested fix.
```

## 设计原则

- 给 Agent 明确职责，不要创建“万能高级 Agent”。
- 给只读 Agent 拒绝 `edit`，避免误改。
- 给审计 Agent 允许 `git diff`，不允许部署和写文件。
- 给文档 Agent 限定输出位置，避免污染代码目录。
- 高温度适合创意，低温度适合审查和修复。

## 使用场景

### 代码探索

```text
@explore 请找出订单状态从创建到完成的所有状态流转代码。
只输出文件、函数和调用关系。
```

### 安全审查

```text
@security-auditor 请审查当前 diff。
重点关注鉴权绕过、敏感信息泄露和危险命令。
```

### 文档维护

```text
@docs 请根据当前实现更新 API 文档。
只允许修改 docs/api.md。
```

## 练习

创建两个自定义 Agent：

- `docs`：只能读代码和改 `docs/**`。
- `security-auditor`：只能读文件和看 git diff，禁止写入。

## 验收

- 能区分 primary agent 和 subagent。
- 能为不同任务选择 Build、Plan、Explore 或 Scout。
- 能写出至少一个自定义 Agent frontmatter。
- 能解释 Agent 权限和全局权限的关系。

## 重点

- Agent 是把“角色提示词”和“工具权限”绑定在一起。
- 自定义 Agent 的价值在于稳定复用团队流程。

## 难点

- 子 Agent 并行探索会增加上下文和成本。必须要求它输出结构化、可合并的结果。

## 易错

> **易错：** 给安全审查 Agent 写了审查提示词，却仍允许它改文件。
>
> 正确做法：审查 Agent 默认只读，修复由 Build 在人工确认后执行。
