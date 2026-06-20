---
title: "Java Knowledge Demo"
date: 2026-06-20
description: "本工程是 开发语言/Java 文档知识点对应的 Maven 示例工程，基于 JDK 21。"
tags:
  - "source_code"
  - "java_proj"
category: "源码项目"
---

# Java Knowledge Demo

本工程是 `开发语言/Java` 文档知识点对应的 Maven 示例工程，基于 JDK 21。

## 测试怎么触发

### 1. 运行全部单元测试

在工程目录执行：

```powershell
cd D:\workspace\job_search\source_code\java_proj
mvn test
```

触发内容：

- 编译 `src/main/java` 中的示例源码。
- 编译并运行 `src/test/java` 下所有 `*Test` 测试类。
- 生成 JaCoCo 覆盖率报告到 `target/site/jacoco/index.html`。

### 2. 运行完整验证和覆盖率门禁

```powershell
cd D:\workspace\job_search\source_code\java_proj
mvn verify
```

触发内容：

- 运行全部测试。
- 打包 jar。
- 执行 JaCoCo `check-line-coverage`。
- 当前门禁要求：行覆盖率 `LINE COVEREDRATIO = 1.0`，即行覆盖率必须为 100%。

如果新增源码没有对应测试，`mvn verify` 会在 JaCoCo check 阶段失败。

### 3. 只运行某个测试类

```powershell
mvn -Dtest=ConcurrencyDemoTest test
```

示例：

```powershell
mvn -Dtest=JdbcPersistenceDemoTest test
mvn -Dtest=WebSpringDemoTest test
mvn -Dtest=CoverageEdgeCasesTest test
```

### 4. 只运行某个测试方法

```powershell
mvn -Dtest=ConcurrencyDemoTest#jmmThreadLocalAndVirtualThreadsAreDemonstrated test
```

方法名来自测试类中的 `@Test` 方法。

### 5. 按包名批量运行

Surefire 支持通配符：

```powershell
mvn -Dtest="com.javastudy.concurrency.*Test" test
mvn -Dtest="com.javastudy.jdbc.*Test" test
mvn -Dtest="com.javastudy.web.*Test" test
```

## 测试场景入口

| 知识点范围 | 主要源码包 | 主要测试入口 | 触发的场景 |
|---|---|---|---|
| 基础语法、类型、控制流 | `basics` | `basics/*Test` | 基本类型、装箱拆箱、数值提升、溢出、switch、数组、参数传递 |
| 面向对象 | `oop` | `oop/*Test` | 封装、继承、多态、接口、抽象类、equals/hashCode、值对象 |
| 异常 | `exception` | `exception/*Test` | checked/unchecked、try-catch-finally、try-with-resources、异常包装、错误边界 |
| 泛型和现代类型能力 | `generics` | `generics/*Test` | 泛型、通配符、枚举、注解、record、sealed、pattern matching |
| 集合 | `collections` | `collections/*Test` | List、Set、Map、Queue、Deque、Iterator、fail-fast、Sequenced Collections |
| 函数式和 Stream | `functional` | `functional/*Test` | Lambda、方法引用、Optional、Stream、reduce、parallel stream、副作用 |
| 字符串、日期、数字和工具类 | `stringdatetime` | `stringdatetime/*Test` | String、StringBuilder、正则、java.time、BigDecimal、UUID、Random |
| IO、NIO、网络 | `io` | `io/*Test` | 字节流、字符流、Path/Files、FileChannel、HTTP Client、Socket、序列化、WatchService |
| 并发 | `concurrency` | `ConcurrencyDemoTest` | Thread、ExecutorService、Atomic、Lock/Condition、BlockingQueue、CompletableFuture、ThreadLocal、虚拟线程 |
| JVM 和性能 | `jvm` | `JvmDiagnosticsDemoTest` | 内存区域、类加载、GC Roots、JIT、诊断工具、排障步骤 |
| 反射、SPI、动态代理 | `reflection` | `ReflectionProxyDemoTest` | Class/Method/Constructor、注解读取、MethodHandle、JDK 动态代理、ServiceLoader |
| 构建、测试、质量 | `testing` | `BuildTestingQualityDemoTest` | Maven 坐标、依赖 scope、JUnit 5、Mockito、日志、CI、质量工具 |
| JDBC 和持久化 | `jdbc` | `JdbcPersistenceDemoTest` | H2 内存库、PreparedStatement、事务、rollback、批处理、隔离级别 |
| Web 和 Spring | `web` | `WebSpringDemoTest` | HTTP 状态码、JSON、Controller、Service、参数校验、全局异常、配置和观测 |
| 安全和工程实践 | `security` | `SecureCodingDemoTest` | 输入校验、SQL 注入防护、XSS 转义、SSRF 防护、敏感信息、不可变性 |
| JDK 21 现代特性 | `modernjava` | `ModernJavaDemoTest` | virtual threads、pattern switch、record patterns、sequenced collections、升级检查 |

## 覆盖率补全测试

有两个测试类专门用于防止覆盖率回退：

- `CoverageConstructorTest`
  - 自动扫描 `target/classes/com/javastudy` 下的 class。
  - 对可实例化的无参构造器执行实例化。
  - 作用：覆盖工具类、演示类的隐式构造器行。

- `CoverageEdgeCasesTest`
  - 覆盖异常路径、边界输入、JDK 21 平台相关路径、Socket/NIO/JDBC 等不容易被普通 happy path 覆盖的场景。
  - 作用：保证新增或修改代码后 JaCoCo 行覆盖率仍能达到 100%。

## 新增测试时的约定

1. 新增 `src/main/java` 源码时，同步新增或更新 `src/test/java` 测试。
2. 先跑相关测试类，例如：

```powershell
mvn -Dtest=YourDemoTest test
```

3. 再跑完整验证：

```powershell
mvn verify
```

4. 如果 `mvn verify` 因覆盖率失败，打开报告定位未覆盖行：

```powershell
start target\site\jacoco\index.html
```

在无 GUI 环境下，可以直接查看：

```powershell
Import-Csv target\site\jacoco\jacoco.csv |
  Where-Object { [int]$_.LINE_MISSED -gt 0 } |
  Select-Object PACKAGE,CLASS,LINE_MISSED,METHOD_MISSED
```

## 已知运行提示

当前 Mockito 在 JDK 21 下可能输出动态 agent 加载 warning。该 warning 不影响测试结果；`mvn verify` 以 Maven 退出码和 JaCoCo check 为准。
