---
title: "Vue3学习资料：TypeScript、组件类型宏和泛型组件深度解析"
date: 2026-06-20
description: "Vue3 对 TypeScript 友好，但类型不会自动让架构变好。类型的价值是把组件契约写清楚：父组件必须传什么，子组件会发什么事件，插槽暴露什么数据，外部能调用组件哪些方法。中大型项目中，类型是组件边界的一部分。"
tags:
  - "框架"
  - "Vue3"
  - "深度解析"
category: "框架"
---

# Vue3学习资料：TypeScript、组件类型宏和泛型组件深度解析

[返回索引](../Vue3学习资料.md)

## 学习目标

- 掌握 Vue3 中 props、emits、slots、expose、template ref 的类型设计。
- 理解类型宏的编译期边界。
- 能在组件库和业务项目中写出可维护类型。

## 理论导读

Vue3 对 TypeScript 友好，但类型不会自动让架构变好。类型的价值是把组件契约写清楚：父组件必须传什么，子组件会发什么事件，插槽暴露什么数据，外部能调用组件哪些方法。中大型项目中，类型是组件边界的一部分。

## Props 类型

```vue
<script setup lang="ts">
interface Props {
  id: string
  disabled?: boolean
  mode?: 'create' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  mode: 'create'
})
</script>
```

注意：

- 可选属性和默认值要配合。
- props 是只读输入。
- 复杂业务对象要避免类型过宽，例如 `Record<string, any>`。

## Emits 类型

```ts
const emit = defineEmits<{
  save: [payload: { id: string; name: string }]
  cancel: []
  'update:modelValue': [value: string]
}>()
```

事件类型要表达“发生了什么”，payload 要足够明确。

## Slots 类型

```ts
defineSlots<{
  default(props: { item: User }): unknown
  empty(): unknown
}>()
```

适合组件库和复杂业务组件，能让父组件使用作用域插槽时获得类型提示。

## 泛型组件

列表、选择器、表格常需要泛型：

```vue
<script setup lang="ts" generic="T extends { id: string | number }">
defineProps<{
  items: T[]
  selectedId?: T['id']
}>()

defineEmits<{
  select: [item: T]
}>()
</script>
```

泛型组件适合抽象稳定交互模式，不适合为一次性业务页面强行抽象。

## Template Ref 类型

```vue
<script setup lang="ts">
import { ref } from 'vue'
import UserForm from './UserForm.vue'

const formRef = ref<InstanceType<typeof UserForm> | null>(null)

async function submit() {
  await formRef.value?.validate()
}
</script>
```

子组件需要通过 `defineExpose` 暴露方法：

```ts
defineExpose({
  validate
})
```

## 路由 Meta 类型扩展

```ts
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    permissions?: string[]
    keepAlive?: boolean
    title?: string
  }
}
```

这样写可以避免 `to.meta.permissions` 到处都是 `unknown` 或 `any`。

## Pinia 类型实践

setup store 通常有较好推导：

```ts
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isAdmin = computed(() => user.value?.roles.includes('admin') ?? false)
  return { user, isAdmin }
})
```

组件中使用：

```ts
const userStore = useUserStore()
const { user, isAdmin } = storeToRefs(userStore)
```

## 类型设计常见问题

| 问题 | 后果 | 修复 |
| --- | --- | --- |
| 到处使用 `any` | 类型失去保护 | 从 API DTO 开始建模 |
| props 类型过宽 | 组件契约不清 | 使用明确接口和联合类型 |
| 事件 payload 不清 | 父组件误用 | 使用命名元组 |
| 表单类型等于后端实体 | 编辑状态污染 | 区分 DTO、ViewModel、FormModel |
| 路由 meta 无类型 | 权限判断易错 | module augmentation |

## 练习

实现一个泛型 `DataSelect<T>` 组件：

- `items: T[]`
- `labelKey` 和 `valueKey`
- `v-model`
- `select` 事件返回完整 item
- 支持 empty slot

## 验收

- 父组件使用时能推导 item 类型。
- emits payload 有类型提示。
- 插槽 props 有类型提示。

## 重点

- TypeScript 在 Vue 中最重要的是组件契约和状态模型。

## 易错

> **易错：** 为了省事把接口返回、表单草稿、列表行、详情对象都定义成同一个类型。
>
> 正确做法：按使用场景拆 DTO、FormModel、ViewModel，必要时写转换函数。
