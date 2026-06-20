---
title: "Vue3学习资料：组件实例、EffectScope、异步组件和 KeepAlive 深度解析"
date: 2026-06-20
description: "组件不是 .vue 文件本身，而是运行时创建的实例。实例保存 props、attrs、slots、setup state、render effect、生命周期钩子、父子关系、appContext 等。理解组件实例，就能理解为什么 props…"
tags:
  - "框架"
  - "Vue3"
  - "深度解析"
category: "框架"
---

# Vue3学习资料：组件实例、EffectScope、异步组件和 KeepAlive 深度解析

[返回索引](../Vue3学习资料.md)

## 学习目标

- 理解组件实例从创建到卸载的关键字段和生命周期。
- 掌握组件内部 effect scope、错误边界、异步组件、KeepAlive 缓存机制。
- 能排查组件未卸载、缓存状态异常、异步加载失败和副作用泄漏。

## 理论导读

组件不是 `.vue` 文件本身，而是运行时创建的实例。实例保存 props、attrs、slots、setup state、render effect、生命周期钩子、父子关系、appContext 等。理解组件实例，就能理解为什么 props 是只读边界、为什么 setup 只执行一次、为什么 KeepAlive 会让卸载变成停用。

## 组件实例生命周期粗图

```text
创建 vnode
  -> 创建组件实例
  -> 初始化 props / slots
  -> 执行 setup
  -> 建立 render effect
  -> 首次 patch 子树
  -> mounted
  -> 响应式触发 update
  -> beforeUnmount / unmounted
```

如果组件被 KeepAlive 包裹，离开时不是完整卸载，而是 deactivated；再次回来时 activated。

## 组件内的 EffectScope

组件 setup 中创建的 `computed`、`watch`、`watchEffect` 会被收集到组件作用域。组件卸载时，这些 effect 会停止。这就是为什么大多数情况下你不需要手动停止组件内 watch。

但以下情况仍要手动清理：

- DOM 事件监听。
- setInterval / setTimeout。
- WebSocket / EventSource。
- 第三方图表、编辑器、地图实例。
- 组件外部创建的 effect scope。

## 异步组件状态机

`defineAsyncComponent` 不是简单 import，它能表达加载组件时的状态：

```ts
import { defineAsyncComponent } from 'vue'

const UserPanel = defineAsyncComponent({
  loader: () => import('./UserPanel.vue'),
  delay: 200,
  timeout: 5000,
  suspensible: true,
  onError(error, retry, fail, attempts) {
    if (attempts <= 3) retry()
    else fail()
  }
})
```

关键边界：

- `delay` 避免闪烁式 loading。
- `timeout` 防止无限等待。
- `onError` 可重试，但要有上限。
- SSR + Suspense 下要考虑服务端是否等待异步依赖。

## KeepAlive 缓存机制

KeepAlive 会缓存组件实例，而不是缓存 DOM 字符串。它根据组件类型和 key 判断缓存身份，可配合 `include`、`exclude`、`max` 控制缓存。

```vue
<KeepAlive :max="10">
  <RouterView />
</KeepAlive>
```

实际项目更常见写法是对路由组件按 meta 控制：

```vue
<RouterView v-slot="{ Component, route }">
  <KeepAlive>
    <component
      v-if="route.meta.keepAlive"
      :is="Component"
      :key="route.fullPath"
    />
  </KeepAlive>
  <component
    v-else
    :is="Component"
    :key="route.fullPath"
  />
</RouterView>
```

`key` 选择会影响缓存粒度：用 `route.name` 可能同一个详情页参数变化复用缓存；用 `route.fullPath` 会按完整 URL 缓存，可能缓存过多。

## 错误捕获边界

`onErrorCaptured` 可捕获后代组件渲染、事件、生命周期等错误。它适合局部降级，不适合吞掉所有错误。

```ts
onErrorCaptured((error, instance, info) => {
  console.error(error, info)
  return false
})
```

返回 `false` 可阻止继续向上传播。生产中仍应把错误上报到监控系统。

## 排障清单

| 现象 | 可能原因 | 检查点 |
| --- | --- | --- |
| 页面离开后请求仍在写状态 | 异步任务未取消 | `onUnmounted`、AbortController |
| 返回页面状态没重置 | KeepAlive 缓存实例 | `activated/deactivated`、route key |
| 缓存页面越来越多 | `fullPath` 作为 key 且无 max | 缓存策略、LRU、手动清理 |
| 异步组件一直 loading | loader 失败但无错误组件 | timeout、onError、网络路径 |
| 弹窗 Teleport 后样式异常 | 作用域和挂载位置不同 | z-index、CSS 变量、滚动锁 |

## 练习

实现一个可缓存的用户详情页：

- 用户列表进入详情后缓存详情页。
- 切换不同用户时按用户 ID 决定是否复用。
- 详情页有轮询，停用时暂停，激活时恢复。
- 最多缓存 5 个详情页。

## 验收

- 能解释 mounted、activated、deactivated、unmounted 的区别。
- 能说明 KeepAlive 缓存的是组件实例。
- 能定位并修复一个定时器泄漏问题。

## 重点

- 组件生命周期不等于 DOM 生命周期，KeepAlive 会改变组件卸载语义。

## 易错

> **易错：** 以为进入 KeepAlive 的组件离开页面就会触发 `onUnmounted`。
>
> 正确做法：缓存组件离开时使用 `onDeactivated` 做暂停逻辑，真正销毁才用 `onUnmounted`。
