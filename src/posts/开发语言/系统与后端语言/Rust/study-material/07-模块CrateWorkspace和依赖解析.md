---
title: "Rust学习资料：模块、Crate、Workspace 和依赖解析"
date: 2026-06-20
description: "Rust 的代码组织分成两个层面：编译和发布层面的 package/crate/workspace，源码命名空间层面的 module。Cargo 决定依赖版本、feature 合并和构建顺序；Rust 编译器决定模块可见性和路径解析。"
tags:
  - "开发语言"
  - "Rust"
category: "开发语言"
---

# Rust学习资料：模块、Crate、Workspace 和依赖解析

[返回索引](../Rust学习资料.md)

## 学习目标

- 区分 package、crate、module、workspace。
- 掌握 `mod`、`use`、`pub`、`pub(crate)` 和路径规则。
- 理解 Cargo 依赖版本、features、resolver、MSRV 和 lockfile。

## 理论导读

Rust 的代码组织分成两个层面：编译和发布层面的 package/crate/workspace，源码命名空间层面的 module。Cargo 决定依赖版本、feature 合并和构建顺序；Rust 编译器决定模块可见性和路径解析。

## 核心心智模型

package 是包装盒，crate 是编译单元，module 是盒子内部的隔间，workspace 是一组包装盒的总仓库。

## 知识点详解

### 模块路径

```rust
// src/lib.rs
pub mod user;

// src/user.rs
pub struct User {
    pub name: String,
}
```

`mod user;` 声明模块并告诉编译器加载对应文件。`use` 只是把路径引入当前作用域，不负责加载文件。

### 可见性

| 写法 | 范围 |
| --- | --- |
| 默认私有 | 当前模块及子模块可见 |
| `pub` | 对外公开 |
| `pub(crate)` | 当前 crate 可见 |
| `pub(super)` | 父模块可见 |

### Workspace

```toml
[workspace]
members = ["crates/core", "crates/cli"]
resolver = "3"
```

Rust 2024 Edition 默认使用 resolver 3。resolver 是 workspace 全局设置，虚拟 workspace 要显式写在 `[workspace]` 中。

### 依赖版本和 features

```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
```

Cargo 解析 SemVer 版本范围，选择满足约束的版本，并合并 features。features 是加法模型：一个依赖被多个地方启用不同 feature 时，最终通常取并集。resolver 2/3 改进了部分 feature 合并场景，但仍要避免随意开启重 feature。

## 例子

```text
todo-workspace/
  Cargo.toml
  crates/
    todo-core/
      src/lib.rs
    todo-cli/
      src/main.rs
```

`todo-cli` 依赖 `todo-core`：

```toml
[dependencies]
todo-core = { path = "../todo-core" }
```

## 练习

1. 创建一个 workspace，包含库 crate 和 CLI crate。
2. 在库 crate 中隐藏内部模块，只暴露稳定 API。
3. 增加可选 feature `json`，启用时才依赖 serde。

## 验收

- 能解释 `mod` 和 `use` 的区别。
- 能说明 Cargo features 为什么是加法合并。
- 能解释 Rust 2024 Edition 下 resolver 3 和 MSRV 兼容选择的关系。

## 重点

- 模块系统解决源码组织，Cargo 解决包、依赖和构建。
- 依赖解析是全局约束求解，不是每个 crate 独立选版本。

## 难点

- feature unification 会让一个依赖在某些构建中启用你没直接开启的能力，生产构建需要检查实际 feature 图。

## 易错

> **易错：** 把 `use crate::x` 当成“导入文件”。
>
> 正确做法：先用 `mod` 声明模块，再用 `use` 缩短路径或引入名称。
