---
title: "Linux 学习资料：网络栈、路由、conntrack 和 netfilter 深度解析"
date: 2026-06-20
description: "网络排障的关键是知道包在哪里被处理或丢弃。一个入站 TCP SYN 到达网卡后，会经过驱动、内核网络栈、netfilter hook、路由判断、conntrack、socket 查找，最后才到应用。出站包同样要经过路由选择、源地址选择、ne…"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
  - "深度解析"
category: "运维"
---

# Linux 学习资料：网络栈、路由、conntrack 和 netfilter 深度解析

[返回索引](../Linux学习资料.md)

## 学习目标

- 理解 Linux 收包、路由、socket、netfilter、conntrack、防火墙和 NAT 的处理链路。
- 掌握 `ip route get`、`ss`、`tcpdump`、`conntrack`、`iptables`、`nft`、firewalld、ufw 的边界。
- 能区分连接拒绝、超时、DNS 错误、路由错误、防火墙丢包、应用拒绝和 conntrack 表满。
- 能对比 CentOS 7 与 Ubuntu 24.04 在 iptables/nftables/firewalld/ufw 上的差异。

## 理论导读

网络排障的关键是知道包在哪里被处理或丢弃。一个入站 TCP SYN 到达网卡后，会经过驱动、内核网络栈、netfilter hook、路由判断、conntrack、socket 查找，最后才到应用。出站包同样要经过路由选择、源地址选择、netfilter 和网卡发送。

`firewall-cmd` 和 `ufw` 是前端工具；iptables 和 nftables 是规则体系；netfilter 是内核框架；conntrack 是连接跟踪。只会一个命令，很容易看不到真实拦截点。

## 核心心智模型

入站简化路径：

```text
NIC 收包
  -> driver/NAPI
  -> netfilter PREROUTING
  -> 路由判断
  -> netfilter INPUT
  -> socket lookup
  -> 应用 accept/read
```

转发路径：

```text
PREROUTING -> 路由 -> FORWARD -> POSTROUTING
```

本机出站：

```text
应用 connect/write
  -> socket
  -> 路由选择
  -> OUTPUT
  -> POSTROUTING
  -> NIC 发包
```

## 知识点详解

## 一、路由选择和源地址选择

查看路由：

```bash
ip route
ip rule
```

判断到某目标会怎么走：

```bash
ip route get 8.8.8.8
ip route get 10.0.0.5 from 192.0.2.10
```

`ip route get` 很关键，因为它会告诉你实际出口网卡、下一跳和源地址。多网卡服务器上，源地址选错会导致回包走错或被对端拒绝。

## 二、socket 和监听

```bash
ss -lntp
ss -antp
ss -uanp
```

监听地址：

- `127.0.0.1:8080`：只本机访问。
- `0.0.0.0:8080`：所有 IPv4 地址。
- `[::]:8080`：IPv6。是否同时接 IPv4 取决于 `net.ipv6.bindv6only` 和应用。

查看：

```bash
sysctl net.ipv6.bindv6only
```

## 三、TCP 状态和问题判断

常见状态：

| 状态 | 含义 | 排查意义 |
| --- | --- | --- |
| `LISTEN` | 服务监听 | 端口已准备接受连接 |
| `SYN-SENT` | 本机发起连接等待回应 | 对端不通或丢包 |
| `SYN-RECV` | 收到 SYN，等待握手完成 | 可能 SYN flood 或回包问题 |
| `ESTAB` | 已建立 | 正常连接 |
| `TIME-WAIT` | 主动关闭后等待 | 多不一定是问题 |
| `CLOSE-WAIT` | 对端关闭，本地未关闭 | 应用未正确关闭 socket |

```bash
ss -ant | awk '{print $1}' | sort | uniq -c | sort -nr
```

`CLOSE-WAIT` 多通常是应用问题；`SYN-SENT` 多可能是网络或对端问题。

## 四、DNS 解析链路

应用通常调用 glibc resolver，解析顺序由 `/etc/nsswitch.conf` 和 resolv.conf/resolved 配置共同决定。

```bash
grep '^hosts:' /etc/nsswitch.conf
getent hosts example.com
dig example.com
resolvectl query example.com 2>/dev/null || true
```

区别：

- `dig` 直接问 DNS，可能绕过 NSS。
- `getent hosts` 更接近应用解析路径。
- Ubuntu 24.04 上 `resolvectl` 能看到 systemd-resolved 行为。

## 五、netfilter、iptables、nftables

netfilter hook：

- PREROUTING
- INPUT
- FORWARD
- OUTPUT
- POSTROUTING

iptables 表：

| 表 | 作用 |
| --- | --- |
| filter | 过滤包 |
| nat | NAT，连接初始包为主 |
| mangle | 修改包标记等 |
| raw | conntrack 前处理 |

nftables 是较新的规则框架。Ubuntu 24.04 常见 nftables 后端；CentOS 7 更常见 iptables/firewalld 旧体系。

查看：

```bash
sudo iptables -S 2>/dev/null || true
sudo iptables -t nat -S 2>/dev/null || true
sudo nft list ruleset 2>/dev/null || true
```

不要只看一种工具。firewalld/ufw 可能生成底层规则。

## 六、conntrack

conntrack 跟踪连接状态，NAT 和有状态防火墙依赖它。

查看表大小：

```bash
cat /proc/sys/net/netfilter/nf_conntrack_count 2>/dev/null || true
cat /proc/sys/net/netfilter/nf_conntrack_max 2>/dev/null || true
```

安装工具后：

```bash
sudo conntrack -S
sudo conntrack -L | head
```

conntrack 表满时常见现象：

- 新连接随机失败。
- 内核日志出现 table full。
- NAT 或服务网关异常。

查看日志：

```bash
journalctl -k | grep -i conntrack
dmesg -T | grep -i conntrack
```

调大上限只是临时手段。还要看连接泄漏、短连接风暴、TIME_WAIT、NAT 网关容量和超时时间。

## 七、防火墙前端：firewalld 和 ufw

CentOS 7 firewalld：

```bash
firewall-cmd --get-active-zones
firewall-cmd --zone=public --list-all
firewall-cmd --add-port=8080/tcp --permanent
firewall-cmd --reload
```

firewalld zone 决定网卡或源地址使用哪组规则。排查时要先确认 active zone。

Ubuntu 24.04 ufw：

```bash
ufw status numbered
ufw allow 8080/tcp
ufw delete <num>
```

ufw 是规则前端，不代表底层没有 nftables 规则。

## 八、抓包判断故障位置

```bash
sudo tcpdump -ni any host 203.0.113.10 and port 443
```

判断：

- 客户端发 SYN，本机没看到：包没到本机，上游网络/安全组/路由。
- 本机看到 SYN，不回 SYN-ACK：本机防火墙、无监听、内核丢弃。
- 本机回 SYN-ACK，客户端没收到：回程路由或上游丢包。
- 握手成功，HTTP 无响应：应用层问题。

## 九、常见 sysctl 网络参数

```bash
sysctl net.ipv4.ip_forward
sysctl net.ipv4.tcp_syn_retries
sysctl net.ipv4.tcp_tw_reuse 2>/dev/null || true
sysctl net.core.somaxconn
sysctl net.ipv4.ip_local_port_range
```

注意：

- 不要盲目复制网络优化参数。
- 旧文章里的 `tcp_tw_recycle` 已被移除，且历史上在 NAT 场景有严重问题。
- CentOS 7 和 Ubuntu 24.04 可用参数不同。

## 十、端口耗尽

大量出站短连接可能耗尽本地临时端口。

查看范围：

```bash
sysctl net.ipv4.ip_local_port_range
```

查看连接：

```bash
ss -ant | awk '{print $1}' | sort | uniq -c
```

处理：

- 应用连接复用。
- 调整连接池。
- 扩大端口范围。
- 增加源 IP。
- 优化 TIME_WAIT 策略，但要谨慎。

## 例子：Connection refused 与 timeout 的区别

`Connection refused` 通常表示目标主机可达，但目标端口没有监听或主动拒绝，收到了 RST。

`timeout` 通常表示包没有得到回应，可能是防火墙丢包、路由不通、目标不可达或回包丢失。

验证：

```bash
curl -v http://host:port/
tcpdump -ni any host host and port port
```

## 练习

1. 用 `ip route get` 判断访问某 IP 的出口网卡和源地址。
2. 启动服务分别监听 127.0.0.1 和 0.0.0.0，观察外部访问差异。
3. 用 firewalld/ufw 放行和拒绝端口，观察 tcpdump。
4. 用 `getent hosts`、`dig`、`resolvectl` 对比 DNS 路径。
5. 查看 conntrack count 和 max。

## 验收

- 能画出本机入站、出站、转发的 netfilter 路径。
- 能解释 firewalld/ufw、iptables/nftables、netfilter 的层级关系。
- 能区分 refused、timeout、DNS failure。
- 能使用 tcpdump 判断包是否到达和是否回包。
- 能说明 conntrack 表满的现象和处理方向。

## 重点

- 网络排障要定位包停在哪一层。
- `ip route get` 比只看 `ip route` 更接近真实决策。
- `getent hosts` 更接近应用解析路径，`dig` 更适合直接验证 DNS。
- Ubuntu 24.04 不能只按旧 iptables 思维排查。

## 难点

- 容器、Kubernetes、云安全组、本机防火墙、NAT、service mesh 可能同时改写网络路径。必须逐层验证，不要只看一个规则表。

## 易错

> **易错：** 看到 `ufw status inactive` 就认为没有防火墙规则。
>
> 正确做法：还要检查 nftables、iptables、云安全组、容器规则和应用自身访问控制。

> **易错：** TIME_WAIT 多就立刻调内核参数。
>
> 正确做法：先判断是否真的端口耗尽或连接失败，优先优化连接复用和应用模型。

