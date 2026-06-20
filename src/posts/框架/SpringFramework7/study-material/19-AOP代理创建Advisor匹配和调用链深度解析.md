---
title: "Spring Framework 7 学习资料：AOP 代理创建、Advisor 匹配和调用链深度解析"
date: 2026-06-20
description: "Spring AOP 通常通过 BeanPostProcessor 参与 Bean 初始化后阶段。典型角色是自动代理创建器，它在 Bean 初始化后判断当前 Bean 是否需要被代理。"
tags:
  - "框架"
  - "SpringFramework7"
  - "深度解析"
category: "框架"
---

# Spring Framework 7 学习资料：AOP 代理创建、Advisor 匹配和调用链深度解析

[返回索引](../SpringFramework7学习资料.md)

## 学习目标

- 理解 AOP 代理在 Bean 生命周期中的创建时机。
- 掌握 Advisor 匹配、代理选择、拦截器链执行。
- 能解释事务、缓存、自定义切面顺序冲突。

## AOP 创建时机

Spring AOP 通常通过 `BeanPostProcessor` 参与 Bean 初始化后阶段。典型角色是自动代理创建器，它在 Bean 初始化后判断当前 Bean 是否需要被代理。

```text
Bean 实例化
  -> 属性填充
  -> 初始化前回调
  -> 初始化方法
  -> 初始化后 BeanPostProcessor
      -> 查找适用于该 Bean 的 Advisor
      -> 如果存在，创建代理对象
  -> 容器暴露代理对象
```

> **重点：** 容器最终暴露的可能不是目标对象，而是代理对象。

## Advisor 匹配

Advisor 可以理解为“切点 + 通知”。匹配分两层：

```text
类级别粗筛：这个 Advisor 是否可能适用于当前 class
  -> 方法级别细筛：这个 Advisor 是否匹配当前 method
```

这样做是为了避免每次调用都做昂贵的全量匹配。

## 代理选择

```text
目标对象是否需要代理？
  否 -> 返回原对象
  是 -> 选择代理方式
      有接口且配置允许接口代理 -> JDK 动态代理
      否则 -> CGLIB 子类代理
```

影响因素包括目标类是否有接口、是否强制 class 代理、类和方法是否 final、是否需要暴露代理等。

## 调用链模型

一次代理方法调用可以理解为：

```text
client 调用 proxy.method()
  -> 代理对象获得 method 和 target
  -> 查找该 method 对应的 interceptor chain
  -> interceptor1.invoke()
      -> interceptor2.invoke()
          -> interceptor3.invoke()
              -> target.method()
          <- interceptor3 返回
      <- interceptor2 返回
  <- interceptor1 返回
```

`@Around` 本质上就像可以控制 `proceed()` 是否继续调用下一环。

## 多切面顺序

```java
@Order(1)
@Aspect
class SecurityAspect {
}

@Order(2)
@Aspect
class TimingAspect {
}
```

顺序越小通常越靠外层。外层先进入，最后退出。

```text
Security before
  Timing before
    target
  Timing after
Security after
```

> **难点：** 事务、缓存、重试、审计同时存在时，顺序决定语义。例如重试应该包住事务，还是事务包住重试，结果完全不同。

## 自调用失效深入解释

```java
@Service
class OrderService {
    public void outer() {
        inner(); // 等价于 this.inner()
    }

    @Transactional
    public void inner() {
    }
}
```

外部调用 `proxy.outer()` 可以进入代理，但 `outer()` 内部调用的是目标对象自己的 `this.inner()`。这次调用没有回到代理，所以 `inner()` 上的拦截器链不执行。

## 代理暴露的代价

可以通过暴露当前代理再调用：

```java
((OrderService) AopContext.currentProxy()).inner();
```

但这会让业务代码依赖 AOP 上下文，不推荐作为常规设计。更好的做法是调整服务边界。

## 常见冲突

| 现象 | 原因 |
| --- | --- |
| 切面不执行 | 方法未被代理调用、切点不匹配、Bean 未被容器管理 |
| 事务和日志顺序不符合预期 | `@Order` 未设置或理解错误 |
| final 方法无增强 | CGLIB 无法覆盖 final |
| 注解在接口上不生效 | 代理和注解解析策略不匹配 |

## 练习

1. 写两个 `@Around` 切面，设置不同 `@Order`，打印进入退出顺序。
2. 用接口和无接口类分别观察代理类型。
3. 构造事务 + 重试切面，比较不同顺序的提交次数。

## 验收

- 能解释代理创建时机。
- 能说明 Advisor 如何匹配方法。
- 能画出拦截器链调用流程。
