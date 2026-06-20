---
title: "Linux 学习资料：VFS、Page Cache、I/O 路径和文件系统深度解析"
date: 2026-06-20
description: "Linux 读写文件不是应用直接把字节写到磁盘。普通文件 I/O 通常先进入 page cache，内核稍后把脏页写回磁盘。write() 成功通常只表示数据已经交给内核，不一定已经落盘。需要持久性保证时，应用必须调用 fsync()、fd…"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
  - "深度解析"
category: "运维"
---

# Linux 学习资料：VFS、Page Cache、I/O 路径和文件系统深度解析

[返回索引](../Linux学习资料.md)

## 学习目标

- 理解 VFS、inode、dentry、page cache、buffered I/O、direct I/O、writeback 和 fsync。
- 掌握 XFS、ext4、LVM、mount 选项、inode、文件描述符和删除文件空间不释放的底层原因。
- 能解释磁盘使用率、I/O wait、await、dirty page、日志文件、数据库刷盘之间的关系。
- 能对比 CentOS 7 常见 XFS 与 Ubuntu 24.04 常见 ext4 的运维差异。

## 理论导读

Linux 读写文件不是应用直接把字节写到磁盘。普通文件 I/O 通常先进入 page cache，内核稍后把脏页写回磁盘。`write()` 成功通常只表示数据已经交给内核，不一定已经落盘。需要持久性保证时，应用必须调用 `fsync()`、`fdatasync()`，或依赖数据库、日志系统自己的刷盘策略。

理解 page cache 是理解 Linux 内存、磁盘、性能和数据可靠性的关键。`free` 很低可能只是缓存多；`iowait` 高可能是回写压力；删除大文件后空间不释放可能是文件描述符仍打开；数据库慢可能来自 fsync 延迟而不只是 CPU。

## 核心心智模型

```text
应用 write()
  -> VFS
  -> 文件系统 ext4/xfs
  -> page cache dirty page
  -> writeback
  -> block layer
  -> device driver
  -> disk/cloud volume
```

读路径：

```text
应用 read()
  -> VFS
  -> page cache 命中则直接返回
  -> 未命中则触发磁盘 I/O
  -> 放入 page cache
  -> 返回给应用
```

## 知识点详解

## 一、VFS：统一文件接口

VFS 把 ext4、XFS、tmpfs、procfs、sysfs、NFS、overlayfs 等不同文件系统统一成 open/read/write/stat/mount 等接口。

关键对象：

| 对象 | 含义 |
| --- | --- |
| inode | 文件元数据和数据块索引 |
| dentry | 目录项缓存，路径名到 inode 的映射 |
| file | 进程打开文件后的内核对象，包含偏移和 flags |
| superblock | 文件系统整体元数据 |

这解释了为什么删除文件后，进程仍可继续写：目录项没了，但进程持有 file 对象，inode 仍未释放。

## 二、Page Cache

普通文件读写会走 page cache。

查看内存：

```bash
free -h
cat /proc/meminfo | grep -E 'Cached|Buffers|Dirty|Writeback'
```

关键字段：

- `Cached`：文件缓存。
- `Dirty`：已修改但未写回磁盘的页。
- `Writeback`：正在写回的页。
- `Available`：估算可用内存，比 free 更重要。

丢弃缓存只适合测试，不是生产调优：

```bash
sync
echo 3 | sudo tee /proc/sys/vm/drop_caches
```

生产不要把 drop_caches 当作常规性能修复。它会破坏缓存命中，可能让系统更慢。

## 三、writeback 和 fsync

`write()` 把数据交给内核，内核标记 dirty page。后台 writeback 稍后写盘。`fsync()` 要求相关数据和必要元数据持久化。

查看脏页参数：

```bash
sysctl vm.dirty_ratio
sysctl vm.dirty_background_ratio
sysctl vm.dirty_expire_centisecs
sysctl vm.dirty_writeback_centisecs
```

参数含义：

| 参数 | 作用 |
| --- | --- |
| `vm.dirty_background_ratio` | 达到比例后后台开始回写 |
| `vm.dirty_ratio` | 达到比例后写入进程可能被迫参与回写 |
| `vm.dirty_expire_centisecs` | 脏页多老后应写回 |
| `vm.dirty_writeback_centisecs` | 回写线程周期 |

不要随意调大 dirty 参数。它可能让短期写入更快，但崩溃时丢失窗口更大，回写高峰更剧烈。

## 四、Buffered I/O 与 Direct I/O

| 类型 | 特点 | 常见场景 |
| --- | --- | --- |
| Buffered I/O | 走 page cache，通用，简单 | 大多数命令和应用 |
| Direct I/O | 尽量绕过 page cache，对齐要求高 | 数据库、虚拟化、特定高性能应用 |

数据库常用自己的 buffer pool，可能使用 direct I/O 或控制 fsync 策略。不要用普通文件复制命令的表现直接推断数据库 I/O 行为。

## 五、文件系统：XFS 与 ext4

| 维度 | XFS | ext4 |
| --- | --- | --- |
| CentOS 7 默认常见性 | 常见默认 | 可用 |
| Ubuntu 24.04 默认常见性 | 可用 | 常见默认 |
| 在线扩容 | 支持，`xfs_growfs` | 支持，`resize2fs` |
| 缩小 | 不支持缩小 | 支持离线缩小但风险高 |
| 大文件/并行 I/O | 表现好 | 通用稳定 |
| 修复工具 | `xfs_repair` | `fsck.ext4` |

生产文件系统缩小通常不建议原地做。更稳妥是备份、新建目标、迁移、校验、切换。

## 六、mount 选项

查看：

```bash
findmnt -o TARGET,SOURCE,FSTYPE,OPTIONS
```

常见选项：

| 选项 | 含义 |
| --- | --- |
| `noatime` | 不更新访问时间，减少写入 |
| `relatime` | 相对更新访问时间，现代默认常见 |
| `ro` / `rw` | 只读/读写 |
| `nodev` | 不允许设备文件生效 |
| `nosuid` | 忽略 SUID/SGID |
| `noexec` | 不允许执行二进制 |
| `nofail` | fstab 挂载失败不阻塞启动 |
| `_netdev` | 网络设备挂载 |

安全加固常对 `/tmp`、上传目录、共享目录使用 `nodev,nosuid,noexec`，但可能影响需要执行脚本的应用。

## 七、I/O 指标解释

```bash
vmstat 1 5
iostat -xz 1 5
```

关键指标：

| 指标 | 含义 | 注意 |
| --- | --- | --- |
| `wa` | CPU 等 I/O 的比例 | 高说明有任务等待 I/O |
| `b` | 不可中断睡眠任务数 | 常见于磁盘或网络文件系统等待 |
| `await` | 平均 I/O 等待时间 | 延迟指标，比吞吐更直观 |
| `%util` | 设备忙碌比例 | 云盘/SSD 上需结合 await 判断 |
| `r/s w/s` | I/O 次数 | 小随机 I/O 和大顺序 I/O影响不同 |

云盘还要看云厂商 IOPS、吞吐、突发积分和队列深度。

## 八、删除文件空间不释放的机制

流程：

```text
进程打开 /var/log/app.log
  -> 获得 file 对象和 inode 引用
rm /var/log/app.log
  -> 删除目录项，链接计数减少
进程仍写 fd
  -> inode 仍被引用，空间不释放
进程关闭 fd
  -> inode 引用归零，空间释放
```

排查：

```bash
sudo lsof +L1
ls -l /proc/<pid>/fd | grep deleted
```

修复：

- 让应用 reopen log。
- 重启相关服务。
- 不建议直接写 `/proc/<pid>/fd/N` 截断，除非明确知道后果。

## 九、LVM 快照和备份边界

LVM snapshot 可提供某个时刻的块设备视图，但它不是应用一致性备份。数据库、消息队列等应用需要先 flush、锁表、停写或使用应用自己的备份机制。

风险：

- snapshot 空间不足会失效。
- 写入量越大，snapshot COW 压力越大。
- 文件系统一致不等于应用事务一致。

## 十、overlayfs 和容器磁盘

Ubuntu 24.04 容器环境常见 overlay2。容器内删除文件不一定马上降低宿主机整体占用，镜像层、可写层、日志、volume 都要分开看。

```bash
docker system df 2>/dev/null || true
findmnt | grep overlay || true
```

CentOS 7 老内核对 overlayfs、xfs ftype、容器存储驱动有更多历史限制。迁移容器平台时必须检查存储驱动兼容性。

## 例子：I/O wait 高的深度排查

1. 确认现象：

```bash
uptime
vmstat 1 5
```

2. 找设备：

```bash
iostat -xz 1 5
```

3. 找目录和文件：

```bash
df -hT
du -xh --max-depth=1 /var | sort -h
sudo lsof +L1
```

4. 找进程：

```bash
pidstat -d 1 5 2>/dev/null || true
iotop 2>/dev/null || true
```

5. 结合变更：备份、日志压缩、数据库 checkpoint、批量导入、容器镜像拉取。

## 练习

1. 用 `free -h` 和 `/proc/meminfo` 观察 page cache。
2. 创建大文件，读取两次，对比第二次是否更快。
3. 删除被进程打开的文件，用 `lsof +L1` 定位。
4. 查看一个挂载点的 mount options。
5. 在测试环境比较 XFS 和 ext4 扩容命令。

## 验收

- 能解释 VFS、inode、dentry、file 对象。
- 能说明 page cache 为什么让 free 变低。
- 能解释 write 成功和 fsync 成功的区别。
- 能排查删除文件空间不释放。
- 能从 `vmstat`、`iostat` 判断 I/O wait。
- 能说明 XFS 与 ext4 运维差异。

## 重点

- `write()` 成功不等于数据已落盘。
- Page cache 是性能机制，不是“内存泄漏”。
- 删除文件不释放空间通常是进程仍持有 fd。
- fstab、mount options 和文件系统类型会影响服务行为和安全。

## 难点

- I/O 慢可能来自 page cache 回写、磁盘延迟、文件系统日志、云盘限速、数据库 fsync、容器 overlay、网络文件系统等多层因素。

## 易错

> **易错：** 看到 cached 很大就清缓存。
>
> 正确做法：缓存是正常机制。只有在可控测试中才用 drop_caches，生产性能问题要先定位真正瓶颈。

> **易错：** 把 LVM snapshot 当成数据库一致性备份。
>
> 正确做法：结合应用一致性机制，例如数据库备份、flush、锁定或停写。

