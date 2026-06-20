---
title: "OpenCode 学习资料：MCP、自定义工具和插件扩展"
date: 2026-06-20
description: "OpenCode 可以通过 MCP 接入外部工具，通过自定义工具暴露项目能力，通过插件在事件上扩展行为。它们都能提高自动化程度，但也会扩大上下文、权限和攻击面。"
tags:
  - "AI"
  - "工具"
  - "OpenCode"
category: "AI"
---

# OpenCode 学习资料：MCP、自定义工具和插件扩展

[返回索引](../OpenCode学习资料.md)

## 学习目标

- 理解 MCP、自定义工具和插件分别解决什么问题。
- 会判断何时应该扩展 OpenCode，何时不该扩展。
- 掌握扩展带来的上下文、权限和供应链风险。

## 理论导读

OpenCode 可以通过 MCP 接入外部工具，通过自定义工具暴露项目能力，通过插件在事件上扩展行为。它们都能提高自动化程度，但也会扩大上下文、权限和攻击面。

不要因为“能接入”就接入。扩展应该服务于稳定、重复、可验证的工程流程。

## 三类扩展对比

| 扩展 | 解决问题 | 适合场景 | 主要风险 |
| --- | --- | --- | --- |
| MCP server | 接入外部系统或标准工具 | GitHub、Sentry、文档检索、数据库元数据 | token 消耗、外部权限、工具过多 |
| 自定义工具 | 给模型一个项目内函数 | 查询内部数据库、运行受控脚本、读取业务元数据 | 参数校验、越权执行 |
| 插件 | 挂钩 OpenCode 事件 | 日志、通知、保护 `.env`、注入环境变量 | 供应链、隐式行为、调试复杂 |

## MCP 配置示例

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp"],
      "enabled": true
    }
  },
  "permission": {
    "context7_*": "ask"
  }
}
```

> **重点：** MCP 工具会占用上下文。工具越多，模型越容易被无关工具描述干扰。

## 自定义工具示例

```ts
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Return the list of allowed test commands for this repository",
  args: {
    area: tool.schema.string().describe("Project area, such as api or web"),
  },
  async execute(args) {
    const commands: Record<string, string> = {
      api: "pnpm test:api",
      web: "pnpm test:web",
    }

    return commands[args.area] ?? "pnpm test"
  },
})
```

自定义工具文件可以放在：

- 项目级：`.opencode/tools/`
- 全局级：`~/.config/opencode/tools/`

## 插件使用示例

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "opencode-helicone-session",
    "@my-org/opencode-policy-plugin"
  ]
}
```

本地插件可放在：

- `.opencode/plugins/`
- `~/.config/opencode/plugins/`

## 扩展决策清单

接入前问：

- 这个能力是否频繁使用？
- 是否能用只读方式完成？
- 是否需要访问敏感系统？
- 是否会把大量无关工具暴露给模型？
- 是否能写权限规则和审计日志？
- 出错时是否容易回滚？

## 练习

设计一个“受控数据库查询工具”：

- 只允许 SELECT。
- 必须限制 schema。
- 必须限制返回行数。
- 禁止输出敏感字段。
- 所有调用写审计日志。

## 验收

- 能解释 MCP、自定义工具、插件的区别。
- 能写出一个 MCP 配置。
- 能说明自定义工具为什么需要参数校验。
- 能识别扩展带来的上下文和安全风险。

## 重点

- 扩展的价值在于封装稳定流程，而不是扩大模型自由度。
- 任何能访问外部系统的工具都要纳入权限、审计和密钥治理。

## 难点

- 工具描述本身会影响模型选择工具。描述要清楚、窄化、可验证。

## 易错

> **易错：** 一次性启用大量 MCP server。
>
> 正确做法：按任务启用最少工具，并评估上下文成本和权限风险。
