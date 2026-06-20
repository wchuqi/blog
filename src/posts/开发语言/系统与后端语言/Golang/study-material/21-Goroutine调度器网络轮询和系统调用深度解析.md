---
title: "Golang 学习资料：Goroutine 调度器、网络轮询和系统调用深度解析"
date: 2026-06-20
description: "Go 并发性能的关键不是 goroutine 本身，而是 runtime 如何调度它们。调度器把 G 多路复用到 M 上，P 提供执行 Go 代码所需的资源。网络 IO 通常通过 runtime netpoller 与操作系统事件通知机制协…"
tags:
  - "开发语言"
  - "Golang"
  - "深度解析"
category: "开发语言"
---

# Golang 学习资料：Goroutine 调度器、网络轮询和系统调用深度解析

[返回索引](../Golang学习资料.md)

## 学习目标

- 深入理解 G/M/P 调度模型、run queue、work stealing、抢占和系统调用。
- 理解网络轮询器如何让大量连接不等于大量阻塞线程。
- 能排查 goroutine 堆积、线程暴涨、阻塞、锁竞争和调度延迟。

## 理论导读

Go 并发性能的关键不是 goroutine 本身，而是 runtime 如何调度它们。调度器把 G 多路复用到 M 上，P 提供执行 Go 代码所需的资源。网络 IO 通常通过 runtime netpoller 与操作系统事件通知机制协作，避免每个连接占用一个线程。但一旦 goroutine 进入阻塞系统调用、CGO、长时间不让出 CPU 或锁竞争，调度器仍会受到影响。

## 核心心智模型

```text
G: 要运行的任务
M: OS 线程
P: 执行 Go 代码的许可证和本地队列

G 必须绑定到拥有 P 的 M 上才能执行 Go 代码。
```

## 调度流程

### 1. 本地队列和全局队列

每个 P 有本地运行队列。新创建的 goroutine 通常优先放入本地队列。全局队列用于平衡和溢出。P 没任务时会从其他 P 窃取一部分任务，这叫 work stealing。

### 2. 抢占

早期 Go 抢占更多依赖函数调用检查。现代 Go 支持更强的异步抢占，减少单个 goroutine 长时间占用 P 的风险。但不要把抢占当成实时调度保证。CPU 密集循环仍然可能影响延迟。

### 3. 系统调用

goroutine 执行阻塞系统调用时，M 可能阻塞。runtime 会尽量把 P 分离出来交给其他 M，避免整个程序停住。系统调用返回后，原 goroutine 需要重新获得 P 才能继续执行 Go 代码。

## 网络轮询

Go 的 `net` 包把 socket 设置为非阻塞，并注册到 runtime netpoller。goroutine 读写网络时，如果数据未就绪，它会挂起，等待事件通知后被重新放回可运行队列。

这解释了为什么 Go 可以同时维护大量连接，但也说明：

- 连接多仍会消耗 fd、内存、TLS 状态和应用层缓冲。
- 慢客户端仍可能占用服务端资源。
- 不设置超时会让 goroutine 长期挂起。

## 排障信号

| 现象 | 可能原因 | 工具 |
| --- | --- | --- |
| goroutine 数持续上涨 | 泄漏、无超时、channel 阻塞 | goroutine profile |
| 线程数暴涨 | CGO、阻塞 syscall、runtime 需要补线程 | `runtime.NumCgoCall`、系统监控 |
| CPU 高但吞吐低 | 锁竞争、忙等、JSON 热点 | CPU profile、mutex profile |
| P99 抖动 | GC、调度延迟、下游慢、队列堆积 | trace、指标 |

## 例子：goroutine 泄漏

```go
func leak(ch <-chan int) {
	go func() {
		v := <-ch
		fmt.Println(v)
	}()
}
```

如果没有人发送或关闭 `ch`，goroutine 会永远阻塞。

## 练习

1. 启动 10 万个等待 channel 的 goroutine，观察 goroutine profile。
2. 写一个无超时 HTTP client，模拟下游不返回，观察 goroutine 堆积。
3. 用 `go test -trace trace.out` 打开 trace，观察 goroutine 阻塞原因。

## 验收

- 能解释 G/M/P、run queue 和 work stealing。
- 能说明网络 IO 为什么不会一连接一线程。
- 能用 goroutine profile 和 trace 定位阻塞类型。

## 易错

> **易错：** 看到 goroutine 轻量，就把每个请求拆成大量无上限后台任务。
>
> 正确做法：对任务设置队列、并发上限、取消信号和超时，监控 goroutine 数和队列长度。
