---
title: "Spring Boot 学习资料"
date: 2026-06-20
description: "这是一份以 Spring Boot 4.0.x 稳定版为主线的中文学习资料。官方文档在 2026-06-06 显示稳定版为 Spring Boot 4.0.6，同时维护 3.5.x、3.4.x、3.3.x，4.1.0-RC1 属于预览版本。"
tags:
  - "框架"
  - "SpringBoot框架"
  - "学习资料总览"
category: "框架"
---

# Spring Boot 学习资料

这是一份以 Spring Boot 4.0.x 稳定版为主线的中文学习资料。官方文档在 2026-06-06 显示稳定版为 Spring Boot 4.0.6，同时维护 3.5.x、3.4.x、3.3.x，4.1.0-RC1 属于预览版本。

资料目标：从能写 REST 接口，逐步推进到理解自动配置、配置优先级、数据访问、事务、安全、测试、生产运维、容器部署、Native Image、迁移和面试表达。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 环境构建和项目结构 | [01-环境构建和项目结构.md](study-material/01-环境构建和项目结构.md) |
| 2 | 自动配置和启动流程 | [02-自动配置和启动流程.md](study-material/02-自动配置和启动流程.md) |
| 3 | 配置体系、Profile 和类型安全配置 | [03-配置体系Profile和类型安全配置.md](study-material/03-配置体系Profile和类型安全配置.md) |
| 4 | Web MVC 和 REST API | [04-Web MVC和REST API.md](study-material/04-Web MVC和REST API.md) |
| 5 | 数据访问、事务和数据库迁移 | [05-数据访问事务和迁移.md](study-material/05-数据访问事务和迁移.md) |
| 6 | 安全认证、授权和常见风险 | [06-安全认证授权和常见风险.md](study-material/06-安全认证授权和常见风险.md) |
| 7 | 测试体系和 Testcontainers | [07-测试体系和Testcontainers.md](study-material/07-测试体系和Testcontainers.md) |
| 8 | Actuator、可观测性和生产就绪 | [08-Actuator可观测性和生产就绪.md](study-material/08-Actuator可观测性和生产就绪.md) |
| 9 | 打包、部署、容器镜像和 Native | [09-打包部署容器镜像和Native.md](study-material/09-打包部署容器镜像和Native.md) |
| 10 | 集成能力：缓存、消息、定时任务 | [10-集成能力缓存消息定时任务.md](study-material/10-集成能力缓存消息定时任务.md) |
| 11 | 性能调优、排障和故障恢复 | [11-性能调优排障和故障恢复.md](study-material/11-性能调优排障和故障恢复.md) |
| 12 | Spring Boot 4 迁移和版本兼容 | [12-SpringBoot4迁移和版本兼容.md](study-material/12-SpringBoot4迁移和版本兼容.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | 完整知识点清单 | [14-SpringBoot完整知识点清单.md](study-material/14-SpringBoot完整知识点清单.md) |
| 15 | 最新版本环境基准 | [15-最新版本环境基准.md](study-material/15-最新版本环境基准.md) |

## 使用建议

- 入门学习：按 00 到 05 阅读，并完成每章练习。
- 工作补强：重点读 02、03、05、07、08、11。
- 面试复习：先读 14 知识点清单，再读 13 面试索引和 `study-material/面试知识点/`。
- 版本选型：先读 15，确认 JDK、Maven/Gradle、Servlet 容器、Native Image 和维护线。
- 迁移升级：重点读 12，并对照官方 release notes、依赖版本表和自动配置报告验证。

## 参考来源

- Spring Boot 官方项目页：https://spring.io/projects/spring-boot/
- Spring Boot 官方文档：https://docs.spring.io/spring-boot/index.html
- Spring Boot GitHub Releases：https://github.com/spring-projects/spring-boot/releases
