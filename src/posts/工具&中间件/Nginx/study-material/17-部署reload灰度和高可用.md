---
title: "Nginx学习资料：部署、reload、灰度和高可用"
date: 2026-06-20
description: "Nginx 配置变更是流量入口变更，必须可验证、可回滚、可观测。reload 通常平滑，但错误配置、证书错误、include 漏掉、upstream 不可达都会导致事故。生产发布要先语法检查，再低流量验证，再逐步扩大。"
tags:
  - "工具&中间件"
  - "Nginx"
category: "工具&中间件"
---

# Nginx学习资料：部署、reload、灰度和高可用

[返回索引](../Nginx学习资料.md)

## 学习目标

- 掌握安全变更流程。
- 理解 reload、回滚、灰度和高可用。
- 能设计 Nginx 生产发布流程。

## 理论导读

Nginx 配置变更是流量入口变更，必须可验证、可回滚、可观测。reload 通常平滑，但错误配置、证书错误、include 漏掉、upstream 不可达都会导致事故。生产发布要先语法检查，再低流量验证，再逐步扩大。

## 变更流程

```text
编辑配置
  -> nginx -t
  -> nginx -T 保存快照
  -> reload
  -> 健康检查
  -> 观察日志和指标
  -> 回滚预案
```

## 灰度方式

- 按域名。
- 按 header。
- 按 cookie。
- 按 IP 段。
- 使用 map 选择 upstream。

## 高可用

Nginx 本身可多实例部署，前面可用 LVS、云 LB、Keepalived、DNS 或 Ingress 控制器。单 Nginx 不是高可用。

## 练习

1. 写发布 checklist。
2. 用 map 做 header 灰度。
3. 模拟配置回滚。

## 验收

- 能写安全 reload 流程。
- 能说明高可用部署方式。
- 能设计灰度和回滚。

## 易错

> **易错：** `nginx -t` 通过就认为发布成功。
>
> 正确做法：还要做业务健康检查、外部访问验证和日志指标观察。

