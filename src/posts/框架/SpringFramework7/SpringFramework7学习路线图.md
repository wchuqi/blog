---
title: "Spring Framework 7 学习路线图"
date: 2026-06-20
description: "版本基准：Spring Framework 7.x，当前资料按 2026-06-06 可查的 7.0.7 发布线组织。"
tags:
  - "框架"
  - "SpringFramework7"
  - "学习路线图"
category: "框架"
---

# Spring Framework 7 学习路线图

版本基准：Spring Framework 7.x，当前资料按 2026-06-06 可查的 `7.0.7` 发布线组织。

## 阶段 1：基础认知

- 目标：理解 Spring Framework 解决的问题，以及它和 Spring Boot、Jakarta EE、Servlet、JPA 的边界。
- 需要掌握：IoC、DI、Bean、ApplicationContext、Environment、Resource、事件、模块划分。
- 例子：用纯 Spring 创建一个 `AnnotationConfigApplicationContext`，注册 Service 和 Repository。
- 练习：不用 Spring Boot，写一个最小 Spring 容器程序，打印 Bean 生命周期日志。
- 验收：能解释“Spring 是容器，不只是注解集合”。
- 重点：IoC 是对象创建和依赖关系控制权转移。
- 易错：把 Spring Boot 自动配置当成 Spring Framework 本体。

## 阶段 2：IoC 和装配机制

- 目标：掌握 BeanDefinition、BeanFactory、ApplicationContext、BeanPostProcessor、FactoryBean。
- 需要掌握：Bean 注册、实例化、属性填充、初始化、销毁、作用域、循环依赖限制。
- 例子：自定义 `BeanPostProcessor` 给 Bean 初始化前后打日志。
- 练习：实现一个 `@Bean` 配置类，观察构造器注入、setter 注入、懒加载、原型作用域差异。
- 验收：能画出单例 Bean 的生命周期。
- 重点：Spring 先收集 BeanDefinition，再按规则创建对象。
- 难点：后置处理器影响容器行为，很多框架扩展都靠它完成。

## 阶段 3：AOP、事务和横切能力

- 目标：理解代理如何把日志、权限、事务、缓存等横切逻辑放到业务方法外层。
- 需要掌握：Pointcut、Advice、Advisor、JDK 代理、CGLIB、通知顺序、事务传播、回滚规则。
- 例子：给 Service 方法加 `@Transactional`，观察运行时对象是不是代理。
- 练习：写一个自定义注解和切面，记录方法耗时。
- 验收：能解释为什么 `this.inner()` 调用不会触发事务。
- 重点：声明式事务本质是 AOP 拦截。
- 易错：以为加了 `@Transactional` 就一定生效，忽略 public 方法、代理边界、异常类型。

## 阶段 4：Web 编程

- 目标：掌握 Spring MVC 请求处理链路，并理解 WebFlux 适用边界。
- 需要掌握：DispatcherServlet、HandlerMapping、HandlerAdapter、ArgumentResolver、MessageConverter、ExceptionHandler、Filter、Interceptor。
- 例子：编写 REST Controller、统一异常处理、参数校验和 JSON 转换。
- 练习：实现一个用户管理 API，包含分页查询、创建、修改、统一错误响应。
- 验收：能从一个 HTTP 请求追踪到 Controller 返回 JSON 的全过程。
- 重点：MVC 是阻塞 Servlet 模型，WebFlux 是响应式非阻塞模型。
- 易错：在 WebFlux 中调用阻塞 JDBC 或文件 IO，导致线程模型失效。

## 阶段 5：测试、生产化和排障

- 目标：能写测试、定位容器启动失败、事务未生效、接口 404、参数绑定失败等问题。
- 需要掌握：JUnit 5、Spring TestContext、MockMvc、WebTestClient、上下文缓存、Profile、日志、可观测性。
- 例子：为 Controller 写 MockMvc 测试，为 Service 写事务回滚集成测试。
- 练习：构造 5 类常见故障并写排障记录。
- 验收：看到 Bean 冲突、循环依赖、代理失效、SQL 异常、请求映射冲突时能定位根因。
- 重点：测试切片越小，定位越快；集成测试覆盖真实装配。
- 难点：生产故障通常是配置、代理、事务、线程、连接池共同作用。

## 推荐学习节奏

| 周期 | 学习重点 | 产出 |
| --- | --- | --- |
| 第 1 周 | 容器基础、项目结构、Bean 生命周期 | 最小 Spring 应用和生命周期日志 |
| 第 2 周 | 自动装配、配置、Profile、条件装配 | 多环境配置 Demo |
| 第 3 周 | AOP、事务、JDBC | 事务边界和回滚实验 |
| 第 4 周 | Spring MVC、校验、异常处理 | REST API 小项目 |
| 第 5 周 | WebFlux、测试、生产排障 | 测试套件和排障清单 |
| 第 6 周 | 面试复盘、源码入口 | 面试 Q&A 和源码笔记 |

## 最终能力清单

- 会搭建 Spring Framework 7.x 非 Boot 项目，也能理解 Boot 在其上做了什么。
- 会解释容器启动过程、Bean 生命周期、依赖解析顺序。
- 会定位 `NoSuchBeanDefinitionException`、`NoUniqueBeanDefinitionException`、循环依赖、代理失效。
- 会设计 Controller、Service、Repository 分层，并写可测试代码。
- 会判断什么时候用 MVC，什么时候才考虑 WebFlux。
- 会把事务边界放在业务服务层，并能解释传播和回滚规则。
