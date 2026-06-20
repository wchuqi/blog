---
title: "Java设计模式学习资料：Java 语言特性与模式实现"
date: 2026-06-20
description: "设计模式来自面向对象经验，但 Java 语言一直在演进。Lambda 可以简化策略和命令，枚举可以实现单例，record 可以简化不可变值对象，动态代理可以实现代理模式，注解和反射可以让框架完成对象选择与绑定。"
tags:
  - "开发语言"
  - "Java设计模式"
category: "开发语言"
---

# Java设计模式学习资料：Java 语言特性与模式实现

[返回索引](../Java设计模式学习资料.md)

## 学习目标

- 理解 Java 特性如何影响设计模式实现。
- 能用 Lambda、泛型、枚举、record、动态代理简化模式。
- 知道哪些模式在现代 Java 中会以更轻量的形式出现。

## 理论导读

设计模式来自面向对象经验，但 Java 语言一直在演进。Lambda 可以简化策略和命令，枚举可以实现单例，record 可以简化不可变值对象，动态代理可以实现代理模式，注解和反射可以让框架完成对象选择与绑定。

## Lambda 简化策略和命令

如果策略只有一个方法，可以用函数式接口表达。

```java
@FunctionalInterface
interface PriceRule {
    BigDecimal apply(BigDecimal price);
}

Map<String, PriceRule> rules = Map.of(
        "VIP", price -> price.multiply(new BigDecimal("0.8")),
        "NEW", price -> price.subtract(new BigDecimal("20"))
);
```

注意：Lambda 适合逻辑短小的策略。复杂策略仍应命名成类，方便测试和定位。

## 枚举实现单例和有限状态

```java
enum OrderStatus {
    PENDING {
        OrderStatus pay() { return PAID; }
    },
    PAID {
        OrderStatus pay() { throw new IllegalStateException("already paid"); }
    };

    abstract OrderStatus pay();
}
```

枚举适合有限、稳定的状态。如果状态迁移规则复杂，建议独立状态类或状态机。

## 泛型提升可复用性

```java
interface Handler<T> {
    boolean supports(T request);
    void handle(T request);
}

class HandlerChain<T> {
    private final List<Handler<T>> handlers;

    HandlerChain(List<Handler<T>> handlers) {
        this.handlers = handlers;
    }

    void execute(T request) {
        handlers.stream()
                .filter(handler -> handler.supports(request))
                .forEach(handler -> handler.handle(request));
    }
}
```

泛型让责任链或策略注册表可以复用，但不要为了复用牺牲业务语义。

## 动态代理

JDK 动态代理要求目标对象实现接口，常用于 AOP、事务、日志和远程调用。

```java
interface UserService {
    String findName(long id);
}

class LoggingProxy {
    @SuppressWarnings("unchecked")
    static <T> T create(T target, Class<T> type) {
        return (T) Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[]{type},
                (proxy, method, args) -> {
                    System.out.println("before " + method.getName());
                    Object result = method.invoke(target, args);
                    System.out.println("after " + method.getName());
                    return result;
                });
    }
}
```

## 注解和反射

注解常用于声明扩展点，反射负责扫描和实例化，容器负责生命周期。

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@interface PayType {
    String value();
}

@PayType("ALI")
class AliPayStrategy implements PayStrategy {
    public void pay(Order order) {}
}
```

在 Spring 中，这类选择通常由 Bean 扫描和依赖注入完成，不需要业务代码手写反射扫描。

## 重点

- 现代 Java 会让模式更轻量，但不会消除模式背后的设计问题。
- Lambda 简化代码，命名类提升可读性和可测试性。
- 动态代理是理解 Spring AOP 的入口。

## 难点

- 反射和动态代理会降低直接可读性，需要靠日志、断点和框架生命周期知识排查。
- 泛型抽象过度会让业务类型信息丢失。
- record 是值对象，不适合承载复杂可变行为。

## 易错

> **易错：** 用 Lambda 写很长的业务策略。
>
> 正确做法：超过几行、有分支、有依赖或需要测试时，抽成命名类。

> **易错：** 认为动态代理能代理所有类。
>
> 正确做法：JDK 动态代理依赖接口；无接口类通常需要 CGLIB/ByteBuddy 这类字节码代理。

## 练习

- 用 Lambda 实现两个简单折扣策略。
- 用类实现一个复杂折扣策略，并写单元测试。
- 用 JDK 动态代理给接口增加日志。
- 比较三种实现的可读性和可测试性。

## 验收

- 能解释 Lambda 策略和类策略的取舍。
- 能写出 JDK 动态代理的最小示例。
- 能说明枚举单例为什么线程安全。
