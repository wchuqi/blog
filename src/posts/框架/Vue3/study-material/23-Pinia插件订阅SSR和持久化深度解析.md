---
title: "Vue3学习资料：Pinia 插件、订阅、SSR 和持久化深度解析"
date: 2026-06-20
description: "Pinia 是 Vue 响应式系统上的应用状态层。它不是后端缓存，也不是所有组件状态的归宿。Pinia 的价值在于把跨组件共享状态、派生状态和修改动作组织成可追踪、可测试、可扩展的模块。"
tags:
  - "框架"
  - "Vue3"
  - "深度解析"
category: "框架"
---

# Vue3学习资料：Pinia 插件、订阅、SSR 和持久化深度解析

[返回索引](../Vue3学习资料.md)

## 学习目标

- 理解 Pinia store 的创建、订阅、action hook 和插件扩展。
- 掌握持久化、SSR 序列化、跨请求污染和安全边界。
- 能设计中大型项目的状态分层和 store 生命周期。

## 理论导读

Pinia 是 Vue 响应式系统上的应用状态层。它不是后端缓存，也不是所有组件状态的归宿。Pinia 的价值在于把跨组件共享状态、派生状态和修改动作组织成可追踪、可测试、可扩展的模块。

## Store 生命周期

setup store 本质上是一个组合式函数，但由 Pinia 管理实例、插件、DevTools、订阅和热更新。

```ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const total = computed(() => items.value.reduce((sum, item) => sum + item.price, 0))

  function add(item: CartItem) {
    items.value.push(item)
  }

  return { items, total, add }
})
```

同一个 Pinia 实例下，相同 id 的 store 是单例。SSR 中不能把 Pinia 实例做成跨请求全局单例，否则不同用户状态会污染。

## `storeToRefs` 的意义

直接解构 store 会丢失响应式连接：

```ts
const auth = useAuthStore()
const { user } = auth // 不推荐
```

应使用：

```ts
const { user, isLoggedIn } = storeToRefs(auth)
const { logout } = auth
```

state/getters 转 ref，actions 保持方法。

## 订阅和 action hook

```ts
const unsubscribe = store.$subscribe((mutation, state) => {
  console.log(mutation.type, state)
})

const stopAction = store.$onAction(({ name, args, after, onError }) => {
  const startedAt = performance.now()
  after(() => console.log(name, performance.now() - startedAt))
  onError(error => console.error(name, args, error))
})
```

应用场景：

- 状态持久化。
- action 耗时统计。
- 错误上报。
- 审计日志。

> **易错：** 在订阅里做复杂业务逻辑，导致状态变化触发隐藏副作用。订阅适合横切能力，不适合业务主流程。

## 插件扩展

Pinia 插件可以给 store 增加属性、订阅变化、接入持久化。

```ts
import type { PiniaPluginContext } from 'pinia'

export function persistPlugin({ store }: PiniaPluginContext) {
  const key = `pinia:${store.$id}`
  const saved = localStorage.getItem(key)
  if (saved) store.$patch(JSON.parse(saved))

  store.$subscribe((_mutation, state) => {
    localStorage.setItem(key, JSON.stringify(state))
  })
}
```

真实项目要加入：

- 白名单 store。
- 字段级过滤。
- 版本号和迁移。
- 过期时间。
- 加密或不持久化敏感字段。

## SSR 风险

SSR 中状态会从服务端序列化到 HTML，再由客户端恢复。风险包括：

- 跨请求 Pinia 实例复用，用户 A 状态泄露给用户 B。
- 序列化内容包含敏感信息。
- JSON 注入导致 XSS。
- 客户端恢复状态与服务端 HTML 不一致。

安全原则：

- 每个请求创建新的 app 和 pinia。
- 只序列化客户端必要状态。
- 对序列化内容做安全转义。
- token 等敏感信息优先走 HttpOnly Cookie，而不是注入 HTML。

## 状态分层决策表

| 状态 | 推荐位置 | 理由 |
| --- | --- | --- |
| 当前用户、权限、主题 | Pinia | 多页面共享 |
| 列表查询条件 | URL query | 可分享、可刷新恢复 |
| 表单草稿 | 组件本地或 composable | 避免污染原始数据 |
| 服务端列表数据 | 页面状态或请求缓存 | 有过期和重新验证语义 |
| 弹窗开关 | 组件本地 | 生命周期短 |
| token | 视安全策略而定 | localStorage 有 XSS 风险 |

## 练习

为 `auth` store 实现持久化插件：

- 只持久化 `token` 和 `rememberMe`。
- 保存版本号。
- 过期后自动清理。
- 退出登录后清理所有相关 store。

## 验收

- 刷新后能恢复登录态。
- 用户隐私字段不会进入 localStorage。
- SSR 场景下不会跨请求共享 store。

## 重点

- Pinia 管理应用状态，不管理所有状态。
- 持久化是安全和生命周期问题，不是简单 JSON 存储。

## 难点

- 服务端状态、客户端状态、持久化状态三者不一致时，容易出现 hydration、权限和缓存问题。
