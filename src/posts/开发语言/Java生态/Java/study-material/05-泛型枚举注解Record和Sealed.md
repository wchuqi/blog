---
title: "Java 学习资料：泛型、枚举、注解、record 和 sealed"
date: 2026-06-20
description: "完成本章后，你应该能："
tags:
  - "开发语言"
  - "Java"
category: "开发语言"
---

# Java 学习资料：泛型、枚举、注解、record 和 sealed

[返回索引](../Java学习资料.md)

## 学习目标

完成本章后，你应该能：

- 理解泛型和类型擦除。
- 正确使用通配符和 PECS 原则。
- 使用 enum 表达固定集合。
- 使用 annotation 表达元数据。
- 使用 record 和 sealed 建模现代 Java 数据结构。
- 掌握 JDK 21 模式匹配相关能力。

## 理论导读：现代类型能力是在帮编译器看懂你的业务约束

泛型、枚举、注解、record、sealed 看似是几组不同语法，实际都在做同一件事：把更多约束写进类型系统或元数据里，让编译器、框架和阅读代码的人更早知道你的意图。`List<String>` 告诉编译器这个列表只能装字符串，`enum OrderStatus` 告诉系统状态集合是有限的，`record UserDto` 表示这是一个以数据为主的不可变载体，`sealed interface PaymentResult` 则把允许出现的结果类型限定在一个可枚举范围内。

泛型的关键价值是“编译期安全”。没有泛型时，一个集合像没有标签的箱子，取东西时只能强转，错误往往运行期才爆；有泛型后，箱子外面贴上 `String`、`User`、`Order` 标签，放错东西时编译器就能拦住。但 Java 泛型采用类型擦除，运行期不会为 `List<String>` 和 `List<Integer>` 生成两套不同类，所以它既带来编译期安全，也带来 `new T()`、泛型数组等限制。

record 和 sealed 是现代 Java 建模能力的重要补充。record 适合表达“这组值本身就是对象身份”的数据载体，sealed 适合表达“这个抽象只有这些合法子类型”的封闭家族。它们和模式匹配一起使用时，代码不再只是靠 `if-else` 猜类型，而是让编译器参与检查是否覆盖了所有合法情况。

## 一、泛型基础

```java
public class Box<T> {
    private final T value;

    public Box(T value) {
        this.value = value;
    }

    public T value() {
        return value;
    }
}
```

使用：

```java
Box<String> box = new Box<>("hello");
String value = box.value();
```

> **重点：** 泛型提高编译期类型安全，减少强制类型转换。

## 二、类型擦除

Java 泛型主要在编译期生效，运行期大部分泛型信息被擦除。

```java
List<String> names = new ArrayList<>();
List<Integer> numbers = new ArrayList<>();
System.out.println(names.getClass() == numbers.getClass()); // true
```

限制：

- 不能 `new T()`。
- 不能 `new List<String>[]`。
- 不能用基本类型作为泛型参数，例如 `List<int>`。

> **难点：** 泛型不是运行期模板实例化，和 C++ 模板不是同一机制。

## 三、通配符和 PECS

Producer Extends, Consumer Super。

读取数据：

```java
static double sum(List<? extends Number> numbers) {
    double total = 0;
    for (Number number : numbers) {
        total += number.doubleValue();
    }
    return total;
}
```

写入数据：

```java
static void addIntegers(List<? super Integer> list) {
    list.add(1);
    list.add(2);
}
```

规则：

- `? extends T`：适合读，不能安全写入具体 T 子类型。
- `? super T`：适合写 T 或 T 子类，读取时通常只能当 Object。

> **易错：** `List<Integer>` 不是 `List<Number>` 的子类型。

## 四、泛型方法

```java
public static <T> T first(List<T> list) {
    if (list.isEmpty()) {
        throw new IllegalArgumentException("empty list");
    }
    return list.get(0);
}
```

带上界：

```java
public static <T extends Comparable<T>> T max(List<T> list) {
    return list.stream().max(Comparable::compareTo).orElseThrow();
}
```

## 五、枚举 enum

```java
public enum OrderStatus {
    CREATED,
    PAID,
    SHIPPED,
    CANCELLED
}
```

带字段和方法：

```java
public enum ErrorCode {
    USER_NOT_FOUND("U001", "user not found"),
    ORDER_INVALID("O001", "order invalid");

    private final String code;
    private final String message;

    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public String code() {
        return code;
    }
}
```

> **重点：** enum 是类，可以有字段、构造器和方法。

## 六、注解 annotation

定义注解：

```java
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.annotation.ElementType;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Audited {
    String value() default "";
}
```

使用：

```java
@Audited("create order")
public void createOrder() {
}
```

常见元注解：

| 注解 | 作用 |
| --- | --- |
| `@Retention` | 注解保留到哪个阶段 |
| `@Target` | 注解可用位置 |
| `@Documented` | 是否进入文档 |
| `@Inherited` | 是否可被子类继承 |
| `@Repeatable` | 是否可重复 |

## 七、record

record 适合不可变数据载体：

```java
public record UserDto(long id, String name) {
    public UserDto {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is blank");
        }
    }
}
```

自动生成：

- final 字段
- 构造器
- accessor
- equals
- hashCode
- toString

> **易错：** record 不是实体对象万能替代品。需要复杂可变状态和行为时，普通 class 更合适。

## 八、sealed class / sealed interface

限制继承层次：

```java
public sealed interface PaymentResult
        permits PaymentSuccess, PaymentFailure {
}

public record PaymentSuccess(String transactionId) implements PaymentResult {
}

public record PaymentFailure(String reason) implements PaymentResult {
}
```

配合 switch：

```java
static String message(PaymentResult result) {
    return switch (result) {
        case PaymentSuccess success -> "OK: " + success.transactionId();
        case PaymentFailure failure -> "FAIL: " + failure.reason();
    };
}
```

> **重点：** sealed 让编译器知道子类型集合，有助于穷尽性检查。

## 九、模式匹配

instanceof 模式匹配：

```java
if (obj instanceof String text) {
    System.out.println(text.toUpperCase());
}
```

switch 模式匹配：

```java
static String describe(Object obj) {
    return switch (obj) {
        case null -> "null";
        case String s -> "string: " + s;
        case Integer i -> "int: " + i;
        default -> "unknown";
    };
}
```

JDK 21 中 pattern matching for switch 已正式可用。

## 十、预览特性提醒

JDK 21 中有一些预览特性，例如 unnamed patterns / variables、string templates 等。预览特性需要显式启用：

```bash
javac --enable-preview --release 21 App.java
java --enable-preview App
```

> **易错：** 预览特性不应默认用于生产代码，除非团队明确接受升级和兼容成本。

## 练习

设计一个支付结果模型：

- 使用 sealed interface 表示支付结果。
- 使用 record 表示成功和失败。
- 使用 switch 模式匹配输出消息。
- 使用 enum 表示支付渠道。

## 验收

- 能解释类型擦除。
- 能解释 `extends` 和 `super` 通配符。
- 能使用 enum、annotation、record、sealed。
- 能说明 record 的适用边界。
- 能区分正式特性和预览特性。
