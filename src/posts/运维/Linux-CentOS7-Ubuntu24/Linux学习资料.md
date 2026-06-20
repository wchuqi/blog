---
title: "Linux 学习资料：CentOS 7 与 Ubuntu 24.04"
date: 2026-06-20
description: "这是一份索引文件。详细内容按知识点拆分到 study-material/ 目录，重点覆盖 Linux 基础、系统机制、日常运维、性能排障、安全加固、Shell 自动化，以及 CentOS 7 和 Ubuntu 24.04 的关键差异。"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
  - "学习资料总览"
category: "运维"
---

# Linux 学习资料：CentOS 7 与 Ubuntu 24.04

这是一份索引文件。详细内容按知识点拆分到 `study-material/` 目录，重点覆盖 Linux 基础、系统机制、日常运维、性能排障、安全加固、Shell 自动化，以及 CentOS 7 和 Ubuntu 24.04 的关键差异。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览、心智模型和发行版差异 | [00-总览心智模型和发行版差异.md](study-material/00-总览心智模型和发行版差异.md) |
| 1 | 命令行、Shell 和帮助系统 | [01-命令行Shell和帮助系统.md](study-material/01-命令行Shell和帮助系统.md) |
| 2 | 文件系统、权限、ACL 和链接 | [02-文件系统权限ACL和链接.md](study-material/02-文件系统权限ACL和链接.md) |
| 3 | 用户、组、sudo、PAM 和认证 | [03-用户组sudoPAM和认证.md](study-material/03-用户组sudoPAM和认证.md) |
| 4 | 软件包、仓库和版本管理 | [04-软件包仓库和版本管理.md](study-material/04-软件包仓库和版本管理.md) |
| 5 | systemd、启动流程、服务和日志 | [05-systemd启动流程服务和日志.md](study-material/05-systemd启动流程服务和日志.md) |
| 6 | 进程、信号、资源限制和调度 | [06-进程信号资源限制和调度.md](study-material/06-进程信号资源限制和调度.md) |
| 7 | 网络、防火墙、DNS 和排障 | [07-网络防火墙DNS和排障.md](study-material/07-网络防火墙DNS和排障.md) |
| 8 | 磁盘、LVM、文件系统和挂载 | [08-磁盘LVM文件系统和挂载.md](study-material/08-磁盘LVM文件系统和挂载.md) |
| 9 | 日志、时间同步、计划任务和审计 | [09-日志时间同步计划任务和审计.md](study-material/09-日志时间同步计划任务和审计.md) |
| 10 | Shell 脚本、文本处理和自动化 | [10-Shell脚本文本处理和自动化.md](study-material/10-Shell脚本文本处理和自动化.md) |
| 11 | 安全加固、SELinux、AppArmor 和 SSH | [11-安全加固SELinuxAppArmor和SSH.md](study-material/11-安全加固SELinuxAppArmor和SSH.md) |
| 12 | 性能监控和故障排查 | [12-性能监控和故障排查.md](study-material/12-性能监控和故障排查.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | Linux 完整知识点清单 | [14-Linux完整知识点清单.md](study-material/14-Linux完整知识点清单.md) |
| 15 | CentOS 7 与 Ubuntu 24.04 差异速查 | [15-CentOS7与Ubuntu24差异速查.md](study-material/15-CentOS7与Ubuntu24差异速查.md) |
| 16 | 实验手册和自测题 | [16-实验手册和自测题.md](study-material/16-实验手册和自测题.md) |
| 17 | 内核、系统调用、procfs 和 sysfs 深度解析 | [17-内核系统调用procfs和sysfs深度解析.md](study-material/17-内核系统调用procfs和sysfs深度解析.md) |
| 18 | 启动链路、GRUB、initramfs 和 systemd 深度解析 | [18-启动链路GRUBinitramfs和systemd深度解析.md](study-material/18-启动链路GRUBinitramfs和systemd深度解析.md) |
| 19 | VFS、Page Cache、I/O 路径和文件系统深度解析 | [19-VFSPageCacheIO路径和文件系统深度解析.md](study-material/19-VFSPageCacheIO路径和文件系统深度解析.md) |
| 20 | 网络栈、路由、conntrack 和 netfilter 深度解析 | [20-网络栈路由conntrack和netfilter深度解析.md](study-material/20-网络栈路由conntrack和netfilter深度解析.md) |
| 21 | 内存管理、OOM、cgroup 和容器资源深度解析 | [21-内存管理OOMcgroup和容器资源深度解析.md](study-material/21-内存管理OOMcgroup和容器资源深度解析.md) |
| 22 | SELinux、AppArmor、PAM 和 sudo 安全深度解析 | [22-SELinuxAppArmorPAM和sudo安全深度解析.md](study-material/22-SELinuxAppArmorPAM和sudo安全深度解析.md) |
| 23 | 包管理依赖解析、仓库签名和升级迁移深度解析 | [23-包管理依赖解析仓库签名和升级迁移深度解析.md](study-material/23-包管理依赖解析仓库签名和升级迁移深度解析.md) |
| 24 | 生产故障案例和排障剧本深度版 | [24-生产故障案例和排障剧本深度版.md](study-material/24-生产故障案例和排障剧本深度版.md) |
| 25 | 深度实验手册和能力验收 | [25-深度实验手册和能力验收.md](study-material/25-深度实验手册和能力验收.md) |

## 使用建议

- 系统学习：按 0 到 16 顺序学习，每章完成练习。
- 存量运维：重点读 0、4、5、7、8、11、12、15，特别关注 CentOS 7 EOL 风险。
- 新环境交付：重点读 Ubuntu 24.04 的 netplan、systemd-resolved、AppArmor、apt、nftables/ufw 和 cloud-init。
- 面试复习：先读 [14-Linux完整知识点清单.md](study-material/14-Linux完整知识点清单.md)，再读 [13-面试知识点整理.md](study-material/13-面试知识点整理.md)。
- 排障专项：重点读 5、7、8、9、11、12、16。
- 深度机制专项：重点读 17、18、19、20、21、22。
- 生产迁移专项：重点读 15、23、24、25。

## 环境假设

- CentOS 7：systemd 219、yum/rpm、firewalld、NetworkManager 或 network-scripts、SELinux、rsyslog、chronyd。CentOS 7 已 EOL。
- Ubuntu 24.04 LTS：systemd 255 系列、apt/dpkg、netplan、systemd-resolved、ufw/nftables、AppArmor、journald/rsyslog、chrony 或 systemd-timesyncd。Ubuntu 24.04 是当前 LTS 版本。
- 命令示例默认在测试环境执行。涉及磁盘、用户、服务、权限和防火墙的操作，生产执行前必须备份配置并确认回滚方式。

## 学习验收

完成本资料后，你应该能够：

- 从发行版、内核、systemd、包管理器和安全模块层面判断环境差异。
- 独立配置服务、网络、防火墙、用户权限、磁盘挂载和日志。
- 能解释 Linux 权限、进程、文件系统、启动流程和网络栈的机制。
- 能写可靠 Shell 脚本，并处理错误、引用、并发和幂等。
- 能定位常见生产故障，并写出排障记录。
- 能回答 Linux 运维、后端、SRE 面试中的机制题和场景题。
