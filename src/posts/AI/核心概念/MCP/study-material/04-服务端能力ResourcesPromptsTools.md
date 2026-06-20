---
title: "MCP 学习资料：服务端能力：Resources、Prompts、Tools"
date: 2026-06-20
description: "MCP server 的核心工作是把外部系统能力转换成模型和 host 可理解的协议能力。Resources、Prompts、Tools 分别对应“可读上下文”“可复用任务模板”“可执行动作”。三者要分清，否则系统会变得危险或难用。"
tags:
  - "AI"
  - "核心概念"
  - "MCP"
category: "AI"
---

# MCP 学习资料：服务端能力：Resources、Prompts、Tools

[返回索引](../MCP学习资料.md)

## 学习目标

- 掌握 MCP server 提供的三类核心能力。
- 能正确选择 resource、prompt 和 tool 的建模方式。
- 能设计能力列表、参数、输出和权限边界。

## 理论导读

MCP server 的核心工作是把外部系统能力转换成模型和 host 可理解的协议能力。Resources、Prompts、Tools 分别对应“可读上下文”“可复用任务模板”“可执行动作”。三者要分清，否则系统会变得危险或难用。

一个成熟的 server 往往同时提供三类能力。例如数据库 server 可以把 schema 作为 resource，把 SQL 优化指导作为 prompt，把受控查询作为 tool。这样 host 和模型既能获取上下文，也能执行动作，还能复用任务模板。

## 核心心智模型

```text
Resource = 给模型看的资料
Prompt   = 给模型用的任务模板
Tool     = 让系统做的动作
```

## 知识点详解

### 1. Resources

Resources 表示可读取内容，通常通过 URI 标识。

适合：

- 文件内容。
- 文档页面。
- 数据库 schema。
- 配置项。
- 日志片段。
- 代码索引结果。

设计要点：

- URI 稳定：例如 `repo://file/src/index.ts`。
- 内容大小受控：避免一次返回过大上下文。
- 支持模板：例如 `candidate://{id}/profile`。
- 权限绑定：只返回当前用户有权访问的资源。

### 2. Prompts

Prompts 是 server 提供的可复用提示模板。它不是工具执行，而是帮助 host 或用户组织任务。

适合：

- “解释这段 SQL 的执行计划”。
- “根据候选人简历生成面试问题”。
- “总结工单处理历史”。
- “生成发布说明”。

Prompt 应该声明参数，例如：

```json
{
  "name": "generate_interview_questions",
  "description": "根据候选人资料和岗位要求生成面试问题",
  "arguments": [
    {
      "name": "candidate_id",
      "description": "候选人 ID",
      "required": true
    },
    {
      "name": "job_id",
      "description": "岗位 ID",
      "required": true
    }
  ]
}
```

### 3. Tools

Tools 是可执行动作。它们要用严格 Schema 描述输入，并返回模型可读和机器可读结果。

适合：

- 查询候选人。
- 创建面试安排。
- 更新工单状态。
- 运行测试。
- 检索知识库。

不适合：

- 没有权限边界的任意 SQL 执行。
- 任意 shell 命令。
- 无确认的删除、转账、发布、扩容。
- 用一个万能工具隐藏所有操作。

### 4. 三者选择规则

| 问题 | 选择 |
| --- | --- |
| 只是读取上下文？ | Resource |
| 是可复用任务模板？ | Prompt |
| 会调用外部系统或产生动作？ | Tool |
| 读取内容需要动态搜索？ | Tool 或 Resource template，取决于是否执行查询逻辑 |
| 高危写操作？ | Tool，但必须确认、权限和审计 |

### 5. 能力变化通知

Server 的 tool、resource、prompt 列表可能变化，例如用户登录后权限不同、工作区文件变化、插件启停。能力变化应通过协议通知 host，让 host 刷新列表。

> **重点：** 能力列表不是静态文档，它是运行时可发现、可变化、可治理的接口。

## 例子

招聘系统 MCP server 能力设计：

```text
Resources:
  ats://candidate/{candidate_id}/profile
  ats://job/{job_id}/description
  ats://schema/applications

Prompts:
  summarize_candidate_match(candidate_id, job_id)
  generate_interview_questions(candidate_id, job_id)

Tools:
  search_candidates(keyword, city, skills)
  create_interview(candidate_id, job_id, interviewer_id, start_time)
  update_application_status(application_id, status, reason)
```

高危等级：

| Tool | 风险 | 控制 |
| --- | --- | --- |
| `search_candidates` | 低到中 | 权限过滤、脱敏 |
| `create_interview` | 中 | 用户确认、日历冲突检查 |
| `update_application_status` | 高 | 二次确认、状态机校验、审计 |

## 练习

1. 为“数据库助手”设计 5 个 resources、3 个 prompts、4 个 tools。
2. 把一个万能 `execute_action` 工具拆成 5 个语义明确的工具。
3. 为一个有副作用工具写出输入参数、权限、确认和审计字段。

## 验收

- 能准确区分 resource、prompt、tool。
- 能设计工具粒度和权限边界。
- 能解释能力变化通知的价值。
- 能避免万能工具和无边界工具。

## 重点

- Resource 是上下文，Prompt 是任务模板，Tool 是动作。
- Tool 设计必须包含 Schema、权限、错误和审计。
- 能力发现让 host 可以动态理解 server 能做什么。

## 难点

- 搜索类能力可能既像 resource 又像 tool，要看是否执行查询逻辑和是否有副作用。
- Prompt 可能引用 resource，也可能引导 tool 使用，必须防止提示注入。

## 易错

> **易错：** 为了让模型更自由，暴露一个“执行任意命令”的工具。
>
> 正确做法：工具应该是业务语义明确、参数受限、权限可控的最小动作。

