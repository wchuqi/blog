---
title: "Linux 学习资料：文件系统、权限、ACL 和链接"
date: 2026-06-20
description: "Linux 中“一切皆文件”不是说所有东西都是普通文件，而是说很多资源都通过文件描述符或虚拟文件系统呈现。普通文件、目录、块设备、字符设备、管道、socket、procfs、sysfs 都能用统一的文件接口观察或操作。"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
category: "运维"
---

# Linux 学习资料：文件系统、权限、ACL 和链接

[返回索引](../Linux学习资料.md)

## 学习目标

- 理解 Linux 文件树、inode、目录项、硬链接、软链接和挂载点。
- 掌握权限位、umask、ACL、SUID、SGID、sticky bit 和目录权限。
- 能定位文件访问失败、权限异常、磁盘空间和 inode 耗尽问题。

## 理论导读

Linux 中“一切皆文件”不是说所有东西都是普通文件，而是说很多资源都通过文件描述符或虚拟文件系统呈现。普通文件、目录、块设备、字符设备、管道、socket、procfs、sysfs 都能用统一的文件接口观察或操作。

权限检查不是只看最终文件。访问 `/var/www/app/config.yml` 时，用户需要对路径上每一级目录有执行权限，才能穿过目录；对文件是否需要读写执行权限，则取决于具体操作。

## 核心心智模型

### 1. 文件名不是文件本体

目录项把文件名映射到 inode。inode 保存权限、所有者、大小、时间戳、数据块指针等元数据。硬链接是多个目录项指向同一个 inode；软链接是一个特殊文件，内容是另一个路径。

```text
filename -> inode -> data blocks
```

### 2. 目录的 x 权限是“进入/穿过”

目录权限：

- `r`：能列出目录项名称。
- `w`：能在目录中创建、删除、重命名条目。
- `x`：能进入目录或穿过目录访问内部对象。

这就是为什么有时文件本身是 644，但用户仍然无法读取，因为上级目录没有 `x` 权限。

## 知识点详解

### 1. FHS 目录结构

| 目录 | 作用 |
| --- | --- |
| `/bin`、`/usr/bin` | 用户命令 |
| `/sbin`、`/usr/sbin` | 系统管理命令 |
| `/etc` | 系统配置 |
| `/var` | 可变数据，如日志、缓存、spool |
| `/home` | 普通用户家目录 |
| `/root` | root 家目录 |
| `/tmp` | 临时文件，通常有 sticky bit |
| `/proc` | 进程和内核运行时信息，虚拟文件系统 |
| `/sys` | 设备和内核对象，虚拟文件系统 |
| `/dev` | 设备文件 |
| `/run` | 运行时状态，重启后清空 |

CentOS 7 和 Ubuntu 24.04 都遵循 FHS，但包安装路径和日志文件名可能不同。

### 2. 查看文件元数据

```bash
ls -l /etc/passwd
stat /etc/passwd
namei -l /var/www/html/index.html
```

`namei -l` 对权限排查很有价值，因为它能逐级显示路径权限。

### 3. 基础权限

```text
-rw-r--r-- 1 root root 1234 Jun  6 file
drwxr-xr-x 2 root root 4096 Jun  6 dir
```

权限分为 user、group、other 三组。数字表示：

- r = 4
- w = 2
- x = 1

```bash
chmod 640 file
chown app:app file
chgrp nginx file
```

### 4. umask

umask 决定新建文件默认权限中要扣掉哪些权限。

```bash
umask
umask 027
touch a
mkdir d
```

普通文件默认最高是 666，目录默认最高是 777。umask 027 下：

- 文件默认 640。
- 目录默认 750。

### 5. ACL

ACL 提供比传统 user/group/other 更细的权限。

```bash
getfacl file
setfacl -m u:alice:r file
setfacl -m g:dev:rx dir
setfacl -x u:alice file
```

默认 ACL 用于目录下新文件继承：

```bash
setfacl -m d:g:dev:rwX /srv/app
```

注意 ACL mask 会限制用户和组 ACL 的最大有效权限。

### 6. SUID、SGID、sticky bit

| 位 | 作用 | 例子 |
| --- | --- | --- |
| SUID | 执行文件时以文件 owner 权限运行 | `/usr/bin/passwd` |
| SGID 文件 | 执行时以文件 group 权限运行 | 少见 |
| SGID 目录 | 新建文件继承目录 group | 协作目录 |
| sticky bit 目录 | 只有文件 owner、目录 owner、root 可删除 | `/tmp` |

查看：

```bash
ls -ld /tmp
ls -l /usr/bin/passwd
```

设置：

```bash
chmod 2775 /srv/shared
chmod 1777 /srv/tmp
```

SUID 对脚本通常不生效，且高风险，生产应谨慎审计。

### 7. 硬链接和软链接

硬链接：

```bash
ln file hardlink
ls -li file hardlink
```

特点：

- 指向同一 inode。
- 不能跨文件系统。
- 通常不能给目录创建硬链接。

软链接：

```bash
ln -s /opt/app/current /usr/local/app
ls -l /usr/local/app
```

特点：

- 保存目标路径。
- 可跨文件系统。
- 目标不存在时变成 dangling symlink。

### 8. inode 耗尽

磁盘空间没满，但 inode 用完也无法创建文件。

```bash
df -h
df -i
```

大量小文件、缓存、session 文件、日志切片都可能导致 inode 耗尽。

## 例子：排查 Permission denied

问题：

```bash
cat /srv/app/config.yml
# Permission denied
```

排查：

```bash
id
ls -l /srv/app/config.yml
namei -l /srv/app/config.yml
getfacl /srv/app/config.yml
```

还要检查：

- 是否由 systemd 服务用户访问，而不是当前登录用户。
- 是否被 SELinux 或 AppArmor 拒绝。
- 文件系统是否只读挂载。

CentOS 7 SELinux：

```bash
getenforce
sudo ausearch -m avc -ts recent
```

Ubuntu 24.04 AppArmor：

```bash
sudo aa-status
sudo journalctl -k | grep -i apparmor
```

## 练习

1. 创建 `/srv/project`，设置 group 为 `dev`，让组内用户可协作写入，新文件继承组。
2. 用 ACL 给用户 `alice` 只读访问某文件。
3. 创建一个软链接和一个硬链接，删除原文件后观察差异。
4. 用 `namei -l` 排查一个路径访问失败案例。
5. 用 `df -i` 检查 inode 使用率。

## 验收

- 能解释 inode、目录项、硬链接和软链接。
- 能从 `ls -l` 判断文件类型和权限。
- 能解释目录 `x` 权限的意义。
- 能用 ACL 解决多人协作权限。
- 能区分传统权限拒绝和 SELinux/AppArmor 拒绝。

## 重点

- 文件访问要检查路径上每一级目录权限。
- ACL mask 会影响实际有效权限。
- `/tmp` 的 sticky bit 防止普通用户删除别人的文件。
- inode 耗尽和磁盘空间耗尽是两类问题。

## 难点

- 权限问题经常由传统权限、ACL、挂载选项、安全模块、服务运行用户多因素叠加导致。

## 易错

> **易错：** 为了解决访问问题直接 `chmod -R 777`。
>
> 正确做法：先确认访问主体、路径权限、ACL 和安全模块，再做最小授权。

> **易错：** 以为文件有读权限就一定能读。
>
> 正确做法：还要检查上级目录是否有执行权限，以及安全模块是否允许。

