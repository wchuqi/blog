---
title: "TypeScript学习资料：运行时边界、Schema 和类型安全 API 设计深度解析"
date: 2026-06-20
description: "TypeScript 最容易被高估的地方，是开发者以为类型能证明外部世界正确。实际上，HTTP 响应、localStorage、URL 参数、环境变量、表单输入、消息队列、数据库、第三方 SDK 都是运行时数据。它们进入系统时没有静态类型保…"
tags:
  - "开发语言"
  - "TypeScript"
  - "深度解析"
category: "开发语言"
---

# TypeScript学习资料：运行时边界、Schema 和类型安全 API 设计深度解析

[返回索引](../TypeScript学习资料.md)

## 学习目标

- 深入理解 TypeScript 类型和运行时数据之间的边界。
- 能设计类型安全的 API client、配置解析和表单处理。
- 掌握手写类型保护和 schema 校验的取舍。
- 能避免 `as`、非空断言和错误类型保护造成的虚假安全。

## 理论导读

TypeScript 最容易被高估的地方，是开发者以为类型能证明外部世界正确。实际上，HTTP 响应、localStorage、URL 参数、环境变量、表单输入、消息队列、数据库、第三方 SDK 都是运行时数据。它们进入系统时没有静态类型保证。

成熟的 TS 工程会建立“边界层”：所有不可信数据在边界处解析、校验、转换，进入内部后才使用可信业务类型。

## 核心心智模型

```text
外部世界 unknown
  -> 边界校验 parse/validate
  -> 内部可信类型 Domain Model
  -> 业务逻辑只处理已验证数据
```

## 知识点详解

### 手写类型保护

```ts
type User = { id: string; name: string };

function isUser(value: unknown): value is User {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.id === "string" && typeof obj.name === "string";
}
```

优点是轻量，缺点是复杂结构容易漏校验。

### Schema 校验

使用 schema 工具的核心价值：

- 运行时校验。
- 错误信息更好。
- 可复用解析逻辑。
- 有些工具能从 schema 推导 TS 类型。

示意：

```ts
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

type User = z.infer<typeof UserSchema>;
```

### Parse 不只是 Validate

很多边界不仅要判断合法，还要转换：

- 环境变量字符串转数字。
- 日期字符串转 Date 或保持 ISO 字符串。
- URL 查询参数转分页对象。
- 表单空字符串转 `undefined`。

### API client 设计

```ts
type ApiError =
  | { type: "network"; message: string }
  | { type: "http"; status: number; body: unknown }
  | { type: "validation"; message: string };

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };
```

错误类型也要建模，不能只返回 `string`。

## 例子：配置解析

```ts
type AppConfig = {
  port: number;
  mode: "dev" | "prod";
};

function parseConfig(env: Record<string, string | undefined>): AppConfig {
  const port = Number(env.PORT ?? "3000");
  if (!Number.isInteger(port)) {
    throw new Error("PORT must be an integer");
  }

  const mode = env.MODE;
  if (mode !== "dev" && mode !== "prod") {
    throw new Error("MODE must be dev or prod");
  }

  return { port, mode };
}
```

## 练习

1. 为 `User`、`Order` 写手写类型保护。
2. 用 schema 工具描述同样的结构，比较优缺点。
3. 为环境变量写集中解析函数。
4. 设计一个包含网络、HTTP、校验错误的 API client。
5. 把 `as User` 改成 `parseUser(value)`。

## 验收

- 能解释外部输入为什么应是 `unknown`。
- 能写诚实的类型保护。
- 能说明 validate 和 parse 的区别。
- 能设计错误类型清晰的 API client。

## 重点

- 类型安全的关键在边界，而不是到处断言。
- 校验后得到的是内部可信类型。
- API 错误要结构化，便于调用方处理。

## 难点

- Schema 和类型的单一事实来源需要团队统一策略，否则会出现类型和校验规则漂移。

## 易错

> **易错：** 类型保护内部用了 `as User` 后直接返回 true。
>
> 正确做法：类型保护必须基于真实运行时检查，不能把断言伪装成校验。
