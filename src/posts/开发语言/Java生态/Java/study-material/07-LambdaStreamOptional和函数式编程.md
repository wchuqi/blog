---
title: "Java 学习资料：Lambda、Stream、Optional 和函数式编程"
date: 2026-06-20
description: "完成本章后，你应该能："
tags:
  - "开发语言"
  - "Java"
category: "开发语言"
---

# Java 学习资料：Lambda、Stream、Optional 和函数式编程

[返回索引](../Java学习资料.md)

## 学习目标

完成本章后，你应该能：

- 理解函数式接口、Lambda 和方法引用。
- 使用 Stream 完成集合转换、过滤、分组和聚合。
- 正确使用 Optional 表达可能缺失的返回值。
- 避免 Stream 和 Optional 的常见滥用。

## 理论导读：函数式写法是在描述“数据如何流动”

Lambda、Stream、Optional 的重点不是让代码看起来更短，而是把“做什么”从一堆临时变量和循环细节里提出来。传统 `for` 循环像手工搬运：拿一个元素、判断、转换、放进另一个容器；Stream 管道像流水线：数据从源头进入，经过过滤、映射、分组、聚合，最后在终端操作处产出结果。每个步骤都应该清楚表达数据流的变化。

函数式接口是这套机制的插槽。`Predicate` 表示判断规则，`Function` 表示转换规则，`Consumer` 表示消费动作，`Supplier` 表示供应数据。Lambda 只是把这些规则以内联形式传进去。理解这一点后，`filter(name -> name.length() > 3)` 就不是“奇怪的新语法”，而是在给 Stream 传入一个判断策略。

Optional 则是在类型层面提醒“这里可能没有值”。它像一个只能打开后检查的盒子，逼迫调用方考虑缺失情况。它不应该被滥用成字段或参数包装器，也不应该用 `isPresent() + get()` 退回空指针式写法。好的函数式代码是清晰的数据流，不是把所有逻辑都塞进一条很长的链。

## 一、函数式接口

函数式接口只有一个抽象方法。

```java
@FunctionalInterface
interface Calculator {
    int calculate(int a, int b);
}
```

Lambda：

```java
Calculator add = (a, b) -> a + b;
System.out.println(add.calculate(1, 2));
```

常用内置函数式接口：

| 接口 | 作用 |
| --- | --- |
| `Predicate<T>` | 判断 |
| `Function<T, R>` | 转换 |
| `Consumer<T>` | 消费 |
| `Supplier<T>` | 提供 |
| `UnaryOperator<T>` | 同类型转换 |
| `BinaryOperator<T>` | 两个同类型输入 |

## 二、方法引用

```java
names.stream()
        .map(String::toUpperCase)
        .forEach(System.out::println);
```

常见形式：

```java
ClassName::staticMethod
object::instanceMethod
ClassName::instanceMethod
ClassName::new
```

## 三、Stream 基础

```java
List<String> result = names.stream()
        .filter(name -> name.length() > 3)
        .map(String::toUpperCase)
        .toList();
```

Stream 操作分为：

- 中间操作：`filter`、`map`、`flatMap`、`sorted`、`distinct`
- 终端操作：`toList`、`collect`、`forEach`、`reduce`、`count`

> **重点：** Stream 是惰性的，没有终端操作时不会执行。

## 四、map 和 flatMap

`map` 一对一转换：

```java
List<Integer> lengths = names.stream()
        .map(String::length)
        .toList();
```

`flatMap` 展平：

```java
List<String> words = lines.stream()
        .flatMap(line -> Arrays.stream(line.split("\\s+")))
        .toList();
```

## 五、collect 和 groupingBy

分组：

```java
Map<Integer, List<String>> byLength = names.stream()
        .collect(Collectors.groupingBy(String::length));
```

计数：

```java
Map<String, Long> counts = words.stream()
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
```

求和：

```java
int total = orders.stream()
        .mapToInt(Order::amount)
        .sum();
```

## 六、reduce

```java
int sum = numbers.stream()
        .reduce(0, Integer::sum);
```

> **易错：** reduce 的 identity 必须是正确的单位元，否则并行流结果可能错误。

## 七、Optional

适合用于返回值：

```java
Optional<User> findUser(long id) {
    return repository.findById(id);
}
```

使用：

```java
String name = findUser(1)
        .map(User::name)
        .orElse("anonymous");
```

避免：

```java
if (optional.isPresent()) {
    value = optional.get();
}
```

更好：

```java
optional.ifPresent(this::handle);
```

> **易错：** Optional 不建议作为字段、方法参数或集合元素的常规类型。

## 八、并行流

```java
list.parallelStream()
        .map(this::compute)
        .toList();
```

适合：

- CPU 密集型。
- 数据量足够大。
- 无共享可变状态。
- 操作可并行。

> **易错：** 并行流不等于一定更快。IO 密集任务更适合异步或虚拟线程。

## 九、副作用

坏例子：

```java
List<String> result = new ArrayList<>();
names.stream()
        .filter(name -> name.length() > 3)
        .forEach(result::add);
```

更好：

```java
List<String> result = names.stream()
        .filter(name -> name.length() > 3)
        .toList();
```

> **重点：** Stream 管道应尽量避免共享可变状态。

## 十、调试 Stream

```java
list.stream()
        .peek(x -> System.out.println("before: " + x))
        .filter(x -> x > 0)
        .peek(x -> System.out.println("after: " + x))
        .toList();
```

`peek` 主要用于调试，不建议在业务逻辑中依赖副作用。

## 练习

给定订单列表：

```java
record Order(String userId, String status, int amount) {}
```

完成：

- 过滤已支付订单。
- 按用户分组。
- 统计每个用户支付总金额。
- 找出金额最高的用户。

## 验收

- 能解释函数式接口。
- 能区分 `map` 和 `flatMap`。
- 能使用 `groupingBy` 和 `counting`。
- 能正确使用 Optional。
- 能说明并行流风险。
