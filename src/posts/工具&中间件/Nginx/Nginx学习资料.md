---
title: "Nginx学习资料"
date: 2026-06-20
description: "这是一份面向后端开发、运维、DevOps、SRE 和面试复习的 Nginx 学习资料。内容不仅覆盖常用配置，还重点解释配置上下文、server 和 location 匹配算法、URI 规范化、root/alias、proxypass、ups…"
tags:
  - "工具&中间件"
  - "Nginx"
  - "学习资料总览"
category: "工具&中间件"
---

# Nginx学习资料

这是一份面向后端开发、运维、DevOps、SRE 和面试复习的 Nginx 学习资料。内容不仅覆盖常用配置，还重点解释配置上下文、server 和 location 匹配算法、URI 规范化、`root`/`alias`、`proxy_pass`、upstream、缓存、TLS、限流、事件模型、模块执行链、性能和生产故障。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 安装、配置、命令和目录结构 | [01-安装配置命令和目录结构.md](study-material/01-安装配置命令和目录结构.md) |
| 2 | 配置文件结构、context 和指令继承 | [02-配置文件结构context和指令继承.md](study-material/02-配置文件结构context和指令继承.md) |
| 3 | 虚拟主机、listen 和 server_name 匹配 | [03-虚拟主机listen和server_name匹配.md](study-material/03-虚拟主机listen和server_name匹配.md) |
| 4 | location、URI 规范化、root、alias 和 try_files | [04-locationURI规范化rootalias和try_files.md](study-material/04-locationURI规范化rootalias和try_files.md) |
| 5 | 静态资源、索引、目录和缓存头 | [05-静态资源索引目录和缓存头.md](study-material/05-静态资源索引目录和缓存头.md) |
| 6 | 反向代理 proxy 和上游 HTTP | [06-反向代理proxy和上游HTTP.md](study-material/06-反向代理proxy和上游HTTP.md) |
| 7 | upstream、负载均衡、keepalive 和健康检查 | [07-upstream负载均衡keepalive和健康检查.md](study-material/07-upstream负载均衡keepalive和健康检查.md) |
| 8 | 请求头、响应头、变量、map 和 rewrite | [08-请求头响应头变量map和rewrite.md](study-material/08-请求头响应头变量map和rewrite.md) |
| 9 | TLS、HTTPS、证书和安全配置 | [09-TLSHTTPS证书和安全配置.md](study-material/09-TLSHTTPS证书和安全配置.md) |
| 10 | HTTP/2、WebSocket、gRPC 和长连接 | [10-HTTP2WebSocketgRPC和长连接.md](study-material/10-HTTP2WebSocketgRPC和长连接.md) |
| 11 | proxy_cache 和缓存一致性 | [11-proxy_cache和缓存一致性.md](study-material/11-proxy_cache和缓存一致性.md) |
| 12 | 限流、限速、访问控制和鉴权 | [12-限流限速访问控制和鉴权.md](study-material/12-限流限速访问控制和鉴权.md) |
| 13 | 日志、监控、stub_status 和可观测性 | [13-日志监控stub_status和可观测性.md](study-material/13-日志监控stub_status和可观测性.md) |
| 14 | 性能优化、worker、事件、sendfile 和 buffer | [14-性能优化worker事件sendfile和buffer.md](study-material/14-性能优化worker事件sendfile和buffer.md) |
| 15 | 安全加固、CORS、安全头和常见漏洞 | [15-安全加固CORS安全头和常见漏洞.md](study-material/15-安全加固CORS安全头和常见漏洞.md) |
| 16 | stream 四层代理、TCP 和 UDP | [16-stream四层代理TCP和UDP.md](study-material/16-stream四层代理TCP和UDP.md) |
| 17 | 部署、reload、灰度和高可用 | [17-部署reload灰度和高可用.md](study-material/17-部署reload灰度和高可用.md) |
| 18 | 故障排查 | [18-故障排查.md](study-material/18-故障排查.md) |
| 19 | 综合练习项目 | [19-综合练习项目.md](study-material/19-综合练习项目.md) |
| 20 | 命令速查 | [20-命令速查.md](study-material/20-命令速查.md) |
| 21 | 面试知识点整理 | [21-面试知识点整理.md](study-material/21-面试知识点整理.md) |
| 22 | Nginx 完整知识点清单 | [22-Nginx完整知识点清单.md](study-material/22-Nginx完整知识点清单.md) |
| 23 | 事件模型、worker 进程和 epoll 深度解析 | [23-事件模型worker进程和epoll深度解析.md](study-material/23-事件模型worker进程和epoll深度解析.md) |
| 24 | 请求处理阶段和模块执行链深度解析 | [24-请求处理阶段和模块执行链深度解析.md](study-material/24-请求处理阶段和模块执行链深度解析.md) |
| 25 | 配置解析、继承、merge 和指令作用域深度解析 | [25-配置解析继承merge和指令作用域深度解析.md](study-material/25-配置解析继承merge和指令作用域深度解析.md) |
| 26 | server_name 和 location 匹配算法深度解析 | [26-server_name和location匹配算法深度解析.md](study-material/26-server_name和location匹配算法深度解析.md) |
| 27 | URI、root、alias、try_files 和 rewrite 深度解析 | [27-URI路径rootaliastry_files和rewrite深度解析.md](study-material/27-URI路径rootaliastry_files和rewrite深度解析.md) |
| 28 | proxy_pass、转发头、缓冲和超时深度解析 | [28-proxy_pass转发头缓冲和超时深度解析.md](study-material/28-proxy_pass转发头缓冲和超时深度解析.md) |
| 29 | upstream 负载均衡、失败重试和 keepalive 深度解析 | [29-upstream负载均衡失败重试和keepalive深度解析.md](study-material/29-upstream负载均衡失败重试和keepalive深度解析.md) |
| 30 | TLS 握手、SNI、会话复用和 OCSP 深度解析 | [30-TLS握手SNI会话复用和OCSP深度解析.md](study-material/30-TLS握手SNI会话复用和OCSP深度解析.md) |
| 31 | 缓存键、Vary、Range、Purge 和防穿透深度解析 | [31-缓存键VaryRangePurge和防穿透深度解析.md](study-material/31-缓存键VaryRangePurge和防穿透深度解析.md) |
| 32 | 限流算法、连接控制和背压深度解析 | [32-限流算法连接控制和背压深度解析.md](study-material/32-限流算法连接控制和背压深度解析.md) |
| 33 | 日志采样、trace id 和故障定位深度解析 | [33-日志采样traceID和故障定位深度解析.md](study-material/33-日志采样traceID和故障定位深度解析.md) |
| 34 | 内核网络队列、文件 IO 和性能深度解析 | [34-内核网络队列文件IO和性能深度解析.md](study-material/34-内核网络队列文件IO和性能深度解析.md) |
| 35 | 生产事故复盘、容量规划和 SLA | [35-生产事故复盘容量规划和SLA.md](study-material/35-生产事故复盘容量规划和SLA.md) |
| 36 | 深度实验手册和能力验收 | [36-深度实验手册和能力验收.md](study-material/36-深度实验手册和能力验收.md) |
| 37 | 模块生命周期、配置指令和 reload 深度解析 | [37-模块生命周期配置指令和reload深度解析.md](study-material/37-模块生命周期配置指令和reload深度解析.md) |
| 38 | HTTP 请求解析状态机、URI 归一化和变量求值深度解析 | [38-HTTP请求解析状态机URI归一化和变量求值深度解析.md](study-material/38-HTTP请求解析状态机URI归一化和变量求值深度解析.md) |
| 39 | real_ip、X-Forwarded-For、PROXY protocol 和信任链深度解析 | [39-real_ipXForwardedForPROXYprotocol和信任链深度解析.md](study-material/39-real_ipXForwardedForPROXYprotocol和信任链深度解析.md) |
| 40 | DNS resolver、动态 upstream、容器和 Kubernetes 深度解析 | [40-DNSresolver动态upstream容器和Kubernetes深度解析.md](study-material/40-DNSresolver动态upstream容器和Kubernetes深度解析.md) |
| 41 | HTTP 缓存协商、ETag、If-Modified-Since 和 Vary 深度解析 | [41-HTTP缓存协商ETagIfModifiedSince和Vary深度解析.md](study-material/41-HTTP缓存协商ETagIfModifiedSince和Vary深度解析.md) |
| 42 | 大文件上传下载、临时文件、buffering 和磁盘压力深度解析 | [42-大文件上传下载临时文件buffering和磁盘压力深度解析.md](study-material/42-大文件上传下载临时文件buffering和磁盘压力深度解析.md) |
| 43 | 499、502、504、TCP 关闭和超时矩阵深度解析 | [43-499502504TCP关闭和超时矩阵深度解析.md](study-material/43-499502504TCP关闭和超时矩阵深度解析.md) |
| 44 | HTTP/1.1、HTTP/2、HTTP/3、队头阻塞和协议选择深度解析 | [44-HTTP1HTTP2HTTP3队头阻塞和协议选择深度解析.md](study-material/44-HTTP1HTTP2HTTP3队头阻塞和协议选择深度解析.md) |
| 45 | Nginx Ingress、Kubernetes、服务发现和边界深度解析 | [45-NginxIngressKubernetes服务发现和边界深度解析.md](study-material/45-NginxIngressKubernetes服务发现和边界深度解析.md) |
| 46 | OpenResty、Lua、njs、动态模块和扩展边界深度解析 | [46-OpenRestyLuaNJS动态模块和扩展边界深度解析.md](study-material/46-OpenRestyLuaNJS动态模块和扩展边界深度解析.md) |
| 47 | 安全攻防：Host 头、请求走私、路径穿越和 SSRF 深度解析 | [47-安全攻防Host头请求走私路径穿越和SSRF深度解析.md](study-material/47-安全攻防Host头请求走私路径穿越和SSRF深度解析.md) |
| 48 | 零停机 reload、worker 退出、连接排空和回滚深度解析 | [48-零停机reloadworker退出连接排空和回滚深度解析.md](study-material/48-零停机reloadworker退出连接排空和回滚深度解析.md) |
| 49 | 容量压测、连接模型、队列和成本治理深度解析 | [49-容量压测连接模型队列和成本治理深度解析.md](study-material/49-容量压测连接模型队列和成本治理深度解析.md) |
| 50 | CDN、LB、Nginx、应用端到端架构深度解析 | [50-CDNLBNginx应用端到端架构深度解析.md](study-material/50-CDNLBNginx应用端到端架构深度解析.md) |

## 使用建议

- 入门：按 00 到 08 学习，先掌握配置结构、server/location、静态资源和反向代理。
- 后端开发：重点看 04、06、07、08、10、11、12、18。
- 运维/SRE：重点看 09、13、14、15、17、18、23 到 35。
- 深入原理：重点看 23 到 50，理解事件模型、模块阶段、配置继承、匹配算法、代理、TLS、缓存、协议、DNS、真实 IP、Kubernetes、安全攻防和容量治理。
- 面试复习：先读 22 完整清单，再读 21 和 `面试知识点/`。
