---
title: "Golang 学习资料：错误处理、panic recover 和上下文取消"
date: 2026-06-20
description: "Go 把失败当成普通返回值，是为了让错误处理出现在调用链的显眼位置。业务错误、IO 错误、网络超时和参数错误都应该能被调用方识别和决策。panic 适合不可恢复的程序错误，不适合替代业务分支。context 是跨 API 传播取消信号和截止…"
tags:
  - "开发语言"
  - "Golang"
category: "开发语言"
---

# Golang 学习资料：错误处理、panic recover 和上下文取消

[返回索引](../Golang学习资料.md)

## 学习目标

- 掌握 `error`、错误包装、哨兵错误、自定义错误、`errors.Is`、`errors.As`。
- 理解 `panic`、`recover` 的适用边界。
- 掌握 `context.Context` 的取消、超时和请求级值传递。

## 理论导读

Go 把失败当成普通返回值，是为了让错误处理出现在调用链的显眼位置。业务错误、IO 错误、网络超时和参数错误都应该能被调用方识别和决策。`panic` 适合不可恢复的程序错误，不适合替代业务分支。`context` 是跨 API 传播取消信号和截止时间的标准方式。

## 核心心智模型

错误值像诊断单，应该能告诉上层“发生了什么”和“是否属于某类问题”。context 像任务取消令牌，从入口传到下游，任何耗时操作都应尊重它。

## 知识点详解

### 错误包装

```go
var ErrNotFound = errors.New("not found")

func loadUser(id string) error {
	return fmt.Errorf("load user %s: %w", id, ErrNotFound)
}
```

使用 `%w` 包装后，上层可以用 `errors.Is(err, ErrNotFound)` 判断错误类别，同时保留上下文。

### panic 与 recover

`recover` 只能在 defer 调用链中捕获当前 goroutine 的 panic。不能跨 goroutine 捕获。

## 练习

实现一个带超时的 HTTP 调用函数，要求使用 `context.WithTimeout`，并将上游错误包装为包含 URL 的错误。

## 验收

- 能区分业务错误、系统错误和程序员错误。
- 能用 `errors.Is` 和 `errors.As` 做错误分支。
- 能说明 `context` 不能存放可选参数和大对象。

## 重点

- 错误要可判断、可定位、可保留链路上下文。
- `context` 应作为函数第一个参数传递，通常命名为 `ctx`。

## 难点

- 错误包装过少会丢失上下文，包装过度又会让日志重复冗长。

## 易错

> **易错：** 捕获 panic 后什么都不记录，导致真实 bug 被吞掉。
>
> 正确做法：只在边界层 recover，并记录堆栈、请求信息和错误上下文。
