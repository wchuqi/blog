---
title: "Java 学习资料：JDK 21 新特性和现代 Java 实践"
date: 2026-06-20
description: "完成本章后，你应该能："
tags:
  - "开发语言"
  - "Java"
category: "开发语言"
---

# Java 学习资料：JDK 21 新特性和现代 Java 实践

[返回索引](../Java学习资料.md)

## 学习目标

完成本章后，你应该能：

- 了解 Java 8 到 Java 21 的主流现代特性。
- 掌握 JDK 21 中稳定可用的重要能力。
- 区分正式特性和预览特性。
- 用现代 Java 写出更简洁、安全和可维护的代码。

## 理论导读：现代 Java 是在让语言更贴近真实建模和高并发

从 Java 8 到 JDK 21，Java 的变化不是简单新增语法糖，而是在补强三类能力：更清晰的数据建模、更安全的类型分支、更低成本的并发。record 让纯数据载体少写样板代码，sealed 让有限类型集合变成编译器可检查的事实，pattern matching 让类型判断和取值合在一起，virtual threads 让大量阻塞式 IO 可以回到直观的“一任务一线程”模型。

这些特性应该服务于表达力，而不是为了“新”而使用。DTO、事件、查询结果适合 record；有限状态、命令、结果类型适合 sealed；对 sealed 类型做分支处理时适合 switch pattern matching；需要处理大量 HTTP、数据库、文件等阻塞 IO 时适合虚拟线程。反过来，复杂可变领域实体不一定适合 record，CPU 密集计算不会因为虚拟线程变快，预览特性也不应默认进入长期生产代码。

现代 Java 实践的目标，是用更少样板表达更明确的约束。好的 JDK 21 代码应该让读者一眼看出数据是否不可变、类型集合是否封闭、分支是否穷尽、并发模型是否匹配业务压力。

## 一、JDK 21 重要稳定特性

重点关注：

- virtual threads
- pattern matching for switch
- record patterns
- sequenced collections
- generational ZGC
- JDK 21 LTS 工具链和生态支持

> **重点：** 学习 JDK 21 时，不应停留在 Java 8 的写法。

## 二、Virtual Threads

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (URI uri : uris) {
        executor.submit(() -> fetch(uri));
    }
}
```

适合：

- 阻塞式 IO。
- 高并发请求。
- 每任务一线程模型。

不适合：

- CPU 密集加速。
- 长时间持有 synchronized 监视器阻塞。
- 用线程数限制数据库连接等外部资源。

## 三、Pattern Matching for switch

```java
static String describe(Object value) {
    return switch (value) {
        case null -> "null";
        case String s -> "string: " + s;
        case Integer i -> "integer: " + i;
        default -> "unknown";
    };
}
```

配合 sealed：

```java
sealed interface Command permits CreateUser, DeleteUser {}
record CreateUser(String name) implements Command {}
record DeleteUser(long id) implements Command {}

static String handle(Command command) {
    return switch (command) {
        case CreateUser c -> "create " + c.name();
        case DeleteUser d -> "delete " + d.id();
    };
}
```

## 四、Record Patterns

JDK 21 中 record patterns 正式可用。

```java
record Point(int x, int y) {}

static int sum(Object obj) {
    if (obj instanceof Point(int x, int y)) {
        return x + y;
    }
    return 0;
}
```

嵌套：

```java
record Line(Point start, Point end) {}

if (obj instanceof Line(Point(int x1, int y1), Point(int x2, int y2))) {
    System.out.println(x1 + "," + y1 + " -> " + x2 + "," + y2);
}
```

## 五、Sequenced Collections

统一首尾访问：

```java
SequencedCollection<String> names = new ArrayList<>(List.of("a", "b", "c"));
System.out.println(names.getFirst());
System.out.println(names.getLast());
System.out.println(names.reversed());
```

## 六、Text Blocks

```java
String sql = """
        select id, name
        from users
        where status = ?
        """;
```

适合：

- SQL
- JSON
- HTML
- 多行模板

## 七、Records

```java
public record UserResponse(long id, String name) {}
```

适合：

- DTO
- 值对象
- 查询结果
- 事件对象

不适合：

- 复杂可变实体。
- 需要继承类。
- 需要隐藏所有字段结构的对象。

## 八、Sealed Classes

```java
sealed interface Result permits Success, Failure {}
record Success(String value) implements Result {}
record Failure(String reason) implements Result {}
```

适合：

- 有限状态。
- 有限命令类型。
- AST。
- 领域结果类型。

## 九、var

```java
var users = new ArrayList<User>();
```

建议：

- 初始化表达式清楚时使用。
- 返回类型复杂但右侧清楚时使用。
- 不要牺牲可读性。

## 十、预览特性

JDK 21 中部分特性仍是预览，例如：

- string templates
- unnamed patterns / variables
- unnamed classes and instance main methods
- structured concurrency
- scoped values

启用：

```bash
javac --enable-preview --release 21 App.java
java --enable-preview App
```

> **易错：** 预览特性 API 和语法可能变化，不应默认写入长期生产代码。

## 十一、现代 Java 风格建议

- DTO 优先 record。
- 有限层次优先 sealed。
- 类型判断优先 pattern matching。
- 多行文本优先 text blocks。
- IO 密集高并发考虑 virtual threads。
- 集合返回不可变视图或副本。
- 空值返回优先 Optional 或空集合，视场景决定。
- 业务模型保留行为，不要全是贫血数据结构。

## 十二、从 Java 8 升级到 JDK 21

检查：

- 构建工具版本。
- 依赖兼容。
- 反射非法访问。
- 移除或替换过时 JVM 参数。
- CI 镜像。
- 容器内存参数。
- 单元测试和集成测试。
- 编码默认 UTF-8 影响。

## 练习

把一个老式 if/else 命令处理器重构为：

- sealed interface 表达命令。
- record 表达命令数据。
- switch pattern matching 处理命令。
- virtual thread 执行阻塞 IO。

## 验收

- 能列出 JDK 21 关键稳定特性。
- 能使用 record patterns。
- 能说明虚拟线程适用边界。
- 能区分正式和预览特性。
- 能给出 Java 8 到 JDK 21 升级清单。
