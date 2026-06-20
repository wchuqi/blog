---
title: "Vue3学习资料：测试策略、Mock、组件契约和 E2E 深度解析"
date: 2026-06-20
description: "测试不是为了覆盖率数字，而是为了保护业务行为。Vue 项目常见问题是：只测快照、不测交互；只测工具函数、不测组件契约；E2E 依赖真实环境导致不稳定；mock 太深导致测试和真实行为脱节。有效测试要按风险分层。"
tags:
  - "框架"
  - "Vue3"
  - "深度解析"
category: "框架"
---

# Vue3学习资料：测试策略、Mock、组件契约和 E2E 深度解析

[返回索引](../Vue3学习资料.md)

## 学习目标

- 掌握 Vue 项目的测试分层和取舍。
- 能测试 composable、组件契约、Router、Pinia、请求和 E2E 主流程。
- 能避免脆弱测试、过度 mock 和不稳定 E2E。

## 理论导读

测试不是为了覆盖率数字，而是为了保护业务行为。Vue 项目常见问题是：只测快照、不测交互；只测工具函数、不测组件契约；E2E 依赖真实环境导致不稳定；mock 太深导致测试和真实行为脱节。有效测试要按风险分层。

## 测试分层

| 层级 | 测什么 | 工具 |
| --- | --- | --- |
| 单元测试 | 纯函数、composable、状态机 | Vitest |
| 组件测试 | props、emits、slots、用户交互 | Vue Test Utils |
| 集成测试 | Router、Pinia、请求 mock | Vitest + Testing Library/MSW |
| E2E | 登录、权限、提交等关键路径 | Playwright/Cypress |
| 可访问性 | 表单标签、键盘、ARIA | axe、Playwright |

## Composable 测试

```ts
import { describe, expect, it } from 'vitest'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  it('resets page to 1', () => {
    const { page, reset } = usePagination()
    page.value = 5
    reset()
    expect(page.value).toBe(1)
  })
})
```

如果 composable 使用生命周期，需要放进测试组件或使用专门的 mount helper。

## 组件契约测试

组件测试应关注“父组件如何使用它”：

```ts
it('emits update when user types', async () => {
  const wrapper = mount(UserFilter, {
    props: { modelValue: '' }
  })

  await wrapper.find('input').setValue('alice')
  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['alice'])
})
```

不要测试组件内部变量名、实现函数名、DOM 过细结构。

## Router 和 Pinia 测试

Pinia 可创建测试实例。重点测试 action 后状态变化、权限判断、退出清理。

Router 测试重点：

- 未登录跳登录。
- 登录后回跳。
- 无权限跳 403。
- 参数变化重新加载。

## 网络 Mock

推荐在测试中 mock 网络边界，而不是 mock 业务函数内部细节。MSW 这类工具能模拟真实 HTTP 行为，减少“测试里过了，真实接口挂了”的差距。

## E2E 稳定性原则

- 使用稳定选择器，例如 `data-testid` 或可访问名称。
- 避免固定等待时间，等待明确状态。
- 测关键路径，不把所有边界都放 E2E。
- 测试数据可控，可重复初始化。
- 失败时保留截图、trace、video。

Playwright 示例：

```ts
test('login and open user list', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('admin')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
})
```

## 测试反模式

| 反模式 | 问题 |
| --- | --- |
| 大量快照测试 | 改一点结构就失败，但不说明行为错 |
| 测实现细节 | 重构会破坏测试，但用户行为没变 |
| 所有接口真实调用 | 慢、不稳定、依赖外部环境 |
| E2E 覆盖所有边界 | 成本高、定位难 |
| mock 掉被测逻辑 | 测试失去意义 |

## 练习

给用户编辑模块补测试：

- composable：表单 dirty 判断。
- 组件：输入字段、校验错误、保存事件。
- Pinia：保存成功更新用户缓存。
- Router：未保存离开拦截。
- E2E：登录、打开用户、编辑保存。

## 验收

- 测试失败能明确指出行为问题。
- E2E 不依赖固定 sleep。
- 网络错误、校验错误、成功保存都有测试。

## 重点

- 好测试保护用户行为和组件契约，不保护内部写法。

## 易错

> **易错：** 为了追求覆盖率，把所有内部函数都测一遍。
>
> 正确做法：按风险和行为价值分配测试，覆盖关键路径和高风险边界。
