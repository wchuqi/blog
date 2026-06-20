---
title: "Rust学习资料：unsafe、FFI 和安全边界"
date: 2026-06-20
description: "unsafe 是 Rust 和底层世界连接的边界。它允许解引用原始指针、调用 unsafe 函数、访问或修改可变静态变量、实现 unsafe trait、访问 union 字段。unsafe 代码必须由开发者维护编译器无法证明的不变量。"
tags:
  - "开发语言"
  - "Rust"
category: "开发语言"
---

# Rust学习资料：unsafe、FFI 和安全边界

[返回索引](../Rust学习资料.md)

## 学习目标

- 掌握 unsafe 允许的额外能力。
- 理解 unsafe 不关闭借用检查，也不自动让代码不安全。
- 能为 unsafe 封装写 Safety 文档，能识别 FFI 边界风险。

## 理论导读

`unsafe` 是 Rust 和底层世界连接的边界。它允许解引用原始指针、调用 unsafe 函数、访问或修改可变静态变量、实现 unsafe trait、访问 union 字段。unsafe 代码必须由开发者维护编译器无法证明的不变量。

## 核心心智模型

unsafe 像进入机房维护设备：门禁允许你进来，但你仍要遵守电力、散热、线缆和操作流程。好的 unsafe 封装会把机房门缩小，只给外部一个安全按钮。

## 知识点详解

### unsafe 块

```rust
let mut value = 10;
let ptr = &mut value as *mut i32;

unsafe {
    *ptr += 1;
}
```

原始指针可以为空、悬垂、别名冲突，解引用时必须由开发者保证有效。

### 安全封装

unsafe 应尽量局部化，并通过安全 API 暴露。文档必须写清调用前置条件、别名规则、生命周期、线程安全和释放责任。

### FFI

调用 C ABI 时要关注：

- 数据布局：`#[repr(C)]`。
- 字符串和缓冲区：空终止、编码、长度。
- 所有权：谁分配，谁释放。
- panic 边界：不要让 Rust panic 穿过 C ABI。
- 线程和回调：回调是否跨线程、是否长期保存指针。

## 例子

```rust
#[repr(C)]
pub struct Point {
    x: i32,
    y: i32,
}

unsafe extern "C" {
    fn abs(input: i32) -> i32;
}

fn safe_abs(input: i32) -> i32 {
    unsafe { abs(input) }
}
```

## 练习

1. 给一个 unsafe 函数写 `# Safety` 文档。
2. 封装一个接收裸指针和长度的函数为安全 slice API。
3. 查找一个 crate 中的 unsafe 块，分析它维护的不变量。

## 验收

- 能列出 unsafe 五类能力。
- 能说明 unsafe 封装的安全不变量。
- 能识别 FFI 的所有权、布局和 panic 风险。

## 重点

- unsafe 的目标不是到处写底层代码，而是把无法静态证明的部分缩小、隔离、审查。

## 难点

- unsafe 的正确性往往依赖全局不变量，单看一行代码无法判断是否安全。

## 易错

> **易错：** 认为加了 `unsafe` 就可以绕过 Rust 所有规则。
>
> 正确做法：unsafe 只开放少数额外操作，借用、生命周期、类型检查仍然存在；真正风险在开发者必须手工保证不变量。
