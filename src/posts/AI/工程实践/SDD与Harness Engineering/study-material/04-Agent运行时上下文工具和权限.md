---
title: "SDD与Harness Engineering学习资料：Agent运行时上下文工具和权限"
date: 2026-06-20
description: "Agent 能做什么，不只取决于模型，也取决于它看到了什么、能调用什么、被允许做什么。上下文决定 Agent 的判断材料，工具决定 Agent 的行动能力，权限决定行动边界。"
tags:
  - "AI"
  - "工程实践"
  - "SDD与Harness Engineering"
category: "AI"
---

# SDD与Harness Engineering学习资料：Agent运行时上下文工具和权限

[返回索引](../SDD与Harness Engineering学习资料.md)

## 学习目标

- 掌握 Agent 运行时三件事：上下文、工具、权限。
- 能设计上下文选择规则和工具白名单。
- 能识别高风险操作。

## 理论导读

Agent 能做什么，不只取决于模型，也取决于它看到了什么、能调用什么、被允许做什么。上下文决定 Agent 的判断材料，工具决定 Agent 的行动能力，权限决定行动边界。

这三个元素如果缺少治理，就会出现典型失败：看错代码、调用错命令、改错目录、泄露密钥、删除文件、绕过测试。

## 核心心智模型

```text
上下文 = 眼睛
工具 = 手
权限 = 护栏
验证 = 体检
日志 = 记忆
```

## 知识点详解

### 1. 上下文装配

上下文来源包括：

- 当前规格。
- 相关源码。
- 接口契约。
- 数据库 schema。
- 测试文件。
- 代码风格和团队规则。
- 最近相关变更。
- 失败日志。

选择原则：

```text
相关性 > 新鲜度 > 权威性 > 简洁性
```

例如 API 契约比旧 PR 评论更权威，当前 feature spec 比通用 README 更相关。

### 2. 工具设计

Agent 常见工具：

- 文件搜索和读取。
- 代码编辑。
- 测试运行。
- 类型检查和 lint。
- 浏览器自动化。
- 文档检索。
- 数据库只读查询。
- 任务状态记录。

工具设计要有输入输出边界。例如测试工具最好返回结构化摘要，而不是把几万行日志塞回模型。

### 3. 权限模型

权限应按风险分层：

| 风险等级 | 操作 | 默认策略 |
| --- | --- | --- |
| 低 | 读取文件、搜索代码 | 允许 |
| 中 | 编辑业务代码、运行测试 | 允许但记录 |
| 高 | 修改配置、迁移数据库、安装依赖 | 需要审批 |
| 极高 | 删除目录、推送代码、访问密钥、生产操作 | 默认禁止 |

### 4. 调度和执行顺序

Agent 的执行顺序应明确：

```text
读取规格 -> 收集上下文 -> 制定计划 -> 执行小步修改 -> 局部验证 -> 全量验证 -> 输出总结
```

不要允许 Agent 在没有读取规格和上下文前直接改代码。

## 例子

Agent 规则文件示例：

```yaml
context:
  required:
    - specs/current-feature.md
    - docs/architecture.md
  optional:
    - recent-pr-summary.md
tools:
  allow:
    - read_file
    - search_code
    - edit_file
    - run_tests
  require_approval:
    - install_dependency
    - modify_database_migration
  deny:
    - read_secrets
    - deploy_production
validation:
  commands:
    - mvn test
    - mvn -q spotless:check
```

## 练习

为一个前端项目设计 Agent 工具和权限表。必须覆盖：

- 修改 UI 组件。
- 安装依赖。
- 截图验证。
- 读取环境变量。
- 修改路由。
- 访问外部网站。

## 验收

- 能解释上下文、工具和权限之间的关系。
- 能设计工具白名单和审批清单。
- 能指出哪些操作需要默认禁止。

## 重点

权限不是为了阻碍 Agent，而是为了让 Agent 可以在可信边界内更大胆地工作。

## 难点

难点是动态上下文装配。真实项目中，Agent 需要的上下文会随任务变化，不能只靠固定 README。

## 易错

> **易错：** 允许 Agent 自己决定是否运行测试。
>
> 正确做法：关键验证应由 Harness 强制触发，不能只依赖 Agent 的自我判断。

