---
title: "Java 学习资料：JVM、内存模型、GC 和性能调优"
date: 2026-06-20
description: "完成本章后，你应该能："
tags:
  - "开发语言"
  - "Java"
category: "开发语言"
---

# Java 学习资料：JVM、内存模型、GC 和性能调优

[返回索引](../Java学习资料.md)

## 学习目标

完成本章后，你应该能：

- 理解 JVM 运行时内存区域。
- 掌握类加载、字节码、JIT、GC 的基本流程。
- 理解 Java 内存模型与并发可见性。
- 使用 JDK 工具排查 CPU、内存、线程和 GC 问题。

## 理论导读：JVM 是 Java 程序真正运行的内部城市

JVM 不是一个抽象名词，而是 Java 程序运行时的内部城市。类加载器像入口检查站，把 `.class` 文件带进来并验证是否合法；运行时内存区域像城市分区，栈负责方法调用现场，堆负责对象居住，元空间保存类的结构信息；解释器和 JIT 像两套执行系统，先让程序跑起来，再把热点路径优化成更快的机器码；GC 像清理系统，回收不再可达的对象。

理解 JVM 内存区域时，不要只背“堆、栈、方法区”。方法每调用一次都会创建栈帧，局部变量和操作数在栈帧里周转；对象通常在堆上，多个引用可能指向同一个对象；类元数据在元空间里，类加载过多或 ClassLoader 泄漏也可能造成内存问题。栈溢出、堆 OOM、元空间 OOM 的表现不同，排查路径也不同。

性能调优不是盲目改 JVM 参数，而是先观察事实。CPU 高要看线程栈，内存涨要看堆对象和 GC，停顿长要看 GC 日志和 JFR，死锁要看线程 dump。JVM 工具的价值是把“感觉慢”变成可定位的证据。

## 一、JVM 执行流程

```text
.java -> javac -> .class -> ClassLoader -> JVM -> 解释执行 / JIT 编译 -> 机器码
```

JVM 负责：

- 类加载
- 字节码验证
- 解释执行
- 即时编译
- 内存管理
- 垃圾回收
- 线程调度协作

## 二、运行时内存区域

| 区域 | 作用 | 是否线程私有 |
| --- | --- | --- |
| 程序计数器 | 当前线程执行位置 | 是 |
| Java 虚拟机栈 | 方法调用栈帧 | 是 |
| 本地方法栈 | Native 方法调用 | 是 |
| 堆 | 对象实例 | 否 |
| 方法区 / 元空间 | 类元数据 | 否 |
| 直接内存 | NIO、Unsafe 等 | 否 |

> **重点：** 大多数对象在堆上，局部变量引用在栈帧中。

## 三、栈帧

每次方法调用产生栈帧，包含：

- 局部变量表
- 操作数栈
- 动态链接
- 返回地址

递归过深：

```java
static void call() {
    call();
}
```

可能导致：

```text
StackOverflowError
```

## 四、类加载

阶段：

1. 加载
2. 验证
3. 准备
4. 解析
5. 初始化

类加载器：

- Bootstrap ClassLoader
- Platform ClassLoader
- Application ClassLoader
- 自定义 ClassLoader

查看类加载：

```bash
java -Xlog:class+load App
```

## 五、双亲委派

类加载器先委托父加载器加载，父加载器无法加载时才自己加载。

好处：

- 避免核心类被篡改。
- 保证类加载一致性。

> **易错：** SPI、应用服务器、插件系统可能打破或调整双亲委派模型。

## 六、对象创建

大致过程：

1. 类加载检查。
2. 分配内存。
3. 初始化零值。
4. 设置对象头。
5. 执行构造器。

对象头包含：

- Mark Word
- Klass Pointer
- 数组长度，若是数组。

## 七、GC 基础

判断对象是否可回收：

- 引用计数不是 Java 主流方案。
- HotSpot 使用可达性分析。

GC Roots 包括：

- 栈中引用的对象。
- 静态字段引用的对象。
- 常量引用的对象。
- JNI 引用。

## 八、常见 GC

| GC | 特点 |
| --- | --- |
| Serial | 单线程，简单 |
| Parallel | 吞吐优先 |
| G1 | JDK 9 后默认，平衡吞吐和停顿 |
| ZGC | 低延迟 |
| Shenandoah | 低延迟 |

JDK 21 默认通常是 G1。

常用参数：

```bash
-Xms512m
-Xmx512m
-XX:+UseG1GC
-Xlog:gc*
```

> **重点：** GC 选择取决于吞吐、延迟、堆大小和业务特征。

## 九、JIT

JIT 会把热点字节码编译为机器码。

相关概念：

- 热点探测。
- 方法内联。
- 逃逸分析。
- 标量替换。
- 分层编译。

> **难点：** 微基准测试容易被 JIT 优化误导，应使用 JMH。

## 十、性能排查工具

```bash
jps
jcmd <pid> VM.version
jcmd <pid> Thread.print
jcmd <pid> GC.heap_info
jcmd <pid> JFR.start name=profile duration=60s filename=profile.jfr
jstat -gc <pid> 1000
jmap -histo <pid>
jstack <pid>
```

## 十一、常见线上问题

### CPU 飙高

排查：

1. 找进程。
2. 找高 CPU 线程。
3. 转换线程 id 为十六进制。
4. 查线程 dump。

### 内存泄漏

表现：

- Full GC 频繁。
- 堆使用持续上升。
- OOM。

排查：

- heap dump。
- 对象直方图。
- MAT / VisualVM / JMC。

### 死锁

```bash
jcmd <pid> Thread.print
```

线程 dump 通常会直接提示 deadlock。

## 十二、Java 内存模型

JMM 规定线程间共享变量的可见性和有序性。

必须理解：

- happens-before
- volatile
- synchronized
- final 字段初始化安全
- 指令重排序

## 练习

1. 写一个递归程序触发 `StackOverflowError`。
2. 写一个内存增长程序观察 GC 日志。
3. 用 `jcmd` 打印线程栈。
4. 用 JFR 记录 30 秒程序运行。

## 验收

- 能解释 JVM 内存区域。
- 能说明类加载流程。
- 能解释 GC Roots。
- 能看懂基础 GC 日志。
- 能给出 CPU 飙高和内存泄漏排查步骤。
