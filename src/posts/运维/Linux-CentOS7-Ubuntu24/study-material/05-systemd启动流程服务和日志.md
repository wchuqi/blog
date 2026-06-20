---
title: "Linux 学习资料：systemd、启动流程、服务和日志"
date: 2026-06-20
description: "systemd 是现代 Linux 的 PID 1，也是服务管理器、日志入口、依赖编排器和系统状态管理者。CentOS 7 和 Ubuntu 24.04 都使用 systemd，但版本差距很大：CentOS 7 是较老的 systemd 2…"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
category: "运维"
---

# Linux 学习资料：systemd、启动流程、服务和日志

[返回索引](../Linux学习资料.md)

## 学习目标

- 理解 Linux 从固件、bootloader、kernel、initramfs 到 systemd 的启动流程。
- 掌握 systemd unit、target、依赖、服务状态、日志和故障排查。
- 能区分 `start`、`restart`、`reload`、`enable`、`daemon-reload` 和 `reset-failed`。

## 理论导读

systemd 是现代 Linux 的 PID 1，也是服务管理器、日志入口、依赖编排器和系统状态管理者。CentOS 7 和 Ubuntu 24.04 都使用 systemd，但版本差距很大：CentOS 7 是较老的 systemd 219，Ubuntu 24.04 是较新的 systemd 255 系列。新 systemd 支持更多特性，但核心 unit 模型一致。

排查服务失败时，不能只看 `systemctl status` 的最后几行。必须结合 unit 文件、依赖关系、环境变量、用户权限、工作目录、日志、端口占用和安全模块。

## 核心心智模型

启动流程：

```text
BIOS/UEFI
  -> bootloader，例如 GRUB
  -> Linux kernel
  -> initramfs
  -> root filesystem
  -> PID 1 systemd
  -> targets
  -> services/sockets/timers
```

服务管理流程：

```text
unit 文件
  -> systemd 解析依赖
  -> 按 type 启动进程
  -> 监控主进程
  -> 收集 stdout/stderr 到 journal
  -> 根据 restart 策略处理退出
```

## 知识点详解

### 1. 常用 systemctl

```bash
systemctl status nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo systemctl enable nginx
sudo systemctl disable nginx
systemctl is-enabled nginx
systemctl is-active nginx
sudo systemctl daemon-reload
sudo systemctl reset-failed nginx
```

区别：

| 命令 | 含义 |
| --- | --- |
| `start` | 立即启动 |
| `stop` | 立即停止 |
| `restart` | 停止后重新启动 |
| `reload` | 不退出进程，重新加载配置，前提是服务支持 |
| `enable` | 设置开机启动 |
| `daemon-reload` | 让 systemd 重新读取 unit 文件 |
| `reset-failed` | 清理 failed 状态 |

### 2. unit 文件位置和优先级

常见位置：

```bash
/usr/lib/systemd/system/    # CentOS/RHEL 系常见包安装 unit
/lib/systemd/system/        # Debian/Ubuntu 系常见包安装 unit
/etc/systemd/system/        # 管理员覆盖和自定义 unit
/run/systemd/system/        # 运行时 unit
```

查看实际 unit：

```bash
systemctl cat nginx
systemctl show nginx
```

不要直接修改包提供的 unit。推荐使用 drop-in：

```bash
sudo systemctl edit nginx
```

生成：

```text
/etc/systemd/system/nginx.service.d/override.conf
```

修改后：

```bash
sudo systemctl daemon-reload
sudo systemctl restart nginx
```

### 3. service 类型

常见 `Type=`：

| Type | 含义 |
| --- | --- |
| `simple` | 默认，启动进程即认为服务启动 |
| `forking` | 进程会 fork 到后台，老式 daemon 常见 |
| `oneshot` | 执行一次任务后退出 |
| `notify` | 服务通过 sd_notify 告诉 systemd 已就绪 |

如果 Type 配错，服务可能显示启动成功但实际不可用，或启动超时。

### 4. 依赖和顺序

常见字段：

```ini
[Unit]
After=network-online.target
Wants=network-online.target
Requires=postgresql.service
```

区别：

- `After=` 只表达启动顺序，不表达强依赖。
- `Wants=` 表达弱依赖，依赖失败不一定导致本服务失败。
- `Requires=` 表达强依赖，依赖失败通常影响本服务。

> **易错：** 以为 `After=network.target` 就代表网络一定可用。
>
> 正确做法：需要网络真正在线时，通常使用 `network-online.target` 并确保对应 wait-online 服务启用。

### 5. journalctl

查看服务日志：

```bash
journalctl -u nginx
journalctl -u nginx -f
journalctl -u nginx --since "1 hour ago"
journalctl -p err -b
journalctl -xe
```

查看本次启动：

```bash
journalctl -b
```

查看上次启动：

```bash
journalctl -b -1
```

CentOS 7 和 Ubuntu 24.04 都有 journald，但持久化配置可能不同。查看：

```bash
grep -E '^#?Storage=' /etc/systemd/journald.conf
ls /var/log/journal 2>/dev/null || true
```

### 6. target

target 是一组 unit 的集合，类似运行级别。

```bash
systemctl get-default
sudo systemctl set-default multi-user.target
systemctl isolate rescue.target
```

常见：

- `multi-user.target`：多用户文本模式。
- `graphical.target`：图形模式。
- `rescue.target`：救援模式。
- `emergency.target`：更小的紧急环境。

### 7. 定位服务启动失败

流程：

```bash
systemctl status service
journalctl -u service -b
systemctl cat service
systemctl show service -p User -p Group -p WorkingDirectory -p Environment
ss -lntp
```

还要检查：

- 配置语法，例如 `nginx -t`。
- 端口占用。
- 文件权限和路径权限。
- SELinux/AppArmor。
- 环境变量。
- 依赖服务。

## 例子：自定义一个 systemd 服务

创建脚本：

```bash
sudo install -d -o root -g root -m 755 /opt/hello
sudo tee /opt/hello/hello.sh >/dev/null <<'EOF'
#!/usr/bin/env bash
while true; do
  echo "hello $(date)"
  sleep 5
done
EOF
sudo chmod 755 /opt/hello/hello.sh
```

unit：

```ini
[Unit]
Description=Hello demo service
After=network.target

[Service]
Type=simple
ExecStart=/opt/hello/hello.sh
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

保存到 `/etc/systemd/system/hello-demo.service` 后：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hello-demo
journalctl -u hello-demo -f
```

## 练习

1. 安装 nginx，查看 unit 文件和 drop-in 覆盖目录。
2. 修改 nginx 配置，分别执行 reload 和 restart，观察连接影响。
3. 创建一个 oneshot 服务，执行一次巡检脚本。
4. 故意让服务端口冲突，使用 journalctl 和 ss 排查。
5. 查看本次启动和上次启动的错误日志。

## 验收

- 能解释 Linux 启动链路。
- 能读懂 systemd unit 的基本结构。
- 能解释 `enable` 和 `start` 的区别。
- 能使用 `journalctl` 定位服务失败。
- 能安全使用 drop-in 覆盖 unit。
- 能说明 CentOS 7 和 Ubuntu 24.04 systemd 版本差异带来的功能差异。

## 重点

- systemd 管的是服务生命周期，不负责保证应用配置正确。
- 修改 unit 后要 `daemon-reload`。
- `After` 是顺序，不是依赖。
- 日志要结合 `journalctl -u`、应用自身日志和内核日志。

## 难点

- 服务失败通常不是单点原因。端口占用、配置错误、权限、安全模块、环境变量和依赖顺序都可能参与。

## 易错

> **易错：** 修改 unit 后直接 restart，发现配置不生效。
>
> 正确做法：执行 `systemctl daemon-reload` 后再重启服务。

> **易错：** 以为 `systemctl enable` 会立即启动服务。
>
> 正确做法：`enable` 只设置开机启动；需要立即启动用 `start` 或 `enable --now`。

