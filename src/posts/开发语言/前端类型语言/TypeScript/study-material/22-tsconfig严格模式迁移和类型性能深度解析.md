---
title: "TypeScript学习资料：tsconfig 严格模式迁移和类型性能深度解析"
date: 2026-06-20
description: "strict 不是一个单点开关，而是一组规则入口。它让类型系统更诚实地面对隐式 any、空值、函数兼容、类初始化等问题。对新项目，严格模式通常应作为默认；对老项目，迁移策略比一次性开启更重要。"
tags:
  - "开发语言"
  - "TypeScript"
  - "深度解析"
category: "开发语言"
---

# TypeScript学习资料：tsconfig 严格模式迁移和类型性能深度解析

[返回索引](../TypeScript学习资料.md)

## 学习目标

- 深入理解 strict 家族选项带来的检查变化。
- 能制定老项目渐进迁移方案。
- 能识别类型性能问题。
- 能通过配置、项目引用和类型设计提升大型项目体验。

## 理论导读

`strict` 不是一个单点开关，而是一组规则入口。它让类型系统更诚实地面对隐式 any、空值、函数兼容、类初始化等问题。对新项目，严格模式通常应作为默认；对老项目，迁移策略比一次性开启更重要。

大型项目还要关注类型性能。复杂类型、过大的 tsconfig 包含范围、声明文件冲突、项目边界不清都会拖慢编辑器和 CI。

## 核心心智模型

```text
strict 迁移：发现隐患 -> 分类 -> 分批修复 -> CI 阻止新增
类型性能：减少无效检查范围 + 降低类型计算复杂度 + 拆分项目边界
```

## 知识点详解

### 常见严格选项

| 选项 | 作用 |
| --- | --- |
| `noImplicitAny` | 禁止隐式 any |
| `strictNullChecks` | null/undefined 不再随便赋给其他类型 |
| `strictFunctionTypes` | 更严格检查函数参数位置 |
| `strictPropertyInitialization` | 类属性必须初始化 |
| `noUncheckedIndexedAccess` | 索引访问结果包含 undefined |
| `exactOptionalPropertyTypes` | 可选属性语义更精确 |

### 迁移优先级

1. 公共类型和 API 边界。
2. 外部输入和数据解析。
3. 高频变更模块。
4. 基础工具函数。
5. 低风险历史代码。

### 错误分类

| 类型 | 处理方式 |
| --- | --- |
| 隐式 any | 补参数类型或抽公共类型 |
| 可能 undefined | 改控制流、默认值或显式校验 |
| 外部输入不可信 | 改 unknown + 运行时校验 |
| 第三方缺类型 | 安装类型包或写声明 |
| 复杂泛型失败 | 简化签名或显式类型参数 |

### 类型性能来源

- 深层递归条件类型。
- 巨大联合类型。
- 过宽的 `include`。
- 对 `node_modules` 或生成文件做过多检查。
- 单项目包含过多包。
- 大量复杂 JSX 类型推导。

### 排查工具和方法

```powershell
npx tsc --extendedDiagnostics
npx tsc --generateTrace trace
npx tsc --build --verbose
```

这些命令可以帮助观察耗时、文件数量和构建过程。

## 例子：迁移 `strictNullChecks`

迁移前：

```ts
function upper(name?: string) {
  return name.toUpperCase();
}
```

迁移后：

```ts
function upper(name?: string) {
  return name?.toUpperCase() ?? "";
}
```

这里不是为了“哄编译器”，而是明确处理缺失值。

## 练习

1. 为一个旧项目列出 strict 迁移阶段。
2. 把一个隐式 any 函数改为泛型函数。
3. 用 `noUncheckedIndexedAccess` 修复数组访问。
4. 用 `--extendedDiagnostics` 记录类型检查耗时。
5. 把一个大 tsconfig 拆成项目引用。

## 验收

- 能解释 strict 不是单个规则。
- 能制定可落地的 strict 迁移计划。
- 能区分类型错误是真 bug 还是声明噪声。
- 能识别类型性能热点。

## 重点

- 严格模式暴露的是代码不确定性，不是制造问题。
- 迁移要有基线、分批、门禁。
- 类型性能也是工程体验的一部分。

## 难点

- `exactOptionalPropertyTypes` 和 `noUncheckedIndexedAccess` 会改变很多长期被忽略的边界，需要结合业务语义修复。

## 易错

> **易错：** 大量使用非空断言 `!` 快速通过 strict 迁移。
>
> 正确做法：非空断言只能用于确有外部不变量保证的场景，并应尽量靠近边界；大多数情况应通过控制流校验处理。
