---
title: "Vue3学习资料：响应式系统 ref、reactive 和 computed"
date: 2026-06-20
description: "Vue3 的响应式系统基于 Proxy 和 effect。读取响应式数据时，当前副作用函数会被收集为依赖；写入数据时，系统找到相关依赖并调度重新执行。组件渲染本身也是一种 effect，所以状态变化能驱动组件更新。"
tags:
  - "框架"
  - "Vue3"
category: "框架"
---

# Vue3学习资料：响应式系统 ref、reactive 和 computed

[返回索引](../Vue3学习资料.md)

## 学习目标

- 掌握 `ref`、`reactive`、`computed`、`watch`、`watchEffect`。
- 理解依赖收集、触发更新和调度批处理。
- 能排查常见响应式失效问题。

## 理论导读

Vue3 的响应式系统基于 Proxy 和 effect。读取响应式数据时，当前副作用函数会被收集为依赖；写入数据时，系统找到相关依赖并调度重新执行。组件渲染本身也是一种 effect，所以状态变化能驱动组件更新。

## 核心心智模型

响应式像订阅系统：谁读取了某个字段，谁就订阅了它；字段改变时，只通知订阅者。没有被读取过的字段，不会凭空触发某个逻辑。

## 知识点详解

| API | 适用场景 | 注意点 |
| --- | --- | --- |
| `ref` | 基本类型、单个值、模板引用 | 脚本中要 `.value` |
| `reactive` | 对象状态 | 不建议整体替换对象引用 |
| `computed` | 派生状态 | 应保持无副作用 |
| `watch` | 精确监听某个源 | 适合异步请求、持久化、日志 |
| `watchEffect` | 自动收集依赖 | 依赖不显式，复杂场景可读性差 |
| `shallowRef` | 大对象、外部实例 | 只追踪 `.value` 替换 |

## 例子

```ts
import { computed, reactive, watch } from 'vue'

const form = reactive({
  keyword: '',
  page: 1,
  pageSize: 20
})

const query = computed(() => ({
  keyword: form.keyword.trim(),
  page: form.page,
  pageSize: form.pageSize
}))

watch(query, async value => {
  // 根据查询条件请求列表
  console.log('fetch users by', value)
}, { immediate: true })
```

## 常见失效场景

```ts
const state = reactive({ count: 0 })
const { count } = state // count 失去响应式连接
```

修复：

```ts
import { toRefs } from 'vue'
const { count } = toRefs(state)
```

## 练习

封装 `useCounter`，返回 `count`、`doubleCount`、`increment`、`reset`，并用 `watch` 在 count 超过阈值时提示。

## 验收

- 能解释 `computed` 缓存何时失效。
- 能解释 `watch` 的 source 可以是什么。
- 能避免在 `computed` 中发请求或修改其他状态。

## 重点

- `computed` 是派生值，`watch` 是副作用。
- 响应式依赖来自“读取”，不是来自变量名。

## 难点

- 解构、对象替换、浅响应式、第三方实例都会影响依赖追踪。

## 易错

> **易错：** 对大对象使用深度 `watch` 做复杂同步。
>
> 正确做法：监听明确字段，或把状态拆小，减少无意义触发。
