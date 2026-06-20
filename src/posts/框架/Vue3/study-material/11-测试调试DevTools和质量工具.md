---
title: "Vue3学习资料：测试、调试、DevTools 和质量工具"
date: 2026-06-20
description: "前端测试不是只测 DOM 文本，而是验证用户行为、状态变化、边界条件和集成流程。Vue 项目通常使用 Vitest 做单元测试，Vue Test Utils 做组件测试，Playwright 或 Cypress 做 E2E。"
tags:
  - "框架"
  - "Vue3"
category: "框架"
---

# Vue3学习资料：测试、调试、DevTools 和质量工具

[返回索引](../Vue3学习资料.md)

## 学习目标

- 掌握 Vue DevTools、单元测试、组件测试、E2E 测试。
- 会测试 composable、组件交互和路由流程。
- 建立代码质量工具链。

## 理论导读

前端测试不是只测 DOM 文本，而是验证用户行为、状态变化、边界条件和集成流程。Vue 项目通常使用 Vitest 做单元测试，Vue Test Utils 做组件测试，Playwright 或 Cypress 做 E2E。

## 核心心智模型

测试像安全网：单元测试保护逻辑函数，组件测试保护交互契约，E2E 测试保护关键业务路径。每一层成本不同，不应全靠一种测试。

## 知识点详解

```ts
// useCounter.test.ts
import { describe, expect, it } from 'vitest'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('increments count', () => {
    const { count, increment } = useCounter()
    increment()
    expect(count.value).toBe(1)
  })
})
```

组件测试关注输入输出：

```ts
import { mount } from '@vue/test-utils'
import BaseButton from './BaseButton.vue'

it('emits click event', async () => {
  const wrapper = mount(BaseButton, { slots: { default: 'Save' } })
  await wrapper.trigger('click')
  expect(wrapper.emitted('click')).toHaveLength(1)
})
```

## 练习

给用户列表页补测试：空状态、加载状态、搜索过滤、点击详情跳转、接口失败提示。

## 验收

- `npm run test:unit` 通过。
- 核心 composable 有单元测试。
- 登录到列表页的关键路径有 E2E 测试。

## 重点

- 测试行为，不测试实现细节。
- DevTools 可查看组件树、props、事件、Pinia 状态和性能。

## 难点

- 异步组件、请求 mock、路由跳转需要等待 Promise 和 DOM 更新。

## 易错

> **易错：** 测试依赖真实后端接口。
>
> 正确做法：单元和组件测试 mock 网络；少量 E2E 使用稳定测试环境。
