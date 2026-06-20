---
title: "Spring Cloud 学习资料"
date: 2026-06-20
description: "这是一份以 Spring Cloud Release Train 2025.1.1 为基准的中文学习资料。官方文档在 2026-06-06 显示该版本为 latest stable，支持 Spring Boot 4.0.2，同页稳定维护线包…"
tags:
  - "框架"
  - "SpringCloud框架"
  - "学习资料总览"
category: "框架"
---

# Spring Cloud 学习资料

这是一份以 Spring Cloud Release Train `2025.1.1` 为基准的中文学习资料。官方文档在 2026-06-06 显示该版本为 latest stable，支持 Spring Boot `4.0.2`，同页稳定维护线包括 `2025.0.2`、`2024.0.3`、`2023.0.6`。

资料目标：从“知道微服务组件名字”，推进到理解 Spring Cloud 在分布式系统中的责任边界、调用链路、路由匹配、负载均衡、配置加载、熔断限流、消息可靠性、Kubernetes 集成、可观测性、生产排障和面试表达。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 最新版本基准和项目结构 | [01-版本基准和项目结构.md](study-material/01-版本基准和项目结构.md) |
| 2 | 服务注册发现和负载均衡 | [02-服务注册发现和负载均衡.md](study-material/02-服务注册发现和负载均衡.md) |
| 3 | OpenFeign 和服务间调用 | [03-OpenFeign和服务间调用.md](study-material/03-OpenFeign和服务间调用.md) |
| 4 | Spring Cloud Gateway 路由、过滤和限流 | [04-Gateway路由过滤和限流.md](study-material/04-Gateway路由过滤和限流.md) |
| 5 | Config 配置中心和 Bus 刷新 | [05-Config配置中心和Bus刷新.md](study-material/05-Config配置中心和Bus刷新.md) |
| 6 | Circuit Breaker、Retry、Bulkhead、RateLimiter | [06-熔断重试隔离和限流.md](study-material/06-熔断重试隔离和限流.md) |
| 7 | Stream 事件驱动和消息可靠性 | [07-Stream事件驱动和消息可靠性.md](study-material/07-Stream事件驱动和消息可靠性.md) |
| 8 | Kubernetes 云原生部署和服务发现 | [08-Kubernetes云原生部署和服务发现.md](study-material/08-Kubernetes云原生部署和服务发现.md) |
| 9 | 安全认证、授权和零信任调用 | [09-安全认证授权和零信任.md](study-material/09-安全认证授权和零信任.md) |
| 10 | 可观测性、排障和生产治理 | [10-可观测性排障和生产治理.md](study-material/10-可观测性排障和生产治理.md) |
| 11 | 迁移、兼容和版本管理 | [11-迁移兼容和版本管理.md](study-material/11-迁移兼容和版本管理.md) |
| 12 | 综合练习项目 | [12-综合练习项目.md](study-material/12-综合练习项目.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | 完整知识点清单 | [14-SpringCloud完整知识点清单.md](study-material/14-SpringCloud完整知识点清单.md) |

## 使用建议

- 入门学习：按 00 到 06 阅读，先理解调用链路和故障保护。
- 项目实战：重点读 02、03、04、05、06、10、12。
- 面试复习：先读 14 完整清单，再读 13 和 `study-material/面试知识点/`。
- 迁移升级：重点读 01、11，检查 Boot 与 Cloud Release Train 兼容矩阵。

## 参考来源

- Spring Cloud Release 官方文档：https://docs.spring.io/spring-cloud-release/reference/index.html
- Spring Cloud 官方项目页：https://spring.io/projects/spring-cloud
- Spring Cloud Gateway 文档：https://docs.spring.io/spring-cloud-gateway/reference/
- Spring Cloud Config 文档：https://docs.spring.io/spring-cloud-config/reference/
- Spring Cloud OpenFeign 文档：https://docs.spring.io/spring-cloud-openfeign/reference/
- Spring Cloud Circuit Breaker 文档：https://docs.spring.io/spring-cloud-circuitbreaker/reference/
- Spring Cloud Stream 文档：https://docs.spring.io/spring-cloud-stream/reference/

