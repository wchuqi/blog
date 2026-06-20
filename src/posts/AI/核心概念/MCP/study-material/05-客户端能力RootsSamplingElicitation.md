---
title: "MCP 学习资料：客户端能力：Roots、Sampling、Elicitation"
date: 2026-06-20
description: "MCP 是双向协议。Server 不只能被调用，也可以请求 client/host 提供能力。这个设计让 server 更灵活，例如了解允许访问的工作区根目录、请求 host 调用模型、或让 host 向用户询问缺失信息。但这也引入了新的安…"
tags:
  - "AI"
  - "核心概念"
  - "MCP"
category: "AI"
---

# MCP 学习资料：客户端能力：Roots、Sampling、Elicitation

[返回索引](../MCP学习资料.md)

## 学习目标

- 理解 MCP 为什么不只是 server 向 client 提供能力。
- 掌握 Roots、Sampling、Elicitation 的用途和风险。
- 能设计 server 请求客户端能力时的审批和边界。

## 理论导读

MCP 是双向协议。Server 不只能被调用，也可以请求 client/host 提供能力。这个设计让 server 更灵活，例如了解允许访问的工作区根目录、请求 host 调用模型、或让 host 向用户询问缺失信息。但这也引入了新的安全边界：server 不能绕过 host 直接访问用户隐私、直接调用模型或诱导用户输入敏感信息。

## 核心心智模型

```text
Server 提供外部能力
Client/Host 提供受控环境能力

Roots       -> 允许访问哪里
Sampling    -> 是否允许 server 请求模型生成
Elicitation -> 是否允许 server 请求用户补充信息
```

## 知识点详解

### 1. Roots

Roots 表示 host 允许 server 看到的根范围。常见于文件系统、代码仓库、项目工作区。

用途：

- 告诉 server 当前工作区目录。
- 限制文件读取范围。
- 在工作区变化时通知 server。

示例：

```json
{
  "roots": [
    {
      "uri": "file:///D:/workspace/job_search",
      "name": "job_search"
    }
  ]
}
```

设计原则：

- 只暴露必要根目录。
- server 不能越过 root 访问父目录。
- root 变化要刷新缓存和权限。
- symlink、路径规范化和大小写差异要特别处理。

> **易错：** 只做字符串前缀判断路径，可能被 `../`、符号链接或路径编码绕过。

### 2. Sampling

Sampling 允许 server 请求 host 代为调用模型。它的用途是让 server 在不直接持有模型凭据的情况下完成某些智能任务。

适合：

- server 需要总结资源内容。
- server 需要从用户提供文本中提取结构化信息。
- server 需要生成候选操作建议，但最终仍由 host 控制。

风险：

- server 可能构造恶意提示，诱导模型泄露上下文。
- server 可能消耗大量模型成本。
- server 可能绕过 host 的提示策略。
- server 可能把敏感资源送入模型。

控制：

- Host 审核 sampling 请求。
- 限制输入上下文和 token 预算。
- 记录调用来源、目的和成本。
- 禁止 server 请求访问无关上下文。

### 3. Elicitation

Elicitation 允许 server 请求 host 向用户询问缺失信息。它适合交互式工具流程。

例子：

- 部署工具询问目标环境。
- 创建日历事件前确认时间。
- 删除资源前要求用户输入确认理由。

风险：

- server 诱导用户输入密码、token 或隐私信息。
- 问题措辞误导用户同意高危操作。
- 多轮询问造成审批疲劳。

控制：

- Host 对问题进行展示和风险标注。
- 禁止 elicitation 请求敏感凭据。
- 高危动作使用明确确认，不使用模糊提问。
- 记录用户响应和后续 tool call 之间的关联。

### 4. 客户端能力声明

Client 在初始化时声明能力。Server 不能假定所有 host 都支持 roots、sampling 或 elicitation。

```json
{
  "capabilities": {
    "roots": {
      "listChanged": true
    },
    "sampling": {},
    "elicitation": {}
  }
}
```

如果 client 没有声明某能力，server 要降级：

- 没有 roots：要求用户手动配置允许路径，或拒绝文件访问。
- 没有 sampling：只返回原始数据，不生成模型摘要。
- 没有 elicitation：返回需要用户补充参数的错误。

## 例子

部署工具调用前的交互：

```text
1. Server 收到 deploy_service 工具调用，缺少 environment。
2. Server 发起 elicitation/create，请 host 询问用户选择 dev/staging/prod。
3. Host 展示风险：prod 部署需要二次确认。
4. 用户选择 staging。
5. Server 执行部署前检查。
```

## 练习

1. 为文件系统 MCP server 设计 root 校验规则。
2. 设计一个 sampling 请求审批界面应展示的字段。
3. 写出一个不安全 elicitation 问题，并改写成安全问题。

## 验收

- 能说明 Roots、Sampling、Elicitation 的方向和用途。
- 能识别 server 请求客户端能力时的安全风险。
- 能为不支持某客户端能力的情况设计降级方案。

## 重点

- Client capabilities 是受 host 控制的能力，不是 server 权限。
- Sampling 和 Elicitation 必须保留用户和 host 的控制权。
- Roots 是文件访问边界，不是提示文本装饰。

## 难点

- server 可能通过多步请求间接扩大权限。
- 用户确认要和具体 tool call、参数、风险绑定。

## 易错

> **易错：** server 要求用户输入 API token，再自己保存。
>
> 正确做法：凭据应由 host、授权服务器或安全凭据管理系统处理，server 只获得受控授权结果。

