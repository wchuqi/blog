---
title: "Vue3学习资料：SSR、Hydration、部署和安全"
date: 2026-06-20
description: "普通 Vue SPA 在浏览器中渲染，首屏 HTML 主要是挂载点和脚本。SSR 会在服务端先生成 HTML，浏览器加载后再进行 hydration，把静态 HTML 接管成可交互应用。SSR 改善首屏和 SEO，但引入服务端运行、数据预取…"
tags:
  - "框架"
  - "Vue3"
category: "框架"
---

# Vue3学习资料：SSR、Hydration、部署和安全

[返回索引](../Vue3学习资料.md)

## 学习目标

- 理解 CSR、SSR、SSG、hydration 的差异。
- 掌握 Vue 应用部署、环境变量、缓存、安全基础。
- 能排查水合不一致和生产白屏。

## 理论导读

普通 Vue SPA 在浏览器中渲染，首屏 HTML 主要是挂载点和脚本。SSR 会在服务端先生成 HTML，浏览器加载后再进行 hydration，把静态 HTML 接管成可交互应用。SSR 改善首屏和 SEO，但引入服务端运行、数据预取、水合一致性和部署复杂度。

## 核心心智模型

SSR 像服务端先把页面“拍平”寄给浏览器，hydration 再给页面接上线。服务端生成的结构和客户端第一次渲染必须一致，否则接线会错。

## 知识点详解

| 模式 | 优点 | 风险 |
| --- | --- | --- |
| CSR | 架构简单，部署静态资源即可 | 首屏和 SEO 可能较弱 |
| SSR | 首屏 HTML 完整，利于 SEO | 服务器成本、水合一致性、缓存复杂 |
| SSG | 预生成页面，速度快 | 动态个性化弱 |
| Islands/部分水合 | 减少客户端 JS | 架构和框架选择更复杂 |

部署关注点：

- `base` 路径与静态资源路径。
- History 模式需要服务端 fallback 到 `index.html`。
- 环境变量只暴露 `VITE_` 前缀变量。
- API 代理、CORS、Cookie SameSite、CSRF。
- CSP、XSS 防护、依赖供应链扫描。

## 练习

把 Vue SPA 构建后部署到 Nginx，并配置 History fallback。再故意刷新二级路由，验证不会 404。

## 验收

- `npm run build` 产物可预览。
- 二级路由刷新正常。
- 不把密钥写进前端环境变量。

## 重点

- 前端代码里的变量最终会被用户看到，不能放服务端密钥。
- SSR 要保证服务端和客户端首轮渲染一致。

## 难点

- 使用时间、随机数、浏览器专属 API 时，SSR 很容易出现水合不一致。

## 易错

> **易错：** 在 SSR 首次渲染中直接访问 `window`、`document`、`localStorage`。
>
> 正确做法：只在客户端生命周期中访问，或先判断运行环境。
