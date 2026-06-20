---
title: "Rust学习资料：Rust完整知识点清单"
date: 2026-06-20
description: "这份清单用于查漏补缺。Rust 是系统级语言，完整学习不能只停留在语法，必须覆盖所有权、类型系统、Cargo、并发、异步、unsafe、性能和生产工程。"
tags:
  - "开发语言"
  - "Rust"
  - "知识清单"
category: "开发语言"
---

# Rust学习资料：Rust完整知识点清单

[返回索引](../Rust学习资料.md)

这份清单用于查漏补缺。Rust 是系统级语言，完整学习不能只停留在语法，必须覆盖所有权、类型系统、Cargo、并发、异步、unsafe、性能和生产工程。

## 一、基础和术语

- Rust 定位：系统编程、内存安全、并发安全、零成本抽象。
- Rust 版本体系：stable、beta、nightly、rustup toolchain。
- Edition：2015、2018、2021、2024；Edition 不割裂生态。
- MSRV：最低支持 Rust 版本，影响依赖选择和 CI。
- crate、package、module、target、workspace。
- binary crate、library crate、proc-macro crate。

## 二、语法和类型系统

- `let`、`let mut`、shadowing。
- 表达式、语句、block 返回值。
- 标量类型：整数、浮点、布尔、char。
- 复合类型：tuple、array、slice、struct、enum。
- `match` 穷尽匹配、match guard、绑定、解构。
- `if let`、`while let`、`let else`。
- 类型推断、显式类型标注、数值转换。
- `String`、`&str`、UTF-8、字节和字符边界。

## 三、所有权、借用和生命周期

- 所有权规则、作用域释放、RAII。
- move、Copy、Clone、Drop。
- 不可变借用、可变借用、NLL。
- 借用冲突和重新借用。
- 生命周期省略规则。
- 显式生命周期、结构体生命周期、函数返回引用。
- `'static`：静态数据和 trait bound 中的含义差异。
- 常见借用错误：悬垂引用、临时值生命周期、迭代时修改容器。

## 四、抽象机制

- struct、tuple struct、unit struct。
- enum 和代数数据类型。
- impl block、方法、关联函数、关联常量。
- Trait、默认方法、trait bound、where 子句。
- 泛型、单态化、静态分发。
- `dyn Trait`、trait object、vtable、对象安全。
- 关联类型和泛型参数的选择。
- `impl Trait` 在参数和返回值中的含义。
- 孤儿规则和 newtype 模式。

## 五、错误处理

- `Option<T>` 表达缺失。
- `Result<T, E>` 表达可恢复错误。
- `?` 运算符和 `From` 错误转换。
- `panic!`、`unwrap`、`expect` 的边界。
- `thiserror`、`anyhow` 的使用场景。
- 错误上下文、错误链、用户可见错误和内部诊断错误。
- panic unwind 和 abort 策略。

## 六、集合、迭代器和闭包

- `Vec`、`VecDeque`、`HashMap`、`HashSet`、`BTreeMap`。
- `String`、`OsString`、`PathBuf`、`Cow`。
- `iter`、`iter_mut`、`into_iter`。
- Iterator adapter 和 consumer。
- `collect` 类型推断。
- 闭包捕获：不可变借用、可变借用、move。
- `Fn`、`FnMut`、`FnOnce`。

## 七、Cargo 和依赖解析

- `Cargo.toml`、`Cargo.lock`、manifest 字段。
- SemVer 版本需求：`1`、`^1.2`、`~1.2`、`=1.2.3`。
- 依赖来源：crates.io、git、path、registry。
- features 加法合并。
- resolver 1、2、3。
- Rust 2024 Edition 默认 resolver 3，参与 rust-version aware dependency resolution。
- workspace dependencies、inherited dependencies、default-features。
- `cargo tree`、`cargo update`、`cargo metadata`。
- `cargo publish`、`cargo package`、crate 文档和许可证。

## 八、测试、文档和工具

- 单元测试、集成测试、文档测试。
- `#[cfg(test)]`、feature-gated tests。
- mock、fixture、临时目录。
- property-based testing。
- benchmark 和 criterion。
- rustfmt、clippy、rustdoc。
- rust-analyzer。
- CI：fmt、clippy、test、audit、deny、coverage。

## 九、内存和智能指针

- 栈、堆、对齐、布局。
- `Box<T>`、`Rc<T>`、`Arc<T>`。
- `Cell<T>`、`RefCell<T>`、内部可变性。
- `Mutex<T>`、`RwLock<T>`。
- `Weak<T>` 防引用循环。
- `Cow<'a, T>` 延迟复制。
- `Pin<P>` 和不可移动约束。

## 十、并发和异步

- `std::thread`、join、scope thread。
- channel、消息传递、共享状态。
- `Send`、`Sync`、marker trait。
- 原子类型和内存序。
- 锁、死锁、锁粒度、锁中 IO。
- async/await、Future、Poll、Waker。
- executor、Tokio runtime、task、spawn、select。
- timeout、取消安全、背压、限流。
- 阻塞边界：`spawn_blocking`。

## 十一、宏和元编程

- `macro_rules!`。
- derive 宏、属性宏、函数式过程宏。
- TokenStream、syn、quote。
- 宏 hygiene。
- `cargo expand`。
- 常见宏生态：serde、clap、thiserror、tracing。

## 十二、unsafe 和 FFI

- unsafe 五类能力。
- 原始指针和别名规则。
- `unsafe fn` 和 unsafe block。
- unsafe trait。
- `repr(C)`、数据布局、ABI。
- C 字符串、指针、长度、释放责任。
- panic 不跨 FFI 边界。
- Miri、sanitizer、loom。
- 安全封装和 `# Safety` 文档。

## 十三、生态和应用

- CLI：clap、anyhow、tracing。
- Web：axum、actix-web、tower、hyper。
- Async：tokio、futures。
- 序列化：serde、serde_json、toml。
- 数据库：sqlx、diesel、sea-orm。
- 配置：config、figment、env。
- 日志观测：tracing、opentelemetry、metrics。
- WASM、嵌入式、系统编程、网络代理。

## 十四、性能、发布和生产

- debug/release 差异。
- profile：opt-level、lto、codegen-units、panic、strip。
- profiling：flamegraph、perf、heap profiling。
- 分配优化、零拷贝、缓存局部性。
- 异步延迟、锁竞争、连接池、背压。
- 交叉编译、musl/glibc、容器镜像。
- `cargo audit`、`cargo deny`、供应链风险。
- tracing、日志脱敏、错误上下文、指标和告警。

## 十五、面试和评估标准

- 能解释而不是背诵所有权。
- 能写最小代码验证借用、Trait、Result、并发问题。
- 能说明生产边界：错误、日志、安全、发布、排障。
- 能读懂编译器错误并定位设计问题。
- 能评估 crate 引入风险和维护成本。

## 十六、深水区机制

- MIR、NLL、move path、drop check、临时值生命周期。
- Trait coherence、孤儿规则、blanket impl、对象安全、vtable、单态化代码体积。
- Cargo resolver 3、feature unification、MSRV、workspace 依赖治理、供应链审计。
- Future 状态机、Poll/Waker、Pin、自引用、取消安全、Tokio worker 和背压。
- Send/Sync auto trait、Mutex/RwLock/channel/atomic 选择、Acquire/Release/Relaxed/SeqCst。
- unsafe 别名模型、Stacked Borrows、MaybeUninit、repr、FFI 所有权、Miri。
- 内存布局、niche optimization、分配、缓存局部性、criterion、flamegraph。
- 生产错误分层、tracing、metrics、配置优先级、优雅关闭、灰度发布、事故复盘。

## 完整性自查

- [ ] 我能解释 Rust 和 C++/Go/Java 的内存模型差异。
- [ ] 我能不用 clone 解决常见借用问题。
- [ ] 我能设计稳定的库 API 错误类型。
- [ ] 我能组织 workspace 并解释依赖解析。
- [ ] 我能写线程并发和异步并发代码。
- [ ] 我能审查 unsafe 的不变量。
- [ ] 我能为 Rust 服务配置观测、测试、安全和发布流程。
- [ ] 我能分析借用检查、Trait 分发、Cargo 解析、Future 调度和 unsafe 别名模型的底层机制。
