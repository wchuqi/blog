---
title: "Java 学习路线图（JDK 21）"
date: 2026-06-20
description: "这份路线图以 JDK 21 LTS 为基准，从语言基础、标准库、并发、JVM 到工程实践、Web 后端和面试能力逐步推进。"
tags:
  - "开发语言"
  - "Java"
  - "学习路线图"
category: "开发语言"
---

# Java 学习路线图（JDK 21）

这份路线图以 JDK 21 LTS 为基准，从语言基础、标准库、并发、JVM 到工程实践、Web 后端和面试能力逐步推进。

## 学习总原则

每个阶段都先建立理论图景，再写代码验证。不要把 Java 学成“看到语法就套示例”的清单式知识：基础阶段要理解类型、引用、对象和栈堆关系；标准库阶段要理解数据结构、不可变性、时间和数字模型；并发和 JVM 阶段要理解共享状态、可见性、类加载、GC 和诊断证据；工程阶段要理解构建、测试、数据库、Web、安全这些边界为什么会影响线上稳定性。

每学一个知识点，都按“是什么、为什么、像什么、怎么运行、什么时候不用、错了会怎样”六个问题复述一遍，再进入代码练习。

## 阶段 1：环境、工具链和基础语法

目标：能安装 JDK 21，编写、编译、运行简单 Java 程序。

需要掌握：

- JDK、JRE、JVM、javac、java
- JShell、jar、javadoc、jdeps、jcmd 基本作用
- 包、类、方法、入口方法
- 基本类型、引用类型、运算符、控制流

核心命令：

```bash
java --version
javac --version
javac Hello.java
java Hello
jshell
```

验收：

- 能解释 JDK、JRE、JVM 的区别。
- 能独立编译并运行一个 Java 程序。
- 能说明基本类型和引用类型的区别。

## 阶段 2：面向对象和错误处理

目标：能用类和对象组织业务逻辑，并正确处理异常。

需要掌握：

- 类、对象、构造器、封装
- 继承、组合、多态
- 抽象类、接口、默认方法
- equals / hashCode / toString
- checked exception、unchecked exception
- try-with-resources

验收：

- 能设计一个小型领域模型。
- 能解释重载和重写。
- 能说明什么时候捕获异常、什么时候继续抛出。

## 阶段 3：现代类型能力

目标：掌握 Java 现代语言特性，提高表达力和类型安全。

需要掌握：

- 泛型、通配符、类型擦除
- enum
- annotation
- record
- sealed class / sealed interface
- pattern matching for instanceof
- pattern matching for switch

验收：

- 能解释 `List<? extends Number>` 和 `List<? super Integer>`。
- 能用 record 表达不可变数据载体。
- 能用 sealed 限定继承层次。

## 阶段 4：集合、函数式和标准库

目标：能熟练处理集合、字符串、时间、数字和数据转换。

需要掌握：

- List、Set、Map、Queue、Deque
- HashMap、ConcurrentHashMap、TreeMap
- Comparable、Comparator
- Lambda、方法引用、Stream
- Optional
- String、StringBuilder、正则
- java.time

验收：

- 能根据场景选择集合。
- 能写出可读的 Stream 管道。
- 能避免 Optional 滥用和时间 API 常见错误。

## 阶段 5：IO、NIO 和网络基础

目标：能处理文件、流、字符编码、路径、网络请求和资源释放。

需要掌握：

- InputStream / OutputStream
- Reader / Writer
- try-with-resources
- Path、Files、FileChannel
- Charset、UTF-8
- Socket、HTTP Client
- 序列化风险

验收：

- 能安全读写文件。
- 能解释字节流和字符流。
- 能用 JDK HTTP Client 调用接口。

## 阶段 6：并发和虚拟线程

目标：掌握 Java 并发模型，并理解 JDK 21 虚拟线程的适用场景。

需要掌握：

- Thread、Runnable、Callable、Future
- ExecutorService、线程池参数
- synchronized、volatile、Lock
- happens-before、JMM
- Atomic、CAS
- CompletableFuture
- virtual thread
- structured concurrency 概念

验收：

- 能解释线程安全问题。
- 能正确使用线程池。
- 能说明虚拟线程适合 IO 密集场景，不是 CPU 加速器。

## 阶段 7：JVM、GC 和性能

目标：能理解 Java 程序运行机制，并具备基础排障能力。

需要掌握：

- 类加载
- 栈、堆、方法区、直接内存
- 对象创建和引用
- GC Roots、可达性分析
- G1、ZGC、Shenandoah 概念
- JFR、jcmd、jstack、jmap、jstat
- 内存泄漏、CPU 飙高、死锁排查

验收：

- 能解释 JVM 内存区域。
- 能看懂线程 dump 的基本信息。
- 能说明如何排查内存泄漏。

## 阶段 8：工程化、测试和质量

目标：能开发可维护、可测试、可交付的 Java 项目。

需要掌握：

- Maven / Gradle
- JUnit 5、Mockito、AssertJ
- 日志 SLF4J / Logback
- 调试、断点、远程调试
- Checkstyle、SpotBugs、Error Prone
- CI/CD 基本流程
- 代码分层和包结构

验收：

- 能搭建 Maven 项目。
- 能写单元测试和集成测试。
- 能说明日志和异常处理规范。

## 阶段 9：数据库和 Web 后端

目标：具备 Java 后端开发基础能力。

需要掌握：

- JDBC
- 连接池
- 事务 ACID、隔离级别
- SQL 注入防护
- ORM 基础
- HTTP、JSON、REST
- Servlet 基础
- Spring / Spring Boot 核心概念

验收：

- 能写 JDBC CRUD。
- 能解释事务传播和隔离。
- 能构建一个简单 REST API。

## 阶段 10：安全、架构和长期维护

目标：能处理真实项目中的安全、兼容性、演进和线上问题。

需要掌握：

- 输入校验、输出编码
- 反序列化风险
- 依赖漏洞和版本管理
- 配置管理和密钥管理
- 模块系统 JPMS
- 反射、动态代理、SPI
- 可观测性、指标、日志、链路追踪
- 向后兼容和升级策略

验收：

- 能说明常见 Java 安全风险。
- 能设计一个可维护的模块边界。
- 能制定从旧 JDK 升级到 JDK 21 的检查清单。

## 推荐学习节奏

| 周期 | 学习重点 | 产出 |
| --- | --- | --- |
| 第 1 周 | 环境、语法、OOP | 命令行学生管理程序 |
| 第 2 周 | 泛型、集合、函数式 | 集合数据处理工具 |
| 第 3 周 | IO、NIO、HTTP Client | 文件导入导出和接口调用工具 |
| 第 4 周 | 并发、虚拟线程 | 并发任务调度器 |
| 第 5 周 | JVM、GC、排障 | 一份 JVM 排障笔记 |
| 第 6 周 | 测试、构建、工程规范 | Maven 多模块项目 |
| 第 7 周 | 数据库和 Web 后端 | REST API 小项目 |
| 第 8 周 | 安全、面试、综合项目 | 完整后端练习项目和面试题复习 |

## 最终能力清单

- 能使用 JDK 21 编写现代 Java 代码。
- 能理解类型系统、OOP、泛型和现代语言特性。
- 能熟练使用集合、Stream、IO、时间 API。
- 能处理并发、线程池和虚拟线程场景。
- 能理解 JVM 内存、GC 和基础性能排查。
- 能完成测试、构建、日志、调试和质量检查。
- 能开发数据库和 Web 后端基础应用。
- 能回答 Java 面试中的概念题、场景题和排障题。
