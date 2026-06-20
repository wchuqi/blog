---
title: "Linux 面试知识点：用户、软件包和 systemd"
date: 2026-06-20
description: "/etc/passwd 保存用户名、UID、GID、注释、家目录和 shell 等公开账号信息；现代系统中密码 hash 存在 /etc/shadow，只有 root 可读。认证时还可能经过 PAM、NSS、LDAP、SSSD 等机制。"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
  - "面试"
category: "运维"
---

# Linux 面试知识点：用户、软件包和 systemd

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../Linux学习资料.md)

## 一、用户、软件包和 systemd

### 1. `/etc/passwd` 和 `/etc/shadow` 分别存什么？

**参考答案：**

`/etc/passwd` 保存用户名、UID、GID、注释、家目录和 shell 等公开账号信息；现代系统中密码 hash 存在 `/etc/shadow`，只有 root 可读。认证时还可能经过 PAM、NSS、LDAP、SSSD 等机制。

```bash
getent passwd root
sudo getent shadow root
```

> **重点：** 内核识别 UID/GID，用户名是用户态映射。

### 2. `usermod -G` 和 `usermod -aG` 有什么区别？

**参考答案：**

`usermod -G group user` 会设置用户附加组列表，可能覆盖原有附加组；`usermod -aG group user` 会追加组。给用户加 sudo/wheel 权限时应使用 `-aG`。

```bash
sudo usermod -aG sudo deploy
sudo usermod -aG wheel deploy
```

> **易错：** 忘记 `-a` 导致用户失去原有组权限。

### 3. sudoers 为什么要用 visudo？

**参考答案：**

`visudo` 会在保存前检查 sudoers 语法，防止语法错误导致 sudo 不可用。生产更推荐在 `/etc/sudoers.d/` 写独立文件，并按命令最小授权。

```bash
sudo visudo -f /etc/sudoers.d/deploy
```

> **重点：** sudo 配置错误可能让远程系统失去可管理性。

### 4. RPM/YUM 和 DEB/APT 有什么区别？

**参考答案：**

RPM 和 DEB 是包格式及底层包数据库体系；YUM 和 APT 是上层依赖解析和仓库管理工具。CentOS 7 使用 RPM/YUM，Ubuntu 24.04 使用 DEB/APT。

CentOS：

```bash
rpm -qf /usr/bin/bash
yum info bash
```

Ubuntu：

```bash
dpkg -S /usr/bin/bash
apt show bash
```

> **重点：** 包管理器维护安装状态，手工覆盖系统文件会破坏可审计性。

### 5. `systemctl enable` 和 `systemctl start` 有什么区别？

**参考答案：**

`start` 是立即启动服务；`enable` 是设置开机自动启动，不会立即启动。可以用 `enable --now` 同时设置开机启动并立即启动。

```bash
sudo systemctl enable --now nginx
```

> **易错：** 执行 enable 后以为服务已经运行。

### 6. 修改 systemd unit 后为什么要 `daemon-reload`？

**参考答案：**

systemd 会缓存 unit 配置。修改 unit 文件或 drop-in 后，需要 `systemctl daemon-reload` 让 PID 1 重新读取配置，否则 restart 可能仍使用旧配置。

```bash
sudo systemctl daemon-reload
sudo systemctl restart nginx
```

> **重点：** 修改应用配置和修改 unit 是两件事。应用配置 reload 不需要 daemon-reload，unit 变更需要。

### 7. `After=` 和 `Requires=` 有什么区别？

**参考答案：**

`After=` 只定义启动顺序，不定义依赖关系；`Requires=` 定义强依赖，依赖失败通常会影响当前 unit。需要网络真正在线时，通常使用 `Wants=network-online.target` 和 `After=network-online.target`，并确保 wait-online 服务工作。

> **易错：** 以为 `After=network.target` 表示网络已可用。

