---
title: "TypeScript学习资料：类型查询、keyof 和索引访问"
date: 2026-06-20
description: "TypeScript 同时有值空间和类型空间。运行时变量存在于值空间，类型声明存在于类型空间。typeof 在类型位置可以从值推导类型；keyof 可以获得对象类型的键集合；索引访问类型可以获得某个属性的值类型。"
tags:
  - "开发语言"
  - "TypeScript"
category: "开发语言"
---

# TypeScript学习资料：类型查询、keyof 和索引访问

[返回索引](../TypeScript学习资料.md)

## 学习目标

- 掌握 `typeof` 在类型位置的用法。
- 掌握 `keyof`、索引访问类型和 `as const`。
- 理解值空间和类型空间的区别。
- 能从已有对象和函数推导类型，减少重复定义。

## 理论导读

TypeScript 同时有值空间和类型空间。运行时变量存在于值空间，类型声明存在于类型空间。`typeof` 在类型位置可以从值推导类型；`keyof` 可以获得对象类型的键集合；索引访问类型可以获得某个属性的值类型。

这类能力让代码能从“单一事实来源”推导类型，减少接口和配置重复维护。

## 核心心智模型

```text
已有值或类型
  -> typeof 抽取值的类型
  -> keyof 抽取键集合
  -> T[K] 抽取属性类型
```

## 知识点详解

### 类型位置的 `typeof`

```ts
const config = {
  retry: 3,
  mode: "prod",
};

type Config = typeof config;
```

### `keyof`

```ts
type User = {
  id: string;
  name: string;
};

type UserKey = keyof User; // "id" | "name"
```

### 索引访问类型

```ts
type UserName = User["name"]; // string
```

### `as const`

```ts
const levels = ["INFO", "WARN", "ERROR"] as const;
type Level = (typeof levels)[number];
```

没有 `as const` 时，数组元素通常会被推断为 `string`，而不是具体字面量联合。

## 例子

```ts
const routes = {
  home: "/",
  user: "/users/:id",
} as const;

type RouteName = keyof typeof routes;
type RoutePath = (typeof routes)[RouteName];
```

## 练习

1. 从一个常量数组生成联合类型。
2. 实现 `get<T, K extends keyof T>(obj, key)`。
3. 用 `typeof` 从配置对象生成类型。
4. 比较加不加 `as const` 的推断结果。

## 验收

- 能区分值空间和类型空间。
- 能用 `typeof` 从值生成类型。
- 能用 `keyof` 和 `T[K]` 建立键值关系。
- 能用 `as const` 保留字面量信息。

## 重点

- `typeof` 在类型位置不是 JavaScript 的运行时 `typeof`。
- `keyof` 得到的是键的联合。
- `as const` 常用于配置、路由、事件名、枚举替代方案。

## 难点

- `keyof` 在索引签名、数组和联合类型上的行为需要结合具体类型推导，不要只背结论。

## 易错

> **易错：** 手写一份 `type Level = "INFO" | "WARN" | "ERROR"`，又维护一份运行时数组。
>
> 正确做法：让运行时常量成为单一事实来源，再用 `typeof` 和索引访问生成类型。
