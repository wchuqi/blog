---
title: "Spring Framework 7 学习资料：容器启动、BeanDefinition 和 refresh 深度解析"
date: 2026-06-20
description: "Spring 容器启动不是“扫描注解然后 new 对象”。更准确的模型是："
tags:
  - "框架"
  - "SpringFramework7"
  - "深度解析"
category: "框架"
---

# Spring Framework 7 学习资料：容器启动、BeanDefinition 和 refresh 深度解析

[返回索引](../SpringFramework7学习资料.md)

## 学习目标

- 能把 `ApplicationContext` 启动过程讲到核心方法级别。
- 理解 BeanDefinition 从哪里来、什么时候被修改、什么时候变成 Bean。
- 掌握 `refresh()` 主线、后置处理器时机和常见启动失败定位点。

## 理论导读

Spring 容器启动不是“扫描注解然后 new 对象”。更准确的模型是：

```text
配置来源
  -> 解析成 BeanDefinition
  -> BeanFactory 准备完成
  -> 修改 BeanDefinition
  -> 注册 BeanPostProcessor
  -> 实例化非懒加载单例
  -> 发布上下文完成事件
```

`BeanDefinition` 是启动阶段最重要的数据结构。它让 Spring 能在对象真正创建前完成大量工作：解析条件、处理配置类、注册扫描结果、决定作用域、合并父子定义、提前发现依赖关系。

## refresh 主线

`AbstractApplicationContext#refresh()` 可以按下面主线理解：

```text
prepareRefresh()
  准备环境、启动时间、激活状态

obtainFreshBeanFactory()
  创建或刷新 BeanFactory，加载 BeanDefinition

prepareBeanFactory(beanFactory)
  注册类加载器、表达式解析器、环境、Aware 处理器等基础设施

postProcessBeanFactory(beanFactory)
  子类扩展点，Web 上下文会补充 Web 作用域等

invokeBeanFactoryPostProcessors(beanFactory)
  执行 BeanFactoryPostProcessor 和 BeanDefinitionRegistryPostProcessor

registerBeanPostProcessors(beanFactory)
  注册 BeanPostProcessor，但此时多数普通 Bean 还没创建

initMessageSource()
initApplicationEventMulticaster()
onRefresh()
registerListeners()

finishBeanFactoryInitialization(beanFactory)
  实例化非懒加载单例 Bean

finishRefresh()
  发布 ContextRefreshedEvent，启动生命周期组件
```

> **重点：** `invokeBeanFactoryPostProcessors` 发生在普通 Bean 创建前，适合改 BeanDefinition；`BeanPostProcessor` 处理的是 Bean 实例。

## BeanDefinition 的来源

| 来源 | 典型入口 | 说明 |
| --- | --- | --- |
| `@Bean` 方法 | `ConfigurationClassPostProcessor` | 把配置类方法变成 BeanDefinition |
| 组件扫描 | `ClassPathBeanDefinitionScanner` | 把候选组件类变成 BeanDefinition |
| `@Import` | 配置类解析阶段 | 导入配置类、ImportSelector、ImportBeanDefinitionRegistrar |
| XML | BeanDefinitionReader | 老项目常见 |
| 编程注册 | BeanDefinitionRegistry | 框架扩展常用 |

## 配置类为什么特殊

`@Configuration` 类会被增强。原因是同一个配置类里多个 `@Bean` 方法互相调用时，Spring 要保证返回容器单例，而不是普通 Java 方法每调用一次就创建一次对象。

```java
@Configuration
class AppConfig {
    @Bean
    A a() {
        return new A(b());
    }

    @Bean
    B b() {
        return new B();
    }
}
```

完整 `@Configuration` 模式下，`b()` 调用会被拦截，优先从容器取 `B` 单例。

> **易错：** 把 `@Configuration(proxyBeanMethods = false)` 当成永远安全。只有当 `@Bean` 方法之间没有直接调用依赖时才适合关闭代理。

## 后置处理器排序

Spring 启动中排序非常关键：

1. `BeanDefinitionRegistryPostProcessor` 可以新增或修改 BeanDefinition。
2. `BeanFactoryPostProcessor` 可以修改 BeanFactory 或已注册定义。
3. `BeanPostProcessor` 注册完成后，才参与后续 Bean 实例的初始化。
4. `PriorityOrdered` 优先于 `Ordered`，再优先于无序处理器。

> **难点：** 很多“为什么我的 BeanPostProcessor 没有处理某个 Bean”的原因，是该 Bean 为了注册后置处理器而被过早创建了。

## 条件、Profile 和 Import 的执行关系

配置类解析时，Spring 会处理：

- `@Profile`：本质是条件判断，环境不匹配时跳过注册。
- `@Conditional`：由 `ConditionEvaluator` 判断是否注册。
- `@Import`：可能导入普通配置类、选择器返回的类名、或注册器手工注册的 BeanDefinition。
- `@ComponentScan`：扫描候选组件，再递归解析其中配置。

这意味着一个 Bean 不存在，不一定是扫描失败，也可能是在配置类解析阶段被条件过滤。

## 启动失败定位

| 异常 | 常见根因 | 看什么 |
| --- | --- | --- |
| `BeanDefinitionStoreException` | 配置类、XML、类路径解析失败 | 配置来源和 classpath |
| `NoSuchBeanDefinitionException` | 候选 Bean 未注册 | 扫描范围、Profile、条件 |
| `NoUniqueBeanDefinitionException` | 多候选无法唯一选择 | Qualifier、Primary、名称 |
| `BeanCurrentlyInCreationException` | 循环依赖 | 构造器环、代理早期暴露 |
| `BeanCreationException` | 创建或初始化失败 | cause 链最底层 |

## 实操：打印 BeanDefinition

```java
class BeanDefinitionDump implements BeanFactoryPostProcessor {
    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
        for (String name : beanFactory.getBeanDefinitionNames()) {
            BeanDefinition bd = beanFactory.getBeanDefinition(name);
            System.out.printf("%s -> class=%s scope=%s lazy=%s%n",
                name, bd.getBeanClassName(), bd.getScope(), bd.isLazyInit());
        }
    }
}
```

## 练习

1. 自定义 `BeanDefinitionRegistryPostProcessor`，注册一个额外的 Service Bean。
2. 给它加 `PriorityOrdered`，观察执行顺序。
3. 制造配置类 `@Bean` 方法互相调用，分别测试 `proxyBeanMethods = true/false`。
4. 给某个配置类加 `@Conditional`，记录 BeanDefinition 是否注册。

## 验收

- 能按顺序讲出 `refresh()` 的关键步骤和每步作用。
- 能区分 BeanDefinition 阶段和 Bean 实例阶段。
- 能根据启动异常判断该查扫描、条件、候选解析还是初始化逻辑。

## 重点

读 Spring 源码时先抓主干：`refresh()` 是应用上下文主线，`getBean()` 是 Bean 创建主线，AOP 和事务都挂在这两条主线上。
