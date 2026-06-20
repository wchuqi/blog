---
title: "Vue3学习资料：组件通信 Props、Emits 和 Slots"
date: 2026-06-20
description: "组件通信的核心不是“数据怎么传过去”，而是“谁拥有状态，谁负责变更”。Vue 的 props 是父传子，emits 是子通知父，slot 是父把内容交给子布局。清晰的状态所有权能避免组件互相修改、逻辑绕来绕去。"
tags:
  - "框架"
  - "Vue3"
category: "框架"
---

# Vue3学习资料：组件通信 Props、Emits 和 Slots

[返回索引](../Vue3学习资料.md)

## 学习目标

- 掌握父子组件通信、插槽、透传属性、`provide/inject`。
- 理解单向数据流和组件职责边界。
- 能设计可复用组件 API。

## 理论导读

组件通信的核心不是“数据怎么传过去”，而是“谁拥有状态，谁负责变更”。Vue 的 props 是父传子，emits 是子通知父，slot 是父把内容交给子布局。清晰的状态所有权能避免组件互相修改、逻辑绕来绕去。

## 核心心智模型

父组件像项目经理，决定数据和业务规则；子组件像执行者，接收任务并汇报事件；插槽像预留区域，子组件负责框架，父组件填具体内容。

## 知识点详解

| 方式 | 场景 | 风险 |
| --- | --- | --- |
| props | 父向子传只读输入 | 子组件直接修改 props 会破坏单向数据流 |
| emits | 子向父报告事件 | 事件命名不清会让业务难追踪 |
| `v-model` | 表单类组件双向绑定 | 本质仍是 prop + emit |
| slots | 复用布局，内容由父决定 | 插槽作用域过多会增加理解成本 |
| provide/inject | 深层依赖注入，如主题、表单上下文 | 隐式依赖，不适合滥用业务数据 |

## 例子

```vue
<!-- UserFilter.vue -->
<script setup lang="ts">
defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <input
    :value="modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
```

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import UserFilter from './UserFilter.vue'
const keyword = ref('')
</script>

<template>
  <UserFilter v-model="keyword" />
</template>
```

## 练习

设计一个 `BaseModal` 组件，支持 `v-model:open`、标题插槽、默认内容插槽、底部操作插槽和关闭事件。

## 验收

- 组件不直接修改传入 props。
- 事件名描述“发生了什么”，不是描述“父组件该做什么”。
- 插槽默认内容合理，空插槽不破坏布局。

## 重点

- props down，events up。
- 插槽用于复用结构，不用于隐藏复杂业务流程。

## 难点

- `provide/inject` 很方便，但调试路径不如 props/emits 直观。

## 易错

> **易错：** 子组件接收 `user` 后直接修改 `user.name`。
>
> 正确做法：子组件发出修改事件，由父组件决定是否更新；表单编辑可先复制为本地草稿。
