---
title: "OpenCode 学习资料：配置体系、模型和 Provider"
date: 2026-06-20
description: "OpenCode 支持 JSON 和 JSONC。配置不是简单选择一个文件，而是从多个来源合并：组织远程配置、全局配置、自定义配置、项目配置、.opencode 目录、内联配置、托管配置等。后加载的配置只覆盖冲突字段，不会删除不冲突字段。"
tags:
  - "AI"
  - "工具"
  - "OpenCode"
category: "AI"
---

# OpenCode 学习资料：配置体系、模型和 Provider

[返回索引](../OpenCode学习资料.md)

## 学习目标

- 掌握 OpenCode JSON/JSONC 配置格式。
- 理解配置位置、合并规则和优先级。
- 会配置模型、Provider、shell、server、TUI 和项目级覆盖。

## 理论导读

OpenCode 支持 JSON 和 JSONC。配置不是简单选择一个文件，而是从多个来源合并：组织远程配置、全局配置、自定义配置、项目配置、`.opencode` 目录、内联配置、托管配置等。后加载的配置只覆盖冲突字段，不会删除不冲突字段。

这意味着团队可以在远程或托管配置中放安全默认值，个人在全局配置中放偏好，项目在根目录覆盖项目规则。

## 配置文件位置

| 位置 | 用途 | 特点 |
| --- | --- | --- |
| 远程配置 | 组织默认配置 | 作为底层默认值 |
| `~/.config/opencode/opencode.json` | 个人全局配置 | 用户级模型、权限、偏好 |
| `OPENCODE_CONFIG` | 自定义配置文件 | 临时或脚本覆盖 |
| 项目根 `opencode.json` | 项目配置 | 项目级规则，建议进 Git |
| `.opencode/` | 命令、Agent、插件等 | 项目可复用扩展 |
| `OPENCODE_CONFIG_CONTENT` | 内联配置 | 运行时覆盖 |
| 管理员托管配置 | 企业强制策略 | 用户不可覆盖 |

> **重点：** 配置是合并而不是整体替换；冲突字段以后加载的为准。

## 基础配置示例

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5",
  "autoupdate": true,
  "shell": "pwsh",
  "server": {
    "port": 4096,
    "hostname": "127.0.0.1"
  }
}
```

## 模型和 Provider

OpenCode 可以配置不同 LLM Provider。模型通常写成 `provider/model`。`small_model` 用于标题生成等轻量任务，可以降低成本。

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "anthropic": {
      "options": {
        "timeout": 600000,
        "chunkTimeout": 30000
      }
    }
  },
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5"
}
```

## 配置决策规则

1. 个人偏好放全局配置，例如主题、默认模型、个人命令。
2. 项目共识放项目配置，例如权限、测试命令、Agent、MCP。
3. 企业强制策略放托管配置，例如禁止分享、限制 Provider、阻止危险命令。
4. 临时实验使用环境变量，不要污染项目配置。

## 练习

为一个项目写 `opencode.jsonc`：

- 默认模型和小模型。
- shell 设置。
- server 只监听本机。
- 默认权限为 `ask`。
- 允许 `git status` 和测试命令。
- 拒绝删除命令。

## 验收

- 能解释 OpenCode 配置优先级。
- 能说明为什么项目配置适合提交到 Git。
- 能区分 `model` 和 `small_model`。
- 能用 `opencode debug config` 检查最终解析配置。

## 重点

- 配置层次决定团队可治理程度。
- `opencode.jsonc` 可以带注释，适合团队说明配置意图。

## 难点

- 多层配置合并时，问题不一定出在当前文件。排障时要看最终解析结果，而不是只看项目配置。

## 易错

> **易错：** 在项目配置中写个人 API key。
>
> 正确做法：密钥通过 Provider 登录、环境变量或安全凭据管理，不能进仓库。
