---
title: "Spring Framework 7 学习资料"
date: 2026-06-20
description: "这是一份 Spring Framework 7.x 学习资料索引。内容按知识点拆分到 study-material/ 目录，适合从 Java 基础进入企业级后端框架、准备面试、补齐源码机制和生产排障能力。"
tags:
  - "框架"
  - "SpringFramework7"
  - "学习资料总览"
category: "框架"
---

# Spring Framework 7 学习资料

这是一份 Spring Framework 7.x 学习资料索引。内容按知识点拆分到 `study-material/` 目录，适合从 Java 基础进入企业级后端框架、准备面试、补齐源码机制和生产排障能力。

版本基准：截至 2026-06-06，Maven Central `org.springframework:spring-core` 最新发布版本为 `7.0.7`。学习时以 Spring Framework 7.x 为主线，同时理解 Spring Framework 6.x 到 7.x 的兼容性边界。Spring Boot 是生态集成框架，不等同于 Spring Framework。

参考入口：

- Spring Framework 项目页：https://spring.io/projects/spring-framework/
- Spring Framework 参考文档：https://docs.spring.io/spring-framework/reference/
- Maven Central 元数据：https://repo1.maven.org/maven2/org/springframework/spring-core/maven-metadata.xml
- Spring Framework GitHub：https://github.com/spring-projects/spring-framework

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览与心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 环境版本和项目结构 | [01-环境版本和项目结构.md](study-material/01-环境版本和项目结构.md) |
| 2 | IoC 容器和 Bean 生命周期 | [02-IoC容器和Bean生命周期.md](study-material/02-IoC容器和Bean生命周期.md) |
| 3 | 依赖注入和自动装配解析规则 | [03-依赖注入和自动装配解析规则.md](study-material/03-依赖注入和自动装配解析规则.md) |
| 4 | 配置模型和条件化装配 | [04-配置模型和条件化装配.md](study-material/04-配置模型和条件化装配.md) |
| 5 | AOP 动态代理和通知链 | [05-AOP动态代理和通知链.md](study-material/05-AOP动态代理和通知链.md) |
| 6 | 事务管理和传播机制 | [06-事务管理和传播机制.md](study-material/06-事务管理和传播机制.md) |
| 7 | 数据访问异常体系和 JDBC | [07-数据访问异常体系和JDBC.md](study-material/07-数据访问异常体系和JDBC.md) |
| 8 | Web MVC 请求处理链路 | [08-WebMVC请求处理链路.md](study-material/08-WebMVC请求处理链路.md) |
| 9 | WebFlux 响应式编程 | [09-WebFlux响应式编程.md](study-material/09-WebFlux响应式编程.md) |
| 10 | 校验、类型转换和国际化 | [10-校验类型转换和国际化.md](study-material/10-校验类型转换和国际化.md) |
| 11 | 测试体系和集成测试 | [11-测试体系和集成测试.md](study-material/11-测试体系和集成测试.md) |
| 12 | 可观测性、安全边界和生产排障 | [12-可观测性安全边界和生产排障.md](study-material/12-可观测性安全边界和生产排障.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | Spring 完整知识点清单 | [14-SpringFramework完整知识点清单.md](study-material/14-SpringFramework完整知识点清单.md) |
| 15 | 综合练习项目 | [15-综合练习项目.md](study-material/15-综合练习项目.md) |
| 16 | 容器启动、BeanDefinition 和 refresh 深度解析 | [16-容器启动BeanDefinition和refresh深度解析.md](study-material/16-容器启动BeanDefinition和refresh深度解析.md) |
| 17 | Bean 创建、三级缓存和循环依赖深度解析 | [17-Bean创建三级缓存循环依赖和生命周期深度解析.md](study-material/17-Bean创建三级缓存循环依赖和生命周期深度解析.md) |
| 18 | 自动装配候选选择和依赖解析算法深度解析 | [18-自动装配候选选择和依赖解析算法深度解析.md](study-material/18-自动装配候选选择和依赖解析算法深度解析.md) |
| 19 | AOP 代理创建、Advisor 匹配和调用链深度解析 | [19-AOP代理创建Advisor匹配和调用链深度解析.md](study-material/19-AOP代理创建Advisor匹配和调用链深度解析.md) |
| 20 | 事务拦截器、传播、回滚和资源同步深度解析 | [20-事务拦截器传播回滚资源同步深度解析.md](study-material/20-事务拦截器传播回滚资源同步深度解析.md) |
| 21 | Web MVC 分发、参数绑定、消息转换和异常解析深度解析 | [21-WebMVC分发参数绑定消息转换和异常解析深度解析.md](study-material/21-WebMVC分发参数绑定消息转换和异常解析深度解析.md) |
| 22 | WebFlux 事件循环、背压和阻塞边界深度解析 | [22-WebFlux事件循环背压和阻塞边界深度解析.md](study-material/22-WebFlux事件循环背压和阻塞边界深度解析.md) |
| 23 | 生产故障案例和排障剧本深度版 | [23-生产故障案例和排障剧本深度版.md](study-material/23-生产故障案例和排障剧本深度版.md) |
| 24 | 源码阅读路线和扩展点实战 | [24-源码阅读路线和扩展点实战.md](study-material/24-源码阅读路线和扩展点实战.md) |
| 25 | 深度实验手册和能力验收 | [25-深度实验手册和能力验收.md](study-material/25-深度实验手册和能力验收.md) |

## 使用建议

- 初学：按 00 到 08 顺序学习，先做 MVC 单体应用，不急着引入 WebFlux。
- 工作补强：重点读 02、03、05、06、08、11、12，关注容器、代理、事务、请求链路和排障。
- 面试复习：先读 14 完整清单，再读 13 面试索引下的分类题。
- 源码学习：先掌握 Bean 生命周期、自动装配、AOP 通知链和事务拦截器，再读源码入口。
- 深度补强：按 16 到 25 阅读，重点掌握执行链路、选择算法、缓存结构、代理边界和故障剧本。

## 最终目标

学完后应能独立解释并实践：

- Spring 容器如何发现、注册、实例化、初始化、销毁 Bean。
- `@Autowired`、`@Qualifier`、`@Primary`、泛型、集合注入、多候选 Bean 的解析顺序。
- AOP 如何选择 JDK 动态代理或 CGLIB，为什么同类方法自调用会绕过代理。
- 声明式事务如何通过代理拦截，传播行为、隔离级别、回滚规则如何生效。
- Spring MVC 从 DispatcherServlet 到 HandlerMapping、HandlerAdapter、参数解析、返回值处理、异常处理的完整链路。
- 如何编写可测试、可排障、可维护的 Spring 应用。
