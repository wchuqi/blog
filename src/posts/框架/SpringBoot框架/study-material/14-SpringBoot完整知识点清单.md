---
title: "Spring Boot 完整知识点清单"
date: 2026-06-20
description: "Spring Boot 4.0.x 稳定线；2026-06-06 核对的最新稳定版是 4.0.6。"
tags:
  - "框架"
  - "SpringBoot框架"
  - "知识清单"
category: "框架"
---

# Spring Boot 完整知识点清单

[返回索引](../SpringBoot学习资料.md)

## 版本和定位

- Spring Boot 4.0.x 稳定线；2026-06-06 核对的最新稳定版是 4.0.6。
- Spring Framework 7 生态；Boot 4.0.6 要求 Spring Framework 7.0.7+。
- Java 17+，并按官方说明兼容到 Java 26。
- 仍需理解 Boot 3.5.x 维护线，因为存量项目和依赖生态大量存在。

## 一、基础和术语

- Spring Framework、Spring Boot、Spring MVC、WebFlux、Spring Security、Spring Data 的边界。
- Starter、BOM、parent、plugin。
- 可执行 Jar、内嵌服务器、外部化配置。
- Servlet 应用、Reactive 应用、非 Web 应用。

## 二、启动和容器

- `SpringApplication.run`。
- ApplicationContext 类型。
- Environment 准备。
- BeanDefinition 注册。
- 容器刷新。
- Runner 执行。
- 优雅停机。

## 三、自动配置

- `@SpringBootApplication`。
- `@EnableAutoConfiguration`。
- 自动配置导入机制。
- 条件注解。
- 自动配置顺序。
- 用户 Bean 覆盖默认 Bean。
- 自动配置排除。
- conditions 报告。
- 自定义 starter 和 auto-configuration。

## 四、配置体系

- `application.yml`、Profile、环境变量、命令行参数。
- 配置优先级。
- 松散绑定。
- `@ConfigurationProperties`。
- 配置校验。
- 配置元数据。
- Secret 管理。
- Actuator `env`、`configprops` 安全。

## 五、Web 开发

- DispatcherServlet。
- HandlerMapping、HandlerAdapter。
- 参数绑定。
- Validation。
- 消息转换器。
- JSON 定制。
- 统一异常处理。
- 文件上传。
- CORS。
- 错误响应规范。
- MVC 和 WebFlux 选择。

## 六、数据访问

- DataSource 自动配置。
- 连接池。
- JDBC、JdbcClient。
- Spring Data JDBC。
- JPA/Hibernate。
- Repository。
- SQL 初始化。
- Flyway/Liquibase。
- R2DBC。
- 慢 SQL 和索引。

## 七、事务

- `@Transactional`。
- 事务代理。
- 传播行为。
- 隔离级别。
- 回滚规则。
- 事务失效场景。
- 只读事务。
- 分布式事务和最终一致性。

## 八、安全

- Spring Security 默认行为。
- SecurityFilterChain。
- 认证和授权。
- CSRF、CORS。
- Session、JWT、OAuth2 Resource Server。
- 密码哈希。
- 方法级权限。
- Actuator 端点保护。

## 九、测试

- JUnit Jupiter。
- Mockito。
- `@WebMvcTest`。
- `@DataJpaTest`。
- `@SpringBootTest`。
- Testcontainers。
- `@ServiceConnection`。
- 测试 Profile。
- 上下文缓存。
- CI 集成。

## 十、生产就绪

- Actuator。
- health/readiness/liveness。
- metrics。
- Prometheus。
- tracing。
- structured logging。
- graceful shutdown。
- 管理端点隔离。
- 构建信息和版本信息。

## 十一、部署和运行

- Maven/Gradle 打包。
- 可执行 Jar。
- buildpacks。
- Dockerfile。
- 分层镜像。
- 环境变量注入。
- JVM 参数。
- 容器资源限制。
- Kubernetes 探针。
- Native Image 和 AOT。

## 十二、集成能力

- Cache。
- Redis。
- Kafka/RabbitMQ。
- RestClient/WebClient。
- 定时任务。
- 异步线程池。
- 邮件。
- 对象存储。
- 重试、超时、限流、熔断。
- 幂等和补偿。

## 十三、性能和排障

- 启动失败。
- 自动配置未生效。
- Bean 冲突。
- 配置失效。
- 请求慢。
- P95/P99 延迟分析。
- 线程阻塞。
- 连接池耗尽。
- 内存泄漏。
- GC 频繁。
- 线程 dump、堆 dump、类直方图。
- 连接池 active/idle/pending 指标。
- 慢 SQL、锁等待、N+1 查询。
- 回滚、限流、降级、熔断、扩容。
- 日志、metrics、trace、dump 联合诊断。

## 十四、版本和迁移

- JDK 基线。
- Boot 3.x 到 4.x。
- Spring Framework 版本。
- Maven/Gradle 版本。
- Servlet 6.1、Tomcat 11、Jetty 12.1。
- GraalVM 25+ 和 Native Build Tools。
- 第三方 starter 兼容性。
- BOM 覆盖风险。
- 配置属性迁移。
- 自动配置变化。
- 测试和生产验证。

## 十五、常见项目实践

- 分层架构。
- DTO 和领域对象分离。
- 统一响应和错误模型。
- 数据库迁移随代码发布。
- 安全默认拒绝。
- 生产配置外置。
- 指标和日志标准化。
- 依赖升级有测试基线。
