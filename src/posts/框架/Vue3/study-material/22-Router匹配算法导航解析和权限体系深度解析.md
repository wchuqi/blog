---
title: "Vue3学习资料：Router 匹配算法、导航解析和权限体系深度解析"
date: 2026-06-20
description: "Router 的本质是 URL 到组件树的映射器。它不仅决定渲染哪个页面，也决定页面状态是否可分享、刷新后能否恢复、权限拦截是否可靠、动态路由是否会丢失。很多中后台问题不是组件问题，而是路由状态和权限状态没有建模清楚。"
tags:
  - "框架"
  - "Vue3"
  - "深度解析"
category: "框架"
---

# Vue3学习资料：Router 匹配算法、导航解析和权限体系深度解析

[返回索引](../Vue3学习资料.md)

## 学习目标

- 理解 Vue Router 如何匹配路径、解析参数和执行导航。
- 掌握完整导航守卫顺序、导航失败和动态路由边界。
- 能设计稳定的登录、权限、菜单、404、刷新恢复体系。

## 理论导读

Router 的本质是 URL 到组件树的映射器。它不仅决定渲染哪个页面，也决定页面状态是否可分享、刷新后能否恢复、权限拦截是否可靠、动态路由是否会丢失。很多中后台问题不是组件问题，而是路由状态和权限状态没有建模清楚。

## 路由匹配心智模型

路由配置会被转换成 matcher。matcher 根据 path 规则、动态参数、通配符、嵌套层级和优先级选择匹配记录。

```text
URL: /users/42?tab=roles
  -> path 匹配 /users/:id
  -> params: { id: '42' }
  -> query: { tab: 'roles' }
  -> matched records: layout -> user-detail
```

动态段、可选段、重复段和通配符都会影响匹配结果。业务上应避免过于模糊的 path 设计，例如 `/users/:id` 和 `/users/new` 顺序、命名和约束不清时容易误匹配。

## 导航解析顺序

一次导航可以拆成：

1. 触发导航：`router.push`、浏览器前进后退、链接点击。
2. 解析目标位置：标准化 path、query、params。
3. 找到离开的组件、复用的组件、进入的组件。
4. 执行离开守卫。
5. 执行全局前置守卫。
6. 执行路由独享守卫。
7. 执行组件进入或更新守卫。
8. 确认导航。
9. 执行全局后置钩子。
10. 渲染组件并更新 DOM。

> **重点：** 守卫是导航决策，不应在守卫里塞大量页面业务请求。

## 权限体系设计

权限路由至少要区分四件事：

| 层次 | 职责 |
| --- | --- |
| 认证 | 用户是否登录，token 是否有效 |
| 授权 | 用户能访问哪些页面和操作 |
| 菜单 | 用户可见入口，属于体验层 |
| 接口鉴权 | 后端真实安全边界 |

前端路由权限可以阻止用户进入页面，但不能替代后端接口鉴权。按钮隐藏也不是安全措施。

## 动态路由稳定方案

```ts
const publicRoutes = ['/login', '/403', '/404']
let routesReady = false

router.beforeEach(async to => {
  const auth = useAuthStore()
  const permission = usePermissionStore()

  if (publicRoutes.includes(to.path)) return true

  if (!auth.token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (!routesReady) {
    const user = await auth.fetchCurrentUser()
    const routes = permission.buildRoutes(user.permissions)
    routes.forEach(route => router.addRoute(route))
    routesReady = true
    return to.fullPath
  }

  if (!permission.canAccess(to)) return '/403'
})
```

关键点：

- 白名单先判断。
- 未登录只跳登录。
- 动态路由只添加一次，退出时要重置。
- 添加动态路由后要重新进入当前目标。
- 403 和 404 顺序要明确。

## 导航失败

重复导航、守卫取消、重定向、异步守卫抛错都可能形成导航失败。业务代码不要默认认为 `router.push` 一定成功。

```ts
const failure = await router.push('/users')
if (failure) {
  console.warn('navigation failed', failure)
}
```

## URL 状态设计

列表页筛选条件常适合放 query：

```text
/users?page=2&keyword=alice&role=admin
```

优点是刷新可恢复、可分享、浏览器前进后退可用。缺点是复杂对象不适合直接放 URL，需要压缩或只放关键条件。

## 排障剧本

| 现象 | 可能原因 | 处理 |
| --- | --- | --- |
| 登录后仍 404 | 动态路由添加后没有重新导航 | `return to.fullPath` |
| 退出后还能访问旧页面 | 动态路由未重置或缓存未清 | reset router、清 Pinia、清 KeepAlive |
| 守卫死循环 | 登录页不在白名单或每次都重定向 | 加白名单和状态机 |
| 详情参数变了数据不变 | 组件复用，mounted 不重跑 | watch params 或 `onBeforeRouteUpdate` |
| 菜单可见但页面 403 | 菜单权限和路由权限来源不一致 | 统一权限模型 |

## 练习

设计一个角色权限系统：

- 后端返回权限点。
- 前端根据权限点生成菜单和动态路由。
- 刷新后恢复。
- 退出后重置所有权限状态。
- 支持 403、404、登录后回跳。

## 验收

- 能画出导航守卫执行流程。
- 能解释动态路由为什么刷新会丢。
- 能区分菜单控制、页面控制和接口鉴权。

## 易错

> **易错：** 把菜单当权限源。
>
> 正确做法：权限源应来自认证授权结果；菜单只是权限结果的一种 UI 投影。
