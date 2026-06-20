---
title: "Nginx学习资料：虚拟主机、listen 和 servername 匹配"
date: 2026-06-20
description: "Nginx 先根据本地监听地址和端口找到候选 server，再根据 Host/SNI 匹配 servername。若没有匹配，就使用该 listen 的默认 server。很多“配置没生效”问题，本质是请求命中了另一个 server。"
tags:
  - "工具&中间件"
  - "Nginx"
category: "工具&中间件"
---

# Nginx学习资料：虚拟主机、listen 和 server_name 匹配

[返回索引](../Nginx学习资料.md)

## 学习目标

- 理解 listen 地址端口和 server_name 匹配。
- 掌握默认 server。
- 能排查请求进入错误 server 的问题。

## 理论导读

Nginx 先根据本地监听地址和端口找到候选 server，再根据 Host/SNI 匹配 server_name。若没有匹配，就使用该 listen 的默认 server。很多“配置没生效”问题，本质是请求命中了另一个 server。

## listen

```nginx
server {
    listen 80 default_server;
    server_name _;
    return 444;
}
```

`default_server` 表示该地址端口下没有匹配时的默认虚拟主机。

## server_name

```nginx
server_name example.com www.example.com;
server_name *.example.com;
server_name ~^api\d+\.example\.com$;
```

匹配大致考虑精确名称、通配符、正则等规则。具体优先级详见深度章节。

## 排查

```bash
curl -H 'Host: example.com' http://127.0.0.1/
nginx -T | grep -n 'server_name'
```

## 练习

1. 配置两个 server，分别匹配不同域名。
2. 用 curl 指定 Host 验证命中。
3. 配置默认 server 拦截未知域名。

## 验收

- 能解释默认 server。
- 能用 curl 验证 Host 匹配。
- 能排查请求进入错误 server。

## 重点

- server 选择先看 listen，再看 server_name。
- 未匹配会进入默认 server。
- HTTPS 还涉及 SNI。

## 易错

> **易错：** 用 IP 访问时期待命中某个域名 server。
>
> 正确做法：带 Host 头测试，或配置正确默认 server。

