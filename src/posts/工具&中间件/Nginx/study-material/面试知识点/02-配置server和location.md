---
title: "Nginx面试知识点：配置、server 和 location"
date: 2026-06-20
description: "先根据监听地址和端口选择候选 server，再根据 Host 或 TLS SNI 匹配 servername。没有匹配时使用该 listen 的 defaultserver。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "面试"
category: "工具&中间件"
---

# Nginx面试知识点：配置、server 和 location

[返回面试索引](../21-面试知识点整理.md)

[返回学习资料索引](../../Nginx学习资料.md)

## 一、配置匹配

### 1. Nginx 如何选择 server？

**参考答案：**

先根据监听地址和端口选择候选 server，再根据 Host 或 TLS SNI 匹配 server_name。没有匹配时使用该 listen 的 default_server。

### 2. location 匹配优先级是什么？

**参考答案：**

精确匹配 `=` 命中直接使用；然后找最长前缀；若最长前缀是 `^~` 则跳过正则；否则按配置顺序匹配正则，首个正则命中使用；若无正则命中，使用最长前缀。

### 3. root 和 alias 有什么区别？

**参考答案：**

`root` 把请求 URI 拼接到指定目录后；`alias` 用指定目录替换 location 匹配前缀。`/img/a.png` 在 `root /data` 下是 `/data/img/a.png`，在 `alias /data/images/` 下是 `/data/images/a.png`。

### 4. try_files 做什么？

**参考答案：**

`try_files` 按顺序检查文件或目录是否存在，命中则返回，最后参数可触发内部重定向。常用于静态文件和 SPA fallback。

### 5. `^~` 的作用是什么？

**参考答案：**

当某个前缀 location 带 `^~` 且是最长前缀匹配时，Nginx 不再检查正则 location，直接使用该前缀 location。

