---
title: "Spring Framework 7 学习资料：Bean 创建、三级缓存和循环依赖深度解析"
date: 2026-06-20
description: "简化后的创建流程："
tags:
  - "框架"
  - "SpringFramework7"
  - "深度解析"
category: "框架"
---

# Spring Framework 7 学习资料：Bean 创建、三级缓存和循环依赖深度解析

[返回索引](../SpringFramework7学习资料.md)

## 学习目标

- 理解 `getBean()` 到对象可用的内部流程。
- 掌握 singleton 三级缓存的作用和限制。
- 能解释为什么构造器循环依赖解决不了，为什么 AOP 会让循环依赖复杂化。

## Bean 创建主线

简化后的创建流程：

```text
getBean(beanName)
  -> 转换别名，处理 FactoryBean 前缀 &
  -> 查 singletonObjects 一级缓存
  -> 如果正在创建，尝试从 earlySingletonObjects / singletonFactories 获取早期引用
  -> 获取合并后的 BeanDefinition
  -> 确保 dependsOn 依赖先创建
  -> createBean()
      -> resolveBeforeInstantiation() 给代理机会直接返回对象
      -> doCreateBean()
          -> createBeanInstance() 实例化
          -> addSingletonFactory() 提前暴露 ObjectFactory
          -> populateBean() 依赖注入
          -> initializeBean() Aware、初始化、BeanPostProcessor
          -> registerDisposableBeanIfNecessary()
  -> addSingleton() 放入一级缓存
```

> **重点：** “实例化”和“初始化”不是一回事。实例化只是对象构造出来；初始化包含属性填充、回调、后置处理器和代理包装。

## 三级缓存

| 缓存 | 含义 | 作用 |
| --- | --- | --- |
| `singletonObjects` | 一级缓存，完整单例对象 | 正常获取 Bean |
| `earlySingletonObjects` | 二级缓存，早期单例引用 | 解决创建中的依赖访问 |
| `singletonFactories` | 三级缓存，早期对象工厂 | 给 AOP 等机会返回早期代理 |

三级缓存的关键不是“缓存三份对象”，而是把“原始对象是否要变成代理对象”的决策延迟到早期引用被需要的时候。

## setter 循环依赖示例

```text
A 创建
  -> A 实例化完成，放入 singletonFactories
  -> A 填充属性，需要 B
      -> B 创建
          -> B 实例化完成，放入 singletonFactories
          -> B 填充属性，需要 A
              -> A 正在创建，从 singletonFactories 获取 A 的早期引用
          -> B 初始化完成
  -> A 注入 B
  -> A 初始化完成
```

这个流程要求 A 至少已经完成实例化，所以构造器循环依赖不行。

## 构造器循环依赖为什么失败

```java
class A {
    A(B b) {}
}

class B {
    B(A a) {}
}
```

创建 A 必须先有 B，创建 B 又必须先有 A。此时 A 还没有实例化完成，无法提前暴露引用。

> **易错：** 以为三级缓存能解决所有循环依赖。它只能处理部分单例属性注入环，不能解决构造器环和很多复杂代理环。

## AOP 参与后的问题

如果 A 最终会被代理，那么 B 注入 A 时应该拿原始 A，还是 A 的代理？如果 B 拿到原始对象，后续调用就绕过切面；如果拿到代理，又要保证最终容器中的 A 和早期暴露的 A 是一致的。

Spring 通过 `SmartInstantiationAwareBeanPostProcessor#getEarlyBeanReference` 给 AOP 创建早期代理的机会。

> **难点：** 循环依赖和 AOP 混合时，真正的问题是“早期引用和最终对象是否一致”。

## 生命周期扩展点细分

```text
实例化前：InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation
实例化后：postProcessAfterInstantiation
属性填充前：postProcessProperties
Aware 回调：BeanNameAware、BeanFactoryAware、ApplicationContextAware
初始化前：BeanPostProcessor#postProcessBeforeInitialization
初始化：@PostConstruct、InitializingBean、init-method
初始化后：BeanPostProcessor#postProcessAfterInitialization
销毁：@PreDestroy、DisposableBean、destroy-method
```

## FactoryBean 边界

`FactoryBean` 容易混淆：

- `getBean("x")` 得到 `FactoryBean#getObject()` 的产品。
- `getBean("&x")` 得到 `FactoryBean` 本身。
- 产品对象是否单例由 `FactoryBean#isSingleton()` 决定。

## 常见生产风险

| 写法 | 风险 |
| --- | --- |
| 大量字段注入 | 依赖关系隐藏，循环依赖不容易发现 |
| 为解决循环依赖改成 setter 注入 | 掩盖设计问题 |
| Bean 初始化中访问数据库或远程服务 | 启动时间变长，失败影响整个上下文 |
| `@PostConstruct` 做复杂业务 | 初始化顺序和事务边界难控 |

## 练习

1. 构造 setter 循环依赖，打印两个 Bean 的创建日志。
2. 构造构造器循环依赖，记录异常。
3. 给其中一个 Bean 加切面，观察注入对象 class。
4. 实现一个 `FactoryBean`，生产动态代理对象。

## 验收

- 能解释三级缓存每层的职责。
- 能区分实例化、属性填充、初始化、代理包装。
- 能说明循环依赖在现代项目中为什么应尽量消除。
