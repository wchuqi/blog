---
title: "Nginx学习资料：servername 和 location 匹配算法深度解析"
date: 2026-06-20
description: "servername 常见优先级：精确名称优先，其次通配符和正则等规则。复杂情况下以官方规则和 nginx -T 验证。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：server_name 和 location 匹配算法深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 深入理解 server 和 location 选择算法。
- 能精确预测请求命中哪个配置块。
- 排查多虚拟主机和正则 location 冲突。

## server 选择

简化：

1. 根据本地地址端口选择 listen 候选。
2. TLS 阶段可能用 SNI 选择证书和 server。
3. HTTP Host 参与 server_name 匹配。
4. 未匹配使用 default_server。

server_name 常见优先级：精确名称优先，其次通配符和正则等规则。复杂情况下以官方规则和 `nginx -T` 验证。

## location 选择

常见规则心智模型：

1. `=` 精确匹配命中则结束。
2. 找最长前缀匹配。
3. 若最长前缀带 `^~`，跳过正则。
4. 按配置顺序测试正则 location，首个匹配使用。
5. 若无正则命中，使用最长前缀。

## 练习

配置：

```nginx
location = /a {}
location ^~ /a/static/ {}
location /a/ {}
location ~ \.php$ {}
location / {}
```

推导：

- `/a`
- `/a/x.php`
- `/a/static/x.php`

## 验收

- 能背出 location 选择流程。
- 能解释 `^~` 的作用。
- 能说明正则 location 按配置顺序测试。

## 易错

> **易错：** 认为最长前缀一定最终生效。
>
> 正确做法：最长前缀后仍可能被正则 location 覆盖，除非使用 `^~`。

