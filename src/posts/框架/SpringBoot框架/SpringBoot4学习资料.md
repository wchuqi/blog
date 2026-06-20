---
title: "Spring Boot 4 学习资料"
date: 2026-06-20
description: "这是一份 Spring Boot 4.x 深度学习资料索引。内容按知识点拆分到 study-material/ 目录，覆盖从入门使用到源码机制、自动配置算法、配置优先级、可观测性、生产排障、升级迁移和面试题。"
tags:
  - "框架"
  - "SpringBoot框架"
  - "学习资料总览"
category: "框架"
---

# Spring Boot 4 学习资料

这是一份 Spring Boot 4.x 深度学习资料索引。内容按知识点拆分到 `study-material/` 目录，覆盖从入门使用到源码机制、自动配置算法、配置优先级、可观测性、生产排障、升级迁移和面试题。

版本基准：截至 2026-06-06，Spring Boot 官方文档当前稳定版为 `4.0.6`；Maven Central 上 `4.1.0-RC1` 已发布但属于 Preview/候选版本。本资料以生产学习默认的稳定版 `4.0.6` 为主线，并在升级章节说明 Preview 版本边界。

参考入口：

- Spring Boot 项目页：https://spring.io/projects/spring-boot
- Spring Boot 文档入口：https://docs.spring.io/spring-boot/
- Spring Boot 4.0.6 参考文档：https://docs.spring.io/spring-boot/4.0.6/reference/
- Maven Central 元数据：https://repo1.maven.org/maven2/org/springframework/boot/spring-boot/maven-metadata.xml

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览与心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 版本、环境和项目结构 | [01-版本环境和项目结构.md](study-material/01-版本环境和项目结构.md) |
| 2 | SpringApplication 启动流程和生命周期 | [02-SpringApplication启动流程和生命周期.md](study-material/02-SpringApplication启动流程和生命周期.md) |
| 3 | 自动配置原理和条件装配 | [03-自动配置原理和条件装配.md](study-material/03-自动配置原理和条件装配.md) |
| 4 | Starter、BOM 和依赖管理 | [04-StarterBOM和依赖管理.md](study-material/04-StarterBOM和依赖管理.md) |
| 5 | 外部化配置、Profile 和 Binder | [05-外部化配置Profile和Binder.md](study-material/05-外部化配置Profile和Binder.md) |
| 6 | Web 应用、REST 和错误处理 | [06-Web应用REST和错误处理.md](study-material/06-Web应用REST和错误处理.md) |
| 7 | 数据访问、事务和数据库迁移 | [07-数据访问事务和数据库迁移.md](study-material/07-数据访问事务和数据库迁移.md) |
| 8 | Actuator、Micrometer 和可观测性 | [08-ActuatorMicrometer和可观测性.md](study-material/08-ActuatorMicrometer和可观测性.md) |
| 9 | 测试体系、切片测试和 Testcontainers | [09-测试体系切片测试和Testcontainers.md](study-material/09-测试体系切片测试和Testcontainers.md) |
| 10 | 安全配置、Secrets 和生产边界 | [10-安全配置Secrets和生产边界.md](study-material/10-安全配置Secrets和生产边界.md) |
| 11 | 打包部署、容器镜像、AOT 和 Native | [11-打包部署容器镜像AOT和Native.md](study-material/11-打包部署容器镜像AOT和Native.md) |
| 12 | 性能调优、启动优化和容量规划 | [12-性能调优启动优化和容量规划.md](study-material/12-性能调优启动优化和容量规划.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | Spring Boot 完整知识点清单 | [14-SpringBoot完整知识点清单.md](study-material/14-SpringBoot完整知识点清单.md) |
| 15 | 综合练习项目 | [15-综合练习项目.md](study-material/15-综合练习项目.md) |
| 16 | 自动配置源码、导入选择和条件评估深度解析 | [16-自动配置源码导入选择和条件评估深度解析.md](study-material/16-自动配置源码导入选择和条件评估深度解析.md) |
| 17 | 配置加载优先级、ConfigData 和 Binder 深度解析 | [17-配置加载优先级ConfigData和Binder深度解析.md](study-material/17-配置加载优先级ConfigData和Binder深度解析.md) |
| 18 | 嵌入式 Web 容器、Servlet 初始化和 MVC 集成深度解析 | [18-嵌入式Web容器Servlet初始化和MVC集成深度解析.md](study-material/18-嵌入式Web容器Servlet初始化和MVC集成深度解析.md) |
| 19 | Actuator 端点、健康检查、指标和追踪深度解析 | [19-Actuator端点健康检查指标和追踪深度解析.md](study-material/19-Actuator端点健康检查指标和追踪深度解析.md) |
| 20 | 生产故障案例和排障剧本深度版 | [20-生产故障案例和排障剧本深度版.md](study-material/20-生产故障案例和排障剧本深度版.md) |
| 21 | Spring Boot 4 升级迁移和兼容性深度解析 | [21-SpringBoot4升级迁移和兼容性深度解析.md](study-material/21-SpringBoot4升级迁移和兼容性深度解析.md) |
| 22 | 深度实验手册和能力验收 | [22-深度实验手册和能力验收.md](study-material/22-深度实验手册和能力验收.md) |
| 23 | SpringApplication 源码主线、BootstrapContext 和事件深度解析 | [23-SpringApplication源码主线BootstrapContext和事件深度解析.md](study-material/23-SpringApplication源码主线BootstrapContext和事件深度解析.md) |
| 24 | 自动配置条件算法、排序和冲突处理深度解析 | [24-自动配置条件算法排序和冲突处理深度解析.md](study-material/24-自动配置条件算法排序和冲突处理深度解析.md) |
| 25 | ConfigData 优先级矩阵、Binder 类型系统和配置元数据深度解析 | [25-ConfigData优先级矩阵Binder类型系统和配置元数据深度解析.md](study-material/25-ConfigData优先级矩阵Binder类型系统和配置元数据深度解析.md) |
| 26 | 企业级 Starter 设计、自动配置测试和兼容治理深度解析 | [26-企业级Starter设计自动配置测试和兼容治理深度解析.md](study-material/26-企业级Starter设计自动配置测试和兼容治理深度解析.md) |
| 27 | Web 错误模型、Problem Details、Jackson 和参数校验深度解析 | [27-Web错误模型ProblemDetailsJackson和参数校验深度解析.md](study-material/27-Web错误模型ProblemDetailsJackson和参数校验深度解析.md) |
| 28 | 数据源自动配置、事务管理器选择、Flyway 和 JPA 深度解析 | [28-数据源自动配置事务管理器选择Flyway和JPA深度解析.md](study-material/28-数据源自动配置事务管理器选择Flyway和JPA深度解析.md) |
| 29 | 测试上下文启动器、切片过滤和 MockBean 深度解析 | [29-测试上下文启动器切片过滤和MockBean深度解析.md](study-material/29-测试上下文启动器切片过滤和MockBean深度解析.md) |
| 30 | AOT、RuntimeHints、Native Image 和反射边界深度解析 | [30-AOTRuntimeHintsNativeImage和反射边界深度解析.md](study-material/30-AOTRuntimeHintsNativeImage和反射边界深度解析.md) |
| 31 | Kubernetes、健康探针、滚动发布和配置注入深度解析 | [31-Kubernetes健康探针滚动发布和配置注入深度解析.md](study-material/31-Kubernetes健康探针滚动发布和配置注入深度解析.md) |
| 32 | 性能剖析、启动耗时、连接池和线程池容量深度解析 | [32-性能剖析启动耗时连接池和线程池容量深度解析.md](study-material/32-性能剖析启动耗时连接池和线程池容量深度解析.md) |
| 33 | 架构级生产事故复盘和排障决策树 | [33-架构级生产事故复盘和排障决策树.md](study-material/33-架构级生产事故复盘和排障决策树.md) |

## 使用建议

- 初学：00 到 08，重点理解 Boot 不是替代 Spring Framework，而是约定、自动配置和生产化整合。
- 工作补强：03、05、08、09、10、12、20，重点掌握配置、监控、测试和排障。
- 源码深入：16、17、18、19，重点读自动配置导入、条件评估、ConfigData、嵌入式容器。
- 深水区：23 到 33，重点掌握源码执行顺序、条件算法、配置矩阵、企业 Starter、测试上下文、AOT、Kubernetes 和事故复盘。
- 面试复习：先读 14 完整清单，再读 13 面试索引。

## 最终目标

学完后应能独立解释并实践：

- `SpringApplication.run()` 做了什么。
- 自动配置类如何被发现、过滤、排序和生效。
- `application.yml`、环境变量、命令行参数、Profile、ConfigData 的优先级。
- Starter 和 BOM 如何控制依赖版本。
- Boot 如何启动嵌入式 Tomcat/Jetty/Undertow 并接入 Spring MVC。
- Actuator、Micrometer、健康检查、指标、日志、追踪如何服务生产排障。
- 如何为 Boot 应用写单元测试、切片测试、集成测试和容器化测试。
