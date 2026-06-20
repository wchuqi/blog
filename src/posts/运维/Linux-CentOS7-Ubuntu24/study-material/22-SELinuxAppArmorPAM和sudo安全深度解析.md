---
title: "Linux 学习资料：SELinux、AppArmor、PAM 和 sudo 安全深度解析"
date: 2026-06-20
description: "Linux 安全决策不是一层。传统权限 DAC 判断“这个 UID/GID 能不能访问”；ACL 提供更细的用户/组授权；capability 把 root 的部分能力拆分；PAM 决定登录和提权认证流程；sudo 决定谁能以谁的身份执行哪…"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
  - "深度解析"
category: "运维"
---

# Linux 学习资料：SELinux、AppArmor、PAM 和 sudo 安全深度解析

[返回索引](../Linux学习资料.md)

## 学习目标

- 理解 Linux 安全链路：DAC、ACL、capability、PAM、sudo、LSM、audit。
- 深入掌握 SELinux 和 AppArmor 的模型差异、排查入口和修复方式。
- 能设计最小权限 sudo、SSH、服务用户和安全审计方案。
- 能处理 CentOS 7 SELinux 到 Ubuntu 24.04 AppArmor 的迁移思维差异。

## 理论导读

Linux 安全决策不是一层。传统权限 DAC 判断“这个 UID/GID 能不能访问”；ACL 提供更细的用户/组授权；capability 把 root 的部分能力拆分；PAM 决定登录和提权认证流程；sudo 决定谁能以谁的身份执行哪些命令；SELinux/AppArmor 通过 LSM 在内核访问路径上做强制访问控制；audit 记录证据。

生产中的“Permission denied”经常是多层叠加。只看 `ls -l` 不够，只会 `setenforce 0` 更危险。

## 核心心智模型

```text
请求主体：进程 UID/GID + groups + capabilities + LSM label/profile
  -> DAC 权限和 ACL
  -> capability 检查
  -> LSM: SELinux/AppArmor
  -> 具体子系统检查
  -> audit/log
```

## 知识点详解

## 一、DAC、ACL 和 capability

DAC 是传统 owner/group/other 权限。ACL 扩展 DAC。capability 把 root 能力拆细，例如绑定低端口、修改网络配置、加载模块等。

查看进程 capability：

```bash
grep Cap /proc/<pid>/status
getcap -r /usr/bin /usr/sbin 2>/dev/null | head
```

示例：

```bash
sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/myserver
```

这允许程序绑定 1024 以下端口，而不必以 root 运行。风险是二进制如果被替换，能力也可能被滥用。必须保护文件 owner 和写权限。

## 二、PAM 深度模型

PAM 配置由多个模块栈组成，常见类型：

| 类型 | 作用 |
| --- | --- |
| auth | 身份认证 |
| account | 账号有效性、过期、访问策略 |
| password | 密码修改策略 |
| session | 登录 session 初始化和清理 |

控制标记：

- `required`
- `requisite`
- `sufficient`
- `optional`

配置路径：

```bash
ls /etc/pam.d/
cat /etc/pam.d/sshd
cat /etc/pam.d/sudo
```

PAM 修改风险极高。错误配置可能让 SSH、sudo、su 全部不可用。生产应先保留 root 控制台。

## 三、sudo 深度风险

查看用户 sudo 权限：

```bash
sudo -l -U deploy
```

危险授权：

```text
deploy ALL=(root) NOPASSWD: ALL
deploy ALL=(root) NOPASSWD: /usr/bin/vim
deploy ALL=(root) NOPASSWD: /usr/bin/find
```

很多命令能逃逸到 shell。例如 `vim`、`less`、`find -exec`、`tar --checkpoint-action`、`awk system()`。授权命令时要评估是否能执行任意命令。

更安全：

```text
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx.service, /usr/bin/systemctl status nginx.service
```

但 systemctl 本身也可能操作其他 unit，最好用 wrapper 脚本固定参数，并保证脚本 root 拥有、不可被 deploy 写。

## 四、SELinux 深度模型

SELinux 核心元素：

- subject：进程上下文。
- object：文件、端口、socket 等对象上下文。
- type enforcement：类型规则。
- role/user：更完整策略中的角色和用户。

查看：

```bash
getenforce
sestatus
ps -eZ | head
ls -Z /var/www/html
```

一次访问要同时满足：

- DAC 允许。
- SELinux 策略允许进程类型访问目标类型。
- 对端口、布尔值、文件上下文等策略正确。

### 文件上下文

恢复默认上下文：

```bash
sudo restorecon -Rv /var/www/html
```

自定义路径：

```bash
sudo semanage fcontext -a -t httpd_sys_content_t '/srv/www(/.*)?'
sudo restorecon -Rv /srv/www
```

`semanage` 可能在 `policycoreutils-python` 或相关包中。

### 端口类型

httpd 绑定非标准端口可能被拒绝：

```bash
sudo semanage port -l | grep http
sudo semanage port -a -t http_port_t -p tcp 8080
```

### 布尔值

```bash
getsebool -a | grep httpd
sudo setsebool -P httpd_can_network_connect on
```

`-P` 持久化，写策略需要时间。

### AVC 排查

```bash
sudo ausearch -m avc -ts recent
sudo audit2why -a 2>/dev/null || true
```

不要盲目执行 audit2allow 生成策略。先判断是否是上下文错误、布尔值错误或应用路径不合理。

## 五、AppArmor 深度模型

AppArmor 以 profile 约束程序可访问的路径、网络、能力等。

查看：

```bash
sudo aa-status
ls /etc/apparmor.d/
sudo journalctl -k | grep -i apparmor
```

模式：

```bash
sudo aa-complain profile_name
sudo aa-enforce profile_name
```

AppArmor profile 常见规则：

```text
/usr/sbin/nginx {
  /etc/nginx/** r,
  /var/log/nginx/** w,
  capability net_bind_service,
}
```

Ubuntu 24.04 的 AppArmor 适合按程序收敛权限。迁移 CentOS 7 SELinux 策略时，不要期待一一对应标签模型，要按程序行为重新建 profile 或调整默认 profile。

## 六、SSH 安全深度

安全配置不是只改端口。核心：

- 禁止 root 密码登录。
- 使用密钥，保护私钥。
- 限制用户和来源。
- 配合 fail2ban 或安全组限制暴力破解。
- 使用 sudo 审计提权。
- 保留紧急控制台。

修改前：

```bash
sudo sshd -t
```

服务名：

```bash
sudo systemctl reload sshd  # CentOS 7
sudo systemctl reload ssh   # Ubuntu 24.04
```

## 七、审计证据

auditd：

```bash
sudo auditctl -s
sudo auditctl -w /etc/sudoers -p wa -k sudoers_changes
sudo ausearch -k sudoers_changes
```

sudo 日志：

CentOS 7：

```bash
sudo grep sudo /var/log/secure
```

Ubuntu 24.04：

```bash
sudo grep sudo /var/log/auth.log
```

## 例子：Nginx 能读文件但不能连接后端

CentOS 7 SELinux 常见：

```bash
sudo ausearch -m avc -ts recent
getsebool httpd_can_network_connect
sudo setsebool -P httpd_can_network_connect on
```

Ubuntu 24.04 AppArmor 常见：

```bash
sudo journalctl -k | grep -i apparmor
sudo aa-status
```

再检查防火墙、DNS、路由和应用配置。

## 练习

1. 查看一个服务进程的 UID/GID、capability、SELinux/AppArmor 状态。
2. 写 sudoers 只允许重启指定服务，并用 `sudo -l` 验证。
3. 在 CentOS 7 上制造文件上下文错误并用 `restorecon` 修复。
4. 在 Ubuntu 24.04 上查看 AppArmor deny 日志。
5. 用 auditd 监控 `/etc/passwd` 修改。

## 验收

- 能画出 Linux 安全检查链路。
- 能解释 capability 与 root 的关系。
- 能判断 sudo 授权是否存在逃逸风险。
- 能用 AVC 日志定位 SELinux 问题。
- 能用 AppArmor profile 和内核日志定位 Ubuntu 拒绝。
- 能设计 SSH 和 sudo 最小权限方案。

## 重点

- 安全模块是内核访问控制路径的一部分，不是普通日志功能。
- SELinux 修复优先考虑上下文、端口类型和布尔值，不要直接关。
- AppArmor 按程序 profile 思考，不按 SELinux 标签思考。
- sudo 命令授权要考虑命令逃逸。

## 难点

- “权限正确但访问失败”可能同时涉及 DAC、ACL、capability、LSM、mount options、服务用户和应用自身策略。

## 易错

> **易错：** audit2allow 输出什么就加载什么。
>
> 正确做法：先判断拒绝是否来自错误上下文或错误部署路径，只有明确需要自定义策略时才生成并审查策略。

> **易错：** 认为 `NOPASSWD` 本身就是最大风险。
>
> 正确做法：真正风险在授权命令范围和是否可逃逸。一个不可逃逸的固定命令可能比需要密码但允许 `ALL` 更安全。

