---
title: "MCP 学习资料：工具调用决策、Schema 约束和权限执行深度解析"
date: 2026-06-20
description: "很多人把 MCP tool call 理解成“模型选工具，server 执行”。这个理解太浅。真实链路至少包括：server 声明工具、host 策略过滤、模型基于名称/描述/Schema 选择、host 可能要求用户确认、server 二…"
tags:
  - "AI"
  - "核心概念"
  - "MCP"
  - "深度解析"
category: "AI"
---

# MCP 学习资料：工具调用决策、Schema 约束和权限执行深度解析

[返回索引](../MCP学习资料.md)

## 学习目标

- 理解一次 MCP tool call 从发现到结果注入的完整链路。
- 掌握工具描述、Schema、annotations、host 策略和 server 校验的责任边界。
- 能解释为什么工具注解不是安全边界。

## 理论导读

很多人把 MCP tool call 理解成“模型选工具，server 执行”。这个理解太浅。真实链路至少包括：server 声明工具、host 策略过滤、模型基于名称/描述/Schema 选择、host 可能要求用户确认、server 二次校验、外部系统执行、结果返回并注入后续上下文。

任何一层偷懒，都会让工具误用风险扩大。

## 核心心智模型

```text
tools/list
  -> host policy filter
  -> model tool selection
  -> argument generation
  -> host validation/confirmation
  -> server validation/authorization
  -> external execution
  -> structured result
  -> context injection
  -> possible next tool
```

## 知识点详解

### 1. 工具发现不是授权

Server 返回工具列表，不表示当前用户一定可以调用所有工具。Host 和 server 都可以根据用户、租户、资源、环境和风险等级过滤。

例子：

```text
delete_repository
  owner 用户可见
  普通开发者不可见或不可调用
```

更安全的策略是“能不用就不暴露”，而不是暴露后再拒绝。

### 2. 描述影响模型决策

模型通常根据工具 name、description、inputSchema 判断是否调用。描述不清会造成误用。

危险描述：

```text
update_status: Update status.
```

更好描述：

```text
update_application_status:
Change a candidate application status within the allowed hiring state machine.
This tool has side effects and may notify hiring team members.
Use only after the user explicitly asks to change status.
```

> **重点：** Tool description 是模型行为接口，也应纳入版本评审。

### 3. Schema 是语法约束，不是业务授权

Schema 能限制参数形状，但不能证明用户有权限，也不能保证业务状态合法。

Schema 能做：

- 类型、长度、范围。
- 枚举值。
- 必填字段。
- 禁止额外字段。

Schema 不能做：

- 判断用户是否能操作该候选人。
- 判断状态流转是否合法。
- 判断是否满足审批条件。
- 判断资源是否属于当前租户。

这些必须由 server 和外部系统做。

### 4. Tool annotations 的边界

工具注解可帮助 host 和模型理解工具性质，例如：

- 是否只读。
- 是否有破坏性。
- 是否幂等。
- 是否访问外部开放世界。

但 annotations 只是声明或提示，不是强制安全边界。恶意或错误 server 可以谎称 destructive=false。Host 不能只信 annotations，应结合注册信息、安全评审和策略配置。

> **易错：** 看到 `readOnly` 注解就跳过权限检查。
>
> 正确做法：annotations 用于 UX 和策略辅助，真正安全由权限、网关、server 校验和审计保证。

### 5. 参数生成和用户确认

模型生成参数后，host 应对高危工具做确认。确认页面应展示：

- 工具名称。
- 真实业务动作。
- 关键参数。
- 影响范围。
- 是否可回滚。
- 当前用户身份。
- 审计记录。

确认不能只问“是否继续”。要让用户知道继续什么。

### 6. Server 二次校验

Server 必须重新校验：

- 参数 Schema。
- 用户权限。
- 租户和资源归属。
- 状态机。
- 幂等键。
- 速率限制。
- 业务前置条件。

不能因为 host 已确认就跳过 server 校验。Host 是用户界面和策略入口，server 是外部系统边界。

### 7. 结果注入和后续风险

工具返回结果会进入模型上下文，影响后续工具调用。结果中如果包含外部系统文本，也可能带提示注入。

防护：

- 标记工具结果来源。
- 对外部文本做不可信数据隔离。
- 不让工具结果覆盖系统指令。
- 对后续高危工具仍做确认和校验。

## 例子

高危工具完整链路：

```text
Tool: update_application_status
Risk: high
Annotation: destructiveHint=true

Flow:
1. Host 根据用户角色决定是否暴露。
2. Model 生成 application_id、target_status、reason。
3. Host 展示确认：候选人、原状态、新状态、通知影响。
4. Server 校验用户是否属于该招聘团队。
5. Server 校验状态机是否允许。
6. Server 调用 ATS。
7. Server 返回 structuredContent。
8. Audit 记录全链路。
```

## 练习

1. 为一个 `delete_file` 工具写完整决策链路。
2. 设计一个工具 annotation 被谎报时的防护策略。
3. 把一个过宽 Schema 改成严格 Schema。
4. 设计一个工具结果提示注入防护方案。

## 验收

- 能从工具发现讲到结果注入。
- 能解释 Schema、annotations、host policy、server auth 的边界。
- 能设计高危工具确认页面。

## 重点

- 工具调用是多层决策链，不是模型直接执行。
- Annotations 是提示，不是安全边界。
- Server 永远要做最终业务校验。

## 难点

- 工具结果也会污染后续上下文。
- 工具描述变化可能改变模型行为，属于兼容性风险。

## 易错

> **易错：** 认为工具只要 Schema 严格就安全。
>
> 正确做法：Schema 只管参数形状，权限、状态机、租户和高危确认必须另做。

