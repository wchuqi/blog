---
title: "Nginx学习路线图"
date: 2026-06-20
description: "目标：理解 Nginx 是高性能 Web 服务器、反向代理、负载均衡器和四层代理。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "学习路线图"
category: "工具&中间件"
---

# Nginx学习路线图

## 阶段 1：基础认知

- 目标：理解 Nginx 是高性能 Web 服务器、反向代理、负载均衡器和四层代理。
- 需要掌握：master/worker、配置 context、server、location、静态资源、反向代理。
- 例子：配置一个静态站点和一个后端 API 反向代理。
- 练习：写 `server`，同时服务 `/static/` 和 `/api/`。
- 验收：能解释请求如何进入 server 和 location。
- 重点：Nginx 的难点是匹配算法和指令作用域。
- 易错：把配置文件当顺序 if-else，不理解 server/location 的选择规则。

## 阶段 2：核心配置能力

- 目标：掌握 `listen`、`server_name`、`location`、`root`、`alias`、`try_files`、`proxy_pass`。
- 需要掌握：精确匹配、前缀匹配、正则匹配、URI 替换、转发头、超时、buffer。
- 例子：前端 SPA + 后端 API + 静态资源缓存。
- 练习：修复 `alias` 配错导致 404 和路径泄漏的问题。
- 验收：能写出路径、代理、fallback 和错误页配置。
- 重点：`proxy_pass` 是否带 URI 会改变转发路径。
- 易错：`location /img/ { alias /data/img; }` 少了尾部 `/`。

## 阶段 3：生产代理和安全

- 目标：能配置 upstream、负载均衡、TLS、安全头、限流、访问控制和日志。
- 需要掌握：upstream keepalive、proxy headers、TLS SNI、HSTS、CORS、limit_req、limit_conn、access log。
- 例子：为一组后端服务配置 HTTPS 反向代理和限流。
- 练习：模拟后端超时、连接失败和 502。
- 验收：能根据日志定位是 Nginx、网络、upstream 还是客户端问题。
- 重点：Nginx 是流量入口，配置错误会放大业务故障。
- 易错：只配置 `proxy_pass`，不配置超时、header、日志和上游连接池。

## 阶段 4：性能和可观测性

- 目标：理解 worker、event loop、sendfile、buffer、连接数、文件描述符和内核参数。
- 需要掌握：worker_processes、worker_connections、keepalive_timeout、sendfile、access log、stub_status、错误日志。
- 例子：压测静态文件和反向代理，观察 P99 延迟。
- 练习：调整 worker、buffer 和 keepalive，比较效果。
- 验收：能解释连接数上限、文件描述符和 upstream 连接池的关系。
- 重点：性能调优要基于瓶颈，不能盲目改参数。
- 易错：只改 `worker_connections`，忘记系统 `ulimit`。

## 阶段 5：机制级深入和生产事故

- 目标：能解释 Nginx 请求处理阶段、模块执行链、配置 merge、server/location 算法、proxy 缓冲和 TLS 握手。
- 需要掌握：rewrite/access/content/log 阶段、配置继承、location 匹配、proxy_pass URI 替换、缓存键、限流算法、内核网络队列。
- 例子：解释一次 `/api/v1/users?x=1` 从 socket 到 upstream 的完整路径。
- 练习：完成 36 的深度实验和 35 的事故复盘模板。
- 验收：能从日志和配置推断请求命中了哪个 server、哪个 location、转发到了哪个 upstream、为什么返回 404/502/499。
- 重点：Nginx 深度能力是可预测配置结果。
- 易错：遇到问题只重启，不先 `nginx -T`、看匹配路径和 upstream 日志。

## 阶段 6：入口架构、协议边界和安全攻防

- 目标：能设计 CDN/LB/Nginx/App 端到端入口链路，并解释真实 IP、PROXY protocol、DNS resolver、HTTP 协议选择、大文件缓冲、安全攻防和零停机 reload。
- 需要掌握：模块生命周期、URI 解析状态机、变量求值时机、real_ip 信任链、动态 DNS、容器服务发现、ETag/Vary、临时文件、499/502/504 TCP 时序、HTTP/2/3、Ingress、Lua/njs 扩展、Host 头攻击、请求走私、容量压测。
- 例子：解释一次客户端 60 秒超时导致 499，同时 upstream 仍在处理，Nginx buffer 写临时文件，应用继续占用线程的完整链路。
- 练习：完成 37 到 50 的深度实验和事故复盘。
- 验收：能给出入口架构图、真实 IP 信任链、超时矩阵、容量模型和安全检查表。
- 重点：Nginx 是入口系统的一环，生产问题往往跨 CDN、LB、Nginx、应用和内核。
- 易错：只看 Nginx 单机配置，不看前后链路和客户端行为。

## 推荐学习节奏

| 周期 | 学习重点 | 产出 |
| --- | --- | --- |
| 第 1 周 | 安装、配置、server/location、静态资源 | 静态站点配置 |
| 第 2 周 | 反向代理、upstream、header、rewrite | API 网关式代理 |
| 第 3 周 | TLS、安全、限流、缓存、日志 | 生产入口配置 |
| 第 4 周 | 性能、reload、故障排查 | 排障手册 |
| 第 5 周 | 事件模型、模块阶段、匹配算法 | 深度机制笔记 |
| 第 6 周 | 压测、事故复盘、SLA | 上线验收报告 |
| 第 7 周 | real_ip、DNS、协议、大文件、安全攻防 | 入口安全和故障矩阵 |
| 第 8 周 | Ingress、扩展模块、容量压测、端到端架构 | 生产架构设计报告 |

## 最终能力清单

- 能写正确的 server/location/proxy 配置。
- 能解释 `root`、`alias`、`try_files`、`rewrite`、`proxy_pass` 的语义。
- 能配置 TLS、安全头、限流、缓存和日志。
- 能定位 301/403/404/499/502/504。
- 能解释 worker 事件模型、配置继承、匹配算法和 upstream 行为。
- 能做生产容量规划、压测和故障复盘。
- 能设计真实 IP 信任链、超时矩阵、缓存协商策略和零停机发布方案。
- 能识别 Host 头攻击、请求走私、路径穿越、SSRF 和错误代理边界。
