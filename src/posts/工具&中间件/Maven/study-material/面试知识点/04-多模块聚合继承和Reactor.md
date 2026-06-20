---
title: "Maven 面试知识点：多模块、聚合继承和 Reactor"
date: 2026-06-20
description: "多模块项目用于组织大型系统。它可以把 api、service、web、common 等模块拆开开发，又通过父 POM 统一版本、插件配置和构建命令。Maven Reactor 会根据模块依赖关系确定构建顺序。"
tags:
  - "工具&中间件"
  - "Maven"
  - "面试"
category: "工具&中间件"
---

# Maven 面试知识点：多模块、聚合继承和 Reactor

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../Maven学习资料.md)

## 一、多模块、聚合继承和 Reactor

### 1. Maven 多模块项目有什么价值？

**参考答案：**

多模块项目用于组织大型系统。它可以把 api、service、web、common 等模块拆开开发，又通过父 POM 统一版本、插件配置和构建命令。Maven Reactor 会根据模块依赖关系确定构建顺序。

### 2. 聚合和继承有什么区别？

**参考答案：**

聚合通过 `<modules>` 声明一次构建包含哪些模块，解决“构建范围”问题；继承通过 `<parent>` 让子模块复用父 POM 配置，解决“配置复用”问题。一个父 POM 可以同时承担聚合和继承角色，但概念不同。

### 3. Reactor 是什么？

**参考答案：**

Reactor 是 Maven 多模块构建时形成的模块构建图。它读取所有模块 POM，根据模块之间的依赖关系计算构建顺序。被依赖模块会先构建，依赖它的模块后构建。

### 4. `-pl`、`-am`、`-amd` 有什么作用？

**参考答案：**

```bash
mvn -pl order-web -am test
```

`-pl` 指定构建模块，`-am` 同时构建该模块依赖的模块，`-amd` 同时构建依赖该模块的下游模块。它们用于在多模块项目中裁剪构建范围。

### 5. 父 POM 中 dependencies 和 dependencyManagement 怎么选？

**参考答案：**

父 POM 中 `dependencyManagement` 适合统一管理版本，不会自动引入依赖；`dependencies` 会被子模块继承，容易造成所有模块都带上无关依赖。企业项目通常用父 POM 管版本，子模块按需声明依赖。

> **易错：** 把所有依赖写进父 POM 的 `dependencies`，导致子模块 classpath 污染。

