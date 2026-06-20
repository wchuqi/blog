---
title: "JVM 学习资料：JVM 参数、容器化和生产基线"
date: 2026-06-20
description: "易错： 把 -Xmx 设置成容器内存的 95%。"
tags:
  - "开发语言"
  - "JVM"
category: "开发语言"
---

# JVM 学习资料：JVM 参数、容器化和生产基线

[返回索引](../JVM学习资料.md)

## 学习目标

- 掌握 JVM 参数分类和生产基线。
- 理解容器内存、CPU、时区、文件句柄对 JVM 的影响。
- 能为普通 Java 后端服务设计可观测、可回滚的启动参数。

## 参数分类

| 类别 | 例子 | 说明 |
| --- | --- | --- |
| 标准参数 | `-classpath`, `-jar` | JVM 规范较稳定 |
| 非标准参数 | `-Xms`, `-Xmx`, `-Xlog` | 常见但非标准 |
| 高级参数 | `-XX:+UseG1GC` | HotSpot 特定，版本差异更明显 |
| 系统属性 | `-Dspring.profiles.active=prod` | 应用或框架读取 |

## 生产基线示例

```bash
java \
  -Xms2g -Xmx2g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -Xlog:gc*:file=/app/logs/gc.log:time,uptime,level,tags:filecount=10,filesize=100m \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/app/dumps \
  -XX:ErrorFile=/app/logs/hs_err_pid%p.log \
  -Dfile.encoding=UTF-8 \
  -Duser.timezone=Asia/Shanghai \
  -jar app.jar
```

## 容器注意点

- 容器限制是进程总内存限制，不是 Java 堆限制。
- `-Xmx` 要给非堆和系统留余量。
- CPU limit 会影响 GC 并发线程、JIT 编译和应用线程调度。
- dump 和 GC 日志目录要有磁盘容量和写权限。
- Kubernetes liveness probe 过激可能在 Full GC 或启动预热期间误杀进程。

## 内存估算

```text
容器内存 >= Java Heap
          + Metaspace
          + Direct Memory
          + Code Cache
          + 线程数 * Xss
          + JVM/GC Native 开销
          + 应用 Native 库
          + 安全余量
```

## 参数治理

- 固定 `-Xms` 和 `-Xmx` 可减少运行期堆扩缩容抖动，但会提高初始占用。
- 不要从网上复制大量 `-XX` 参数；每个参数都要有目标和验证指标。
- 调参前保留基线，调参后比较吞吐、延迟、GC、CPU、RSS。
- 版本升级后重新检查废弃参数和默认值变化。

## 练习

- 给一个 2C4G 容器设计 JVM 参数，并写出内存预算。
- 调整 `-Xmx`、线程池大小、直接内存上限，观察 RSS。
- 故意使用过时参数，观察 JVM 启动警告。

## 验收

- 能说清 `-Xmx` 和容器 memory limit 的关系。
- 能解释为什么参数要少而可验证。
- 能为服务输出一份“启动参数 + 监控项 + dump 策略 + 回滚方案”。

## 重点

- 容器 OOM 往往没有 Java 堆 OOM 的异常栈。
- JVM 参数是运行契约的一部分，应纳入配置管理和发布审查。
- GC 日志、JFR、dump 路径必须在生产环境提前规划。

## 难点

- CPU limit 会间接放大 GC 停顿和请求延迟。
- 不同 JDK 版本默认 GC、日志格式、容器感知能力可能不同。

## 易错

> **易错：** 把 `-Xmx` 设置成容器内存的 95%。
>
> 正确做法：预留非堆、线程栈、直接内存、JVM Native 和突发余量。
