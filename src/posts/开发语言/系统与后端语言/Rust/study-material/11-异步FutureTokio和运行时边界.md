---
title: "Rust学习资料：异步、Future、Tokio 和运行时边界"
date: 2026-06-20
description: "Rust async/await 是零成本异步抽象的重要部分。async fn 不会立刻执行完整函数，而是返回一个实现 Future 的状态机。状态机在被 executor poll 时推进，遇到未就绪的 IO 会让出执行权。"
tags:
  - "开发语言"
  - "Rust"
category: "开发语言"
---

# Rust学习资料：异步、Future、Tokio 和运行时边界

[返回索引](../Rust学习资料.md)

## 学习目标

- 理解 `async` 函数返回 Future，Future 需要运行时驱动。
- 掌握 Tokio task、select、timeout、channel、Semaphore。
- 理解阻塞边界、取消安全、Pin 和背压。

## 理论导读

Rust async/await 是零成本异步抽象的重要部分。`async fn` 不会立刻执行完整函数，而是返回一个实现 Future 的状态机。状态机在被 executor poll 时推进，遇到未就绪的 IO 会让出执行权。

## 核心心智模型

Future 像一张待办单，executor 是调度员。待办单每次被问“进展如何”，如果条件还没满足就登记唤醒器，条件满足后再继续推进。

## 知识点详解

### async 函数

```rust
async fn fetch_id() -> u64 {
    42
}
```

调用 `fetch_id()` 得到 Future，本身不代表已经完成。需要 `.await` 或 runtime 驱动。

### Tokio 基础

```rust
#[tokio::main]
async fn main() {
    let handle = tokio::spawn(async {
        1 + 2
    });

    println!("{}", handle.await.unwrap());
}
```

### 阻塞边界

CPU 密集任务或阻塞 IO 不应直接跑在 async worker 线程上。使用 `tokio::task::spawn_blocking` 或专门线程池。

### 取消安全

当 Future 被 drop 时，异步操作会被取消。涉及状态修改、锁、事务、消息确认时，要保证中途取消不会留下半完成状态。

### Pin

编译器生成的 Future 可能包含自引用状态，因此 poll 时需要稳定内存位置。`Pin` 表达“这个值不能被随意移动”的约束。多数业务代码不需要手写 Pin，但要理解错误来源。

## 例子

```rust
use tokio::time::{timeout, Duration};

async fn call_service() -> Result<String, &'static str> {
    Ok("ok".to_string())
}

#[tokio::main]
async fn main() {
    let result = timeout(Duration::from_secs(1), call_service()).await;
    println!("{result:?}");
}
```

## 练习

1. 写一个并发抓取多个 URL 的程序，并用 Semaphore 限制并发数。
2. 给每个请求加 timeout。
3. 把阻塞文件处理迁移到 `spawn_blocking`。

## 验收

- 能解释 async 函数为什么返回 Future。
- 能说清楚 Tokio runtime 和 OS 线程的关系。
- 能识别在 async 代码里使用阻塞锁或阻塞 IO 的风险。

## 重点

- async 是协作式并发，任务必须在 await 点让出执行权。

## 难点

- Future 状态机、Pin、取消安全和生命周期组合起来是 Rust 异步的主要难点。

## 易错

> **易错：** 在 Tokio worker 中调用长时间阻塞函数。
>
> 正确做法：使用异步 IO API，或把阻塞任务放到 `spawn_blocking`。
