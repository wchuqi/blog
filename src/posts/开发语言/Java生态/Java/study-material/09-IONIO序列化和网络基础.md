---
title: "Java 学习资料：IO、NIO.2、序列化和网络基础"
date: 2026-06-20
description: "完成本章后，你应该能："
tags:
  - "开发语言"
  - "Java"
category: "开发语言"
---

# Java 学习资料：IO、NIO.2、序列化和网络基础

[返回索引](../Java学习资料.md)

## 学习目标

完成本章后，你应该能：

- 区分字节流和字符流。
- 使用 try-with-resources 安全释放资源。
- 使用 Path 和 Files 操作文件。
- 理解 Buffer、Channel、Selector 的基本概念。
- 使用 JDK HTTP Client。
- 知道 Java 原生序列化的风险。

## 理论导读：IO 是程序和外部世界交换数据的边界

IO 的本质是跨边界搬运数据：从磁盘到内存，从内存到网络，从字节流到字符，从对象到可传输格式。边界越多，越需要明确协议和责任。字节流处理原始 0/1 数据，字符流在字节之上加入编码解释；文件路径不只是字符串，还包含文件系统规则；网络请求不只是调用方法，而是在超时、连接、响应体、错误码之间做完整交互。

可以把 IO 想象成水管系统：`InputStream` 和 `OutputStream` 是输送字节的管道，`Reader` 和 `Writer` 是带字符编码解释器的管道，`Buffer` 是临时水箱，`Channel` 是更接近操作系统的通道，`Selector` 则像一个监控面板，可以同时观察多个通道是否可读可写。`flip()`、`clear()` 这类操作之所以难，是因为 Buffer 同时承担“写入容器”和“读取容器”两个角色，需要明确切换状态。

IO 也是资源管理和安全风险最集中的地方。文件句柄、Socket、数据库连接都不是普通对象，忘记关闭会占用系统资源；反序列化会把外部输入变成对象，若输入不可信，就等于让陌生数据参与对象创建和方法调用。因此 IO 学习必须同时关注编码、关闭、超时、大小限制和不可信输入。

## 一、字节流和字符流

字节流：

```java
try (InputStream in = Files.newInputStream(path)) {
    byte[] bytes = in.readAllBytes();
}
```

字符流：

```java
try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
    String line = reader.readLine();
}
```

| 类型 | 处理对象 |
| --- | --- |
| InputStream / OutputStream | 字节 |
| Reader / Writer | 字符 |

> **重点：** 文本处理要明确字符编码，优先 UTF-8。

## 二、try-with-resources

```java
try (var reader = Files.newBufferedReader(path);
     var writer = Files.newBufferedWriter(output)) {
    String line;
    while ((line = reader.readLine()) != null) {
        writer.write(line);
        writer.newLine();
    }
}
```

> **易错：** 忘记关闭文件、数据库连接、HTTP 响应可能导致资源泄漏。

## 三、Path 和 Files

```java
Path path = Path.of("data", "input.txt");
boolean exists = Files.exists(path);
List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
Files.writeString(Path.of("out.txt"), "hello", StandardCharsets.UTF_8);
```

遍历目录：

```java
try (Stream<Path> paths = Files.walk(Path.of("src"))) {
    paths.filter(Files::isRegularFile)
            .forEach(System.out::println);
}
```

> **重点：** `Files.walk()` 返回 Stream，需要关闭，适合 try-with-resources。

## 四、复制、移动和删除

```java
Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
Files.delete(path);
Files.deleteIfExists(path);
```

## 五、NIO Channel 和 Buffer

```java
try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {
    ByteBuffer buffer = ByteBuffer.allocate(1024);
    while (channel.read(buffer) != -1) {
        buffer.flip();
        while (buffer.hasRemaining()) {
            System.out.print((char) buffer.get());
        }
        buffer.clear();
    }
}
```

Buffer 状态：

- position
- limit
- capacity

> **难点：** `flip()` 从写模式切到读模式，`clear()` 准备下一轮写入。

## 六、Selector 概念

Selector 允许单线程监听多个 Channel 的 IO 事件，常用于高并发网络框架底层。

需要知道：

- Channel 可注册到 Selector。
- Selector 监听 read / write / connect / accept 事件。
- 应用层通常不直接写复杂 Selector，而使用 Netty 等框架。

## 七、JDK HTTP Client

```java
HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("https://example.com"))
        .GET()
        .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.statusCode());
System.out.println(response.body());
```

异步请求：

```java
client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
        .thenApply(HttpResponse::body)
        .thenAccept(System.out::println);
```

## 八、Socket 基础

```java
try (Socket socket = new Socket("example.com", 80);
     var writer = new PrintWriter(socket.getOutputStream(), true);
     var reader = new BufferedReader(new InputStreamReader(socket.getInputStream()))) {
    writer.println("GET / HTTP/1.1");
    writer.println("Host: example.com");
    writer.println();
    System.out.println(reader.readLine());
}
```

实际项目中通常使用 HTTP client 或网络框架，而不是手写 Socket。

## 九、序列化

Java 原生序列化：

```java
class User implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
}
```

> **易错：** Java 原生反序列化存在安全风险，不应反序列化不可信输入。

更常见选择：

- JSON
- Protocol Buffers
- Avro
- Kryo

## 十、文件监听

```java
WatchService watchService = FileSystems.getDefault().newWatchService();
Path dir = Path.of("config");
dir.register(watchService, StandardWatchEventKinds.ENTRY_MODIFY);
```

适合配置刷新、开发工具等场景。

## 练习

实现一个日志分析器：

- 读取 UTF-8 文本文件。
- 按行过滤包含 `ERROR` 的日志。
- 输出到新文件。
- 用 `Files.walk` 支持目录递归。

## 验收

- 能区分字节流和字符流。
- 能安全关闭资源。
- 能使用 Path / Files。
- 能解释 Buffer 的 flip / clear。
- 能说明 Java 原生序列化风险。
