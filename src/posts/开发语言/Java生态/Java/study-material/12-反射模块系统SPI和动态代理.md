---
title: "Java 学习资料：反射、模块系统、SPI 和动态代理"
date: 2026-06-20
description: "完成本章后，你应该能："
tags:
  - "开发语言"
  - "Java"
category: "开发语言"
---

# Java 学习资料：反射、模块系统、SPI 和动态代理

[返回索引](../Java学习资料.md)

## 学习目标

完成本章后，你应该能：

- 使用反射读取类、字段、方法、注解。
- 理解反射的性能和封装风险。
- 了解 JPMS 模块系统。
- 使用 SPI 做扩展发现。
- 理解 JDK 动态代理的适用边界。

## 理论导读：动态能力是在运行期重新观察和组织类型

普通 Java 代码依赖编译期已知类型：调用哪个方法、访问哪个字段，大多在编译时就能检查。反射、SPI、动态代理和模块系统讨论的是另一面：程序运行后，能否查看一个类有哪些字段和方法，能否根据配置加载一个实现，能否在调用前后插入额外逻辑，能否限制别人访问自己的内部包。它们是框架能力的基础，也是封装和安全风险的来源。

反射像给程序一面镜子：对象不仅能被使用，还能被检查结构。Spring 可以扫描注解创建 Bean，Jackson 可以读取字段完成 JSON 映射，JUnit 可以发现测试方法。但镜子越强，越容易绕过普通访问控制和编译期检查，所以 JDK 9 之后模块系统加强了边界：`exports` 决定别人能否编译访问，`opens` 决定能否深度反射。

SPI 和动态代理则更像扩展插槽和中间人。SPI 让接口提供方不直接依赖实现方，运行期通过 `ServiceLoader` 找到插件；动态代理让调用经过一个拦截层，日志、权限、事务、重试等横切逻辑可以包在真实对象外面。学习这些能力时要记住：它们适合框架和基础设施，不应该把普通业务逻辑写得过度动态。

## 一、Class 对象

获取 Class：

```java
Class<String> c1 = String.class;
Class<?> c2 = Class.forName("java.lang.String");
Class<?> c3 = "hello".getClass();
```

## 二、读取字段和方法

```java
Class<?> clazz = User.class;

for (var field : clazz.getDeclaredFields()) {
    System.out.println(field.getName());
}

for (var method : clazz.getDeclaredMethods()) {
    System.out.println(method.getName());
}
```

调用方法：

```java
Method method = User.class.getDeclaredMethod("name");
Object value = method.invoke(user);
```

> **易错：** 反射调用会绕过部分编译期检查，错误通常推迟到运行期暴露。

## 三、访问控制

```java
field.setAccessible(true);
```

JDK 9 之后模块系统加强封装，非法反射访问会受到限制。

> **重点：** 反射不是普通业务代码的首选。框架、序列化、ORM、DI 容器中更常见。

## 四、注解读取

```java
Retention retention = MyAnnotation.class.getAnnotation(Retention.class);
```

自定义注解：

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Component {
    String value() default "";
}
```

扫描：

```java
if (clazz.isAnnotationPresent(Component.class)) {
    Component component = clazz.getAnnotation(Component.class);
}
```

## 五、JDK 动态代理

接口：

```java
interface UserService {
    String findName(long id);
}
```

代理：

```java
UserService proxy = (UserService) Proxy.newProxyInstance(
        UserService.class.getClassLoader(),
        new Class<?>[]{UserService.class},
        (obj, method, args) -> {
            System.out.println("before " + method.getName());
            return "Alice";
        }
);
```

> **重点：** JDK 动态代理基于接口。代理普通类通常使用字节码生成库，例如 CGLIB / Byte Buddy。

## 六、SPI

SPI 用于服务发现。

接口：

```java
public interface MessageProvider {
    String message();
}
```

实现：

```java
public class HelloProvider implements MessageProvider {
    public String message() {
        return "hello";
    }
}
```

配置文件：

```text
META-INF/services/com.example.MessageProvider
```

内容：

```text
com.example.HelloProvider
```

加载：

```java
ServiceLoader<MessageProvider> loader = ServiceLoader.load(MessageProvider.class);
for (MessageProvider provider : loader) {
    System.out.println(provider.message());
}
```

## 七、模块系统 JPMS

`module-info.java`：

```java
module com.example.app {
    requires java.net.http;
    exports com.example.api;
}
```

关键字：

| 关键字 | 含义 |
| --- | --- |
| `requires` | 依赖模块 |
| `exports` | 导出包给其他模块编译使用 |
| `opens` | 允许反射访问 |
| `uses` | 声明使用服务 |
| `provides ... with` | 提供服务实现 |

> **难点：** `exports` 面向编译访问，`opens` 面向深度反射。

## 八、模块化运行

```bash
javac -d out --module-source-path src $(find src -name "*.java")
java --module-path out -m com.example.app/com.example.App
```

实际项目中，很多应用仍使用 classpath；理解模块系统有助于处理 JDK 内部 API 封装和反射限制。

## 九、反射和性能

反射比直接调用更慢，但通常不是业务瓶颈。高性能框架会使用：

- 缓存反射对象。
- MethodHandle。
- 字节码生成。
- AOT / build-time indexing。

## 十、常见应用场景

- Spring 依赖注入。
- Jackson 序列化。
- JPA / Hibernate ORM。
- JUnit 测试发现。
- SPI 插件。
- AOP 代理。

## 练习

实现一个简单插件系统：

- 定义接口 `Command`。
- 用 SPI 加载多个实现。
- 用注解标记命令名称。
- 用反射读取注解并执行命令。

## 验收

- 能使用反射读取方法和注解。
- 能说明反射风险。
- 能解释 JDK 动态代理为什么需要接口。
- 能使用 ServiceLoader。
- 能区分 `exports` 和 `opens`。
