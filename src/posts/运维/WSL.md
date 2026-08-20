---
title: WSL 全面指南：架构、原理、配置与实战
date: 2026-06-20
description: 从 WSL2 的底层架构到日常开发实战，覆盖内核、文件系统、网络、GPU、Docker、systemd、多发行版管理、性能调优、安全模型与常见排障。面向开发者和运维人员的完整参考。
tags:
  - "运维"
  - "WSL"
  - "Windows"
  - "Linux"
review:
  created: 2026-06-20
  lastReview: 2026-06-20
  reps: 0
  interval: 0
  ease: 2.5
---

# WSL 全面指南：架构、原理、配置与实战
WSL（Windows Subsystem for Linux）不是虚拟机，也不是模拟器——它是微软在 Windows 内核中嵌入的真实 Linux 内核，让开发者在不离开 Windows 的前提下获得原生 Linux 环境。本文从架构原理到日常实战，覆盖你需要知道的一切。
> **适用版本：** Windows 10 21H2+ / Windows 11，WSL 2（默认推荐）。文中未特别说明处均指 WSL 2。

## 1. WSL 1 vs WSL 2：架构对比

### 1.1 WSL 1 的翻译层架构

WSL 1 用一个 **系统调用翻译层**（syscall translation layer）把 Linux 系统调用实时转换为 Windows NT 内核调用。没有真正的 Linux 内核，没有虚拟化。

- **优点：** 启动极快（~1s），内存占用低，直接访问 NTFS，无需 Hyper-V。
- **缺点：** 系统调用不完全兼容（`fork`、`mmap`、`inotify` 等存在边界情况），无法运行 Docker Engine、systemd、eBPF 等依赖真实内核的功能，性能在 I/O 密集场景下反而更差。

### 1.2 WSL 2 的轻量级虚拟机架构

WSL 2 基于 **Hyper-V 轻量级虚拟机**（也叫"实用虚拟机"），运行一个由微软维护的完整 Linux 内核。

```
┌─────────────────────────────────────────────────────┐
│                   Windows 用户态                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Terminal  │  │ VS Code  │  │ 其他 Windows 程序  │  │
│  └─────┬────┘  └─────┬────┘  └────────┬──────────┘  │
│        │             │                │              │
│  ┌─────┴─────────────┴────────────────┴──────────┐  │
│  │           WSL 服务层 (wsl.exe / wslhost.exe)    │  │
│  │     Plan 9 文件协议 · 网络代理 · GPU 转发       │  │
│  └──────────────────┬────────────────────────────┘  │
│                     │  Hyper-V Socket / VMBus        │
│  ┌──────────────────┴────────────────────────────┐  │
│  │          轻量级 Hyper-V 虚拟机 (VMWP.exe)       │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │           Linux 内核 (mslinux)            │  │  │
│  │  │  ┌────────────────────────────────────┐  │  │  │
│  │  │  │    Linux 用户态（你的发行版）         │  │  │  │
│  │  │  │    bash / zsh / systemd / docker    │  │  │  │
│  │  │  └────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**关键特性：**
- 完整的 Linux 内核（由微软从 kernel.org 构建，加入 WSL 特有补丁），支持所有系统调用。
- 使用 **ext4 文件系统**（VHD 虚拟磁盘），I/O 性能在 Linux 原生路径上比 WSL 1 快 3-5 倍。
- 内存按需分配（`autoMemoryReclaim`），空闲时自动归还给 Windows。
- 启动时间 ~2-3s（随 Hyper-V 初始化），远快于传统虚拟机。

### 1.3 选择建议

| 场景 | 推荐 |
|------|------|
| 日常开发（编译、Docker、Git、Node/Python/Go） | WSL 2 |
| 需要频繁操作 Windows 文件系统（`/mnt/c`） | WSL 1 或 WSL 2 + 注意跨文件系统性能 |
| 旧硬件、不支持 Hyper-V | WSL 1 |
| 需要 systemd、Docker、K8s、eBPF | 仅 WSL 2 |


## 2. 安装与配置

### 2.1 安装

```powershell
# 方法一：一条命令搞定（推荐，自动启用必要功能并安装 WSL 2 + Ubuntu）
wsl --install

# 方法二：手动启用功能（适用于需要精细控制的场景）
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
# 重启后
wsl --set-default-version 2
```

### 2.2 安装特定发行版

```powershell
# 查看可用发行版
wsl --list --online

# 安装指定发行版
wsl --install -d Ubuntu-24.04
wsl --install -d Debian
wsl --install -d openSUSE-Leap-15.6

# 多发行版并存
wsl --install -d Ubuntu-24.04
wsl --install -d Alpine
```

### 2.3 WSL 1 到 WSL 2 升级

```powershell
# 转换现有发行版
wsl --set-version Ubuntu-24.04 2

# 设置默认版本
wsl --set-default-version 2
```

### 2.4 `.wslconfig` 全局配置

文件位置：`%USERPROFILE%\.wslconfig`（Windows 侧），控制 WSL 2 虚拟机的全局资源分配。

```ini
[wsl2]
# 分配给 Linux 内核的内存上限（默认 = Windows 物理内存的 50%）
memory=8GB

# CPU 核心数（默认 = 全部物理核心）
processors=4

# 交换文件大小（默认 = 内存的 25%）
swap=4GB

# 交换文件路径
# swapFile=D:\\wsl-swap.vhdx

# VHD 虚拟磁盘默认存放路径（默认在 %USERPROFILE%\AppData\Local\Packages\...）
# 建议大容量用户迁移到非系统盘
# vhdx=D:\\WSL\ext4.vhdx

# 自动回收空闲内存（Windows 11 22H2+）
[experimental]
autoMemoryReclaim=gradual    # gradual | dropcache | disabled
sparseVhd=true               # VHD 稀疏化，磁盘按需增长
autoProxy=true               # 自动继承 Windows 代理设置
dnsTunneling=true            # 通过 Windows 栈解析 DNS（解决部分 VPN 场景）
firewall=true                 # 启用 Windows 防火墙规则对 WSL 生效
```

> **注意：** `.wslconfig` 修改后需要 `wsl --shutdown` 再重新启动发行版才生效。

### 2.5 `/etc/wsl.conf` 发行版配置

文件位置：Linux 侧 `/etc/wsl.conf`，控制单个发行版的行为。

```ini
# 默认用户（避免每次都是 root）
[user]
default=yourname

# 启动时自动挂载的选项
[automount]
enabled=true
root=/mnt/          # Windows 盘挂载点
options="metadata,umask=22,fmask=11"  # 控制 /mnt 下文件的权限显示

# 网络配置
[network]
hostname=my-wsl
generateResolvConf=true    # 自动生成 /etc/resolv.conf

# 启动命令（每次 WSL 实例启动时执行）
[boot]
command="service docker start"   # 示例：启动 Docker
systemd=true                     # 启用 systemd（Windows 11 22H2+）

# 互操作（Windows/Linux 程序互相调用）
[interop]
enabled=true
appendWindowsPath=true     # 将 Windows PATH 追加到 Linux PATH
```

> **注意：** `wsl.conf` 修改后需要 `wsl --shutdown` 或 `wsl --terminate <distro>` 再重启该发行版才生效。


## 3. 文件系统架构

### 3.1 两个世界的文件系统

```
Windows 视角                              Linux 视角
─────────────────                         ─────────────────
C:\Users\you\project   ←─────────────→   /mnt/c/Users/you/project
                                          （Plan 9 协议远程访问）

%LOCALAPPDATA%\Packages\...\ext4.vhdx     /  （原生 ext4）
                                          （Linux 原生 I/O）
```

### 3.2 跨文件系统访问的性能陷阱

| 操作 | 位置 | 性能 |
|------|------|------|
| `git clone` 到 `~/` | ext4 原生 | ✅ 快（~100% 原生性能） |
| `git clone` 到 `/mnt/c/` | NTFS via Plan 9 | ❌ 慢 3-10 倍 |
| `npm install` 在 `~/` | ext4 原生 | ✅ 快 |
| `npm install` 在 `/mnt/c/` | NTFS via Plan 9 | ❌ 极慢（大量小文件 I/O） |

**最佳实践：** 源代码和工作目录放在 Linux 文件系统（`~/` 或 `/home/`），通过 VS Code Remote-WSL 编辑，只在需要时用 `/mnt/c/` 访问 Windows 文件。

### 3.3 Plan 9 文件协议（9P）

WSL 2 通过 **9P 协议** 在 Windows 和 Linux 之间共享文件系统。Windows 侧的 `wsl.exe` 内置 9P 服务器，Linux 内核挂载 9P 客户端。

- 支持基本的文件操作、权限元数据（`metadata` 选项）。
- 不支持 `inotify` 跨文件系统监听（`/mnt/c/` 下的文件变化不会触发 Linux 的 `inotifywait`）。
- 符号链接在 `/mnt/c/` 下需要开发者模式启用。

### 3.4 磁盘空间管理

```bash
# 查看发行版磁盘占用
wsl --list -v
# 找到对应的 VHDX 文件大小

# 压缩 VHD（回收已删除文件的空间）
wsl --shutdown
# PowerShell 管理员
diskpart
# select vdisk file="C:\Users\you\AppData\Local\Packages\CanonicalGroup...\ext4.vhdx"
# compact vdisk

# 稀疏 VHD（wsl.conf 中 sparseVhd=true 后，自动支持按需增长和压缩）
wsl --manage <distro> --resize <sizeInMB>
```


## 4. 网络架构

### 4.1 NAT 模式（默认）

```
Windows Host                    WSL 2 VM
┌─────────────────┐           ┌─────────────────┐
│  eth0 (物理网卡) │           │  eth0 (虚拟网卡)  │
│  192.168.1.100   │           │  172.x.x.x       │
│                  │  NAT/SNAT │                  │
│  WSL 虚拟交换机  ├──────────→│  Linux 内核       │
│  172.x.x.1       │           │                  │
└─────────────────┘           └─────────────────┘
```

- WSL 2 默认运行在一个 NAT 网络后面，IP 地址由 Hyper-V 的虚拟交换机动态分配。
- Windows → Linux：通过 `localhost` 访问（Windows 自动做端口转发，但不总是可靠）。
- Linux → Windows：通过 `$(hostname).local` 或 Windows 的 IP（`cat /etc/resolv.conf | grep nameserver`）。

### 4.2 网络镜像模式（mirrored，Windows 11 23H2+）

```ini
# .wslconfig
[wsl2]
networkingMode=mirrored
```

- WSL 2 与 Windows 共享同一个网络栈，IP 地址相同。
- 解决了 localhost 端口转发不稳定的问题。
- VPN 环境下不再需要额外配置。
- `localhost` 直接互通，无需查找 IP。

### 4.3 防火墙与端口

```powershell
# Windows 防火墙默认阻止外部访问 WSL 端口
# 如需外部访问 WSL 中运行的服务：
New-NetFirewallRule -DisplayName "WSL" -Direction Inbound -InterfaceAlias "vEthernet (WSL)" -Action Allow

# 或者使用端口转发
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$(wsl hostname -I | ForEach-Object { $_.Trim() })
```

### 4.4 DNS 配置

```bash
# 查看当前 DNS
cat /etc/resolv.conf

# 如果自动解析有问题，手动设置
# /etc/wsl.conf
[network]
generateResolvConf=false

# 然后手动写 /etc/resolv.conf
nameserver 8.8.8.8
nameserver 1.1.1.1
```

### 4.5 代理配置

```bash
# 方法一：自动代理（.wslconfig 中 autoProxy=true）
# WSL 自动继承 Windows 系统代理

# 方法二：手动设置
export http_proxy=http://$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):7890
export https_proxy=http://$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):7890

# 方法三：.bashrc 中自动设置
WIN_HOST=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')
export ALL_PROXY="http://${WIN_HOST}:7890"
```


## 5. systemd 支持

### 5.1 启用 systemd

Windows 11 22H2+ 的 WSL 2 原生支持 systemd：

```ini
# /etc/wsl.conf
[boot]
systemd=true
```

然后 `wsl --shutdown` 重启。验证：

```bash
systemctl list-unit-files --state=enabled
ps -p 1  # PID 1 应该是 systemd，不是 init
```

### 5.2 systemd 的意义

- `systemctl` / `journalctl` 正常工作。
- `snap` 可用（Ubuntu 默认用 snap 管理部分包）。
- Docker 可以用 `systemctl start docker` 而不是手动 `dockerd`。
- 各种 daemon（cron、ssh、nginx 等）可以正常注册服务。

### 5.3 不启用 systemd 的替代方案

```bash
# 手动启动服务
sudo service docker start
sudo service ssh start

# 或用 /etc/wsl.conf 的 boot.command
[boot]
command="service docker start && service ssh start"
```


## 6. GPU 支持（GPU-PV）

### 6.1 架构

WSL 2 使用 **GPU Paravirtualization（GPU-PV）** 把 Windows 的 GPU 驱动能力通过虚拟化层传递给 Linux。

```
Linux 应用（CUDA / DirectML / OpenGL）
         │
    libcuda.so / libd3d12.so（WSL 专用版本）
         │
    /dev/dxg（虚拟 GPU 设备）
         │
    Hyper-V GPU-PV 转发
         │
    Windows GPU 驱动（NVIDIA / AMD / Intel）
         │
    物理 GPU
```

### 6.2 使用条件

- Windows 11（或 Windows 10 21H2+）。
- 安装 **Windows 侧** 的 GPU 驱动（NVIDIA Game Ready / Studio 驱动 ≥ 512.15，或 AMD Adrenalin ≥ 22.10.2）。
- **不要在 Linux 侧安装 GPU 驱动**——GPU-PV 的关键就是 Linux 使用 Windows 驱动。

### 6.3 验证与使用

```bash
# 验证 GPU 可见
nvidia-smi          # NVIDIA
clinfo              # OpenCL
cat /proc/dxg       # GPU-PV 设备

# PyTorch with CUDA
pip install torch
python -c "import torch; print(torch.cuda.is_available())"

# TensorFlow with DirectML
pip install tensorflow-directml
```


## 7. Docker 在 WSL 2 中的运行

### 7.1 Docker Desktop（推荐）

Docker Desktop 可以直接使用 WSL 2 作为后端，无需传统虚拟机。

- 安装 Docker Desktop → Settings → General → 勾选 "Use the WSL 2 based engine"。
- Settings → Resources → WSL Integration → 启用目标发行版。

```bash
# 在 WSL 中直接使用
docker run hello-world
docker compose up -d
```

### 7.2 原生 Docker Engine（不用 Docker Desktop）

```bash
# 在 WSL 发行版内安装 Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动
sudo service docker start
# 或通过 systemd（需要启用 systemd）
sudo systemctl start docker

# 免 sudo
sudo usermod -aG docker $USER
# 重新登录 WSL 生效
```

### 7.3 Docker 数据目录迁移

默认 Docker 数据在 Linux 文件系统内（ext4），性能好。但如果磁盘空间紧张：

```json
// /etc/docker/daemon.json
{
  "data-root": "/mnt/d/docker-data"  // 迁移到 Windows 盘（性能会下降）
}
```


## 8. WSL 与 Windows 的互操作

### 8.1 从 WSL 调用 Windows 程序

```bash
# 直接运行 .exe
explorer.exe .
notepad.exe /mnt/c/Users/you/file.txt
code .                    # 打开 VS Code

# 调用 PowerShell
powershell.exe -c "Get-Process"

# 调用 cmd
cmd.exe /c dir C:\\
```

### 8.2 从 Windows 调用 WSL 程序

```powershell
# 在 PowerShell / CMD 中
wsl -- ls -la
wsl -- python3 script.py
wsl -e bash -c "echo hello from WSL"

# 在 WSL 中执行命令并获取输出
$result = wsl -- bash -c "uname -r"
```

### 8.3 PATH 互通

- 默认 `appendWindowsPath=true`，Linux 的 `$PATH` 会包含 Windows 的 `%PATH%`。
- 反向：Windows 的 `%PATH%` **不会** 自动包含 WSL 路径（需要通过 `wsl.exe` 调用）。

```bash
# 查看完整 PATH（包含 Windows 路径）
echo $PATH

# 如果 Windows PATH 太长导致性能问题，禁用
# /etc/wsl.conf
[interop]
appendWindowsPath=false
```

### 8.4 环境变量传递

```powershell
# 从 Windows 传递环境变量到 WSL
$env:MY_VAR = "hello"
wsl -- echo $MY_VAR  # 不会生效！

# 正确方法：WSL2 中 Windows 环境变量以 WSLENV 前缀传递
$env:MY_VAR = "hello"
$env:WSLENV = "MY_VAR"
wsl -- echo $MY_VAR  # 现在会输出 "hello"
```


## 9. 多发行版管理

### 9.1 常用命令

```powershell
# 查看已安装的发行版
wsl --list --verbose
# 或
wsl -l -v

# 启动指定发行版
wsl -d Ubuntu-24.04

# 设置默认发行版
wsl --set-default Ubuntu-24.04

# 终止指定发行版
wsl --terminate Ubuntu-24.04

# 关闭所有 WSL 实例
wsl --shutdown

# 注销（删除）发行版（⚠️ 数据丢失）
wsl --unregister Ubuntu-24.04

# 导出/导入（备份或迁移）
wsl --export Ubuntu-24.04 D:\backup\ubuntu.tar
wsl --import Ubuntu-Backup D:\WSL\Ubuntu-Backup D:\backup\ubuntu.tar

# 版本转换
wsl --set-version Ubuntu-24.04 2
```

### 9.2 在指定目录启动

```powershell
# 以指定用户和目录启动
wsl -d Ubuntu-24.04 --cd /home/yourname/project
```

### 9.3 发行版迁移

默认发行版数据在系统盘，迁移到其他盘：

```powershell
# 导出
wsl --export Ubuntu-24.04 D:\wsl-backup\ubuntu.tar

# 注销原发行版
wsl --unregister Ubuntu-24.04

# 导入到新位置
wsl --import Ubuntu-24.04 D:\WSL\Ubuntu-24.04 D:\wsl-backup\ubuntu.tar

# 设置默认用户（导入后默认是 root）
# 在 WSL 内编辑 /etc/wsl.conf
[user]
default=yourname
```


## 10. VS Code + WSL 集成

### 10.1 Remote - WSL 扩展

```bash
# 在 WSL 中打开当前目录
code .

# 自动安装 VS Code Server 到 WSL，Windows 侧 VS Code 做 UI
# 扩展安装在 WSL 侧（如 Python、ESLint 等语言扩展）
```

### 10.2 架构

```
┌──────────────────────┐     ┌──────────────────────┐
│      Windows          │     │       WSL 2           │
│  ┌──────────────────┐ │     │  ┌──────────────────┐ │
│  │   VS Code (UI)   │◄├─gRPC├─►│  VS Code Server  │ │
│  │   扩展 Host       │ │     │  │  扩展 (remote)    │ │
│  └──────────────────┘ │     │  │  文件 / 终端 / 调试 │ │
│                        │     │  └──────────────────┘ │
└──────────────────────┘     └──────────────────────┘
```

- 编辑器 UI 在 Windows，文件读写、终端、调试器都在 WSL 内运行。
- Git、Node、Python 等工具用 WSL 内的版本，不受 Windows 影响。


## 11. 安全模型

### 11.1 WSL 2 的隔离

- WSL 2 运行在 Hyper-V 虚拟机中，与 Windows 内核有硬件级隔离。
- 默认通过 NAT 网络，外部无法直接访问 WSL 内的服务。
- Windows 防火墙可以控制 WSL 的入站流量。

### 11.2 注意事项

- `interop.enabled=true` 意味着 WSL 内的 root 可以执行 Windows `.exe`，继承 Windows 用户的权限。
- `/mnt/c/` 挂载了整个 C 盘，WSL 内的 root 理论上可以修改 Windows 文件。
- 如果安全要求高，可以在 `wsl.conf` 中禁用互操作。

### 11.3 企业场景

- **WSL 2 + Azure AD：** 支持 Kerberos 认证访问企业资源。
- **Group Policy：** 可以通过 GPO 禁用 WSL、限制发行版安装。
- **Credential Guard：** 与 WSL 2 兼容。


## 12. 性能调优

### 12.1 内存

```ini
# .wslconfig
[wsl2]
memory=8GB                    # 硬上限
autoMemoryReclaim=gradual     # 自动回收空闲内存
```

```bash
# 查看内存使用
free -h
cat /proc/meminfo

# 手动释放内存（在 Windows 侧）
wsl --shutdown
```

### 12.2 磁盘 I/O

- 源代码放在 `~/`（ext4），不要放在 `/mnt/c/`（NTFS via 9P）。
- `npm install`、`cargo build`、`go build` 等大量小文件操作务必在 ext4 上。
- 使用 `sparseVhd=true` 减少 VHD 实际占用。

### 12.3 CPU

```ini
# .wslconfig
[wsl2]
processors=4    # 限制 CPU 核心数，避免 WSL 吃掉所有 CPU
```

### 12.4 启动速度

```bash
# 查看启动耗时
systemd-analyze              # systemd 启动分析
systemd-analyze blame        # 各服务启动耗时
systemd-analyze critical-chain  # 关键路径

# 禁用不需要的服务
sudo systemctl disable snapd
sudo systemctl disable multipathd
```


## 13. 常见场景与最佳实践

### 13.1 开发环境标准化

```bash
# 一键初始化脚本示例
#!/bin/bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl wget vim

# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install --lts

# Python (via pyenv)
curl https://pyenv.run | bash
pyenv install 3.12
pyenv global 3.12

# Go
wget https://go.dev/dl/go1.22.4.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.4.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
```

### 13.2 Git 配置（跨文件系统注意）

```bash
# WSL 内的 Git 与 Windows Git 分开配置
git config --global core.autocrlf input    # Linux 侧：提交时转 LF
git config --global core.symlinks true      # 支持符号链接

# 如果在 /mnt/c/ 使用 Git，注意行尾和权限
# 推荐：在 ~/ 下用 Git，避免跨文件系统
```

### 13.3 SSH 密钥共享

```bash
# 方法一：符号链接 Windows SSH 密钥
ln -s /mnt/c/Users/you/.ssh ~/.ssh

# 方法二：使用 Windows SSH Agent 转发（Windows 11 22H2+）
# 需要 Windows 侧启用 ssh-agent
# /etc/wsl.conf
[interop]
sshAgentForwarding=true
```

### 13.4 数据库开发

```bash
# PostgreSQL
sudo apt install postgresql
sudo systemctl start postgresql

# MySQL
sudo apt install mysql-server
sudo systemctl start mysql

# Redis
sudo apt install redis-server
sudo systemctl start redis
```


## 14. 故障排查

### 14.1 WSL 无法启动

```powershell
# 检查 Hyper-V 和虚拟化是否启用
systeminfo | findstr /C:"Hyper-V"
# 需要"已检测到虚拟机监控程序"

# BIOS 中启用 VT-x / AMD-V（Intel VT-d / AMD-Vi）

# 重置 WSL
wsl --shutdown
wsl --unregister Ubuntu-24.04
wsl --install -d Ubuntu-24.04

# 查看错误日志
Get-WinEvent -LogName "Microsoft-Windows-Hyper-V-*" -MaxEvents 20
```

### 14.2 网络不通

```bash
# 检查 DNS
nslookup google.com
cat /etc/resolv.conf

# 检查路由
ip route show
ip addr show

# 检查 Windows 防火墙
# PowerShell 管理员
Get-NetFirewallRule -DisplayName "*WSL*"

# 检查代理
echo $http_proxy
echo $https_proxy
```

### 14.3 localhost 访问不到 WSL 服务

```powershell
# 方法一：使用 networkingMode=mirrored（推荐）
# .wslconfig 中设置 networkingMode=mirrored

# 方法二：端口转发
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$(wsl hostname -I | %{$_.Trim()})

# 查看端口转发规则
netsh interface portproxy show all

# 删除规则
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
```

### 14.4 磁盘空间不足

```powershell
# 检查 VHD 大小
Get-ChildItem -Path "$env:LOCALAPPDATA\Packages" -Recurse -Filter "ext4.vhdx" | Select-Object FullName, Length

# 压缩 VHD（需要先关闭 WSL）
wsl --shutdown
diskpart
# select vdisk file="<path>"
# compact vdisk

# 清理 APT 缓存
sudo apt clean
sudo apt autoremove

# 清理 Docker
docker system prune -a
```

### 14.5 systemd 服务异常

```bash
# 检查 systemd 状态
systemctl status
journalctl -b -p err

# 常见：snapd 启动失败
sudo systemctl disable snapd snapd.socket

# 常见：systemd-resolved 与 WSL DNS 冲突
sudo systemctl disable systemd-resolved
# 手动写 /etc/resolv.conf
```

### 14.6 文件权限问题

```bash
# /mnt/c/ 下文件权限显示异常
# /etc/wsl.conf
[automount]
options="metadata,umask=22,fmask=11"

# Linux 文件系统上的权限正常
# 如果需要 ACL
sudo apt install acl
setfacl -m u:guest:rx /home/you/project
```

### 14.7 内存泄漏 / 消耗过高

```powershell
# 查看 WSL 内存占用
Get-Process vmwp | Select-Object WorkingSet64

# Windows 11 22H2+ 自动回收
# .wslconfig
[wsl2]
autoMemoryReclaim=gradual

# 手动释放
wsl --shutdown
```


## 15. WSL 的局限性

| 局限 | 说明 |
|------|------|
| 不适合生产服务器 | WSL 是开发工具，不是服务器运行时 |
| GUI 应用支持有限 | WSLg 支持 X11/Wayland，但性能和兼容性不如原生 |
| 无法运行 Windows 容器 | WSL 2 只能运行 Linux 容器 |
| 部分内核模块不可用 | 自定义内核模块需要自行编译 WSL 内核 |
| 符号链接跨文件系统 | `/mnt/c/` 下的符号链接需要开发者模式 |
| 休眠/睡眠后网络异常 | Windows 休眠后 WSL 网络可能需要 `wsl --shutdown` 重置 |
| 多用户共享 | WSL 是单用户设计，不适合多用户服务器场景 |


## 16. WSLg（图形界面应用）

### 16.1 原理

Windows 11 内置 WSLg（Wayland + X11 支持），基于 Weston compositor 和 PulseAudio。

```
Linux GUI 应用（GTK/Qt/Electron）
         │
    Wayland / X11
         │
    WSLg（Weston + XWayland + PulseAudio）
         │
    RDP 通道
         │
    Windows 桌面
```

### 16.2 使用

```bash
# 直接运行 GUI 应用
sudo apt install gedit
gedit &

sudo apt install firefox
firefox &

# 验证 WSLg
echo $DISPLAY    # 应该是 :0
echo $WAYLAND_DISPLAY  # 应该是 wayland-0
```

### 16.3 注意

- 3D 加速支持有限，不适合游戏或 GPU 密集的 GUI 应用。
- 字体渲染依赖 Windows 侧字体（通过 `/mnt/c/Windows/Fonts` 可访问）。


## 17. 总结速查

| 操作 | 命令 |
|------|------|
| 安装 WSL | `wsl --install` |
| 安装特定发行版 | `wsl --install -d Ubuntu-24.04` |
| 查看发行版列表 | `wsl -l -v` |
| 启动指定发行版 | `wsl -d Ubuntu-24.04` |
| 关闭所有实例 | `wsl --shutdown` |
| 终止指定发行版 | `wsl --terminate Ubuntu-24.04` |
| 全局配置 | `%USERPROFILE%\.wslconfig` |
| 发行版配置 | `/etc/wsl.conf` |
| 启用 systemd | `wsl.conf` 中 `[boot] systemd=true` |
| 文件放在 Linux 内 | `~/`（ext4，快） |
| 访问 Windows 文件 | `/mnt/c/`（NTFS via 9P，慢） |
| 打开 VS Code | `code .` |
| 导出备份 | `wsl --export Ubuntu-24.04 backup.tar` |
| 导入恢复 | `wsl --import Ubuntu D:\WSL\Ubuntu backup.tar` |
| 版本转换 | `wsl --set-version Ubuntu-24.04 2` |
| 查看 IP | `hostname -I` |
| Windows → WSL | `wsl -- <command>` |
| WSL → Windows | `<program>.exe` |
