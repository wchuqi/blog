---
title: "Maven 学习资料：Profile、属性、配置和环境差异"
date: 2026-06-20
description: "属性是 Maven 配置的变量系统，profile 是按条件切换配置的机制。它们让同一套项目可以在不同 JDK、不同环境、不同构建目标下调整配置。但 profile 也会隐藏构建差异：同一条命令在不同机器上可能因为激活了不同 profile…"
tags:
  - "工具&中间件"
  - "Maven"
category: "工具&中间件"
---

# Maven 学习资料：Profile、属性、配置和环境差异

[返回索引](../Maven学习资料.md)

## 学习目标

- 使用 Maven properties。
- 理解 profile 的作用和风险。
- 管理不同环境构建差异。
- 查看 effective POM 和 active profiles。

## 理论导读

属性是 Maven 配置的变量系统，profile 是按条件切换配置的机制。它们让同一套项目可以在不同 JDK、不同环境、不同构建目标下调整配置。但 profile 也会隐藏构建差异：同一条命令在不同机器上可能因为激活了不同 profile 而产生不同结果。

好的 Maven 配置应该让差异可见、可控、可复现。版本号、编码、Java release 适合用 properties 管理；环境差异可以用 profile 表达，但不要把生产密钥、数据库密码等敏感信息写进 POM。

## properties

```xml
<properties>
    <java.version>21</java.version>
    <maven.compiler.release>${java.version}</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>
```

## profiles

```xml
<profiles>
    <profile>
        <id>dev</id>
        <properties>
            <env.name>dev</env.name>
        </properties>
    </profile>
    <profile>
        <id>prod</id>
        <properties>
            <env.name>prod</env.name>
        </properties>
    </profile>
</profiles>
```

激活：

```bash
mvn package -Pdev
mvn package -Pprod
```

## 查看有效配置

```bash
mvn help:effective-pom
mvn help:active-profiles
```

## 激活方式

- 命令行 `-Pprofile-id`。
- JDK 版本。
- 操作系统。
- 系统属性。
- 文件存在与否。
- settings.xml。

## 重点

> **重点：** profile 用来切换构建配置，不应用来存放生产敏感信息。

## 难点

> **难点：** 隐式激活 profile 会让构建结果难以复现。团队项目更推荐显式指定 profile。

## 易错

> **易错：** 把运行时环境配置和构建配置混在 Maven profile 里。Maven 负责构建，不应该承担所有运行时配置管理。

## 练习

- 定义 `dev` 和 `prod` profile。
- 用 `mvn help:active-profiles` 查看激活结果。
- 用 `mvn help:effective-pom` 对比配置变化。

## 验收

- 能使用 properties。
- 能创建并激活 profile。
- 能查看 effective POM。
- 能说明 profile 的风险。

