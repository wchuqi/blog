---
title: "Maven 面试知识点：POM、坐标、依赖和仓库"
date: 2026-06-20
description: "POM 是 Maven 项目的说明书。它描述项目坐标、打包类型、依赖、插件、模块、属性、仓库和发布信息。核心元素包括 groupId、artifactId、version、packaging、dependencies、build、plugi…"
tags:
  - "工具&中间件"
  - "Maven"
  - "面试"
category: "工具&中间件"
---

# Maven 面试知识点：POM、坐标、依赖和仓库

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../Maven学习资料.md)

## 一、POM、坐标、依赖和仓库

### 1. POM 是什么？核心元素有哪些？

**参考答案：**

POM 是 Maven 项目的说明书。它描述项目坐标、打包类型、依赖、插件、模块、属性、仓库和发布信息。核心元素包括 `groupId`、`artifactId`、`version`、`packaging`、`dependencies`、`build`、`plugins`、`properties`、`parent`、`modules`、`dependencyManagement`。

### 2. groupId、artifactId、version 是什么？

**参考答案：**

它们是 Maven 构件坐标。`groupId` 表示组织或项目组，`artifactId` 表示具体构件名，`version` 表示版本。三者合起来可以在仓库中定位一个构件。

### 3. Maven 如何解析依赖？

**参考答案：**

Maven 解析依赖不是直接下载 jar，而是先收集依赖图，再解析构件文件。它从当前项目 POM 的直接依赖出发，递归读取每个依赖自己的 POM，收集传递依赖；然后应用 scope、optional、exclusion、dependencyManagement、BOM 和版本仲裁规则，得到最终有效依赖集合；最后再去本地仓库和远程仓库解析具体 POM、jar 等文件。

> **难点：** Maven 解析的不只是直接依赖，还包括传递依赖。

### 4. dependencyManagement 和 dependencies 有什么区别？

**参考答案：**

`dependencies` 会真正引入依赖；`dependencyManagement` 只管理依赖版本和默认配置，不会自动引入依赖。子模块仍需要在 `dependencies` 中声明依赖，只是可以省略版本。

> **易错：** 把依赖写进 `dependencyManagement` 后，以为它已经进入项目 classpath。

### 5. Maven 如何处理依赖冲突？

**参考答案：**

Maven 会构建依赖树。同一构件出现多个版本时，通常路径最近者优先；路径深度相同时，POM 中声明靠前者优先。排查时使用：

```bash
mvn dependency:tree
```

可以通过 `dependencyManagement` 固定版本，通过 `exclusion` 排除不需要的传递依赖。

### 6. Maven 的依赖寻找算法是什么？

**参考答案：**

可以分为四步：

1. 依赖收集：从根 POM 的直接依赖开始，递归读取依赖 POM，形成依赖树。
2. 规则过滤：应用 scope、optional、exclusion，决定哪些依赖继续参与构建。
3. 版本仲裁：同一个 `groupId:artifactId` 出现多个版本时，默认最近路径优先；路径深度相同，声明顺序靠前者优先；dependencyManagement 和 BOM 可以显式管理版本。
4. 仓库解析：最终版本确定后，先查本地仓库，本地没有再根据 settings、mirror、repository 去远程仓库下载并缓存。

> **重点：** nearest wins 只是版本仲裁规则，不是完整依赖寻找算法。

### 7. BOM 是什么？

**参考答案：**

BOM 是一份依赖版本清单，通常以 `type=pom`、`scope=import` 导入到 `dependencyManagement`。它用于统一一组相关依赖的兼容版本，例如 Spring Boot、Jackson、JUnit 等依赖族。
