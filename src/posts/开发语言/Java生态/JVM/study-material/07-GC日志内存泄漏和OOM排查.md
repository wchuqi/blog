---
title: "JVM 学习资料：GC 日志、内存泄漏和 OOM 排查"
date: 2026-06-20
description: "GC 日志是 JVM 内存压力的时间线。它告诉你什么时候发生回收、回收前后各区域容量如何变化、停顿多久、是否进入并发标记、是否发生 Full GC。heap dump 是某一时刻的对象快照，适合分析“谁保留了内存”。NMT 是 Native…"
tags:
  - "开发语言"
  - "JVM"
category: "开发语言"
---

# JVM 学习资料：GC 日志、内存泄漏和 OOM 排查

[返回索引](../JVM学习资料.md)

## 学习目标

- 能开启和阅读基础 GC 日志。
- 能区分内存泄漏、内存溢出、分配速率过高和容器 OOM。
- 掌握 heap dump、thread dump、NMT 的基本排查路径。

## 理论导读

GC 日志是 JVM 内存压力的时间线。它告诉你什么时候发生回收、回收前后各区域容量如何变化、停顿多久、是否进入并发标记、是否发生 Full GC。heap dump 是某一时刻的对象快照，适合分析“谁保留了内存”。NMT 是 Native Memory 的账本，适合分析堆外、元空间、线程栈和 JVM 内部内存。

排查内存问题要先分类。堆 OOM 通常能生成 heap dump；直接内存 OOM 可能 heap dump 看不出主体；容器 OOM killer 可能没有 Java 异常；频繁 GC 可能不是泄漏，而是分配速率超过回收能力或堆太小。

## 常用启动参数

```bash
java \
  -Xms2g -Xmx2g \
  -Xlog:gc*:file=logs/gc.log:time,uptime,level,tags:filecount=5,filesize=100m \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=logs/heapdump.hprof \
  -XX:NativeMemoryTracking=summary \
  -jar app.jar
```

## 排查路径

| 现象 | 优先证据 | 常见原因 |
| --- | --- | --- |
| `Java heap space` | heap dump、GC 日志 | 集合保留、缓存无界、大对象 |
| `Metaspace` | 类加载日志、NMT | 动态类、ClassLoader 泄漏 |
| `Direct buffer memory` | NMT、框架 buffer 指标 | Netty/NIO buffer 未释放或上限过低 |
| 频繁 Young GC | GC 日志、分配 profile | 分配速率高、年轻代太小 |
| Full GC 后内存不降 | heap dump 保留链 | 老年代真实存活对象多 |
| 进程被 killed | 容器事件、RSS、系统日志 | 超过 cgroup 或系统内存 |

## GC 日志阅读重点

- 回收类型：Young、Mixed、Full。
- 回收前后堆占用：判断是否回收有效。
- 停顿时间：关注 P95/P99，而不是只看单次。
- 并发周期：是否并发标记跟不上分配。
- 晋升失败、疏散失败、Humongous Object。
- Metaspace、Code Cache、Reference Processing。

## 例子

生成 heap dump：

```bash
jcmd <pid> GC.heap_dump logs/live.hprof
```

打印类直方图：

```bash
jcmd <pid> GC.class_histogram
```

查看 Native Memory：

```bash
jcmd <pid> VM.native_memory summary
```

## 练习

- 制造一个静态 `Map` 泄漏，生成 heap dump 并找保留链。
- 制造大量临时对象，比较“频繁 Young GC”和“老年代泄漏”的日志差异。
- 在容器中把 `-Xmx` 设得接近内存限制，观察进程 RSS 风险。

## 验收

- 能用 GC 日志说明内存是否被有效回收。
- 能用 heap dump 找到大对象和保留链。
- 能说清 Java OOM 和容器 OOM killer 的证据差异。

## 重点

- 线上排障先保留 GC 日志、heap dump、thread dump 和容器事件。
- heap dump 文件可能很大，生产生成前要评估磁盘和停顿风险。
- Full GC 后基线持续上升更值得警惕。

## 难点

- 堆外内存问题需要 NMT、框架指标和系统工具结合。
- 内存泄漏不一定表现为持续增长，也可能表现为周期性高水位。

## 易错

> **易错：** 一看到 OOM 就直接加大 `-Xmx`。
>
> 正确做法：先判断是容量不足、泄漏、突发流量、大对象、堆外内存还是容器限制。
