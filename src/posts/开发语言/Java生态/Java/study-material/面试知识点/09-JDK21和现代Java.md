---
title: "Java 面试知识点：JDK 21 和现代 Java"
date: 2026-06-20
description: "Virtual Threads、Pattern Matching for switch、Record Patterns、Sequenced Collections、Generational ZGC。它们分别改善并发模型、类型匹配表达力、集合…"
tags:
  - "开发语言"
  - "Java"
  - "面试"
category: "开发语言"
---

# Java 面试知识点：JDK 21 和现代 Java

[返回面试索引](../22-面试知识点整理.md)

[返回学习资料索引](../../Java学习资料.md)

## 一、JDK 21 特性

### 72. JDK 21 中你最关注哪些特性？

**参考答案：**

Virtual Threads、Pattern Matching for switch、Record Patterns、Sequenced Collections、Generational ZGC。它们分别改善并发模型、类型匹配表达力、集合 API 一致性和低延迟 GC。

### 73. record 适合什么场景？

**参考答案：**

record 适合不可变数据载体，例如 DTO、值对象、查询结果、事件对象。它自动生成构造器、accessor、equals、hashCode、toString。

### 74. sealed class 解决什么问题？

**参考答案：**

sealed 限制继承层次，使编译器知道所有允许的子类型，适合有限状态、结果类型、命令类型、AST 等。

### 75. pattern matching for switch 有什么价值？

**参考答案：**

它让 switch 可以按类型匹配并绑定变量，配合 sealed 类型可以做穷尽性检查，减少 instanceof + 强转样板代码。

### 76. record patterns 是什么？

**参考答案：**

record patterns 允许在模式匹配中解构 record 组件。

```java
if (obj instanceof Point(int x, int y)) {
    System.out.println(x + y);
}
```

### 77. Sequenced Collections 解决什么问题？

**参考答案：**

它统一了有序集合的首尾访问和反向视图 API，例如 `getFirst()`、`getLast()`、`reversed()`。

### 78. 预览特性和正式特性有什么区别？

**参考答案：**

预览特性需要 `--enable-preview`，未来语法或 API 可能变化，不建议默认用于长期生产代码。正式特性可直接使用并有稳定兼容承诺。

