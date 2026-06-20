---
title: "Golang 学习资料：net/http、Transport、连接池、超时、重试和优雅关闭深度解析"
date: 2026-06-20
description: "Go 的 net/http 很强，但默认值不是完整生产方案。客户端没有整体超时时，外部服务卡住会拖住 goroutine 和连接。服务端没有 ReadHeaderTimeout 时，慢客户端可以占住资源。没有正确读取和关闭响应体时，连接无法…"
tags:
  - "开发语言"
  - "Golang"
  - "深度解析"
category: "开发语言"
---

# Golang 学习资料：net/http、Transport、连接池、超时、重试和优雅关闭深度解析

[返回索引](../Golang学习资料.md)

## 学习目标

- 深入理解 `net/http` 客户端、服务端、Transport、连接池和超时矩阵。
- 能设计可靠的外部调用、重试、限流和优雅关闭。
- 能排查 499、502、504、连接泄漏、慢请求和 goroutine 堆积。

## 理论导读

Go 的 `net/http` 很强，但默认值不是完整生产方案。客户端没有整体超时时，外部服务卡住会拖住 goroutine 和连接。服务端没有 ReadHeaderTimeout 时，慢客户端可以占住资源。没有正确读取和关闭响应体时，连接无法复用。没有优雅关闭时，发布会直接中断请求。

## 客户端 Transport

`http.Client` 负责请求生命周期，`Transport` 负责连接复用、代理、TLS、拨号和空闲连接池。

常见配置：

```go
tr := &http.Transport{
	MaxIdleConns:        100,
	MaxIdleConnsPerHost: 20,
	IdleConnTimeout:     90 * time.Second,
	TLSHandshakeTimeout:  5 * time.Second,
}

client := &http.Client{
	Timeout:   3 * time.Second,
	Transport: tr,
}
```

`Client.Timeout` 是整体请求时间上限。更细粒度可通过 Dialer、TLSHandshakeTimeout、ResponseHeaderTimeout、context deadline 配合。

## 响应体关闭

必须关闭 `resp.Body`。如果希望连接复用，通常需要读完 body 或让 transport 能丢弃剩余内容。

```go
resp, err := client.Do(req)
if err != nil {
	return err
}
defer resp.Body.Close()
```

## 重试规则

重试不是简单 for 循环：

- 只对幂等请求或有幂等键的请求重试。
- 设置最大次数、退避和抖动。
- 尊重 context deadline。
- 区分连接错误、超时、5xx、429 和业务错误。
- 记录重试次数和最终原因。

## 服务端超时

```go
srv := &http.Server{
	Addr:              ":8080",
	Handler:           handler,
	ReadHeaderTimeout: 5 * time.Second,
	ReadTimeout:       10 * time.Second,
	WriteTimeout:      10 * time.Second,
	IdleTimeout:       60 * time.Second,
}
```

不同超时覆盖的阶段不同。流式响应和大文件上传下载需要单独评估，不能机械设置很短的 WriteTimeout。

## 优雅关闭

```go
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
if err := srv.Shutdown(ctx); err != nil {
	return err
}
```

`Shutdown` 停止接受新连接，等待已有请求完成或超时。后台 worker、数据库连接、消息消费者也要纳入关闭流程。

## 排障矩阵

| 现象 | 可能原因 | 检查 |
| --- | --- | --- |
| goroutine 堆积在 net/http | 下游无超时、body 未关闭 | goroutine profile |
| 连接数持续上涨 | 未复用、未关闭、连接池过大 | fd、Transport 指标 |
| 504 增多 | 下游慢、网关超时短、重试放大 | trace、上游日志 |
| 发布时请求失败 | 未优雅关闭或关闭超时过短 | 发布日志 |
| P99 抖动 | 连接建连、TLS、DNS、GC、锁 | trace、pprof |

## 练习

1. 写一个不关闭 body 的客户端，观察连接复用失败。
2. 模拟慢 header 攻击，验证 ReadHeaderTimeout。
3. 实现带幂等判断、指数退避和 context 的重试客户端。

## 验收

- 能画出 HTTP 客户端请求阶段和对应超时。
- 能解释 body 关闭与连接复用的关系。
- 能设计发布时的优雅关闭流程。

## 易错

> **易错：** 所有错误都重试。
>
> 正确做法：只重试可恢复、可幂等、仍在 deadline 内的失败，并对重试风暴做限流。
