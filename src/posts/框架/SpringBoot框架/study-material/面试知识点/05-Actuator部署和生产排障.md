---
title: "Spring Boot 4 面试知识点：Actuator、部署和生产排障"
date: 2026-06-20
description: "Actuator 提供生产管理端点，例如 health、metrics、prometheus、loggers、env、conditions。它让应用能被监控、告警、Kubernetes 和运维平台理解。"
tags:
  - "框架"
  - "SpringBoot框架"
  - "面试"
category: "框架"
---

# Spring Boot 4 面试知识点：Actuator、部署和生产排障

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../SpringBoot4学习资料.md)

## 一、Actuator、部署和生产排障

### 1. Actuator 有什么作用？

**参考答案：**

Actuator 提供生产管理端点，例如 health、metrics、prometheus、loggers、env、conditions。它让应用能被监控、告警、Kubernetes 和运维平台理解。

> **重点：** Actuator 是生产观察窗口，但必须控制暴露范围和权限。

### 2. liveness 和 readiness 有什么区别？

**参考答案：**

liveness 判断应用进程是否活着，失败通常触发重启；readiness 判断应用是否准备好接收流量，失败通常只是摘流量。下游依赖短暂故障不应轻易放进 liveness。

> **易错：** 把数据库健康放进 liveness，导致 DB 抖动时应用反复重启。

### 3. 如何排查自动配置不生效？

**参考答案：**

查看 dependency tree、conditions 报告、exclude 配置、属性开关、用户自定义 Bean、自动配置排序。必要时打开 `--debug`。

> **重点：** conditions 报告是排查 Boot 自动配置的核心工具。

### 4. 如何排查生产配置不生效？

**参考答案：**

确认 profile、环境变量命名、命令行参数、ConfigData 导入、部署平台注入、Actuator env 中最终值来源。还要注意敏感值脱敏不代表不存在。

> **难点：** 同一个 key 可能来自多个来源，最终值取决于优先级。

### 5. Boot 应用部署到容器要注意什么？

**参考答案：**

配置从环境注入，日志输出 stdout/stderr，健康检查区分 readiness/liveness，JVM 内存适配容器限制，镜像不包含密钥，优先使用分层镜像提高缓存效率。

> **重点：** 容器镜像是不可变制品，环境差异应由配置注入。
