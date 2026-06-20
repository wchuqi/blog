---
title: "Rust学习资料：Cargo Resolver、Feature、MSRV 和供应链深度解析"
date: 2026-06-20
description: "Cargo Resolver 的工作不是“下载最新版本”，而是在所有依赖声明、版本范围、registry、features、target、MSRV 和 lockfile 约束下求一个可构建的依赖图。依赖图一旦确定，后续构建、测试、发布、安全…"
tags:
  - "开发语言"
  - "Rust"
  - "深度解析"
category: "开发语言"
---

# Rust学习资料：Cargo Resolver、Feature、MSRV 和供应链深度解析

[返回索引](../Rust学习资料.md)

## 学习目标

- 理解 Cargo 依赖解析的输入、输出、冲突和锁定结果。
- 掌握 SemVer、feature unification、resolver 2/3、MSRV 和 workspace 依赖治理。
- 能诊断依赖冲突、feature 膨胀、重复版本、安全公告和供应链风险。

## 理论导读

Cargo Resolver 的工作不是“下载最新版本”，而是在所有依赖声明、版本范围、registry、features、target、MSRV 和 lockfile 约束下求一个可构建的依赖图。依赖图一旦确定，后续构建、测试、发布、安全审计都围绕这张图展开。

Rust 2024 Edition 默认 resolver 3，它会启用 rust-version aware dependency resolution，让 `package.rust-version` 参与依赖选择。这个规则能减少因为依赖升级导致 MSRV 意外被抬高的情况，但不能替代团队对 MSRV 和 lockfile 的治理。

## 核心心智模型

Cargo 像一个约束求解器：每个 crate 交出“我能接受的版本范围、我需要的 feature、我支持的目标平台”，Resolver 找到一组同时满足约束的版本，并把结果写入 `Cargo.lock`。

## 机制拆解

### 1. SemVer 范围

```toml
[dependencies]
serde = "1"          # >=1.0.0, <2.0.0
tokio = "1.40"       # >=1.40.0, <2.0.0
foo = "=1.2.3"       # 精确锁定，不建议库随意使用
bar = "~1.2"         # >=1.2.0, <1.3.0
```

库依赖范围过窄会制造冲突，过宽会暴露兼容风险。应用可以靠 lockfile 固定实际版本，库要靠合理 SemVer 范围表达兼容承诺。

### 2. Feature unification

Cargo features 是加法模型。多个依赖路径启用同一 crate 的不同 feature，最终通常合并。

```text
app -> a -> log(features=["std"])
app -> b -> log(features=["serde"])
final log features = ["std", "serde"]
```

这会导致某些能力被间接打开。尤其要关注 `default-features = true` 带来的隐式依赖。

### 3. Resolver 2 和 3

resolver 2 改进了 target-specific、build-dependency、dev-dependency 的 feature 合并边界。resolver 3 在 resolver 2 的基础上把 rust-version aware dependency resolution 作为默认行为。workspace 中 resolver 是全局设置，虚拟 workspace 必须显式声明。

### 4. MSRV

`rust-version` 是 package 对最低编译器版本的声明。它影响：

- CI 使用哪个 rustc 测试。
- 依赖解析是否选择兼容版本。
- crate 使用哪些语言和标准库特性。
- 对下游用户的兼容承诺。

### 5. Lockfile 决策

应用项目通常提交 `Cargo.lock`，保证部署可复现。库项目可以提交用于 CI，也可以不要求下游使用同一 lockfile；重点是测试最低版本、最新版本和 MSRV。

## 诊断命令

```powershell
cargo tree
cargo tree -e features
cargo tree -d
cargo update -p crate_name
cargo metadata --format-version 1
cargo audit
cargo deny check
```

| 命令 | 用途 |
| --- | --- |
| `cargo tree -e features` | 看 feature 是谁打开的 |
| `cargo tree -d` | 看重复版本 |
| `cargo update -p` | 只更新指定依赖 |
| `cargo metadata` | 让脚本读取完整依赖图 |
| `cargo audit` | 检查安全公告 |
| `cargo deny` | 检查许可证、重复版本、来源和公告 |

## 常见失败模式

- 两个依赖要求同一 crate 的不兼容主版本，出现重复版本或解析失败。
- 某 crate 默认 feature 拉入 TLS、压缩、数据库驱动，导致编译慢和镜像大。
- 库使用新 rustc 特性但未更新 `rust-version`，下游 MSRV 构建失败。
- build.rs 下载外部资源或执行环境相关逻辑，破坏可复现构建。
- git 依赖指向分支而不是 commit，构建结果不稳定。
- workspace 成员没有统一 edition、license、rust-version 和 lint 规范。

## 生产治理建议

- 在 workspace 根声明统一依赖版本和 lint。
- 应用提交 lockfile，并在 CI 检查 lockfile 是否漂移。
- 定期跑 `cargo update`，不要长期积累大版本跳跃。
- 对高风险依赖开启最小 feature。
- 使用 `cargo deny` 管控许可证和来源。
- 对安全敏感项目审查 build script、proc macro 和 unsafe 使用。

## 练习

1. 找一个 Rust 项目，用 `cargo tree -e features` 写出 tokio、serde、tracing 的 feature 来源。
2. 人为制造同一 crate 的重复版本，用 `cargo tree -d` 定位。
3. 把一个默认 feature 很重的依赖改成 `default-features = false`，记录构建变化。

## 验收

- 能解释 Cargo resolver 的输入和输出。
- 能定位某个 feature 是被哪条依赖路径启用的。
- 能制定 workspace 依赖治理规则。

## 重点

- 依赖图是生产系统的一部分，不是构建工具的内部细节。

## 难点

- feature unification 的影响经常跨 crate、跨 target、跨 dev/build dependency，需要用工具看实际图。

## 易错

> **易错：** 为了解决冲突随手精确锁定库依赖版本。
>
> 正确做法：应用可以用 lockfile 固定，库应尽量给出合理兼容范围，避免把冲突传给下游。
