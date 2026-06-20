---
title: "Linux 学习资料：安全加固、SELinux、AppArmor 和 SSH"
date: 2026-06-20
description: "Linux 安全不是一个开关。传统权限控制用户和组能做什么，sudo 控制提权，防火墙控制网络入口，SSH 控制远程登录，SELinux/AppArmor 提供强制访问控制，auditd 提供审计证据。生产加固要组合这些层，而不是只改一个配…"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
category: "运维"
---

# Linux 学习资料：安全加固、SELinux、AppArmor 和 SSH

[返回索引](../Linux学习资料.md)

## 学习目标

- 掌握 Linux 主机安全基线：SSH、安全更新、sudo、最小权限、防火墙、日志审计。
- 理解 SELinux 与 AppArmor 的差异和排查方法。
- 能处理“权限正确但仍被拒绝”的强制访问控制问题。

## 理论导读

Linux 安全不是一个开关。传统权限控制用户和组能做什么，sudo 控制提权，防火墙控制网络入口，SSH 控制远程登录，SELinux/AppArmor 提供强制访问控制，auditd 提供审计证据。生产加固要组合这些层，而不是只改一个配置。

CentOS 7 默认常见 SELinux，Ubuntu 24.04 默认常见 AppArmor。两者都是 MAC，但模型不同：SELinux 主要基于标签和策略类型，AppArmor 主要基于程序 profile 和路径规则。

## 核心心智模型

安全访问判断：

```text
用户身份和组
  -> 传统权限和 ACL
  -> sudo/PAM
  -> SELinux 或 AppArmor
  -> 防火墙和网络策略
  -> 应用自身认证授权
```

任一层拒绝，操作都会失败。

## 知识点详解

### 1. SSH 加固

配置文件：

```bash
sudo sshd -t
sudo vi /etc/ssh/sshd_config
```

常见建议：

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy
```

服务名差异：

CentOS 7：

```bash
sudo systemctl reload sshd
```

Ubuntu 24.04：

```bash
sudo systemctl reload ssh
```

远程改 SSH 前必须保留现有会话，先用 `sshd -t` 验证语法。

### 2. sudo 最小权限

不要给应用用户完整 root 权限。按命令授权：

```text
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx
```

注意命令路径、参数通配和 shell escape 风险。某些命令如 `vim`、`less`、`tar`、`find` 可能逃逸到 shell，不适合直接授权。

### 3. 防火墙基线

只开放必要端口。

CentOS 7：

```bash
sudo firewall-cmd --list-all
sudo firewall-cmd --add-service=ssh --permanent
sudo firewall-cmd --reload
```

Ubuntu 24.04：

```bash
sudo ufw status verbose
sudo ufw allow OpenSSH
sudo ufw enable
```

启用防火墙前确认 SSH 已放行，避免远程断连。

### 4. SELinux

查看：

```bash
getenforce
sestatus
ls -Z /var/www/html
```

临时切换 permissive：

```bash
sudo setenforce 0
sudo setenforce 1
```

生产不应把关闭 SELinux 当长期方案。排查拒绝：

```bash
sudo ausearch -m avc -ts recent
sudo sealert -a /var/log/audit/audit.log 2>/dev/null || true
```

恢复上下文：

```bash
sudo restorecon -Rv /var/www/html
```

允许 httpd 连接网络数据库示例：

```bash
sudo setsebool -P httpd_can_network_connect_db on
```

SELinux 核心是：进程上下文、文件上下文、端口类型和策略是否允许。

### 5. AppArmor

Ubuntu 24.04 查看：

```bash
sudo aa-status
sudo journalctl -k | grep -i apparmor
```

profile 位置：

```bash
ls /etc/apparmor.d/
```

模式：

- enforce：强制阻止。
- complain：只记录不阻止。

```bash
sudo aa-complain /path/to/profile
sudo aa-enforce /path/to/profile
```

AppArmor 多按程序和路径规则控制，排查时要看被哪个 profile 拒绝访问哪个路径或能力。

### 6. 安全更新

CentOS 7 已 EOL，不能依赖官方持续安全更新。应迁移到受支持发行版或购买延长支持。

Ubuntu 24.04：

```bash
apt list --upgradable
sudo apt upgrade
```

生产更新要有测试、窗口、回滚和重启计划，尤其是内核、glibc、openssl、openssh。

### 7. 审计和基线检查

```bash
sudo auditctl -s
sudo ausearch -k passwd_changes
sudo journalctl -p warning -b
```

检查高危 SUID：

```bash
find / -perm -4000 -type f -xdev -ls 2>/dev/null
```

检查开放端口：

```bash
ss -lntup
```

检查空密码或异常账号：

```bash
sudo awk -F: '($2==""){print $1}' /etc/shadow
awk -F: '$3==0 {print $1}' /etc/passwd
```

## 例子：权限 644 但 Nginx 仍无法读文件

排查：

```bash
namei -l /var/www/html/index.html
ls -l /var/www/html/index.html
```

CentOS 7 SELinux：

```bash
getenforce
ls -Z /var/www/html/index.html
sudo ausearch -m avc -ts recent
sudo restorecon -Rv /var/www/html
```

Ubuntu 24.04 AppArmor：

```bash
sudo aa-status
sudo journalctl -k | grep -i apparmor
```

## 练习

1. 禁止 root SSH 登录，改用普通用户 sudo。
2. 配置 SSH key 登录并关闭密码登录。
3. CentOS 7 上查看 SELinux 上下文并恢复一个目录上下文。
4. Ubuntu 24.04 上查看 AppArmor profile 状态。
5. 用防火墙只开放 SSH 和 HTTP。
6. 列出系统 SUID 文件并识别高风险项。

## 验收

- 能说明传统权限、sudo、SELinux/AppArmor 的边界。
- 能安全修改 SSH 配置并验证。
- 能定位 SELinux AVC 拒绝和 AppArmor deny 日志。
- 能按最小权限配置 sudo。
- 能说出 CentOS 7 EOL 的安全含义。

## 重点

- 不要把关闭 SELinux/AppArmor 当长期修复。
- 修改 SSH 前先验证配置并保留会话。
- sudo 授权要防止命令逃逸。
- 安全更新要结合生命周期和回滚。

## 难点

- SELinux 错误经常被误判为普通文件权限。必须同时看 DAC 权限和 MAC 拒绝日志。

## 易错

> **易错：** 权限问题直接 `setenforce 0`。
>
> 正确做法：用 audit 日志定位拒绝原因，修复上下文、布尔值或策略。

> **易错：** 给运维用户 `NOPASSWD: ALL`。
>
> 正确做法：按命令最小授权，并审计高风险命令。

