---
title: "测试触发和场景说明"
date: 2026-06-20
description: "本文档说明 rustproj 的测试如何触发，以及每类测试覆盖的场景。"
tags:
  - "source_code"
  - "rust_proj"
category: "源码项目"
---

# 测试触发和场景说明

本文档说明 `rust_proj` 的测试如何触发，以及每类测试覆盖的场景。

## 一键验证

在项目目录执行：

```powershell
cd D:\workspace\job_search\source_code\rust_proj
cargo fmt
cargo test
cargo clippy --all-targets -- -D warnings
```

含义：

- `cargo fmt`：格式化源码，保证风格一致。
- `cargo test`：触发所有单元测试和文档测试。
- `cargo clippy --all-targets -- -D warnings`：检查库代码和测试代码，任何 warning 都视为失败。

## 触发指定测试

只跑某个模块的测试：

```powershell
cargo test basics::tests
cargo test ownership::tests
cargo test async_model::tests
cargo test unsafe_ffi::tests
```

只跑某个场景：

```powershell
cargo test parses_exhaustive_commands
cargo test covers_mut_borrow_lifetime_and_drop
cargo test covers_async_fn_future_poll_contract_and_executor
cargo test covers_panic_boundary_and_unsafe_audit_rules
```

显示测试输出：

```powershell
cargo test -- --nocapture
```

## 测试组织方式

所有测试都放在对应源码文件的 `#[cfg(test)] mod tests` 中，属于单元测试。这样每个知识点的示例代码和测试场景在同一个文件里，便于对照学习。

测试命名约定：

- `covers_...`：表示覆盖一个知识域或一组边界场景。
- `parses_...`：表示解析类场景，通常包含合法和非法输入。
- `models_...`：表示用小模型表达较抽象的机制。

## 场景覆盖表

| 模块 | 主要测试场景 |
| --- | --- |
| `basics` | 分数等级所有分支、命令解析合法/非法输入、表达式返回值、shadowing、Unicode 字节和字符差异 |
| `ownership` | move、Copy、Clone、借用参数、可变借用、生命周期返回值、Drop 逆序 |
| `abstractions` | struct/enum 状态迁移、静态分发、动态分发、trait object、关联类型、blanket impl |
| `errors` | Option/Result、解析失败、空标题、NotFound、Conflict、External、Problem Details 映射 |
| `collections` | HashMap 计数、String 标准化、迭代器所有权、闭包捕获、Unicode 安全访问 |
| `cargo_model` | SemVer 解析、caret/exact 版本匹配、feature 合并、resolver、MSRV、lockfile、profile |
| `compiler_models` | 部分移动、reborrow、NLL、临时值生命周期、drop check、借用决策规则 |
| `memory` | Box 递归结构、Rc/Arc 引用计数、RefCell 内部可变性、Cow、布局和 niche optimization |
| `concurrency` | thread、channel、Mutex、RwLock、Send/Sync、Atomic、compare_exchange、锁顺序 |
| `async_model` | async fn、手写 Future、Poll/Waker、Pin、取消安全、背压和有界队列 |
| `macros_demo` | macro_rules 表达式、重复匹配、导出宏、derive 宏 |
| `unsafe_ffi` | raw pointer、unsafe 安全封装、repr(C)、extern "C"、MaybeUninit、panic 边界、unsafe 审查 |
| `application` | CLI 命令、HTTP 路由匹配、配置优先级、重试退避、健康检查 |
| `performance` | 内存布局、迭代器和循环等价、预分配、瓶颈分类、release profile |
| `production` | 日志脱敏、trace span、metrics、优雅关闭、发布门禁、事故复盘、质量门禁 |

## 覆盖率说明

`cargo test` 已覆盖每个模块的正常路径、错误路径和主要分支。知识点到源码/测试的完整映射见 `KNOWLEDGE_COVERAGE.md`。

本机当前没有可用的 `cargo-llvm-cov` 或 `llvm-tools-preview`，因此不能直接生成机器覆盖率百分比。若环境补齐覆盖率工具，可执行：

```powershell
cargo llvm-cov --all-targets --summary-only
```

预期质量门禁仍然是：所有测试通过、Clippy 零 warning、覆盖率报告达到 100% 后再合入。
