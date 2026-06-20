---
title: "Vue3学习资料：组合式 API、生命周期和逻辑复用"
date: 2026-06-20
description: "选项式 API 按选项分类：data、methods、computed、watch。组件变复杂后，同一业务逻辑会散落在多个选项里。组合式 API 按业务能力组织，把相关状态、派生值、副作用和方法放在一起，更适合大型组件和 TypeScrip…"
tags:
  - "框架"
  - "Vue3"
category: "框架"
---

# Vue3学习资料：组合式 API、生命周期和逻辑复用

[返回索引](../Vue3学习资料.md)

## 学习目标

- 掌握 `script setup`、生命周期钩子、composable 写法。
- 理解组合式 API 与选项式 API 的组织差异。
- 能把请求、表单、分页、权限等逻辑封装为可复用函数。

## 理论导读

选项式 API 按选项分类：data、methods、computed、watch。组件变复杂后，同一业务逻辑会散落在多个选项里。组合式 API 按业务能力组织，把相关状态、派生值、副作用和方法放在一起，更适合大型组件和 TypeScript。

## 核心心智模型

composable 像工具箱里的成套工具：`usePagination` 不只给页码，还给页大小、总数、重置、跳页规则；调用者只关心能力，不关心内部怎么组织。

## 知识点详解

常用生命周期：

| 钩子 | 时机 | 场景 |
| --- | --- | --- |
| `onMounted` | 组件挂载后 | 访问 DOM、初始化第三方库 |
| `onUpdated` | 更新后 | 读取更新后的 DOM |
| `onUnmounted` | 卸载后 | 清理定时器、事件监听 |
| `onActivated` | KeepAlive 激活 | 恢复页面状态 |
| `onDeactivated` | KeepAlive 停用 | 暂停轮询 |

composable 示例：

```ts
import { computed, ref } from 'vue'

export function usePagination(defaultPageSize = 20) {
  const page = ref(1)
  const pageSize = ref(defaultPageSize)
  const total = ref(0)
  const offset = computed(() => (page.value - 1) * pageSize.value)

  function reset() {
    page.value = 1
  }

  return { page, pageSize, total, offset, reset }
}
```

## 练习

封装 `useRequest<T>`，支持 `loading`、`data`、`error`、`execute`、请求竞态保护和卸载后不再更新状态。

## 验收

- composable 不依赖具体组件名称和 DOM 结构。
- 副作用有清理逻辑。
- TypeScript 类型能推导返回数据。

## 重点

- `script setup` 是编译期语法糖，顶层变量可直接用于模板。
- composable 要表达一个稳定业务能力，而不是随手抽函数。

## 难点

- 异步请求会遇到竞态：后发请求可能先返回，也可能旧请求覆盖新结果。

## 易错

> **易错：** 在 composable 顶层创建共享状态，导致多个组件实例互相污染。
>
> 正确做法：实例私有状态放在函数内部；确实需要全局共享时明确命名并说明生命周期。
