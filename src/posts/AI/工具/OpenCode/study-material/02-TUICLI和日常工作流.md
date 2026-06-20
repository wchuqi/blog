---
title: "OpenCode 学习资料：TUI、CLI 和日常工作流"
date: 2026-06-20
description: "OpenCode 不带参数启动时进入 TUI，适合交互式开发。CLI 命令适合脚本化，例如一次性解释、批处理、服务模式、session 管理、模型列表、debug 等。"
tags:
  - "AI"
  - "工具"
  - "OpenCode"
category: "AI"
---

# OpenCode 学习资料：TUI、CLI 和日常工作流

[返回索引](../OpenCode学习资料.md)

## 学习目标

- 掌握 OpenCode TUI 的常见交互方式。
- 理解 CLI 适合自动化、脚本化和非交互任务。
- 建立可重复的日常开发工作流。

## 理论导读

OpenCode 不带参数启动时进入 TUI，适合交互式开发。CLI 命令适合脚本化，例如一次性解释、批处理、服务模式、session 管理、模型列表、debug 等。

日常使用不应只追求“一句话完成所有事”。更稳定的方式是把任务切成：定位、计划、执行、验证、总结。

## TUI 常用交互

| 场景 | 做法 | 说明 |
| --- | --- | --- |
| 启动项目 | `opencode` | 默认进入终端界面 |
| 引用文件 | `@path/to/file` | 让 Agent 精确读取上下文 |
| 连接模型 | `/connect` | 配置 Provider/API key |
| 初始化项目 | `/init` | 生成 `AGENTS.md` |
| 切换 Plan/Build | `Tab` | 用于控制是否执行修改 |
| 回滚 | `/undo` | 撤销上一次变更 |
| 重做 | `/redo` | 恢复被撤销的变更 |
| 分享会话 | `/share` | 生成当前会话链接，注意敏感信息 |

## CLI 常见用法

```bash
opencode
opencode run "Explain how this repository is structured"
opencode --model provider/model
opencode --agent plan
opencode debug config
opencode models
opencode session
```

> **重点：** CLI 适合固定输入、固定输出和自动化；TUI 适合探索、反馈和多轮协作。

## 推荐工作流

### 1. 只读理解

```text
请解释 @src/auth/session.ts 的职责。
不要修改文件。
输出：入口函数、依赖、状态变化、潜在风险。
```

### 2. 计划

```text
请进入 Plan 模式，为“登录失败超过 5 次锁定账号 15 分钟”设计实现方案。
要求：
- 列出要改的文件。
- 给数据库字段或缓存设计。
- 给测试清单。
- 不要修改文件。
```

### 3. 执行

```text
按刚才方案实现第一步：只增加服务端锁定逻辑和单元测试。
不要修改前端。
完成后运行相关测试。
```

### 4. 验证和总结

```text
请总结本次修改：
- 改了哪些文件
- 行为变化
- 已运行的测试
- 剩余风险
```

## 练习

使用一个小项目完成以下流程：

1. 让 OpenCode 解释一个模块。
2. 让 OpenCode 为一个改动制定计划。
3. 人工审核计划后让它只实现第一步。
4. 让它运行测试。
5. 故意要求一次错误改动，再用 `/undo` 回滚。

## 验收

- 能在 TUI 中引用文件并限制修改权限。
- 能用 CLI 执行一次非交互任务。
- 能把复杂任务拆成多轮交互。
- 能使用 `/undo` 和 `/redo` 恢复会话修改。

## 重点

- 大任务先问清楚架构，再要求实现。
- 每次执行都要有明确验收命令。
- 回滚能力不能替代 Git，重要改动仍应分支开发和提交。

## 难点

- 模型可能在一次会话中遗忘早期细节。长任务要让它阶段性总结，并把关键规则写回项目文档。

## 易错

> **易错：** 让 OpenCode 一次性“实现完整支付系统”。
>
> 正确做法：拆成数据模型、接口契约、核心逻辑、测试、前端接入、安全审查。
