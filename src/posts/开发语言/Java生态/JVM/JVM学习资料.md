---
title: "JVM 学习资料"
date: 2026-06-20
description: "这是一份 JVM 专题索引。详细内容按知识点拆分到 study-material/ 目录，适合 Java 后端、性能排查、生产调优和面试复习。"
tags:
  - "开发语言"
  - "JVM"
  - "学习资料总览"
category: "开发语言"
---

# JVM 学习资料

这是一份 JVM 专题索引。详细内容按知识点拆分到 `study-material/` 目录，适合 Java 后端、性能排查、生产调优和面试复习。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 运行时数据区和内存边界 | [01-运行时数据区和内存边界.md](study-material/01-运行时数据区和内存边界.md) |
| 2 | 对象模型创建过程和引用 | [02-对象模型创建过程和引用.md](study-material/02-对象模型创建过程和引用.md) |
| 3 | 类加载生命周期和双亲委派 | [03-类加载生命周期和双亲委派.md](study-material/03-类加载生命周期和双亲委派.md) |
| 4 | 字节码指令和执行引擎 | [04-字节码指令和执行引擎.md](study-material/04-字节码指令和执行引擎.md) |
| 5 | GC 基础可达性和分代模型 | [05-GC基础可达性和分代模型.md](study-material/05-GC基础可达性和分代模型.md) |
| 6 | 常见垃圾收集器和选择策略 | [06-常见垃圾收集器和选择策略.md](study-material/06-常见垃圾收集器和选择策略.md) |
| 7 | GC 日志内存泄漏和 OOM 排查 | [07-GC日志内存泄漏和OOM排查.md](study-material/07-GC日志内存泄漏和OOM排查.md) |
| 8 | JIT 编译逃逸分析和性能陷阱 | [08-JIT编译逃逸分析和性能陷阱.md](study-material/08-JIT编译逃逸分析和性能陷阱.md) |
| 9 | Java 内存模型线程和锁 | [09-Java内存模型线程和锁.md](study-material/09-Java内存模型线程和锁.md) |
| 10 | JDK 诊断工具和可观测性 | [10-JDK诊断工具和可观测性.md](study-material/10-JDK诊断工具和可观测性.md) |
| 11 | JVM 参数容器化和生产基线 | [11-JVM参数容器化和生产基线.md](study-material/11-JVM参数容器化和生产基线.md) |
| 12 | 综合练习项目 | [12-综合练习项目.md](study-material/12-综合练习项目.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | JVM 完整知识点清单 | [14-JVM完整知识点清单.md](study-material/14-JVM完整知识点清单.md) |
| 15 | 类加载解析初始化和命名空间深度解析 | [15-类加载解析初始化和命名空间深度解析.md](study-material/15-类加载解析初始化和命名空间深度解析.md) |
| 16 | GC屏障记忆集和低延迟收集器深度解析 | [16-GC屏障记忆集和低延迟收集器深度解析.md](study-material/16-GC屏障记忆集和低延迟收集器深度解析.md) |
| 17 | JIT编译内联去优化和微基准深度解析 | [17-JIT编译内联去优化和微基准深度解析.md](study-material/17-JIT编译内联去优化和微基准深度解析.md) |
| 18 | JMM可见性有序性和锁实现深度解析 | [18-JMM可见性有序性和锁实现深度解析.md](study-material/18-JMM可见性有序性和锁实现深度解析.md) |
| 19 | Native内存容器资源和参数预算深度解析 | [19-Native内存容器资源和参数预算深度解析.md](study-material/19-Native内存容器资源和参数预算深度解析.md) |
| 20 | 生产故障案例和排障剧本深度版 | [20-生产故障案例和排障剧本深度版.md](study-material/20-生产故障案例和排障剧本深度版.md) |
| 21 | 深度实验手册和能力验收 | [21-深度实验手册和能力验收.md](study-material/21-深度实验手册和能力验收.md) |
| 22 | Safepoint安全点STW和停顿来源深度解析 | [22-Safepoint安全点STW和停顿来源深度解析.md](study-material/22-Safepoint安全点STW和停顿来源深度解析.md) |
| 23 | class文件常量池方法分派和invokedynamic深度解析 | [23-class文件常量池方法分派和invokedynamic深度解析.md](study-material/23-class文件常量池方法分派和invokedynamic深度解析.md) |
| 24 | G1垃圾收集全链路日志和失败模式深度解析 | [24-G1垃圾收集全链路日志和失败模式深度解析.md](study-material/24-G1垃圾收集全链路日志和失败模式深度解析.md) |
| 25 | ZGC并发标记重定位和低延迟边界深度解析 | [25-ZGC并发标记重定位和低延迟边界深度解析.md](study-material/25-ZGC并发标记重定位和低延迟边界深度解析.md) |
| 26 | JIT日志CodeCache和去优化排查深度解析 | [26-JIT日志CodeCache和去优化排查深度解析.md](study-material/26-JIT日志CodeCache和去优化排查深度解析.md) |
| 27 | JMM从CPU缓存到happens-before深度解析 | [27-JMM从CPU缓存到happens-before深度解析.md](study-material/27-JMM从CPU缓存到happens-before深度解析.md) |
| 28 | HeapDump MAT保留链和内存泄漏定位深度解析 | [28-HeapDump-MAT保留链和内存泄漏定位深度解析.md](study-material/28-HeapDump-MAT保留链和内存泄漏定位深度解析.md) |
| 29 | JVM参数决策树和容量压测案例深度解析 | [29-JVM参数决策树和容量压测案例深度解析.md](study-material/29-JVM参数决策树和容量压测案例深度解析.md) |

## 使用建议

- 初学者：按 0 到 6 阅读，先把运行时和 GC 建立起来。
- 后端开发：重点读 1、3、5、7、10、11。
- 性能排查：重点读 7、8、9、10、11、12。
- 深度原理：重点读 15 到 19，把类加载、GC、JIT、JMM、容器资源预算连起来。
- 深水区机制：重点读 22 到 27，补齐 safepoint、字节码分派、G1、ZGC、JIT 日志和 JMM 底层映射。
- 生产排障：重点读 7、10、11、19、20、28、29。
- 面试复习：先读 14 查漏，再读 13 和 `面试知识点/`，高阶岗位重点看面试 06、07。
- 源码或深度方向：重点读类加载、字节码、JIT、GC 屏障和工具章节。

## 环境假设

- 虚拟机实现：HotSpot JVM。
- 版本基准：JDK 21 LTS，兼顾现代 JDK 的低延迟 GC 和容器运行特性。
- 操作系统：Linux 生产环境优先，Windows/macOS 命令可按 JDK 工具等价替换。
- 注意：JVM 规范、Java 语言规范、HotSpot 参数、不同 GC 的实现细节不是同一个层次。
