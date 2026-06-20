---
title: "Spring Framework 7 学习资料：IoC 容器和 Bean 生命周期"
date: 2026-06-20
description: "IoC 的本质是控制权转移。传统代码中，类自己 new 依赖对象；Spring 中，类只声明需要什么，容器负责创建对象、解析依赖、注入属性、执行初始化、管理销毁。"
tags:
  - "框架"
  - "SpringFramework7"
category: "框架"
---

# Spring Framework 7 学习资料：IoC 容器和 Bean 生命周期

[返回索引](../SpringFramework7学习资料.md)

## 学习目标

- 理解 IoC 容器内部处理对象的步骤。
- 掌握 BeanDefinition、BeanFactory、ApplicationContext、BeanPostProcessor。
- 能解释单例 Bean 的生命周期和常见扩展点。

## 理论导读

IoC 的本质是控制权转移。传统代码中，类自己 `new` 依赖对象；Spring 中，类只声明需要什么，容器负责创建对象、解析依赖、注入属性、执行初始化、管理销毁。

Spring 不会一开始就直接创建所有对象。它先读取配置、扫描注解、解析 `@Bean` 方法，把这些信息变成 `BeanDefinition`。`BeanDefinition` 像对象的施工图，记录 class、作用域、构造参数、属性、初始化方法、销毁方法、懒加载等信息。

## 生命周期主线

单例 Bean 的典型流程：

```text
读取配置/扫描注解
  -> 注册 BeanDefinition
  -> 实例化对象
  -> 依赖注入/属性填充
  -> Aware 回调
  -> BeanPostProcessor 初始化前
  -> 初始化方法
  -> BeanPostProcessor 初始化后
  -> 可被业务使用
  -> 容器关闭时执行销毁回调
```

## 核心概念

| 概念 | 作用 |
| --- | --- |
| `BeanDefinition` | Bean 的元数据，不是 Bean 实例 |
| `BeanFactory` | 最基础的 Bean 工厂 |
| `ApplicationContext` | 增强版容器，支持事件、国际化、资源、环境等 |
| `BeanPostProcessor` | Bean 初始化前后扩展点 |
| `FactoryBean` | 自定义复杂对象创建逻辑 |
| `ApplicationContextAware` | 让 Bean 感知容器对象 |

## 例子：生命周期日志

```java
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class LifecycleConfig {
    @Bean
    DemoBean demoBean() {
        return new DemoBean();
    }

    @Bean
    BeanPostProcessor logPostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
                System.out.println("before init: " + beanName);
                return bean;
            }

            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
                System.out.println("after init: " + beanName);
                return bean;
            }
        };
    }
}

class DemoBean {
    DemoBean() {
        System.out.println("construct");
    }

    @PostConstruct
    void init() {
        System.out.println("post construct");
    }

    @PreDestroy
    void destroy() {
        System.out.println("pre destroy");
    }
}
```

## 作用域

| 作用域 | 含义 | 注意点 |
| --- | --- | --- |
| singleton | 每个容器一个实例 | 默认作用域 |
| prototype | 每次获取创建新实例 | 容器不完整管理销毁 |
| request | 每个 HTTP 请求一个实例 | Web 环境使用 |
| session | 每个 HTTP Session 一个实例 | Web 环境使用 |
| application | ServletContext 级别实例 | Web 环境使用 |

> **易错：** prototype Bean 注入到 singleton Bean 时，不会每次方法调用都创建新对象；注入动作只发生在 singleton 创建期间。需要 `ObjectProvider`、方法注入或作用域代理。

## 循环依赖

Spring 对 setter/字段注入的部分单例循环依赖有历史支持，但构造器循环依赖无法自然解决。现代实践应避免依赖环，用职责拆分、事件、领域服务重构。

> **难点：** 循环依赖涉及“提前暴露单例工厂”和代理对象选择。一旦 AOP 参与，早期引用和最终代理不一致会让问题更复杂。

## 练习

1. 写一个 `BeanPostProcessor`，打印所有 Service Bean 的初始化前后日志。
2. 创建 singleton Bean 依赖 prototype Bean，观察 prototype 创建次数。
3. 构造一个 A -> B -> A 的构造器循环依赖，记录错误信息。

## 验收

- 能画出 Bean 生命周期主线。
- 能解释 BeanDefinition 和 Bean 实例的区别。
- 能说明 BeanPostProcessor 为什么是框架扩展核心。

## 重点

容器不是简单 Map。它保存的是 Bean 定义、单例缓存、后置处理器、依赖关系、作用域、环境和事件机制。
