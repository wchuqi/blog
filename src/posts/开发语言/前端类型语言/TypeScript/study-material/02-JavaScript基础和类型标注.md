---
title: "TypeScript学习资料：JavaScript 基础和类型标注"
date: 2026-06-20
description: "TypeScript 的类型标注附着在 JavaScript 代码上。变量、函数参数、返回值、对象属性、数组、元组、类成员都可以标注类型。但不是所有地方都应该显式标注。局部变量如果能从初始化表达式推断出来，通常不需要重复写类型；函数参数和公…"
tags:
  - "开发语言"
  - "TypeScript"
category: "开发语言"
---

# TypeScript学习资料：JavaScript 基础和类型标注

[返回索引](../TypeScript学习资料.md)

## 学习目标

- 掌握 TypeScript 中常见类型标注位置。
- 理解类型推断优先于重复标注。
- 知道 `any`、`unknown`、`void`、`never` 的边界。
- 能避免把 JavaScript 运行时问题误认为 TypeScript 语法问题。

## 理论导读

TypeScript 的类型标注附着在 JavaScript 代码上。变量、函数参数、返回值、对象属性、数组、元组、类成员都可以标注类型。但不是所有地方都应该显式标注。局部变量如果能从初始化表达式推断出来，通常不需要重复写类型；函数参数和公共 API 则更应该明确。

## 核心心智模型

类型标注像“契约标签”：

```text
调用方看到契约 -> 编译器验证调用 -> 实现方按契约返回
```

对于局部临时变量，编译器通常能自己贴标签；对于模块边界和函数边界，人应该把契约写清楚。

## 知识点详解

### 基础类型

```ts
let name: string = "Alice";
let age: number = 20;
let active: boolean = true;
let tags: string[] = ["ts", "js"];
let point: [number, number] = [10, 20];
```

### 函数类型

```ts
function add(a: number, b: number): number {
  return a + b;
}

const format = (id: string): string => `id=${id}`;
```

### `any` 和 `unknown`

`any` 会关闭类型检查，适合非常短暂的迁移过渡，不适合作为长期类型。`unknown` 表示“我不知道它是什么”，使用前必须收窄，更适合外部输入。

```ts
function parseJson(text: string): unknown {
  return JSON.parse(text);
}
```

### `void` 和 `never`

- `void`：函数没有有意义的返回值。
- `never`：函数不会正常返回，或某个分支理论上不可能出现。

```ts
function log(message: string): void {
  console.log(message);
}

function fail(message: string): never {
  throw new Error(message);
}
```

## 例子

```ts
function isString(value: unknown): value is string {
  return typeof value === "string";
}

const data: unknown = JSON.parse('"hello"');

if (isString(data)) {
  console.log(data.toUpperCase());
}
```

## 练习

1. 为一个 `sum(numbers)` 函数添加类型。
2. 把 `JSON.parse` 的结果从 `any` 改成 `unknown`。
3. 写一个返回 `never` 的错误函数。
4. 解释 `string[]` 和 `[string, number]` 的区别。

## 验收

- 能给函数参数和返回值添加类型。
- 能说明 `any` 和 `unknown` 的区别。
- 能正确使用数组和元组。
- 能解释 `void` 和 `never`。

## 重点

- 公共 API 的参数和返回值应显式。
- 能推断的局部变量不必重复标注。
- 外部输入优先用 `unknown`，不要直接 `any`。

## 难点

- `any` 的危险在于它会污染后续表达式，让错误延迟到运行时。

## 易错

> **易错：** 为了消除报错到处写 `as any`。
>
> 正确做法：先理解报错背后的不确定性，再用收窄、泛型、重构类型或运行时校验解决。
