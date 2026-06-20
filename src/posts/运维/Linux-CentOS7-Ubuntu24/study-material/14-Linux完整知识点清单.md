---
title: "Linux 学习资料：完整知识点清单"
date: 2026-06-20
description: "这份清单用于检查 Linux 学习覆盖是否完整。它以 CentOS 7 和 Ubuntu 24.04 为目标环境，覆盖基础、机制、日常运维、安全、性能、排障、自动化和面试。"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
  - "知识清单"
category: "运维"
---

# Linux 学习资料：完整知识点清单

[返回索引](../Linux学习资料.md)

这份清单用于检查 Linux 学习覆盖是否完整。它以 CentOS 7 和 Ubuntu 24.04 为目标环境，覆盖基础、机制、日常运维、安全、性能、排障、自动化和面试。

## 一、基础和发行版

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 发行版差异 | CentOS 7 EOL、Ubuntu 24.04 LTS、包生态、默认工具 | [00-总览心智模型和发行版差异.md](00-总览心智模型和发行版差异.md) |
| 系统信息 | `/etc/os-release`、`uname`、`hostnamectl`、`systemctl --version` | [00-总览心智模型和发行版差异.md](00-总览心智模型和发行版差异.md) |
| Shell 执行模型 | alias、builtin、PATH、展开、退出码 | [01-命令行Shell和帮助系统.md](01-命令行Shell和帮助系统.md) |
| 帮助系统 | `man`、section、`--help`、包归属查询 | [01-命令行Shell和帮助系统.md](01-命令行Shell和帮助系统.md) |

## 二、文件系统和权限

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 目录结构 | FHS、`/etc`、`/var`、`/proc`、`/sys`、`/run` | [02-文件系统权限ACL和链接.md](02-文件系统权限ACL和链接.md) |
| inode | 文件名、目录项、inode、数据块 | [02-文件系统权限ACL和链接.md](02-文件系统权限ACL和链接.md) |
| 权限 | rwx、目录 x、umask、chown、chmod | [02-文件系统权限ACL和链接.md](02-文件系统权限ACL和链接.md) |
| ACL | `getfacl`、`setfacl`、default ACL、mask | [02-文件系统权限ACL和链接.md](02-文件系统权限ACL和链接.md) |
| 特殊权限 | SUID、SGID、sticky bit | [02-文件系统权限ACL和链接.md](02-文件系统权限ACL和链接.md) |
| 链接 | 硬链接、软链接、跨文件系统限制 | [02-文件系统权限ACL和链接.md](02-文件系统权限ACL和链接.md) |

## 三、用户、认证和权限提升

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 用户和组 | UID/GID、`/etc/passwd`、`/etc/shadow`、`getent` | [03-用户组sudoPAM和认证.md](03-用户组sudoPAM和认证.md) |
| 用户管理 | `useradd`、`usermod -aG`、`passwd`、`chage` | [03-用户组sudoPAM和认证.md](03-用户组sudoPAM和认证.md) |
| sudo | `visudo`、`/etc/sudoers.d/`、最小权限 | [03-用户组sudoPAM和认证.md](03-用户组sudoPAM和认证.md) |
| PAM | `/etc/pam.d/`、sshd、sudo、su | [03-用户组sudoPAM和认证.md](03-用户组sudoPAM和认证.md) |
| 登录日志 | CentOS `/var/log/secure`、Ubuntu `/var/log/auth.log` | [03-用户组sudoPAM和认证.md](03-用户组sudoPAM和认证.md) |

## 四、软件包和服务

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| RPM/YUM | `yum`、`rpm -qf`、repo、EPEL、versionlock | [04-软件包仓库和版本管理.md](04-软件包仓库和版本管理.md) |
| DEB/APT | `apt`、`dpkg -S`、sources、apt-mark hold | [04-软件包仓库和版本管理.md](04-软件包仓库和版本管理.md) |
| 仓库安全 | GPG、第三方源、PPA、源码安装风险 | [04-软件包仓库和版本管理.md](04-软件包仓库和版本管理.md) |
| systemd | unit、service、target、依赖、drop-in | [05-systemd启动流程服务和日志.md](05-systemd启动流程服务和日志.md) |
| 启动流程 | BIOS/UEFI、GRUB、kernel、initramfs、PID 1 | [05-systemd启动流程服务和日志.md](05-systemd启动流程服务和日志.md) |
| 服务日志 | `journalctl -u`、`journalctl -b`、`systemctl cat` | [05-systemd启动流程服务和日志.md](05-systemd启动流程服务和日志.md) |

## 五、进程、资源和自动化

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 进程 | PID、PPID、状态、父子关系、zombie | [06-进程信号资源限制和调度.md](06-进程信号资源限制和调度.md) |
| 信号 | TERM、KILL、HUP、INT、STOP、CONT | [06-进程信号资源限制和调度.md](06-进程信号资源限制和调度.md) |
| 文件描述符 | `lsof`、`/proc/<pid>/fd`、`ulimit` | [06-进程信号资源限制和调度.md](06-进程信号资源限制和调度.md) |
| cgroup | systemd 资源限制、cgroup v1/v2 | [06-进程信号资源限制和调度.md](06-进程信号资源限制和调度.md) |
| Shell 脚本 | `set -Eeuo pipefail`、引用、函数、trap | [10-Shell脚本文本处理和自动化.md](10-Shell脚本文本处理和自动化.md) |
| 文本处理 | grep、sed、awk、find、xargs、jq | [10-Shell脚本文本处理和自动化.md](10-Shell脚本文本处理和自动化.md) |

## 六、网络、磁盘和日志

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 网络基础 | IP、route、ARP、DNS、监听地址、端口 | [07-网络防火墙DNS和排障.md](07-网络防火墙DNS和排障.md) |
| 网络配置 | CentOS ifcfg/NM、Ubuntu netplan/systemd-resolved | [07-网络防火墙DNS和排障.md](07-网络防火墙DNS和排障.md) |
| 防火墙 | firewalld、ufw、iptables、nftables | [07-网络防火墙DNS和排障.md](07-网络防火墙DNS和排障.md) |
| 抓包 | tcpdump、连接建立、DNS 请求 | [07-网络防火墙DNS和排障.md](07-网络防火墙DNS和排障.md) |
| 磁盘 | lsblk、blkid、df、findmnt、fstab | [08-磁盘LVM文件系统和挂载.md](08-磁盘LVM文件系统和挂载.md) |
| LVM | PV、VG、LV、扩容 | [08-磁盘LVM文件系统和挂载.md](08-磁盘LVM文件系统和挂载.md) |
| 文件系统 | XFS、ext4、inode、打开但已删除文件 | [08-磁盘LVM文件系统和挂载.md](08-磁盘LVM文件系统和挂载.md) |
| 日志 | journal、rsyslog、auth、secure、syslog | [09-日志时间同步计划任务和审计.md](09-日志时间同步计划任务和审计.md) |
| 时间 | timedatectl、chrony、systemd-timesyncd | [09-日志时间同步计划任务和审计.md](09-日志时间同步计划任务和审计.md) |
| 计划任务 | cron、systemd timer、logrotate | [09-日志时间同步计划任务和审计.md](09-日志时间同步计划任务和审计.md) |

## 七、安全、性能和排障

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| SSH | root 登录、密码登录、key、sshd -t | [11-安全加固SELinuxAppArmor和SSH.md](11-安全加固SELinuxAppArmor和SSH.md) |
| SELinux | getenforce、上下文、AVC、restorecon、sebool | [11-安全加固SELinuxAppArmor和SSH.md](11-安全加固SELinuxAppArmor和SSH.md) |
| AppArmor | aa-status、profile、complain/enforce | [11-安全加固SELinuxAppArmor和SSH.md](11-安全加固SELinuxAppArmor和SSH.md) |
| 审计 | auditd、auditctl、ausearch | [09-日志时间同步计划任务和审计.md](09-日志时间同步计划任务和审计.md) |
| CPU | load、top、vmstat、mpstat | [12-性能监控和故障排查.md](12-性能监控和故障排查.md) |
| 内存 | free、available、swap、OOM | [12-性能监控和故障排查.md](12-性能监控和故障排查.md) |
| I/O | iostat、du、lsof +L1 | [12-性能监控和故障排查.md](12-性能监控和故障排查.md) |
| 网络排障 | ss、ip、dig、tcpdump、DNS | [07-网络防火墙DNS和排障.md](07-网络防火墙DNS和排障.md) |

## 八、高频易错清单

- CentOS 7 已 EOL 仍无迁移计划。
- Ubuntu 24.04 直接编辑 `/etc/resolv.conf`。
- 远程修改 SSH 未执行 `sshd -t`，导致无法登录。
- `chmod -R 777` 解决权限问题。
- 忘记目录 `x` 权限。
- `usermod -G` 覆盖附加组。
- 修改 systemd unit 后忘记 `daemon-reload`。
- 把 `enable` 当成立即启动。
- 把 `After=` 当成强依赖。
- 只看 `free` 不看 available。
- load 高就直接扩 CPU，不看 I/O wait。
- 删除大日志后不查 `lsof +L1`。
- fstab 写错导致重启进 emergency mode。
- 防火墙只看 iptables，不看 nftables/ufw/firewalld。
- SELinux/AppArmor 拒绝被误判为普通权限问题。
- 脚本变量不加引号。

## 九、最终验收清单

- 能区分 CentOS 7 和 Ubuntu 24.04 的包管理、网络、防火墙、安全模块和日志路径。
- 能安全管理用户、组、sudo 和 SSH。
- 能安装、升级、查询和锁定软件包。
- 能读懂 systemd unit 并排查服务失败。
- 能配置网络、DNS、防火墙和抓包定位。
- 能管理磁盘、LVM、文件系统和 fstab。
- 能查询日志、配置定时任务和时间同步。
- 能写可靠 Shell 脚本。
- 能完成安全加固。
- 能处理 CPU、内存、I/O、网络和磁盘故障。
- 能回答 Linux 面试机制题和场景题。

## 十、深度机制导航

| 深度主题 | 必须能回答的问题 | 文件 |
| --- | --- | --- |
| 内核和系统调用 | 命令如何通过 syscall 进入内核，`/proc` 和 `/sys` 为什么不是普通文件 | [17-内核系统调用procfs和sysfs深度解析.md](17-内核系统调用procfs和sysfs深度解析.md) |
| 启动链路 | BIOS/UEFI、GRUB、kernel、initramfs、systemd 如何串起来 | [18-启动链路GRUBinitramfs和systemd深度解析.md](18-启动链路GRUBinitramfs和systemd深度解析.md) |
| VFS 和 I/O | `write()` 成功为何不等于落盘，page cache 如何影响 free 和 I/O wait | [19-VFSPageCacheIO路径和文件系统深度解析.md](19-VFSPageCacheIO路径和文件系统深度解析.md) |
| 网络栈 | 路由、socket、netfilter、conntrack、firewalld/ufw/nftables 的层级关系 | [20-网络栈路由conntrack和netfilter深度解析.md](20-网络栈路由conntrack和netfilter深度解析.md) |
| 内存和 cgroup | 如何区分 page cache、系统 OOM、cgroup OOM 和容器限制 | [21-内存管理OOMcgroup和容器资源深度解析.md](21-内存管理OOMcgroup和容器资源深度解析.md) |
| 安全机制 | DAC、ACL、capability、PAM、sudo、SELinux/AppArmor 如何共同决策 | [22-SELinuxAppArmorPAM和sudo安全深度解析.md](22-SELinuxAppArmorPAM和sudo安全深度解析.md) |
| 包管理和迁移 | 包数据库、依赖解析、脚本钩子、GPG 签名和迁移风险如何治理 | [23-包管理依赖解析仓库签名和升级迁移深度解析.md](23-包管理依赖解析仓库签名和升级迁移深度解析.md) |
| 生产故障 | 如何形成现场快照、止血、根因和防复发闭环 | [24-生产故障案例和排障剧本深度版.md](24-生产故障案例和排障剧本深度版.md) |
| 深度实验 | 如何用实验验证机制而不是死记命令 | [25-深度实验手册和能力验收.md](25-深度实验手册和能力验收.md) |

## 十一、深度验收清单

- 能用 `strace` 解释命令的关键系统调用和 errno。
- 能说明 `/proc/<pid>/fd`、`limits`、`cgroup`、`status` 的排障价值。
- 能解释 GRUB、kernel cmdline、initramfs、fstab、systemd mount unit 的关系。
- 能解释 VFS、inode、dentry、file object 和删除文件空间不释放。
- 能说明 page cache、dirty page、writeback、fsync 和 I/O wait 的关系。
- 能画出入站、出站和转发包经过 netfilter 的路径。
- 能区分 firewalld、ufw、iptables、nftables、netfilter、conntrack 的层级。
- 能区分 MemFree、MemAvailable、RSS、PSS、swap、OOM 和 cgroup OOM。
- 能解释 cgroup v1/v2 对 CentOS 7 和 Ubuntu 24.04 排障的影响。
- 能说明 DAC、ACL、capability、PAM、sudo、SELinux/AppArmor 的安全检查顺序。
- 能验证包文件完整性、检查仓库签名和识别脚本钩子风险。
- 能写出 CentOS 7 到 Ubuntu 24.04 的迁移检查表和回滚策略。
