---
title: "Vue3学习资料：Pinia 状态管理和持久化边界"
date: 2026-06-20
description: "Pinia 是 Vue 官方推荐的状态管理库。它适合保存跨组件、跨页面共享且有明确生命周期的状态。不是所有状态都应该进入 Pinia：表单草稿、弹窗开关、临时筛选条件通常留在组件或 URL 中更清晰。"
tags:
  - "框架"
  - "Vue3"
category: "框架"
---

# Vue3学习资料：Pinia 状态管理和持久化边界

[返回索引](../Vue3学习资料.md)

## 学习目标

- 掌握 Pinia store、state、getters、actions。
- 理解全局状态、本地状态、服务端缓存的边界。
- 能设计登录态、用户信息、权限菜单等共享状态。

## 理论导读

Pinia 是 Vue 官方推荐的状态管理库。它适合保存跨组件、跨页面共享且有明确生命周期的状态。不是所有状态都应该进入 Pinia：表单草稿、弹窗开关、临时筛选条件通常留在组件或 URL 中更清晰。

## 核心心智模型

Pinia 像公共仓库，只存多处需要共享的物品。每个房间临时使用的工具没必要搬进公共仓库，否则所有人都要为杂乱买单。

## 知识点详解

```ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const roles = ref<string[]>([])
  const isLoggedIn = computed(() => Boolean(token.value))

  function setToken(value: string) {
    token.value = value
    localStorage.setItem('token', value)
  }

  function logout() {
    token.value = null
    roles.value = []
    localStorage.removeItem('token')
  }

  return { token, roles, isLoggedIn, setToken, logout }
})
```

## 状态边界

| 状态 | 推荐位置 |
| --- | --- |
| 当前用户、token、权限 | Pinia |
| 表单草稿 | 组件本地 |
| 列表筛选条件 | URL query 或组件本地 |
| 服务端分页数据 | 请求缓存库或页面状态 |
| 主题、语言 | Pinia 或 provide/inject |

## 练习

实现 `auth` store 和 `permission` store：登录后保存 token，拉取用户信息，生成菜单，退出时清理状态。

## 验收

- 刷新页面后能恢复 token。
- 退出登录后菜单、用户信息、缓存状态清理完整。
- store action 不直接依赖某个组件实例。

## 重点

- Pinia action 可以异步。
- store 是应用级状态，不是组件垃圾桶。

## 难点

- 持久化状态要考虑过期、版本迁移和敏感信息安全。

## 易错

> **易错：** 把 token、refresh token、用户隐私数据无脑放 localStorage。
>
> 正确做法：根据安全要求选择 HttpOnly Cookie、内存、短期 token 和刷新机制。
