---
title: "JVM 学习资料：Java 内存模型、线程和锁"
date: 2026-06-20
description: "多线程程序的问题不只是多个线程同时执行，还包括每个线程看到的内存状态可能不同。CPU 缓存、编译器优化、JIT 重排序都会改变实际执行细节。Java 内存模型用 happens-before 规则定义哪些写入必须对哪些读取可见，从而在可优化…"
tags:
  - "开发语言"
  - "JVM"
category: "开发语言"
---

# JVM 学习资料：Java 内存模型、线程和锁

[返回索引](../JVM学习资料.md)

## 学习目标

- 理解 JMM 解决的可见性、有序性、原子性问题。
- 掌握 happens-before、volatile、synchronized、final 的语义。
- 能从 JVM 角度分析锁竞争、死锁和线程问题。

## 理论导读

多线程程序的问题不只是多个线程同时执行，还包括每个线程看到的内存状态可能不同。CPU 缓存、编译器优化、JIT 重排序都会改变实际执行细节。Java 内存模型用 happens-before 规则定义哪些写入必须对哪些读取可见，从而在可优化和可理解之间建立边界。

锁既是互斥工具，也是内存语义工具。进入和退出 `synchronized` 会建立可见性关系；`volatile` 保证单个变量的可见性和有序性，但不让复合操作自动原子；`final` 字段有安全发布语义，但对象构造期间泄露 `this` 会破坏直觉。

## 核心规则

| 规则 | 含义 |
| --- | --- |
| 程序次序规则 | 单线程内前面的操作 happens-before 后面的操作 |
| 锁规则 | 解锁 happens-before 后续对同一锁的加锁 |
| volatile 规则 | volatile 写 happens-before 后续读 |
| 线程启动规则 | `Thread.start()` happens-before 新线程动作 |
| 线程终止规则 | 线程动作 happens-before 其他线程检测到它结束 |
| 传递性 | A hb B，B hb C，则 A hb C |

## volatile 的边界

```java
class Counter {
    volatile int count;

    void inc() {
        count++; // 不是原子操作
    }
}
```

`count++` 包含读取、加一、写回。`volatile` 只能保证读写可见性，不能把复合操作变成原子操作。

## 双重检查锁

```java
class Singleton {
    private static volatile Singleton instance;

    static Singleton getInstance() {
        Singleton local = instance;
        if (local == null) {
            synchronized (Singleton.class) {
                local = instance;
                if (local == null) {
                    local = new Singleton();
                    instance = local;
                }
            }
        }
        return local;
    }
}
```

`volatile` 防止对象引用发布和构造过程发生危险重排序。

## 线程排查

```bash
jcmd <pid> Thread.print
jstack <pid>
```

重点看：

- `RUNNABLE` 且 CPU 高的线程。
- `BLOCKED` 等待锁的线程。
- `WAITING`、`TIMED_WAITING` 是否符合业务预期。
- deadlock 检测结果。
- 线程数是否异常增长。

## 练习

- 写一个 `volatile int count++` 的并发错误示例。
- 制造死锁，并用 `jcmd <pid> Thread.print` 找到锁等待环。
- 用 `AtomicInteger`、`LongAdder`、`synchronized` 分别实现计数并比较场景。

## 验收

- 能说明 happens-before 是可见性规则，不是简单时间先后。
- 能解释 volatile 和 synchronized 的差异。
- 能用线程 dump 分析死锁和锁竞争。

## 重点

- 原子性、可见性、有序性是并发分析的三条主线。
- `volatile` 适合状态标记、发布引用、轻量可见性，不适合复合计数。
- 锁优化不改变锁的语义，只改变实现成本。

## 难点

- JMM 是语言级规则，底层通过编译器约束和内存屏障实现。
- 线程 dump 是瞬时快照，复杂问题需要多次采样。

## 易错

> **易错：** 认为 happens-before 表示物理时间上先发生。
>
> 正确做法：它表示内存可见性和有序性保证。
