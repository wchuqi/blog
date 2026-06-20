---
title: "JVM 完整知识点清单"
date: 2026-06-20
description: "JVM 规范、HotSpot 实现、OpenJ9 等其他实现。"
tags:
  - "开发语言"
  - "JVM"
  - "知识清单"
category: "开发语言"
---

# JVM 完整知识点清单

[返回索引](../JVM学习资料.md)

## 一、基础和边界

- JVM 规范、HotSpot 实现、OpenJ9 等其他实现。
- JDK、JRE、JVM、JIT、GC、字节码。
- Java 源码到机器执行的完整链路。
- classpath、module path、jar、fat jar。

## 二、运行时数据区

- 程序计数器。
- Java 虚拟机栈、栈帧、局部变量表、操作数栈。
- 本地方法栈。
- Java 堆。
- 方法区、元空间。
- 运行时常量池、字符串常量池。
- 直接内存、Code Cache、Native Memory。
- 容器内存和进程 RSS。

## 三、对象模型

- 对象创建过程。
- 对象头、Mark Word、Klass Pointer。
- 指针压缩、对象对齐、字段布局。
- TLAB、CAS 分配。
- 逃逸分析、标量替换、栈上分配的实现讨论。
- 强引用、软引用、弱引用、虚引用。
- ThreadLocal 和引用泄漏。

## 四、类加载

- 加载、验证、准备、解析、初始化、使用、卸载。
- Bootstrap、Platform、Application、自定义 ClassLoader。
- 双亲委派模型。
- 类加载器命名空间。
- SPI、线程上下文类加载器。
- Tomcat、Spring Boot、插件系统类加载。
- `ClassNotFoundException`、`NoClassDefFoundError`、`NoSuchMethodError`、`LinkageError`。

## 五、字节码和执行引擎

- `.class` 文件结构。
- 常量池。
- 字节码指令分类。
- 方法调用指令：`invokestatic`、`invokespecial`、`invokevirtual`、`invokeinterface`、`invokedynamic`。
- 异常表。
- 同步指令。
- 解释器、JIT、分层编译。

## 六、GC

- 可达性分析。
- GC Roots。
- 标记-清除、标记-复制、标记-整理。
- 分代假说。
- STW。
- 跨代引用、卡表、记忆集、写屏障。
- 三色标记、SATB、增量更新。
- Serial、Parallel、G1、ZGC、Shenandoah、Epsilon。
- G1 Region、Mixed GC、Humongous Object。
- GC 日志阅读。
- 内存泄漏和 OOM 排查。

## 七、JIT 和性能

- 热点探测。
- C1、C2、分层编译。
- 方法内联。
- 逃逸分析、锁消除、标量替换。
- 去优化、OSR。
- Code Cache。
- JMH 和微基准陷阱。
- profiling、火焰图、JFR。

## 八、JMM、线程和锁

- 原子性、可见性、有序性。
- happens-before。
- `volatile`。
- `synchronized`。
- `final` 字段语义。
- 锁升级、轻量级锁、重量级锁。
- 偏向锁历史和版本差异。
- monitor、AQS、park/unpark。
- 死锁、活锁、锁竞争。

## 九、诊断工具

- `jps`、`jcmd`、`jstack`、`jmap`、`jstat`、`javap`。
- JFR、JMC。
- GC 日志。
- heap dump、thread dump。
- NMT。
- async-profiler、火焰图。
- OS 工具：`top`、`pidstat`、`perf`、容器事件。

## 十、生产和容器化

- JVM 启动参数基线。
- GC 日志滚动和归档。
- OOM dump 策略。
- cgroup 内存限制。
- CPU limit 对 GC 和 JIT 的影响。
- 线程数、`-Xss`、连接池和内存预算。
- Kubernetes 探针、优雅停机、预热。
- 版本升级和废弃参数检查。
- 安全：dump 脱敏、诊断端口、JMX 权限。

## 十一、必须能回答的场景

- CPU 高如何排查。
- 内存持续上涨如何排查。
- Full GC 频繁如何排查。
- Java OOM 和容器 OOM killer 如何区分。
- 为什么类明明存在还报 `NoSuchMethodError`。
- 为什么服务启动后性能逐渐变好。
- 为什么 `volatile int++` 不安全。
- 如何给 2C4G 容器配置 JVM 参数。

## 十二、深度机制补充清单

- 类初始化主动使用规则。
- 编译期常量内联和初始化差异。
- 准备阶段零值和初始化阶段显式赋值。
- 类加载器可见性、隔离、child-first、线程上下文类加载器。
- Fat jar、Web 容器、插件系统中的类冲突。
- 符号引用、直接引用、解析时机和链接错误。
- 常量池、运行时常量池、字符串常量池的边界。
- 方法分派：静态分派、动态分派、单分派、多分派概念边界。
- `invokedynamic`、Lambda、字符串拼接和动态调用点。
- Safepoint、safepoint polling、STW 原因。
- 三色标记并发漏标问题。
- SATB、增量更新、读屏障、写屏障。
- Card Table、Remembered Set、跨代引用和跨 Region 引用。
- G1 Humongous Object、Mixed GC、并发标记失败、to-space exhausted。
- ZGC 指针着色、并发重定位、内存余量。
- Shenandoah 并发压缩和屏障开销。
- Code Cache 满、JIT 编译停用和性能退化。
- OSR、去优化、类型 profile、内联缓存。
- JMH 预热、fork、Blackhole、死代码消除、常量折叠。
- `volatile` 内存屏障、final 字段语义、安全发布。
- 锁粗化、锁消除、monitor、AQS、park/unpark。
- ThreadLocalMap 弱引用 key 和强引用 value 泄漏。
- Native Memory Tracking 分类解读。
- 容器 CPU limit 对 GC 线程、JIT 编译和应用吞吐的影响。
- Heap dump、core dump、JFR、GC log 的证据保留和敏感信息处理。

## 十三、命令和证据清单

| 目标 | 命令或证据 |
| --- | --- |
| 查看 JVM 参数 | `jcmd <pid> VM.flags`、`jcmd <pid> VM.command_line` |
| 查看堆概况 | `jcmd <pid> GC.heap_info` |
| 查看类直方图 | `jcmd <pid> GC.class_histogram` |
| 抓 heap dump | `jcmd <pid> GC.heap_dump /path/app.hprof` |
| 抓线程栈 | `jcmd <pid> Thread.print -l` |
| 开启 JFR | `jcmd <pid> JFR.start name=profile settings=profile duration=120s filename=profile.jfr` |
| 查看 Native 内存 | `jcmd <pid> VM.native_memory summary` |
| 查看类加载 | `java -Xlog:class+load=info ...` |
| 查看 GC | `-Xlog:gc*,safepoint:file=gc.log:time,uptime,level,tags` |
| 查看字节码 | `javap -c -v ClassName` |

## 十四、深水区学习顺序

| 顺序 | 深水区主题 | 目标文件 |
| --- | --- | --- |
| 1 | 类加载解析、初始化和命名空间 | [15-类加载解析初始化和命名空间深度解析.md](15-类加载解析初始化和命名空间深度解析.md) |
| 2 | GC 屏障、记忆集和低延迟思想 | [16-GC屏障记忆集和低延迟收集器深度解析.md](16-GC屏障记忆集和低延迟收集器深度解析.md) |
| 3 | JIT、内联、去优化和微基准 | [17-JIT编译内联去优化和微基准深度解析.md](17-JIT编译内联去优化和微基准深度解析.md) |
| 4 | JMM、锁和可见性证明 | [18-JMM可见性有序性和锁实现深度解析.md](18-JMM可见性有序性和锁实现深度解析.md) |
| 5 | Native 内存、容器预算和 OOMKilled | [19-Native内存容器资源和参数预算深度解析.md](19-Native内存容器资源和参数预算深度解析.md) |
| 6 | Safepoint、STW 和非 GC 停顿 | [22-Safepoint安全点STW和停顿来源深度解析.md](22-Safepoint安全点STW和停顿来源深度解析.md) |
| 7 | class 文件、分派和 invokedynamic | [23-class文件常量池方法分派和invokedynamic深度解析.md](23-class文件常量池方法分派和invokedynamic深度解析.md) |
| 8 | G1 全链路和失败模式 | [24-G1垃圾收集全链路日志和失败模式深度解析.md](24-G1垃圾收集全链路日志和失败模式深度解析.md) |
| 9 | ZGC 并发重定位和低延迟边界 | [25-ZGC并发标记重定位和低延迟边界深度解析.md](25-ZGC并发标记重定位和低延迟边界深度解析.md) |
| 10 | JIT 日志、Code Cache 和去优化排查 | [26-JIT日志CodeCache和去优化排查深度解析.md](26-JIT日志CodeCache和去优化排查深度解析.md) |
| 11 | JMM 从 CPU 到 happens-before | [27-JMM从CPU缓存到happens-before深度解析.md](27-JMM从CPU缓存到happens-before深度解析.md) |
| 12 | Heap dump、MAT 和保留链分析 | [28-HeapDump-MAT保留链和内存泄漏定位深度解析.md](28-HeapDump-MAT保留链和内存泄漏定位深度解析.md) |
| 13 | JVM 参数决策和容量压测 | [29-JVM参数决策树和容量压测案例深度解析.md](29-JVM参数决策树和容量压测案例深度解析.md) |

## 自检

- 能画 JVM 运行总图。
- 能读懂基础字节码。
- 能解释 GC 日志中的一次回收。
- 能用工具定位一个本地制造的 JVM 故障。
- 能把 JVM 答案从“背概念”升级到“机制 + 证据 + 边界”。
