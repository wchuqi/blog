---
title: "Rust学习资料：Option、Result、错误处理和边界设计"
date: 2026-06-20
description: "Rust 没有空指针作为普通引用值，也没有以异常作为主要错误传播机制。可能不存在的值用 Option，可能失败的操作用 Result。这让调用方必须处理缺失和失败，错误边界会直接体现在函数签名中。"
tags:
  - "开发语言"
  - "Rust"
category: "开发语言"
---

# Rust学习资料：Option、Result、错误处理和边界设计

[返回索引](../Rust学习资料.md)

## 学习目标

- 掌握 `Option<T>` 和 `Result<T, E>`。
- 能区分可恢复错误、不可恢复错误和业务空值。
- 掌握 `?`、错误转换、错误上下文和 API 错误边界设计。

## 理论导读

Rust 没有空指针作为普通引用值，也没有以异常作为主要错误传播机制。可能不存在的值用 `Option`，可能失败的操作用 `Result`。这让调用方必须处理缺失和失败，错误边界会直接体现在函数签名中。

## 核心心智模型

`Option` 像“可能有货的货架”，`Result` 像“可能成功也可能带失败单据的流程”。`unwrap` 就是强行假设一定有货或一定成功，适合测试和原型，不适合生产边界。

## 知识点详解

### Option

```rust
fn find_user(id: u64) -> Option<String> {
    if id == 1 { Some("alice".to_string()) } else { None }
}
```

`Option` 表达“没有值是正常情况”。使用 `map`、`and_then`、`unwrap_or`、`ok_or` 可以组合处理。

### Result

```rust
use std::fs;
use std::io;

fn read_config(path: &str) -> Result<String, io::Error> {
    let content = fs::read_to_string(path)?;
    Ok(content)
}
```

`?` 会在错误时提前返回，并尝试通过 `From` 转换错误类型。

### panic

`panic!` 表示程序遇到无法继续的错误，例如违反内部不变量。库代码应谨慎 panic，公共 API 更应返回 `Result`，除非调用者违反了明确前置条件。

### 错误类型设计

应用层可以使用 `anyhow` 快速携带上下文；库层更适合用 `thiserror` 定义稳定错误类型。错误类型是 API 的一部分，过早暴露底层库错误会限制后续重构。

## 例子

```rust
use std::{fs, num::ParseIntError};

#[derive(Debug)]
enum AppError {
    Io(std::io::Error),
    Parse(ParseIntError),
}

impl From<std::io::Error> for AppError {
    fn from(value: std::io::Error) -> Self {
        Self::Io(value)
    }
}

impl From<ParseIntError> for AppError {
    fn from(value: ParseIntError) -> Self {
        Self::Parse(value)
    }
}

fn read_port(path: &str) -> Result<u16, AppError> {
    let text = fs::read_to_string(path)?;
    let port = text.trim().parse::<u16>()?;
    Ok(port)
}
```

## 练习

1. 把一个多处 `unwrap()` 的程序改成返回 `Result`。
2. 为配置加载函数区分“文件不存在”“格式错误”“端口越界”。
3. 给错误增加上下文，让日志能定位到具体文件和字段。

## 验收

- 能解释 `Option` 和 `Result` 的适用边界。
- 能使用 `?` 串联错误传播。
- 能说明应用和库的错误类型设计差异。

## 重点

- 错误是函数签名的一部分，不是附带说明。

## 难点

- 错误类型既要足够表达问题，又不能把内部实现细节全部暴露给调用方。

## 易错

> **易错：** 在生产代码中大量使用 `unwrap()` 和 `expect()`。
>
> 正确做法：只在测试、样例、不可失败的不变量处使用；外部输入、IO、网络和解析都应返回错误并带上下文。
