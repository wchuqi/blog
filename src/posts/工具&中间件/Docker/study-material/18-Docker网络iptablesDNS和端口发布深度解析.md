---
title: "Docker学习资料：Docker 网络、iptables、DNS 和端口发布深度解析"
date: 2026-06-20
description: "Docker 网络的表面是 --network 和 -p，底层是 Linux 网络命名空间、虚拟网卡、网桥、路由、NAT 和 DNS。用户自定义 bridge 网络会为容器提供内置 DNS；端口发布则在宿主机上建立从宿主机端口到容器 IP:…"
tags:
  - "工具&中间件"
  - "Docker"
  - "深度解析"
category: "工具&中间件"
---

# Docker学习资料：Docker 网络、iptables、DNS 和端口发布深度解析

[返回索引](../Docker学习资料.md)

## 学习目标

- 理解 bridge 网络、veth pair、network namespace、docker0 的关系。
- 能解释端口发布、NAT、DNS 解析和容器服务名。
- 能用分层命令排查网络问题。

## 理论导读

Docker 网络的表面是 `--network` 和 `-p`，底层是 Linux 网络命名空间、虚拟网卡、网桥、路由、NAT 和 DNS。用户自定义 bridge 网络会为容器提供内置 DNS；端口发布则在宿主机上建立从宿主机端口到容器 IP:端口的转发规则。

## bridge 网络链路

一个容器加入 bridge 网络时，典型链路是：

```text
container eth0
  <-> veth pair
  <-> docker bridge
  <-> host routing/NAT
  <-> external network
```

容器内看到 `eth0`，宿主机侧看到另一端 veth。bridge 像二层交换机，把同一网络的容器连起来。

## 端口发布

`-p 8080:80` 的语义是：

- 宿主机监听或转发 `0.0.0.0:8080`。
- 流量 DNAT 到容器 IP 的 `80` 端口。
- 容器内应用必须监听 `0.0.0.0:80` 或容器 IP，而不是只监听 `127.0.0.1:80`。

> **重点：** 端口发布不改变容器内应用监听地址。应用只监听容器内 localhost 时，外部通常访问不到。

## 容器 DNS

在用户自定义网络中，Docker 提供内置 DNS。Compose 中 service 名默认成为 DNS 名。例如 `api` 服务访问 `db:5432`，DNS 会解析到 `db` 容器 IP。

解析规则常见边界：

- 同一用户自定义网络内服务名可解析。
- 不同网络默认不能解析。
- 一个容器加入多个网络时，能访问多个网络中的服务。
- 容器重建后 IP 变，服务名保持稳定。

## host、none、macvlan、overlay

| 网络模式 | 适用场景 | 风险和边界 |
| --- | --- | --- |
| bridge | 单机容器通信，最常用 | 需要端口发布给外部访问 |
| host | 高性能或特殊网络需求 | 弱化隔离，端口直接占宿主机 |
| none | 完全无网络任务 | 需要手工配置网络时才用 |
| macvlan | 容器作为局域网独立主机 | 网络环境要求高，宿主机与容器通信需额外处理 |
| overlay | 跨主机容器网络 | 依赖集群控制面和底层网络 |

## 排障路径

### 1. 应用是否监听

```bash
docker exec app ss -lntp
docker logs app
```

### 2. 容器 DNS 是否解析

```bash
docker exec app nslookup db
docker exec app getent hosts db
```

### 3. 网络是否相同

```bash
docker inspect app --format '{{json .NetworkSettings.Networks}}'
docker network inspect app_default
```

### 4. 宿主机端口是否发布

```bash
docker ps
ss -lntp | grep 8080
docker port app
```

### 5. NAT 和防火墙

Linux 原生环境可检查：

```bash
iptables -t nat -S
iptables -S
ip route
```

部分系统使用 nftables，命令和规则展示不同。生产中还要检查云安全组、主机防火墙和上游负载均衡。

## 典型故障解释

### 宿主机能访问，其他容器不能访问

可能原因：容器之间使用了宿主机映射端口，或者不在同一网络。容器间应走服务名和容器端口。

### 容器内 curl localhost 失败

可能原因：服务没启动，或监听在别的端口。`localhost` 是容器自己。

### 外部访问端口失败，但容器内正常

可能原因：没有 `-p`，宿主机防火墙阻断，应用只监听 `127.0.0.1`，端口发布到错误地址。

## 练习

1. 创建两个用户自定义网络，把三个容器分别放入不同网络，画出可访问矩阵。
2. 让服务只监听 `127.0.0.1`，观察端口发布后外部访问结果。
3. 用 `nicolaka/netshoot` 容器做 DNS、路由、端口连通性测试。
4. 在 Linux 上观察 `iptables -t nat -S` 中 Docker 创建的规则。

## 验收

- 能解释 `-p 8080:80` 的真实流量路径。
- 能说明 Compose 服务名为什么比容器 IP 可靠。
- 能按监听、DNS、网络、端口发布、防火墙顺序排查网络问题。

## 易错

> **易错：** 网络不通时直接改 Compose 文件或重建容器。
>
> 正确做法：先确认应用监听，再确认 DNS、网络归属和端口发布。

