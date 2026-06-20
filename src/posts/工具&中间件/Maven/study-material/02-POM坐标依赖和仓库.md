---
title: "Maven 学习资料：POM、坐标、依赖和仓库"
date: 2026-06-20
description: "POM 是 Maven 项目的说明书。它不只是列依赖，还描述项目身份、打包类型、插件配置、模块关系、属性和发布信息。Maven 每次构建都会先读 POM，再根据 POM 解析依赖、选择插件、执行生命周期。"
tags:
  - "工具&中间件"
  - "Maven"
category: "工具&中间件"
---

# Maven 学习资料：POM、坐标、依赖和仓库

[返回索引](../Maven学习资料.md)

## 学习目标

- 读懂 POM 的核心元素。
- 理解 groupId、artifactId、version。
- 掌握依赖声明和仓库解析。
- 区分本地仓库、中央仓库、私服和镜像。

## 理论导读

POM 是 Maven 项目的说明书。它不只是列依赖，还描述项目身份、打包类型、插件配置、模块关系、属性和发布信息。Maven 每次构建都会先读 POM，再根据 POM 解析依赖、选择插件、执行生命周期。

坐标是 Maven 世界里的地址系统。`groupId:artifactId:version` 可以唯一定位一个构件，就像一本书的出版社、书名和版本。仓库则是存放构件的货架：本地仓库存缓存，远程仓库提供下载，私服在企业内部代理和治理依赖。

## 核心心智模型

```text
dependency 坐标
  -> 先查本地仓库 ~/.m2/repository
  -> 本地没有则查远程仓库
  -> 下载 pom 和 jar
  -> 继续解析传递依赖
  -> 加入项目 classpath
```

## Maven 依赖寻找流程

Maven 找依赖不是简单“按坐标下载 jar”。它会先收集依赖图，再解析具体构件文件。可以把它想象成两步：先确定“应该要哪些书、要哪个版本”，再去“书架上找这些书的实体”。

第一步是依赖图收集。Maven 从当前项目 POM 的 `dependencies` 开始，读取每个依赖的 POM，再继续读取它们的依赖，形成一棵依赖树。这个过程中会考虑 scope、optional、exclusion、dependencyManagement、BOM 等规则。最终 Maven 要从可能冲突的依赖树里选出一组有效依赖。

第二步是构件解析。对每个最终选中的坐标，Maven 会先查本地仓库。如果本地已有可用构件，就直接使用；如果没有，再根据 settings、mirror、repository、pluginRepository 等配置去远程仓库查找。下载时通常会同时处理 POM、jar、校验文件和元数据。下载成功后，构件会缓存在本地仓库，后续构建优先复用本地缓存。

```text
当前项目 POM
  -> 收集直接依赖
  -> 递归读取依赖 POM
  -> 应用 scope / optional / exclusion
  -> 使用 dependencyManagement / BOM 补齐或覆盖版本
  -> 发生版本冲突时做依赖仲裁
  -> 得到最终依赖集合
  -> 本地仓库查找构件
  -> 本地没有时按 mirror / repository 去远程解析
  -> 下载并缓存到本地仓库
```

> **重点：** 依赖寻找包含“依赖图算法”和“仓库解析流程”两部分。只知道本地仓库和远程仓库，不等于理解 Maven 如何决定最终用哪个版本。

## POM 核心元素

```xml
<groupId>com.example</groupId>
<artifactId>order-service</artifactId>
<version>1.0.0</version>
<packaging>jar</packaging>
```

| 元素 | 含义 |
| --- | --- |
| `groupId` | 组织或项目组标识 |
| `artifactId` | 构件名 |
| `version` | 版本 |
| `packaging` | 打包类型，常见 jar、war、pom |

## 添加依赖

```xml
<dependencies>
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.10.2</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

> **重点：** 依赖声明的是构件坐标，不是某个本地 jar 文件路径。

## 仓库类型

| 类型 | 作用 |
| --- | --- |
| 本地仓库 | 默认 `~/.m2/repository`，缓存依赖和本地 install 产物 |
| 中央仓库 | Maven 默认远程仓库 |
| 私服 | 企业内部代理、缓存、发布和权限控制 |
| 镜像 | 在 `settings.xml` 中重定向仓库访问 |

## settings.xml

`settings.xml` 通常放在：

```text
~/.m2/settings.xml
```

常见用途：

- 配置镜像。
- 配置代理。
- 配置私服账号。
- 配置 profile。

> **易错：** 不要把私服密码写进项目 `pom.xml`。账号通常放在用户级 `settings.xml`。

## 重点

> **重点：** POM 描述项目，坐标定位构件，仓库保存构件。依赖解析是 Maven 构建的前置步骤。

## 难点

> **难点：** Maven 下载依赖时不仅下载 jar，还会读取依赖自己的 POM，并继续解析它声明的传递依赖。

## 练习

给最小项目添加 JUnit 5：

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.2</version>
    <scope>test</scope>
</dependency>
```

执行：

```bash
mvn dependency:tree
```

回答：

- JUnit 带来了哪些传递依赖？
- 这些 jar 下载到了哪里？
- `scope` 为什么是 `test`？

## 验收

- 能解释 Maven 坐标。
- 能读懂基本 POM。
- 能说明本地仓库和远程仓库。
- 能解释依赖从声明到进入 classpath 的过程。
