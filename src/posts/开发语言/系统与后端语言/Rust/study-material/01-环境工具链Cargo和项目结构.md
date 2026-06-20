---
title: "Rust学习资料：环境工具链Cargo和项目结构"
date: 2026-06-20
description: "Rust 的工具链是一套紧密集成的工程系统。rustc 是编译器，cargo 是构建、测试、依赖、发布的入口，rustup 管理工具链版本。日常开发基本围绕 Cargo 展开：创建项目、下载依赖、构建、运行测试、生成文档和发布 crate。"
tags:
  - "开发语言"
  - "Rust"
category: "开发语言"
---

# Rust学习资料：环境工具链Cargo和项目结构

[返回索引](../Rust学习资料.md)

## 学习目标

- 掌握 rustup、rustc、cargo、rustfmt、clippy 的职责边界。
- 能创建 Rust 2024 项目，理解 `Cargo.toml`、`src/main.rs`、`src/lib.rs`。
- 理解 package、crate、target、workspace、profile 和 MSRV。

## 理论导读

Rust 的工具链是一套紧密集成的工程系统。`rustc` 是编译器，`cargo` 是构建、测试、依赖、发布的入口，`rustup` 管理工具链版本。日常开发基本围绕 Cargo 展开：创建项目、下载依赖、构建、运行测试、生成文档和发布 crate。

## 核心心智模型

把 Cargo 项目想成一个工厂：`Cargo.toml` 是订单和生产配置，`src/` 是源材料，`target/` 是产物仓库，`Cargo.lock` 是实际采购清单，workspace 是多条生产线的总控。

## 知识点详解

### 安装和版本

```powershell
rustup show
rustup update stable
rustc --version
cargo --version
```

`rustup default stable` 设置默认工具链，`rustup override set stable` 可以在项目目录设置局部工具链。生产项目建议明确 MSRV，例如在 `Cargo.toml` 中设置：

```toml
[package]
name = "demo"
version = "0.1.0"
edition = "2024"
rust-version = "1.96"
```

### 项目结构

```text
demo/
  Cargo.toml
  Cargo.lock
  src/
    main.rs
    lib.rs
  tests/
  examples/
  benches/
```

二进制 crate 的入口通常是 `src/main.rs`，库 crate 的入口通常是 `src/lib.rs`。一个 package 可以包含多个 target，例如 lib、bin、example、test、bench。

### 常用命令

| 命令 | 作用 |
| --- | --- |
| `cargo new app` | 创建新项目 |
| `cargo build` | 构建 debug 产物 |
| `cargo run` | 构建并运行 |
| `cargo test` | 运行测试 |
| `cargo check` | 快速类型检查，不生成最终产物 |
| `cargo fmt` | 格式化 |
| `cargo clippy` | 静态检查和风格建议 |
| `cargo doc --open` | 生成文档 |
| `cargo build --release` | release 优化构建 |

### Profile

`[profile.dev]` 和 `[profile.release]` 控制优化、调试信息、panic 策略、LTO 等。开发阶段优先编译速度和调试信息，发布阶段优先运行性能、体积或启动速度。

## 例子

```powershell
cargo new hello-rust
cd hello-rust
cargo run
cargo test
cargo clippy
```

`src/main.rs`：

```rust
fn main() {
    println!("hello rust");
}
```

## 练习

1. 创建一个 `word-count` 项目，读取命令行第一个参数并打印。
2. 增加 `src/lib.rs`，把统计逻辑放进库函数。
3. 为库函数写单元测试。

## 验收

- 能解释 rustup、rustc、cargo 的区别。
- 能创建二进制项目和库项目。
- 能说明 `Cargo.lock` 的作用和为什么应用项目通常提交 lockfile。

## 重点

- Cargo 是 Rust 工程化入口，不要绕过它手动调用 rustc 做日常项目。
- Edition 和 MSRV 是两个维度：Edition 控制语言兼容体验，MSRV 控制最低编译器版本。

## 难点

- package、crate、module、workspace 容易混淆。package 是发布和配置单位，crate 是编译单元，module 是源码命名空间。

## 易错

> **易错：** 修改依赖后只看 `Cargo.toml`，忽略 `Cargo.lock`。
>
> 正确做法：应用项目把 `Cargo.lock` 当作可复现构建的一部分；库项目策略按团队规范和发布目标决定。
