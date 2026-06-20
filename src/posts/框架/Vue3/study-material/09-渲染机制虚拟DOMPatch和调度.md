---
title: "Vue3学习资料：渲染机制、虚拟 DOM、Patch 和调度"
date: 2026-06-20
description: "Vue 组件渲染会生成虚拟节点树。状态变化后，组件渲染 effect 被调度，新的虚拟节点与旧虚拟节点进行 diff，渲染器把必要变化应用到真实 DOM。Vue3 编译器还会标记动态节点，帮助运行时少做无效比较。"
tags:
  - "框架"
  - "Vue3"
category: "框架"
---

# Vue3学习资料：渲染机制、虚拟 DOM、Patch 和调度

[返回索引](../Vue3学习资料.md)

## 学习目标

- 理解模板编译、虚拟 DOM、patch、key、scheduler、`nextTick`。
- 能解释状态更新到 DOM 更新的过程。
- 能定位列表错乱、重复渲染、DOM 读取时机错误。

## 理论导读

Vue 组件渲染会生成虚拟节点树。状态变化后，组件渲染 effect 被调度，新的虚拟节点与旧虚拟节点进行 diff，渲染器把必要变化应用到真实 DOM。Vue3 编译器还会标记动态节点，帮助运行时少做无效比较。

## 核心心智模型

虚拟 DOM 像施工变更单：不是每次重建整栋楼，而是对比新旧图纸，只施工变化部分。`key` 是构件编号，编号错了，施工队会把旧构件错配到新位置。

## 知识点详解

更新链路：

```text
响应式状态写入
  -> trigger 找到依赖
  -> 组件渲染 effect 进入队列
  -> 同一轮事件循环中批量刷新
  -> render 生成新 vnode
  -> patch 对比新旧 vnode
  -> 更新 DOM
```

`nextTick` 用于等待 Vue 把本轮状态变更刷新到 DOM：

```ts
import { nextTick, ref } from 'vue'

const open = ref(false)

async function showAndFocus() {
  open.value = true
  await nextTick()
  document.querySelector<HTMLInputElement>('#keyword')?.focus()
}
```

## 练习

实现一个可排序列表，每个列表项包含本地输入框。分别用业务 ID 和数组下标作为 `key`，观察排序后的输入状态差异。

## 验收

- 能画出状态更新到 DOM 更新流程。
- 能说明 `nextTick` 解决的是 DOM 更新时机，不是网络等待。
- 能解释错误 `key` 为什么会造成组件状态复用错误。

## 重点

- Vue 更新是批处理，不是每次赋值都立刻改 DOM。
- `key` 参与 vnode 身份识别。

## 难点

- 编译优化、patch flag、block tree 会影响 Vue3 实际 diff 范围。

## 易错

> **易错：** 修改状态后马上读取元素尺寸，发现还是旧值。
>
> 正确做法：等待 `nextTick` 后再读取 DOM。
