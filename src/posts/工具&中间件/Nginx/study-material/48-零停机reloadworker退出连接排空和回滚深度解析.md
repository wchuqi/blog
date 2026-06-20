---
title: "Nginx学习资料：零停机 reload、worker 退出、连接排空和回滚深度解析"
date: 2026-06-20
description: "新请求进入新 worker，旧连接仍由旧 worker 处理。长连接可能让旧 worker 长期存在。需要结合："
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：零停机 reload、worker 退出、连接排空和回滚深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 深入理解零停机 reload 的真实边界。
- 设计连接排空、长连接处理和回滚流程。
- 避免 reload 风暴和旧 worker 残留。

## reload 不是瞬间切换

新请求进入新 worker，旧连接仍由旧 worker 处理。长连接可能让旧 worker 长期存在。需要结合：

- worker_shutdown_timeout。
- keepalive_timeout。
- WebSocket/SSE 超时。
- upstream 长请求。

## 回滚

回滚流程：

1. 保留上一个 `nginx -T`。
2. 恢复配置和证书。
3. `nginx -t`。
4. reload。
5. 验证关键域名和路径。

## reload 风暴

配置系统频繁 reload 会造成 CPU 抖动、连接变化和 worker 积压。Ingress Controller 场景尤其要关注。

## 验收

- 能解释新旧 worker 并存。
- 能处理长连接发布。
- 能写回滚 checklist。

## 易错

> **易错：** 用 restart 做常规配置发布。
>
> 正确做法：优先 reload，只有必要时计划性 restart。

