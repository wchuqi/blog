---
title: "Spring Framework 7 学习资料：完整知识点清单"
date: 2026-06-20
description: "Spring Framework 7.x 当前学习基准：7.0.7。"
tags:
  - "框架"
  - "SpringFramework7"
  - "知识清单"
category: "框架"
---

# Spring Framework 7 学习资料：完整知识点清单

[返回索引](../SpringFramework7学习资料.md)

## 版本和边界

- Spring Framework 7.x 当前学习基准：`7.0.7`。
- 区分 Spring Framework、Spring Boot、Spring Data、Spring Security、Spring Cloud。
- 理解 Jakarta 命名空间迁移。
- 明确 Java、Maven、Servlet、JDBC、事务、HTTP 前置知识。

## 基础和术语

- IoC、DI、Bean、BeanDefinition。
- BeanFactory、ApplicationContext、Environment、Resource、ApplicationEvent。
- `@Configuration`、`@Bean`、`@Component`、`@Service`、`@Repository`、`@Controller`。
- XML、Java Config、注解扫描、`@Import`。

## 容器机制

- BeanDefinition 注册。
- Classpath 扫描。
- BeanName 生成。
- 单例缓存。
- 作用域：singleton、prototype、request、session、application。
- 生命周期：实例化、属性填充、Aware、初始化、后置处理器、销毁。
- `BeanPostProcessor`、`BeanFactoryPostProcessor`。
- `FactoryBean` 和普通 Bean 区别。
- 循环依赖边界。

## 依赖注入

- 构造器注入、setter 注入、字段注入。
- `@Autowired`、`@Qualifier`、`@Primary`。
- `@Order`、`Ordered`、集合注入。
- `ObjectProvider`、`Optional`、懒加载。
- 泛型候选解析。
- 父子容器和 Bean 查找边界。
- 自动装配失败排查。

## 配置和环境

- `Environment`、`PropertySource`。
- `@Value` 占位符解析。
- Profile。
- `@Conditional`。
- 外部化配置边界。
- Spring Boot 自动配置和 Framework 配置的区别。

## AOP

- Join Point、Pointcut、Advice、Advisor、Aspect。
- JDK 动态代理和 CGLIB。
- `@Before`、`@After`、`@AfterReturning`、`@AfterThrowing`、`@Around`。
- 通知排序。
- 代理暴露和自调用失效。
- final/private 方法限制。

## 事务

- `PlatformTransactionManager`。
- 声明式事务和编程式事务。
- 传播行为：REQUIRED、REQUIRES_NEW、SUPPORTS、MANDATORY、NOT_SUPPORTED、NEVER、NESTED。
- 隔离级别。
- timeout、readOnly。
- 回滚规则。
- 多数据源和事务管理器匹配。
- 事务失效排查。

## 数据访问

- JdbcTemplate。
- NamedParameterJdbcTemplate。
- RowMapper。
- 批处理。
- `@Repository` 和异常转换。
- `DataAccessException` 层级。
- 与 JPA、MyBatis、Spring Data 的边界。

## Web MVC

- DispatcherServlet。
- HandlerMapping、HandlerAdapter。
- HandlerMethodArgumentResolver。
- HandlerMethodReturnValueHandler。
- HttpMessageConverter。
- Filter、HandlerInterceptor。
- ControllerAdvice、ExceptionHandler。
- 参数绑定、校验、文件上传。
- CORS、静态资源、内容协商。

## WebFlux

- Reactive Streams。
- Mono、Flux。
- WebHandler、RouterFunction。
- WebClient。
- 背压。
- 阻塞调用风险。
- MVC 与 WebFlux 选型。

## 校验、转换、国际化

- Bean Validation。
- `@Valid`、`@Validated`。
- 分组校验。
- `ConversionService`、Converter、Formatter。
- MessageSource。
- LocaleResolver。

## 测试

- SpringExtension。
- TestContext。
- `@ContextConfiguration`。
- `@WebAppConfiguration`。
- MockMvc。
- WebTestClient。
- 事务测试回滚。
- 上下文缓存。
- 测试切片和集成测试边界。

## 生产和排障

- Bean 装配失败。
- 循环依赖。
- 代理不生效。
- 事务不回滚。
- MVC 404、400、415、500。
- JSON 序列化问题。
- 线程池、连接池、慢 SQL。
- 日志、指标、追踪。
- 敏感信息保护。

## 容易遗漏的深度点

- `@Configuration` 类增强机制。
- `FactoryBean` 的 `&beanName` 获取方式。
- BeanPostProcessor 对 AOP 代理创建的影响。
- 自动装配泛型匹配。
- 事务和 AOP 通知顺序。
- `REQUIRES_NEW` 独立提交风险。
- `OpenEntityManagerInView` 这类跨层资源持有模式的风险。
- WebFlux 中阻塞调用对事件循环的影响。
- 测试上下文缓存导致的测试间影响。
- 属性绑定、环境变量、Profile 的实际生效顺序。

## 源码机制必会清单

- `ApplicationContext#refresh()` 主线：准备环境、加载 BeanDefinition、执行工厂后置处理器、注册 Bean 后置处理器、实例化非懒加载单例、发布完成事件。
- `BeanDefinition` 生命周期：扫描、注册、合并、修改、实例化前使用。
- `ConfigurationClassPostProcessor` 对 `@Configuration`、`@Bean`、`@Import`、`@ComponentScan` 的处理。
- `DefaultListableBeanFactory` 的 Bean 查找、依赖解析、单例缓存管理。
- `getBean()` 到 `doCreateBean()` 的创建链路。
- singleton 三级缓存：`singletonObjects`、`earlySingletonObjects`、`singletonFactories`。
- `SmartInstantiationAwareBeanPostProcessor#getEarlyBeanReference` 和早期代理。
- `AutowiredAnnotationBeanPostProcessor` 如何解析注入点。
- `DependencyDescriptor`、`ResolvableType`、`AutowireCandidateResolver` 的职责。
- AOP 自动代理创建器如何找 Advisor、创建代理、构建拦截器链。
- `TransactionInterceptor` 如何围绕目标方法开启、提交、回滚事务。
- `TransactionSynchronizationManager` 如何用 ThreadLocal 绑定事务资源。
- `DispatcherServlet#doDispatch()` 主流程。
- `RequestMappingHandlerMapping` 的请求匹配条件和最具体匹配。
- `RequestMappingHandlerAdapter` 如何使用参数解析器和返回值处理器。
- `HttpMessageConverter` 的 `canRead/canWrite` 媒体类型选择。

## 生产级能力清单

- 能从异常 cause 链定位启动失败根因。
- 能判断 Bean 不存在、多候选、循环依赖、代理失效分别属于哪条链路。
- 能验证事务是否真的激活，而不是只看注解。
- 能解释 `REQUIRES_NEW`、异步线程、多数据源对一致性的影响。
- 能按 HTTP 状态码定位 MVC 失败阶段：404、405、400、415、406、500。
- 能识别 WebFlux 中的阻塞点、无限重试、缺少超时和上下文丢失。
- 能设计日志、指标、链路追踪和回归测试闭环。
- 能为每类故障写复现、根因、修复、预防措施。

## 完成标准

- 能不用 Spring Boot 搭建 Spring Framework 项目。
- 能解释容器启动和 Bean 生命周期。
- 能写并排查 AOP、事务、MVC、JDBC 示例。
- 能把常见面试题回答到机制层，而不是只背注解。
- 能沿源码主线解释 refresh、getBean、AOP、事务和 MVC 分发过程。
- 能完成深度实验手册中的全部实验并写出复盘。
