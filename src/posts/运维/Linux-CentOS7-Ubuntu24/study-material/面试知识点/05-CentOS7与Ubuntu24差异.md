---
title: "Linux 面试知识点：CentOS 7 与 Ubuntu 24.04 差异"
date: 2026-06-20
description: "最大差异首先是生命周期：CentOS 7 已 EOL，不再有官方持续安全更新；Ubuntu 24.04 是 LTS，仍在支持期。其次是包生态、内核版本、systemd 版本、网络配置、防火墙、安全模块和日志路径。"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
  - "面试"
category: "运维"
---

# Linux 面试知识点：CentOS 7 与 Ubuntu 24.04 差异

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../Linux学习资料.md)

## 一、CentOS 7 与 Ubuntu 24.04 差异

### 1. CentOS 7 和 Ubuntu 24.04 最大的生产差异是什么？

**参考答案：**

最大差异首先是生命周期：CentOS 7 已 EOL，不再有官方持续安全更新；Ubuntu 24.04 是 LTS，仍在支持期。其次是包生态、内核版本、systemd 版本、网络配置、防火墙、安全模块和日志路径。

> **重点：** CentOS 7 应视为存量维护和迁移对象，不建议新项目继续选用。

### 2. 两者包管理如何对照？

**参考答案：**

CentOS 7 使用 RPM/YUM；Ubuntu 24.04 使用 DEB/APT。

```bash
# CentOS 7
yum install nginx
rpm -qf /usr/sbin/nginx

# Ubuntu 24.04
apt install nginx
dpkg -S /usr/sbin/nginx
```

> **易错：** 只替换安装命令，不检查包名、服务名、配置路径和版本。

### 3. 两者网络配置如何对照？

**参考答案：**

CentOS 7 常见 `/etc/sysconfig/network-scripts/ifcfg-*` 和 NetworkManager；Ubuntu 24.04 常见 netplan，配置在 `/etc/netplan/*.yaml`，再由 systemd-networkd 或 NetworkManager 接管。

```bash
# CentOS
nmcli connection show

# Ubuntu
sudo netplan try
resolvectl status
```

### 4. 两者防火墙如何对照？

**参考答案：**

CentOS 7 常用 firewalld：

```bash
firewall-cmd --list-all
firewall-cmd --add-service=http --permanent
firewall-cmd --reload
```

Ubuntu 24.04 常用 ufw：

```bash
ufw status verbose
ufw allow 80/tcp
```

Ubuntu 24.04 底层常见 nftables/iptables-nft，不能只用旧 iptables 思维判断。

### 5. 两者安全模块如何对照？

**参考答案：**

CentOS 7 默认常见 SELinux，关注上下文、类型、布尔值和 AVC 日志；Ubuntu 24.04 默认常见 AppArmor，关注 profile、路径规则和 kernel deny 日志。

```bash
# CentOS
getenforce
ausearch -m avc -ts recent

# Ubuntu
aa-status
journalctl -k | grep -i apparmor
```

### 6. 两者日志路径有什么差异？

**参考答案：**

CentOS 7 认证日志常在 `/var/log/secure`，系统消息在 `/var/log/messages`，yum 日志在 `/var/log/yum.log`。Ubuntu 24.04 认证日志常在 `/var/log/auth.log`，系统日志在 `/var/log/syslog`，apt/dpkg 日志在 `/var/log/apt/history.log` 和 `/var/log/dpkg.log`。

两者都可以使用 `journalctl` 查看 systemd 日志。

### 7. 从 CentOS 7 迁移到 Ubuntu 24.04，最容易漏哪些点？

**参考答案：**

常见遗漏：

- Python 2 脚本兼容。
- 包名和仓库差异。
- systemd 服务名和 unit 路径差异。
- ifcfg 到 netplan。
- firewalld 到 ufw/nftables。
- SELinux 到 AppArmor。
- `/var/log/secure` 到 `/var/log/auth.log`。
- iptables 规则和 nftables 兼容。
- cgroup v1 到 cgroup v2。
- OpenSSL、glibc、内核行为变化。

> **重点：** 迁移不是替换命令，而是验证应用、服务、网络、安全、日志和监控全链路。

