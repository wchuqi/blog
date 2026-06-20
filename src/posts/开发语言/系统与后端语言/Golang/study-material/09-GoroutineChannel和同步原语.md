---
title: "Golang 学习资料：Goroutine、Channel 和同步原语"
date: 2026-06-20
description: "goroutine 是由 Go runtime 管理的轻量执行单元，启动成本远低于 OS 线程，但不是免费资源。channel 是 goroutine 之间传递值和同步的管道。共享内存用锁保护，消息传递用 channel 协作，两者都可以写…"
tags:
  - "开发语言"
  - "Golang"
category: "开发语言"
---

# Golang 学习资料：Goroutine、Channel 和同步原语

[返回索引](../Golang学习资料.md)

## 学习目标

- 掌握 goroutine、channel、select、WaitGroup、Mutex、RWMutex、Once、Cond、atomic。
- 理解 channel 所有权、关闭规则、缓冲与背压。
- 能写出生命周期可控的并发代码。

## 理论导读

goroutine 是由 Go runtime 管理的轻量执行单元，启动成本远低于 OS 线程，但不是免费资源。channel 是 goroutine 之间传递值和同步的管道。共享内存用锁保护，消息传递用 channel 协作，两者都可以写出好代码，关键是边界明确。

## 核心心智模型

并发程序像多条流水线：goroutine 是工人，channel 是传送带，context 是停工信号，WaitGroup 是收工计数器，Mutex 是共享仓库的门锁。

## 知识点详解

### Channel 规则

- 发送到已关闭 channel 会 panic。
- 从已关闭 channel 接收会得到零值和 `ok=false`。
- 关闭 channel 应由发送方负责。
- 多发送方场景需要额外协调关闭。

### Worker Pool

```go
func run(ctx context.Context, jobs <-chan int, workers int) {
	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case job, ok := <-jobs:
					if !ok {
						return
					}
					_ = job
				}
			}
		}()
	}
	wg.Wait()
}
```

## 练习

写一个并发下载器，限制最大并发数，支持整体超时，任意任务失败后取消剩余任务。

## 验收

- 能解释无缓冲 channel 与有缓冲 channel 的同步差异。
- 能使用 `go test -race` 验证没有数据竞争。
- 能说明锁和 channel 的适用场景。

## 重点

- goroutine 必须有退出路径。
- channel 的关闭是广播“没有更多值”，不是通用取消机制。

## 难点

- 多生产者、多消费者、错误传播和取消组合时容易泄漏 goroutine。

## 易错

> **易错：** 接收方关闭 channel。
>
> 正确做法：通常由发送方关闭；多发送方要用 WaitGroup 或单独协调 goroutine 统一关闭。
