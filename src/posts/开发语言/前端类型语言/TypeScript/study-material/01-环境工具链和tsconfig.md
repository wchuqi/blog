---
title: "TypeScript学习资料：环境、工具链和 tsconfig"
date: 2026-06-20
description: "TypeScript 项目通常不只有一个编译器。tsc 负责类型检查和编译输出；编辑器通过 TypeScript language service 提供跳转、补全和诊断；Node、浏览器或测试框架负责运行；Vite、Webpack、esbu…"
tags:
  - "开发语言"
  - "TypeScript"
category: "开发语言"
---

# TypeScript学习资料：环境、工具链和 tsconfig

[返回索引](../TypeScript学习资料.md)

## 学习目标

- 掌握 TypeScript 项目的基本工具链。
- 理解 `tsc`、`tsserver`、运行器、打包器和测试工具的边界。
- 能读懂常用 `tsconfig.json` 配置。
- 能搭建一个最小可运行项目。

## 理论导读

TypeScript 项目通常不只有一个编译器。`tsc` 负责类型检查和编译输出；编辑器通过 TypeScript language service 提供跳转、补全和诊断；Node、浏览器或测试框架负责运行；Vite、Webpack、esbuild、SWC、tsup 等工具负责打包或快速转译。

工程中常见误区是把这些职责混在一起。例如 `tsc --noEmit` 只做类型检查，不负责运行代码；打包器能转译 TS 不代表它做了完整类型检查；`paths` 别名能让类型检查通过，不代表 Node 运行时能找到同样的路径。

## 核心心智模型

```text
编辑器诊断  -> tsserver
类型检查    -> tsc --noEmit
编译输出    -> tsc / bundler
运行代码    -> node / browser / test runner
打包发布    -> bundler / package scripts
```

每个工具都要明确负责什么，不要把“能运行”和“类型安全”混为一谈。

## 知识点详解

### 最小项目结构

```text
ts-demo/
  package.json
  tsconfig.json
  src/
    index.ts
```

### 常用命令

```powershell
npm init -y
npm install -D typescript
npx tsc --init
npx tsc --noEmit
npx tsc
```

### 推荐基础配置

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

### `strict` 的意义

`strict` 不是单个规则，而是一组更严格的检查入口。它会让类型系统更早暴露隐患，例如隐式 `any`、空值、函数参数不安全等。新项目建议直接开启，老项目应分阶段迁移。

## 例子

```ts
// src/index.ts
function double(n: number): number {
  return n * 2;
}

console.log(double(21));
```

运行类型检查：

```powershell
npx tsc --noEmit
```

## 练习

1. 初始化一个 TypeScript 项目。
2. 开启 `strict`，故意写一个隐式 `any` 参数，观察报错。
3. 分别运行 `npx tsc --noEmit` 和 `npx tsc`，说明差异。
4. 修改 `target`，观察输出 JS 的差异。

## 验收

- 能说明 `tsc`、打包器和运行器的职责边界。
- 能解释 `strict`、`target`、`module`、`moduleResolution`。
- 能搭建一个通过类型检查的最小项目。

## 重点

- `tsc --noEmit` 是 CI 中常见的纯类型检查命令。
- 打包器转译 TS 不等于完整类型检查。
- `tsconfig` 是类型检查器的工作边界和规则集合。

## 难点

- 模块配置会同时影响类型解析、输出语法和运行时兼容性。

## 易错

> **易错：** 配了 `paths` 后以为 Node 运行时也能自动识别别名。
>
> 正确做法：运行时也要配置别名解析，或使用打包器/加载器/包导出策略配套处理。
