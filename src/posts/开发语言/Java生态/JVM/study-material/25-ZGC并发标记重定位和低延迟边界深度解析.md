---
title: "JVM 学习资料：ZGC并发标记重定位和低延迟边界深度解析"
date: 2026-06-20
description: "传统压缩式 GC 的大停顿通常来自“暂停应用线程，移动对象，更新所有引用”。ZGC 的核心思路是把这些工作尽可能并发化：应用线程继续跑，GC 线程在后台标记和移动对象；应用线程读对象引用时，通过屏障协助修正或发现对象状态。这样停顿更多与 R…"
tags:
  - "开发语言"
  - "JVM"
  - "深度解析"
category: "开发语言"
---

# JVM 学习资料：ZGC并发标记重定位和低延迟边界深度解析

[返回索引](../JVM学习资料.md)

## 学习目标

- 理解 ZGC 低停顿来自并发标记、并发处理引用、并发重定位。
- 能解释读屏障、对象重定位、转发表和内存余量。
- 能判断 ZGC 适用场景和不适用边界。
- 能读 ZGC 日志，识别 allocation stall、relocation、mark 阶段问题。

## 理论导读

传统压缩式 GC 的大停顿通常来自“暂停应用线程，移动对象，更新所有引用”。ZGC 的核心思路是把这些工作尽可能并发化：应用线程继续跑，GC 线程在后台标记和移动对象；应用线程读对象引用时，通过屏障协助修正或发现对象状态。这样停顿更多与 Roots 和少量同步点相关，而不是与整个堆大小线性绑定。

低延迟不是免费午餐。ZGC 需要屏障开销、并发线程、额外元数据和足够内存余量。如果业务分配速度长期高于回收速度，仍然会发生 allocation stall，低停顿目标会被破坏。

## 一、ZGC 周期的高层链路

```text
Pause Mark Start
  -> Concurrent Mark
  -> Pause Mark End
  -> Concurrent Process Non-Strong References
  -> Concurrent Reset Relocation Set
  -> Concurrent Select Relocation Set
  -> Pause Relocate Start
  -> Concurrent Relocate
```

不同 JDK 版本实现细节会演进，但理解主线即可：短暂停顿启动或结束阶段，大量标记和重定位并发完成。

## 二、读屏障的作用

读屏障是在读取对象引用时插入的逻辑。它可以：

- 判断引用是否指向已重定位对象。
- 把旧地址修正为新地址。
- 协助保持并发标记和重定位正确性。

这意味着 ZGC 把一部分 GC 工作分摊到应用线程读取引用的路径上。好处是减少集中 STW，代价是每次引用访问可能有额外成本。

> **重点：** 低停顿的代价不是消失了，而是转化为并发 CPU、屏障开销和内存余量。

## 三、为什么需要内存余量

在并发 GC 周期中，应用线程仍然不断分配。如果堆可用空间不够，ZGC 没来得及回收出空间，就可能出现 allocation stall。

内存余量不足常见原因：

- 分配速率过高。
- 堆设置过小。
- 存活对象比例高。
- CPU limit 太低，GC 并发线程推进慢。
- 大对象或突发流量导致瞬间压力。

## 四、ZGC 日志阅读

建议：

```bash
-XX:+UseZGC -Xlog:gc*,gc+heap=debug,gc+phases=debug,safepoint:file=zgc.log:time,uptime,level,tags
```

关注：

| 线索 | 含义 |
| --- | --- |
| Pause Mark Start/End | STW 标记阶段，通常应较短 |
| Concurrent Mark | 并发标记耗时 |
| Concurrent Relocate | 并发重定位耗时 |
| Allocation Stall | 分配等空间，低延迟被破坏 |
| Heap before/after | 回收效果和存活集 |
| MMU | 最小 mutator 利用率，衡量停顿影响 |

## 五、适用和不适用

适合：

- P99/P999 延迟敏感服务。
- 大堆服务，不能接受随堆增长的长 STW。
- 有足够 CPU 和内存余量的在线服务。

谨慎：

- CPU 极紧张的容器。
- 堆很小且吞吐优先的批处理。
- 对峰值吞吐极敏感、延迟要求不高的离线任务。
- 分配速率失控或内存泄漏未治理的服务。

## 六、和 G1 的选择

| 维度 | G1 | ZGC |
| --- | --- | --- |
| 默认适用面 | 普通后端广 | 延迟敏感 |
| 停顿目标 | 可预测但可能较长 | 极低停顿 |
| 吞吐 | 通常较好 | 可能略损 |
| 内存余量 | 需要 | 更需要 |
| 排障重点 | Region、RSet、Mixed、Humongous | Allocation Stall、并发周期、屏障、余量 |

## 练习

1. 同一服务分别用 G1 和 ZGC 压测，比较 P99、CPU、GC 日志。
2. 降低容器 CPU limit，观察 ZGC 并发阶段是否变慢。
3. 人为提高分配速率，观察是否出现 allocation stall。

## 验收

- 能解释 ZGC 低停顿来自哪些并发化设计。
- 能说明读屏障的代价和价值。
- 能判断 ZGC 不是“无脑替换 G1”的答案。

## 重点

- 低延迟 GC 要配合容量余量和对象生命周期治理。

## 难点

- ZGC 日志不像传统分代 GC 那样只看 Young/Old，需要按并发周期和分配停顿理解。

## 易错

> **易错：** 认为用了 ZGC 就不会有 OOM 或延迟抖动。
>
> 正确做法：关注 allocation stall、CPU limit、存活集、分配速率和内存余量。

