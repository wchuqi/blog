---
title: "Linux 学习路线图：CentOS 7 与 Ubuntu 24.04"
date: 2026-06-20
description: "这份路线图面向后端开发、运维、测试、数据工程和 SRE 入门到进阶学习。它不把 Linux 当成命令速查表，而是按“系统如何启动、资源如何管理、配置如何生效、故障如何定位”的主线学习，并持续对比 CentOS 7 和 Ubuntu 24.0…"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
  - "学习路线图"
category: "运维"
---

# Linux 学习路线图：CentOS 7 与 Ubuntu 24.04

这份路线图面向后端开发、运维、测试、数据工程和 SRE 入门到进阶学习。它不把 Linux 当成命令速查表，而是按“系统如何启动、资源如何管理、配置如何生效、故障如何定位”的主线学习，并持续对比 CentOS 7 和 Ubuntu 24.04。

> **版本背景：** CentOS 7 已在 2024-06-30 EOL，仍常见于存量生产环境；Ubuntu 24.04 LTS 是现代长期支持发行版。学习时要同时掌握存量维护和新环境交付能力。

## 阶段 1：基础认知和命令行

- 目标：理解 Linux 是内核、用户态工具、发行版和服务管理体系的组合，能独立在 Shell 中完成文件、文本、进程和帮助查询。
- 需要掌握：发行版差异、Shell、PATH、命令查找、man/info/help、管道、重定向、通配符、退出码。
- 例子：用 `type` 判断命令来自 shell builtin、alias 还是二进制；用 `man 5 passwd` 查看配置文件格式。
- 练习：分别在 CentOS 7 和 Ubuntu 24.04 上收集 `uname -a`、`cat /etc/os-release`、`systemctl --version`、`bash --version`。
- 验收：能解释命令找不到、权限不足、参数不兼容、发行版包名不同这几类问题。
- 重点：Linux 学习不是背命令，而是理解命令如何通过文件、进程、内核接口和服务管理器改变系统状态。
- 易错：把网上某条命令直接套用到不同发行版，不检查包管理器、服务名、配置路径和安全模块差异。

## 阶段 2：文件系统、权限和用户

- 目标：掌握 Linux 文件树、权限模型、用户组、sudo、PAM 和认证日志。
- 需要掌握：FHS、inode、硬链接、软链接、权限位、umask、ACL、SUID、SGID、sticky bit、UID/GID、sudoers、PAM。
- 例子：解释为什么 `chmod 777` 能临时解决问题，却会破坏最小权限和审计边界。
- 练习：创建普通用户、配置 sudo 免密执行指定命令、用 ACL 给某用户只读权限。
- 验收：能从 `ls -l`、`id`、`getfacl`、`namei -l` 判断访问失败原因。
- 重点：权限检查不是只看目标文件，还要看路径上每一级目录的执行权限。
- 易错：只给文件 `r` 权限，却忘记目录没有 `x` 权限导致无法访问。

## 阶段 3：软件包、服务和启动流程

- 目标：能安装、升级、回滚、排查软件包和 systemd 服务。
- 需要掌握：RPM/YUM、DEB/APT、仓库、GPG、依赖解析、systemd unit、target、journal、boot loader、kernel、initramfs。
- 例子：CentOS 7 用 `yum`/`rpm`，Ubuntu 24.04 用 `apt`/`dpkg`；服务都由 systemd 管，但版本和 unit 细节不同。
- 练习：安装 Nginx，查看 unit，修改监听端口，重载服务，查看日志。
- 验收：能解释 `systemctl enable`、`start`、`restart`、`reload`、`daemon-reload` 的区别。
- 重点：软件包负责安装文件，systemd 负责管理进程生命周期，二者不是一回事。
- 易错：修改 unit 文件后只 restart，不执行 `systemctl daemon-reload`。

## 阶段 4：网络、磁盘和常规运维

- 目标：能配置网络、DNS、防火墙、磁盘、LVM、文件系统、挂载、日志、定时任务和时间同步。
- 需要掌握：iproute2、ss、tcpdump、NetworkManager、netplan、firewalld、ufw、nftables/iptables、DNS、LVM、XFS、ext4、fstab、journalctl、rsyslog、cron、systemd timer、chrony。
- 例子：CentOS 7 常见 `firewall-cmd` 与 `/var/log/secure`；Ubuntu 24.04 常见 `ufw`、netplan、`/var/log/auth.log` 和 systemd-resolved。
- 练习：新增一块测试盘，分区、建 LVM、格式化、写 fstab，并用 `findmnt` 验证。
- 验收：能独立定位“端口监听但外部访问不通”的原因：监听地址、防火墙、路由、DNS、安全组、服务配置。
- 重点：网络和磁盘问题必须按层排查，不能只看单个命令结果。
- 易错：直接编辑 Ubuntu 24.04 的 `/etc/resolv.conf`，重启后发现被 systemd-resolved 或 netplan 覆盖。

## 阶段 5：Shell 自动化和文本处理

- 目标：能写可靠的 Shell 脚本，完成批量检查、部署前校验、日志分析和巡检。
- 需要掌握：变量、引用、数组、函数、条件、循环、退出码、trap、set 选项、grep、sed、awk、find、xargs、jq。
- 例子：写一个巡检脚本，输出 CPU、内存、磁盘、服务状态、监听端口和最近错误日志。
- 练习：实现一个脚本，支持 `--check` 只检查、`--fix` 执行修复，并记录日志。
- 验收：脚本能处理空格、命令失败、无匹配文件和重复执行。
- 重点：脚本可靠性来自严格错误处理、引用、幂等和日志，不是命令堆叠。
- 易错：`for f in $(ls)` 处理带空格文件名时出错。

## 阶段 6：安全、性能和故障排查

- 目标：具备生产环境 Linux 排障和加固能力。
- 需要掌握：SSH 安全、sudo 最小权限、SELinux、AppArmor、auditd、ulimit、cgroup、CPU、内存、I/O、网络、load average、OOM、日志剧本。
- 例子：CentOS 7 默认 SELinux；Ubuntu 24.04 默认 AppArmor。两者都是强制访问控制，但策略、工具和排查方式不同。
- 练习：模拟磁盘满、端口冲突、服务启动失败、CPU 飙高、内存泄漏、DNS 失败、权限拒绝。
- 验收：能写出每类故障的现象、证据、定位命令、临时止血和长期修复。
- 重点：生产排障先保存现场，再小步验证，不用重启掩盖证据。
- 易错：遇到权限问题第一反应 `setenforce 0` 或关闭安全模块，却不分析策略拒绝原因。

## 阶段 7：内核机制和系统深度

- 目标：理解 Linux 从系统调用、procfs/sysfs、VFS、page cache、网络栈、内存管理到 LSM 的底层运行机制。
- 需要掌握：syscall、errno、procfs、sysfs、udev、namespace、cgroup、VFS、inode、dentry、page cache、writeback、fsync、netfilter、conntrack、OOM、PSI、SELinux/AppArmor。
- 例子：解释一次 `curl http://host:port` 从 DNS、路由、netfilter、conntrack、socket 到应用日志的完整链路。
- 练习：完成系统调用、page cache、路由决策、conntrack、cgroup、SELinux/AppArmor 实验。
- 验收：能把命令输出和内核对象对应起来，而不是只背工具参数。
- 重点：深度 Linux 能力来自理解内核决策路径和用户态工具如何读取这些状态。
- 易错：把 `/proc` 当普通文件，把 firewalld/ufw 当防火墙全部，把 free 低当内存不足。

## 阶段 8：生产迁移和事故复盘

- 目标：能维护 CentOS 7 存量系统，能交付 Ubuntu 24.04 新环境，并能制定迁移和故障复盘方案。
- 需要掌握：CentOS 7 EOL 风险、仓库治理、包签名、配置合并、GRUB/initramfs/fstab 回滚、SSH/PAM 安全、systemd 依赖、迁移检查表。
- 例子：从 CentOS 7 迁移到 Ubuntu 24.04 时，映射 yum/rpm 到 apt/dpkg、ifcfg 到 netplan、firewalld 到 ufw/nftables、SELinux 到 AppArmor、cgroup v1 到 v2。
- 练习：写一份迁移评估报告和一次生产事故复盘。
- 验收：能给出可执行的迁移清单、回滚方案和验收标准。
- 重点：迁移不是替换命令，是重建系统边界和验证链路。
- 易错：把 vault 源当成 CentOS 7 安全治理完成。

## 推荐学习节奏

| 周期 | 学习重点 | 产出 |
| --- | --- | --- |
| 第 1 周 | Shell、帮助系统、文件和权限 | 能独立完成常用命令和权限排查 |
| 第 2 周 | 用户、sudo、软件包、systemd | 能安装服务并管理生命周期 |
| 第 3 周 | 网络、防火墙、DNS、磁盘、LVM | 能部署一台可用服务器 |
| 第 4 周 | 日志、定时任务、Shell 自动化 | 完成巡检脚本和日志分析 |
| 第 5 周 | 安全加固、SELinux/AppArmor、SSH | 完成安全基线 |
| 第 6 周 | 性能和故障排查 | 完成 8 个故障实验和复盘 |
| 第 7 周 | 内核、VFS、网络栈、内存、cgroup 深度机制 | 完成机制实验和解释报告 |
| 第 8 周 | 包管理、迁移、生产故障剧本 | 输出 CentOS 7 到 Ubuntu 24.04 迁移方案 |

## 最终能力清单

- 能解释 CentOS 7 与 Ubuntu 24.04 的生命周期、包管理、网络、防火墙和安全模块差异。
- 能独立完成用户、权限、软件包、服务、网络、磁盘和日志管理。
- 能读懂 systemd unit、journal 日志、启动流程和服务失败原因。
- 能写可靠 Shell 脚本，完成批量巡检和自动化任务。
- 能定位 CPU、内存、磁盘、网络、DNS、权限、SELinux/AppArmor 和服务启动故障。
- 能制定生产服务器初始化、安全加固、备份恢复和故障排查流程。
