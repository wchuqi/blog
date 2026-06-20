---
title: "OpenCode 学习资料：完整知识点清单"
date: 2026-06-20
description: "OpenCode 定位：开源 AI coding agent。"
tags:
  - "AI"
  - "工具"
  - "OpenCode"
  - "知识清单"
category: "AI"
---

# OpenCode 学习资料：完整知识点清单

[返回索引](../OpenCode学习资料.md)

## 1. 基础和术语

- OpenCode 定位：开源 AI coding agent。
- 使用形态：TUI、CLI、桌面、IDE。
- 会话、上下文、工具调用、Agent、Provider、模型。
- Plan/Build、primary agent、subagent、hidden agent。
- `AGENTS.md`、`opencode.jsonc`、`.opencode/`。

## 2. 安装和初始化

- 安装脚本、npm、Homebrew、Windows 包管理、Docker。
- Windows WSL 推荐原因。
- `/connect` 配置 Provider。
- `/init` 生成项目说明。
- `AGENTS.md` 的 Git 管理。

## 3. TUI 和 CLI

- `opencode` 启动 TUI。
- `opencode run` 非交互任务。
- `@file` 文件引用。
- `/undo`、`/redo`、`/share`。
- CLI 子命令：agent、auth、mcp、models、run、serve、session、stats、export、import、web、debug、upgrade 等。

## 4. 配置体系

- JSON/JSONC。
- schema 校验。
- 全局配置、项目配置、自定义路径、内联配置、托管配置。
- 配置合并规则。
- 优先级和覆盖。
- `OPENCODE_CONFIG`、`OPENCODE_CONFIG_DIR`、`OPENCODE_CONFIG_CONTENT`。
- `tui.json` 和 TUI 专用配置。

## 5. 模型和 Provider

- `provider/model` 命名。
- 主模型和 `small_model`。
- Provider timeout、stream chunk timeout。
- 本地模型。
- Provider 策略和企业限制。
- 成本、延迟、质量权衡。

## 6. 工具体系

- `bash`、`read`、`grep`、`glob`。
- `edit`、`write`、`apply_patch`。
- `lsp` 实验工具。
- `webfetch`、`websearch`。
- `task`、`skill`、`todowrite`。
- 自定义工具。
- MCP 工具。
- 工具描述对模型决策的影响。

## 7. 权限和安全

- `allow`、`ask`、`deny`。
- 全局 `*` 和具体工具覆盖。
- 对象语法和通配符。
- 最后匹配规则生效。
- `external_directory`。
- 文件修改统一归入 `edit` 权限。
- bash 命令级控制。
- 密钥、生产配置、删除命令、部署命令保护。

## 8. Agent

- Build、Plan。
- General、Explore、Scout。
- compaction、title、summary。
- 自定义 Agent frontmatter。
- description、model、temperature、max steps、permission、mode、hidden、color。
- Agent 权限和任务权限。
- `@agent` 调用。

## 9. 自定义命令和规则

- `.opencode/commands/`。
- Markdown frontmatter。
- JSON 配置命令。
- `$ARGUMENTS`、`$1`、`$2`。
- `@file` 引用。
- shell 输出注入。
- 常见命令：review、test、docs、migration、security。
- 命令和权限联动。

## 10. MCP、自定义工具和插件

- local MCP、remote MCP、OAuth MCP。
- MCP 启用/禁用和命名。
- MCP 上下文成本。
- 自定义工具 TypeScript/JavaScript 定义。
- 参数 schema 和校验。
- 插件加载：npm、本地目录。
- 插件加载顺序。
- 插件 hooks、通知、日志、环境变量保护。

## 11. 调试和排障

- `opencode debug config`。
- 配置未生效。
- Provider 认证失败。
- 权限拒绝。
- shell 不兼容。
- 测试命令失败。
- 上下文过长。
- MCP 工具过多。
- 插件副作用。
- `/undo` 和 Git 回滚。

## 12. 团队治理

- 配置分层。
- 项目 `.opencode/` 审查。
- PR 模板。
- AI 修改说明。
- 会话分享安全。
- MCP 和插件评审。
- 审计日志。
- 成本监控。
- 高风险场景人工审批。

## 13. 安全风险

- 密钥泄露。
- 读取外部目录。
- 自动执行危险 shell。
- 覆盖用户未提交改动。
- 修改生产配置。
- 供应链插件风险。
- MCP 外部系统越权。
- 提示注入和文档中恶意指令。

## 14. 面试能力要求

- 能解释 OpenCode 架构和工作流。
- 能设计权限策略。
- 能排查配置问题。
- 能创建命令和 Agent。
- 能判断 MCP/插件是否值得引入。
- 能设计团队治理流程。
- 能结合真实项目说明风险和验收。

## 15. 执行架构和生命周期

- 用户输入如何进入会话。
- Agent 如何接收系统规则、项目规则和当前任务。
- 模型如何产生工具调用候选。
- 工具调用如何进入权限检查。
- 工具执行结果如何回写上下文。
- 文件修改、命令执行和 LSP 诊断如何影响后续推理。
- `/undo`、Git diff、人工 review 的恢复边界。
- 会话历史和上下文压缩对行为的影响。

## 16. 配置解析和覆盖算法

- 默认配置、远程配置、全局配置、项目配置、`.opencode/`、内联配置、托管配置。
- 合并而非整体替换。
- 后加载覆盖冲突字段。
- `$schema` 和 JSONC 注释。
- `OPENCODE_CONFIG`、`OPENCODE_CONFIG_DIR`、`OPENCODE_CONFIG_CONTENT`。
- `opencode debug config` 作为最终真相。
- 版本升级、字段废弃和兼容迁移。

## 17. 权限匹配算法和风险建模

- 工具名识别。
- 输入模式匹配。
- 通配符规则。
- 最后匹配规则生效。
- `bash` 命令级策略。
- `edit` 路径级策略。
- `external_directory` 外部目录访问。
- MCP 和自定义工具的权限命名。
- 低中高极高风险分级。
- 只读、日常开发、审查、事故排障等策略模板。

## 18. Agent 调度和上下文压缩

- primary agent 和 subagent 职责边界。
- Build、Plan、General、Explore、Scout 适用场景。
- hidden agent：title、summary、compaction。
- `@agent` 调用。
- 子 Agent 输出协议：事实、证据、假设、风险、下一步。
- 多 Agent 冲突结论合并。
- 长会话压缩导致的细节丢失和语义漂移。

## 19. 上下文工程和命令系统

- `AGENTS.md` 的导航、规则、命令和安全约束。
- Rules 与 `AGENTS.md` 的边界。
- `.opencode/commands/` 作为 prompt 函数。
- `$ARGUMENTS`、位置参数、`@file`、shell 输出注入。
- 命令模板的权限和审查。
- 外部文档、日志、MCP 输出中的提示注入风险。
- 文件内容应作为数据，而不是更高优先级指令。

## 20. 扩展安全和供应链

- local/remote/OAuth MCP。
- MCP 工具数量、上下文成本和权限风险。
- 自定义工具参数 schema、输入校验、输出过滤和审计。
- 插件加载来源、版本固定和 hooks 风险。
- 外部系统写入审批。
- 专用低权限凭据。
- 扩展评审模板和禁用方案。

## 21. 生产故障和恢复

- 修改范围失控。
- 测试失败后盲目连续修复。
- 配置覆盖导致权限失效。
- MCP 泄露敏感日志。
- 外部文档提示注入。
- 冻结现场、收集事实、分类影响、选择恢复、验证恢复、复盘沉淀。
- 事故复盘如何反向改权限、命令、`AGENTS.md` 和培训。

## 22. 平台化和组织治理

- 个人使用、项目规范、工具平台、治理平台、度量平台。
- 效率、质量、安全、成本四类指标。
- PR 模板和 AI 辅助变更说明。
- 托管配置和组织远程配置。
- MCP/插件审批流程。
- 新人培训、最佳实践库和事故案例库。
- 试点期、标准化期、平台化期、优化期。
