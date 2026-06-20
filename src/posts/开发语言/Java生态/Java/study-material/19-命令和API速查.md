---
title: "Java 学习资料：命令和 API 速查"
date: 2026-06-20
description: "new BigDecimal(0.1) 不推荐。"
tags:
  - "开发语言"
  - "Java"
category: "开发语言"
---

# Java 学习资料：命令和 API 速查

[返回索引](../Java学习资料.md)

## 一、JDK 命令

```bash
java --version
javac --version
javac --release 21 App.java
java App
jshell
jar --create --file app.jar -C out .
jdeps app.jar
jlink --help
jpackage --help
```

## 二、诊断命令

```bash
jps
jcmd <pid> VM.version
jcmd <pid> Thread.print
jcmd <pid> GC.heap_info
jcmd <pid> JFR.start name=profile duration=60s filename=profile.jfr
jstack <pid>
jmap -histo <pid>
jstat -gc <pid> 1000
```

## 三、运行参数

```bash
java -Xms512m -Xmx512m -jar app.jar
java -Xlog:gc* -jar app.jar
java --enable-preview App
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 -jar app.jar
```

## 四、Maven

```bash
mvn test
mvn package
mvn clean verify
mvn dependency:tree
mvn -DskipTests package
```

JDK 21：

```xml
<properties>
    <maven.compiler.release>21</maven.compiler.release>
</properties>
```

## 五、Gradle

```bash
./gradlew test
./gradlew build
./gradlew dependencies
```

## 六、常用集合 API

```java
List.of("a", "b");
Set.of("x", "y");
Map.of("k", "v");
List.copyOf(list);
map.getOrDefault(key, defaultValue);
map.computeIfAbsent(key, k -> new ArrayList<>());
map.merge(key, 1, Integer::sum);
list.removeIf(Predicate.not(String::isBlank));
```

## 七、Stream API

```java
stream.filter(...)
stream.map(...)
stream.flatMap(...)
stream.sorted(...)
stream.distinct()
stream.toList()
stream.collect(Collectors.groupingBy(...))
stream.reduce(identity, accumulator)
stream.findFirst()
stream.anyMatch(...)
```

## 八、Optional API

```java
optional.map(...)
optional.flatMap(...)
optional.filter(...)
optional.orElse(defaultValue)
optional.orElseGet(...)
optional.orElseThrow()
optional.ifPresent(...)
```

## 九、java.time

```java
Instant.now()
LocalDate.now()
LocalDateTime.now()
ZonedDateTime.now(ZoneId.of("Asia/Shanghai"))
DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
Duration.between(start, end)
Period.between(startDate, endDate)
```

## 十、IO / NIO

```java
Path.of("data", "input.txt")
Files.exists(path)
Files.readString(path)
Files.readAllLines(path)
Files.writeString(path, content)
Files.walk(path)
Files.copy(source, target)
Files.move(source, target)
Files.deleteIfExists(path)
```

## 十一、并发

```java
Executors.newFixedThreadPool(4)
Executors.newVirtualThreadPerTaskExecutor()
Thread.startVirtualThread(task)
CompletableFuture.supplyAsync(...)
CompletableFuture.allOf(...)
new ReentrantLock()
new AtomicInteger()
new ConcurrentHashMap<>()
```

## 十二、JDK 21 现代语法

```java
record UserDto(long id, String name) {}

sealed interface Result permits Success, Failure {}
record Success(String value) implements Result {}
record Failure(String reason) implements Result {}

String text = switch (obj) {
    case null -> "null";
    case String s -> s;
    default -> "unknown";
};

if (obj instanceof Point(int x, int y)) {
    System.out.println(x + y);
}
```

## 十三、高风险点速查

- `new BigDecimal(0.1)` 不推荐。
- `Optional.get()` 前不检查容易出错。
- 并行流不一定更快。
- `HashMap` 并发写不安全。
- 原生反序列化不可信输入危险。
- 日志不能输出敏感信息。
- Spring 事务自调用可能失效。
- 预览特性需要 `--enable-preview`。

