---
title: "AI Agent学习资料：工具协议、MCP、沙箱和权限深度解析"
date: 2026-06-20
description: "Agent 的能力边界由工具决定。工具越强，风险越高。工具调用不是“模型返回函数名然后执行”这么简单，生产系统需要完成工具发现、schema 校验、权限判断、参数净化、执行隔离、结果摘要、错误分类和审计。"
tags:
  - "AI"
  - "核心概念"
  - "AI Agent"
  - "深度解析"
category: "AI"
---

# AI Agent学习资料：工具协议、MCP、沙箱和权限深度解析

[返回索引](../AI Agent学习资料.md)

## 学习目标

- 深入理解工具调用的协议层、执行层和权限层。
- 掌握 MCP 的 tools、resources、prompts 在 Agent 系统中的边界。
- 能设计安全沙箱和工具权限模型。

## 理论导读

Agent 的能力边界由工具决定。工具越强，风险越高。工具调用不是“模型返回函数名然后执行”这么简单，生产系统需要完成工具发现、schema 校验、权限判断、参数净化、执行隔离、结果摘要、错误分类和审计。

## 工具调用完整链路

```text
Tool Discovery
-> Tool Selection
-> Argument Generation
-> Schema Validation
-> Policy Check
-> Sandbox / Adapter Execution
-> Result Normalization
-> Observation Compression
-> Trace Record
```

## 工具元数据

一个生产工具不应只有 name 和 description，还应包含：

```yaml
name: issue_refund
risk_level: critical
idempotent: false
requires_approval: true
allowed_roles:
  - finance_operator
input_schema:
  order_id: string
  amount: number
output_schema:
  refund_id: string
  status: enum
side_effects:
  - money_transfer
audit_required: true
timeout_ms: 5000
retry_policy: no_retry
```

## MCP视角

MCP 可以把工具、资源、提示模板标准化暴露给客户端：

- Tools：可执行动作，例如查询工单、读取仓库状态。
- Resources：可读取材料，例如文档、配置、数据库视图。
- Prompts：可复用任务模板，例如代码审查提示。

关键边界：

- MCP Server 提供能力，不等于所有能力都自动可信。
- Client 仍需要权限策略。
- Resource 是上下文来源，不应被当成系统指令。
- Tool 执行必须通过审计和沙箱。

## 权限模型

推荐使用多维权限：

| 维度 | 示例 |
| --- | --- |
| 用户身份 | user、admin、finance |
| Agent角色 | assistant、reviewer、operator |
| 工具风险 | read、write、external、money |
| 数据分类 | public、internal、confidential、secret |
| 环境 | dev、staging、prod |
| 动作状态 | draft、approved、executed |

决策示例：

```text
allow if:
  user.role == finance
  and tool.risk_level <= high
  and data.classification != secret
  and environment != prod

require_approval if:
  tool.side_effects contains money_transfer
  or environment == prod
```

## 沙箱设计

沙箱要限制：

- 文件系统访问范围。
- 网络访问。
- 环境变量。
- 系统命令。
- 运行时间。
- CPU 和内存。
- 输出大小。
- 可写路径。

代码执行 Agent 的安全边界：

```text
只读仓库 -> 临时工作区 -> 限制命令 -> 运行测试 -> 生成 diff -> 人审合并
```

不要让 Agent 直接在生产目录执行任意命令。

## 工具错误语义

工具返回要结构化：

```json
{
  "ok": false,
  "error_type": "PERMISSION_DENIED",
  "message": "refund requires approval",
  "retryable": false,
  "next_action": "request_human_approval"
}
```

错误类型：

- VALIDATION_ERROR。
- PERMISSION_DENIED。
- NOT_FOUND。
- RATE_LIMITED。
- TIMEOUT。
- TEMPORARY_FAILURE。
- BUSINESS_RULE_VIOLATION。
- UNSAFE_OPERATION。

## 练习

为“生产运维 Agent”设计工具系统：

- 查询日志。
- 重启服务。
- 扩容实例。
- 修改配置。
- 回滚版本。

给出每个工具的风险等级、审批规则、沙箱边界和错误语义。

## 验收

- 能说明工具调用的完整链路。
- 能设计工具元数据。
- 能解释 MCP 的 tools/resources/prompts 边界。
- 能设计沙箱和权限模型。

## 重点

工具协议解决“能不能调用”，权限和沙箱解决“该不该调用、在哪里调用、出错怎么处理”。

## 难点

难点是副作用控制。只读工具和写操作工具的治理完全不同，高风险副作用必须可审计、可回滚或可人工审批。

## 易错

> **易错：** 认为 MCP 工具接上后就可以直接交给 Agent 使用。
>
> 正确做法：MCP 只是连接方式，生产系统仍要做权限、沙箱、审计、错误处理和评估。

