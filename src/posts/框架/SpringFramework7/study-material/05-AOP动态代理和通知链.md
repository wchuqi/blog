---
title: "Spring Framework 7 学习资料：AOP 动态代理和通知链"
date: 2026-06-20
description: "AOP 把日志、监控、事务、权限、幂等、缓存这类横切逻辑从业务代码中分离出来。它不是替代 OOP，而是在对象方法调用边界外增加统一拦截层。"
tags:
  - "框架"
  - "SpringFramework7"
category: "框架"
---

# Spring Framework 7 学习资料：AOP 动态代理和通知链

[返回索引](../SpringFramework7学习资料.md)

## 学习目标

- 理解 AOP 解决的横切问题。
- 掌握 Pointcut、Advice、Advisor、Join Point。
- 会解释 JDK 动态代理、CGLIB、通知顺序和代理失效。

## 理论导读

AOP 把日志、监控、事务、权限、幂等、缓存这类横切逻辑从业务代码中分离出来。它不是替代 OOP，而是在对象方法调用边界外增加统一拦截层。

Spring AOP 主要基于运行时代理。容器里注入给别人的往往不是目标对象，而是代理对象。调用进入代理后，代理按通知链顺序执行增强逻辑，再决定是否调用目标方法。

## 核心概念

| 概念 | 含义 |
| --- | --- |
| Join Point | 可被拦截的连接点，Spring AOP 中主要是方法调用 |
| Pointcut | 匹配哪些方法 |
| Advice | 在匹配点执行什么增强逻辑 |
| Advisor | Pointcut + Advice 的组合 |
| Aspect | 切面，通常包含多个通知 |

## 代理选择

| 情况 | 常见代理方式 |
| --- | --- |
| 目标类实现接口，且使用接口代理 | JDK 动态代理 |
| 目标类没有接口，或配置类代理 | CGLIB 子类代理 |

> **易错：** final 类、final 方法不适合 CGLIB 增强，因为子类无法覆盖 final 方法。

## 例子：方法耗时切面

```java
@Aspect
@Component
class TimingAspect {
    @Around("@annotation(LogTiming)")
    public Object logTiming(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try {
            return pjp.proceed();
        } finally {
            long costMs = (System.nanoTime() - start) / 1_000_000;
            System.out.println(pjp.getSignature() + " cost " + costMs + "ms");
        }
    }
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface LogTiming {
}
```

## 通知类型

| 通知 | 执行时机 |
| --- | --- |
| `@Before` | 方法执行前 |
| `@AfterReturning` | 正常返回后 |
| `@AfterThrowing` | 抛出异常后 |
| `@After` | finally 语义 |
| `@Around` | 包裹整个调用，可决定是否继续执行 |

## 通知顺序

多个切面同时匹配同一个方法时，顺序由 `@Order` 或 `Ordered` 控制。越外层的 around 越早进入，越晚退出。

```text
Aspect A before
  Aspect B before
    target method
  Aspect B after
Aspect A after
```

## 代理失效场景

> **易错：** 同类内部调用。
>
> `publicMethod()` 内部调用 `this.txMethod()`，不会经过代理，`txMethod()` 上的事务或切面不生效。

> **易错：** private 方法加切面注解。
>
> Spring AOP 基于代理拦截外部方法调用，private 方法不是合适的拦截边界。

> **易错：** 手动 `new` 对象。
>
> 不经过容器创建的对象不会被 Spring AOP 代理。

## 练习

1. 写 `@LogTiming` 注解和切面，记录 Service 方法耗时。
2. 打印 Bean class，判断是 JDK 代理还是 CGLIB。
3. 构造同类内部调用，验证切面不生效。

## 验收

- 能解释 Spring AOP 为什么是代理模型。
- 能说明 JDK 代理和 CGLIB 的选择差异。
- 能定位常见切面不生效问题。

## 难点

AOP 的难点是“你调用的对象到底是谁”。只要记住外部调用必须进入代理，很多事务和切面问题就能快速定位。
