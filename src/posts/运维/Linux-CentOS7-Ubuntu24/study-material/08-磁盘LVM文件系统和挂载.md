---
title: "Linux 学习资料：磁盘、LVM、文件系统和挂载"
date: 2026-06-20
description: "磁盘管理是生产 Linux 的高风险区域。数据从块设备到可访问路径要经过多个层次：物理盘或云盘、分区、LVM、文件系统、挂载点、权限和应用路径。任何一层配置错误，都可能表现为“目录不存在、空间不够、重启后挂载丢失、服务启动失败”。"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
category: "运维"
---

# Linux 学习资料：磁盘、LVM、文件系统和挂载

[返回索引](../Linux学习资料.md)

## 学习目标

- 理解块设备、分区表、文件系统、挂载点、inode、LVM 和 fstab。
- 掌握 `lsblk`、`blkid`、`fdisk`、`parted`、`mkfs`、`mount`、`findmnt`、LVM 常用命令。
- 能安全扩容磁盘、排查磁盘满、inode 满、挂载失败和文件系统错误。

## 理论导读

磁盘管理是生产 Linux 的高风险区域。数据从块设备到可访问路径要经过多个层次：物理盘或云盘、分区、LVM、文件系统、挂载点、权限和应用路径。任何一层配置错误，都可能表现为“目录不存在、空间不够、重启后挂载丢失、服务启动失败”。

CentOS 7 默认常见 XFS，Ubuntu 24.04 默认常见 ext4。XFS 扩容方便但不能在线缩小；ext4 支持扩容和在特定条件下缩小，但缩小风险高，生产应优先备份和重建方案。

## 核心心智模型

```text
磁盘 /dev/sdb
  -> 分区 /dev/sdb1
  -> LVM PV
  -> VG
  -> LV
  -> 文件系统 xfs/ext4
  -> mount 到 /data
  -> 应用读写 /data/app
```

## 知识点详解

### 1. 查看磁盘和挂载

```bash
lsblk -f
blkid
df -h
df -i
findmnt
mount | column -t
```

区别：

- `lsblk` 看块设备层级。
- `df` 看已挂载文件系统空间。
- `df -i` 看 inode。
- `findmnt` 看挂载关系和来源。
- `blkid` 看 UUID 和文件系统类型。

### 2. 分区表

常见：

- MBR：老式分区表，限制较多。
- GPT：现代分区表，适合大盘。

工具：

```bash
sudo fdisk -l
sudo parted -l
```

对大于 2TB 的磁盘优先 GPT。

### 3. 文件系统

CentOS 7 常见：

```bash
sudo mkfs.xfs /dev/mapper/vg_data-lv_data
```

Ubuntu 24.04 常见：

```bash
sudo mkfs.ext4 /dev/mapper/vg_data-lv_data
```

查看：

```bash
df -T
```

XFS 扩容：

```bash
sudo xfs_growfs /data
```

ext4 扩容：

```bash
sudo resize2fs /dev/mapper/vg_data-lv_data
```

### 4. LVM

LVM 三层：

- PV：physical volume。
- VG：volume group。
- LV：logical volume。

命令：

```bash
pvs
vgs
lvs
sudo pvcreate /dev/sdb1
sudo vgcreate vg_data /dev/sdb1
sudo lvcreate -n lv_data -L 20G vg_data
```

扩容流程：

```bash
sudo pvcreate /dev/sdc1
sudo vgextend vg_data /dev/sdc1
sudo lvextend -L +10G /dev/vg_data/lv_data
sudo xfs_growfs /data     # XFS
# 或
sudo resize2fs /dev/vg_data/lv_data  # ext4
```

也可以：

```bash
sudo lvextend -r -L +10G /dev/vg_data/lv_data
```

`-r` 会尝试同时扩展文件系统，但生产仍要确认文件系统类型和备份策略。

### 5. fstab

持久挂载配置：

```bash
sudo blkid
sudo vi /etc/fstab
```

推荐用 UUID：

```text
UUID=xxxx-xxxx /data xfs defaults,nofail 0 0
```

测试：

```bash
sudo mount -a
findmnt /data
```

远程机器上修改 fstab 前必须谨慎。错误 fstab 可能导致重启进 emergency mode。建议保留控制台。

### 6. 磁盘满和 inode 满

空间：

```bash
df -h
du -xh --max-depth=1 /var | sort -h
```

inode：

```bash
df -i
find /path -xdev -type f | wc -l
```

大文件删除后空间不释放，可能是进程仍打开文件：

```bash
sudo lsof +L1
```

处理方式是让进程关闭文件，通常重启相关服务或让应用重新打开日志。

### 7. swap

查看：

```bash
swapon --show
free -h
```

创建 swap 文件：

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

fstab：

```text
/swapfile none swap sw 0 0
```

swap 不是内存不足的根本解决方案。频繁 swap 会严重影响性能。

## 例子：安全新增数据盘

```bash
lsblk -f
sudo parted /dev/sdb --script mklabel gpt
sudo parted /dev/sdb --script mkpart primary 0% 100%
sudo pvcreate /dev/sdb1
sudo vgcreate vg_data /dev/sdb1
sudo lvcreate -n lv_data -l 100%FREE vg_data
sudo mkfs.xfs /dev/vg_data/lv_data
sudo mkdir -p /data
sudo mount /dev/vg_data/lv_data /data
df -h /data
```

写入 fstab 前先获取 UUID：

```bash
blkid /dev/vg_data/lv_data
```

然后：

```bash
sudo mount -a
findmnt /data
```

## 练习

1. 查看当前所有块设备、文件系统类型、挂载点。
2. 创建一个测试 LV，格式化并挂载到 `/mnt/lab`。
3. 写入 fstab 并用 `mount -a` 验证。
4. 扩容 LV 和文件系统。
5. 制造一个被删除但仍被进程占用的日志文件，使用 `lsof +L1` 找到。

## 验收

- 能解释块设备、分区、LVM、文件系统、挂载点关系。
- 能安全新增和扩容数据盘。
- 能区分磁盘空间满和 inode 满。
- 能说明 XFS 与 ext4 在扩缩容上的差异。
- 能排查 fstab 错误和被删除文件占用空间。

## 重点

- 修改磁盘和 fstab 前必须确认设备名、UUID 和回滚方式。
- 云环境中设备名可能变化，fstab 推荐 UUID。
- XFS 不能在线缩小。
- 删除大文件后空间不释放，优先查 `lsof +L1`。

## 难点

- 空间问题可能来自文件系统、inode、保留块、打开但已删除文件、挂载覆盖和容器 overlay，多层都要看。

## 易错

> **易错：** 把数据写入未挂载目录，后来挂载磁盘后以为数据丢了。
>
> 正确做法：挂载会遮住原目录内容。用 `findmnt` 确认挂载状态，必要时卸载后查看原目录。

> **易错：** 在 fstab 中使用不稳定的 `/dev/sdb1`。
>
> 正确做法：优先使用 UUID 或 LVM 路径，并执行 `mount -a` 验证。

