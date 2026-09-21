---
title: "Nginx 学习资料"
date: 2026-09-22
description: "单文件版 Nginx 学习资料：从「请求归哪个 server、归哪个 location、交给谁处理」这三问出发，把十大常用场景写成可直接抄用的配置，再补上请求处理阶段、缓存、安全加固、真实 IP 信任链、DNS 与 Kubernetes、可观测性、容量与内核队列、零停机发布、OpenResty，最后是排障速查、状态码、知识点清单和面试问答。"
tags:
  - "工具&中间件"
  - "Nginx"
  - "学习资料总览"
noReview: true
---

Nginx 的资料很多，但大部分时候卡住人的不是「不知道有这条指令」，而是**知道指令却推不出结果**：为什么这个请求落到了那个 location、为什么 `alias` 少了斜杠就 404、为什么改了配置没生效、为什么日志里全是 499。

所以这份资料的组织方式不是指令字典，而是先给一个统一的心智模型，再把每条配置挂到它上面：

> 一个 HTTP 请求进来，Nginx 只回答三个问题——**归哪个 server？归哪个 location？交给谁处理？**

1. **归哪个 server**：按连接落地的 `地址:端口` 先筛出一组 server，再用 `server_name` 挑一个（挑不出来就用 `default_server`）。这就是虚拟主机。
2. **归哪个 location**：在这个 server 里按 URI 做前缀/正则匹配选出一个 location。规则是确定的，但顺序容易记错。
3. **交给谁处理**：location 里的指令决定最终动作——读本地文件（`root`/`alias`）、转发给上游（`proxy_pass`/`upstream`）、直接返回（`return`）、先发一个内部子请求去鉴权（`auth_request`）、或者干脆交给四层 `stream` 模块转发 TCP/UDP。

十种常用场景，本质上就是这三步的不同组合。

**怎么用这份资料**：第 1 章到第 18 章是主干，覆盖从安装到配置语义的完整基础，建议顺着读；第 19 章以后是按需查的部分（缓存、安全、真实 IP、容量、发布），可以跳着看；最后的速查、清单和面试问答是用来复盘的。所有配置片段都按「能直接抄进 `nginx.conf` 跑起来」的标准写，注释标出的是**抄错会掉进的坑**。

配套的完整示例配置在[附录](#附录一份可直接改用的完整配置)，可以直接改域名和路径后用。

## 目录

**基础与配置语义**

- [1. 安装与常用命令](#1-安装与常用命令)
- [2. 配置骨架与继承陷阱](#2-配置骨架与继承陷阱)
- [3. 请求处理阶段与模块执行链](#3-请求处理阶段与模块执行链)
- [4. 事件模型、worker 与连接上限](#4-事件模型worker-与连接上限)
- [16. location 与 server_name 的匹配算法](#16-location-与-server_name-的匹配算法)
- [17. root、alias、try_files、rewrite 与 return](#17-rootaliastry_filesrewrite-与-return)
- [18. 内置变量分类](#18-内置变量分类)

**常用场景**

- [5. 虚拟主机](#5-虚拟主机)
- [6. 静态站点](#6-静态站点)
- [7. 反向代理](#7-反向代理)
- [8. 负载均衡](#8-负载均衡)
- [9. HTTPS 与 TLS](#9-https-与-tls)
- [10. 文件服务器（autoindex）](#10-文件服务器autoindex)
- [11. 限速（limit_rate）](#11-限速limit_rate)
- [12. 限流（limit_conn / limit_req）](#12-限流limit_conn--limit_req)
- [13. 黑白名单（allow / deny）](#13-黑白名单allow--deny)
- [14. 请求拦截与鉴权（auth_request）](#14-请求拦截与鉴权auth_request)
- [15. 四层代理（stream）](#15-四层代理stream)

**生产能力**

- [19. 缓存（proxy_cache）](#19-缓存proxy_cache)
- [20. 安全加固与常见攻击面](#20-安全加固与常见攻击面)
- [21. 真实 IP 与信任链](#21-真实-ip-与信任链)
- [22. DNS、动态上游与 Kubernetes](#22-dns动态上游与-kubernetes)
- [23. 监控与日志](#23-监控与日志)
- [24. 可观测性与告警](#24-可观测性与告警)
- [25. 性能调优清单](#25-性能调优清单)
- [26. 容量：内核队列、压测与成本](#26-容量内核队列压测与成本)
- [27. 零停机发布：reload、灰度与回滚](#27-零停机发布reload灰度与回滚)
- [28. OpenResty、Lua 与动态模块](#28-openrestylua-与动态模块)

**排障与速查**

- [29. 排障速查](#29-排障速查)
- [30. 状态码速查](#30-状态码速查)
- [31. 命令与验证速查](#31-命令与验证速查)
- [32. 完整知识点清单](#32-完整知识点清单)
- [33. 面试问答](#33-面试问答)
- [附录：一份可直接改用的完整配置](#附录一份可直接改用的完整配置)
- [附录二：综合练习与验收](#附录二综合练习与验收)

## 1. 安装与常用命令

### 选哪种安装方式

| 方式 | 适用 | 注意 |
| --- | --- | --- |
| 官方仓库（`nginx.org/packages` 的 rpm/deb） | **生产首选** | 预先编译好了标准模块，不用管依赖，升级干净 |
| 发行版仓库（`apt`/`yum` 自带） | 图省事 | 版本通常落后一两个大版本，缺新指令 |
| 源码编译 | 需要用第三方模块 / 裁剪 | 要自己解决依赖；`--with-*` 决定功能，漏加就是 `unknown directive` |
| Docker（`nginx:stable-alpine`） | 容器化部署 | 注意配置文件挂载与日志落盘 |
| **OpenResty** | 需要用 Lua 扩展（视频演示用的就是它） | 基于 Nginx 加 LuaJIT，能用 `content_by_lua_block` 写逻辑，但不要把业务逻辑塞进网关 |
| Windows 版 | 本地调试 | 没有 epoll、多 worker 支持差，**不要用于生产** |

装完先做一次体检——`nginx -V` 会打出**编译进去的模块列表**（`--with-http_ssl_module`、`--with-http_v2_module`、`--with-stream` 等）。配置里能用哪些指令，取决于这份清单：

```bash
nginx -v                 # 只管版本
nginx -V                 # 版本 + 编译参数 + 模块清单
nginx -t                 # 检查配置语法（改完配置第一步必跑）
nginx -T                 # 检查并把 include 展开后的完整生效配置打出来（排include迷宫神器）
nginx -c /etc/nginx/nginx.conf   # 指定配置文件
nginx -p /etc/nginx/ -g "daemon off;"  # 指定前缀目录 / 前台运行（容器里常用）
```

### 启停与信号

```bash
nginx                    # 启动
nginx -s stop            # 立即停止（SIGTERM），丢掉正在处理的连接
nginx -s quit            # 优雅停止（SIGQUIT），处理完当前请求再退
nginx -s reload          # 重新加载配置（SIGHUP）★ 最常用
nginx -s reopen          # 重新打开日志文件（SIGUSR1），配合 logrotate
```

`reload` 的行为值得记住，它和「重启」不是一回事：

- master 进程先**校验新配置**。语法错误 → **拒绝加载，继续用旧配置服务**（所以线上 reload 失败通常表现为「改了没生效」，而不是「服务挂了」）。
- 校验通过 → 启动一批新 worker 按新配置工作，同时通知旧 worker **优雅退出**（不再接新连接，把手上请求做完）。所以 reload 理论上**不丢连接**。
- 排查「配置改了不生效」的第一件事：`nginx -T` 看你改的那个文件到底有没有被 include 进去。

系统层面还要确认：`systemctl status nginx`、`ss -lntp | grep nginx`（端口在谁手里）、worker 以哪个用户运行（`ps aux | grep nginx`）。

## 2. 配置骨架与继承陷阱

Nginx 配置是**分层的树**，指令写在哪个层级决定了它的作用域：

```
main（顶层）
├── user / worker_processes / worker_rlimit_nofile / pid / error_log
├── events { ... }                 # 连接处理参数
├── http {                         # 七层
│   ├── mime.types / log_format / gzip / include conf.d/*.conf
│   ├── upstream backend { ... }   # 上游服务器组，必须在 http 内
│   ├── map / limit_req_zone / limit_conn_zone / proxy_cache_path ...
│   ├── server {                   # 虚拟主机
│   │   ├── listen / server_name / root / ssl_certificate ...
│   │   └── location /path/ { ... }  # 或 location ~ regex { ... }
│   └── }
└── stream { ... }                 # 四层（TCP/UDP），与 http 同级
```

一份最小可用骨架：

```nginx
user  nginx;                          # worker 运行用户，决定它能不能读到你的文件
worker_processes  auto;               # = CPU 核数
worker_rlimit_nofile 65535;           # worker 可打开的文件描述符上限（要 ≤ 系统 ulimit）
pid  /var/run/nginx.pid;
error_log  /var/log/nginx/error.log warn;

events {
    worker_connections  10240;        # 单 worker 最大连接数
    multi_accept  on;
    use  epoll;                       # Linux 默认就是 epoll
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    tcp_nopush    on;
    keepalive_timeout  65;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" "$http_user_agent" '
                    'rt=$request_time urt=$upstream_response_time ua=$upstream_addr';
    access_log /var/log/nginx/access.log main;

    include /etc/nginx/conf.d/*.conf;
}
```

### 两个必须记住的继承陷阱

大多数指令是「父级定义、子级可覆盖」；但有一类指令的继承规则是**全有或全无**：

> 如果当前层级出现了该指令，那么**父级的所有同类指令都被丢弃**，而不是合并。

`add_header` 和 `proxy_set_header` 都是这个行为。所以下面这段是错的：

```nginx
http {
    add_header X-Frame-Options SAMEORIGIN always;
    server {
        location /api/ {
            add_header X-Debug 1;      # ← 这一行让 X-Frame-Options 消失了
            proxy_pass http://backend;
        }
    }
}
```

`proxy_set_header` 同理，且更危险：**在 location 里写一条，`http` 层的 `Host`、`X-Real-IP` 就全没了**。

```nginx
http {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    server {
        location /api/ {
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # ← 上面两条失效
            proxy_pass http://backend;
        }
    }
}
```

### 参数单位

| 类型 | 单位 | 例子 |
| --- | --- | --- |
| 时间 | `ms` `s`（默认） `m` `h` `d` `w` `M` `y` | `proxy_read_timeout 60s;` `keepalive_timeout 65;` |
| 空间 | 字节（默认） `k/K` `m/M` `g/G` | `client_max_body_size 10m;` `limit_rate 200k;` |
| 频率 | `r/s`（默认） `r/m` | `limit_req_zone ... rate=10r/s;` |

`limit_req` 的速率小于 1 r/s 时用 `r/m` 更稳（`rate=12r/m` = 每 5 秒一个请求）。

## 3. 请求处理阶段与模块执行链

理解了「配置文件是声明式的」之后，下一个问题就是：既然不是从上往下执行，那**实际执行顺序是什么**？答案是请求处理阶段（phase）。

一次请求在 worker 内部会依次流过这些阶段，每个模块把自己注册到某个阶段上：

| 阶段 | 做什么 | 典型指令 |
| --- | --- | --- |
| `POST_READ` | 刚读完请求头，还没做 URI 匹配 | `real_ip`（真实 IP 替换就在这里） |
| `SERVER_REWRITE` | server 级的 URI 改写、选 location 之前 | server 块里的 `rewrite`、`return` |
| `FIND_CONFIG` | **执行 location 匹配**（不是配置文本顺序） | — |
| `REWRITE` | location 级的 URI 改写 | location 里的 `rewrite`、`if` |
| `POST_REWRITE` | 检查改写后是否需要重新找 location | `rewrite ... last` 在这里触发内部跳转 |
| `PREACCESS` | 访问控制前的准备 | `limit_req`、`limit_conn`、`realip` |
| `ACCESS` | 访问控制 | `allow`/`deny`、`auth_basic`、`auth_request` |
| `POST_ACCESS` | 访问控制后 | `satisfy` 的判定 |
| `PRECONTENT` | 内容处理前 | `try_files`、`mirror` |
| `CONTENT` | 产出响应内容 | `proxy_pass`、`root`/`index`、`return`、`grpc_pass` |
| `LOG` | 记录日志 | `access_log` |

三个由此推出的结论，几乎能解释一大半「配置行为看起来很奇怪」的现象：

1. **`return` 与 `rewrite` 在 `CONTENT` 之前就生效**，所以它们能「抢在」`proxy_pass` 前面。这也是 `if` 里 `return` 好用、而 `if` 里 `proxy_pass` 不可靠的原因——`if` 属于 REWRITE 阶段，`proxy_pass` 属于 CONTENT 阶段，「顺序反了」。
2. **`real_ip` 在 `POST_READ` 执行**，也就是说 `$remote_addr` 的真正替换发生在 access 阶段之前。所以基于 IP 的 `allow`/`deny`、`limit_req` 用的**已经是替换后的真实 IP**——前提是你配了 `set_real_ip_from`。
3. **`rewrite ... last` 会回到 `FIND_CONFIG` 重新匹配 location**，而 `break` 不会。这是这两个 flag 唯一需要记的区别。

还有一个容易踩的点：**同一个阶段里多个模块的执行顺序由模块编译顺序决定，而不是配置里的书写顺序**。所以模块之间的相互作用（比如 `auth_request` 和 `limit_req` 谁先）不要靠猜，用日志和小规模实验确认。

### `internal redirect` 与命名 location

有些动作不会重新走一遍网络，而是在 Nginx 内部重新发起一次处理，这叫内部重定向：

- `rewrite ... last;`
- `try_files` 的最后一个参数
- `error_page` 指向的 location
- `auth_request` 发起的子请求
- 后端返回 `X-Accel-Redirect` 头（常用于「鉴权在应用、传输交给 Nginx」）

内部重定向的 URI 会**重新参与 location 匹配**，且可以命中 `location @name {}`（命名 location 只能被内部跳转命中，客户端无法直接访问）。`internal` 指令则更进一步：把一个普通 location 也变成「只允许内部访问」。

## 4. 事件模型、worker 与连接上限

### master / worker

| 进程 | 职责 |
| --- | --- |
| master | 读配置、校验配置、管理 worker 生命周期、处理信号、打开监听套接字 |
| worker | 真正处理连接：读写、请求解析、代理上游、写日志 |
| cache manager / loader | 只在用了 `proxy_cache` 时存在，负责清理过期缓存、加载缓存索引 |

master 不是「包工头」，更像一个看门人：它自己不处理任何请求。**这也是 reload 能做到不断流量的原因**——监听套接字一直在 master 手里，换的只是 worker 和它们各自的一份运行时配置。

### 为什么一个 worker 能扛几千连接

传统模型是「一个连接一个线程/进程」，连接数一多，内存和上下文切换先崩。Nginx 走的是事件驱动：worker 把每个 socket 注册到内核的多路复用接口（Linux 上是 epoll），然后在单线程里跑事件循环——**只有真正就绪的 socket 才被处理**，等待期间线程不占用、不阻塞。

由此推出两条运维结论：

- **任何阻塞 worker 的操作都会拖垮该 worker 上的所有连接**（一段慢磁盘 IO、一个同步的第三方模块、一次阻塞的 DNS 解析）。Nginx 的可预测性建立在「回调永不阻塞」这条纪律上。
- **CPU 核数决定 worker 数的上限**，因为一个 worker 只有一个事件循环、只能用一个核。`worker_processes auto` 就是取核数；设得比核数大只会增加上下文切换。

### `reuseport` 与惊群

多个 worker 监听同一个端口时，需要解决「谁来 accept」的问题：

```nginx
server {
    listen 80 reuseport;   # 每个 worker 一个独立监听套接字，内核层做负载均衡
}
```

`reuseport`（Linux 3.9+）让每个 worker 有自己独立的监听队列，避免多个 worker 被同时唤醒去抢同一个连接（惊群）。它是「加吞吐」而不是「修 bug」的手段，且只在 `listen` 上生效——不确定收益时不要为了它引入行为差异。

### 连接数上限，以及为什么它不等于并发用户数

```
理论上限 ≈ worker_processes × worker_connections
```

这个数字经常被高估，因为有几个折算：

- **反向代理时一个请求占两个连接**（客户端连接 + 上游连接）。所以真正能同时服务的请求数大约是上面的一半。
- **文件描述符必须够**：`worker_rlimit_nofile`（Nginx 侧）和系统 `ulimit -n` / systemd 的 `LimitNOFILE`（内核侧）都要够大，一般取 `worker_connections × 2` 以上。
- **keepalive 连接也算数**。空闲的 `Waiting` 连接同样占着 fd 和内存，所以 `keepalive_timeout` 调太长会把连接额度耗在闲人身上。

一个实用的判断口径：如果 `stub_status` 里的 `accepts` 大于 `handled`，说明**已经撞到过连接数或 fd 上限**了，有连接被丢弃——这时候该调的是上限，而不是继续加机器。

## 5. 虚拟主机

**一台 Nginx 用一套配置服务多个站点**，靠三个维度区分：端口、IP、域名。

```nginx
# ① 基于端口（本地多环境最省事）
server { listen 8081; server_name localhost; root /data/site-a; }
server { listen 8082; server_name localhost; root /data/site-b; }

# ② 基于 IP（本机多网卡 / 多 IP）
server { listen 192.168.1.10:80; server_name _; root /data/site-a; }
server { listen 192.168.1.11:80; server_name _; root /data/site-b; }

# ③ 基于域名（公网唯一正确的做法）
server { listen 80; server_name www.a.com;  root /data/site-a; }
server { listen 80; server_name www.b.com;  root /data/site-b; }
```

### 兜底 server 与防 IP 直连

同一端口上，没写 `default_server` 时**第一个 server 就是默认 server**——所以 `include conf.d/*.conf` 的**文件名顺序会影响默认站点是谁**，这是个很容易踩的隐性依赖。显式声明：

```nginx
server {
    listen 80 default_server;
    server_name _;              # `_` 不是通配符，只是个永远匹配不上的无效名字
    return 444;                 # 444 是 Nginx 私有的：不回任何响应直接关连接
}
```

`return 444` 常用于挡掉直接用 IP 访问、扫端口、以及 Host 头伪造的探测流量。注意它**不返回任何 HTTP 响应**，所以在浏览器里表现为「连接被重置」，在监控里表现为 `499` 或没有状态码记录。

## 6. 静态站点

```nginx
server {
    listen 80;
    server_name static.example.com;
    root  /data/www/dist;        # 前端构建产物目录
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;     # SPA 回退：找不到就交给 index.html
    }

    # 带 hash 的构建产物可以长期缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?|ico)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        access_log off;
    }

    location = /index.html {     # 首页不缓存，否则发版后用户还拿着旧 HTML
        add_header Cache-Control "no-cache";
    }
}
```

几个关键点：

- **`try_files $uri $uri/ /index.html;` 是 Vue/React 单页应用的标准写法**。不写它，用户刷新 `/about` 会直接 404（因为服务端没有 `/about` 这个文件或目录）。最后一个参数是「前面都没命中时」的回退目标，可以是路径，也可以是 `=404` 或 `@named`.
- **目录权限**：worker 用户（`user nginx;`）必须对**整条路径上的每一级目录**有 `x` 权限，对文件有 `r` 权限。少一级 `x` 就是 403，而且报错信息只说 "Permission denied"，不告诉你是哪一级。
- 视频里提到的「把纯前端静态页面交给 Nginx 解析」就是这个场景；同时它还常和反向代理组合使用：`/` 交给本地文件，`/api/` 转发给后端——见下一个场景。

## 7. 反向代理

反向代理是 Nginx 真正的核心：客户端只认识代理，不知道后面有几台服务器。

```nginx
server {
    listen 80;
    server_name app.example.com;

    # 前端：本地静态文件
    location / {
        root  /data/www/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端：转发给上游
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;    # ★ 末尾这个斜杠决定 URI 怎么拼

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 5s;      # 与上游建连超时
        proxy_send_timeout    60s;     # 向上游写请求
        proxy_read_timeout    60s;     # 等上游响应

        client_max_body_size  10m;     # 上传大文件必须调，默认只有 1m
        proxy_buffering       on;
        proxy_buffer_size     8k;      # 上游响应头超过它 → 502
    }
}
```

### `proxy_pass` 的末尾斜杠（最高频的坑）

带 URI 的 `proxy_pass`，会把**匹配到的那段 location 前缀替换掉**；不带 URI 的则把原始 URI 原样传过去：

| location | proxy_pass | 请求 `/api/users` 到达上游的 URI |
| --- | --- | --- |
| `location /api/` | `http://backend/` | `/users`（前缀被替换成 `/`） |
| `location /api/` | `http://backend` | `/api/users`（URI 原样） |

经验规则：**location 和 proxy_pass 要么都带末尾斜杠，要么都不带**。混着写不会报错，但转发出去的路径和你以为的不一样，症状是后端 404。

另外两种情况**不要指望前缀替换**：

- 在**正则 location** 里给 `proxy_pass` 带 URI：官方也不推荐，因为「该替换哪一段」本身就说不清。要改 URI 就显式 `rewrite ... break;`。
- `proxy_pass` 里用了**变量**（如 `proxy_pass http://$backend;`）：URI 原样转发，且必须配 `resolver`。

### 转发头

不设这些头，后端拿到的永远是「请求来自 Nginx 本机」：

| 头 | 作用 | 常用值 |
| --- | --- | --- |
| `Host` | 保留原始域名，后端做域名路由/签名校验时要 | `$host` |
| `X-Real-IP` | 真实客户端 IP（单值） | `$remote_addr` |
| `X-Forwarded-For` | IP 链（逗号分隔，可追加） | `$proxy_add_x_forwarded_for` |
| `X-Forwarded-Proto` | 原始协议，后端生成绝对 URL / 判断是否 HTTPS | `$scheme` |

注意 `X-Forwarded-For` 是**客户端可以伪造**的：只有在你自己最外层那个代理上追加的那一段才可信。所以在 Nginx 里信任它、用它当客户端 IP，必须配合 `set_real_ip_from` 限制来源（见 [黑白名单](#13-黑白名单allow--deny)）。

### 流式响应与 WebSocket

```nginx
# SSE / 流式输出：必须关缓冲，否则后端吐一句、Nginx 攒一整块才发
location /stream/ {
    proxy_pass http://backend;
    proxy_buffering off;                  # 或者由后端返回 X-Accel-Buffering: no
    proxy_cache off;
    chunked_transfer_encoding on;
}

# WebSocket：靠 Upgrade 头把连接「升级」
location /ws/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;               # WebSocket 要求 1.1
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;             # 长连接别用默认 60s
}
```

### 上游是 HTTPS 或 gRPC

```nginx
location /pay/ {
    proxy_pass https://pay.internal;      # 上游用 https
    proxy_ssl_server_name on;             # 发 SNI，虚拟主机托管的上游必需
    proxy_ssl_verify on;                  # 校验上游证书（默认 off！）
    proxy_ssl_trusted_certificate /etc/nginx/ssl/ca.pem;
}

location /rpc/ {
    grpc_pass grpc://backend:50051;       # gRPC 用 grpc_pass，不是 proxy_pass
}
```

## 8. 负载均衡

```nginx
upstream backend {
    # 算法：见下表；这一行不写就是轮询
    least_conn;

    server 10.0.0.11:8080 weight=3 max_conns=100;   # 权重 3，最多 100 个并发
    server 10.0.0.12:8080 weight=1 max_fails=2 fail_timeout=10s;
    server 10.0.0.13:8080 backup;                   # 备用：主节点全挂才用
    server 10.0.0.14:8080 down;                     # 手动摘除（配合发布）

    keepalive 64;                                   # ★ 与上游保持 64 个空闲长连接
}

server {
    location /api/ {
        proxy_pass http://backend;

        # ★ 让上游长连接真的生效：这两行必须写
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # 失败重试：默认只在这些情况下换节点
        proxy_next_upstream error timeout http_502 http_503 http_504;
        proxy_next_upstream_tries   3;    # 0 = 不限次数（试完所有节点）
        proxy_next_upstream_timeout 10s;  # 0 = 不限时间
    }
}
```

### 算法

| 算法 | 写法 | 语义 | 适用 |
| --- | --- | --- | --- |
| 轮询 | 默认 | 按权重轮流 | 后端同构、无状态 |
| 加权轮询 | `weight=n` | 按权重比例分流 | 机器配置不同 |
| IP 哈希 | `ip_hash` | 同一客户端 IP 固定到同一台 | 需要会话粘滞；**NAT/CDN 后大量用户共用一个 IP 会严重倾斜** |
| 一致性哈希 | `hash $key consistent;` | 按任意 key 哈希，节点增减时迁移少 | `$request_uri` 做缓存分片、`$cookie_jsessionid` 做粘滞 |
| 最小连接 | `least_conn` | 选当前连接数最少的（带权重） | 请求耗时差异大 |
| 随机 | `random two least_conn;` | 随机取两台，挑更好的那台 | 节点多、想避免轮询的同步性 |

**会话共享要不要靠 `ip_hash`？** 能用，但它只是把问题推后：IP 一变（切 WiFi、换手机网络、走 CDN）会话就丢；多级代理后所有用户还可能是同一个 IP。更稳的做法是**后端把会话集中到 Redis**，让上游真正无状态，Nginx 就随便轮询。

### 失败重试的三个默认值

- `proxy_next_upstream` 默认是 **`error timeout`**——也就是说上游返回 **502/504/500/404 都不会重试**，会原样返回给用户。要重试 5xx 必须显式加上 `http_500 http_502 http_503 http_504`。
- **只有幂等请求才会重试**。`POST` 默认不重试，除非加 `non_idempotent`——加之前想清楚：重试一个已经执行了一半的写请求可能造成重复下单。
- `max_fails` / `fail_timeout` 是**被动**健康检查：默认 `max_fails=1 fail_timeout=10s`，即失败 1 次就把节点摘掉 10 秒。**开源版没有主动健康检查**（`health_check` 是 NGINX Plus 的商业功能），需要主动探测就得靠旁路脚本改 upstream、`nginx_upstream_check_module`、或者 OpenResty。

视频里的演示正好覆盖了这两半：不配 `proxy_next_upstream` 时，某个节点返回 404/500，用户就直接看到这个错误；配了之后（`proxy_next_upstream_tries 0;` 表示一直重试）请求会一直换节点，直到拿到成功结果——**代价是响应变慢**（他演示时也提到「转发次数多的话，它肯定会慢」），所以要配超时兜底。

## 9. HTTPS 与 TLS

TLS 在 Nginx 上终结（卸载）：客户端到 Nginx 是 HTTPS，Nginx 到后端走内网 HTTP。好处是**握手和加解密这些 CPU 开销都留在网关这一层**，后端应用不用管证书轮换；代价是内网是明文，安全等级要求高时用 `proxy_pass https://` 重新加密，或改成 `grpc`/内网 mTLS。

### 自签证书（测试用）

```bash
# 一条命令生成带 SAN 的自签证书（OpenSSL 1.1.1+ 支持 -addext）
# 现代浏览器只认 SAN，不再认 CN，别省这一步
openssl req -x509 -nodes -days 3650 \
  -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/server.key \
  -out    /etc/nginx/ssl/server.crt \
  -subj "/C=CN/O=Test/CN=example.com" \
  -addext "subjectAltName=DNS:example.com,DNS:*.example.com,IP:127.0.0.1"
```

生产用 Let's Encrypt（`certbot`）或云厂商证书，并把**服务器证书 + 中间证书按顺序写在同一个 `ssl_certificate` 文件里**——只放服务器证书，部分客户端（老 Android、Java 客户端、curl 某些版本）会报证书链不完整。

### 配置

```nginx
server {
    listen 443 ssl;
    http2  on;                       # Nginx ≥ 1.25.1 的写法；之前是 listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    ssl_protocols             TLSv1.2 TLSv1.3;
    ssl_ciphers               ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;   # 由客户端选（现代客户端的选择通常更好）

    ssl_session_cache   shared:SSL:10m;   # 1m ≈ 4000 个会话
    ssl_session_timeout 1d;
    ssl_session_tickets off;              # 关掉更符合前向安全要求

    ssl_stapling on;                      # OCSP 装订，客户端不用再去问 CA
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/nginx/ssl/chain.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    root /data/www/dist;
    location / { try_files $uri $uri/ /index.html; }
}

# HTTP 全部跳到 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

几点经验：

- **同一台机器上多个 HTTPS 域名可以共用一个 443**，Nginx 靠 **SNI** 区分并挑对应的证书——每个域名仍然各写一个 `server` 块即可。
- 自签证书浏览器一定报「不安全」，这不是配置错了，是信任链的问题（本地开发可以把它加进系统信任列表）。
- **证书更新后不需要重启**，`nginx -s reload` 就会重新读取证书文件；但**必须 reload**，否则旧证书一直用到进程退出。
- `proxy_pass https://` 到上游时，`proxy_ssl_verify` 默认是 **off**，等于不校验上游证书；要校验得自己打开并给 `proxy_ssl_trusted_certificate`。这是个常见的安全缺口。

## 10. 文件服务器（autoindex）

用来做内部资料库、构建产物下载、日志归档最省事——打开 `autoindex` 就能得到一个目录列表页。

```nginx
server {
    listen 8080;
    server_name files.internal;
    charset utf-8;

    location /files/ {
        alias /data/files/;
        autoindex on;
        autoindex_exact_size off;   # 用 KB/MB/GB 显示，而不是精确字节数
        autoindex_localtime on;     # 显示本地时间（默认 GMT，容易看成"时间错乱"）
        autoindex_format html;      # 也可以 json/xml/jsonp，交给前端渲染

        auth_basic "restricted";
        auth_basic_user_file /etc/nginx/.htpasswd;   # htpasswd -c 生成
        limit_rate 2m;                # 顺手限个速，别把带宽打满
    }

    # 隐藏文件一律不给
    location ~ /\. { deny all; }
}
```

三个要注意的点：

- **`autoindex` 只在「没有找到 index 文件」时才列目录**。目录里有 `index.html` 就会直接返回它，看不到列表。
- **`alias` 用在这里是必要的**（不是 `root`）：`location /files/ { root /data/files; }` 会把 URL 里的 `/files/` 也拼进路径，变成 `/data/files/files/...`。详见下文 [root vs alias](#17-rootaliastry_filesrewrite-与-return)。
- **目录列举就是信息泄露**。生产上至少加认证；对外的下载站建议改成「按 ID 查表 + `X-Accel-Redirect` 内部跳转」，既能鉴权又不让客户端直接猜路径。

## 11. 限速（limit_rate）

限速限的是**单个请求的响应传输速度**，指令是 `limit_rate`，单位**字节/秒**（可带 `k`/`m` 后缀）：

```nginx
location /download/ {
    alias /data/files/;
    limit_rate_after 1m;   # 前 1MB 不限速（快速出首屏/让播放器先缓冲）
    limit_rate       200k; # 之后 200KB/s
}

# 也可以用变量动态限速（按用户等级给不同速度）
map $arg_level $rate {
    default 100k;
    vip     2m;
}
location /media/ {
    set $limit_rate $rate;   # $limit_rate 是 Nginx 变量，赋值即生效
    alias /data/media/;
}
```

要分清的三个「限速」：

| 指令 | 限制的是 | 典型用途 |
| --- | --- | --- |
| `limit_rate` | 往**客户端**写响应的速度 | 下载站防止单个用户占满带宽 |
| `limit_rate_after` | 前 N 字节不限速的额度 | 大文件下载/视频播放优化首屏 |
| `proxy_limit_rate` | 从**上游**读响应的速度 | 保护后端，避免慢客户端把上游连接占满 |

**最重要的局限**：`limit_rate` 是**按请求**生效的，一个客户端开 8 个并发连接就能拿到 8 倍带宽。想按 IP 限总带宽，得靠 `limit_conn`/`limit_req` 限制连接数与请求数，或者在内核层用 `tc` 做流量整形。

还有个实践细节（视频演示里也碰上了）：**改了 `limit_rate` 后，正在进行的那个响应仍按旧值走**，下一次请求才用新值。因为限速值是在请求处理时读取的；改配置后没 reload、或者对方连接已经建立，都不会立即生效。

## 12. 限流（limit_conn / limit_req）

限流有两个正交的维度，别混：

- **`limit_conn`：并发连接数**（同一时刻有几个连接）
- **`limit_req`：请求速率**（单位时间允许多少个请求）

两者都靠**共享内存 zone** 在多个 worker 之间共享计数——这也是为什么必须先声明 zone、再在 location 里引用它。

```nginx
http {
    # 定义两个 zone。
    # key 用 $binary_remote_addr（IPv4 只占 4 字节）比 $remote_addr（7~15 字节）省内存
    limit_conn_zone $binary_remote_addr zone=conn_per_ip:10m;
    limit_req_zone  $binary_remote_addr zone=req_per_ip:10m rate=10r/s;

    server {
        location /download/ {
            limit_conn        conn_per_ip  2;      # 同一 IP 最多 2 个并发连接
            limit_conn_status 429;                 # 默认 503，改成 429 语义更准
            limit_conn_log_level warn;
        }

        location /api/ {
            limit_req        zone=req_per_ip burst=20 nodelay;
            limit_req_status 429;
        }
    }
}
```

### 速率的语义：匀速，不是「窗口内配额」

`rate=12r/m` **不是**「一分钟内还够 12 次就放行」，而是**每 5 秒放行一个**，平均分布。所以前 5 秒内打了两个请求，第二个就会被拒。这一点和很多人直觉里的「令牌桶一分钟补满 12 个」不一样，视频里也专门强调了这个「平均切割」。

### 漏桶、burst 与 nodelay

- 超出速率的请求进入**漏桶**排队，桶的容量由 `burst` 决定；桶满之后**直接拒绝**（返回 `limit_req_status`，默认 503）。
- 不写 `burst` → 超出的请求**立即被拒**，没有排队。
- **不写 `nodelay`**：排队的请求会被**延迟**处理（客户端表现为响应变慢，但不报错）。
- **写了 `nodelay`**：`burst` 个请求**立即放行**（不等待），但仍会占用桶位、按速率慢慢释放。所以瞬时通过量约等于 `rate + burst`，之后开始拒绝。
- `delay=n`（Nginx ≥ 1.15.7）是折中：前 n 个立即放行，其余延迟。
- `limit_req_dry_run on;`（≥ 1.17.1）只记日志不拒绝，**上生产前用来估容量非常有用**。

视频里的实测正好演示了这个公式：`rate=12r/m`（每 5 秒一个）+ `burst=5`，5 秒内通过 6 次（5 + 1）——第 7 次开始失败；桶随时间漏掉之后，后面的请求又能通过。

### 两个生产上必踩的坑

1. **在 CDN / 上一层代理后面，`$remote_addr` 是代理的 IP**。不配 `real_ip`，`limit_req` 会把**所有用户当成同一个人**限流，正常流量被误杀。配置见下一节。
2. **`limit_conn` 和 `limit_req` 是两个独立开关**，不会互相兜底。只配了 `limit_conn`，客户端串行发请求一样能打满 QPS。

zone 容量的经验值：`limit_req_zone` 官方给的量级是 **1 MB ≈ 16,000 条状态**（每个 IP 一条），10 MB 够十几万 IP。`limit_conn_zone` 的单条状态更小，同样容量能装更多。

## 13. 黑白名单（allow / deny）

`allow` / `deny` 来自 `ngx_http_access_module`，**按出现顺序匹配，第一条命中的规则生效**，没有任何规则命中则**默认放行**：

```nginx
location /admin/ {
    allow 192.168.1.0/24;    # 从下往上？不，是从上往下，第一个命中的规则说话
    allow 10.0.0.1;
    deny  all;               # ★ 必须放在最后
}

# 用 geo 做网段到变量的映射，比一长串 allow/deny 更好维护、还能复用
geo $is_internal {
    default 0;
    10.0.0.0/8     1;
    172.16.0.0/12  1;
    192.168.0.0/16 1;
}
server {
    location /internal/ {
        if ($is_internal = 0) { return 403; }
        proxy_pass http://backend;
    }
}
```

`deny all;` 写在前面会让后面所有 `allow` 永久失效（第一条就命中了）。这个顺序错误很常见，而且不报任何错。

### 真实 IP：黑白名单和限流的前置条件

```nginx
# 只信任这几层的 X-Forwarded-For，其余来源一律忽略（防止客户端伪造）
set_real_ip_from  10.0.0.0/8;
set_real_ip_from  172.16.0.0/12;
set_real_ip_from  203.0.113.10;      # 你的 CDN / LB 出口 IP
real_ip_header    X-Forwarded-For;
real_ip_recursive on;                # 从右往左跳过可信代理，取第一个不可信地址
```

配完之后 `$remote_addr` / `$binary_remote_addr` 才是真实客户端 IP。**`set_real_ip_from` 列的范围必须严格等于你自己的代理设备**——把 `0.0.0.0/0` 写进去，等于把「谁是真的客户端」这个判断交给攻击者。

## 14. 请求拦截与鉴权（auth_request）

场景是：请求到达某个路径时，**先发一个内部子请求去鉴权**，通过了才继续处理原请求，没通过就按失败处理。这正是 `ngx_http_auth_request_module` 的 `auth_request`：

```nginx
server {
    listen 80;

    location /private/ {
        auth_request      /_auth;                      # ★ 先发子请求去鉴权
        auth_request_set  $auth_user $upstream_http_x_user;   # 把鉴权结果带下来
        proxy_set_header  X-User $auth_user;

        proxy_pass http://backend/;
    }

    location = /_auth {
        internal;                                      # ★ 只能被内部子请求访问，外部直接 404

        proxy_pass              http://auth-server/verify;
        proxy_pass_request_body off;                   # 鉴权不需要请求体
        proxy_set_header        Content-Length "";
        proxy_set_header        X-Original-URI $request_uri;   # 把原始 URL 告诉鉴权服务
    }

    # 鉴权失败时给个友好的登录页
    error_page 401 = @login;
    location @login {
        return 302 /login?next=$request_uri;
    }
}
```

状态码约定（模块写死的，不能改）：

| 鉴权子请求返回 | 结果 |
| --- | --- |
| 2xx | 放行，继续处理原请求 |
| 401 | 客户端收到 401（并把子请求的 `WWW-Authenticate` 头带回） |
| 403 | 客户端收到 403 |
| 其他 | 客户端收到 **500**（鉴权服务写错了代码、或者它自己也 500 了，就会变成这个） |

几个设计要点：

- **`internal` 是必须的**。没有它，`/_auth` 就成了一个对外暴露的反代端点，别人可以直接打它。
- **`location = /_auth` 用 `=` 精确匹配**，避免被别的 `location /` 抢走。
- **不在鉴权子请求里转发请求体**：`proxy_pass_request_body off` + 清空 `Content-Length`，否则大文件上传会被复制两份，还可能因为上游读不到 body 而挂住。
- **`auth_request_set` 是把鉴权结论「传递」给业务后端的唯一途径**（通过响应头）。子请求的变量作用域只在子请求内，不会自动出现在主请求里。
- **子请求鉴权会为每个原始请求增加一次内部往返**，是整个请求链路里的一跳额外延迟；高频接口建议在 Nginx 侧用 `map` + `limit_req` 做粗筛，只把可疑流量送去鉴权服务。

### 和「用 if 直接写鉴权」的区别

简单判断（比如「只允许内网 + 指定 header」）确实可以用 `if` + `return`，但 `if` 属于 rewrite 模块，**处于请求处理的早期阶段**，和内容阶段的指令组合时行为反直觉（这就是著名的 "If is Evil"）。经验法则：

- `if` 里只写 `return` 和 `rewrite`，**不要**在 `if` 里写 `proxy_pass`、`add_header`、`try_files`。
- 条件判断优先用 `map` 做（它不改变请求处理流程，只求值）。
- 需要真正的鉴权逻辑（调服务、验 token）就用 `auth_request`。

## 15. 四层代理（stream）

前面十个场景全部工作在**七层**（HTTP），能看到 URL、Header、Cookie。`stream` 模块工作在**四层**：它只转发字节流，不知道里面装的是 HTTP 还是 MySQL 协议。

```nginx
# stream 与 http 同级，不是 http 的子块
stream {
    upstream mysql_backend {
        least_conn;
        server 10.0.0.21:3306;
        server 10.0.0.22:3306;
    }

    server {
        listen 3306;
        proxy_pass mysql_backend;
        proxy_connect_timeout 5s;
        proxy_timeout 600s;        # 连接空闲多久后断开（默认 10m），长连接要调大
    }

    # UDP 也能代理（DNS、Syslog、QUIC 之类）
    server {
        listen 53 udp;
        proxy_pass 10.0.0.53:53;
    }
}
```

几个和七层不一样的地方：

- **`proxy_timeout` 是「数据空闲超时」，不是握手超时**。数据库、MQ 这类长连接池很容易被默认的 10 分钟剪断，表现为「用一会儿就掉线」。
- `stream` 里没有 `location`、没有 `root`、没有 URI 概念，路由只能按监听端口或 TLS SNI 来分。
- 需要编译时有 `--with-stream`（官方 rpm/deb 包都有），否则 `stream` 是 `unknown directive`。

### 按 SNI 分流（四层 TLS 透传）

四层代理通常不终止 TLS，但可以**偷看 ClientHello 里的 SNI** 来决定转发到哪里，证书留在后端：

```nginx
stream {
    map $ssl_preread_server_name $backend {
        default          app_default;
        api.example.com  app_api;
        static.example.com app_static;
    }

    upstream app_default { server 10.0.0.31:8443; }
    upstream app_api     { server 10.0.0.32:8443; }
    upstream app_static  { server 10.0.0.33:8443; }

    server {
        listen 443;
        ssl_preread on;          # 只读 SNI，不做 TLS 握手
        proxy_pass $backend;
    }
}
```

### 真实 IP 与 PROXY protocol

四层转发会丢掉客户端地址，所以要用 PROXY protocol 把原始地址「说」给下一跳：

```nginx
server {
    listen 3306 proxy_protocol;   # LB 必须真的发 PROXY protocol，否则直接握手失败
    proxy_pass mysql_backend;
    set_real_ip_from 10.0.0.0/8;  # 只信任你的 LB 网段
}
```

**协议不匹配是双向的**：LB 发了而 Nginx 没配 `proxy_protocol`，Nginx 会把 PROXY 头当成业务数据的开头（HTTP 直接 400、MySQL 直接协议错误）；反过来 Nginx 配了而 LB 没发，也会握手失败。改这个配置前后要同时确认两端。

四层代理的常见用途：数据库/Redis 读写分离与高可用入口、MQ 端口收敛、SMTP、以及「不改后端 TLS 配置也要统一入口证书」的 SNI 透传场景。

## 16. location 与 server_name 的匹配算法

### server_name 的优先级

同一个 `地址:端口` 上的多个 server，按下面顺序挑：

1. **精确名字**：`server_name www.example.com;`
2. **最长**的左通配：`*.example.com`（注意它能匹配多级，如 `a.b.example.com`）
3. **最长**的右通配：`mail.*`
4. **第一个**匹配的正则（按配置文件里的出现顺序）
5. 都没命中 → 该端口的 `default_server`（没声明就是第一个 server）

两个细节：`*.example.com` **不匹配** `example.com` 本身；要同时匹配两者，写 `.example.com`（`.` 开头）。没有 `Host` 头的请求由 `server_name ""` 的 server 处理。

### location 的优先级

```
①  location = /exact              精确匹配，命中即结束
②  location ^~ /prefix/           前缀匹配，命中后不再检查正则（仅当它是最长前缀时）
③  location ~  regex   /  ~*     正则匹配，按出现顺序，第一个命中即结束
④  location /prefix/              普通前缀，记住最长的那个
⑤  location /                     兜底
```

精确的流程是：**先找最长前缀 → 如果它带 `^~`，直接用，不再看正则 → 否则按顺序试正则，命中就用正则 → 正则全不命中，用刚才那个最长前缀**。

```nginx
location = /            { return 200 "A: exact /\n"; }
location ^~ /images/    { return 200 "B: ^~ /images/\n"; }
location ~ \.png$       { return 200 "C: regex png\n"; }
location /images/       { return 200 "D: prefix /images/\n"; }
location /              { return 200 "E: prefix /\n"; }
```

- `/` → A（精确优先）
- `/images/a.png` → B（`^~` 抑制了正则 C）
- `/other/a.png` → C（前缀 `/` 不是 `^~`，所以继续试正则，C 命中）
- `/images/a.txt` → B（`^~` 依然生效）

**`@name` 命名 location** 不参与 URI 匹配，只能被内部跳转使用（`try_files`、`error_page`、`rewrite ... last`、`X-Accel-Redirect`）。

### location 末尾的斜杠

`location /test/` 与 `location /test` 的区别不止是「多一个字符」：

- `location /test`（不带斜杠）能匹配 `/test`、`/test/`、`/testabc`。它把 `test` 当**前缀**。
- `location /test/`（带斜杠）只匹配 `/test/` 开头，`/test` 本身**不匹配**（会 404 或者落到别的 location）。

和 `alias` 搭配时这条会变成硬性要求，见下一节。

## 17. root、alias、try_files、rewrite 与 return

### root vs alias

**`root` 是「拼」：`root` 的值 + 完整 URI。`alias` 是「换」：用 `alias` 的值替换掉 location 匹配到的那一段。**

假设磁盘上有 `/data/www/img/logo.png`：

```nginx
# root：/data/www + /img/logo.png  →  /data/www/img/logo.png  ✔
location /img/ {
    root /data/www;
}

# 用 root 想达到同样效果，路径会变成 /data/www/img/img/logo.png  ✘
# alias：把 /img/ 换成 /data/www/img/  →  /data/www/img/logo.png  ✔
location /img/ {
    alias /data/www/img/;
}
```

| | 路径构造 | 末尾斜杠 | 用在正则 location |
| --- | --- | --- | --- |
| `root` | `root` + 完整 URI | 可有可无 | 可以 |
| `alias` | `alias` 替换 location 前缀 | **跟着 location 一起带或不带** | 可以用捕获组，但容易踩坑，建议避免 |

`alias` 的斜杠规则：`location /files/ { alias /data/files/; }` 两边都有斜杠，语义一致；写成 `location /files { alias /data/files/; }` 时，请求 `/files/x` 会被替换成 `/data/files/x`，而 `/filesx` 也会被匹配到并替换成 `/data/filesx`——**不是你想要的行为**。

### try_files

```nginx
try_files $uri $uri/ /index.html;        # 依次尝试：文件 → 目录 → 回退到 index.html
try_files $uri $uri/ =404;               # 都没有就 404（静态站点更常用这个）
try_files $uri @backend;                 # 交给命名 location 处理
```

注意 `$uri/` 会触发目录索引（配合 `index` 使用）。SPA 必须用最后一个参数兜底，否则刷新子路由 404。

### rewrite 与 return

```nginx
# return：终止请求，直接给响应或重定向。执行后，location 里后面的指令都不再执行
return 301 https://$host$request_uri;    # 永久重定向
return 302 /login;                       # 临时重定向
return 403;                              # 直接拒绝
return 200 "ok\n";                       # 直接给个字符串（调试很方便）

# rewrite：改 URI，然后按 flag 决定后续怎么走
rewrite ^/old/(.*)$ /new/$1 last;        # 用新 URI 重新做一次 location 匹配
rewrite ^/app/(.*)$ /$1     break;       # 停在当前 location，继续执行本 location 的其余指令
rewrite ^/a$ /b redirect;                # 302
rewrite ^/a$ /b permanent;               # 301
```

| flag | 行为 |
| --- | --- |
| 不带 | 继续执行后面的 rewrite 指令 |
| `last` | 用改写后的 URI **重新跑一遍 location 匹配** |
| `break` | 停止 rewrite，**留在当前 location** 继续执行其余指令 |
| `redirect` / `permanent` | 直接返回 302 / 301 给客户端 |

**优先用 `return`**：它语义清晰、在请求处理的早期就终止，性能更好。`rewrite` 只在「确实需要改写 URI 再重新匹配」时用。

## 18. 内置变量分类

变量是配置里的「胶水」，按来源大致分五类。最常用的是 HTTP 请求类：

| 变量 | 含义 | 备注 |
| --- | --- | --- |
| `$remote_addr` | 客户端 IP | 配了 `real_ip` 之后才是真实 IP |
| `$binary_remote_addr` | 客户端 IP 的二进制形式 | IPv4 只 4 字节，**做 zone key 优先用它** |
| `$server_addr` / `$server_port` | 处理请求的本机地址/端口 | |
| `$connection` / `$connection_requests` | 连接序号 / 该连接上第几个请求 | 排查 keepalive 复用 |
| `$bytes_sent` / `$body_bytes_sent` / `$request_length` | 发送字节 / 响应体字节 / 请求总字节 | |
| `$request_method` | GET/POST… | |
| `$request_uri` | **原始** URI（含 query，未被改写） | |
| `$uri` | **当前**（可能被 rewrite 改过的）URI，不含 query | 与 `$request_uri` 的区别是高频考点 |
| `$args` / `$query_string` | 查询串（不含 `?`） | `$arg_name` 取单个参数 |
| `$host` | 请求的 Host（小写化，无 Host 时回退到 `server_name`） | 优先用 `$host` 而不是 `$http_host` |
| `$http_*` | 任意请求头，`-` 换成 `_` | `$http_user_agent`、`$http_x_forwarded_for` |
| `$cookie_*` | 任意 Cookie | `$cookie_jsessionid` |
| `$scheme` | http / https | |
| `$status` | 响应状态码 | |
| `$request_time` | 从**读到第一个字节**到**发完最后一个字节** | ★ 含客户端慢速造成的耗时 |
| `$upstream_response_time` | 上游响应耗时（可能多个，逗号分隔） | ★ 定位是后端慢还是网络慢 |
| `$upstream_addr` / `$upstream_status` | 实际打到哪台/返回什么 | 配合重试排查特别有用 |
| `$proxy_add_x_forwarded_for` | 在客户端传来的 XFF 后追加 `$remote_addr` | |
| `$nginx_version` / `$pid` / `$msec` / `$time_iso8601` | 自身信息与时间 | |

`$request_time` 和 `$upstream_response_time` 的区别值得单独记：**接口慢不一定是后端慢**——如果 `$request_time` 很大而 `$upstream_response_time` 很小，问题在客户端（弱网、大响应体）。

## 19. 缓存（proxy_cache）

Nginx 可以在网关层缓存上游响应，把「重复回源」变成「读本地磁盘」。它解决两类问题：保护后端（缓存击穿时只放一个请求过去）、降低 P99（缓存命中不经过应用）。

```nginx
http {
    # 定义缓存区：路径 / 目录层级 / 内存中的键索引 / 磁盘上限 / 多久没访问就清理
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:100m
                     max_size=10g inactive=60m use_temp_path=off;

    server {
        location /api/ {
            proxy_cache app_cache;
            proxy_cache_key "$scheme$request_method$host$uri$is_args$args";

            proxy_cache_valid 200 302 10m;
            proxy_cache_valid 404 1m;              # 缓存 404 也是防穿透手段

            # 回源出问题时用旧缓存顶住
            proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
            proxy_cache_background_update on;      # 过期后先返回旧值，后台异步更新
            proxy_cache_lock on;                   # 同一个 key 只放一个请求回源，其它等结果
            proxy_cache_revalidate on;             # 带 If-Modified-Since 回源，省带宽

            add_header X-Cache-Status $upstream_cache_status always;
            proxy_pass http://backend;
        }
    }
}
```

### cache key 决定一切

`proxy_cache_key` 里**没包含的维度，Nginx 都不会替你区分**。常见后果是多语言站点返回错语言、多域名站点串站、移动端拿到 PC 页面。

- 最稳的起点：`$scheme$request_method$host$uri$is_args$args`（`$host` 必须有，否则多个域名的同路径会互相覆盖）。
- 上游声明 `Vary` 时，**Nginx 不会按 `Vary` 自动分变体**。响应随哪个头变化，就要把那个头加进 key（如 `$http_accept_language`），或者干脆不缓存这条路由。
- 用户私有数据（带 `Authorization`、带会话 Cookie 的接口）**不应该放进共享缓存**。用 `proxy_no_cache` / `proxy_cache_bypass` 明确排除，别指望默认行为保护你：

```nginx
proxy_no_cache      $cookie_session $http_authorization;
proxy_cache_bypass  $cookie_session $http_authorization;
```

另外，**带 `Set-Cookie` 的响应默认不会被缓存**——这是 Nginx 的一个安全默认值；确实需要缓存静态登录页时，才用 `proxy_ignore_headers Set-Cookie;` 显式放行。

### 命中状态与失效

`$upstream_cache_status` 的取值是排查缓存的唯一入口：

| 值 | 含义 |
| --- | --- |
| `HIT` / `MISS` / `EXPIRED` | 命中 / 未命中 / 已过期 |
| `STALE` | 回源失败，返回了过期缓存（由 `use_stale` 触发） |
| `UPDATING` | 正在后台更新，先返回旧值 |
| `REVALIDATED` | 回源校验后发现没变，复用本地副本 |
| `BYPASS` | 被 `proxy_cache_bypass` 跳过 |

**开源版没有内置的 purge 接口**。缓存失效通常有三种落地方式：短 TTL（最省事）、版本化 URL（`/a.js?v=hash`，前端构建天然支持）、或者装 `ngx_cache_purge` 之类的第三方模块开一个受保护的 purge 端点。

三个容易忘的运维要点：

- `use_temp_path=off` 让临时文件直接落在缓存目录里，少一次跨目录 copy；缓存目录要放在**和磁盘一样耐用的分区**上，别放 `/tmp`（重启清空）。
- `proxy_buffer_size` 和上游响应头有关；开了缓存后，**磁盘写满**会变成新的故障模式，必须加监控。
- 大文件走 Range 请求时，缓存可能按不同 Range 切出很多碎片；要么不开缓存，要么用 `slice` 模块按固定块缓存。

## 20. 安全加固与常见攻击面

Nginx 站在最外层，是很多攻击的**第一道也是最后一道**关口。这一节按「抄进去就有效」的顺序排列。

### 基础加固

```nginx
server_tokens off;                     # 不在错误页和 Server 头里暴露版本号
client_max_body_size 10m;              # 按业务收紧
client_header_buffer_size 1k;
large_client_header_buffers 4 8k;      # Cookie/JWT 很大时会撞到 494
keepalive_timeout 65;
keepalive_requests 1000;

# 隐藏文件和常见敏感路径一律拒绝
location ~ /\.(?!well-known) { deny all; }
location ~* \.(bak|sql|log|env|yml|yaml|ini|conf)$ { deny all; }

# 只允许需要的 HTTP 方法
location /api/ {
    limit_except GET POST PUT DELETE { deny all; }
}
```

### 安全响应头

```nginx
add_header X-Content-Type-Options    "nosniff" always;
add_header X-Frame-Options           "DENY" always;
add_header Referrer-Policy           "strict-origin-when-cross-origin" always;
add_header Permissions-Policy        "geolocation=(), microphone=(), camera=()" always;
add_header Content-Security-Policy   "default-src 'self'; img-src 'self' data: https:; object-src 'none'; frame-ancestors 'none'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

两个坑：`X-Frame-Options` 和 CSP 的 `frame-ancestors` 是**二选一的替代关系**（新站点用 CSP 即可，两者同时下发时以 CSP 为准）；`always` 不能省，否则 4xx/5xx 响应上没有这些头。

**HSTS 是唯一一个「配错很难回滚」的头**：`includeSubDomains` 加上长 `max-age` 后，浏览器会在很长一段时间内强制 HTTPS，子域里任何一个没上 HTTPS 的服务都会直接不可用。先短 `max-age` 灰度，再逐步拉长。

### CORS

CORS 的错误配置比没有 CORS 更危险——它会把「不能跨站读取」变成「谁都能读」。

```nginx
# 白名单用 map 表达，绝不用正则去匹配用户可控的 Origin
map $http_origin $cors_origin {
    default                          "";
    "~^https://(www\.)?example\.com$" $http_origin;
}

server {
    location /api/ {
        add_header Access-Control-Allow-Origin      $cors_origin always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Vary Origin always;                # 告诉缓存按 Origin 分变体

        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin      $cors_origin always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Allow-Methods    "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers    "Content-Type, Authorization" always;
            add_header Access-Control-Max-Age          86400 always;
            add_header Content-Length 0;
            return 204;
        }

        proxy_pass http://backend;
    }
}
```

三条硬规则：

1. **`Access-Control-Allow-Origin: *` 不能和 `Allow-Credentials: true` 同时用**。要么不带凭据用 `*`，要么回显白名单里的具体 Origin。
2. **不要直接把 `$http_origin` 回显出去**（`add_header ... $http_origin;`），那等于允许任何站点跨站读取——必须过白名单 map。
3. **预检（OPTIONS）请求不经过应用**，得在 Nginx 处理；同时记得加 `Vary: Origin`，否则 CDN/缓存会把某个 Origin 的响应喂给所有 Origin。

### 几个具体攻击面

**Host 头注入。** 应用如果用请求里的 `Host` 拼重置密码链接、回调地址，攻击者就能把它指向自己的域名。防御分两层：Nginx 侧用明确的 `server_name` + `default_server` 拒绝未知 Host；应用侧不要信任 `Host`，用配置里的固定域名。

```nginx
server {
    listen 80 default_server;
    server_name _;
    return 444;                 # 未知 Host 直接断连，不给任何响应
}
```

**请求走私（request smuggling）。** 本质是代理和后端**对请求边界理解不一致**：同一个请求里同时出现 `Content-Length` 和 `Transfer-Encoding`，或者两者冲突时，Nginx 和上游各按自己的规则切分，于是多出来的那段变成了「下一个请求」。防御要点：不把畸形请求透传（现代 Nginx 会拒绝矛盾的 CL+TE）、代理链上前后端用同一套协议版本、不要把 `Transfer-Encoding` 这类头原样透传给不可信上游。

**路径穿越与 alias 拼接。** `$uri` 已经过规范化，但**用变量拼路径**时（`alias /data/$arg_file;`、`root /data/$http_x_tenant;`）就绕过了规范化，`../../etc/passwd` 这类输入会直接生效。规则很简单：**凡是拼路径的变量，都必须来自白名单 map，不能来自用户输入**。

**SSRF。** 同样的道理出现在变量式 `proxy_pass`：

```nginx
# 危险：用户可控的 host 会让 Nginx 变成内网探测器
# proxy_pass http://$arg_url;

# 安全：只允许映射表里出现的上游
map $arg_target $proxy_target {
    default   "";
    "a"       "10.0.0.11:8080";
    "b"       "10.0.0.12:8080";
}
server {
    if ($proxy_target = "") { return 400; }
    proxy_pass http://$proxy_target;
}
```

**默认拒绝未知**。这条原则比任何单点配置都重要：入口站点应当只有明确列出的域名能命中，其余一律 `444`/`403`——这样即使 DNS 或监控系统把新域名指过来，也不会意外暴露内部站点。

## 21. 真实 IP 与信任链

后端拿到的客户端 IP 不对，是一类会**连锁污染**的问题：访问控制失效、限流把所有人算成一个人、审计日志全是代理地址、风控拿不到真 IP。根因几乎都一样——**信任了一个不该信任的来源**。

### `X-Forwarded-For` 的语义与风险

```
X-Forwarded-For: client, proxy1, proxy2
```

这个头是**追加**的：每个代理在末尾加上自己看到的上一跳地址。问题在于**客户端可以自己伪造开头那段**。所以：

> 一个 `X-Forwarded-For` 里，只有「你自己最外层代理追加的那一段」可信，它左边的一切都可能是客户端编的。

`real_ip` 模块要做的事，就是**先从右往左跳过你信任的代理，取第一个不可信地址**当作真实客户端 IP。

### 配置

```nginx
# 只信任这几段（你的 CDN 回源段、LB 段、内网段），其他来源的 XFF 一律忽略
set_real_ip_from  10.0.0.0/8;
set_real_ip_from  172.16.0.0/12;
set_real_ip_from  203.0.113.0/24;      # CDN 回源出口（按厂商文档定期更新）

real_ip_header    X-Forwarded-For;
real_ip_recursive on;                  # ★ 从右往左跳过可信代理
```

配完之后：

| 变量 | 值 |
| --- | --- |
| `$remote_addr` | 替换后的真实客户端 IP（`allow`/`deny`、`limit_req`、`limit_conn` 都用它） |
| `$realip_remote_addr` | **替换前**的地址，也就是直连你的那个代理的 IP（排查信任链时很有用） |
| `$proxy_add_x_forwarded_for` | 客户端传来的 XFF + `$remote_addr`，转发给上游时用 |

**`set_real_ip_from 0.0.0.0/0` 等于没有访问控制。** 客户端随便写一个 `X-Forwarded-For: 10.0.0.1` 就能把自己伪装成内网 IP，绕过白名单和限流。这条配置的错误率极高，值得写进 code review 检查项。

### PROXY protocol

四层负载均衡（LVS、云 LB、HAProxy 的 tcp 模式）转发时**看不到也不改 HTTP 头**，所以它用另一种方式传递原始地址：在 TCP 连接的最前面加一段 PROXY protocol 头。

```nginx
server {
    listen 80 proxy_protocol;          # 声明这个端口会收到 PROXY 头
    set_real_ip_from 10.0.0.0/8;
    real_ip_header   proxy_protocol;   # 从 PROXY 头里取地址
}
```

两个注意点：**必须两端同时开**（LB 发了而 Nginx 没开，Nginx 会把 PROXY 头当请求内容；Nginx 开了而 LB 没发，握手就失败）；PROXY protocol 和安全无关，它没有任何校验，所以 `set_real_ip_from` 同样必须收窄。

### 信任链要对齐到应用

Nginx 修好了不等于链路修好了。**Nginx 和应用各自解析一遍真实 IP，很容易得出两个答案**：

- Nginx 用 `real_ip` 把 `$remote_addr` 换成真实 IP，转发时又用 `$proxy_add_x_forwarded_for` 追加——于是后端收到的 XFF 是「真实 IP, 直连代理 IP」。
- 应用如果照抄「取 XFF 的第一段」，拿到的是**客户端可伪造的那一段**；如果取最后一段，拿到的是代理 IP。

所以约定要写死并写进配置注释：**应用只信任来自本机/内网 Nginx 的连接，真实 IP 取 Nginx 传下来的 `X-Real-IP`（单值）或 XFF 中最右的那个不可信地址**。审计、限流、风控三处都用同一个口径，否则故障现场会出现「Nginx 日志里 IP 是对的、应用日志里全是 10.x」这种对不上的情况。

## 22. DNS、动态上游与 Kubernetes

### 静态 upstream 的域名只解析一次

```nginx
upstream backend {
    server app.internal:8080;   # ← 这个域名只在启动/reload 时解析一次
}
```

如果 `app.internal` 的 IP 变了（容器重建、云数据库切换、灰度换机），**Nginx 不会知道**，会继续往旧 IP 打，表现为稳定的 502 —— 这是「重启就好了」类故障的经典来源。

要让它动态解析，得走 `resolver` + 变量式 `proxy_pass`：

```nginx
http {
    resolver 10.0.0.2 valid=30s ipv6=off;   # 内网 DNS，或云厂商的 .2 地址
    resolver_timeout 3s;

    server {
        location /api/ {
            set $upstream_host app.internal:8080;   # 变量形式强制每次走 resolver
            proxy_pass http://$upstream_host$request_uri;
            proxy_set_header Host app.internal;
        }
    }
}
```

代价要清楚：**变量式 `proxy_pass` 不再做「前缀替换」**，URI 必须自己拼（`$request_uri` 或 `$uri$is_args$args`）；而且**每个请求都解析一次 DNS**（`valid=` 会缓存短时间）。所以这不是「更好的写法」，而是「域名会变时才用的写法」。

容器与 K8s 环境的选择：

| 场景 | 做法 |
| --- | --- |
| K8s Service（ClusterIP 稳定） | 静态 upstream 直接用 Service 名/IP，不会变 |
| Headless Service / 直接看 Endpoints | `resolver` + 变量式 `proxy_pass`，配合 K8s DNS（`kube-dns.kube-system.svc.cluster.local`） |
| Docker Compose | `resolver 127.0.0.11 valid=10s;`（Docker 内置 DNS） |
| 云厂商内网 DNS | 按厂商给的地址配，注意 VPC 内 53 端口的可达性 |

### Nginx Ingress 的边界

Kubernetes 里的 Nginx Ingress Controller 本质上是**把 Ingress/IngressRoute 对象渲染成 `nginx.conf` 然后 reload** 的控制器。理解这一点，很多现象就自然了：

- **注解（annotations）爆炸**：每个 Nginx 能力都要靠注解表达，注解写错不报错、只是静默不生效。
- **变更就是 reload**：大量 Ingress 频繁变更会导致频繁 reload；reload 虽不断连接，但会创建新 worker、消耗资源。
- **它不是通用网关**：复杂的鉴权、限流、灰度策略在 Ingress 层会写成难以维护的注解组合，超过一定复杂度就该考虑独立的 API 网关。

排查 Ingress 类问题的顺序：先看 Controller 日志里渲染出的配置（等价于 `nginx -T`），再看 Service/Endpoints 是否真的有后端，最后才怀疑 Nginx 配置本身。

## 23. 监控与日志

### stub_status

```nginx
location = /nginx_status {
    stub_status;
    allow 127.0.0.1;      # ★ 一定要限制来源
    allow 10.0.0.0/8;
    deny  all;
    access_log off;
}
```

输出：

```
Active connections: 3
server accepts handled requests
 100 100 200
Reading: 0 Writing: 1 Waiting: 2
```

| 字段 | 含义 |
| --- | --- |
| `Active connections` | 当前活跃连接数 = Reading + Writing + Waiting |
| `accepts` | 累计接受的连接数 |
| `handled` | 累计成功处理的连接数。**`accepts > handled` 说明撞到过连接数/文件描述符上限** |
| `requests` | 累计请求数。`requests / accepts` ≈ 平均 keepalive 复用次数 |
| `Reading` | 正在读请求头的连接数（请求头没收全） |
| `Writing` | 正在写响应的连接数 |
| `Waiting` | keepalive 空闲等待的连接数。**这个值居高不下通常说明 `keepalive_timeout` 太长** |

### 日志

```nginx
log_format main '$remote_addr "$request" $status $body_bytes_sent '
                'rt=$request_time urt=$upstream_response_time '
                'ua=$upstream_addr xff="$http_x_forwarded_for"';
access_log /var/log/nginx/access.log main buffer=32k flush=5s;
```

- 加 `$request_time` / `$upstream_response_time` / `$upstream_addr`：这三个字段能把「慢」拆成「客户端慢 / 后端慢 / 重试过」。
- 用 `buffer=32k flush=5s` 缓冲写入，减少高频日志的磁盘 IO。
- **健康检查、静态资源的 access_log 建议关掉**（`access_log off;`），否则日志量会淹没有效信息。
- 容器/长跑环境务必配 `logrotate`（用 `nginx -s reopen` 而不是 `copytruncate`），否则日志文件不会被释放。

## 24. 可观测性与告警

Nginx 的指标有两个层次：**能立刻拿到但很粗**的（`stub_status`、日志），和**需要额外建设但能定位到根因**的（带 trace id 的结构化日志、上游分组指标）。多数团队只做了第一层，于是故障时只能在「Nginx 有没有问题」和「后端有没有问题」之间来回猜。

### 日志里必须有的字段

```nginx
log_format trace '$remote_addr "$request" $status $body_bytes_sent '
                 'rt=$request_time uct=$upstream_connect_time uht=$upstream_header_time '
                 'urt=$upstream_response_time ua=$upstream_addr us=$upstream_status '
                 'rid=$request_id cache=$upstream_cache_status '
                 'ua_str="$http_user_agent" xff="$http_x_forwarded_for"';

access_log /var/log/nginx/access.log trace buffer=64k flush=5s;
```

几个字段的用途值得单独说：

- **`$upstream_connect_time` / `$upstream_header_time` / `$upstream_response_time` 三段拆开**，就能区分「建连慢（网络/上游积压）」「首字节慢（应用处理慢）」「传输慢（响应体大/客户端慢）」。只有总的 `$request_time` 时，这三种情况看起来完全一样。
- **`$upstream_addr` 与 `$upstream_status`** 在发生过失败重试时会给出**逗号分隔的多个值**，顺序与重试顺序一致。看到 `10.0.0.11:8080, 10.0.0.12:8080` 就知道第一个节点出过问题——这是定位「偶发 502」最有效的一条线索。
- **`$request_id`** 是 Nginx 生成的 16 字节十六进制串。把它透传给上游（`proxy_set_header X-Request-ID $request_id;`），上游再写进自己的日志，就能把「Nginx 的这条访问日志」和「应用的这条请求日志」对上。
- **`$upstream_cache_status`** 是缓存命中率的唯一来源，没有它就无法判断缓存到底有没有在工作。

如果上游已经生成了自己的 trace id（比如 SkyWalking、OpenTelemetry），正确做法是**优先透传上游的，没有才用 Nginx 生成**：

```nginx
map $http_x_request_id $req_id {
    default $http_x_request_id;
    ""      $request_id;             # 上游没给就自己造一个，保证链路里一定有
}
proxy_set_header X-Request-ID $req_id;
```

直接覆盖上游传来的 id 会切断链路，是接入 trace 系统时最常见的错误。

### 该配哪些告警

| 指标 | 阈值思路 | 说明 |
| --- | --- | --- |
| 5xx 比例 | > 1%（按 5 分钟窗口） | 按域名/上游分组，整体 5xx 上升往往只来自一条路由 |
| 499 数量 | 突增相对于基线 | 499 不一定是 Nginx 的问题，但它一定说明有请求没走完 |
| `$upstream_response_time` P99 | 接近 `proxy_read_timeout` 时预警 | 提前预警比 504 爆发后再处理有价值 |
| 上游可用节点数 | 少于总数一半 | 被动健康检查不会告警，只能靠这个发现 |
| 连接数 / fd 使用率 | > 80% | 撞到上限时表现为 `accepts > handled` |
| 证书剩余有效期 | < 30 天 | 证书过期是最容易预防、也最容易漏掉的事故 |
| 日志分区与缓存分区 | > 85% | 磁盘写满会让 Nginx 直接不可用 |
| 配置变更 | 每次 reload 记录 | 没有变更记录，事故复盘就是猜 |

**告警要挂在自己能控制的量上。** 「Nginx 5xx 升高」这种告警实际根因通常在上游；把它和「上游接口错误率」「上游 P99」放在同一个面板上，才能一眼看出是谁的问题。

### 容量与成本的观测口径

前面都是「有没有坏」，还需要一组「够不够用」的数字。一次完整的入口容量评估至少要收集：

```
峰值 QPS（按域名/路由拆）
并发连接数（含 keepalive 空闲连接）
TLS 握手率（区别于请求数：长连接下握手远少于请求）
平均 / P99 响应体大小
静态:动态 请求比例
上游连接数与会话复用率
缓存命中率
日志写入量（GB/天）
```

其中**日志量最容易失控**：一个 QPS 5000 的服务，每条访问日志 300 字节，一天就是 130 GB。日志先写 buffer、健康检查与静态资源关日志、按需保留全量日志（高频路径可以采样，错误路径全留），这些措施要在上线前就做好。

## 25. 性能调优清单

按「先量后调」的顺序，每一项都给出该看什么：

| 项 | 建议 | 为什么 |
| --- | --- | --- |
| `worker_processes auto;` | 跟 CPU 核数一致 | 超过核数只增加上下文切换 |
| `worker_connections 10240;` | 按并发量调 | 反向代理时**一个客户端连接要占两个连接**（client + upstream），所以真实并发 ≈ worker_connections / 2 |
| `worker_rlimit_nofile 65535;` | ≥ `worker_connections × 2`，且 ≤ 系统 `ulimit -n` | 文件描述符不够就是 `accepts > handled` |
| `sendfile on;` + `tcp_nopush on;` | 静态文件必开 | 文件直出内核，不做用户态拷贝 |
| `tcp_nodelay on;` | 保持默认开 | 长连接下禁用 Nagle，降低小包延迟 |
| `keepalive_timeout 65;` | 静态站点可长，API 网关可短 | 太长会堆积 `Waiting` 连接 |
| `keepalive_requests 1000;` | 默认 1000 | 单连接最多处理多少请求后关闭 |
| `open_file_cache max=10000 inactive=30s;` | 静态资源多时开 | 缓存 fd 和 stat 结果，省系统调用 |
| `gzip on; gzip_min_length 1k; gzip_comp_level 5;` | 文本类开，图片/视频别开 | level 5 之后收益骤减、CPU 陡增；已有压缩格式再压是浪费 |
| upstream `keepalive 64;` + `proxy_http_version 1.1` + `Connection ""` | 反向代理必配 | 否则每个请求都和上游新建 TCP 连接 |
| `client_max_body_size` | 按业务设 | 太小 413、太大给了上传攻击面 |
| `client_header_buffer_size` / `large_client_header_buffers` | 默认 1k / 4×8k | Cookie/JWT 很大的应用会顶到 494 |
| `proxy_buffer_size` | 默认 4k/8k | 上游响应头（含大 Cookie）超了就是 502 |
| 日志加 buffer、健康检查关日志 | 必配 | 高频日志本身就是 IO 瓶颈 |
| `resolver` + 变量式 `proxy_pass` | 上游是动态 DNS（K8s/容器）时 | 否则 DNS 只在启动/reload 时解析一次 |

## 26. 容量：内核队列、压测与成本

性能调优清单（第 25 节）解决的是「参数有没有配对」，这一节解决「到底能扛多少、瓶颈在哪」。**Nginx 的瓶颈经常不在 Nginx 里**，所以必须把内核和上游一起看。

### 三个队列

一次连接要挤过三个队列，任何一个满了都会表现为「连接失败」或「延迟尖刺」，但原因完全不同：

| 队列 | 位置 | 满了的症状 | 相关参数 |
| --- | --- | --- | --- |
| SYN 队列 | 内核，半连接（还没完成三次握手） | 客户端连接超时；`netstat -s` 里 SYN 丢弃计数上升 | `net.ipv4.tcp_max_syn_backlog` |
| accept 队列 | 内核，已完成握手但还没被应用 accept | 连接超时或延迟；`ss -lnt` 的 `Send-Q` 持续非 0 | `listen ... backlog=`、`net.core.somaxconn` |
| 上游连接等待 | Nginx 到后端的连接池/队列 | `$upstream_connect_time` 升高 | upstream 容量、后端线程数 |

排查顺序是固定的：**先看 `ss -lnt` 的 `Send-Q` 列**（这就是 accept 队列的积压量），再看 `netstat -s | grep -i listen` 的 overflow 计数，最后才怀疑 Nginx 配置。

### 文件描述符与内存

```bash
ulimit -n                          # 当前 shell 的限制
cat /proc/$(cat /var/run/nginx.pid)/limits | grep -i 'open files'   # master
systemctl show nginx -p LimitNOFILE  # systemd 托管的服务
```

三处限制取最小值生效：**systemd 的 `LimitNOFILE` → 进程的 rlimit → `worker_rlimit_nofile`**。改了 nginx.conf 里的 `worker_rlimit_nofile` 却忘了 systemd 那层，是没有效果的（这是「我明明调大了却还是连接失败」的典型）。

内存方面，每条连接和每个请求都有固定开销（读缓冲、写缓冲、上游缓冲）。开 `proxy_cache` 时还有共享内存 zone，`proxy_buffering on` 时大响应会落到磁盘临时文件：**临时目录所在分区必须单独监控**，它写满会导致请求失败，而 error_log 里的报错信息未必直白。

### 压测要模拟真实负载

用 `ab -n 100000 -c 100` 打静态文件得到的数字，和线上真实表现往往差一个数量级。原因是它把最难的几件事都省掉了。一份可信的压测至少要包含：

- **真实 Host 与 HTTPS**：TLS 握手是 CPU 开销大头，短连接压测会把它放大，长连接压测又会把它抹掉——两种都要测。
- **keepalive**：真实用户是复用的，连接建立成本被摊薄，瓶颈会转移到应用处理。
- **真实响应体大小**：100 字节的 JSON 和 1 MB 的页面，瓶颈一个是 QPS，一个是带宽。
- **慢客户端**：带宽差、上传慢的客户端会长期占用连接与上游连接，`proxy_buffering` 的价值只有在这种场景下才看得出来。
- **上游超时与失败**：把错误路径一起压，否则 `proxy_next_upstream` 带来的放大效应（重试会成倍增加上游压力）不会暴露。

压测期间要**同时采集两侧指标**：Nginx 侧的 `stub_status`、`$request_time` 分布；上游侧的应用线程/连接数、GC、DB 连接池。只看 Nginx 的数字会把上游的排队误读成 Nginx 的处理能力。

### 成本在哪里

| 成本项 | 什么时候变贵 | 缓解 |
| --- | --- | --- |
| TLS 握手 CPU | 短连接多、握手率高于请求率 | 会话复用、长连接、上游卸载（握手留在网关） |
| 日志磁盘 | QPS 高、日志字段多 | buffer、关掉静态/健康检查日志、采样 |
| 代理临时文件磁盘 | 大响应 + 慢客户端 | `proxy_max_temp_file_size`、加大内存缓冲 |
| 缓存磁盘 | 命中率低却容量大 | 按命中率调整 TTL 与 key 粒度 |
| 上游连接 | keepalive 没配，每请求新建连接 | upstream `keepalive` + `Connection ""` |
| 带宽 | 大文件直出 | 静态资源上 CDN，Nginx 只做回源 |

**扩容前先确认瓶颈项**。如果是 TLS 握手打满 CPU，加机器最有效；如果是上游慢导致连接被占满，加 Nginx 只会让上游更快被打死——那种情况要限流和缓存，而不是扩容。

## 27. 零停机发布：reload、灰度与回滚

### reload 做了什么，没做什么

`nginx -s reload` 的真实过程：

1. master 重新读取并**校验**配置。校验失败 → 打印错误并**保持旧配置继续服务**（所以「改了没生效」是第一症状，而不是服务中断）。
2. 校验通过 → 启动一批新 worker（用新配置），把监听套接字交给它们。
3. 通知旧 worker：**不再接受新连接**，把手上正在处理的请求走完，然后退出。

由此推出三件必须知道的事：

- **reload 不断开已有连接，但旧连接可能继续跑旧配置一段时间。** 长连接（WebSocket、SSE）挂一小时的话，旧 worker 就会存在一小时——发布时观察 `ps aux | grep nginx` 能看到新旧 worker 并存。
- **`worker_shutdown_timeout` 决定旧 worker 的兜底退出时间**。不设的话，一个卡住的长连接可能让旧 worker 永远不会退出，表现为「reload 了但内存没释放、新旧配置同时在跑」。

```nginx
worker_shutdown_timeout 30s;
```

- **nginx.conf 的语法校验只覆盖语法，不覆盖语义。** `nginx -t` 通过不代表配置符合预期：把 `proxy_pass` 的斜杠写错、把 `alias` 路径写偏，语法都是合法的。

### 一条可执行的上线流程

```bash
# 1. 保存当前生效配置快照（回滚和 diff 的依据）
nginx -T > /backup/nginx-$(date +%F-%H%M).conf

# 2. 校验新配置
nginx -t

# 3. 平滑生效
nginx -s reload

# 4. 验证：用真实 Host 打通一个业务请求，而不只是 curl 首页
curl -sS -o /dev/null -w '%{http_code}\n' -H 'Host: app.example.com' https://127.0.0.1/api/health

# 5. 观察：1~2 个监控周期内的 5xx、499、P99，确认无异常再收工

# 6. 回滚：把快照放回原位，再 reload
cp /backup/nginx-2026-09-22-1030.conf /etc/nginx/nginx.conf && nginx -t && nginx -s reload
```

**第 4 步是整套流程里最容易被跳过、也最容易救命的一步**：用 `-H 'Host: ...'` 指定域名，才能真正验证「新配置下这个域名的路由是对的」。`curl http://127.0.0.1/` 打到的往往是默认 server，和线上流量走的完全不是一份配置。

### 灰度

灰度的本质是**把「选哪个 upstream」变成一个可控制、可观测的开关**。用 `map` 表达最直接：

```nginx
map $cookie_gray $pool {
    default   "backend_stable";
    "1"       "backend_canary";
}
upstream backend_stable { server 10.0.0.11:8080; }
upstream backend_canary { server 10.0.0.21:8080; }

server {
    location /api/ {
        proxy_set_header X-Gray $pool;   # ★ 让后端日志和链路能区分两个池
        proxy_pass http://$pool;
    }
}
```

也可以按比例（`split_clients`）、按 IP 段、按用户 ID 哈希来分。三条纪律：

1. **灰度必须可观测**：把分组标记写进请求头并让上游记录，否则「灰度出问题了」这种结论根本无法验证。
2. **灰度必须有回滚开关**：改 `map` 的一行 + reload 能立刻全量切回，就算合格。
3. **灰度不要和缓存混在一起**：`$pool` 属于影响响应的维度，缓存 key 里不加它，灰度用户可能拿到正式池的缓存。

## 28. OpenResty、Lua 与动态模块

### 什么时候需要它

Nginx 的定位是**声明式流量处理**：路由、转发、缓存、限流都不需要写代码。一旦出现下面的需求，就说明遇到了 Nginx 原生能力的边界：

- 需要根据**响应内容**做决策（改响应体、按 JSON 字段路由）。
- 需要**在请求处理中途查一次 Redis/数据库**（比如分布式限流、AB 实验分流）。
- 需要**真正可编程的鉴权**（JWT 验签、动态签名校验）。

OpenResty 就是在 Nginx 里嵌入 LuaJIT，把这些能力补齐。它以阶段钩子的形式暴露请求处理链：

```nginx
location /api/ {
    access_by_lua_block {
        local jwt = require "resty.jwt"
        local token = ngx.req.get_headers()["Authorization"]
        if not token or not jwt:verify(secret, token) then
            return ngx.exit(401)
        end
        ngx.req.set_header("X-User", jwt:verify(secret, token).payload.sub)
    }
    proxy_pass http://backend;
}
```

### 原生的轻量替代：`njs`

如果只是需要一点逻辑（几个判断、字符串处理、简单的 Hash），不想引入 OpenResty 这一整套，`njs` 是更轻的选择——它是 Nginx 官方维护的 JavaScript 子集，作为模块加载：

```nginx
js_import http from /etc/nginx/njs/http.js;

location / {
    js_content http.hello;
}
```

和 Lua 的关系：`njs` 更轻、语法更友好、能力更弱；OpenResty 生态更大（Redis、Kafka、gRPC 的库都现成）。**两者都比原生 Nginx 慢一个量级**（LuaJIT 尚可，njs 更慢），所以不要把它们用在每一个请求上。

### 一条重要的边界

**不要把业务逻辑搬进网关。** 网关里每加一个功能，都会带来三个后果：无法用常规方式单元测试、变更必须走整个网关的发布流程、出故障时排查链路从「应用 + 数据库」变成「CDN + LB + Nginx + Lua + Redis + 应用」。

一个粗略的判据：**这里放的是「所有服务都需要的、和业务无关的横切逻辑」**（鉴权、限流、灰度、日志）。一旦开始写「订单查询在网关里先查缓存」，就该把它移回应用。

### 动态模块

Nginx 从 1.9.11 起支持动态模块：编译成 `.so`，用 `load_module` 在配置里加载，不用重编译主程序。

```nginx
load_module modules/ngx_http_geoip2_module.so;
```

注意两点：**模块必须和当前 Nginx 的版本、编译参数严格匹配**（否则加载时报版本不兼容），所以生产上更适合走「打包好的发行版 + 官方仓库」而不是自己编；`nginx -V` 是确认「当前二进制到底带了什么」的唯一权威来源，排查 `unknown directive` 时先看它。

## 29. 排障速查

| 症状 | 最可能的原因 | 怎么确认 |
| --- | --- | --- |
| 改了配置没生效 | 改的文件没被 include / reload 失败 | `nginx -t`、`nginx -T` 看你那条指令在不在展开结果里 |
| `[emerg] unknown directive` | 模块没编译进去，或拼写/大括号层级错 | `nginx -V` 看模块清单 |
| `[emerg] bind() to 0.0.0.0:80 failed` | 端口被占（另有 nginx、Apache、或旧进程） | `ss -lntp \| grep :80`、`ps aux \| grep nginx` |
| **403 Forbidden** | worker 用户对路径**某一级目录**缺 `x` 权限 | `namei -l /data/www/index.html`；看 `error_log` 的 "Permission denied" |
| **404**（SPA 刷新子路由） | 少了 `try_files ... /index.html` | 直接看 location 配置 |
| **404**（反代接口） | `proxy_pass` 末尾斜杠导致路径被多删/多拼 | 对着本文的映射表核一遍，看上游日志里收到什么 URI |
| **413** | 请求体超过 `client_max_body_size`（默认 1m） | Nginx error.log 明写 |
| **499** | 客户端在 Nginx 返回前断开了（或超时主动放弃） | 结合 `$request_time`：通常是后端太慢，客户端先放弃 |
| **502** | 上游连不上 / 上游返回了非法响应 / **响应头超过 `proxy_buffer_size`** | `error_log` 会区分 "Connection refused" 与 "upstream sent too big header" |
| **504** | 上游在 `proxy_read_timeout` 内没响应 | 用 `$upstream_response_time` 与后端日志对齐 |
| 后端拿到的 IP 是代理 IP | 没配 `real_ip` 或后端没透传 XFF | 看 `$http_x_forwarded_for` 的值 |
| 限流把所有人一起限了 | 上层有 CDN/LB，`$remote_addr` 是代理 IP | 同上，配 `set_real_ip_from` |
| SSE/流式接口「一次吐一大块」 | `proxy_buffering` 没关 | 看 `proxy_buffering` 是否为 `on` |
| 上游连接数爆炸 | upstream 没配 `keepalive` + 那两个头 | 数一下到上游端口的 established 连接：`ss -tn state established` |
| 静态文件 403 但文件存在且是 644 | SELinux 上下文不对 | `ls -Z`、`ausearch -m avc -ts recent`；`chcon`/`semanage fcontext` |
| 反代到上游 502，上游在本机 | SELinux 禁止 nginx 向外发起连接 | `setsebool -P httpd_can_network_connect 1` |

排查顺序建议固定下来：`nginx -t` → `nginx -T` → `error_log` → `access_log`（看 `$upstream_addr`/`$status`/耗时）→ 上游日志 → 监控面板。

## 30. 状态码速查

| 码 | 含义 | Nginx 场景里的常见成因 |
| --- | --- | --- |
| 200 / 206 | 成功 / 部分内容 | 206 = 支持 Range（大文件、视频拖动） |
| 301 / 308 | 永久重定向 | `return 301`、`rewrite ... permanent`；308 保留请求方法 |
| 302 / 307 | 临时重定向 | `return 302`、登录跳转 |
| 304 | 资源未修改 | 协商缓存命中（ETag / Last-Modified） |
| 400 | 请求格式错误 | 畸形请求行/头 |
| 401 | 未认证 | `auth_basic`、`auth_request` 子请求返回 401 |
| 403 | 拒绝 | `deny`、鉴权失败、**文件权限不足** |
| 404 | 不存在 | 路径不对、SPA 缺 `try_files`、`proxy_pass` 斜杠问题 |
| 405 | 方法不允许 | `limit_except` |
| 408 | 请求超时 | 客户端迟迟发不完请求 |
| 413 | 请求体过大 | `client_max_body_size` |
| 429 | 请求过多 | `limit_req_status`/`limit_conn_status` 设成 429 时 |
| 499 | **客户端关闭连接**（Nginx 私有） | 响应还没发完客户端就走了，通常是后端太慢 |
| 500 | 内部错误 | 上游 500、`auth_request` 子请求返回非 401/403 的错误码 |
| 502 | 网关错误 | 上游连不上 / 上游响应非法 / 响应头超 buffer |
| 503 | 服务不可用 | 上游全挂、`limit_req`/`limit_conn` 默认的拒绝码 |
| 504 | 网关超时 | `proxy_read_timeout` / `proxy_connect_timeout` |

Nginx 私有的内部状态码（不出现在标准里，但会在 `error_log` 和 `$status` 里看到）：

| 码 | 含义 |
| --- | --- |
| 444 | `return 444`：不回响应直接关闭连接 |
| 494 | 请求头过大（`client_header_buffer_size` / `large_client_header_buffers` 不足） |
| 495 | 客户端证书校验失败（`ssl_verify_client`） |
| 496 | 客户端没有提供要求的证书 |
| 497 | 往 HTTPS 端口发了明文 HTTP 请求 |

## 31. 命令与验证速查

### Nginx 命令

```bash
nginx                        # 启动
nginx -t                     # 语法检查（改完配置第一步）
nginx -T                     # 打印 include 展开后的完整生效配置 ★ 排"改了不生效"的神器
nginx -v / -V                # 版本 / 版本 + 编译参数 + 模块清单
nginx -s reload              # 平滑重载（SIGHUP）
nginx -s quit                # 优雅停止（SIGQUIT）
nginx -s stop                # 立即停止（SIGTERM）
nginx -s reopen              # 重新打开日志（SIGUSR1），配合 logrotate
nginx -c /path/nginx.conf    # 指定配置文件
nginx -p /etc/nginx/ -g "daemon off;"   # 指定前缀目录 / 前台运行（容器）
systemctl reload nginx       # systemd 托管时的等价写法
```

### 用 curl 验证配置（最常用的几条）

```bash
# 首页
curl -I http://127.0.0.1/

# ★ 指定 Host，验证虚拟主机与 location 路由（比直接打 IP 有意义得多）
curl -v -H 'Host: app.example.com' http://127.0.0.1/api/health

# 验证虚拟主机不依赖 DNS：把域名解析强制指到本机
curl --resolve app.example.com:443:127.0.0.1 https://app.example.com/
curl -k --resolve app.example.com:443:127.0.0.1 https://app.example.com/   # 自签证书

# 看缓存命中状态与耗时拆解
curl -o /dev/null -s -w 'code=%{http_code} total=%{time_total}\n' https://app.example.com/api/x

# 触发限流：并发打 N 个请求看状态码
for i in $(seq 1 20); do curl -s -o /dev/null -w '%{http_code} ' https://app.example.com/api/x; done; echo

# 伪造 X-Forwarded-For，验证 real_ip 信任链是否起作用
curl -H 'X-Forwarded-For: 1.2.3.4' https://app.example.com/ip
```

### 网络与进程

```bash
ss -lntp                       # 谁在监听哪些端口
ss -lnt                        # 看 Send-Q 列判断 accept 队列是否积压
ss -antp | grep nginx | wc -l  # 当前连接数
ss -tn state established       # 到上游端口的已建立连接（判断 upstream keepalive 是否生效）
ps aux | grep nginx            # master / worker 数量，reload 后新旧 worker 是否并存
lsof -p <worker-pid> | wc -l   # 单个 worker 打开的文件描述符数
tcpdump -i any -nn port 80     # 看真实报文（抓包时别忘 Host 头）
```

### 日志与系统

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log        # ★ 排查第一现场，错误信息的措辞能区分很多原因
awk '{print $9}' access.log | sort | uniq -c | sort -rn   # 状态码分布
grep ' 502 ' access.log | tail -20
journalctl -u nginx --since '10 min ago'
ulimit -n; systemctl show nginx -p LimitNOFILE            # 两处 fd 上限都要看
```

## 32. 完整知识点清单

用来逐项确认「有没有漏」。粗体是可独立成题的考点。

**基础与进程模型**

- **master / worker 的职责划分**、cache manager / loader
- **reload 的语义**：为什么不断连接、旧 worker 何时退出、`worker_shutdown_timeout`
- 事件驱动与非阻塞 IO、epoll、为什么 worker 数等于核数、`reuseport` 与惊群
- 连接数上限的三个折算：客户端+上游、fd、keepalive 空闲连接
- 模块化架构与 `nginx -V`、动态模块 `load_module`

**配置与路由**

- 配置层级：main / events / http / server / location / upstream / stream
- **指令继承的全有或全无规则**（`add_header`、`proxy_set_header`）
- **请求处理阶段**：POST_READ / REWRITE / FIND_CONFIG / ACCESS / PRECONTENT / CONTENT / LOG
- **`server_name` 匹配顺序**、`default_server`、`server_name ""`
- **location 匹配算法**（`=` / `^~` / `~` / `~*` / 最长前缀）
- URI 规范化、`$uri` 与 `$request_uri` 的区别
- **`root` 拼接 vs `alias` 替换**、`try_files`、`index`
- `rewrite` 的四个 flag 与 `return` 的顺序语义、命名 location、`internal`
- 参数单位（时间 / 空间 / 频率）

**代理与上游**

- **`proxy_pass` 带 URI 与不带 URI 的前缀替换规则**（含正则 location 与变量形式的例外）
- 转发头：`Host` / `X-Real-IP` / `X-Forwarded-For` / `X-Forwarded-Proto`
- 三段超时：`proxy_connect_timeout` / `proxy_send_timeout` / `proxy_read_timeout`
- `proxy_buffering` 与流式响应、`X-Accel-Buffering`
- 上游 keepalive 的三个条件
- **负载均衡算法**与 `weight` / `max_conns` / `down` / `backup` / `max_fails` / `fail_timeout`
- **`proxy_next_upstream` 的默认值与幂等风险**、`non_idempotent`
- 被动健康检查与开源版没有 `health_check`

**TLS 与协议**

- TLS 终止的收益与代价、证书链顺序、SNI、会话复用、OCSP stapling
- **HSTS 的不可逆风险**、`ssl_protocols` / `ssl_ciphers` 的现代取值
- `proxy_ssl_verify` 默认关闭这一安全缺口
- HTTP/2（`http2 on;` 与旧写法的区别）、WebSocket 的 Upgrade、gRPC 的 `grpc_pass`
- 四层 `stream`、`ssl_preread`、PROXY protocol

**缓存、限流与访问控制**

- `proxy_cache_path` 各参数、**cache key 设计**、`Vary` 不生效的原因
- `$upstream_cache_status` 全部取值、`use_stale`、`cache_lock`、`background_update`
- 开源版没有 purge、`Set-Cookie` 默认不缓存
- **`limit_req` 的匀速语义**、漏桶、`burst`、`nodelay`、`delay`、`dry_run`
- `limit_conn` 与 `limit_req` 是两个独立开关
- `allow` / `deny` 的顺序语义、`geo`、`satisfy`
- `auth_request` 的状态码约定、`auth_request_set`、`internal`
- `auth_basic` + htpasswd

**真实 IP、DNS 与服务发现**

- `set_real_ip_from` / `real_ip_header` / `real_ip_recursive`、`$realip_remote_addr`
- **XFF 的可伪造性**与信任链边界、PROXY protocol
- `resolver` 与变量式 `proxy_pass` 的代价
- 静态 upstream 域名只在启动/reload 解析一次
- K8s Service / Headless / Ingress Controller 的边界

**日志、监控与排障**

- 三段 upstream 时间、`$request_id` 与 trace id 透传
- `stub_status` 各字段含义、`accepts > handled` 的判读
- **499 / 502 / 504 的成因区分**与超时矩阵
- `nginx -T` 与配置快照回滚
- 三类队列（SYN / accept / 上游）与 `ss -lnt` 的 `Send-Q`

**性能、容量与发布**

- `worker_processes` / `worker_connections` / `worker_rlimit_nofile` / systemd `LimitNOFILE`
- `sendfile` / `tcp_nopush` / `tcp_nodelay` / `keepalive_timeout`
- `gzip` 与压缩级别、`open_file_cache`
- fd、内存、临时文件、缓存的成本模型
- 压测必须模拟的真实条件（TLS、keepalive、慢客户端、响应体大小、失败重试）
- 零停机发布流程与灰度开关、`split_clients`

**安全**

- 安全响应头与 CSP、`server_tokens`、隐藏文件与敏感后缀
- **CORS 的三条硬规则**（`*` 与凭据互斥、不回显 Origin、`Vary: Origin`）
- Host 头注入、请求走私、路径穿越（变量拼路径）、SSRF（变量式 `proxy_pass`）
- `limit_except`、请求体与头大小限制
- 默认拒绝未知 Host

## 33. 面试问答

### 基础与进程模型

**Q1：Nginx 为什么能支持高并发？**
事件驱动 + 非阻塞 IO：少量 worker 通过 epoll 之类的多路复用接口在单线程里管理大量连接，只有就绪的 socket 才被处理，避免了「一连接一线程」的内存与切换开销。前提是回调不阻塞——任何阻塞操作都会拖垮该 worker 上的所有连接。

**Q2：master 和 worker 各做什么？reload 时发生了什么？**
master 读配置、校验配置、管理 worker、处理信号，不处理请求；worker 处理连接与请求。reload 时 master 先校验新配置（失败则继续用旧配置服务），通过后启动新 worker 并把监听套接字交给它们，旧 worker 不再接新连接、处理完手上请求后退出。所以 reload 不断开已有连接，但长连接可能继续跑一段旧配置。

**Q3：`worker_connections` 是最大客户端连接数吗？**
不是。反向代理时一个请求占客户端连接和上游连接两条；还要看 `worker_rlimit_nofile` 与 systemd 的 `LimitNOFILE`；keepalive 的空闲连接同样占额度。`stub_status` 里 `accepts > handled` 说明撞过上限。

**Q4：`nginx -t` 通过就说明配置没问题吗？**
只说明语法没问题。`proxy_pass` 斜杠、`alias` 路径、location 匹配优先级这些语义错误语法都合法，只能靠 `nginx -T` 看生效配置 + 用真实 Host 打通业务请求来验证。

### 路由与配置

**Q5：location 的匹配优先级？**
先找最长前缀；若该前缀带 `^~` 则直接使用、不再看正则；否则按配置文件出现顺序匹配正则，第一个命中即使用；正则都不命中则用最长前缀。精确匹配 `=` 最先判定，命中即结束。命名 location `@name` 不参与 URI 匹配，只用于内部跳转。

**Q6：`root` 和 `alias` 的区别？**
`root` 是**拼接**：`root` + 完整 URI。`alias` 是**替换**：用 alias 的值替换掉 location 匹配到的那一段。`location /img/ { root /data; }` 对应 `/data/img/a.png`；`location /img/ { alias /data/images/; }` 对应 `/data/images/a.png`。alias 与 location 的末尾斜杠要一致。

**Q7：`^~` 和 `~` 什么时候用？**
需要「前缀命中后就不再让正则抢走」时用 `^~`（典型是静态资源目录）；需要按文件后缀、路径模式做区分时用 `~`/`~*`。注意要避免「正则 location 到处抢路由」——它按顺序命中，很容易把后面的规则变成死代码。

**Q8：`add_header` 为什么会「莫名其妙不生效」？**
两个原因：一是不加 `always` 时只对部分状态码生效；二是**继承是全有或全无**——子层级只要出现一条 `add_header`，父级的全部 `add_header` 都不再继承。`proxy_set_header` 同理，而且在 location 里写一条会让 `http` 层的 `Host`、`X-Real-IP` 一起失效。

**Q9：`rewrite` 的 `last` 和 `break` 区别？**
`last` 用改写后的 URI **重新做一次 location 匹配**；`break` 停止 rewrite 并**留在当前 location** 继续执行其余指令。`redirect` / `permanent` 是直接返回 302 / 301。

### 代理与上游

**Q10：`proxy_pass` 带 URI 和不带 URI 的区别？**
前缀 location 中，带 URI 会把匹配到的 location 前缀**替换**成该 URI（`location /api/` + `proxy_pass http://b/`，请求 `/api/users` 到上游是 `/users`）；不带 URI 则原样转发（到上游是 `/api/users`）。正则 location 和变量形式不做这种替换，要改 URI 得显式 `rewrite ... break`。

**Q11：502 和 504 怎么区分？**
502 是「上游这一跳坏了」：连接被拒、上游提前关闭、响应头非法、响应头超过 `proxy_buffer_size`、上游 TLS 失败。504 是「上游在超时内没回话」，对应 `proxy_read_timeout`。定位时看 error_log 的具体措辞，再看 `$upstream_addr` / `$upstream_status` / `$upstream_response_time`。

**Q12：`proxy_next_upstream` 有什么风险？**
默认只重试 `error` 和 `timeout`，5xx 不重试；要重试 5xx 必须显式加。默认不重试非幂等请求（POST 需要 `non_idempotent`），因为重试可能造成重复下单；而且重试会成倍放大上游压力，必须配 `proxy_next_upstream_tries` / `_timeout`。

**Q13：上游 keepalive 怎么配才对？**
`upstream` 里写 `keepalive 64;`，同时在 location 里写 `proxy_http_version 1.1;` 和 `proxy_set_header Connection "";`。少任何一个，keepalive 都不生效，表现为每个请求都和上游新建 TCP 连接。

### 缓存、限流与安全

**Q14：`proxy_cache_key` 该包含什么？**
包含所有影响响应的维度。最稳的起点是 `$scheme$request_method$host$uri$is_args$args`。上游声明 `Vary` 时 Nginx **不会**自动分变体，必须手动把相关头加进 key。用户私有响应不要进共享缓存，用 `proxy_no_cache` 显式排除。

**Q15：`limit_req` 的 `burst` 和 `nodelay` 是什么语义？**
`limit_req` 的速率是**匀速**的（`rate=12r/m` 就是每 5 秒一个请求，不是「一分钟 12 次的额度」）。超出的请求进漏桶排队，桶容量是 `burst`，满了就拒绝（默认 503）。加 `nodelay` 后 `burst` 个请求立即放行而不排队等待，但桶位仍按速率释放，所以瞬时通过量约等于 `rate + burst`；`delay=n` 是让前 n 个立即通过、其余排队。

**Q16：`limit_conn` 和 `limit_req` 的关系？**
两个独立开关，互不兜底。`limit_req` 管速率（保护 QPS），`limit_conn` 管并发连接数（保护连接资源）。只配一个都可能被另一种方式绕过。

**Q17：怎么正确拿真实客户端 IP？**
只信任明确的上游代理段：`set_real_ip_from` 列出 CDN/LB 的 IP 段，`real_ip_header X-Forwarded-For`，`real_ip_recursive on`。绝不能 `set_real_ip_from 0.0.0.0/0`——那等于让客户端随便伪造 XFF 绕过白名单和限流。四层转发用 PROXY protocol，同样要收窄信任来源，并保证两端协议一致。

**Q18：CORS 常见错误有哪些？**
`Allow-Origin: *` 与 `Allow-Credentials: true` 同时使用（浏览器直接不接受）；直接把 `$http_origin` 回显出去（等于放开所有站）；预检 OPTIONS 请求透传给应用（应用没处理就 405）；忘了 `Vary: Origin` 导致缓存把某个 Origin 的响应喂给所有 Origin。

**Q19：怎么防 Host 头攻击和 SSRF？**
Host 头：明确的 `server_name` + 用一个 `default_server` 对未知 Host 返回 `444`，同时应用侧不要用请求里的 Host 拼链接。SSRF：变量式 `proxy_pass` 的上游必须来自 `map` 白名单，绝不能用用户可控参数拼 host，并限制 resolver 与内网边界。

### 场景与生产

**Q20：499、502、504 该怎么串起来理解？**
它们构成一条超时链：`client timeout < nginx timeout < upstream business timeout`。客户端超时先走 → Nginx 记录 **499**（客户端断开，注意它没返回给客户端任何东西）；Nginx 等上游超过 `proxy_read_timeout` → 返回 **504**，但上游可能仍在执行；上游连接失败或响应非法 → **502**。设计超时矩阵时保证这个大小关系，能把「谁先放弃」这件事变成可推导的。

**Q21：怎么排查一次 404？**
按顺序：用 `nginx -T` 确认生效配置和命中的 server/location → 检查 `root`/`alias` 的路径映射 → 检查 `try_files` 顺序和回退目标 → 看 error_log 里的实际文件路径（Nginx 会把打开失败的路径写进日志）。SPA 的刷新 404 几乎都是漏了 `try_files ... /index.html`。

**Q22：如何做零停机发布和灰度？**
发布前 `nginx -T` 存快照 → `nginx -t` → `nginx -s reload` → 用真实 Host 打通业务请求 → 观察一两个监控周期。灰度用 `map` 把 upstream 选择变成可切换的开关，并把分组标记透传给上游以便观测；回滚就是还原快照 + reload。

**Q23：怎么做容量规划？**
先收集峰值 QPS、并发连接（含空闲 keepalive）、TLS 握手率、响应体大小分布、静态/动态比例、上游连接复用率、缓存命中率、日志量。反向代理要同时计算客户端和上游两类连接。压测必须模拟真实条件（TLS、keepalive、慢客户端、响应体大小、失败重试），并且同时采集 Nginx 与上游两侧的指标。

**Q24：证书过期这类事故怎么避免？**
自动续期 + 续期后自动 reload + **外部** HTTPS 探测（而不是只探测进程存活）+ 到期前 30 天告警 + 多域名 SNI 逐个验证 + 保留可用回滚证书。

## 附录：一份可直接改用的完整配置

把上面的场景拼在一起，去掉冗余，给一份能直接改域名和路径就用的版本（`/etc/nginx/conf.d/app.conf`）：

```nginx
# ============ 上游：两台应用 + 一个备用 ============
upstream app_backend {
    least_conn;
    server 10.0.0.11:8080 weight=3 max_fails=2 fail_timeout=10s;
    server 10.0.0.12:8080 weight=1 max_fails=2 fail_timeout=10s;
    server 10.0.0.13:8080 backup;
    keepalive 64;
}

# ============ 限流 zone ============
limit_req_zone  $binary_remote_addr zone=req_per_ip:10m rate=20r/s;
limit_conn_zone $binary_remote_addr zone=conn_per_ip:10m;

# ============ 真实 IP（按你自己的上游代理改） ============
set_real_ip_from 10.0.0.0/8;
real_ip_header   X-Forwarded-For;
real_ip_recursive on;

# ============ HTTP → HTTPS ============
server {
    listen 80 default_server;
    server_name _;
    return 301 https://$host$request_uri;
}

# ============ 主站 ============
server {
    listen 443 ssl;
    http2  on;
    server_name app.example.com;

    ssl_certificate     /etc/nginx/ssl/app.crt;   # 内含服务器证书 + 中间证书
    ssl_certificate_key /etc/nginx/ssl/app.key;
    ssl_protocols             TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache         shared:SSL:10m;
    ssl_session_timeout       1d;
    ssl_stapling              on;
    ssl_stapling_verify       on;
    ssl_trusted_certificate   /etc/nginx/ssl/chain.pem;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    root  /data/www/dist;
    index index.html;

    # 前端（SPA）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 带 hash 的静态资源长期缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?|ico)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        access_log off;
    }

    # 后端 API
    location /api/ {
        limit_req  zone=req_per_ip burst=40 nodelay;
        limit_req_status 429;

        proxy_pass http://app_backend/;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Connection "";

        proxy_connect_timeout 3s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;

        proxy_next_upstream        error timeout http_502 http_503 http_504;
        proxy_next_upstream_tries  3;
        proxy_next_upstream_timeout 10s;

        client_max_body_size 20m;
        proxy_buffer_size    8k;
    }

    # SSE / 流式接口
    location /api/stream/ {
        proxy_pass http://app_backend;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }

    # 内部状态（只给本机）
    location = /nginx_status {
        stub_status;
        allow 127.0.0.1;
        deny all;
        access_log off;
    }

    # 隐藏文件
    location ~ /\. { deny all; }
}
```

改完记得：

```bash
nginx -t && nginx -s reload
```

`-t` 过了再 reload。没把握的时候更保险的顺序是 `nginx -t -c /path/to/待生效.conf`，确认无误再覆盖线上的文件。

---

## 附录二：综合练习与验收

配置写对了不等于理解了。下面这个练习用**一个可跑的入口**把前面大部分知识点串起来，每一项都要有可执行的验证命令——不然就只是抄配置。

### 目标环境

```text
nginx-lab/
  nginx.conf
  conf.d/app.conf
  certs/server.crt  server.key
  html/            # 前端构建产物
  cache/           # proxy_cache 目录
```

### 要实现的功能

| # | 功能 | 验证方式 |
| --- | --- | --- |
| 1 | HTTP 全量 301 到 HTTPS | `curl -I http://127.0.0.1/` 看 `Location` |
| 2 | `/` 服务 SPA，刷新子路由不 404 | `curl --resolve x:443:127.0.0.1 https://x/about` 返回 200 |
| 3 | `/assets/` 长缓存且带 `immutable` | `curl -I` 看 `Cache-Control` |
| 4 | `/api/` 反向代理，两个上游做负载均衡 | 多次请求看后端返回的实例标识 |
| 5 | 上游 keepalive 生效 | `ss -tn state established` 到上游的连接数稳定不增长 |
| 6 | `/api/` 限流触发 429 | 并发打 20 次，观察状态码序列 |
| 7 | `/admin/` 只允许内网 IP | `curl -H 'X-Forwarded-For: 1.2.3.4'` 被拒 |
| 8 | 后端全挂时返回可解释的 502，且 `$upstream_addr` 有记录 | 停掉后端，看 access_log |
| 9 | 缓存命中，`X-Cache-Status` 从 MISS 变 HIT | 连续请求看响应头 |
| 10 | 日志能区分 499 / 502 / 504 | 三种情况各造一次，用日志字段判读 |

### 必须能回答的问题

做完之后，不看资料回答下面这些；答不上来的就回去看对应章节。

1. 一次 `/api/v1/users?x=1` 的请求，从 socket 到上游经过了哪些阶段？在哪一步替换了 `$remote_addr`？
2. 如果把 `location /api/` 改成 `location /api` 而 `proxy_pass` 不变，上游收到的 URI 会怎么变？
3. 为什么 `location /api/` 里加一行 `proxy_set_header X-Trace 1;` 会让 `Host` 头消失？怎么修？
4. 并发 20 个请求打 `/api/` 时，被拒绝的那些请求最终返回什么状态码、由哪条指令决定？
5. 上游 5xx 时会不会自动切到另一台？默认值是什么？要改哪一行？
6. 缓存命中时，请求有没有到达上游？你怎么证明？
7. `set_real_ip_from 0.0.0.0/0` 会造成什么后果？举一个具体攻击步骤。
8. 修改配置后 reload，为什么有的连接还在用旧配置？怎么确认旧 worker 已经退出？

### 验收标准

- `nginx -t` 通过，且 `nginx -T` 里的最终配置与你以为的一致（尤其是 location 匹配顺序）。
- 上面 10 项功能每一项都有一条**可复现的 curl 命令**，而不是「目测正常」。
- 破坏性实验能解释清楚：停上游 → 502；上游 sleep 超过 `proxy_read_timeout` → 504；客户端提前断开 → 499。
- 能画一张自己的入口链路图，标出真实 IP、TLS 终止、缓存、限流分别发生在哪一层。

## 来源与说明

这份资料经历过一次合并：最初按「一篇一个知识点」拆成 60 多个文件，后来收成现在这一份单文件。合并时做了三件事——去掉每篇都重复的固定骨架（学习目标 / 理论导读 / 练习 / 验收 / 重点 / 易错 这类填表式小节），把描述同一件事的内容合到一节，并补上原拆分包里只列了标题、没有展开的部分（请求处理阶段、缓存失效、安全攻击面、真实 IP 信任链、容量与内核队列、零停机发布）。

最初的骨架来自一段实操视频：[B 站 · Romantic_zx_《10 个场景，基本会玩 Nginx 了》](https://www.bilibili.com/video/BV1Ks4y117Ba/)（约 44 分钟，中文实操）。视频的十个场景构成了本文第 5 到第 14 章的框架，其中两处说法在正文里做了修正：

- 视频把 `root` / `alias` 的区别说成「`alias` 末尾一定要加杠」，这只说对了一半。真正的规则是 **`alias` 会用自己替换掉 location 匹配到的那一段**，所以 `alias` 和 `location` 的末尾斜杠要保持一致；而 `root` 是「拼」——`root` 的值加上完整 URI。
- 视频把限流分成「`limit_conn` 限并发连接、`limit_req` 限速率」是对的，但没提两者**互相不兜底**（只配一个，另一种方式照样能打满），也没提**在 CDN / 上层代理后面必须配 `real_ip`**——否则 `$remote_addr` 是代理的 IP，限流会把所有用户当成同一个人。

正文中未经特别说明的配置片段都以 Nginx 1.24+ 的语法为准（`http2 on;` 这类新写法标注了版本要求）。涉及具体数值的调优建议都属于起点而非结论，上线前请在自己的压测环境里复核。

