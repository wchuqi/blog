---
title: "Linux 学习资料：内核、系统调用、procfs 和 sysfs 深度解析"
date: 2026-06-20
description: "Linux 的表层是命令、服务和配置文件，底层是内核对象。进程、文件、socket、块设备、网卡、内存页、cgroup、namespace、LSM 安全模块都由内核维护。用户态程序不能直接操作硬件和内核数据结构，必须通过系统调用向内核请求服…"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
  - "深度解析"
category: "运维"
---

# Linux 学习资料：内核、系统调用、procfs 和 sysfs 深度解析

[返回索引](../Linux学习资料.md)

## 学习目标

- 理解用户态、内核态、系统调用、虚拟文件系统和硬件抽象之间的关系。
- 掌握 `/proc`、`/sys`、`/dev`、`/run` 的真实含义和排障价值。
- 能解释一个命令如何通过 libc、系统调用、VFS、调度器和驱动进入内核。
- 能理解 CentOS 7 旧内核和 Ubuntu 24.04 新内核在可观测性、cgroup、网络和文件系统能力上的差异。

## 理论导读

Linux 的表层是命令、服务和配置文件，底层是内核对象。进程、文件、socket、块设备、网卡、内存页、cgroup、namespace、LSM 安全模块都由内核维护。用户态程序不能直接操作硬件和内核数据结构，必须通过系统调用向内核请求服务。

你执行 `cat /proc/meminfo` 时，不是在读取磁盘上的一个普通文件，而是在读取内核通过 procfs 动态生成的内存状态。你执行 `echo 1 > /proc/sys/net/ipv4/ip_forward` 时，也不是改文本配置，而是在写入内核运行时参数。

## 核心心智模型

### 1. 用户态和内核态

```text
应用程序 / Shell / systemd
  -> glibc 或运行时库
  -> system call
  -> Linux kernel
  -> 调度器 / VFS / 网络栈 / 内存管理 / 驱动
  -> 硬件
```

用户态程序通过系统调用进入内核，例如：

- `openat`：打开文件。
- `read` / `write`：读写文件描述符。
- `fork` / `clone`：创建进程或线程。
- `execve`：执行新程序。
- `socket` / `connect` / `accept`：网络连接。
- `mount`：挂载文件系统。

### 2. `/proc` 和 `/sys` 是观察内核的窗口

- `/proc`：以进程和内核运行时状态为主。
- `/sys`：以设备、驱动、内核对象和 sysfs 属性为主。
- `/dev`：设备节点，由 udev 管理，应用通过它访问设备。
- `/run`：运行时状态，tmpfs，重启后清空。

## 知识点详解

## 一、系统调用如何工作

以 `cat file` 为例，简化链路是：

```text
cat 进程
  -> openat("file")
  -> read(fd, buffer)
  -> write(stdout, buffer)
  -> close(fd)
```

观察：

```bash
strace -e openat,read,write,close cat /etc/hostname
```

如果命令报 `Permission denied`，`strace` 能看到具体哪个系统调用返回 `EACCES`，以及它访问的是哪个路径。排查权限、安全模块、缺文件时，`strace` 比猜测可靠。

常见 errno：

| errno | 含义 | 常见原因 |
| --- | --- | --- |
| `ENOENT` | No such file or directory | 路径错、动态库缺失、解释器路径错 |
| `EACCES` | Permission denied | 权限、ACL、SELinux/AppArmor |
| `EPERM` | Operation not permitted | capability 不足、内核策略拒绝 |
| `EADDRINUSE` | Address already in use | 端口占用 |
| `ECONNREFUSED` | Connection refused | 目标端口无监听或主动拒绝 |
| `ETIMEDOUT` | Timed out | 包没回来、防火墙丢包、网络不通 |
| `ENOSPC` | No space left on device | 空间或 inode 耗尽 |

## 二、procfs 的关键目录

### `/proc/<pid>/`

```bash
ls -l /proc/$$
cat /proc/$$/status
ls -l /proc/$$/fd
cat /proc/$$/limits
cat /proc/$$/cmdline | tr '\0' ' '
```

常用文件：

| 路径 | 作用 |
| --- | --- |
| `/proc/<pid>/cmdline` | 启动参数 |
| `/proc/<pid>/environ` | 环境变量，可能包含敏感信息 |
| `/proc/<pid>/fd/` | 打开的文件描述符 |
| `/proc/<pid>/limits` | 资源限制 |
| `/proc/<pid>/status` | 状态、UID、内存、线程数 |
| `/proc/<pid>/maps` | 虚拟内存映射 |
| `/proc/<pid>/cgroup` | 所属 cgroup |

生产注意：`environ`、`cmdline` 可能含密码、token、数据库连接串。不要随意贴到工单或聊天工具。

### `/proc/sys/`

这是 sysctl 参数视图。

```bash
sysctl net.ipv4.ip_forward
cat /proc/sys/net/ipv4/ip_forward
```

临时修改：

```bash
sudo sysctl -w net.ipv4.ip_forward=1
```

持久化：

```bash
sudo tee /etc/sysctl.d/99-custom.conf >/dev/null <<'EOF'
net.ipv4.ip_forward = 1
EOF
sudo sysctl --system
```

CentOS 7 和 Ubuntu 24.04 都支持 sysctl，但默认参数和内核可用项可能不同。不要把一台机器的 `/proc/sys` 全量复制到另一台。

## 三、sysfs 和设备模型

查看块设备：

```bash
ls /sys/block
udevadm info --query=all --name=/dev/sda 2>/dev/null || true
```

查看网卡：

```bash
ls /sys/class/net
cat /sys/class/net/eth0/operstate 2>/dev/null || true
```

sysfs 暴露内核设备模型。很多工具如 `lsblk`、`ip`、`udevadm` 都会读取 sysfs。

## 四、udev 和设备命名

Linux 设备节点通常由 udev 根据内核事件创建设备文件，例如 `/dev/sda`、`/dev/nvme0n1`、`/dev/disk/by-id/*`。

问题：为什么不建议在 fstab 中直接写 `/dev/sdb1`？

因为设备发现顺序可能变化，`/dev/sdb1` 可能下次启动指向另一块盘。更稳妥：

```bash
ls -l /dev/disk/by-uuid/
ls -l /dev/disk/by-id/
blkid
```

fstab 优先用 UUID、LVM 路径或稳定 by-id。

## 五、内核模块

查看模块：

```bash
lsmod
modinfo xfs 2>/dev/null || true
```

加载和卸载：

```bash
sudo modprobe module_name
sudo modprobe -r module_name
```

生产不应随意卸载模块。文件系统、网卡、存储驱动被卸载可能直接影响业务。

## 六、namespace 和 cgroup 的位置

容器的核心不是“轻量虚拟机”，而是进程使用 namespace 隔离视图，用 cgroup 限制资源。

查看 namespace：

```bash
ls -l /proc/$$/ns
```

查看 cgroup：

```bash
cat /proc/$$/cgroup
mount | grep cgroup
```

CentOS 7 多为 cgroup v1；Ubuntu 24.04 默认常见 unified cgroup v2。容器运行时、systemd 资源限制和监控指标的路径会不同。

## 七、LSM：SELinux 和 AppArmor 的内核位置

SELinux 和 AppArmor 属于 Linux Security Module 框架。它们不是普通应用层工具，而是在内核访问控制路径中做额外检查。

这解释了为什么：

- 文件权限允许，仍可能被 SELinux/AppArmor 拒绝。
- `strace` 只能看到 `EACCES`，还需要 audit/journal 看 MAC 拒绝原因。
- 关闭安全模块会改变内核访问决策，不应作为长期修复。

## 八、CentOS 7 与 Ubuntu 24.04 的内核差异影响

| 维度 | CentOS 7 | Ubuntu 24.04 |
| --- | --- | --- |
| 内核基线 | 3.10 + backport | 6.8 |
| cgroup | v1 为主 | v2 常见 |
| nftables | 非主流，iptables 体系更常见 | nftables/iptables-nft 常见 |
| eBPF | 能力有限 | 能力更完整，但仍受配置限制 |
| 文件系统 | XFS 常见 | ext4 常见，也支持 XFS |
| 安全模块 | SELinux | AppArmor |
| 容器能力 | 老内核限制更多 | 更适合现代容器 |

不要只看版本号判断能力。CentOS/RHEL 内核会 backport 功能和修复，但 EOL 后安全修复停止。

## 例子：用 strace 排查服务启动失败

假设 systemd 日志只看到：

```text
Permission denied
```

可以临时用服务同一用户执行：

```bash
sudo -u appuser strace -f -o /tmp/app.strace /opt/app/bin/app --config /etc/app/app.yml
grep -E 'EACCES|ENOENT|EPERM' /tmp/app.strace | tail -50
```

判断：

- `ENOENT`：文件或解释器不存在。
- `EACCES`：传统权限或 MAC 拒绝。
- `EPERM`：能力、挂载选项或内核策略。

## 练习

1. 用 `strace` 观察 `cat /etc/hostname` 的系统调用。
2. 查看当前 shell 的 `/proc/$$/fd`、`limits`、`status`。
3. 用 `sysctl` 临时查看和设置一个安全的测试参数。
4. 查看网卡在 `/sys/class/net` 下的状态。
5. 对比 CentOS 7 与 Ubuntu 24.04 的 `cat /proc/1/cgroup` 输出。

## 验收

- 能解释系统调用在用户态和内核态之间的作用。
- 能使用 `/proc/<pid>` 查进程资源、文件描述符和 cgroup。
- 能说明 `/proc/sys` 与 `sysctl` 的关系。
- 能解释 `/sys` 与设备、驱动和 udev 的关系。
- 能说明为什么 SELinux/AppArmor 会在传统权限之外拒绝访问。

## 重点

- `/proc` 和 `/sys` 多数不是磁盘普通文件，而是内核动态视图。
- `strace` 是定位系统调用失败的关键工具。
- 设备名不稳定，持久配置应使用 UUID、by-id 或 LVM。
- cgroup v1/v2 差异会影响容器、资源限制和监控。

## 难点

- 同一个错误码可能来自不同层。`EACCES` 可能是权限位、ACL、目录 x 权限、SELinux/AppArmor、挂载选项或 capability 问题。

## 易错

> **易错：** 直接修改 `/proc/sys/...` 后认为已经持久化。
>
> 正确做法：运行时修改会重启丢失，持久化应写入 `/etc/sysctl.d/*.conf` 并用 `sysctl --system` 验证。

> **易错：** 把 `/proc/<pid>/environ` 输出直接贴到公开地方。
>
> 正确做法：环境变量可能包含密钥、token 和密码，排障时要脱敏。

