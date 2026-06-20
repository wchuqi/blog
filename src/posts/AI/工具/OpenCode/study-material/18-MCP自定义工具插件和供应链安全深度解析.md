---
title: "OpenCode 学习资料：MCP、自定义工具、插件和供应链安全深度解析"
date: 2026-06-20
description: "扩展能力让 OpenCode 从“代码仓库 Agent”变成“工程平台 Agent”。它可以接 issue、错误监控、数据库、文档系统、云平台、内部脚本。但能力边界越大，治理要求越高。"
tags:
  - "AI"
  - "工具"
  - "OpenCode"
  - "深度解析"
category: "AI"
---

# OpenCode 学习资料：MCP、自定义工具、插件和供应链安全深度解析

[返回索引](../OpenCode学习资料.md)

## 学习目标

- 深入理解 OpenCode 扩展体系的边界。
- 能设计安全的 MCP、自定义工具和插件接入方案。
- 能识别供应链、权限、密钥和上下文风险。

## 理论导读

扩展能力让 OpenCode 从“代码仓库 Agent”变成“工程平台 Agent”。它可以接 issue、错误监控、数据库、文档系统、云平台、内部脚本。但能力边界越大，治理要求越高。

扩展安全的核心原则：

```text
最小工具
最小权限
最小数据
可审计
可回滚
可禁用
```

## MCP 风险模型

| 风险 | 描述 | 控制方式 |
| --- | --- | --- |
| 工具过多 | 增加 token 和选择错误 | 按任务启用 |
| 外部写入 | 创建 issue、触发 CI、改云资源 | 默认 ask/deny |
| 数据泄露 | 把内部数据放进上下文 | 字段过滤、行数限制 |
| OAuth 权限过宽 | 凭据可访问过多资源 | 最小 scope |
| 远程服务不可信 | 工具返回恶意内容 | 内容当数据，不当指令 |
| 版本漂移 | MCP server 升级改变行为 | 固定版本和变更审查 |

## 自定义工具设计原则

自定义工具应像后端 API 一样设计：

- 参数 schema 明确。
- 输入校验严格。
- 权限检查前置。
- 输出最小化。
- 错误可解释。
- 调用可审计。
- 默认只读。

## 自定义工具反例

```ts
export default tool({
  description: "Run any internal script",
  args: {
    command: tool.schema.string()
  },
  async execute(args) {
    return await exec(args.command)
  }
})
```

问题：

- 等价于开放 shell。
- 没有 allowlist。
- 没有审计。
- 没有限制输出。
- 容易泄露密钥。

## 自定义工具正例

```ts
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Return database schema metadata for approved tables only",
  args: {
    table: tool.schema.string().describe("Approved table name")
  },
  async execute(args) {
    const allowed = new Set(["users", "orders", "products"])
    if (!allowed.has(args.table)) {
      return "Denied: table is not approved for AI access"
    }

    return getSchemaSummary(args.table, {
      includeSensitiveColumns: false,
      maxColumns: 80
    })
  }
})
```

## 插件安全

插件可能在生命周期事件中运行，风险比普通命令更隐蔽。它可能：

- 读取环境变量。
- 修改请求。
- 注入上下文。
- 记录日志。
- 发网络请求。
- 新增工具。

插件接入规则：

- 只使用可信来源。
- 固定版本。
- 审查源码或供应商。
- 记录启用原因。
- 在非生产仓库先验证。
- 明确能读取什么、发送什么。

## 扩展评审模板

```markdown
## OpenCode Extension Review

- Extension:
- Type: MCP / custom tool / plugin
- Owner:
- Purpose:
- Data accessed:
- Write actions:
- Credentials required:
- Permission rules:
- Audit logging:
- Version pinning:
- Disable plan:
- Residual risk:
```

## 生产接入建议

### 只读优先

先接入只读工具，如文档检索、schema 摘要、错误日志摘要。写操作必须单独审批。

### 输出过滤

工具输出不应直接返回原始数据库行、完整日志或密钥字段，应返回摘要、计数、脱敏字段和定位信息。

### 凭据隔离

不要共用开发者个人高权限 token。为 OpenCode 扩展创建专用低权限凭据。

### 审计闭环

记录谁在什么会话中调用了什么工具、参数是什么、返回摘要是什么、是否触发外部写入。

## 练习

设计一个 Sentry MCP 或内部错误平台工具：

- 只允许读取某项目最近 24 小时错误摘要。
- 输出最多 20 条。
- 隐藏用户邮箱、token、请求体。
- 不允许关闭 issue。
- 记录每次调用。

## 验收

- 能区分 MCP、自定义工具和插件的风险边界。
- 能写出扩展评审模板。
- 能识别等价开放 shell 的危险工具。
- 能为外部系统写权限和审计策略。

## 重点

- 扩展越强，越要像生产系统一样治理。
- 工具输出是上下文输入，也可能是攻击输入。

## 难点

- 很多安全问题不在模型，而在你给模型接了过宽的工具。

## 易错

> **易错：** 把 MCP 当成“越多越智能”的插件商店。
>
> 正确做法：按任务启用最少工具，并对每个工具做权限、数据和审计评审。
