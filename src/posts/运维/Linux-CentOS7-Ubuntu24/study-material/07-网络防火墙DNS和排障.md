---
title: "Linux 学习资料：网络、防火墙、DNS 和排障"
date: 2026-06-20
description: "网络排障不能只问“服务器通不通”。要拆成：本机是否有 IP、路由是否正确、服务是否监听、监听地址是否正确、本机防火墙是否放行、上游安全组是否放行、DNS 是否解析到预期地址、连接是否到达本机、应用是否正常响应。"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
category: "运维"
---

# Linux 学习资料：网络、防火墙、DNS 和排障

[返回索引](../Linux学习资料.md)

## 学习目标

- 理解网卡、IP、路由、ARP、端口、TCP/UDP、DNS、防火墙的基本机制。
- 掌握 CentOS 7 与 Ubuntu 24.04 的网络配置差异：ifcfg、NetworkManager、netplan、systemd-resolved。
- 能排查端口不通、DNS 失败、路由错误、防火墙阻断和服务监听错误。

## 理论导读

网络排障不能只问“服务器通不通”。要拆成：本机是否有 IP、路由是否正确、服务是否监听、监听地址是否正确、本机防火墙是否放行、上游安全组是否放行、DNS 是否解析到预期地址、连接是否到达本机、应用是否正常响应。

CentOS 7 和 Ubuntu 24.04 网络栈工具都支持 `iproute2`，但持久化配置方式差异很大。CentOS 7 常见 ifcfg 文件和 NetworkManager；Ubuntu 24.04 常见 netplan 生成 systemd-networkd 或 NetworkManager 配置，并由 systemd-resolved 管理 DNS。

## 核心心智模型

请求到达服务的路径：

```text
客户端 DNS
  -> 客户端路由
  -> 网络链路
  -> 云安全组/上游防火墙
  -> 服务器网卡
  -> 本机防火墙
  -> 服务监听地址和端口
  -> 应用协议响应
```

## 知识点详解

### 1. IP 和路由

```bash
ip addr
ip route
ip neigh
```

旧命令 `ifconfig`、`route`、`arp` 仍可能存在，但现代 Linux 推荐 `ip`。

添加临时 IP：

```bash
sudo ip addr add 192.0.2.10/24 dev eth0
```

添加临时路由：

```bash
sudo ip route add 203.0.113.0/24 via 192.0.2.1
```

临时命令重启后失效。持久化要用发行版配置方式。

### 2. CentOS 7 持久网络配置

常见路径：

```bash
/etc/sysconfig/network-scripts/ifcfg-eth0
```

示例：

```ini
TYPE=Ethernet
BOOTPROTO=none
NAME=eth0
DEVICE=eth0
ONBOOT=yes
IPADDR=192.0.2.10
PREFIX=24
GATEWAY=192.0.2.1
DNS1=8.8.8.8
```

NetworkManager 命令：

```bash
nmcli device status
nmcli connection show
sudo nmcli connection reload
sudo nmcli connection up eth0
```

CentOS 7 环境中可能有人关闭 NetworkManager 使用 network service。接手机器时必须先确认实际管理者。

### 3. Ubuntu 24.04 持久网络配置

netplan 配置：

```bash
ls /etc/netplan/
```

示例：

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    ens160:
      addresses:
        - 192.0.2.10/24
      routes:
        - to: default
          via: 192.0.2.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 1.1.1.1
```

应用：

```bash
sudo netplan generate
sudo netplan try
sudo netplan apply
```

`netplan try` 会提供回滚窗口，远程机器上比直接 apply 更安全。

### 4. DNS

查询：

```bash
getent hosts example.com
dig example.com
resolvectl status 2>/dev/null || systemd-resolve --status 2>/dev/null || true
cat /etc/resolv.conf
```

CentOS 7 常见由 NetworkManager 或网络脚本管理 `/etc/resolv.conf`。Ubuntu 24.04 常见 `/etc/resolv.conf` 指向 systemd-resolved 的 stub 文件。

Ubuntu 24.04 不建议直接长期编辑 `/etc/resolv.conf`，应通过 netplan、NetworkManager 或 systemd-resolved 配置。

### 5. 监听和连接

```bash
ss -lntp
ss -lunp
ss -antp
curl -v http://127.0.0.1:80/
curl -v http://server-ip:80/
```

监听地址区别：

- `127.0.0.1:80`：只本机访问。
- `0.0.0.0:80`：所有 IPv4 地址监听。
- `[::]:80`：IPv6 监听，是否同时接 IPv4 取决于配置。

### 6. 防火墙

CentOS 7 firewalld：

```bash
sudo firewall-cmd --state
sudo firewall-cmd --get-active-zones
sudo firewall-cmd --list-all
sudo firewall-cmd --add-service=http --permanent
sudo firewall-cmd --reload
```

Ubuntu 24.04 ufw：

```bash
sudo ufw status verbose
sudo ufw allow 80/tcp
sudo ufw reload
```

底层查看：

```bash
sudo iptables -S 2>/dev/null || true
sudo nft list ruleset 2>/dev/null || true
```

Ubuntu 24.04 更常见 nftables 后端。不要假设 `iptables -L` 就能看到全部真实规则。

### 7. 抓包

```bash
sudo tcpdump -ni any port 80
sudo tcpdump -ni eth0 host 203.0.113.10 and port 443
```

抓包判断：

- 包是否到达本机。
- 本机是否回复。
- TCP 三次握手停在哪一步。
- DNS 请求发给了哪个服务器。

## 例子：端口监听但外部访问不通

排查顺序：

```bash
ss -lntp | grep ':80'
curl -v http://127.0.0.1:80/
curl -v http://$(hostname -I | awk '{print $1}'):80/
ip addr
ip route
sudo firewall-cmd --list-all 2>/dev/null || sudo ufw status verbose
sudo tcpdump -ni any port 80
```

判断：

- 本机 curl 127.0.0.1 通，访问服务器 IP 不通：服务可能只监听 loopback。
- 本机 IP 通，外部不通：本机防火墙、上游安全组、路由或网络链路。
- tcpdump 看不到包：请求没到服务器。
- tcpdump 看到 SYN 但无 SYN-ACK：本机防火墙或服务监听问题。

## 练习

1. 查看本机 IP、默认路由、DNS 配置。
2. 启动一个 HTTP 服务，只监听 127.0.0.1，观察外部访问失败。
3. CentOS 7 用 firewalld 放行 8080/tcp；Ubuntu 24.04 用 ufw 放行 8080/tcp。
4. 用 `tcpdump` 抓取 DNS 请求。
5. 在 Ubuntu 24.04 上用 `netplan try` 修改测试网卡配置。

## 验收

- 能解释 IP、路由、DNS、监听、防火墙的排查顺序。
- 能区分临时网络配置和持久配置。
- 能说明 CentOS 7 ifcfg 与 Ubuntu 24.04 netplan 差异。
- 能使用 `ss` 判断监听地址和进程。
- 能用 tcpdump 判断包是否到达本机。

## 重点

- 网络问题必须分层定位。
- Ubuntu 24.04 的 DNS 通常由 systemd-resolved 管理。
- firewalld、ufw、iptables、nftables 是不同层次的工具或后端。
- 监听 127.0.0.1 与 0.0.0.0 是常见外部访问失败原因。

## 难点

- 防火墙可能有多层：应用配置、本机防火墙、容器规则、云安全组、企业网络 ACL。只看本机一层不够。

## 易错

> **易错：** 服务启动成功就认为端口对外可访问。
>
> 正确做法：检查监听地址、防火墙、路由、DNS 和上游安全组。

> **易错：** 在 Ubuntu 24.04 直接编辑 `/etc/resolv.conf` 做永久 DNS 配置。
>
> 正确做法：通过 netplan、NetworkManager 或 systemd-resolved 配置 DNS。

