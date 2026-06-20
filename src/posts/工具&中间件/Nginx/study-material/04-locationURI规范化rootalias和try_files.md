---
title: "Nginx学习资料：location、URI 规范化、root、alias 和 tryfiles"
date: 2026-06-20
description: "location 是 Nginx 配置最容易出错的地方。请求 URI 会经过规范化，然后参与 location 匹配。root 是把 URI 拼到根目录后面；alias 是用指定路径替换 location 前缀。tryfiles 按顺序检查…"
tags:
  - "工具&中间件"
  - "Nginx"
category: "工具&中间件"
---

# Nginx学习资料：location、URI 规范化、root、alias 和 try_files

[返回索引](../Nginx学习资料.md)

## 学习目标

- 掌握 location 匹配类型和优先级。
- 正确使用 root、alias、try_files。
- 能排查 404、路径拼接错误和 SPA fallback。

## 理论导读

location 是 Nginx 配置最容易出错的地方。请求 URI 会经过规范化，然后参与 location 匹配。`root` 是把 URI 拼到根目录后面；`alias` 是用指定路径替换 location 前缀。`try_files` 按顺序检查文件，常用于静态资源和前端路由 fallback。

## location 类型

```nginx
location = /exact { }
location ^~ /static/ { }
location /api/ { }
location ~ \.php$ { }
location / { }
```

核心：精确匹配优先，前缀和正则有特定规则。生产中要避免 location 过多且互相覆盖。

## root

```nginx
location /static/ {
    root /var/www;
}
```

请求 `/static/a.js` 对应 `/var/www/static/a.js`。

## alias

```nginx
location /static/ {
    alias /data/assets/;
}
```

请求 `/static/a.js` 对应 `/data/assets/a.js`。

## try_files

```nginx
location / {
    root /var/www/app;
    try_files $uri $uri/ /index.html;
}
```

适合 SPA：文件存在返回文件，不存在回到 index.html。

## 练习

1. 比较 root 和 alias 路径。
2. 配置 SPA fallback。
3. 故意少写 alias 尾部 `/`，观察路径错误。

## 验收

- 能解释 root 和 alias 差异。
- 能推导请求命中的 location。
- 能写正确 `try_files`。

## 重点

- `root` 拼接 URI，`alias` 替换匹配前缀。
- location 匹配不是简单从上到下。
- `try_files` 内部可能触发内部重定向。

## 易错

> **易错：** 在前缀 location 中使用 alias 时路径尾部不匹配。
>
> 正确做法：`location /x/ { alias /data/x/; }` 保持前缀和目录尾部语义一致。

