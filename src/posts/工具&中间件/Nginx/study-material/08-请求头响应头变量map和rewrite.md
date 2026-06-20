---
title: "Nginx学习资料：请求头、响应头、变量、map 和 rewrite"
date: 2026-06-20
description: "Nginx 变量在请求处理过程中求值。map 可以在 http context 定义变量映射，比在 location 中写大量 if 更清晰。rewrite 用于 URI 重写，return 用于直接返回响应或重定向。滥用 if 和 rew…"
tags:
  - "工具&中间件"
  - "Nginx"
category: "工具&中间件"
---

# Nginx学习资料：请求头、响应头、变量、map 和 rewrite

[返回索引](../Nginx学习资料.md)

## 学习目标

- 掌握常用变量和 header 设置。
- 使用 map 做条件映射。
- 理解 rewrite 和 return 的区别。

## 理论导读

Nginx 变量在请求处理过程中求值。`map` 可以在 http context 定义变量映射，比在 location 中写大量 if 更清晰。rewrite 用于 URI 重写，return 用于直接返回响应或重定向。滥用 if 和 rewrite 是常见配置风险。

## 请求头和响应头

```nginx
proxy_set_header Host $host;
proxy_set_header X-Request-ID $request_id;

add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
```

## map

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    "" close;
}
```

常用于 WebSocket、灰度、日志字段和条件变量。

## return

```nginx
return 301 https://$host$request_uri;
```

## rewrite

```nginx
rewrite ^/old/(.*)$ /new/$1 last;
```

rewrite flag：

- last：重新走 location 匹配。
- break：停止当前 rewrite 处理。
- redirect/permanent：返回重定向。

## 练习

1. 用 map 配置 WebSocket Connection 头。
2. 用 return 做 HTTP 到 HTTPS 跳转。
3. 比较 rewrite last 和 break。

## 验收

- 能写常用代理 header。
- 能用 map 替代复杂 if。
- 能说明 return 和 rewrite 差异。

## 重点

- `add_header` 默认只对部分状态码生效，常需 `always`。
- map 在 http context 定义。
- rewrite 会影响 URI 和 location 流程。

## 易错

> **易错：** 在 location 里堆很多 if 做复杂逻辑。
>
> 正确做法：优先用 map、独立 location、return 或上游应用处理复杂逻辑。

