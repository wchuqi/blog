---
title: "Nginx学习资料：HTTP 请求解析状态机、URI 归一化和变量求值深度解析"
date: 2026-06-20
description: "Nginx 在选择 location 前会解析请求行和 URI。URI 可能包含 percent encoding、重复斜杠、.、.. 等形式。不同变量代表原始 URI、规范化 URI 或带查询字符串的 URI。配置中混用 $uri、$re…"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：HTTP 请求解析状态机、URI 归一化和变量求值深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 理解 HTTP 请求行、header、body 解析。
- 掌握 URI 归一化和变量求值时机。
- 能解释路径匹配、安全和代理转发中的细节差异。

## 理论导读

Nginx 在选择 location 前会解析请求行和 URI。URI 可能包含 percent encoding、重复斜杠、`.`、`..` 等形式。不同变量代表原始 URI、规范化 URI 或带查询字符串的 URI。配置中混用 `$uri`、`$request_uri`、`$document_uri` 会导致缓存 key、转发路径和安全判断差异。

## 常见变量

| 变量 | 含义 |
| --- | --- |
| `$request_uri` | 原始请求 URI，包含查询字符串 |
| `$uri` | 规范化后的 URI，不含查询字符串 |
| `$args` | 查询字符串 |
| `$is_args` | 有 query 时为 `?` |
| `$document_uri` | 通常等同 `$uri` |

## URI 归一化影响

影响：

- location 匹配。
- root/alias 文件路径。
- try_files。
- proxy_pass 转发。
- cache key。

如果缓存 key 用 `$uri`，可能把不同原始请求归并；如果用 `$request_uri`，可能保留查询参数差异。

## 变量求值

变量不是配置解析时固定值，而是在请求处理时求值。某些变量计算有成本，某些变量在不同阶段值会变化，如 rewrite 后 `$uri` 可能改变。

## 练习

1. 请求 `/a/%2e%2e/b?x=1`，观察 `$request_uri` 和 `$uri`。
2. rewrite 后输出 `$uri`。
3. 比较 cache key 使用 `$uri` 和 `$request_uri`。

## 验收

- 能区分 `$uri` 和 `$request_uri`。
- 能说明 URI 规范化影响匹配和缓存。
- 能识别路径安全判断的变量风险。

## 易错

> **易错：** 用 `$request_uri` 做文件路径判断。
>
> 正确做法：文件映射应基于规范化 URI 和安全的 root/alias 规则。

