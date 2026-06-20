---
title: "MCP 学习资料：实现、调试和 MCP Inspector"
date: 2026-06-20
description: "实现 MCP server 的重点不是把一个函数暴露出去，而是把协议生命周期、能力声明、Schema 校验、错误处理、权限和日志串起来。最小 demo 可以很短，但生产 server 必须把边界补齐。"
tags:
  - "AI"
  - "核心概念"
  - "MCP"
category: "AI"
---

# MCP 学习资料：实现、调试和 MCP Inspector

[返回索引](../MCP学习资料.md)

## 学习目标

- 理解实现 MCP server 的基本步骤。
- 能用 SDK 或手写协议实现最小 tools/resources server。
- 掌握调试、日志、Inspector、测试和故障排查思路。

## 理论导读

实现 MCP server 的重点不是把一个函数暴露出去，而是把协议生命周期、能力声明、Schema 校验、错误处理、权限和日志串起来。最小 demo 可以很短，但生产 server 必须把边界补齐。

## 核心心智模型

```text
定义能力 -> 注册 handler -> 校验参数 -> 执行业务 -> 返回结构化结果
         -> 记录审计 -> 处理错误/超时/取消
```

## 知识点详解

### 1. 实现步骤

1. 选择 SDK 或手写 JSON-RPC。
2. 定义 server 名称和版本。
3. 声明 capabilities。
4. 注册 resources、prompts、tools。
5. 实现输入校验和权限检查。
6. 接入外部系统。
7. 返回 content 和 structuredContent。
8. 增加日志、审计、超时和取消。
9. 使用 Inspector 或 host 测试。

### 2. 最小工具伪代码

```ts
registerTool({
  name: "search_candidates",
  description: "Search candidates by skill and city.",
  inputSchema: {
    type: "object",
    properties: {
      skill: { type: "string", minLength: 1, maxLength: 50 },
      city: { type: "string", maxLength: 50 },
      limit: { type: "integer", minimum: 1, maximum: 20 }
    },
    required: ["skill"],
    additionalProperties: false
  },
  handler: async (args, context) => {
    await authorize(context.user, "candidate:read");
    const rows = await searchCandidates(args);
    return {
      content: [{ type: "text", text: `Found ${rows.length} candidates.` }],
      structuredContent: { candidates: rows }
    };
  }
});
```

### 3. MCP Inspector

MCP Inspector 用于调试 server 能力：

- 查看初始化和能力协商。
- 列出 tools/resources/prompts。
- 手动调用工具。
- 检查输入 Schema。
- 查看返回结果和错误。

调试时关注：

- server 是否正常启动。
- 初始化是否成功。
- 能力是否按预期声明。
- Schema 是否过宽或过窄。
- 工具结果是否结构化。
- 错误是否可理解。

### 4. 常见故障

| 现象 | 可能原因 | 排查 |
| --- | --- | --- |
| server 启动后无响应 | stdout 输出日志污染协议、进程崩溃 | 日志写 stderr，检查启动命令 |
| tools/list 为空 | capabilities 未声明或工具未注册 | 看初始化返回 |
| 工具参数总错 | Schema 和描述不清 | 用 Inspector 手动调用 |
| 远程调用 401/403 | 授权配置错误 | 查 token、scope、audience |
| 重试导致重复创建 | 缺少幂等键 | 加 idempotency key |
| 模型误用工具 | 描述含糊、工具粒度过宽 | 改名、拆工具、加风险说明 |

### 5. 测试策略

测试层次：

- Schema 单元测试。
- handler 单元测试。
- 协议集成测试。
- 权限测试。
- 提示注入红队测试。
- 高危工具确认测试。
- 兼容性测试。

## 例子

测试用例表：

| 用例 | 输入 | 预期 |
| --- | --- | --- |
| 正常搜索 | skill=PostgreSQL | 返回候选人列表 |
| limit 超限 | limit=1000 | 参数错误 |
| 无权限 | user 无 candidate:read | 权限拒绝 |
| 注入文本 | skill 包含恶意提示 | 只作为普通查询条件处理 |
| 外部系统超时 | ATS 超时 | 返回可重试错误 |

## 练习

1. 实现一个 `echo` MCP tool，再给它加 Schema 校验。
2. 为一个工具写 5 个单元测试和 3 个权限测试。
3. 用 Inspector 手动调用工具，并记录初始化和调用消息。

## 验收

- 能说明 MCP server 的最小实现步骤。
- 能定位 stdio 日志污染协议的问题。
- 能用 Inspector 验证工具列表和调用结果。
- 能写出基础测试矩阵。

## 重点

- Demo 能跑不等于生产可用。
- stdout/stdin 是协议通道，本地日志要避免污染。
- 调试要覆盖协议、Schema、权限和业务结果。

## 难点

- 工具描述影响模型选择，传统单元测试很难覆盖。
- 远程 MCP 的认证、会话和重试问题需要集成测试。

## 易错

> **易错：** 只测试 handler 函数，不测试 MCP 协议层。
>
> 正确做法：至少做一次端到端测试：initialize、tools/list、tools/call、错误返回。

