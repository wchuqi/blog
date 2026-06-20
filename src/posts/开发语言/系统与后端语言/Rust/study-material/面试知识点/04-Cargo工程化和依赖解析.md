---
title: "Rust面试知识点：Cargo 工程化和依赖解析"
date: 2026-06-20
description: "package 是包含 Cargo.toml 的发布和配置单位；crate 是编译单元；module 是 crate 内部命名空间；workspace 是多个 package 的共同管理边界。"
tags:
  - "开发语言"
  - "Rust"
  - "面试"
category: "开发语言"
---

# Rust面试知识点：Cargo 工程化和依赖解析

[返回面试索引](../16-面试知识点整理.md)

[返回学习资料索引](../../Rust学习资料.md)

## 一、Cargo 工程化和依赖解析

### 1. package、crate、module、workspace 的区别是什么？

**参考答案：**

package 是包含 `Cargo.toml` 的发布和配置单位；crate 是编译单元；module 是 crate 内部命名空间；workspace 是多个 package 的共同管理边界。

> **易错：** `mod` 负责声明模块，`use` 只是引入路径名称。

### 2. Cargo.lock 有什么作用？

**参考答案：**

`Cargo.lock` 固定依赖解析结果，保证之后构建使用相同版本。应用项目通常提交 lockfile；库项目是否提交要看团队规范，但发布到 crates.io 时库依赖仍按版本约束解析。

> **重点：** lockfile 解决可复现构建，不替代 SemVer 约束设计。

### 3. Cargo features 为什么容易踩坑？

**参考答案：**

features 是加法合并模型，一个依赖被多个 crate 启用不同 feature 时，最终通常取并集。这可能导致你没直接启用的能力被其他路径打开，影响编译时间、二进制大小、平台兼容和安全边界。

> **难点：** 要用 `cargo tree -e features` 看实际 feature 图。

### 4. Rust 2024 Edition 和 resolver 3 有什么关系？

**参考答案：**

Rust 2024 Edition 下 `edition = "2024"` 会隐含 Cargo resolver 3。resolver 3 会启用 rust-version aware dependency resolution，依赖选择会考虑 `package.rust-version` 的兼容性。resolver 是 workspace 全局设置，虚拟 workspace 需要显式写在 `[workspace]`。

> **重点：** Edition、resolver、MSRV 是工程兼容性的共同边界。
