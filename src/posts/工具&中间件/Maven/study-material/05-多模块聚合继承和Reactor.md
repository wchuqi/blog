---
title: "Maven 学习资料：多模块、聚合、继承和 Reactor"
date: 2026-06-20
description: "完成本章后，你应该能："
tags:
  - "工具&中间件"
  - "Maven"
category: "工具&中间件"
---

# Maven 学习资料：多模块、聚合、继承和 Reactor

[返回索引](../Maven学习资料.md)

## 学习目标

完成本章后，你应该能：

- 创建 Maven 多模块项目。
- 区分聚合和继承。
- 理解父 POM 和模块 POM 的关系。
- 理解 Reactor 构建顺序。
- 使用 `-pl`、`-am`、`-amd` 精准构建模块。

## 理论导读

多模块项目解决的是大型系统的构建组织问题。一个系统可能拆成 api、domain、service、web、common 等模块，每个模块有自己的代码和 POM，但它们需要一起构建、共享版本、共享插件配置，并按依赖关系确定构建顺序。

聚合和继承经常被混淆。聚合是“父工程一次构建多个模块”，靠 `<modules>` 描述；继承是“子 POM 复用父 POM 的配置”，靠 `<parent>` 描述。一个 POM 可以同时是聚合 POM 和父 POM，但它们是两种不同关系。聚合像项目清单，继承像配置模板。

Reactor 是 Maven 在一次多模块构建中建立的临时反应堆。它会读取所有模块，分析模块之间的依赖关系，然后决定构建顺序。模块 A 依赖模块 B，Maven 会先构建 B，再构建 A。理解 Reactor 后，`-pl` 和 `-am` 这类参数就不只是命令技巧，而是对构建图的裁剪。

## 标准多模块结构

```text
order-system/
  pom.xml                  父 POM / 聚合 POM
  order-api/
    pom.xml
  order-domain/
    pom.xml
  order-service/
    pom.xml
  order-web/
    pom.xml
```

父 POM：

```xml
<packaging>pom</packaging>

<modules>
    <module>order-api</module>
    <module>order-domain</module>
    <module>order-service</module>
    <module>order-web</module>
</modules>
```

子模块：

```xml
<parent>
    <groupId>com.example</groupId>
    <artifactId>order-system</artifactId>
    <version>1.0.0</version>
    <relativePath>../pom.xml</relativePath>
</parent>

<artifactId>order-service</artifactId>
```

## dependencyManagement 和 pluginManagement

父 POM 常用来集中管理版本：

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

插件版本也应集中管理：

```xml
<build>
    <pluginManagement>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.2.5</version>
            </plugin>
        </plugins>
    </pluginManagement>
</build>
```

## Reactor 常用命令

```bash
mvn clean install
mvn -pl order-service test
mvn -pl order-service -am test
mvn -pl order-domain -amd test
```

| 参数 | 作用 |
| --- | --- |
| `-pl` | 只构建指定模块 |
| `-am` | 同时构建指定模块依赖的模块 |
| `-amd` | 同时构建依赖指定模块的模块 |

## 重点

> **重点：** 聚合负责“一起构建”，继承负责“复用配置”。

## 难点

> **难点：** Reactor 构建顺序由模块依赖关系决定，不一定等于 `<modules>` 中的书写顺序。

## 易错

> **易错：** 在父 POM 的 `dependencies` 中声明所有依赖，会让所有子模块都继承这些依赖，造成 classpath 污染。常用做法是父 POM 用 `dependencyManagement` 管版本，子模块按需声明依赖。

## 练习

创建三模块项目：

- `demo-api` 定义接口。
- `demo-service` 依赖 `demo-api`。
- `demo-web` 依赖 `demo-service`。
- 在父 POM 管理 JUnit 版本。
- 使用 `mvn -pl demo-web -am test` 构建。

## 验收

- 能解释聚合和继承。
- 能配置父 POM 和子模块。
- 能解释 Reactor。
- 能使用 `-pl`、`-am`。

