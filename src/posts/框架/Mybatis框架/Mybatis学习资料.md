---
title: "MyBatis 学习资料"
date: 2026-06-20
description: "这是一份以 MyBatis Core 3.5.19 为核心版本、兼顾 MyBatis Spring Boot Starter 4.0.x 的中文学习资料。官方 MyBatis 3 文档当前显示版本为 3.5.19；MyBatis Sprin…"
tags:
  - "框架"
  - "Mybatis框架"
  - "学习资料总览"
category: "框架"
---

# MyBatis 学习资料

这是一份以 MyBatis Core `3.5.19` 为核心版本、兼顾 MyBatis Spring Boot Starter `4.0.x` 的中文学习资料。官方 MyBatis 3 文档当前显示版本为 `3.5.19`；MyBatis Spring Boot Starter 官方文档显示 `4.0.0` 支持 Spring Boot `4.0+` 和 Java `17+`，Maven Central 已可查到 `4.0.1`。资料中会区分 MyBatis 核心框架、Spring 集成、Spring Boot starter、MyBatis Dynamic SQL、MyBatis Generator 和 MyBatis-Plus 的边界。

资料目标：从会写 Mapper XML，推进到理解 MyBatis 的执行链路、参数绑定、动态 SQL、结果映射、缓存、插件、事务、性能排障、安全风险和面试表达。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 最新版本基准和环境集成 | [01-版本基准和环境集成.md](study-material/01-版本基准和环境集成.md) |
| 2 | 核心架构和执行流程 | [02-核心架构和执行流程.md](study-material/02-核心架构和执行流程.md) |
| 3 | Mapper XML、注解和接口绑定 | [03-Mapper映射和接口绑定.md](study-material/03-Mapper映射和接口绑定.md) |
| 4 | 动态 SQL 和参数绑定 | [04-动态SQL和参数绑定.md](study-material/04-动态SQL和参数绑定.md) |
| 5 | ResultMap、关联查询和对象映射 | [05-ResultMap关联查询和对象映射.md](study-material/05-ResultMap关联查询和对象映射.md) |
| 6 | 缓存、延迟加载和执行器 | [06-缓存延迟加载和执行器.md](study-material/06-缓存延迟加载和执行器.md) |
| 7 | 插件、拦截器和扩展点 | [07-插件拦截器和扩展点.md](study-material/07-插件拦截器和扩展点.md) |
| 8 | Spring Boot 集成、事务和测试 | [08-SpringBoot集成事务和测试.md](study-material/08-SpringBoot集成事务和测试.md) |
| 9 | 性能调优、排障和安全 | [09-性能调优排障和安全.md](study-material/09-性能调优排障和安全.md) |
| 10 | 代码生成、Dynamic SQL 和 MyBatis-Plus 边界 | [10-代码生成DynamicSQL和Plus边界.md](study-material/10-代码生成DynamicSQL和Plus边界.md) |
| 11 | 迁移、版本兼容和生产规范 | [11-迁移版本兼容和生产规范.md](study-material/11-迁移版本兼容和生产规范.md) |
| 12 | 综合练习项目 | [12-综合练习项目.md](study-material/12-综合练习项目.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | 完整知识点清单 | [14-MyBatis完整知识点清单.md](study-material/14-MyBatis完整知识点清单.md) |

## 使用建议

- 入门学习：按 00 到 05 阅读，先掌握 Mapper、动态 SQL 和 ResultMap。
- 深度理解：重点读 02、04、05、06、07、09。
- Spring Boot 项目：重点读 01、08、09、11。
- 面试复习：先读 14 完整清单，再读 13 和 `study-material/面试知识点/`。

## 参考来源

- MyBatis 3 官方文档：https://mybatis.org/mybatis-3/
- MyBatis Spring Boot Starter 官方文档：https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/
- MyBatis Spring 官方文档：https://mybatis.org/spring/
- MyBatis Dynamic SQL 官方文档：https://mybatis.org/mybatis-dynamic-sql/
- MyBatis Generator 官方文档：https://mybatis.org/generator/

