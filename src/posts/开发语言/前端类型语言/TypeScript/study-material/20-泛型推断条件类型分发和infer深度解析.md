---
title: "TypeScript学习资料：泛型推断、条件类型分发和 infer 深度解析"
date: 2026-06-20
description: "泛型和条件类型是 TypeScript 进阶的核心。泛型推断不是魔法，它来自调用参数、上下文类型、返回位置约束和默认类型参数。条件类型也不是简单三元表达式，它遇到裸类型参数联合时会分发，这让很多工具类型既强大又难懂。"
tags:
  - "开发语言"
  - "TypeScript"
  - "深度解析"
category: "开发语言"
---

# TypeScript学习资料：泛型推断、条件类型分发和 infer 深度解析

[返回索引](../TypeScript学习资料.md)

## 学习目标

- 理解泛型推断从哪里来，为什么有时推断过宽或过窄。
- 掌握条件类型的分发行为。
- 掌握 `infer` 的常见模式。
- 能读懂并编写中等复杂度的工具类型。

## 理论导读

泛型和条件类型是 TypeScript 进阶的核心。泛型推断不是魔法，它来自调用参数、上下文类型、返回位置约束和默认类型参数。条件类型也不是简单三元表达式，它遇到裸类型参数联合时会分发，这让很多工具类型既强大又难懂。

学习这部分时，不要只背 `ReturnType`、`Partial` 的结果，要能解释它们如何一步步从输入类型推导输出类型。

## 核心心智模型

```text
泛型推断：从调用点收集候选类型 -> 合并候选 -> 应用约束 -> 得到 T
条件类型分发：T 是裸类型参数且 T 是联合 -> 对每个成员分别计算 -> 合并结果
infer：在类型模式里临时声明一个要捕获的类型变量
```

## 知识点详解

### 推断来源

```ts
function pair<T>(a: T, b: T): [T, T] {
  return [a, b];
}

const value = pair(1, 2); // T 推断为 number
```

如果参数给出不同候选，推断可能变成联合，或者需要显式类型参数。

### 约束不等于最终类型

```ts
function getId<T extends { id: string }>(value: T): string {
  return value.id;
}
```

`T` 至少有 `id`，但调用时的 `T` 可以包含更多字段。约束只是下界要求，不会把 `T` 变成约束本身。

### 条件类型分发

```ts
type ToArray<T> = T extends unknown ? T[] : never;

type R = ToArray<string | number>; // string[] | number[]
```

因为 `T` 是裸类型参数，联合会被拆开计算。

### 阻止分发

```ts
type ToArrayNoDistribute<T> = [T] extends [unknown] ? T[] : never;

type R = ToArrayNoDistribute<string | number>; // (string | number)[]
```

用元组包住类型参数可以阻止分发。

### `infer` 捕获返回值

```ts
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```

### `infer` 捕获数组元素

```ts
type ElementType<T> = T extends readonly (infer E)[] ? E : never;
```

### 递归类型风险

递归类型可以表达深层转换，但可能拖慢编译器，也可能达到实例化深度限制。大型项目中要限制复杂度。

## 例子：实现 Awaited 简化版

```ts
type MyAwaited<T> = T extends Promise<infer R> ? MyAwaited<R> : T;

type A = MyAwaited<Promise<Promise<string>>>; // string
```

这个类型能递归展开 Promise，但真实内置 `Awaited` 会处理更多边界。

## 练习

1. 实现 `ElementType<T>`。
2. 实现 `ValueOf<T>`。
3. 比较分发和不分发条件类型。
4. 实现简化版 `ReturnType` 和 `Parameters`。
5. 给一个递归工具类型写三组输入输出样例。

## 验收

- 能说明泛型推断来源。
- 能解释条件类型分发。
- 能使用元组包装阻止分发。
- 能使用 `infer` 捕获返回值、参数和数组元素。
- 能说出复杂类型工具的性能风险。

## 重点

- 泛型约束不是最终类型。
- 条件类型分发是很多高级类型的关键。
- `infer` 是模式匹配中的“占位捕获变量”。

## 难点

- 推断失败时，问题可能出在参数位置、上下文类型、约束过宽、返回位置无法反推，不能只靠显式 `<T>` 解决。

## 易错

> **易错：** 看到 `T extends unknown ? ...` 觉得它没有意义。
>
> 正确做法：理解它常用于触发联合分发，是类型层遍历联合的一种技巧。
