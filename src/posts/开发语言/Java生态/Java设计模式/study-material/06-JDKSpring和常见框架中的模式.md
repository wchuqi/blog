---
title: "Java设计模式学习资料：JDK、Spring 和常见框架中的模式"
date: 2026-06-20
description: "Servlet Filter 是责任链的典型例子："
tags:
  - "开发语言"
  - "Java设计模式"
category: "开发语言"
---

# Java设计模式学习资料：JDK、Spring 和常见框架中的模式

[返回索引](../Java设计模式学习资料.md)

## 学习目标

- 能在真实源码和框架机制中识别设计模式。
- 理解模式组合，而不是只记“某框架用了某模式”。
- 掌握常见框架扩展点背后的创建、代理、模板和责任链机制。

## JDK 中的模式

| 位置 | 模式 | 说明 |
| --- | --- | --- |
| `Runtime#getRuntime()` | 单例 | 全局运行时对象 |
| `Calendar#getInstance()` | 工厂方法 | 根据时区、Locale 创建实现 |
| `Collection#iterator()` | 迭代器 | 隐藏集合内部结构 |
| `InputStream` 包装链 | 装饰器 | `BufferedInputStream` 增强读取 |
| `Proxy` | 代理 | 为接口创建运行时代理对象 |
| `Comparator` | 策略 | 排序算法接收比较策略 |
| `Executor` / `Runnable` | 命令 | 把任务封装为对象提交执行 |
| `String` 常量池 | 享元 | 共享不可变字符串 |

## Spring 中的模式

| 机制 | 模式 | 关键理解 |
| --- | --- | --- |
| `BeanFactory` | 工厂 | 容器统一创建和管理对象 |
| Bean 单例作用域 | 单例 | 容器级单例，不等于 JVM 全局单例 |
| AOP | 代理 | JDK 代理或 CGLIB 代理增强方法调用 |
| `JdbcTemplate` | 模板方法/回调 | 固定资源管理流程，开放 SQL 和映射 |
| `ApplicationEventPublisher` | 观察者 | 发布事件给监听器 |
| `HandlerMapping` | 策略/责任链 | 按规则匹配处理器 |
| `HandlerInterceptor` | 责任链 | 请求前后按顺序执行拦截器 |
| `FactoryBean` | 工厂 | Bean 本身用于创建另一个对象 |

## Servlet 和 Web 框架

Servlet Filter 是责任链的典型例子：

```java
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
    // 前置处理
    chain.doFilter(request, response);
    // 后置处理
}
```

关键点：

- Filter 顺序影响结果。
- 可以选择不调用 `chain.doFilter` 来短路请求。
- 异常处理会影响后续 Filter 和响应输出。

## MyBatis 中的模式

| 位置 | 模式 | 说明 |
| --- | --- | --- |
| Mapper 接口 | 代理 | 运行时生成 Mapper 代理 |
| `SqlSessionFactory` | 工厂 | 创建 `SqlSession` |
| Executor | 策略/模板 | 不同执行器处理 SQL 执行 |
| Plugin | 责任链/代理 | 拦截执行过程 |

## 框架源码阅读方法

阅读源码时不要只找类名，要问：

1. 谁定义抽象接口。
2. 谁负责选择具体实现。
3. 对象什么时候创建，生命周期由谁管理。
4. 调用是否经过代理或拦截链。
5. 扩展点按什么顺序执行。
6. 异常、短路、缓存、线程安全如何处理。

## 重点

- Spring 的单例是容器级单例，多个容器可以有多个实例。
- AOP 是代理模式，但还涉及 Bean 生命周期、方法匹配、增强顺序。
- 模板类固定资源打开、关闭、异常处理，把业务差异交给回调。

## 难点

- 框架中的模式往往叠加出现，例如 Spring MVC 请求处理同时有策略、适配器、责任链、模板。
- 代理对象和目标对象不是同一个对象，内部方法自调用可能绕过代理。
- 扩展点顺序会影响行为，尤其是拦截器、过滤器、切面和插件。

## 易错

> **易错：** 只会说“Spring 用了工厂模式”，说不清 `BeanFactory` 和普通静态工厂的区别。
>
> 正确做法：说明 Bean 定义、实例化、依赖注入、初始化、代理创建和作用域管理。

> **易错：** 认为加了 AOP 注解后所有方法调用都会被增强。
>
> 正确做法：理解代理只拦截经过代理对象的调用，内部自调用通常不会触发代理增强。

## 练习

- 找出 JDK `Collections.sort` 或 `List.sort` 中的策略模式。
- 找出 Java IO 流中的装饰器链。
- 阅读一个 Spring `JdbcTemplate` 查询示例，标记模板固定部分和回调变化部分。
- 画出 Servlet FilterChain 的执行顺序。

## 验收

- 能把框架机制映射到模式参与者。
- 能说明源码中的模式组合。
- 能讲清楚代理、模板、责任链的执行顺序。
