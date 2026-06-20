---
title: "Maven 学习资料：Maven 完整知识点清单"
date: 2026-06-20
description: "这份清单用于检查 Maven 学习是否完整。不要只看会不会敲命令，还要判断自己能否解释 POM、坐标、仓库、生命周期、插件、依赖树、多模块和发布流程背后的机制。"
tags:
  - "工具&中间件"
  - "Maven"
  - "知识清单"
category: "工具&中间件"
---

# Maven 学习资料：Maven 完整知识点清单

[返回索引](../Maven学习资料.md)

## 使用方式

这份清单用于检查 Maven 学习是否完整。不要只看会不会敲命令，还要判断自己能否解释 POM、坐标、仓库、生命周期、插件、依赖树、多模块和发布流程背后的机制。

## 理论学习检查标准

每个 Maven 知识点至少回答：

1. 它解决什么问题。
2. 它影响 POM、依赖解析、生命周期、插件执行、仓库，还是发布流程。
3. 它的默认规则是什么。
4. 它在多模块或 CI 中有什么变化。
5. 它误用会造成什么后果。

## 一、基础认知

必须掌握：

- Maven 的作用。
- Maven 和 JDK、IDE、Gradle、Ant 的区别。
- 标准目录结构。
- `pom.xml` 的作用。
- 本地仓库和远程仓库。

关联文档：[00-总览与心智模型.md](00-总览与心智模型.md)、[01-安装环境和标准项目结构.md](01-安装环境和标准项目结构.md)

## 二、POM 和坐标

必须掌握：

- `modelVersion`。
- `groupId`、`artifactId`、`version`。
- `packaging`。
- `properties`。
- `dependencies`。
- `build/plugins`。
- `repositories`。
- `distributionManagement`。

关联文档：[02-POM坐标依赖和仓库.md](02-POM坐标依赖和仓库.md)

## 三、生命周期和插件

必须掌握：

- clean、default、site 生命周期。
- validate、compile、test、package、verify、install、deploy。
- plugin 和 goal。
- 默认插件绑定。
- 直接执行插件目标。

关联文档：[03-生命周期阶段插件和目标.md](03-生命周期阶段插件和目标.md)

## 四、依赖管理

必须掌握：

- scope。
- 传递依赖。
- 依赖收集算法。
- scope 传播规则。
- 依赖冲突。
- 最近优先和声明优先。
- 同深度冲突的声明顺序规则。
- exclusion。
- optional。
- dependencyManagement。
- BOM。
- dependency tree。
- 本地仓库优先和远程仓库解析流程。

关联文档：[04-依赖范围传递依赖冲突和版本管理.md](04-依赖范围传递依赖冲突和版本管理.md)

## 五、多模块

必须掌握：

- parent。
- modules。
- 聚合和继承。
- Reactor。
- `-pl`、`-am`、`-amd`、`-rf`。
- 父 POM 中 dependencyManagement 和 pluginManagement。

关联文档：[05-多模块聚合继承和Reactor.md](05-多模块聚合继承和Reactor.md)

## 六、构建插件和测试

必须掌握：

- compiler。
- surefire。
- failsafe。
- jar。
- war。
- shade。
- resources。
- 跳过测试参数。

关联文档：[06-构建插件资源测试和打包.md](06-构建插件资源测试和打包.md)

## 七、配置和环境

必须掌握：

- properties。
- profiles。
- active profiles。
- effective POM。
- settings.xml。
- mirror。
- proxy。
- server credentials。

关联文档：[07-Profile属性配置和环境差异.md](07-Profile属性配置和环境差异.md)

## 八、发布和 CI

必须掌握：

- install。
- deploy。
- SNAPSHOT。
- release。
- 私服。
- distributionManagement。
- CI batch mode。
- 构建缓存。

关联文档：[08-私服发布部署和CI.md](08-私服发布部署和CI.md)

## 九、排障和安全

必须掌握：

- `-X`、`-e`、`-U`、`-o`。
- effective POM。
- dependency tree。
- 依赖下载失败。
- 编译失败。
- 测试失败。
- 版本冲突。
- 依赖漏洞。
- 凭据保护。

关联文档：[09-常见错误排障和安全.md](09-常见错误排障和安全.md)

## 最终自测

- Maven 为什么能按标准目录自动编译？
- `mvn package` 会执行哪些阶段？
- phase 和 goal 有什么区别？
- Maven 依赖寻找流程分哪几个阶段？
- scope 为 test 的依赖为什么不会进入生产运行？
- Maven 版本仲裁为什么是最近路径优先？
- dependencyManagement 为什么不会自动引入依赖？
- BOM 的作用是什么？
- 聚合和继承有什么区别？
- Reactor 如何决定构建顺序？
- install 和 deploy 有什么区别？
- SNAPSHOT 为什么不适合作为稳定依赖？
- NoSuchMethodError 和 Maven 依赖冲突有什么关系？
