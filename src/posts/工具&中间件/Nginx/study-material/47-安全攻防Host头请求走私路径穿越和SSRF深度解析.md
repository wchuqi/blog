---
title: "Nginx学习资料：安全攻防：Host 头、请求走私、路径穿越和 SSRF 深度解析"
date: 2026-06-20
description: "如果应用使用 Host 生成链接、重置密码地址或回调地址，攻击者伪造 Host 可能造成安全问题。Nginx 应使用白名单 servername 和默认 server 拦截未知 Host。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "深度解析"
category: "工具&中间件"
---

# Nginx学习资料：安全攻防：Host 头、请求走私、路径穿越和 SSRF 深度解析

[返回索引](../Nginx学习资料.md)

## 学习目标

- 识别 Nginx 入口常见安全攻击面。
- 理解 Host header、请求走私、路径穿越、SSRF 的配置诱因。
- 建立安全审查清单。

## Host header injection

如果应用使用 Host 生成链接、重置密码地址或回调地址，攻击者伪造 Host 可能造成安全问题。Nginx 应使用白名单 server_name 和默认 server 拦截未知 Host。

## 请求走私

当前后端对 Content-Length、Transfer-Encoding 解析不一致时，可能出现请求边界混淆。Nginx、上游代理和应用服务器必须使用一致安全的协议处理，并避免不必要的 header 透传。

## 路径穿越

alias/root 配置错误、未规范化 URI、错误 rewrite 可能导致访问预期目录外文件。应限制隐藏文件、备份文件和上传目录执行。

## SSRF through proxy

如果 proxy_pass 使用用户可控变量拼接上游地址，可能让攻击者请求内网资源。

## 审查清单

- 默认 server 拒绝未知 Host。
- real_ip 只信任上游代理。
- 不把用户输入拼进 proxy_pass host。
- 禁止隐藏文件。
- CORS 白名单。
- 限制 body size。
- 日志记录 Host 和 request id。

## 验收

- 能解释 Host header 风险。
- 能说明请求走私的本质。
- 能识别变量 proxy_pass SSRF 风险。

## 易错

> **易错：** `proxy_pass http://$arg_target;`。
>
> 正确做法：上游地址必须来自白名单映射，不允许用户直接控制。

