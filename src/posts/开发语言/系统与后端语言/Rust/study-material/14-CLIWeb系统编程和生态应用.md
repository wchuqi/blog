---
title: "Rust学习资料：CLI、Web、系统编程和生态应用"
date: 2026-06-20
description: "Rust 生态强调显式组合。很多能力不是标准库内置，而是由成熟 crate 提供。选择 crate 时不能只看下载量，还要看维护活跃度、许可证、MSRV、unsafe 使用、依赖树大小、feature 默认值和安全公告。"
tags:
  - "开发语言"
  - "Rust"
category: "开发语言"
---

# Rust学习资料：CLI、Web、系统编程和生态应用

[返回索引](../Rust学习资料.md)

## 学习目标

- 了解 Rust 常见生态：CLI、Web、序列化、数据库、日志、配置、系统编程。
- 能选择合适 crate 并评估维护状态、MSRV、安全风险。
- 能设计一个完整 Rust 应用的边界。

## 理论导读

Rust 生态强调显式组合。很多能力不是标准库内置，而是由成熟 crate 提供。选择 crate 时不能只看下载量，还要看维护活跃度、许可证、MSRV、unsafe 使用、依赖树大小、feature 默认值和安全公告。

## 核心心智模型

Rust 应用像拼装式系统：核心逻辑尽量放在稳定库 crate 中，CLI/Web/DB 是外层适配器。这样测试、替换和复用都更容易。

## 知识点详解

### CLI

常见组合：`clap` 解析参数，`anyhow` 处理应用错误，`tracing` 记录日志。

```rust
use clap::Parser;

#[derive(Parser)]
struct Args {
    #[arg(short, long)]
    name: String,
}
```

### Web

常见组合：`axum` 或 `actix-web`，`tokio` 运行时，`serde` 序列化，`sqlx` 或 `diesel` 访问数据库，`tower` 做中间件。

### 配置

配置来源通常有默认值、配置文件、环境变量、命令行参数。需要明确优先级，避免不同环境行为不可预测。

### 系统编程

系统编程关注文件描述符、信号、权限、进程、网络、内存映射和平台差异。Rust 能提供安全抽象，但底层边界仍需理解 OS 语义。

## 例子

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: u64,
    name: String,
}
```

## 练习

1. 用 clap 写一个支持子命令的 CLI。
2. 用 axum 写一个 `/health` 和 `/users/:id` 服务。
3. 为应用实现配置优先级：默认值 < 文件 < 环境变量 < CLI。

## 验收

- 能说出 CLI、Web、配置、日志、数据库常见 crate。
- 能检查依赖树和 feature。
- 能把核心业务和外部适配器拆开。

## 重点

- Rust 标准库小而稳，工程能力主要来自 Cargo 生态组合。

## 难点

- crate 选择是工程决策，要评估维护、安全、MSRV 和依赖复杂度。

## 易错

> **易错：** 看到示例能跑就直接引入大量默认 feature。
>
> 正确做法：查看 crate 文档和 feature 列表，只启用需要的能力。
