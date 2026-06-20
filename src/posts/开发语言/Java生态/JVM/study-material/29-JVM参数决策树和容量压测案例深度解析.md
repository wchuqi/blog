---
title: "JVM 学习资料：JVM参数决策树和容量压测案例深度解析"
date: 2026-06-20
description: "JVM 参数没有“万能最优解”。同样是 4G 内存，网关服务、批处理、搜索服务、规则引擎、Netty 长连接服务、Spring Boot CRUD 服务的对象生命周期和堆外使用完全不同。参数决策要先明确目标：吞吐优先、延迟优先、成本优先、启…"
tags:
  - "开发语言"
  - "JVM"
  - "深度解析"
category: "开发语言"
---

# JVM 学习资料：JVM参数决策树和容量压测案例深度解析

[返回索引](../JVM学习资料.md)

## 学习目标

- 能从业务目标推导 JVM 参数，而不是背固定模板。
- 能建立容器内存、CPU、GC、线程、直接内存、dump 的预算模型。
- 能通过压测验证参数是否满足吞吐、延迟和稳定性目标。
- 能写出可复盘的 JVM 参数决策记录。

## 理论导读

JVM 参数没有“万能最优解”。同样是 4G 内存，网关服务、批处理、搜索服务、规则引擎、Netty 长连接服务、Spring Boot CRUD 服务的对象生命周期和堆外使用完全不同。参数决策要先明确目标：吞吐优先、延迟优先、成本优先、启动速度优先，还是故障证据保留优先。没有目标的调优只是碰运气。

## 一、决策树

```text
1. 明确目标
   -> P99 延迟？吞吐？成本？启动？内存上限？
2. 明确环境
   -> JDK 版本、容器 limit、CPU limit、OS、部署方式
3. 明确业务画像
   -> QPS、并发、请求大小、对象分配速率、缓存、线程数、堆外使用
4. 选择 GC
   -> 普通服务 G1，低延迟大堆 ZGC，吞吐批处理 Parallel
5. 做内存预算
   -> 堆 + 非堆 + 线程栈 + 直接内存 + 余量
6. 配观测和证据保留
   -> GC 日志、JFR、heap dump、hs_err、NMT 策略
7. 压测验证
   -> 预热、稳态、峰值、长稳、故障注入
8. 固化基线
   -> 参数、指标、回滚、告警阈值
```

## 二、2C4G 普通 Spring Boot 服务案例

假设：

- 容器 limit：4Gi。
- CPU limit：2 core。
- 普通 HTTP CRUD。
- 少量本地缓存。
- 不大量使用 Netty direct memory。
- 目标：P99 < 300ms，成本可控。

初始预算：

| 项目 | 预算 |
| --- | --- |
| Java 堆 | 2.4Gi 到 2.8Gi |
| 元空间 | 128Mi 到 256Mi 起步观察 |
| 线程栈 | 300 线程 * 1Mi 需谨慎 |
| 直接内存 | 128Mi 到 512Mi 视框架 |
| Code Cache/GC/JIT | 数百 Mi |
| 系统和波动余量 | 至少 512Mi |

参数示例：

```bash
java \
  -XX:MaxRAMPercentage=65 \
  -XX:InitialRAMPercentage=65 \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -Xss512k \
  -Xlog:gc*,safepoint:file=/logs/gc.log:time,uptime,level,tags:filecount=5,filesize=50m \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/dumps \
  -XX:ErrorFile=/logs/hs_err_pid%p.log \
  -jar app.jar
```

> **重点：** `-Xss512k` 要经过调用链验证，递归、复杂框架栈、JNI 场景不能盲目降低。

## 三、8C16G 低延迟服务案例

假设：

- P99/P999 敏感。
- 堆较大。
- CPU 余量充足。
- 不能接受 G1 偶发长停顿。

方向：

```bash
-XX:+UseZGC
-XX:MaxRAMPercentage=60
-XX:InitialRAMPercentage=60
-Xlog:gc*,safepoint:file=/logs/zgc.log:time,uptime,level,tags
```

验证重点：

- 是否有 allocation stall。
- CPU 是否明显上升。
- P99/P999 是否下降。
- RSS 是否逼近容器 limit。
- 业务吞吐是否可接受。

## 四、批处理吞吐优先案例

如果任务离线运行，目标是总体完成时间，允许较长停顿，可以考虑 Parallel GC 或更大堆。验证重点不再是 P99，而是总耗时、CPU 利用率、Full GC 总时间和成本。

## 五、压测矩阵

| 阶段 | 目标 | 时长 |
| --- | --- | --- |
| 预热 | 让类加载、JIT、缓存进入稳态 | 10-30 分钟 |
| 基准 | 正常流量下采样 | 30-60 分钟 |
| 峰值 | 目标峰值 1.5 到 2 倍 | 15-30 分钟 |
| 长稳 | 发现泄漏、碎片、周期任务影响 | 4-24 小时 |
| 故障 | 下游慢、超时、限流、重试风暴 | 按场景 |

必须记录：

- QPS、P50/P95/P99/P999。
- CPU、RSS、heap used、non-heap、direct memory。
- GC pause、GC throughput、allocation rate。
- 线程数、连接池、队列长度。
- 错误率和超时。

## 六、参数决策记录模板

```text
服务：
JDK 版本：
容器规格：
业务画像：
目标：
GC 选择：
内存预算：
启动参数：
压测结果：
风险：
回滚策略：
后续观测：
```

## 七、常见错误决策

| 错误 | 后果 | 修正 |
| --- | --- | --- |
| `-Xmx` 接近容器 limit | OOMKilled | 给非堆和余量留空间 |
| 只看平均延迟 | 掩盖停顿 | 看 P99/P999 和 pause |
| 不预热就压测 | 数据失真 | 区分预热和稳态 |
| 盲目换 ZGC | CPU 或内存成本上升 | 用目标和压测验证 |
| dump 路径不挂盘 | 事故证据丢失 | 配持久卷和权限 |

## 练习

1. 为 1C2G、2C4G、8C16G 三种规格分别写 JVM 参数基线。
2. 对一个 Spring Boot 服务做 30 分钟预热和 1 小时稳态压测。
3. 写一份参数决策记录，并说明每个参数为什么存在。

## 验收

- 能从业务目标推导 GC 和堆比例。
- 能给出容器 JVM 内存预算表。
- 能设计压测矩阵验证参数，而不是只给启动命令。

## 重点

- JVM 参数是容量工程问题，不是参数背诵题。

## 难点

- 参数之间互相影响，必须结合业务对象生命周期和容器资源限制验证。

## 易错

> **易错：** 把网上参数模板直接复制到所有服务。
>
> 正确做法：记录目标、约束、预算、验证结果和回滚方案。

