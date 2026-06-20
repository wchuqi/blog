---
title: "Vue3学习资料：Vue Router 路由匹配、守卫和懒加载"
date: 2026-06-20
description: "Vue Router 管理的是“当前 URL 对应哪个组件树”。它不是权限系统本身，但经常承担入口拦截、页面切换、参数解析和按需加载职责。路由设计会直接影响应用的信息架构。"
tags:
  - "框架"
  - "Vue3"
category: "框架"
---

# Vue3学习资料：Vue Router 路由匹配、守卫和懒加载

[返回索引](../Vue3学习资料.md)

## 学习目标

- 掌握路由配置、动态路由、嵌套路由、懒加载和导航守卫。
- 理解路由匹配、参数变化和守卫执行顺序。
- 能设计登录权限和菜单生成。

## 理论导读

Vue Router 管理的是“当前 URL 对应哪个组件树”。它不是权限系统本身，但经常承担入口拦截、页面切换、参数解析和按需加载职责。路由设计会直接影响应用的信息架构。

## 核心心智模型

路由像地图：path 是地址，route record 是地点配置，router-view 是占位出口，导航守卫是检查站，懒加载是到达地点时再装载资源。

## 知识点详解

```ts
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('@/views/HomeView.vue') },
    {
      path: '/users/:id',
      name: 'user-detail',
      component: () => import('@/views/UserDetail.vue'),
      props: true,
      meta: { requiresAuth: true }
    }
  ]
})
```

守卫基本顺序可理解为：触发导航、离开旧组件、全局前置守卫、路由独享守卫、进入组件守卫、确认导航、全局后置钩子、DOM 更新。实际项目中优先把认证、权限这类横切逻辑放全局守卫。

## 例子

```ts
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})
```

## 练习

实现登录页、受保护的用户列表页、动态用户详情页。未登录访问受保护页面时跳到登录页，登录后回到原页面。

## 验收

- 页面刷新后权限状态能恢复。
- 路由参数变化时详情数据会重新加载。
- 懒加载页面能正常拆包。

## 重点

- 动态路由参数变化时，组件可能复用，不一定重新创建。
- 权限元信息可以放 `meta`，但最终权限判断要结合用户身份和后端授权。

## 难点

- 守卫里跳转不当会造成无限重定向。

## 易错

> **易错：** 在 `beforeEach` 中任何未登录情况都跳 `/login`，包括已经在 `/login`。
>
> 正确做法：先判断目标是否需要登录，并排除登录页本身。
