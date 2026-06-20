---
title: "TypeScript学习资料：工程化、测试、Lint 和运行时边界"
date: 2026-06-20
description: "TypeScript 项目质量不只靠类型系统。类型检查负责静态契约，ESLint 负责代码模式和潜在 bug，Prettier 负责格式化，测试验证行为，运行时 schema 验证外部数据。它们互补，不应互相替代。"
tags:
  - "开发语言"
  - "TypeScript"
category: "开发语言"
---

# TypeScript学习资料：工程化、测试、Lint 和运行时边界

[返回索引](../TypeScript学习资料.md)

## 学习目标

- 能把 TypeScript 接入日常工程流程。
- 理解类型检查、Lint、格式化、单元测试和运行时校验的分工。
- 能设计 CI 中的类型质量门禁。
- 能处理外部输入和不可信边界。

## 理论导读

TypeScript 项目质量不只靠类型系统。类型检查负责静态契约，ESLint 负责代码模式和潜在 bug，Prettier 负责格式化，测试验证行为，运行时 schema 验证外部数据。它们互补，不应互相替代。

## 核心心智模型

```text
静态类型：开发期契约
Lint：代码模式和风险规则
测试：行为正确性
运行时校验：不可信输入边界
CI：把这些检查自动化
```

## 知识点详解

### 类型检查脚本

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint ."
  }
}
```

### 运行时边界

```ts
type User = { id: string; name: string };

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value
  );
}
```

真实项目也可以使用 Zod、Valibot、io-ts 等 schema 工具，但关键思想是：外部输入先校验再进入内部类型世界。

### 类型测试

类型工具可以用 `tsd`、`expect-type` 或编译期断言思路验证。复杂类型没有测试，重构时很容易悄悄退化成 `any`。

## 例子

```ts
async function loadUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  const data: unknown = await res.json();

  if (!isUser(data)) {
    throw new Error("invalid user payload");
  }

  return data;
}
```

## 练习

1. 给项目增加 `typecheck`、`lint`、`test` 脚本。
2. 写一个 `isUser` 类型保护。
3. 给 API 返回值做运行时校验。
4. 为一个工具类型写类型测试样例。

## 验收

- 能说清类型检查、Lint、测试的分工。
- 能把 `tsc --noEmit` 接入 CI。
- 能在外部输入处使用 `unknown` 和类型保护。
- 能解释为什么 TS 不替代运行时校验。

## 重点

- 类型系统验证代码写法，不验证真实外部数据。
- CI 应至少包含类型检查和测试。
- 运行时边界越清晰，内部代码越能信任类型。

## 难点

- Schema 和 TypeScript 类型可能重复定义；大型项目要考虑从 schema 生成类型或从类型驱动 schema 的策略。

## 易错

> **易错：** 把所有外部 JSON 直接断言为业务类型。
>
> 正确做法：外部输入先是 `unknown`，通过 schema 或类型保护后才进入内部业务层。
