---
title: "Rust学习资料：unsafe 别名模型、FFI 和 Miri 深度解析"
date: 2026-06-20
description: "unsafe 的危险不在于语法，而在于编译器无法继续替你证明某些不变量。Rust 优化器会基于引用规则做优化：&mut T 通常代表独占访问，&T 代表共享只读。如果 unsafe 代码制造了违反这些假设的别名，即使程序看起来能跑，也可能是…"
tags:
  - "开发语言"
  - "Rust"
  - "深度解析"
category: "开发语言"
---

# Rust学习资料：unsafe 别名模型、FFI 和 Miri 深度解析

[返回索引](../Rust学习资料.md)

## 学习目标

- 深入理解 unsafe 代码需要维护的别名、对齐、初始化、生命周期和线程安全不变量。
- 掌握 FFI 安全封装的设计检查项。
- 能用 Miri、sanitizer、fuzz 和审查清单提高 unsafe 可信度。

## 理论导读

unsafe 的危险不在于语法，而在于编译器无法继续替你证明某些不变量。Rust 优化器会基于引用规则做优化：`&mut T` 通常代表独占访问，`&T` 代表共享只读。如果 unsafe 代码制造了违反这些假设的别名，即使程序看起来能跑，也可能是未定义行为。

Rust 的别名模型仍在演进，Stacked Borrows 是 Miri 使用的一种操作模型。学习它的意义不是背所有细节，而是理解“引用和原始指针不是随便互转后都能任意访问”。

## 核心心智模型

unsafe 像在类型系统背后签承诺书。安全 Rust 调用方仍然相信你的 API 满足 Rust 规则；如果 unsafe 内部破坏规则，外部安全代码也会被污染。

## unsafe 不变量清单

| 类别 | 必须保证 |
| --- | --- |
| 指针有效性 | 非空或允许空、指向已分配对象、长度范围内 |
| 对齐 | 指针满足目标类型 alignment |
| 初始化 | 读取前值已初始化，drop 前对象有效 |
| 别名 | `&mut` 独占，`&` 共享期间不被非法修改 |
| 生命周期 | 返回引用不超过底层数据 |
| 线程安全 | 跨线程访问有同步，Send/Sync 实现真实可靠 |
| 释放责任 | 谁分配谁释放，不能重复释放或泄漏不可接受资源 |
| panic 边界 | panic 不穿过不允许 unwind 的 ABI |

## 机制拆解

### 1. 原始指针不等于免规则

```rust
let mut x = 1;
let r = &mut x;
let p = r as *mut i32;

unsafe {
    *p = 2;
}
```

这类代码在简单场景可行，但一旦同时保留其他引用、跨函数传递或让优化器假设独占访问，就可能触发未定义行为。不要把原始指针当成绕开借用规则的常规工具。

### 2. MaybeUninit

未初始化内存不能当成已初始化值读取。`MaybeUninit<T>` 用于分阶段初始化数组、FFI 输出参数等场景。

```rust
use std::mem::MaybeUninit;

let mut value = MaybeUninit::<u32>::uninit();
value.write(42);
let value = unsafe { value.assume_init() };
```

### 3. repr

Rust 默认布局不稳定，不能假设字段顺序和 padding。跨 FFI 或二进制协议要使用 `#[repr(C)]`、`#[repr(transparent)]` 等，并仍然检查对齐、大小和 ABI。

### 4. FFI 所有权

C 返回的指针必须明确：

- 是否允许为空。
- 指向单个对象还是数组。
- 长度从哪里来。
- 谁负责释放。
- 用哪个函数释放。
- 是否线程安全。

### 5. panic 和 ABI

除非使用支持 unwind 的 ABI 并明确设计，否则不要让 Rust panic 穿过 C 边界。用 `catch_unwind` 在边界内转成错误码。

## 工具

```powershell
cargo miri test
RUSTFLAGS="-Zsanitizer=address" cargo +nightly test
cargo fuzz run target_name
```

Miri 能发现许多未定义行为，例如越界、use-after-free、违反借用模型、读取未初始化内存。它不是性能测试，也不能覆盖所有平台和 FFI 行为。

## 例子：安全封装形状

```rust
/// Returns a shared view over a raw byte buffer.
///
/// # Safety
///
/// `ptr` must be non-null, valid for `len` bytes, properly aligned for `u8`,
/// and the memory must not be mutated for the returned lifetime.
pub unsafe fn bytes_from_raw<'a>(ptr: *const u8, len: usize) -> &'a [u8] {
    std::slice::from_raw_parts(ptr, len)
}
```

更好的公共 API 应避免让普通调用方直接承担这些条件，例如把 unsafe 函数保持为内部实现，由构造函数验证输入。

## 审查问题

- unsafe 块是否最小？
- 是否有 `# Safety` 文档？
- 是否能把 unsafe 包在安全 API 后？
- 是否有 Miri 测试？
- 是否存在别名冲突、重复释放、panic 跨边界？
- 是否手动实现 Send/Sync？依据是什么？

## 练习

1. 用 `MaybeUninit` 初始化固定长度数组，并解释每个 unsafe 前置条件。
2. 封装一个 C 字符串输入函数，处理空指针和 UTF-8 错误。
3. 找一个使用 unsafe 的 crate，写一份安全不变量审查报告。

## 验收

- 能说明 unsafe 和未定义行为的关系。
- 能写出 FFI 封装的 Safety 文档。
- 能用 Miri 发现至少一类 unsafe 错误。

## 重点

- unsafe 代码的目标是把无法证明的部分隔离在小边界内，并让外部 API 重新回到安全 Rust。

## 难点

- 未定义行为可能不会立刻崩溃，而是在优化、平台或负载变化后表现为诡异错误。

## 易错

> **易错：** 认为测试通过就证明 unsafe 正确。
>
> 正确做法：测试只能增加信心，unsafe 正确性还需要不变量证明、工具检查和代码审查。
