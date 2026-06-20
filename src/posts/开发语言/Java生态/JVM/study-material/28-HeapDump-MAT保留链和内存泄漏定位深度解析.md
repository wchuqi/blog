---
title: "JVM 学习资料：HeapDump MAT保留链和内存泄漏定位深度解析"
date: 2026-06-20
description: "内存泄漏不是“对象大”，而是“不再需要的对象仍然被可达引用保留”。Heap dump 是某个时刻的堆快照，它告诉你对象图长什么样，但不会直接告诉你业务是否还需要这些对象。MAT 的价值在于从对象图中找支配关系和保留链，帮助你回答：如果释放某…"
tags:
  - "开发语言"
  - "JVM"
  - "深度解析"
category: "开发语言"
---

# JVM 学习资料：HeapDump MAT保留链和内存泄漏定位深度解析

[返回索引](../JVM学习资料.md)

## 学习目标

- 能区分 shallow heap、retained heap、dominator tree、GC Roots、保留链。
- 能用 MAT 分析 heap dump，找出真正保留对象的根因。
- 能识别缓存、ThreadLocal、监听器、ClassLoader、直接内存包装对象等常见泄漏。
- 能避免误判“大对象就是泄漏”。

## 理论导读

内存泄漏不是“对象大”，而是“不再需要的对象仍然被可达引用保留”。Heap dump 是某个时刻的堆快照，它告诉你对象图长什么样，但不会直接告诉你业务是否还需要这些对象。MAT 的价值在于从对象图中找支配关系和保留链，帮助你回答：如果释放某个对象，会连带释放多少内存？是谁让这批对象仍然可达？

## 一、核心概念

| 概念 | 含义 |
| --- | --- |
| Shallow Heap | 对象自身占用，不含引用对象 |
| Retained Heap | 如果该对象被回收，可连带释放的内存 |
| Dominator | 到某对象的所有路径都经过它，它支配该对象 |
| Dominator Tree | 按支配关系组织的对象树 |
| GC Roots | 可达性分析起点 |
| Path to GC Roots | 对象为什么还活着的引用路径 |

> **重点：** 查泄漏优先看 retained heap 和 path to GC roots，而不是只按 shallow heap 排序。

## 二、标准分析流程

```text
确认 Full GC 后堆仍高
  -> 抓 heap dump
  -> MAT 打开并生成 leak suspects
  -> 看 dominator tree
  -> 按 retained heap 排序
  -> 找异常业务类型或集合
  -> 查看 path to GC roots，排除弱软虚引用
  -> 回到代码确认生命周期和释放逻辑
```

抓 dump：

```bash
jcmd <pid> GC.heap_dump /dumps/app-$(date +%s).hprof
```

Windows PowerShell：

```powershell
jcmd <pid> GC.heap_dump D:\dumps\app.hprof
```

## 三、常见泄漏形态

### 1. 无界缓存

表现：

- `ConcurrentHashMap`、Caffeine、Guava Cache、HashMap retained heap 高。
- key/value 是业务对象、请求上下文、大 JSON、byte[]。

判断：

- 是否有最大容量。
- 是否有过期策略。
- key 是否包含高基数字段。
- value 是否引用完整对象图。

### 2. ThreadLocal 泄漏

`ThreadLocalMap` 的 key 是弱引用，但 value 是强引用。线程池线程长期存活时，如果业务没有 `remove()`，value 可能长期保留。

MAT 路径常见：

```text
Thread
  -> threadLocals
  -> ThreadLocalMap.Entry
  -> value
  -> business object graph
```

修复：

```java
try {
    CONTEXT.set(ctx);
    handle();
} finally {
    CONTEXT.remove();
}
```

### 3. 监听器和回调未注销

表现：

- 全局事件总线、Spring 容器、定时任务、Netty pipeline、观察者列表持有业务对象。

判断：

- 注册和注销是否成对。
- 生命周期是否跨请求、跨租户、跨插件。

### 4. ClassLoader 泄漏

常见于热部署、脚本引擎、插件系统。路径可能是：

```text
Static field / ThreadLocal / running Thread
  -> object
  -> Class
  -> ClassLoader
  -> loaded classes
```

只要 ClassLoader 被保留，它加载的类元数据和相关静态字段都可能无法释放。

### 5. 直接内存相关

Heap dump 里可能只看到 DirectByteBuffer 包装对象，看不到完整 native 内存内容。仍可通过 DirectByteBuffer 数量、capacity 字段、NMT 和 RSS 联合判断。

## 四、误判场景

| 现象 | 不一定是泄漏的原因 |
| --- | --- |
| byte[] 很大 | 可能是正常缓存、网络 buffer、压缩缓冲 |
| String 很多 | 可能是字典、配置、正常请求样本 |
| 某集合 retained 高 | 可能是设计上就是全局索引 |
| dump 中对象多 | 抓 dump 前没有 Full GC 或流量正在峰值 |

## 五、修复方案选择

| 根因 | 修复方向 |
| --- | --- |
| 无界缓存 | 设置容量、TTL、按权重淘汰、拆分 key |
| ThreadLocal | finally remove、避免放大对象、框架拦截器统一清理 |
| 监听器 | 生命周期注销、弱引用监听、容器销毁钩子 |
| ClassLoader | 停线程、清静态字段、关闭资源、隔离公共 API |
| 大对象 | 流式处理、分页、分块、避免一次性读入 |

## 练习

1. 写一个 ThreadLocal 泄漏程序，用 MAT 找保留链。
2. 写一个无界 Map 缓存，用 dominator tree 定位。
3. 抓两份不同时间 dump，对比对象增长类型。

## 验收

- 能解释 retained heap 和 shallow heap 的区别。
- 能从 GC Roots 路径说清对象为什么没被回收。
- 能把 MAT 结论映射回代码生命周期 bug。

## 重点

- Heap dump 是证据，不是结论。结论必须结合业务生命周期。

## 难点

- 泄漏定位需要从对象图、代码所有权、线程生命周期和容器生命周期一起判断。

## 易错

> **易错：** MAT Leak Suspects 说什么就认定什么。
>
> 正确做法：用 dominator tree 和 path to GC roots 复核，再回代码验证对象是否本应释放。

