---
title: "JVM 学习资料：Safepoint安全点STW和停顿来源深度解析"
date: 2026-06-20
description: "JVM 想做很多全局动作：GC、撤销偏向锁历史版本中的批量撤销、类重定义、线程栈遍历、JIT 去优化、heap dump、thread dump、代码缓存清理。这些动作需要看到一致的线程栈、寄存器、对象引用和运行时元数据。如果某个线程正执行…"
tags:
  - "开发语言"
  - "JVM"
  - "深度解析"
category: "开发语言"
---

# JVM 学习资料：Safepoint安全点STW和停顿来源深度解析

[返回索引](../JVM学习资料.md)

## 学习目标

- 理解 safepoint 为什么存在，而不是只把 STW 等同于 GC。
- 能解释 JVM 如何让所有线程进入可安全观察和修改运行时状态的位置。
- 能读懂 safepoint 日志，区分同步耗时、清理耗时、VM Operation 耗时。
- 能分析“GC 日志停顿不长，但应用仍然卡顿”的 JVM 层原因。

## 理论导读：JVM 不是随时都能暂停线程

JVM 想做很多全局动作：GC、撤销偏向锁历史版本中的批量撤销、类重定义、线程栈遍历、JIT 去优化、heap dump、thread dump、代码缓存清理。这些动作需要看到一致的线程栈、寄存器、对象引用和运行时元数据。如果某个线程正执行到任意机器指令中间，JVM 很难安全地知道此刻哪些寄存器是对象引用、栈上哪些位置是 oop、是否能移动对象。

Safepoint 就是 JVM 预先选择的一些“可安全停下来的点”。在线程到达 safepoint 后，JVM 能可靠扫描它的栈和寄存器映射。STW 不是一个动作，而是“发起全局 VM Operation -> 请求线程到达 safepoint -> 所有线程停住 -> 执行操作 -> 恢复线程”的过程。

## 核心时序

```text
VM Thread 发起 VM Operation
  -> 设置 safepoint 同步请求
  -> Java 线程在轮询点发现请求
  -> 线程保存状态并停在 safepoint
  -> 所有线程进入安全状态
  -> JVM 执行 GC / dump / deopt / class redefine 等操作
  -> 解除 safepoint，线程恢复执行
```

> **重点：** STW 总耗时不只包含真正的 GC 工作，还可能包含线程到达 safepoint 的同步时间。

## 一、哪些位置通常可以成为 safepoint

JVM 不会在每条字节码或每条机器指令后都插入 safepoint poll，否则成本太高。常见 safepoint 位置包括：

- 方法返回前后。
- 循环回边，尤其是长循环。
- 可能阻塞或调用运行时的地方。
- 已编译代码中的 safepoint poll。

长时间不经过 safepoint 的代码可能拖慢全局暂停。例如极端数值循环、JNI 长时间执行、编译器优化后缺少合适 poll 的路径，都可能导致其他线程等待它进入 safepoint。

## 二、Safepoint 日志怎么读

JDK 9+ 常用：

```bash
java -Xlog:safepoint,gc+phases=debug:file=safepoint.log:time,uptime,level,tags -jar app.jar
```

典型关注字段：

| 字段 | 含义 | 判断 |
| --- | --- | --- |
| Time to safepoint | 请求发出到所有线程停住的时间 | 高说明线程到达安全点慢 |
| At safepoint | 真正执行 VM Operation 的时间 | 高说明操作本身重 |
| Total | 总停顿 | 用户感知的 JVM 暂停总量 |
| VM Operation | 停顿原因 | 判断是 GC、dump、deopt 还是其他 |

如果 GC 日志显示 pause 只有 30ms，但 safepoint total 有 800ms，就不能只盯 GC 算法，需要继续查 safepoint 同步、线程状态、JNI、代码缓存或 VM Operation。

## 三、常见停顿来源

### 1. GC STW 阶段

即使是并发 GC，也通常仍有短暂停顿阶段，例如 Roots 初始标记、Remark、Relocate Start 等。低延迟 GC 的目标是把停顿从“随堆增长”变成更多与 Roots、线程数、引用处理等因素相关。

### 2. Thread dump 和 heap dump

`jcmd Thread.print` 通常比 heap dump 轻，但也需要观察线程一致状态。heap dump 成本更高，可能造成明显停顿和磁盘 IO 压力。

### 3. JIT 去优化和代码缓存清理

类层次变化、类型假设失效、Code Cache 压力可能触发去优化或代码缓存相关 VM Operation，表现为局部延迟抖动。

### 4. JNI 和 Native 代码

Native 代码如果长时间不返回或不配合 safepoint，可能影响 JVM 全局操作。很多“Java 看起来没问题但停顿异常”的问题，需要把 JNI、本地库、加密压缩库、图像处理库纳入排查。

## 四、排查路径

```text
应用延迟抖动
  -> 对齐业务延迟时间戳
  -> 查 GC 日志是否有长停顿
  -> 查 safepoint 日志 total/time-to-safepoint
  -> 查 VM Operation 类型
  -> 查 thread dump、JNI、长循环、dump 操作、JIT/CodeCache
```

## 例子：长循环导致 safepoint 延迟

```java
public class LongLoop {
    static volatile boolean stop;

    public static void main(String[] args) throws Exception {
        Thread t = new Thread(() -> {
            long x = 0;
            for (long i = 0; i < Long.MAX_VALUE; i++) {
                x += i;
            }
            System.out.println(x);
        });
        t.start();
        Thread.sleep(10_000);
        System.gc();
    }
}
```

现代 JDK 对循环 safepoint 已有很多处理，但这个实验可以引导你观察 safepoint 日志，而不是只看 GC 日志。

## 练习

1. 开启 `-Xlog:safepoint,gc*`，对比一次普通 GC 的 GC pause 和 safepoint total。
2. 生成 heap dump，观察 safepoint 停顿和磁盘写入耗时。
3. 用 JFR 查看 JVM Pause、GC Pause、Thread Dump 事件。

## 验收

- 能解释 STW 的同步阶段和执行阶段。
- 能说明为什么 safepoint 时间不等于 GC 算法时间。
- 能给出“GC 不长但服务卡顿”的 JVM 排查路径。

## 重点

- Safepoint 是 JVM 做全局一致性操作的基础设施。
- 生产延迟分析要把 GC、safepoint、JFR、业务指标按时间线对齐。

## 难点

- 有些停顿来自 JVM 运行时操作，不会表现为明显业务栈错误。

## 易错

> **易错：** 把所有 JVM 停顿都归因于 GC。
>
> 正确做法：同时查看 GC 日志、safepoint 日志、JFR VM Operation 和业务延迟时间线。

