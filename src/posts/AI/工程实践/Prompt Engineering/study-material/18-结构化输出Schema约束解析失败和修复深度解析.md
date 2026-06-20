---
title: "Prompt Engineering 学习资料：结构化输出、Schema 约束、解析失败和修复深度解析"
date: 2026-06-20
description: "结构化输出不是“让模型输出 JSON”这么简单。生产系统真正需要的是：模型输出能被解析、字段语义稳定、异常可恢复、下游不会因坏数据崩溃。"
tags:
  - "AI"
  - "工程实践"
  - "Prompt Engineering"
  - "深度解析"
category: "AI"
---

# Prompt Engineering 学习资料：结构化输出、Schema 约束、解析失败和修复深度解析

[返回索引](../Prompt Engineering学习资料.md)

## 学习目标

- 能设计生产可用的结构化输出。
- 掌握 schema、校验、修复、重试和降级策略。
- 能处理 JSON 漂移、字段缺失、枚举错误和部分成功。

## 理论导读

结构化输出不是“让模型输出 JSON”这么简单。生产系统真正需要的是：模型输出能被解析、字段语义稳定、异常可恢复、下游不会因坏数据崩溃。

## Schema 设计

### 字段语义要单一

坏设计：

```json
{
  "result": "推荐，原因是..."
}
```

好设计：

```json
{
  "decision": "recommend",
  "reasons": ["..."],
  "confidence": 0.82
}
```

### 枚举值要固定

```json
{
  "priority": "low | medium | high | urgent"
}
```

不要允许模型自由创造 `very_high`、`important`、`P0` 等同义值。

### 缺失值要明确

| 情况 | 建议 |
| --- | --- |
| 字符串缺失 | `null` 或 `"unknown"`，二选一固定 |
| 数组缺失 | `[]` |
| 数字无法判断 | `null` |
| 不适用 | `"not_applicable"` |

## 常见失败模式

| 失败 | 原因 | 修复 |
| --- | --- | --- |
| JSON 外包解释 | prompt 未禁止额外文本 | 要求只输出 JSON，parser 校验 |
| 字段缺失 | schema 不清或输入不足 | 必填字段 + 缺失值规则 |
| 枚举漂移 | 枚举解释不明确 | 固定枚举 + 非法值映射 |
| 类型错误 | 字段含义模糊 | 示例中展示正确类型 |
| 引用错误 | 资料 id 不清 | 文档编号 + 引用校验 |

## 修复链路

推荐链路：

```text
模型输出 -> JSON parse -> schema validate -> 业务规则校验 -> 修复 prompt -> 重试 -> 降级/人工
```

修复 prompt 示例：

```text
下面 JSON 不符合 schema，请只修复格式和字段，不要改变语义。

Schema:
...

Invalid JSON:
...
```

## 部分成功处理

不要因为一个字段失败就丢弃全部结果。可以按字段记录状态：

```json
{
  "data": {},
  "validation_errors": [],
  "needs_human_review": true
}
```

## 练习

为“合同风险抽取”设计 schema，要求包含：

- 风险类型枚举。
- 条款原文引用。
- 风险等级。
- 建议动作。
- 是否需要法务复核。

同时写出 5 种解析失败的修复策略。

## 验收

- 能设计字段、类型、枚举、缺失值。
- 能写出 parse、validate、retry、fallback 链路。
- 能解释为什么结构化输出必须由程序校验。

## 难点

Schema 设计同时影响模型理解和系统稳定性。字段越自由，模型越灵活但越难解析；字段越严格，越稳定但可能表达不了复杂情况。生产中要根据下游需求取舍。

