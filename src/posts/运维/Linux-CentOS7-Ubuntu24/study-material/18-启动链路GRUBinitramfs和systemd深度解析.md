---
title: "Linux 学习资料：启动链路、GRUB、initramfs 和 systemd 深度解析"
date: 2026-06-20
description: "Linux 启动不是“开机后 systemd 启动服务”这么简单。在 systemd 成为 PID 1 之前，固件要找到 bootloader，bootloader 要加载内核和 initramfs，内核要初始化硬件和内存，initramf…"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
  - "深度解析"
category: "运维"
---

# Linux 学习资料：启动链路、GRUB、initramfs 和 systemd 深度解析

[返回索引](../Linux学习资料.md)

## 学习目标

- 理解从 BIOS/UEFI 到 systemd target 的完整启动链路。
- 掌握 GRUB、kernel command line、initramfs、rootfs、fstab、systemd unit 之间的关系。
- 能排查无法启动、进 emergency mode、挂载失败、内核参数错误和服务依赖错误。
- 能对比 CentOS 7 与 Ubuntu 24.04 的启动工具和配置生成方式。

## 理论导读

Linux 启动不是“开机后 systemd 启动服务”这么简单。在 systemd 成为 PID 1 之前，固件要找到 bootloader，bootloader 要加载内核和 initramfs，内核要初始化硬件和内存，initramfs 要找到真正的 root 文件系统并切换过去。任何一环失败，都可能表现为黑屏、kernel panic、找不到 root、进 dracut/initramfs shell 或 emergency mode。

systemd 之后的启动也不是简单串行。systemd 会根据 unit 依赖图并行启动服务。`After=`、`Wants=`、`Requires=`、mount unit、device unit、target 共同决定启动顺序和失败传播。

## 核心心智模型

```text
BIOS/UEFI
  -> GRUB
  -> kernel + kernel cmdline
  -> initramfs
  -> mount real root filesystem
  -> switch_root
  -> systemd PID 1
  -> local-fs.target / network.target / multi-user.target
  -> application services
```

## 知识点详解

## 一、固件和 bootloader

BIOS/UEFI 负责硬件初始化并交给 bootloader。GRUB 负责选择内核、传递 kernel command line、加载 initramfs。

查看启动方式：

```bash
test -d /sys/firmware/efi && echo UEFI || echo BIOS
```

查看内核命令行：

```bash
cat /proc/cmdline
```

常见参数：

| 参数 | 作用 |
| --- | --- |
| `root=` | 指定 root 文件系统 |
| `ro` / `rw` | 初始挂载只读或读写 |
| `quiet` | 减少启动输出 |
| `rhgb` | RHEL/CentOS 图形启动相关 |
| `systemd.unit=` | 指定启动目标，如 rescue.target |
| `selinux=0` | 禁用 SELinux，生产不建议长期使用 |
| `apparmor=0` | 禁用 AppArmor，生产不建议长期使用 |

## 二、CentOS 7 GRUB 配置

CentOS 7 常见 GRUB2 配置：

```bash
sudo grubby --default-kernel
sudo grubby --info=ALL | head -80
cat /etc/default/grub
```

生成配置：

BIOS 常见：

```bash
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

UEFI 常见路径可能是：

```bash
sudo grub2-mkconfig -o /boot/efi/EFI/centos/grub.cfg
```

生产中不要盲目覆盖 GRUB 配置路径。先确认启动方式和实际文件。

## 三、Ubuntu 24.04 GRUB 配置

Ubuntu 常见：

```bash
cat /etc/default/grub
sudo update-grub
```

`update-grub` 本质上调用 grub-mkconfig 生成配置。Ubuntu 也可能有 `/boot/efi/EFI/ubuntu/`。

修改 GRUB 前建议：

- 记录原配置。
- 确保有控制台。
- 不要删除旧内核。
- 测试内核参数前预留回退项。

## 四、initramfs

initramfs 是早期用户空间，用来在真正 rootfs 挂载前加载必要驱动、解锁磁盘、激活 LVM/RAID、挂载 root。

CentOS 7 常用 dracut：

```bash
lsinitrd /boot/initramfs-$(uname -r).img | head
sudo dracut -f
```

Ubuntu 24.04 常用 initramfs-tools：

```bash
lsinitramfs /boot/initrd.img-$(uname -r) | head
sudo update-initramfs -u
```

如果 rootfs 所在的存储驱动、LVM、加密模块没有进入 initramfs，系统可能启动时找不到 root。

## 五、rootfs 和 fstab

内核挂载 rootfs 后，systemd 会继续处理 `/etc/fstab` 中的挂载。fstab 错误是进入 emergency mode 的高频原因。

检查：

```bash
findmnt --verify
sudo mount -a
systemctl list-units --type=mount
```

systemd 会把 fstab 生成 `.mount` unit。某个挂载失败可能阻塞 `local-fs.target`，进而影响后续服务。

fstab 风险控制：

- 使用 UUID 或 LVM 路径。
- 非关键挂载可用 `nofail`。
- 网络挂载加 `_netdev`。
- 修改后执行 `mount -a` 和 `findmnt --verify`。
- 远程机器保留控制台。

## 六、systemd 依赖图

查看默认目标：

```bash
systemctl get-default
```

查看启动耗时：

```bash
systemd-analyze
systemd-analyze blame | head
systemd-analyze critical-chain
```

查看依赖：

```bash
systemctl list-dependencies multi-user.target
systemctl list-dependencies nginx.service
```

systemd 不是按文件名顺序启动，而是按依赖图并行调度。

## 七、emergency/rescue 模式

进入 rescue：

```bash
sudo systemctl rescue
```

进入 emergency：

```bash
sudo systemctl emergency
```

启动时临时指定：

```text
systemd.unit=rescue.target
```

排查思路：

- 看 `journalctl -xb`。
- 检查 fstab。
- 检查 rootfs 是否只读。
- 检查磁盘 UUID 是否变化。
- 检查内核参数和 initramfs。

## 八、服务启动顺序和 network-online

常见错误：

```ini
After=network.target
```

这只表示在 network.target 之后，不保证网络配置完成、DNS 可用或远端服务可达。

需要网络在线：

```ini
[Unit]
Wants=network-online.target
After=network-online.target
```

还要确认对应 wait-online 服务：

CentOS/NetworkManager：

```bash
systemctl status NetworkManager-wait-online.service
```

Ubuntu/systemd-networkd：

```bash
systemctl status systemd-networkd-wait-online.service
```

不要滥用 network-online，否则会拖慢启动或让系统因网络问题长时间等待。

## 九、典型故障案例

### 案例 1：修改 fstab 后重启进入 emergency

证据：

```bash
journalctl -xb
findmnt --verify
cat /etc/fstab
blkid
```

处理：

1. remount root 为读写：

```bash
mount -o remount,rw /
```

2. 修复 fstab。
3. `mount -a` 验证。
4. `systemctl default` 继续启动。

### 案例 2：升级内核后无法启动

处理思路：

- 从 GRUB 选择旧内核启动。
- 查看 `/boot` 空间是否满。
- 重新生成 initramfs。
- 检查第三方驱动。
- 不要删除可用旧内核。

CentOS：

```bash
sudo dracut -f
```

Ubuntu：

```bash
sudo update-initramfs -u -k all
sudo update-grub
```

### 案例 3：服务偶发开机启动失败，手动启动成功

常见原因：

- 依赖网络或磁盘，但 unit 只写了 `After=network.target`。
- 环境变量在登录 shell 中有，systemd 中没有。
- 服务启动太早，配置或证书还没挂载。
- 权限或安全模块在启动阶段不同。

排查：

```bash
journalctl -u service -b
systemctl cat service
systemd-analyze critical-chain service
```

## 练习

1. 查看当前启动方式是 BIOS 还是 UEFI。
2. 查看 `/proc/cmdline` 并解释其中每个参数。
3. 分别在 CentOS 7 和 Ubuntu 24.04 上找到 GRUB 默认配置文件。
4. 查看 initramfs 内容。
5. 故意在测试环境 fstab 增加一个带 `nofail` 的不存在挂载，观察启动影响。
6. 用 `systemd-analyze critical-chain` 找启动慢的服务。

## 验收

- 能画出从固件到 systemd 的启动链路。
- 能说明 initramfs 为什么存在。
- 能区分 GRUB 配置源文件和生成文件。
- 能解释 fstab 如何变成 systemd mount unit。
- 能排查 emergency mode、网络依赖和服务启动顺序问题。

## 重点

- 修改 GRUB、initramfs、fstab 都属于高风险操作，必须有控制台和回滚路径。
- systemd 按依赖图并行启动，不是线性脚本。
- `After=` 是顺序，不是依赖；`network.target` 不等于网络可用。
- CentOS 7 和 Ubuntu 24.04 生成 initramfs 的工具不同。

## 难点

- 同一个“开机启动失败，手动启动成功”可能来自网络时序、挂载时序、环境变量、安全模块、服务用户或依赖声明错误。

## 易错

> **易错：** 远程修改 fstab 后不执行 `mount -a`，直接重启。
>
> 正确做法：先 `findmnt --verify` 和 `mount -a`，并确保有控制台回滚。

> **易错：** 删除所有旧内核节省 `/boot` 空间。
>
> 正确做法：至少保留一个已验证可启动的旧内核。

