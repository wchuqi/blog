---
title: "AI Context Engineering 学习资料：MCP、工具协议和外部系统上下文深度解析"
date: 2026-06-20
description: "当模型需要访问文件、数据库、浏览器、业务系统或开发环境时，外部系统并不是“额外能力”那么简单。它们会把新的上下文带入模型，也可能执行动作。工具协议的价值在于把外部能力以结构化、可发现、可授权、可审计的方式暴露给模型应用。"
tags:
  - "AI"
  - "工程实践"
  - "AI Context Engineering"
  - "深度解析"
category: "AI"
---

# AI Context Engineering 学习资料：MCP、工具协议和外部系统上下文深度解析

[返回索引](../AI Context Engineering学习资料.md)

## 学习目标

- 理解工具协议如何影响模型可用上下文。
- 掌握 MCP 中 tools、resources、prompts 等概念的工程意义。
- 能设计外部系统上下文的权限、摘要和审计。

## 理论导读

当模型需要访问文件、数据库、浏览器、业务系统或开发环境时，外部系统并不是“额外能力”那么简单。它们会把新的上下文带入模型，也可能执行动作。工具协议的价值在于把外部能力以结构化、可发现、可授权、可审计的方式暴露给模型应用。

MCP，即 Model Context Protocol，可理解为 AI 应用和外部上下文提供者之间的标准接口。它让模型应用能发现工具、资源和提示模板，但是否调用、如何授权、结果如何进入上下文，仍需要应用层治理。

## MCP 相关概念

| 概念 | 工程含义 | Context Engineering 关注点 |
| --- | --- | --- |
| Tools | 可执行动作 | 参数 schema、权限、副作用 |
| Resources | 可读取资料 | 来源、权限、缓存、更新 |
| Prompts | 可复用模板 | 版本、适用场景、指令层级 |
| Roots | 客户端允许访问的边界 | 文件和资源范围 |
| Sampling | 服务端请求模型生成 | 控制权和安全边界 |

## 工具描述的设计

工具描述要明确：

- 工具做什么。
- 什么时候使用。
- 什么时候禁止使用。
- 输入参数 schema。
- 输出结构。
- 是否有副作用。
- 是否需要确认。
- 错误码含义。

错误示例：

```json
{"name": "run", "description": "run command"}
```

更好的示例：

```json
{
  "name": "search_docs",
  "description": "Search read-only internal documentation. Use only for factual answers that need citations.",
  "input_schema": {
    "query": "string",
    "product": "string",
    "version": "string"
  },
  "side_effect": false,
  "permission": "read_docs"
}
```

## 工具结果进入上下文的流程

```text
工具执行 -> 结构化校验 -> 敏感信息过滤 -> 错误归类
-> 摘要压缩 -> 信任等级标注 -> 进入上下文槽位
```

原始工具结果不应默认进入模型。特别是日志、HTML、邮件、数据库字段和 Shell 输出，可能包含注入文本或敏感信息。

## 权限模型

| 权限等级 | 例子 | 控制 |
| --- | --- | --- |
| read_public | 公共文档搜索 | 基础过滤 |
| read_private | 用户文件、内部文档 | 用户身份和范围 |
| write_draft | 生成草稿 | 可撤销 |
| write_external | 发邮件、提交工单 | 人工确认 |
| destructive | 删除、支付、发布 | 强审批和审计 |

## 练习

设计一个 MCP server 给求职助手使用，暴露三个能力：

- 读取简历文件。
- 检索岗位资料。
- 生成但不发送求职邮件。

为每个能力写明 tool/resource、参数、权限、输出摘要和安全风险。

## 验收

- 能解释 tools 和 resources 的区别。
- 能说明工具结果为什么需要清洗和包装。
- 能设计有副作用工具的确认流程。

## 重点

MCP 或任何工具协议只是连接机制，不自动解决安全和上下文质量。真正的 Context Engineering 还要做权限、过滤、摘要、观测和评估。

## 难点

难点是控制权边界：模型可以提出调用意图，但工具执行、权限批准和副作用控制必须由外部系统负责。

## 易错

> **易错：** 认为接入 MCP 就完成了 Context Engineering。
>
> 正确做法：协议负责暴露上下文和工具，应用负责选择、授权、压缩、安全和评估。

