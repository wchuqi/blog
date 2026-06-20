---
title: "Golang 学习资料：标准库、IO、网络和 HTTP 服务"
date: 2026-06-20
description: "Go 标准库覆盖了大量后端开发基础能力。io.Reader 和 io.Writer 是 Go 生态最重要的接口之一，它们把文件、网络、内存缓冲、压缩流统一成“读取字节”和“写入字节”的行为。HTTP 标准库可直接用于生产，但必须补齐超时、日…"
tags:
  - "开发语言"
  - "Golang"
category: "开发语言"
---

# Golang 学习资料：标准库、IO、网络和 HTTP 服务

[返回索引](../Golang学习资料.md)

## 学习目标

- 掌握常用标准库：`fmt`、`strings`、`bytes`、`time`、`encoding/json`、`io`、`os`、`net/http`。
- 理解 Reader/Writer 抽象、HTTP 客户端超时、服务端优雅关闭。
- 能写一个可靠的 HTTP 服务。

## 理论导读

Go 标准库覆盖了大量后端开发基础能力。`io.Reader` 和 `io.Writer` 是 Go 生态最重要的接口之一，它们把文件、网络、内存缓冲、压缩流统一成“读取字节”和“写入字节”的行为。HTTP 标准库可直接用于生产，但必须补齐超时、日志、指标、错误处理和关闭流程。

## 核心心智模型

Reader/Writer 像水管接口：上游不关心水来自文件、网络还是内存，下游只按约定读取或写入字节流。

## 知识点详解

### HTTP 服务

```go
srv := &http.Server{
	Addr:              ":8080",
	Handler:           mux,
	ReadHeaderTimeout: 5 * time.Second,
}
```

生产服务必须设置超时，避免慢连接耗尽资源。关闭时使用 `Shutdown(ctx)` 给已有请求收尾时间。

### HTTP 客户端

默认 `http.Client` 没有整体超时，不适合直接用于生产外部调用。

```go
client := &http.Client{Timeout: 3 * time.Second}
```

## 练习

实现一个 `/healthz` 和 `/users/{id}` HTTP 服务，要求 JSON 响应、请求日志、超时控制和优雅关闭。

## 验收

- 能用 Reader/Writer 组合处理文件和网络数据。
- 能解释 HTTP 服务端和客户端常见超时。
- 能处理 JSON 编解码错误并返回合适状态码。

## 重点

- 标准库足够强，但生产默认值需要主动配置。
- 网络服务必须有超时、限流、日志和关闭策略。

## 难点

- 连接池、超时、取消和重试之间有联动，错误配置会放大故障。

## 易错

> **易错：** 使用默认 HTTP 客户端请求外部服务。
>
> 正确做法：显式设置 timeout，并根据场景配置 transport、连接池和 TLS。
