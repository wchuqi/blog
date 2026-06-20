---
title: "rustproj"
date: 2026-06-20
description: "根据 开发语言/Rust 文档生成的 Rust 学习源码项目。项目使用标准库实现可运行示例，并为每个知识域提供同文件单元测试。"
tags:
  - "source_code"
  - "rust_proj"
category: "源码项目"
---

# rust_proj

根据 `开发语言/Rust` 文档生成的 Rust 学习源码项目。项目使用标准库实现可运行示例，并为每个知识域提供同文件单元测试。

## 运行

```powershell
cargo test
cargo clippy --all-targets -- -D warnings
```

## 覆盖矩阵

知识点到源码和测试的映射见 `KNOWLEDGE_COVERAGE.md`。

测试触发方式、单个场景运行方式和测试场景说明见 `TESTING.md`。

## 工具链说明

当前本机工具链是 `rustc 1.78.0`，项目使用 `edition = "2021"`。Rust 2024、resolver 3、MSRV 等工程化知识点在 `src/cargo_model.rs` 中用可测试模型覆盖。
