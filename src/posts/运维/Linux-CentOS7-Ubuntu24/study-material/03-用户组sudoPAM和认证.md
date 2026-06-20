---
title: "Linux 学习资料：用户、组、sudo、PAM 和认证"
date: 2026-06-20
description: "Linux 的用户系统不仅是用户名和密码。内核真正识别的是 UID/GID；用户名只是用户态工具把 UID 映射成人类可读名称。登录认证涉及 /etc/passwd、/etc/shadow、PAM、SSH、sudo、日志和可能的集中认证系统…"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
category: "运维"
---

# Linux 学习资料：用户、组、sudo、PAM 和认证

[返回索引](../Linux学习资料.md)

## 学习目标

- 理解 Linux 用户、组、UID/GID、密码文件、shadow 文件和登录流程。
- 掌握 `useradd`、`usermod`、`passwd`、`sudoers`、PAM 和认证日志。
- 能安全配置 sudo 最小权限，并定位登录失败、sudo 失败和账号锁定问题。

## 理论导读

Linux 的用户系统不仅是用户名和密码。内核真正识别的是 UID/GID；用户名只是用户态工具把 UID 映射成人类可读名称。登录认证涉及 `/etc/passwd`、`/etc/shadow`、PAM、SSH、sudo、日志和可能的集中认证系统。生产环境中，账号和权限管理直接影响安全边界和审计能力。

sudo 不是“临时变成 root”这么简单。它是一套可审计、可限制、可按命令授权的提权机制。好的 sudo 配置应让用户完成必要操作，但不授予无边界 root shell。

## 核心心智模型

访问系统的身份链路：

```text
登录入口 SSH/TTY
  -> PAM 认证和账号策略
  -> 用户 UID/GID 和 supplementary groups
  -> Shell 或命令
  -> sudo 再次授权
  -> 日志记录
```

## 知识点详解

### 1. 用户和组文件

```bash
cat /etc/passwd
sudo cat /etc/shadow
cat /etc/group
```

`/etc/passwd` 字段：

```text
name:x:uid:gid:comment:home:shell
```

密码 hash 通常在 `/etc/shadow`，普通用户不能读。

查看身份：

```bash
id
id appuser
groups appuser
getent passwd appuser
getent group wheel
```

`getent` 比直接 cat 更通用，因为它会经过 NSS，可能查询本地文件、LDAP、SSSD 等来源。

### 2. 创建和管理用户

CentOS 7 和 Ubuntu 24.04 都有底层 `useradd`，Ubuntu 也常用交互式 `adduser`。

```bash
sudo useradd -m -s /bin/bash appuser
sudo passwd appuser
sudo usermod -aG wheel appuser     # CentOS 7 常见 sudo 组
sudo usermod -aG sudo appuser      # Ubuntu 24.04 常见 sudo 组
```

> **易错：** `usermod -G group user` 会覆盖附加组。
>
> 正确做法：追加组使用 `usermod -aG group user`。

### 3. sudo 和 sudoers

编辑 sudoers 必须使用：

```bash
sudo visudo
```

CentOS 7 常见管理员组：

```text
%wheel ALL=(ALL) ALL
```

Ubuntu 24.04 常见管理员组：

```text
%sudo ALL=(ALL:ALL) ALL
```

推荐在 `/etc/sudoers.d/` 添加独立文件：

```bash
sudo visudo -f /etc/sudoers.d/app-ops
```

示例：允许 `deploy` 重启指定服务，不给 root shell：

```text
deploy ALL=(root) NOPASSWD: /bin/systemctl restart nginx, /bin/systemctl reload nginx, /bin/systemctl status nginx
```

注意路径必须准确。不同系统 `systemctl` 可能在 `/usr/bin/systemctl`，先用：

```bash
command -v systemctl
```

### 4. PAM

PAM 是可插拔认证模块。SSH、sudo、login、su 等都可以通过 PAM 组合认证、账号策略、密码策略和 session 行为。

配置位置：

```bash
ls /etc/pam.d/
```

常见文件：

- `/etc/pam.d/sshd`
- `/etc/pam.d/sudo`
- `/etc/pam.d/su`
- `/etc/pam.d/login`

PAM 排查要非常谨慎。错误配置可能导致无法登录。生产改 PAM 前必须保留 root 控制台或回滚通道。

### 5. 登录日志差异

CentOS 7：

```bash
sudo tail -f /var/log/secure
sudo journalctl -u sshd
```

Ubuntu 24.04：

```bash
sudo tail -f /var/log/auth.log
sudo journalctl -u ssh
```

注意服务名通常不同：

| 系统 | SSH 服务名 |
| --- | --- |
| CentOS 7 | `sshd` |
| Ubuntu 24.04 | `ssh` |

### 6. 账号过期和锁定

```bash
chage -l appuser
sudo passwd -l appuser
sudo passwd -u appuser
sudo usermod -L appuser
sudo usermod -U appuser
```

查看失败登录：

```bash
last
lastlog
lastb 2>/dev/null || true
```

不同发行版和安全策略可能记录位置不同。

### 7. su 和 sudo 的区别

| 工具 | 机制 | 常见用途 |
| --- | --- | --- |
| `su - user` | 切换到目标用户，需要目标用户密码或 root 权限 | 切到服务用户验证环境 |
| `sudo command` | 当前用户通过 sudoers 授权执行命令 | 最小权限提权 |
| `sudo -i` | 获取 root 登录 shell | 应少用，审计粒度弱 |

生产更推荐按命令授权，而不是广泛给 `sudo -i`。

## 例子：排查 sudo 失败

现象：

```bash
deploy is not in the sudoers file
```

排查：

```bash
id deploy
sudo -l -U deploy
grep -R "deploy\\|%wheel\\|%sudo" /etc/sudoers /etc/sudoers.d 2>/dev/null
```

判断：

- 用户是否在正确组。
- sudoers 是否语法正确。
- 是否需要重新登录以刷新组成员关系。
- 命令路径是否与 sudoers 中路径一致。

## 练习

1. 创建 `deploy` 用户，禁止密码登录，只允许 SSH key 登录。
2. CentOS 7 上把 `deploy` 加入 `wheel`，Ubuntu 24.04 上加入 `sudo`。
3. 用 sudoers 只允许 `deploy` 重启 nginx。
4. 故意输错密码，分别查看认证日志。
5. 用 `getent passwd` 和 `id` 验证用户身份。

## 验收

- 能解释 UID/GID 与用户名/组名的关系。
- 能安全添加用户和附加组。
- 能使用 `visudo` 配置最小 sudo 权限。
- 能定位 SSH 登录失败和 sudo 失败原因。
- 能说明 CentOS 7 与 Ubuntu 24.04 的 sudo 组和 SSH 服务名差异。

## 重点

- 内核看 UID/GID，不看用户名字符串。
- `getent` 适合查询 NSS 后的真实用户来源。
- sudo 应按命令授权并保留审计。
- PAM 修改风险高，必须有回滚通道。

## 难点

- 登录失败可能来自 SSH 配置、PAM、账号锁定、密码过期、home 权限、密钥权限、SELinux/AppArmor 和网络策略，多因素要逐层排查。

## 易错

> **易错：** 用 `usermod -G sudo user` 添加组，导致用户原有附加组被清空。
>
> 正确做法：使用 `usermod -aG sudo user`。

> **易错：** 直接编辑 `/etc/sudoers`，语法错误后 sudo 全部不可用。
>
> 正确做法：使用 `visudo`，并优先写入 `/etc/sudoers.d/` 独立文件。

