---
title: "JVM 学习资料：JDK 诊断工具和可观测性"
date: 2026-06-20
description: "工具不是越多越好，而是要形成证据链。CPU 高先定位线程，再看该线程栈和火焰图；内存高先分堆内还是堆外；GC 慢先看日志，再看对象生命周期；死锁直接看线程 dump；偶发延迟适合 JFR，因为它能把线程、GC、锁、IO、方法采样放进同一个时…"
tags:
  - "开发语言"
  - "JVM"
category: "开发语言"
---

# JVM 学习资料：JDK 诊断工具和可观测性

[返回索引](../JVM学习资料.md)

## 学习目标

- 掌握常用 JDK 命令的用途。
- 能为 Java 服务建立基础可观测性。
- 能按问题类型选择 CPU、内存、线程、GC 工具。

## 工具地图

| 工具 | 用途 | 常见命令 |
| --- | --- | --- |
| `jps` | 查看 Java 进程 | `jps -lv` |
| `jcmd` | 综合诊断入口 | `jcmd <pid> help` |
| `jstack` | 线程栈 | `jstack <pid>` |
| `jmap` | 堆信息和 dump | `jmap -dump:live,format=b,file=a.hprof <pid>` |
| `jstat` | GC 和类加载统计 | `jstat -gcutil <pid> 1s` |
| `jfr` | Flight Recorder | `jcmd <pid> JFR.start ...` |
| JMC | 分析 JFR | 图形化分析 |
| NMT | Native Memory | `jcmd <pid> VM.native_memory summary` |

## 理论导读

工具不是越多越好，而是要形成证据链。CPU 高先定位线程，再看该线程栈和火焰图；内存高先分堆内还是堆外；GC 慢先看日志，再看对象生命周期；死锁直接看线程 dump；偶发延迟适合 JFR，因为它能把线程、GC、锁、IO、方法采样放进同一个时间轴。

## 常见场景

### CPU 高

1. 用 `top -H -p <pid>` 找线程 ID。
2. 把线程 ID 转十六进制。
3. 用 `jcmd <pid> Thread.print` 找 `nid`。
4. 看栈顶是否是业务循环、序列化、正则、加密、GC 线程或锁自旋。

### 内存泄漏

1. 看 GC 日志确认 Full GC 后基线。
2. 生成 heap dump。
3. 用 MAT、JMC 或其他工具看 dominator tree。
4. 找 retained size 和 GC Roots。

### 偶发卡顿

1. 开启 JFR。
2. 采集请求高峰期数据。
3. 分析 GC Pause、Socket Read、Monitor Blocked、Thread Park、Allocation in new TLAB。

## JFR 示例

```bash
jcmd <pid> JFR.start name=profile settings=profile duration=120s filename=profile.jfr
jcmd <pid> JFR.check
jcmd <pid> JFR.stop name=profile filename=profile.jfr
```

## 练习

- 对一个本地 Java 程序采集 60 秒 JFR。
- 制造死锁并用线程 dump 定位。
- 制造频繁分配并用 `jstat -gcutil` 观察变化。

## 验收

- 能根据问题类型选择工具，而不是随机执行命令。
- 能解释 thread dump、heap dump、JFR、GC log 各自适合回答什么问题。
- 能写一份包含时间线和证据截图的排障结论。

## 重点

- `jcmd` 是现代 JDK 中很实用的统一入口。
- JFR 适合低开销长期或按需采样。
- dump 可能包含敏感数据，生产传输和留存要受控。

## 难点

- 采样工具看到的是概率分布，不能把单个样本当成全局事实。
- 容器环境中还要结合 cgroup、宿主机、Kubernetes 事件。

## 易错

> **易错：** 只采一次线程 dump 就断定根因。
>
> 正确做法：CPU、锁竞争、线程池饱和等问题通常要连续采样看稳定模式。
