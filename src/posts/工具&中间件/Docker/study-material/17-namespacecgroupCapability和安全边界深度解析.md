---
title: "Docker学习资料：namespace、cgroup、capability 和安全边界深度解析"
date: 2026-06-20
description: "容器安全不是一个开关，而是一组内核机制叠加后的结果。namespace 让进程看到隔离后的系统视图，cgroup 限制资源，capability 把 root 权限拆成更细颗粒，seccomp 限制系统调用，AppArmor/SELinux…"
tags:
  - "工具&中间件"
  - "Docker"
  - "深度解析"
category: "工具&中间件"
---

# Docker学习资料：namespace、cgroup、capability 和安全边界深度解析

[返回索引](../Docker学习资料.md)

## 学习目标

- 理解容器隔离的内核基础：namespace、cgroup、capability、seccomp、LSM。
- 能解释容器内 root 的真实风险。
- 能设计最小权限运行配置。

## 理论导读

容器安全不是一个开关，而是一组内核机制叠加后的结果。namespace 让进程看到隔离后的系统视图，cgroup 限制资源，capability 把 root 权限拆成更细颗粒，seccomp 限制系统调用，AppArmor/SELinux 进一步限制访问行为。Docker 默认配置提供基础隔离，但只要使用危险参数，隔离边界会迅速变薄。

## namespace：隔离“看见什么”

| namespace | 隔离内容 | 典型表现 |
| --- | --- | --- |
| pid | 进程号空间 | 容器内 PID 1 是应用入口 |
| net | 网络设备、路由、端口 | 容器有自己的网卡和 localhost |
| mnt | 挂载点 | 容器看到自己的 rootfs |
| uts | 主机名和域名 | 容器可有独立 hostname |
| ipc | 进程间通信 | 隔离共享内存和信号量 |
| user | 用户 ID 映射 | 容器内 root 可映射为宿主机非 root |

> **难点：** user namespace 默认不一定启用。没有 userns-remap 或 rootless 时，容器内 UID 0 的风险更高。

## cgroup：限制“能用多少”

cgroup 控制资源配额、统计和隔离，包括：

- CPU：quota、shares、cpuset。
- 内存：memory limit、swap、OOM 行为。
- pids：限制进程数量，防止 fork bomb。
- blkio/io：限制块设备 IO。

```bash
docker run --memory 512m --cpus 1.5 --pids-limit 200 app:local
```

### OOM 判断

容器内应用被 OOM kill 时，常见退出码是 137，但不是所有 137 都一定是 OOM。应结合：

```bash
docker inspect app --format '{{.State.OOMKilled}} {{.State.ExitCode}}'
dmesg | grep -i oom
docker stats
```

## capability：拆分 root 权限

Linux root 的权限被拆成多个 capability，例如：

- `CAP_NET_BIND_SERVICE`：绑定 1024 以下端口。
- `CAP_NET_ADMIN`：修改网络配置。
- `CAP_SYS_ADMIN`：范围非常大，风险极高。
- `CAP_CHOWN`：修改文件所有者。

安全实践：

```bash
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE app:local
```

如果应用不需要低端口，可以连 `NET_BIND_SERVICE` 也不要，直接监听 8080。

## seccomp 和 LSM

seccomp 用于限制系统调用。Docker 默认 seccomp profile 会禁用部分高风险 syscall。AppArmor、SELinux 属于 Linux Security Module，用策略限制进程访问文件、网络和能力。

安全不是“开了 seccomp 就安全”，而是最小权限叠加：

```bash
docker run \
  --read-only \
  --tmpfs /tmp \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  --memory 512m \
  --pids-limit 200 \
  app:local
```

## rootless Docker 和 userns-remap

rootless Docker 让 Docker daemon 和容器以非 root 用户运行，减少 daemon 被攻破后的宿主机影响。userns-remap 则把容器内 root 映射为宿主机上的非特权 UID 范围。

适用边界：

- 安全收益明显。
- 某些网络、存储、端口和内核能力会受限制。
- 生产启用前要验证应用、volume 权限和运维工具兼容性。

## 危险配置风险模型

| 配置 | 风险 |
| --- | --- |
| `--privileged` | 放开大量 capability 和设备访问，接近关闭容器安全边界 |
| `-v /var/run/docker.sock:/var/run/docker.sock` | 容器可控制 Docker daemon，间接控制宿主机 |
| `-v /:/host` | 容器可读写宿主机根目录 |
| `--pid host` | 可看到宿主机进程 |
| `--network host` | 弱化网络隔离，端口冲突和监听面扩大 |
| `CAP_SYS_ADMIN` | 权限范围过大，经常等同于高风险授权 |

## 练习

1. 分别用 root 和非 root 用户运行同一容器，比较写入挂载目录时的权限表现。
2. 使用 `--cap-drop ALL` 启动服务，逐步添加真正需要的 capability。
3. 使用 `--pids-limit` 限制进程数，观察 fork 行为。
4. 使用只读根文件系统启动应用，找出必须可写的目录。

## 验收

- 能解释 namespace、cgroup、capability 的区别。
- 能判断某个 Docker 运行参数为什么危险。
- 能给出一个生产容器最小权限运行模板。

## 重点

- Docker 隔离来自多种 Linux 内核机制组合。
- 容器内 root 不应被当成无害。
- 安全配置要先最小化，再按实际需求加权限。

## 易错

> **易错：** 遇到权限问题直接 `--privileged`。
>
> 正确做法：定位缺少的是文件权限、UID/GID、capability、设备、SELinux/AppArmor，分别最小授权。

