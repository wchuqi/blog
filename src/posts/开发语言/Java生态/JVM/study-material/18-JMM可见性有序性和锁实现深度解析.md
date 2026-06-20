---
title: "JVM 学习资料：JMM可见性有序性和锁实现深度解析"
date: 2026-06-20
description: "多线程程序难不是因为线程会“同时运行”这么简单，而是每个线程、编译器和 CPU 都可能为了性能重排、缓存和延迟写回。JMM 给 Java 程序定义了一套可移植的内存可见性规则，让程序员不用直接面对每种 CPU 的细节，但必须用正确的同步原语…"
tags:
  - "开发语言"
  - "JVM"
  - "深度解析"
category: "开发语言"
---

# JVM 学习资料：JMM可见性有序性和锁实现深度解析

[返回索引](../JVM学习资料.md)

## 学习目标

- 理解 JMM 解决的是线程间可见性、有序性和安全发布问题。
- 能解释 happens-before、volatile、synchronized、final 字段语义。
- 能区分 Java 语言级锁、JVM monitor、AQS 和 OS 线程调度。
- 能分析死锁、锁竞争、伪共享和错误双重检查锁。

## 理论导读

多线程程序难不是因为线程会“同时运行”这么简单，而是每个线程、编译器和 CPU 都可能为了性能重排、缓存和延迟写回。JMM 给 Java 程序定义了一套可移植的内存可见性规则，让程序员不用直接面对每种 CPU 的细节，但必须用正确的同步原语建立 happens-before 关系。

锁不仅是互斥工具，也建立内存语义。进入 synchronized 要获取 monitor，退出 synchronized 要释放 monitor；释放先行发生于后续对同一 monitor 的获取，因此一个线程在锁内写入的数据，对另一个后续获得同一锁的线程可见。

## 核心心智模型

```text
线程本地执行和缓存
  -> 编译器/CPU 可能重排序
  -> JMM 定义哪些重排序不能越过同步边界
  -> volatile/synchronized/final/线程启动和结束建立 happens-before
```

## 知识点详解

### 1. happens-before

happens-before 是判断可见性的规则，不是物理时间先后。常见规则：

- 程序顺序规则：同一线程内前面的操作先行发生于后面的操作。
- 监视器锁规则：解锁先行发生于后续对同一锁的加锁。
- volatile 规则：写 volatile 变量先行发生于后续读同一变量。
- 线程启动规则：`Thread.start()` 先行发生于新线程内动作。
- 线程终止规则：线程内动作先行发生于其他线程检测到它终止。
- 传递性：A hb B，B hb C，则 A hb C。

### 2. volatile

`volatile` 保证：

- 可见性：写入对后续读可见。
- 有序性：通过内存屏障限制特定重排序。

`volatile` 不保证复合操作原子性：

```java
volatile int count;
count++; // 读、加、写三个动作，不是原子操作
```

适用场景：

- 状态标志。
- 单例双重检查锁中的引用发布。
- 一个写线程、多个读线程的轻量配置读取。

### 3. final 字段安全发布

对象构造完成后，如果没有让 `this` 在构造期间逃逸，其他线程看到该对象时，能看到构造函数中写入的 final 字段值。这是不可变对象线程安全的重要基础。

> **易错：** 构造函数中启动线程、注册回调或把 `this` 放入全局容器，可能破坏安全发布。

### 4. synchronized 和 monitor

`synchronized` 既提供互斥，也提供内存语义。编译后常见为：

- 同步代码块：`monitorenter`、`monitorexit`。
- 同步方法：方法访问标志带同步语义。

锁竞争严重时，线程可能阻塞并进入 OS 调度路径，吞吐和延迟都会受影响。

### 5. AQS、park/unpark 和锁工具

`ReentrantLock`、`Semaphore`、`CountDownLatch` 等常基于 AQS。AQS 用一个同步状态和等待队列管理线程，通过 CAS 修改状态，通过 `LockSupport.park/unpark` 挂起和唤醒线程。

JVM 面试中要区分：

- `synchronized` 是语言级关键字，由 JVM 支持。
- `ReentrantLock` 是 JDK 类库锁，具备可中断、公平锁、条件队列等能力。
- AQS 是构建同步器的框架。

## 例子

### 正确的双重检查锁

```java
public final class Holder {
    private static volatile Holder instance;

    private Holder() {}

    public static Holder getInstance() {
        Holder local = instance;
        if (local == null) {
            synchronized (Holder.class) {
                local = instance;
                if (local == null) {
                    local = new Holder();
                    instance = local;
                }
            }
        }
        return local;
    }
}
```

`volatile` 防止引用发布与对象初始化相关操作发生危险重排序，并保证后续读可见。

### 死锁定位

```bash
jcmd <pid> Thread.print -l
```

关注：

- `Found one Java-level deadlock`
- 持有的 monitor。
- 等待的 monitor。
- 线程业务栈。

## 练习

1. 写一个没有 `volatile` 的停止标志，观察线程可能无法及时停止。
2. 写一个死锁程序，用 `jcmd Thread.print -l` 定位。
3. 对比 `synchronized` 和 `ReentrantLock` 在可中断、公平性、条件变量上的差异。

## 验收

- 能用 happens-before 解释可见性，而不是只说“主内存和工作内存”。
- 能说明 `volatile int++` 为什么不安全。
- 能解释锁既保证互斥又保证可见性。
- 能从 thread dump 识别死锁和锁竞争线索。

## 重点

- JMM 是 Java 并发正确性的规则层，不等同于某一种 CPU 缓存实现。
- 线程安全必须建立同步关系，不能依赖“看起来先执行”。

## 难点

- 原子性、可见性、有序性经常同时出现，但需要分开分析。

## 易错

> **易错：** 认为 `volatile` 能替代锁解决所有并发问题。
>
> 正确做法：单次读写状态可用 volatile；复合不变量、计数递增、多字段一致性通常需要锁、CAS 或并发容器。

