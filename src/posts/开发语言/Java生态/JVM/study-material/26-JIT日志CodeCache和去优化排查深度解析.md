---
title: "JVM 学习资料：JIT日志CodeCache和去优化排查深度解析"
date: 2026-06-20
description: "JIT 优化是 JVM 性能的核心，但它也是运行时动态系统。服务启动后，解释器、C1、C2、Profile、内联、OSR、去优化、Code Cache 都在变化。如果压测只跑 30 秒，结果可能测到的是启动、类加载和 JIT 编译，而不是稳…"
tags:
  - "开发语言"
  - "JVM"
  - "深度解析"
category: "开发语言"
---

# JVM 学习资料：JIT日志CodeCache和去优化排查深度解析

[返回索引](../JVM学习资料.md)

## 学习目标

- 能观察 JIT 编译活动、Code Cache 使用和去优化线索。
- 能解释启动预热、性能抖动、方法内联失败、Code Cache 满的影响。
- 能在性能测试中区分解释执行、编译中、稳定峰值三个阶段。

## 理论导读

JIT 优化是 JVM 性能的核心，但它也是运行时动态系统。服务启动后，解释器、C1、C2、Profile、内联、OSR、去优化、Code Cache 都在变化。如果压测只跑 30 秒，结果可能测到的是启动、类加载和 JIT 编译，而不是稳定业务吞吐。如果 Code Cache 满了，热点方法可能无法继续编译，性能会出现不可直觉解释的下降。

## 一、观察编译活动

```bash
java -Xlog:jit+compilation=info -jar app.jar
jcmd <pid> Compiler.CodeHeap_Analytics
jcmd <pid> Compiler.codecache
jcmd <pid> Compiler.queue
```

常见字段含义：

| 线索 | 含义 |
| --- | --- |
| compile id | 编译任务编号 |
| level | 分层编译级别 |
| made not entrant | 已编译代码不再作为入口 |
| made zombie | 编译代码可回收 |
| OSR | On Stack Replacement，循环运行中切换到编译代码 |
| codecache | 编译后机器码存放区域 |

## 二、Code Cache

Code Cache 存放 JIT 编译后的机器码、stub、adapter 等。它满了以后，JIT 可能被限制或停用，表现为：

- 服务运行一段时间后吞吐下降。
- 日志中出现 CodeCache full 相关信息。
- 新热点方法无法编译。
- CPU 增高但业务吞吐不升。

排查：

```bash
jcmd <pid> Compiler.codecache
jcmd <pid> VM.flags | findstr CodeCache
```

处理方向：

- 检查是否动态生成大量类和方法。
- 检查代理、表达式、规则引擎、脚本引擎。
- 适当调整 ReservedCodeCacheSize。
- 升级 JDK 或修复导致代码膨胀的框架使用方式。

## 三、内联失败如何影响性能

内联失败可能导致：

- 虚调用无法消除。
- 逃逸分析机会减少。
- 锁消除和标量替换无法发生。
- 循环优化暴露的信息不足。

原因可能是：

- 方法太大。
- 调用点类型太多。
- 递归或复杂控制流。
- 接口实现过多。
- 异常路径和罕见分支污染 profile。

> **重点：** 很多 JVM 优化是连锁的，内联失败会让后续优化也失去机会。

## 四、去优化排查

去优化通常不是错误，而是动态优化假设失效。常见触发：

- 新类加载改变类层次分析结论。
- 罕见分支变成常见路径。
- 反射、动态代理、invokedynamic 目标变化。
- 异常频繁抛出改变 profile。

观察方式：

```bash
java -Xlog:deoptimization=info,jit+compilation=info -jar app.jar
```

如果当前 JDK 日志标签不支持，使用 JFR 观察 Compiler、Code Cache、Execution Sample 等事件。

## 五、压测中的预热纪律

压测报告必须说明：

- 预热时长。
- 预热流量是否接近真实流量。
- JIT 编译是否稳定。
- Code Cache 是否稳定。
- GC 和分配速率是否稳定。
- P95/P99 是否排除启动阶段。

错误做法：

```text
启动服务后立刻压 1 分钟，拿平均 QPS 对比优化效果
```

正确做法：

```text
预热 -> 指标稳定 -> 正式采样 -> 多轮 fork 或重启验证 -> 比较分位延迟和资源曲线
```

## 练习

1. 对一个接口压测 10 分钟，记录 QPS 是否随 JIT 预热变化。
2. 用 JFR 查看 Compiler Statistics。
3. 制造大量动态代理类，观察 Code Cache 和 Metaspace。

## 验收

- 能解释 Code Cache 满为什么影响性能。
- 能说明内联失败的连锁影响。
- 能写出可信 Java 压测的预热和采样规则。

## 重点

- JIT 问题不能只靠源码直觉，要用日志、JFR 和压测曲线验证。

## 难点

- 去优化和重编译会造成阶段性抖动，但不是必然 bug。

## 易错

> **易错：** 用启动后一小段平均 QPS 判断 JVM 性能。
>
> 正确做法：区分启动期、预热期和稳定期，并记录 JIT、GC、CPU 曲线。

