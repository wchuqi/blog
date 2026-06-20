---
title: "JVM 学习资料：JMM从CPU缓存到happens-before深度解析"
date: 2026-06-20
description: "现代 CPU 和编译器会为了性能做大量优化：缓存数据、合并写入、推迟写回、乱序执行、预测分支、重排指令。单线程下只要不改变可观察结果，这些优化通常没问题；多线程共享变量时，如果没有同步规则，一个线程的写入何时被另一个线程看到、两个写入顺序是…"
tags:
  - "开发语言"
  - "JVM"
  - "深度解析"
category: "开发语言"
---

# JVM 学习资料：JMM从CPU缓存到happens-before深度解析

[返回索引](../JVM学习资料.md)

## 学习目标

- 从 CPU 缓存、Store Buffer、Load Buffer、编译器重排序理解 JMM 存在的原因。
- 能用 happens-before 分析发布、可见性和有序性。
- 能解释 volatile、锁、final、CAS 的语义边界。
- 能识别常见并发错误背后的内存模型原因。

## 理论导读

现代 CPU 和编译器会为了性能做大量优化：缓存数据、合并写入、推迟写回、乱序执行、预测分支、重排指令。单线程下只要不改变可观察结果，这些优化通常没问题；多线程共享变量时，如果没有同步规则，一个线程的写入何时被另一个线程看到、两个写入顺序是否被观察一致，就会变得不可靠。

JMM 的价值是定义 Java 程序员可依赖的规则。你不需要直接记每种 CPU 的内存屏障指令，但必须知道哪些 Java 操作建立 happens-before。正确同步的程序，JVM 会在编译和运行时插入必要屏障，禁止危险重排序，保证跨平台语义。

## 一、不要滥用“主内存/工作内存”图

教材常用主内存和工作内存帮助入门，但生产分析不能停在这个图。更准确的理解：

- 线程执行会使用寄存器和 CPU cache。
- 写入可能先进入 Store Buffer。
- 读取可能从本地缓存或 Load Buffer 获得。
- 编译器可能重排无依赖指令。
- CPU 也可能让其他核心以不同顺序观察写入。

JMM 不要求你描述硬件细节，但规定 Java 层哪些同步操作必须产生可见性和有序性效果。

## 二、happens-before 是证明工具

判断并发正确性时，不要说“线程 A 应该先执行”。要证明：

```text
A 中写共享变量
  happens-before
B 中读共享变量
```

如果没有 hb 关系，B 读到旧值、乱序效果或部分初始化状态都可能发生。

常见 hb：

- volatile 写 hb 后续 volatile 读。
- unlock hb 后续 lock。
- `Thread.start()` hb 新线程动作。
- 线程动作 hb 其他线程 `join()` 成功返回。
- final 字段在正确构造后具备特殊可见性保证。

## 三、volatile 的屏障含义

volatile 写通常具备 release 语义：它之前的普通写不能被重排到 volatile 写之后。volatile 读通常具备 acquire 语义：它之后的普通读写不能被重排到 volatile 读之前。

这使它适合发布状态：

```java
config = new Config(...); // 普通写
ready = true;             // volatile 写
```

另一个线程：

```java
if (ready) {              // volatile 读
    use(config);          // 能看到 ready 之前发布的 config
}
```

但 volatile 不能让 `count++` 变成原子操作。

## 四、安全发布

对象安全发布方式：

- 通过静态初始化发布。
- 通过 volatile 字段发布。
- 通过锁保护发布。
- 通过线程安全容器发布。
- 通过 final 字段构造不可变对象，并确保构造期间 `this` 不逃逸。

不安全发布风险：

```java
class Holder {
    int a;
    Holder() { a = 1; }
}

static Holder holder;
```

线程 A 写 `holder = new Holder()`，线程 B 读到非 null holder 时，不一定安全看到 `a == 1`，除非有同步关系。

## 五、CAS 和原子类

CAS 解决的是“比较并交换”这一类原子更新问题。原子类还会结合 volatile 语义保证可见性。CAS 风险：

- ABA 问题。
- 自旋过多导致 CPU 消耗。
- 只能自然表达单变量或有限状态更新。
- 多字段一致性仍可能需要锁或不可变快照。

## 六、锁和内存语义

锁释放相当于把锁内写入发布出去；后续获取同一把锁的线程能看到这些写入。这就是为什么锁不仅保护互斥，也保护可见性。

错误示例：

```java
if (!map.containsKey(k)) {
    synchronized (lock) {
        map.put(k, v);
    }
}
```

外层读没有同一把锁保护，仍可能有竞态和可见性问题。

## 练习

1. 写不安全发布示例，用大量循环尝试观察异常状态。
2. 写 volatile ready/config 发布示例，并解释 hb 链。
3. 用 AtomicInteger 和 LongAdder 对比高并发计数场景。

## 验收

- 能用 hb 而不是“感觉先后”证明并发正确性。
- 能说明 volatile 的 release/acquire 近似语义。
- 能区分 volatile、CAS、锁、final 的适用边界。

## 重点

- JMM 是并发正确性的证明规则，不是某个 CPU 的缓存图。

## 难点

- 原子性、可见性、有序性要分别分析，再合并判断程序是否正确。

## 易错

> **易错：** 认为线程启动顺序等于变量可见性顺序。
>
> 正确做法：找 happens-before。没有 hb，就不能假设另一个线程必然看到最新写入。

