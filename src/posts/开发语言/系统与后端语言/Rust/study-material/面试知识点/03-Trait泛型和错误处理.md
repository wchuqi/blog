---
title: "Rust面试知识点：Trait 泛型和错误处理"
date: 2026-06-20
description: "泛型参数和参数位置的 impl Trait 通常使用静态分发，编译器为具体类型生成代码；dyn Trait 使用动态分发，通过 vtable 运行时调用。返回位置的 impl Trait 表示返回某个具体但隐藏的类型，不是任意类型。"
tags:
  - "开发语言"
  - "Rust"
  - "面试"
category: "开发语言"
---

# Rust面试知识点：Trait 泛型和错误处理

[返回面试索引](../16-面试知识点整理.md)

[返回学习资料索引](../../Rust学习资料.md)

## 一、Trait 泛型和错误处理

### 1. `impl Trait`、泛型参数和 `dyn Trait` 有什么区别？

**参考答案：**

泛型参数和参数位置的 `impl Trait` 通常使用静态分发，编译器为具体类型生成代码；`dyn Trait` 使用动态分发，通过 vtable 运行时调用。返回位置的 `impl Trait` 表示返回某个具体但隐藏的类型，不是任意类型。

```rust
fn static_dispatch<T: std::fmt::Display>(v: T) {}
fn impl_arg(v: impl std::fmt::Display) {}
fn dynamic_dispatch(v: &dyn std::fmt::Display) {}
```

> **难点：** `dyn Trait` 需要对象安全，且通常通过引用或智能指针使用。

### 2. 关联类型和泛型参数怎么选？

**参考答案：**

如果一个 Trait 的实现者应唯一决定某个输出类型，适合关联类型，例如 `Iterator::Item`。如果调用方希望同一类型能对多种参数类型实现同一个 Trait，适合泛型参数。

> **重点：** 关联类型强调“实现者的固定选择”，泛型参数强调“调用或实现时的可变选择”。

### 3. Option、Result 和 panic 的边界是什么？

**参考答案：**

`Option` 表示正常缺失，`Result` 表示可恢复失败，`panic` 表示违反不变量或无法继续的错误。外部输入、IO、网络、解析应返回 `Result`，不要 `unwrap`。

```rust
fn parse_port(input: &str) -> Result<u16, std::num::ParseIntError> {
    input.parse()
}
```

> **易错：** 把所有失败都 panic，会让库调用者无法处理错误。

### 4. Rust 的孤儿规则是什么？

**参考答案：**

你只能为本地类型实现外部 Trait，或为外部类型实现本地 Trait，不能为外部类型实现外部 Trait。它避免不同 crate 对同一实现产生冲突。常见解决方式是 newtype 包装。

> **重点：** 孤儿规则维护全局 Trait 实现一致性。
