---
title: "Rust学习路线图"
date: 2026-06-20
description: "版本基准：Rust 1.96.0 stable、Rust 2024 Edition。目标是从能写简单程序，逐步达到能独立设计 Rust 服务、库和系统工具，并能解释所有权、Trait、异步和 unsafe 边界。"
tags:
  - "开发语言"
  - "Rust"
  - "学习路线图"
category: "开发语言"
---

# Rust学习路线图

版本基准：Rust 1.96.0 stable、Rust 2024 Edition。目标是从能写简单程序，逐步达到能独立设计 Rust 服务、库和系统工具，并能解释所有权、Trait、异步和 unsafe 边界。

## 阶段 1：基础认知

- 目标：理解 Rust 解决的问题，建立“值有唯一所有者、借用有范围、编译器提前阻止内存错误”的心智模型。
- 需要掌握：安装 rustup、cargo new、cargo run、变量绑定、标量和复合类型、函数、控制流、match、if let、基础模块。
- 例子：写一个读取命令行参数并计算文件行数的小程序。
- 练习：实现温度转换、猜数字、简单 CSV 行解析。
- 验收：能创建 Rust 2024 项目，能解释 `let` 默认不可变、表达式返回值、`match` 穷尽性。
- 重点：Rust 的核心不是“语法更难”，而是把所有权和错误边界放进类型系统。
- 易错：用其他语言的“变量是盒子”模型理解 Rust，导致不理解 move 和 borrow。

## 阶段 2：所有权和类型系统

- 目标：掌握所有权、借用、生命周期、结构体、枚举、Trait、泛型。
- 需要掌握：move、Copy、Clone、引用、可变借用、生命周期标注、Option、Result、trait bound、关联类型、动态分发。
- 例子：实现一个任务列表库，支持添加、查询、状态变更和序列化。
- 练习：把 panic 风格代码改成 Result 风格；把重复函数抽象成泛型和 Trait。
- 验收：能解释为什么同时存在多个不可变借用或一个可变借用，不能混用；能读懂常见借用检查错误。
- 重点：生命周期不是“延长对象寿命”，而是描述引用关系的约束。
- 易错：看到生命周期报错就给所有引用加同一个 `'a`，反而把本来独立的生命周期绑死。

## 阶段 3：工程化和生态

- 目标：能组织可维护 Rust 项目，理解 Cargo、Workspace、依赖、测试、文档和发布。
- 需要掌握：package、crate、module、workspace、features、Cargo.lock、MSRV、resolver 3、cargo test、clippy、rustfmt、doc tests。
- 例子：把任务列表拆成库 crate、CLI crate 和集成测试。
- 练习：为 crate 增加 feature 开关；编写单元测试、集成测试和文档测试。
- 验收：能解释依赖版本选择、feature unification、为什么库不提交或不强依赖 lockfile 策略要看团队规范。
- 重点：Cargo resolver 是全 workspace 决策，不是每个依赖单独决定。
- 易错：把 `mod` 当成文件导入，把 crate 名、包名、模块路径混为一谈。

## 阶段 4：并发、异步和系统边界

- 目标：能写安全并发代码，理解线程、锁、channel、Send、Sync、Future、Pin、Tokio 运行时。
- 需要掌握：std::thread、Arc、Mutex、RwLock、mpsc、Send/Sync、async/await、Future 状态机、Tokio task、select、取消安全。
- 例子：实现异步 HTTP 抓取器，限制并发数并收集结果。
- 练习：把阻塞 IO 服务改成 Tokio 版本；定位一次死锁或任务饥饿问题。
- 验收：能解释为什么 `Rc` 不能跨线程，为什么 async 函数返回 Future，为什么不能在 Tokio worker 中直接长时间阻塞。
- 重点：Rust 的并发安全来自类型系统和所有权，不是没有锁。
- 难点：异步里的生命周期、Pin、自引用 Future、取消安全和背压。

## 阶段 5：unsafe、性能和生产实践

- 目标：能审查 unsafe 边界，做性能优化、发布、可观测性和生产排障。
- 需要掌握：unsafe 五类能力、原始指针、FFI、repr、Drop、panic/unwind、criterion、flamegraph、tracing、供应链安全、交叉编译。
- 例子：封装一个 C 函数为安全 Rust API，并写明不变量。
- 练习：用 criterion 比较迭代器和手写循环；为服务增加 tracing span 和错误上下文。
- 验收：能说明 unsafe 不关闭借用检查，unsafe 只是允许部分额外操作；能写出 unsafe 封装的 Safety 文档。
- 重点：unsafe 的目标是把风险缩小到少数边界，并给外部暴露安全 API。
- 易错：把性能问题直接归因于 Rust 或编译器，不先看算法、分配、锁竞争、IO 和日志开销。

## 阶段 6：编译器、运行时和生产深水区

- 目标：能从编译器模型、依赖解析、运行时调度和生产故障角度解释 Rust 程序，而不是只会写通过编译的代码。
- 需要掌握：MIR、NLL、借用区域推导、drop check、Trait coherence、对象安全、单态化、Cargo resolver 3、feature unification、Future 状态机、Pin、取消安全、Send/Sync auto trait、原子内存序、Stacked Borrows、Miri、profiling、tracing 和发布治理。
- 例子：分析一个 async 服务的延迟尖刺，定位是阻塞调用、锁竞争、连接池耗尽、日志过量还是依赖服务慢。
- 练习：用 `cargo tree -e features` 分析 feature 图；用 Miri 检查 unsafe 封装；用 flamegraph 分析热点；用 tracing span 串联一次请求。
- 验收：能写出一份 Rust 生产故障复盘，包含触发条件、类型系统没能覆盖的边界、诊断证据、修复方案和回归测试。
- 重点：高级 Rust 不是堆砌特性，而是知道哪些不变量由编译器证明，哪些必须靠设计、测试和观测守住。
- 易错：把“通过编译”当成“逻辑正确、性能正确、生产安全”。

## 推荐学习节奏

| 周期 | 学习重点 | 产出 |
| --- | --- | --- |
| 第 1 周 | 环境、语法、match、结构体、枚举 | 3 个小程序 |
| 第 2 周 | 所有权、借用、生命周期、错误处理 | 一个小型库 crate |
| 第 3 周 | Trait、泛型、迭代器、模块、Cargo | 带测试和文档的 workspace |
| 第 4 周 | 并发、异步、Tokio、tracing | 异步 HTTP 服务 |
| 第 5 周 | unsafe、FFI、性能、安全和发布 | 综合项目和排障报告 |
| 第 6 周 | 编译器模型、依赖解析、运行时和生产治理 | 深度机制分析报告 |

## 最终能力清单

- 能独立创建 Rust 2024 项目并维护 Cargo.toml、features、workspace。
- 能根据所有权和借用错误定位设计问题，而不是机械加 clone。
- 能用 Option/Result 表达业务边界和错误传播。
- 能设计 Trait 抽象，区分静态分发和动态分发。
- 能写测试、文档测试、benchmark 和基本 CI。
- 能写线程并发和 Tokio 异步代码，并解释 Send/Sync 和运行时边界。
- 能审查 unsafe/FFI 的不变量、生命周期和释放责任。
- 能用 tracing、日志、profiling 和依赖审计支撑生产运行。
