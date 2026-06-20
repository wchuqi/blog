---
title: "Linux 学习资料：内存管理、OOM、cgroup 和容器资源深度解析"
date: 2026-06-20
description: "Linux 内存管理的核心不是“free 越多越好”，而是尽量把未使用内存用于缓存，并在应用需要时回收。page cache 可以显著提升文件读取性能；匿名内存、文件缓存、slab、内核内存、共享内存和 cgroup 限制共同决定系统是否真…"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
  - "深度解析"
category: "运维"
---

# Linux 学习资料：内存管理、OOM、cgroup 和容器资源深度解析

[返回索引](../Linux学习资料.md)

## 学习目标

- 理解虚拟内存、RSS、VSZ、page cache、swap、NUMA、overcommit 和 OOM killer。
- 掌握系统级内存压力、cgroup 内存限制、容器 OOM、systemd 资源限制的排查方式。
- 能解释 CentOS 7 cgroup v1 与 Ubuntu 24.04 cgroup v2 在资源控制和可观测路径上的差异。
- 能把 `free`、`top`、`vmstat`、`/proc/meminfo`、`dmesg` 和 cgroup 指标串成证据链。

## 理论导读

Linux 内存管理的核心不是“free 越多越好”，而是尽量把未使用内存用于缓存，并在应用需要时回收。page cache 可以显著提升文件读取性能；匿名内存、文件缓存、slab、内核内存、共享内存和 cgroup 限制共同决定系统是否真的缺内存。

OOM 也不是单一现象。可能是整机内存不足触发系统级 OOM killer，也可能是某个 systemd service 或容器超过 cgroup 限制被杀。排查必须区分“机器还有内存但容器被杀”和“整机已经不可用”。

## 核心心智模型

```text
进程虚拟地址空间
  -> page table
  -> 物理内存 page
  -> anonymous memory / file-backed memory
  -> reclaim / swap / writeback
  -> OOM decision
```

cgroup 视角：

```text
system memory
  -> systemd slice
  -> service cgroup
  -> container cgroup
  -> process
```

## 知识点详解

## 一、VSZ、RSS、PSS 和共享内存

```bash
ps aux --sort=-%mem | head
cat /proc/<pid>/status
cat /proc/<pid>/smaps_rollup 2>/dev/null || true
```

| 指标 | 含义 |
| --- | --- |
| VSZ/VIRT | 虚拟地址空间大小，不等于实际占用 |
| RSS/RES | 常驻物理内存 |
| SHR | 共享页估算 |
| PSS | 按比例分摊共享页后的占用 |

一个 Java 进程 VIRT 很大不一定是内存泄漏；要看 RSS、heap、native memory、cgroup 限制和增长趋势。

## 二、`free` 的正确读法

```bash
free -h
cat /proc/meminfo | egrep 'MemTotal|MemFree|MemAvailable|Buffers|Cached|Dirty|Writeback|Slab|SReclaimable|Swap'
```

重点：

- `MemFree` 低不代表问题。
- `MemAvailable` 更接近“还能给应用用多少”。
- `Cached` 是性能资源。
- `Dirty/Writeback` 高可能表示回写压力。
- `Slab` 高可能来自内核对象缓存，例如 dentry/inode。

## 三、匿名内存和文件缓存

内存大致分：

- anonymous memory：进程堆、栈、匿名 mmap，不能直接从文件重新读取，回收通常要 swap 或丢弃进程。
- file-backed memory：文件页缓存，可在压力下丢弃，之后从磁盘重读。

这解释了为什么 Linux 会尽量用内存做缓存，而在压力下回收缓存。

## 四、swap

查看：

```bash
swapon --show
vmstat 1 5
```

`vmstat` 中：

- `si`：swap in。
- `so`：swap out。

持续 swap in/out 表示内存压力，会严重影响延迟。生产不是一律禁用 swap，也不是无限加 swap。要结合服务类型：

- 数据库延迟敏感：通常严格控制 swap。
- 普通 Web：适度 swap 可避免瞬时 OOM，但不能依赖 swap 承载常态内存不足。

`swappiness`：

```bash
sysctl vm.swappiness
```

不要盲目设成 0。不同内核语义和工作负载下效果不同。

## 五、overcommit

Linux 允许进程申请超过当前物理内存的虚拟内存，具体由 overcommit 策略控制。

```bash
sysctl vm.overcommit_memory
sysctl vm.overcommit_ratio
```

`vm.overcommit_memory`：

| 值 | 含义 |
| --- | --- |
| 0 | 启发式 overcommit |
| 1 | 总是允许 overcommit |
| 2 | 严格限制 commit |

某些数据库建议设置严格策略或特定参数，以避免运行时 OOM。不要不理解业务就修改。

## 六、OOM killer 决策

OOM killer 会选择一个或多个进程杀死。影响因素包括内存占用、oom_score、oom_score_adj 等。

查看：

```bash
cat /proc/<pid>/oom_score
cat /proc/<pid>/oom_score_adj
```

OOM 证据：

```bash
journalctl -k | grep -i -E 'out of memory|killed process|oom'
dmesg -T | grep -i -E 'out of memory|killed process|oom'
```

日志中要看：

- 被杀进程名和 PID。
- 内存状态。
- cgroup 路径。
- 是否是 memcg OOM。

## 七、systemd 资源限制

```bash
systemctl show service -p MemoryCurrent -p MemoryMax -p TasksCurrent -p TasksMax
systemctl status service
```

unit 示例：

```ini
[Service]
MemoryMax=2G
MemoryHigh=1536M
TasksMax=1024
OOMPolicy=stop
```

Ubuntu 24.04 的 systemd 版本更新，cgroup v2 下 `MemoryHigh` 等控制更自然。CentOS 7 systemd 219 和 cgroup v1 能力较旧，很多新指令不可用或行为不同。

## 八、cgroup v1 与 v2 差异

| 维度 | CentOS 7 常见 cgroup v1 | Ubuntu 24.04 常见 cgroup v2 |
| --- | --- | --- |
| 层级 | 多 controller 多层级 | unified hierarchy |
| 内存文件 | `memory.limit_in_bytes`、`memory.usage_in_bytes` | `memory.max`、`memory.current`、`memory.events` |
| PSI | 通常不可用或有限 | Pressure Stall Information 更常见 |
| systemd 集成 | 较旧 | 更完整 |
| 容器可观测性 | 路径分散 | 统一但工具需适配 |

查看：

```bash
stat -fc %T /sys/fs/cgroup
cat /proc/self/cgroup
```

`cgroup2fs` 表示 cgroup v2。

## 九、PSI：压力指标

Ubuntu 24.04 通常可查看：

```bash
cat /proc/pressure/cpu
cat /proc/pressure/memory
cat /proc/pressure/io
```

PSI 表示任务因为资源不足而停顿的时间比例，比单纯 CPU/内存数字更接近“业务是否被资源卡住”。

CentOS 7 旧内核通常没有 PSI。

## 十、内存泄漏排查路径

1. 确认是系统内存、某进程 RSS、cgroup 还是 page cache 增长。
2. 看增长趋势，不只看瞬时值。
3. 查 OOM 日志。
4. 对具体进程看 `/proc/<pid>/smaps_rollup`。
5. 对 JVM/Go/Node 等运行时使用语言工具。
6. 检查是否是文件缓存、slab、共享内存或 tmpfs。

tmpfs 注意：

```bash
df -hT | grep tmpfs
```

写入 `/dev/shm`、`/run`、容器 emptyDir memory 都可能占用内存。

## 例子：机器还有内存，但容器 OOM

现象：

- 宿主机 `free -h` 看起来还有 available。
- 容器内应用被 killed。
- dmesg 显示 memory cgroup out of memory。

判断：

```bash
journalctl -k | grep -i oom
cat /proc/<pid>/cgroup
```

原因：容器 cgroup memory.max 限制低于宿主机总内存。应用超过 cgroup 限制被杀，与整机是否还有空闲内存不是一回事。

## 练习

1. 对比 `free -h`、`/proc/meminfo`、`top` 的内存口径。
2. 查看某进程的 `status`、`smaps_rollup`、`oom_score`。
3. 查看当前系统是 cgroup v1 还是 v2。
4. 在测试服务中设置 systemd `MemoryMax`，观察超过限制后的日志。
5. 查看 PSI 指标，如果系统支持，解释输出。

## 验收

- 能解释 VIRT、RSS、PSS、page cache 和 anonymous memory。
- 能正确判断 free 低是否是问题。
- 能从日志区分系统 OOM 和 cgroup OOM。
- 能说明 cgroup v1/v2 对资源控制和监控路径的影响。
- 能写出内存泄漏排查步骤。

## 重点

- Linux 使用内存做缓存是正常行为。
- OOM 必须看内核日志和 cgroup 路径。
- cgroup 限制会让“宿主机有内存但服务被杀”成为正常现象。
- CentOS 7 与 Ubuntu 24.04 的 cgroup 和 systemd 能力差异会影响排障方法。

## 难点

- 内存问题可能来自应用堆、native memory、page cache、tmpfs、slab、容器限制、内核 bug 或文件系统回写压力，必须分层排查。

## 易错

> **易错：** 看到 `free` 很低就清 cache。
>
> 正确做法：先看 `available`、swap、OOM、PSI 和业务延迟。cache 是可回收资源。

> **易错：** 只在宿主机看内存，不看服务或容器 cgroup 限制。
>
> 正确做法：结合 `/proc/<pid>/cgroup`、systemd show、容器 runtime 指标判断。

