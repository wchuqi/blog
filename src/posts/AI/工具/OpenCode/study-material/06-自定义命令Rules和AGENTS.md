---
title: "OpenCode 学习资料：自定义命令、Rules 和 AGENTS.md"
date: 2026-06-20
description: "自定义命令把常见 prompt 变成稳定入口。相比每次临时输入，自定义命令更可复用、可审查、可版本管理。命令可以使用参数、引用文件、注入 shell 命令输出，也可以指定 Agent 和模型。"
tags:
  - "AI"
  - "工具"
  - "OpenCode"
category: "AI"
---

# OpenCode 学习资料：自定义命令、Rules 和 AGENTS.md

[返回索引](../OpenCode学习资料.md)

## 学习目标

- 会使用 `.opencode/commands/` 固化重复任务。
- 理解命令参数、shell 输出和文件引用。
- 会把团队规则写进 `AGENTS.md` 和项目配置。

## 理论导读

自定义命令把常见 prompt 变成稳定入口。相比每次临时输入，自定义命令更可复用、可审查、可版本管理。命令可以使用参数、引用文件、注入 shell 命令输出，也可以指定 Agent 和模型。

`AGENTS.md` 负责项目级长期规则，命令负责具体任务模板。两者配合，才能把 OpenCode 从个人聊天工具变成团队工程流程。

## 命令文件结构

```text
.opencode/
  commands/
    test.md
    review-changes.md
    create-component.md
```

示例：

```markdown
---
description: Review recent code changes
agent: plan
---

Review the current changes.

Use:
- `git diff --stat`
- `git diff`

Focus on:
- correctness
- missing tests
- security risks
- backward compatibility

Return findings first, ordered by severity.
```

## 参数和文件引用

```markdown
---
description: Create a React component
agent: build
---

Create a new component named $1 under $2.

Requirements:
- TypeScript
- tests
- match existing style

Reference: @src/components/Button.tsx
```

调用：

```text
/create-component UserCard src/components
```

## Shell 输出注入

命令模板可以把 shell 命令输出注入 prompt。这个能力很强，也很危险，因为命令会在项目根目录运行。

```markdown
---
description: Analyze test failures
agent: plan
---

Here is the test output:

!`pnpm test`

Explain failing tests and propose minimal fixes.
Do not modify files.
```

> **易错：** 在命令里注入 `cat .env`、部署命令或大范围文件输出。正确做法：只注入必要、可审计、低风险的命令。

## Rules 和 AGENTS.md 的边界

| 内容 | 放哪里 | 原因 |
| --- | --- | --- |
| 项目结构说明 | `AGENTS.md` | 所有任务都需要 |
| 常用验证命令 | `AGENTS.md` | 长期稳定规则 |
| 单次审查模板 | `.opencode/commands/` | 可重复触发 |
| 代码风格约束 | `AGENTS.md` 或 Rules | 持续生效 |
| 危险命令限制 | `opencode.jsonc` 的 `permission` | 需要强制执行 |

## 推荐命令清单

- `/review-changes`：审查当前 diff。
- `/test-failures`：分析失败测试。
- `/add-unit-tests`：为指定文件补测试。
- `/explain-module`：解释模块职责和调用链。
- `/migration-plan`：为数据库或框架升级制定计划。
- `/security-review`：安全风险审查，只读。

## 练习

为项目创建三个命令：

1. `review-changes.md`：审查当前 diff。
2. `test-failures.md`：读取测试输出并给修复方案。
3. `write-docs.md`：根据代码更新文档，但限制输出位置。

## 验收

- 能写出带 frontmatter 的命令文件。
- 能使用 `$ARGUMENTS`、`$1`、`@file` 和 shell 输出。
- 能判断哪些规则应放命令，哪些应放 `AGENTS.md`，哪些应放权限配置。

## 重点

- 自定义命令是团队复用 OpenCode 的主要方式。
- 命令必须和权限策略一起设计。

## 难点

- 命令越自动化，越要明确输入、输出、禁止事项和验收。
