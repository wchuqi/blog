---
title: "Linux 学习资料：CentOS 7 与 Ubuntu 24.04 差异速查"
date: 2026-06-20
description: "从 CentOS 7 迁移到 Ubuntu 24.04 时重点检查："
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
category: "运维"
---

# Linux 学习资料：CentOS 7 与 Ubuntu 24.04 差异速查

[返回索引](../Linux学习资料.md)

## 一、版本和生命周期

| 项目 | CentOS 7 | Ubuntu 24.04 |
| --- | --- | --- |
| 当前定位 | 存量维护、迁移对象 | 新环境 LTS 选择 |
| 生命周期 | 2024-06-30 EOL | 标准 LTS 支持到 2029，Ubuntu Pro 可延长 |
| 内核 | 3.10 系列加 backport | 6.8 系列 |
| systemd | 219 | 255 系列 |
| 安全风险 | 无官方持续安全更新 | 仍在支持期 |

## 二、包管理

| 任务 | CentOS 7 | Ubuntu 24.04 |
| --- | --- | --- |
| 安装包 | `yum install package` | `apt install package` |
| 更新索引 | `yum makecache` | `apt update` |
| 升级包 | `yum update package` | `apt upgrade package` |
| 查询包文件 | `rpm -ql package` | `dpkg -L package` |
| 查询文件归属 | `rpm -qf /path` | `dpkg -S /path` |
| 查提供者 | `yum provides '*/cmd'` | `apt-file search /path` |
| 版本锁 | `yum-plugin-versionlock` | `apt-mark hold` |
| 扩展仓库 | EPEL、内部 yum repo | PPA、第三方 apt repo、snap |

## 三、服务和日志

| 任务 | CentOS 7 | Ubuntu 24.04 |
| --- | --- | --- |
| 服务管理 | `systemctl` | `systemctl` |
| SSH 服务名 | `sshd` | `ssh` |
| 认证日志 | `/var/log/secure` | `/var/log/auth.log` |
| 系统日志 | `/var/log/messages` | `/var/log/syslog` |
| 包管理日志 | `/var/log/yum.log` | `/var/log/apt/history.log`、`/var/log/dpkg.log` |
| journal | journald，可能未持久化 | journald，常与 rsyslog 并存 |

## 四、网络和 DNS

| 任务 | CentOS 7 | Ubuntu 24.04 |
| --- | --- | --- |
| 持久网络配置 | `/etc/sysconfig/network-scripts/ifcfg-*`、NetworkManager | `/etc/netplan/*.yaml` |
| 网络工具 | `nmcli`、`ip` | `netplan`、`networkctl`、`nmcli`、`ip` |
| DNS 管理 | NetworkManager 或 resolv.conf | systemd-resolved 常见 |
| 查看 DNS | `cat /etc/resolv.conf` | `resolvectl status`、`cat /etc/resolv.conf` |
| 临时 IP | `ip addr add` | `ip addr add` |

## 五、防火墙

| 任务 | CentOS 7 | Ubuntu 24.04 |
| --- | --- | --- |
| 常用前端 | firewalld | ufw |
| 查看状态 | `firewall-cmd --state` | `ufw status verbose` |
| 放行 HTTP | `firewall-cmd --add-service=http --permanent && firewall-cmd --reload` | `ufw allow 80/tcp` |
| 底层 | iptables 常见 | nftables/iptables-nft 常见 |

## 六、安全模块

| 项目 | CentOS 7 | Ubuntu 24.04 |
| --- | --- | --- |
| 默认 MAC | SELinux | AppArmor |
| 查看状态 | `getenforce`、`sestatus` | `aa-status` |
| 日志 | audit AVC | kernel/journal AppArmor deny |
| 修复思路 | 文件上下文、端口类型、布尔值、策略 | profile 路径规则、能力、模式 |
| 常见工具 | `restorecon`、`semanage`、`ausearch` | `aa-complain`、`aa-enforce` |

## 七、磁盘和文件系统

| 项目 | CentOS 7 | Ubuntu 24.04 |
| --- | --- | --- |
| 常见默认 FS | XFS | ext4 常见 |
| XFS 扩容 | `xfs_growfs /mount` | 如果使用 XFS 同样适用 |
| ext4 扩容 | `resize2fs device` | `resize2fs device` |
| LVM | 常见 | 可用但默认不一定使用 |
| fstab 建议 | UUID/LVM 路径 | UUID/LVM 路径 |

## 八、时间和计划任务

| 任务 | CentOS 7 | Ubuntu 24.04 |
| --- | --- | --- |
| 时间查看 | `timedatectl` | `timedatectl` |
| 时间同步 | chronyd 常见 | systemd-timesyncd 或 chrony |
| cron 服务 | `crond` | `cron` |
| timer | systemd timer | systemd timer |

## 九、迁移注意点

从 CentOS 7 迁移到 Ubuntu 24.04 时重点检查：

- 包名和仓库来源。
- systemd unit 路径和服务名。
- Python 2 脚本兼容性。
- OpenSSL、glibc、编译依赖兼容性。
- ifcfg 网络配置迁移到 netplan。
- firewalld 规则迁移到 ufw/nftables。
- SELinux 策略迁移到 AppArmor 思路。
- 日志路径、logrotate 配置和审计规则。
- cron 环境和 systemd timer。
- 应用对旧内核行为、cgroup v1、iptables 的依赖。

## 十、命令对照

```bash
# 系统信息
cat /etc/os-release
uname -r
systemctl --version

# 包归属
rpm -qf /path        # CentOS
dpkg -S /path        # Ubuntu

# 服务日志
journalctl -u sshd   # CentOS SSH
journalctl -u ssh    # Ubuntu SSH

# 防火墙
firewall-cmd --list-all
ufw status verbose

# DNS
cat /etc/resolv.conf
resolvectl status
```

## 重点

- CentOS 7 的 EOL 是生产风险，不是普通版本差异。
- Ubuntu 24.04 的网络和 DNS 多由生成器管理，不应直接改生成结果。
- 安全模块从 SELinux 切到 AppArmor，不是简单关闭安全策略。

## 易错

> **易错：** 迁移时只替换包安装命令。
>
> 正确做法：同时迁移服务名、配置路径、网络、日志、安全模块、脚本解释器和监控规则。

