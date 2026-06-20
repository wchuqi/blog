---
title: "Linux 学习资料：Shell 脚本、文本处理和自动化"
date: 2026-06-20
description: "Shell 自动化不是把手工命令复制到文件里。手工命令失败时，人会观察并修正；脚本失败时，如果没有错误处理、日志和边界检查，可能批量破坏系统。可靠脚本必须明确输入、输出、退出码、异常路径和幂等性。"
tags:
  - "运维"
  - "Linux-CentOS7-Ubuntu24"
category: "运维"
---

# Linux 学习资料：Shell 脚本、文本处理和自动化

[返回索引](../Linux学习资料.md)

## 学习目标

- 掌握 Bash 脚本的变量、引用、条件、循环、函数、退出码和错误处理。
- 熟练使用 `grep`、`sed`、`awk`、`find`、`xargs`、`sort`、`uniq`、`cut`、`jq` 处理文本和日志。
- 能写幂等、安全、可审计的巡检和运维脚本。

## 理论导读

Shell 自动化不是把手工命令复制到文件里。手工命令失败时，人会观察并修正；脚本失败时，如果没有错误处理、日志和边界检查，可能批量破坏系统。可靠脚本必须明确输入、输出、退出码、异常路径和幂等性。

CentOS 7 和 Ubuntu 24.04 默认 Bash 版本不同，部分工具版本也不同。脚本应避免依赖不必要的新特性，或在开头检查环境。

## 核心心智模型

可靠脚本的结构：

```text
参数解析
  -> 前置检查
  -> 获取当前状态
  -> 判断是否需要变更
  -> 执行最小变更
  -> 验证结果
  -> 写日志和退出码
```

## 知识点详解

### 1. 安全脚本模板

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*"
}

die() {
  log "ERROR: $*"
  exit 1
}

main() {
  [[ $# -ge 1 ]] || die "usage: $0 <service>"
  local service="$1"
  systemctl status "$service" >/dev/null || die "service not healthy: $service"
  log "service healthy: $service"
}

main "$@"
```

解释：

- `set -e`：命令失败时退出，但有边界，要理解例外。
- `set -u`：未定义变量报错。
- `pipefail`：管道任一环节失败，整体失败。
- 双引号保护变量，避免词拆分和通配符。

### 2. 条件和退出码

```bash
if systemctl is-active --quiet nginx; then
  echo "nginx active"
else
  echo "nginx not active"
fi
```

测试文件：

```bash
[[ -f /etc/passwd ]]
[[ -d /var/log ]]
[[ -n "${var:-}" ]]
```

### 3. grep、sed、awk

grep：

```bash
grep -R "ERROR" /var/log/app/
grep -E "error|failed|timeout" app.log
grep -v "healthcheck" access.log
```

sed：

```bash
sed -n '1,20p' file
sed -n '/ERROR/p' app.log
sed 's/old/new/g' file
```

awk：

```bash
awk '{print $1, $NF}' access.log
awk '$9 >= 500 {count++} END {print count}' access.log
awk -F: '$3 >= 1000 {print $1, $3}' /etc/passwd
```

### 4. find 和 xargs

```bash
find /var/log -type f -name "*.log" -mtime +7 -print
find /var/log -type f -name "*.log" -mtime +7 -print0 | xargs -0 ls -lh
```

使用 `-print0` 和 `xargs -0` 处理带空格文件名。

危险操作要先打印确认，再执行变更。

### 5. JSON 处理

现代运维常处理 JSON。安装 `jq`：

CentOS 7：

```bash
sudo yum install -y jq
```

Ubuntu 24.04：

```bash
sudo apt update
sudo apt install -y jq
```

示例：

```bash
jq '.status' response.json
jq -r '.items[].metadata.name' pods.json
```

### 6. 幂等

幂等表示重复执行不会造成重复变更或破坏。

非幂等示例：

```bash
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf
```

每次执行都会追加。更好的思路是先判断、生成配置、备份、验证，再替换。

### 7. 并发和锁

防止脚本重复运行：

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

exec 9>/run/my-job.lock
flock -n 9 || {
  echo "job already running"
  exit 1
}

# do work
```

### 8. 远程执行注意事项

SSH 批量执行时要关注：

- 超时。
- 退出码。
- stdout/stderr 分离。
- sudo 权限。
- 并发数量。
- 失败重试和回滚。

不要把未知主机批量执行高危命令作为第一方案。

## 例子：巡检脚本

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

echo "== system =="
cat /etc/os-release | sed -n '1,5p'
uname -r

echo "== load =="
uptime

echo "== memory =="
free -h

echo "== disk =="
df -hT
df -i

echo "== failed services =="
systemctl --failed || true

echo "== listening ports =="
ss -lntup 2>/dev/null || ss -lntu

echo "== recent errors =="
journalctl -p err -b --no-pager | tail -50 || true
```

## 练习

1. 写脚本检查 nginx 是否 active，不是则输出最近 50 行日志。
2. 写脚本统计 access.log 中 5xx 数量和 Top 10 IP。
3. 写脚本检查磁盘使用率超过 80% 的挂载点。
4. 使用 `flock` 防止脚本重复执行。
5. 把脚本做成 systemd oneshot service 加 timer。

## 验收

- 能解释 `set -Eeuo pipefail` 的作用和边界。
- 能正确处理带空格文件名。
- 能用 awk 做字段统计。
- 能写幂等脚本，避免重复追加配置。
- 能让脚本输出明确日志和退出码。

## 重点

- 脚本变量引用默认加双引号。
- 高危变更先 dry-run 或打印确认。
- 自动化必须处理失败路径。
- 幂等和锁是生产脚本的基本要求。

## 难点

- Bash 的 `set -e` 有例外场景，例如条件判断、管道、子 shell。不能以为设置后所有错误都自动安全处理。

## 易错

> **易错：** 用 `for f in $(find ...)` 遍历文件。
>
> 正确做法：用 `find -print0` 配合 `while IFS= read -r -d ''` 或 `xargs -0`。

> **易错：** 脚本没有日志和退出码，失败后只能猜。
>
> 正确做法：每个关键步骤记录动作、结果和错误。

