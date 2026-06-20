---
title: "Java 学习资料（JDK 21）"
date: 2026-06-20
description: "这份资料以 JDK 21 LTS 为版本基准，按知识点拆分到 study-material/ 目录。目标不是只掌握常用语法，而是系统覆盖 Java 语言、标准库、并发、JVM、工具链、工程实践、面试和现代 Java 特性。"
tags:
  - "开发语言"
  - "Java"
  - "学习资料总览"
category: "开发语言"
---

# Java 学习资料（JDK 21）

这份资料以 JDK 21 LTS 为版本基准，按知识点拆分到 `study-material/` 目录。目标不是只掌握常用语法，而是系统覆盖 Java 语言、标准库、并发、JVM、工具链、工程实践、面试和现代 Java 特性。

## 阅读原则：先建立理论图景，再写代码

Java 不是一组孤立语法，而是一套从源码到运行时的完整机制：源码先被编译成字节码，字节码被 JVM 加载和验证，对象在堆上创建，方法调用形成栈帧，线程之间通过内存模型协作，标准库和框架再把这些基础能力组合成工程系统。学习时不要看到一个语法点就立刻背代码模板，而要先问三个问题：它解决什么问题、它在 JVM 或类型系统里处在什么位置、真实项目里误用会造成什么后果。

本资料每个主章节都增加了“理论导读”或“心智模型”段落。建议先读这部分，把概念想象成清晰的运行画面，再看示例代码。代码只是验证理论的实验，不是替代理解的捷径。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览、环境和 Java 心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | JDK 21 环境和工具链 | [01-JDK21环境和工具链.md](study-material/01-JDK21环境和工具链.md) |
| 2 | 基础语法、类型系统和运算 | [02-基础语法类型系统和运算.md](study-material/02-基础语法类型系统和运算.md) |
| 3 | 面向对象、封装继承多态 | [03-面向对象封装继承多态.md](study-material/03-面向对象封装继承多态.md) |
| 4 | 异常处理、断言和错误边界 | [04-异常处理断言和错误边界.md](study-material/04-异常处理断言和错误边界.md) |
| 5 | 泛型、枚举、注解、record 和 sealed | [05-泛型枚举注解Record和Sealed.md](study-material/05-泛型枚举注解Record和Sealed.md) |
| 6 | 集合框架和常用数据结构 | [06-集合框架和常用数据结构.md](study-material/06-集合框架和常用数据结构.md) |
| 7 | Lambda、Stream、Optional 和函数式编程 | [07-LambdaStreamOptional和函数式编程.md](study-material/07-LambdaStreamOptional和函数式编程.md) |
| 8 | 字符串、时间日期、数字和常用工具类 | [08-字符串时间日期数字和工具类.md](study-material/08-字符串时间日期数字和工具类.md) |
| 9 | IO、NIO.2、序列化和网络基础 | [09-IONIO序列化和网络基础.md](study-material/09-IONIO序列化和网络基础.md) |
| 10 | 并发编程、线程池和虚拟线程 | [10-并发编程线程池和虚拟线程.md](study-material/10-并发编程线程池和虚拟线程.md) |
| 11 | JVM、内存模型、GC 和性能调优 | [11-JVM内存模型GC和性能调优.md](study-material/11-JVM内存模型GC和性能调优.md) |
| 12 | 反射、模块系统、SPI 和动态代理 | [12-反射模块系统SPI和动态代理.md](study-material/12-反射模块系统SPI和动态代理.md) |
| 13 | 构建、测试、调试和代码质量 | [13-构建测试调试和代码质量.md](study-material/13-构建测试调试和代码质量.md) |
| 14 | 数据库、JDBC、事务和持久化基础 | [14-数据库JDBC事务和持久化基础.md](study-material/14-数据库JDBC事务和持久化基础.md) |
| 15 | Web 开发、HTTP、Servlet 和 Spring 生态 | [15-Web开发HTTPServlet和Spring生态.md](study-material/15-Web开发HTTPServlet和Spring生态.md) |
| 16 | 安全、编码规范、可维护性和工程实践 | [16-安全编码规范可维护性和工程实践.md](study-material/16-安全编码规范可维护性和工程实践.md) |
| 17 | JDK 21 新特性和现代 Java 实践 | [17-JDK21新特性和现代Java实践.md](study-material/17-JDK21新特性和现代Java实践.md) |
| 18 | Java 完整知识点清单 | [18-Java完整知识点清单.md](study-material/18-Java完整知识点清单.md) |
| 19 | 命令和 API 速查 | [19-命令和API速查.md](study-material/19-命令和API速查.md) |
| 20 | 综合练习项目 | [20-综合练习项目.md](study-material/20-综合练习项目.md) |
| 21 | 最终学习验收 | [21-最终学习验收.md](study-material/21-最终学习验收.md) |
| 22 | 面试知识点整理 | [22-面试知识点整理.md](study-material/22-面试知识点整理.md) |

## 使用建议

- 初学按 0 到 8 学语言基础和标准库。
- 想做 Java 后端开发，重点学习 10、11、13、14、15、16。
- 想理解现代 Java，重点学习 5、7、10、17。
- 想排查性能和线上问题，重点学习 10、11、13、16、19。
- 想检查知识点是否遗漏，先看 18。
- 面试前先看 22，再结合 18 和 19 复习。
- 每章学习时先复述“理论导读”，再敲代码。若只能背示例但说不清概念边界，说明还没有真正掌握。

## 版本基准

- JDK 版本：JDK 21 LTS。
- 语言特性：覆盖 Java 8 到 Java 21 的主流能力，重点标注 JDK 21 相关特性。
- 预览特性：只作为了解内容，不作为默认生产实践。
