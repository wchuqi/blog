---
title: "Rust 文档知识点源码和测试覆盖矩阵"
date: 2026-06-20
description: "本项目根据 开发语言/Rust 下的全部 Markdown 文档建立。每个源码模块都包含同文件单元测试，测试名称以 covers... 标识对应知识域。"
tags:
  - "source_code"
  - "rust_proj"
category: "源码项目"
---

# Rust 文档知识点源码和测试覆盖矩阵

本项目根据 `开发语言/Rust` 下的全部 Markdown 文档建立。每个源码模块都包含同文件单元测试，测试名称以 `covers_...` 标识对应知识域。

> 说明：本机工具链为 `rustc 1.78.0`，尚不支持 Edition 2024 编译，因此项目使用 `edition = "2021"`；Edition 2024、resolver 3、MSRV 等内容在 `cargo_model` 中以可测试模型覆盖。

## 模块索引

| 模块 | 覆盖重点 | 单元测试 |
| --- | --- | --- |
| `src/basics.rs` | 变量、可变性、表达式、基础类型、控制流、模式匹配、字符串 Unicode、坐标建模 | 3 |
| `src/ownership.rs` | move、Copy、Clone、借用、可变借用、生命周期、Drop 顺序、参数所有权意图 | 2 |
| `src/abstractions.rs` | struct、enum、impl、Trait、泛型、静态/动态分发、关联类型、blanket impl、对象安全 | 3 |
| `src/errors.rs` | Option、Result、错误 enum、Display/Error、panic 边界、Problem Details 错误映射 | 2 |
| `src/collections.rs` | Vec、HashMap、String、&str、迭代器所有权、闭包捕获、安全字符访问 | 2 |
| `src/cargo_model.rs` | package、crate target、profile、Cargo 命令、SemVer、feature unification、resolver、MSRV、lockfile | 3 |
| `src/compiler_models.rs` | move path、部分移动、reborrow、NLL、临时值生命周期、drop check、借用决策规则 | 2 |
| `src/memory.rs` | Box、递归类型、Rc、Arc、RefCell、Cow、内存布局、niche optimization | 2 |
| `src/concurrency.rs` | thread、channel、Arc/Mutex、RwLock、Send/Sync、Atomic、内存序、compare_exchange、锁顺序 | 2 |
| `src/async_model.rs` | async fn、Future、Poll、Waker、Pin、取消安全、背压、有界队列 | 2 |
| `src/macros_demo.rs` | macro_rules、重复匹配、导出宏、derive 宏、宏展开结果 | 1 |
| `src/unsafe_ffi.rs` | unsafe 五类能力中的原始指针、repr(C)、extern "C"、MaybeUninit、panic 边界、unsafe 审查清单 | 2 |
| `src/application.rs` | CLI、路由匹配、配置优先级、重试退避、健康检查、系统边界 | 2 |
| `src/performance.rs` | 内存布局、零成本迭代、预分配、性能瓶颈分类、release profile | 2 |
| `src/production.rs` | tracing span、日志脱敏、metrics、优雅关闭、发布门禁、事故复盘、质量门禁 | 2 |

## 文档到源码映射

| 文档 | 对应源码和测试 |
| --- | --- |
| `Rust学习资料.md` | 全项目索引；由本矩阵和所有模块共同覆盖 |
| `Rust学习路线图.md` | `basics`、`ownership`、`abstractions`、`cargo_model`、`concurrency`、`async_model`、`unsafe_ffi`、`performance`、`production` |
| `00-总览与心智模型.md` | `ownership`、`errors`、`cargo_model`、`production` |
| `01-环境工具链Cargo和项目结构.md` | `cargo_model` |
| `02-基础语法类型系统和模式匹配.md` | `basics` |
| `03-所有权借用和生命周期.md` | `ownership`、`compiler_models` |
| `04-结构体枚举Trait和泛型.md` | `abstractions` |
| `05-OptionResult错误处理和边界设计.md` | `errors` |
| `06-集合字符串迭代器和闭包.md` | `collections` |
| `07-模块CrateWorkspace和依赖解析.md` | `cargo_model` |
| `08-测试文档调试和质量工具.md` | 所有 `#[cfg(test)]` 单元测试、`cargo test`、`cargo clippy` |
| `09-内存模型智能指针和内部可变性.md` | `memory`、`unsafe_ffi` |
| `10-并发线程消息和共享状态.md` | `concurrency` |
| `11-异步FutureTokio和运行时边界.md` | `async_model` |
| `12-宏派生宏和过程宏.md` | `macros_demo` |
| `13-unsafeFFI和安全边界.md` | `unsafe_ffi` |
| `14-CLIWeb系统编程和生态应用.md` | `application` |
| `15-性能生产排障安全和发布.md` | `performance`、`production` |
| `16-面试知识点整理.md` | `abstractions`、`ownership`、`cargo_model`、`concurrency`、`async_model`、`unsafe_ffi`、`production` |
| `17-Rust完整知识点清单.md` | 本表全部模块 |
| `18-综合练习项目.md` | `abstractions`、`errors`、`application`、`production` |
| `19-深度实验手册和能力验收.md` | `compiler_models`、`cargo_model`、`concurrency`、`async_model`、`unsafe_ffi`、`performance` |
| `20-借用检查器MIR和生命周期推导深度解析.md` | `compiler_models`、`ownership` |
| `21-Trait系统单态化对象安全和一致性深度解析.md` | `abstractions` |
| `22-CargoResolverFeatureMSRV和供应链深度解析.md` | `cargo_model`、`production` |
| `23-FuturePin取消安全和Tokio调度深度解析.md` | `async_model` |
| `24-SendSync原子内存序和并发正确性深度解析.md` | `concurrency` |
| `25-unsafe别名模型FFI和Miri深度解析.md` | `unsafe_ffi`、`memory` |
| `26-性能剖析内存布局和零成本抽象深度解析.md` | `performance`、`memory` |
| `27-生产架构错误可观测性和发布治理深度解析.md` | `production`、`application`、`errors` |
| `面试知识点/01-基础语法和类型系统.md` | `basics`、`collections` |
| `面试知识点/02-所有权借用和生命周期.md` | `ownership`、`compiler_models` |
| `面试知识点/03-Trait泛型和错误处理.md` | `abstractions`、`errors` |
| `面试知识点/04-Cargo工程化和依赖解析.md` | `cargo_model` |
| `面试知识点/05-并发异步和运行时.md` | `concurrency`、`async_model` |
| `面试知识点/06-unsafeFFI和生产实践.md` | `unsafe_ffi`、`production` |
| `面试知识点/07-深度机制和生产场景题.md` | `compiler_models`、`abstractions`、`cargo_model`、`async_model`、`concurrency`、`unsafe_ffi`、`performance`、`production` |

## 验证命令

```powershell
cargo fmt
cargo test
cargo clippy --all-targets -- -D warnings
```

已验证：32 个单元测试全部通过，Clippy 零警告。

覆盖率工具状态：本机未安装 `cargo-llvm-cov`，`rustup` 也未安装 `llvm-tools-preview`；尝试安装时 Cargo registry 被本机配置指向失效的 USTC/TUNA 镜像，未能生成机器覆盖率百分比。当前源码按模块和分支编写测试，并通过本矩阵保证每个文档知识点有对应源码与单元测试。
