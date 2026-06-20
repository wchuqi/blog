---
title: "Rust学习资料：结构体枚举Trait和泛型"
date: 2026-06-20
description: "Rust 没有传统类继承，主要用结构体表达数据，用枚举表达有限状态，用 Trait 表达可被不同类型实现的行为。泛型让同一段代码适用于多种类型，而 Trait bound 规定这些类型必须具备什么能力。"
tags:
  - "开发语言"
  - "Rust"
category: "开发语言"
---

# Rust学习资料：结构体枚举Trait和泛型

[返回索引](../Rust学习资料.md)

## 学习目标

- 掌握 struct、enum、impl、method、associated function。
- 理解 Trait 是行为契约，泛型是类型参数化。
- 区分静态分发、动态分发、关联类型和泛型参数。

## 理论导读

Rust 没有传统类继承，主要用结构体表达数据，用枚举表达有限状态，用 Trait 表达可被不同类型实现的行为。泛型让同一段代码适用于多种类型，而 Trait bound 规定这些类型必须具备什么能力。

## 核心心智模型

struct 是数据表单，enum 是封闭状态机，Trait 是能力清单。泛型函数不是“什么都能收”，而是“只收满足能力清单的类型”。

## 知识点详解

### struct 和 impl

```rust
struct Point {
    x: i32,
    y: i32,
}

impl Point {
    fn new(x: i32, y: i32) -> Self {
        Self { x, y }
    }

    fn distance_from_origin(&self) -> f64 {
        ((self.x * self.x + self.y * self.y) as f64).sqrt()
    }
}
```

### enum 表达状态

```rust
enum JobState {
    Pending,
    Running { worker: String },
    Done { output: String },
    Failed { reason: String },
}
```

枚举能把状态和状态携带的数据绑在一起，比用字符串状态码更不容易漏处理。

### Trait 和泛型

```rust
trait Render {
    fn render(&self) -> String;
}

fn print_rendered<T: Render>(value: &T) {
    println!("{}", value.render());
}
```

默认泛型通常使用静态分发，编译器为具体类型生成代码。`dyn Trait` 使用动态分发，通过 vtable 在运行时调用。

### 关联类型

```rust
trait Repository {
    type Item;

    fn get(&self, id: u64) -> Option<Self::Item>;
}
```

关联类型适合“实现者决定输出类型”的场景，例如 Iterator 的 `Item`。

## 例子

```rust
trait Storage {
    fn save(&mut self, value: String);
    fn list(&self) -> Vec<String>;
}

struct MemoryStorage {
    values: Vec<String>,
}

impl Storage for MemoryStorage {
    fn save(&mut self, value: String) {
        self.values.push(value);
    }

    fn list(&self) -> Vec<String> {
        self.values.clone()
    }
}
```

## 练习

1. 用 enum 表达订单状态，并写 `can_cancel` 方法。
2. 为不同日志后端实现同一个 `Logger` Trait。
3. 分别用泛型和 `Box<dyn Trait>` 写同一个函数，比较调用和扩展方式。

## 验收

- 能解释 struct 和 enum 各自适合表达什么。
- 能写 Trait、impl 和 trait bound。
- 能说明 `impl Trait`、`T: Trait`、`dyn Trait` 的差异。

## 重点

- Rust 的抽象组合主要靠 enum、Trait 和泛型，而不是继承层级。

## 难点

- 静态分发性能好、类型明确，但可能增加编译产物；动态分发更灵活，但需要指针间接调用和对象安全约束。

## 易错

> **易错：** 把 Trait 当成 Java interface 完全照搬。
>
> 正确做法：同时理解 Trait bound、关联类型、默认方法、对象安全、孤儿规则和动态分发。
