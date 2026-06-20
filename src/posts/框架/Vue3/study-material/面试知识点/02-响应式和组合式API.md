---
title: "Vue3面试知识点：响应式和组合式 API"
date: 2026-06-20
description: "Vue3 响应式主要基于 Proxy。读取响应式对象属性时执行 track，收集当前 active effect；写入属性时执行 trigger，找到依赖该属性的 effect 并调度更新。组件渲染函数也是 effect，所以状态变化会触发…"
tags:
  - "框架"
  - "Vue3"
  - "面试"
category: "框架"
---

# Vue3面试知识点：响应式和组合式 API

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../Vue3学习资料.md)

## 一、响应式和组合式 API

### 1. Vue3 响应式原理是什么？

**参考答案：**

Vue3 响应式主要基于 Proxy。读取响应式对象属性时执行 track，收集当前 active effect；写入属性时执行 trigger，找到依赖该属性的 effect 并调度更新。组件渲染函数也是 effect，所以状态变化会触发组件重新渲染。

核心结构可以理解为：

```text
target -> key -> effects
```

> **重点：** 依赖收集发生在读取时，触发更新发生在写入时。
>
> **难点：** 组件更新会进入 scheduler 批处理，不等于每次写入都同步改 DOM。

### 2. `ref` 和 `reactive` 怎么选择？

**参考答案：**

基本类型、单个值、模板引用优先用 `ref`；对象集合可以用 `reactive`。在 TypeScript 和 composable 返回值场景中，`ref` 更容易解构和传递；`reactive` 适合表单对象这类聚合状态。

`ref` 在脚本中用 `.value`，模板中会自动解包。`reactive` 不建议整体替换对象引用，否则旧引用上的依赖不会按预期工作。

> **易错：** 从 `reactive` 对象直接解构字段会丢失响应式连接；需要 `toRefs`。

### 3. `computed` 和 `watch` 有什么区别？

**参考答案：**

`computed` 用于派生状态，要求无副作用，并且有缓存；依赖不变时不会重新计算。`watch` 用于响应状态变化执行副作用，例如请求接口、写缓存、埋点、同步外部系统。

```ts
const fullName = computed(() => firstName.value + lastName.value)

watch(userId, id => {
  fetchUser(id)
})
```

> **重点：** 派生值用 `computed`，副作用用 `watch`。
>
> **易错：** 在 `computed` 里发请求或修改其他状态。

### 4. 什么是 composable？怎么避免写坏？

**参考答案：**

composable 是基于组合式 API 的逻辑复用函数，通常命名为 `useXxx`，返回响应式状态、派生值和操作方法。它应该表达一个清晰能力，例如分页、请求、权限判断、表单脏检查。

避免写坏的关键是：不要隐式依赖特定组件 DOM，不要把实例私有状态放到函数外共享，不要让一个 composable 做太多事，不要隐藏过多副作用。

> **难点：** composable 的复用边界是业务能力，不是随便抽公共代码。
