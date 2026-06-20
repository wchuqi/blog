---
title: "Rust学习资料"
date: 2026-06-20
description: "这是一套面向 Rust 2024 Edition 的中文学习资料。内容从基础语法、所有权、借用、生命周期开始，逐步推进到 Trait、泛型、Cargo 工程化、并发、异步、unsafe、FFI、性能、生产排障和面试准备。"
tags:
  - "开发语言"
  - "Rust"
  - "学习资料总览"
category: "开发语言"
---

# Rust学习资料

这是一套面向 Rust 2024 Edition 的中文学习资料。内容从基础语法、所有权、借用、生命周期开始，逐步推进到 Trait、泛型、Cargo 工程化、并发、异步、unsafe、FFI、性能、生产排障和面试准备。

版本假设：以 stable Rust 1.96.0 和 Rust 2024 Edition 为主要学习目标。Rust 1.96.0 于 2026-05-28 发布；Rust 2024 Edition 下 `cargo new` 默认生成 `edition = "2024"`，并隐含 Cargo resolver 3。旧项目迁移时仍要按项目 MSRV 和依赖生态评估。

官方参考入口：

- Rust release: https://blog.rust-lang.org/releases/latest/
- Rust Edition Guide: https://doc.rust-lang.org/edition-guide/
- The Rust Book: https://doc.rust-lang.org/book/
- Cargo Book: https://doc.rust-lang.org/cargo/

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览、适用场景和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 环境、工具链、Cargo 和项目结构 | [01-环境工具链Cargo和项目结构.md](study-material/01-环境工具链Cargo和项目结构.md) |
| 2 | 基础语法、类型系统和模式匹配 | [02-基础语法类型系统和模式匹配.md](study-material/02-基础语法类型系统和模式匹配.md) |
| 3 | 所有权、借用和生命周期 | [03-所有权借用和生命周期.md](study-material/03-所有权借用和生命周期.md) |
| 4 | 结构体、枚举、Trait 和泛型 | [04-结构体枚举Trait和泛型.md](study-material/04-结构体枚举Trait和泛型.md) |
| 5 | Option、Result、错误处理和边界设计 | [05-OptionResult错误处理和边界设计.md](study-material/05-OptionResult错误处理和边界设计.md) |
| 6 | 集合、字符串、迭代器和闭包 | [06-集合字符串迭代器和闭包.md](study-material/06-集合字符串迭代器和闭包.md) |
| 7 | 模块、Crate、Workspace 和依赖解析 | [07-模块CrateWorkspace和依赖解析.md](study-material/07-模块CrateWorkspace和依赖解析.md) |
| 8 | 测试、文档、调试和质量工具 | [08-测试文档调试和质量工具.md](study-material/08-测试文档调试和质量工具.md) |
| 9 | 内存模型、智能指针和内部可变性 | [09-内存模型智能指针和内部可变性.md](study-material/09-内存模型智能指针和内部可变性.md) |
| 10 | 并发、线程、消息和共享状态 | [10-并发线程消息和共享状态.md](study-material/10-并发线程消息和共享状态.md) |
| 11 | 异步、Future、Tokio 和运行时边界 | [11-异步FutureTokio和运行时边界.md](study-material/11-异步FutureTokio和运行时边界.md) |
| 12 | 宏、派生宏和过程宏 | [12-宏派生宏和过程宏.md](study-material/12-宏派生宏和过程宏.md) |
| 13 | unsafe、FFI 和安全边界 | [13-unsafeFFI和安全边界.md](study-material/13-unsafeFFI和安全边界.md) |
| 14 | CLI、Web、系统编程和生态应用 | [14-CLIWeb系统编程和生态应用.md](study-material/14-CLIWeb系统编程和生态应用.md) |
| 15 | 性能、生产排障、安全和发布 | [15-性能生产排障安全和发布.md](study-material/15-性能生产排障安全和发布.md) |
| 16 | 面试知识点整理 | [16-面试知识点整理.md](study-material/16-面试知识点整理.md) |
| 17 | Rust 完整知识点清单 | [17-Rust完整知识点清单.md](study-material/17-Rust完整知识点清单.md) |
| 18 | 综合练习项目 | [18-综合练习项目.md](study-material/18-综合练习项目.md) |
| 19 | 深度实验手册和能力验收 | [19-深度实验手册和能力验收.md](study-material/19-深度实验手册和能力验收.md) |
| 20 | 借用检查器、MIR 和生命周期推导深度解析 | [20-借用检查器MIR和生命周期推导深度解析.md](study-material/20-借用检查器MIR和生命周期推导深度解析.md) |
| 21 | Trait 系统、单态化、对象安全和一致性深度解析 | [21-Trait系统单态化对象安全和一致性深度解析.md](study-material/21-Trait系统单态化对象安全和一致性深度解析.md) |
| 22 | Cargo Resolver、Feature、MSRV 和供应链深度解析 | [22-CargoResolverFeatureMSRV和供应链深度解析.md](study-material/22-CargoResolverFeatureMSRV和供应链深度解析.md) |
| 23 | Future、Pin、取消安全和 Tokio 调度深度解析 | [23-FuturePin取消安全和Tokio调度深度解析.md](study-material/23-FuturePin取消安全和Tokio调度深度解析.md) |
| 24 | Send、Sync、原子内存序和并发正确性深度解析 | [24-SendSync原子内存序和并发正确性深度解析.md](study-material/24-SendSync原子内存序和并发正确性深度解析.md) |
| 25 | unsafe 别名模型、FFI 和 Miri 深度解析 | [25-unsafe别名模型FFI和Miri深度解析.md](study-material/25-unsafe别名模型FFI和Miri深度解析.md) |
| 26 | 性能剖析、内存布局和零成本抽象深度解析 | [26-性能剖析内存布局和零成本抽象深度解析.md](study-material/26-性能剖析内存布局和零成本抽象深度解析.md) |
| 27 | 生产架构、错误、可观测性和发布治理深度解析 | [27-生产架构错误可观测性和发布治理深度解析.md](study-material/27-生产架构错误可观测性和发布治理深度解析.md) |

## 使用建议

先读 [Rust学习路线图.md](Rust学习路线图.md)，再按上表顺序学习。Rust 的学习瓶颈通常不是语法，而是把所有权、借用、生命周期、Trait 约束、错误边界和异步执行模型连成一张图。

复习时优先看每章的 `重点`、`难点`、`易错`。准备面试时先看 [16-面试知识点整理.md](study-material/16-面试知识点整理.md)，再阅读 `study-material/面试知识点/` 下的分类题。

如果你已经有 Rust 基础，建议直接阅读第 20 到 27 章的深度专题。这部分重点解释编译器检查模型、Trait 一致性、Cargo 解析规则、Future 状态机、并发内存模型、unsafe 不变量、性能剖析和生产治理。

## 产出建议

学习过程中至少完成四个产出：一个 CLI 工具、一个带测试的库 crate、一个异步 HTTP 服务、一个包含 unsafe 或 FFI 边界说明的小实验。最后用 [18-综合练习项目.md](study-material/18-综合练习项目.md) 和 [19-深度实验手册和能力验收.md](study-material/19-深度实验手册和能力验收.md) 做综合验收。
