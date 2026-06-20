---
title: "Nginx学习资料：URI、root、alias、tryfiles 和 rewrite 深度解析"
date: 2026-06-20
description: "Nginx 使用 URI 参与 location 匹配，静态文件阶段再映射到文件系统。不要把 URL 路径和磁盘路径混为一谈。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：URI、root、alias、try_files 和 rewrite 深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 深入理解 URI 与文件系统路径映射。
- 掌握 root、alias、try_files、rewrite 的组合风险。
- 能排查路径穿越、404 和错误 fallback。

## URI 和路径

Nginx 使用 URI 参与 location 匹配，静态文件阶段再映射到文件系统。不要把 URL 路径和磁盘路径混为一谈。

## root vs alias

```nginx
location /img/ {
    root /data;
}
```

`/img/a.png` -> `/data/img/a.png`

```nginx
location /img/ {
    alias /data/images/;
}
```

`/img/a.png` -> `/data/images/a.png`

## try_files 内部重定向

```nginx
try_files $uri $uri/ /index.html;
```

最后一个参数可以触发内部重定向。若写成命名 location，也会进入对应处理。

## rewrite flag

- last：改 URI 后重新查找 location。
- break：停止 rewrite，继续当前 location。
- permanent/redirect：返回重定向。

## 练习

1. 用 root/alias 推导路径。
2. 配置 SPA fallback，并避免 API 被 fallback。
3. 比较 rewrite last/break。

## 验收

- 能精确推导磁盘路径。
- 能说明 try_files 最后参数行为。
- 能避免 API 误返回 index.html。

## 易错

> **易错：** `/api/` 404 被 SPA fallback 成 200 index.html。
>
> 正确做法：API location 独立配置，不进入前端 try_files fallback。

