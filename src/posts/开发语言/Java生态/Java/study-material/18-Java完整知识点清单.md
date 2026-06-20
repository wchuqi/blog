---
title: "Java 学习资料：Java 完整知识点清单（JDK 21）"
date: 2026-06-20
description: "这份清单用于检查 Java 学习资料是否覆盖完整。学习 Java 不能只看语法，还要覆盖标准库、并发、JVM、工程化、安全、数据库、Web 和现代 JDK 特性。"
tags:
  - "开发语言"
  - "Java"
  - "知识清单"
category: "开发语言"
---

# Java 学习资料：Java 完整知识点清单（JDK 21）

[返回索引](../Java学习资料.md)

## 使用方式

这份清单用于检查 Java 学习资料是否覆盖完整。学习 Java 不能只看语法，还要覆盖标准库、并发、JVM、工程化、安全、数据库、Web 和现代 JDK 特性。

> **重点：** Java 开发能力 = 语言基础 + 标准库 + JVM + 并发 + 工程化 + 数据库/Web + 安全和可维护性。

## 理论学习检查标准

检查每个知识点时，不要只问“我会不会写这段代码”，还要问“我能不能讲清楚它为什么存在”。一个 Java 知识点至少要能回答五层问题：

1. 它解决什么问题：例如泛型解决编译期类型安全，并不是为了少写强转这么简单。
2. 它在 Java 体系里的位置：例如集合依赖类型系统、对象相等性和底层数据结构；并发依赖线程调度、共享内存和 JMM。
3. 它的运行图景是什么：例如引用变量保存的是对象引用，线程池复用的是平台线程，虚拟线程降低的是阻塞等待成本。
4. 它的适用边界是什么：例如 record 适合不可变数据载体，不适合复杂可变实体；Optional 适合返回值，不适合字段滥用。
5. 它误用会造成什么后果：例如错误的 `hashCode` 会让 HashMap 查找失败，吞异常会让线上排障失去证据。

> **验收：** 如果一个知识点只能背代码示例，却不能用自己的话解释“机制、边界、风险”，这项还不能算掌握。

## 一、环境和工具链

必须掌握：

- JDK、JRE、JVM 区别。
- JDK 21 安装和版本切换。
- `java`、`javac`、`jar`、`jshell`。
- classpath、module path。
- `--release 21`。
- JDK 诊断工具：`jps`、`jcmd`、`jstack`、`jmap`、`jstat`、`jfr`、`jdeps`。

关联文档：[01-JDK21环境和工具链.md](01-JDK21环境和工具链.md)

## 二、基础语法和类型系统

必须掌握：

- 包、类、方法、字段。
- 基本类型、引用类型。
- 自动装箱和拆箱。
- 数值提升、溢出、精度问题。
- `==` 和 `equals`。
- 控制流、switch 表达式。
- 数组、可变参数。
- Java 参数传递是值传递。
- `var` 局部变量类型推断。

关联文档：[02-基础语法类型系统和运算.md](02-基础语法类型系统和运算.md)

## 三、面向对象

必须掌握：

- 封装、继承、多态。
- 构造器和初始化顺序。
- static、final、this、super。
- 抽象类、接口、默认方法。
- 重载和重写。
- equals / hashCode / toString。
- 组合优于继承。
- 值对象和实体对象。

关联文档：[03-面向对象封装继承多态.md](03-面向对象封装继承多态.md)

## 四、异常和错误边界

必须掌握：

- Throwable、Exception、RuntimeException、Error。
- checked / unchecked exception。
- try-catch-finally。
- try-with-resources。
- 异常转换和 cause。
- 业务异常设计。
- 断言 assert。
- 日志和异常边界。

关联文档：[04-异常处理断言和错误边界.md](04-异常处理断言和错误边界.md)

## 五、泛型和现代类型能力

必须掌握：

- 泛型类、泛型方法。
- 类型擦除。
- 通配符。
- PECS。
- enum。
- annotation 和元注解。
- record。
- sealed。
- pattern matching for instanceof。
- pattern matching for switch。
- record patterns。
- 预览特性边界。

关联文档：

- [05-泛型枚举注解Record和Sealed.md](05-泛型枚举注解Record和Sealed.md)
- [17-JDK21新特性和现代Java实践.md](17-JDK21新特性和现代Java实践.md)

## 六、集合和数据结构

必须掌握：

- Collection、List、Set、Queue、Deque、Map。
- ArrayList、LinkedList。
- HashSet、LinkedHashSet、TreeSet。
- HashMap、LinkedHashMap、TreeMap、ConcurrentHashMap、EnumMap。
- Comparable、Comparator。
- Iterator、fail-fast。
- 不可变集合。
- JDK 21 Sequenced Collections。
- 集合性能和容量设置。

关联文档：[06-集合框架和常用数据结构.md](06-集合框架和常用数据结构.md)

## 七、函数式和 Stream

必须掌握：

- 函数式接口。
- Lambda。
- 方法引用。
- Predicate、Function、Consumer、Supplier。
- Stream 中间操作和终端操作。
- map、flatMap。
- collect、groupingBy、partitioningBy、mapping。
- reduce。
- Optional。
- 并行流。
- Stream 副作用和调试。

关联文档：[07-LambdaStreamOptional和函数式编程.md](07-LambdaStreamOptional和函数式编程.md)

## 八、常用标准库

必须掌握：

- String、StringBuilder、StringJoiner。
- text blocks。
- 正则 Pattern / Matcher。
- java.time：Instant、LocalDate、LocalDateTime、ZonedDateTime、Duration、Period。
- DateTimeFormatter。
- BigDecimal。
- Objects、Arrays、Collections。
- UUID、Random、ThreadLocalRandom、SecureRandom。

关联文档：[08-字符串时间日期数字和工具类.md](08-字符串时间日期数字和工具类.md)

## 九、IO、NIO 和网络

必须掌握：

- 字节流、字符流。
- 编码和 UTF-8。
- try-with-resources。
- Path、Files。
- FileChannel、ByteBuffer。
- Selector 概念。
- JDK HTTP Client。
- Socket 基础。
- 序列化风险。
- WatchService。

关联文档：[09-IONIO序列化和网络基础.md](09-IONIO序列化和网络基础.md)

## 十、并发

必须掌握：

- Thread、Runnable、Callable。
- Future、ExecutorService。
- ThreadPoolExecutor 参数。
- synchronized、volatile、Lock、Condition。
- Atomic、CAS。
- ConcurrentHashMap、BlockingQueue。
- CompletableFuture。
- Java Memory Model。
- happens-before。
- ThreadLocal。
- 虚拟线程。
- 结构化并发概念。

关联文档：[10-并发编程线程池和虚拟线程.md](10-并发编程线程池和虚拟线程.md)

## 十一、JVM 和性能

必须掌握：

- JVM 内存区域。
- 栈帧。
- 类加载流程。
- 双亲委派。
- 对象创建。
- GC Roots。
- G1、ZGC、Shenandoah。
- JIT。
- JFR、jcmd、jstack、jmap。
- CPU、内存、死锁、GC 排查。

关联文档：[11-JVM内存模型GC和性能调优.md](11-JVM内存模型GC和性能调优.md)

## 十二、反射、模块和动态能力

必须掌握：

- Class、Field、Method、Constructor。
- 注解读取。
- setAccessible 和模块封装。
- JDK 动态代理。
- CGLIB / Byte Buddy 概念。
- SPI、ServiceLoader。
- JPMS：module-info、requires、exports、opens、uses、provides。

关联文档：[12-反射模块系统SPI和动态代理.md](12-反射模块系统SPI和动态代理.md)

## 十三、构建、测试和质量

必须掌握：

- Maven / Gradle。
- JDK 21 编译配置。
- JUnit 5。
- Mockito。
- 测试分层。
- SLF4J / Logback。
- 调试和远程调试。
- Checkstyle、SpotBugs、JaCoCo、SonarQube。
- 依赖树和版本冲突。
- CI 流程。

关联文档：[13-构建测试调试和代码质量.md](13-构建测试调试和代码质量.md)

## 十四、数据库和持久化

必须掌握：

- JDBC。
- PreparedStatement。
- Connection / ResultSet 资源释放。
- 连接池。
- 事务 ACID。
- 隔离级别。
- SQL 注入防护。
- 批处理。
- ORM、JPA、Hibernate、MyBatis。
- N+1 问题。
- 事务边界。

关联文档：[14-数据库JDBC事务和持久化基础.md](14-数据库JDBC事务和持久化基础.md)

## 十五、Web 和 Spring 生态

必须掌握：

- HTTP 方法和状态码。
- JSON。
- Servlet、Filter。
- Spring IoC / DI。
- AOP。
- Spring Boot REST API。
- 参数校验。
- 全局异常处理。
- Spring 事务。
- 配置管理。
- 可观测性。

关联文档：[15-Web开发HTTPServlet和Spring生态.md](15-Web开发HTTPServlet和Spring生态.md)

## 十六、安全和工程实践

必须掌握：

- 输入校验。
- SQL 注入。
- XSS / SSRF 基本意识。
- 反序列化风险。
- 敏感信息保护。
- 依赖漏洞。
- 日志规范。
- 不可变性。
- 空值策略。
- 分层架构。
- 重构和可维护性。
- JDK 升级策略。

关联文档：[16-安全编码规范可维护性和工程实践.md](16-安全编码规范可维护性和工程实践.md)

## 十七、JDK 21 特性

必须掌握：

- Virtual Threads。
- Pattern Matching for switch。
- Record Patterns。
- Sequenced Collections。
- Generational ZGC。
- 预览特性启用方式。
- Java 8 到 JDK 21 升级检查。

关联文档：[17-JDK21新特性和现代Java实践.md](17-JDK21新特性和现代Java实践.md)

## 十八、面试和实践

必须掌握：

- 高频概念题。
- 场景题。
- JVM 排障题。
- 并发和虚拟线程题。
- Spring / 数据库题。
- 综合项目表达。

关联文档：

- [20-综合练习项目.md](20-综合练习项目.md)
- [21-最终学习验收.md](21-最终学习验收.md)
- [22-面试知识点整理.md](22-面试知识点整理.md)

## 最终覆盖检查

你至少应该能回答：

- Java 为什么跨平台？
- Java 参数传递到底是什么？
- 泛型为什么会类型擦除？
- HashMap 为什么要求 key 的 equals/hashCode 正确？
- Stream 的惰性是什么？
- Optional 的适用边界是什么？
- volatile 和 synchronized 的区别是什么？
- 虚拟线程解决什么问题，不解决什么问题？
- JVM 堆、栈、元空间分别存什么？
- G1 和 ZGC 的取舍是什么？
- 反射为什么会受模块系统影响？
- Spring 事务为什么会失效？
- SQL 注入如何防护？
- Java 原生反序列化为什么危险？
- 从 Java 8 升级到 JDK 21 要检查什么？
