---
title: "Shell学习资料：进程、作业、信号、trap 和定时任务"
date: 2026-06-20
description: "Shell 脚本经常创建子进程、后台任务和临时文件。脚本被 Ctrl-C、kill、超时或失败中断时，如果没有 trap，可能留下锁文件、临时目录、半成品文件或后台进程。生产脚本必须设计清理路径。"
tags:
  - "开发语言"
  - "Shell"
category: "开发语言"
---

# Shell学习资料：进程、作业、信号、trap 和定时任务

[返回索引](../Shell学习资料.md)

## 学习目标

- 理解前台、后台、进程、子 Shell、作业控制。
- 掌握信号、trap、临时目录清理和优雅退出。
- 正确使用 cron/systemd timer 执行脚本。

## 理论导读

Shell 脚本经常创建子进程、后台任务和临时文件。脚本被 Ctrl-C、kill、超时或失败中断时，如果没有 trap，可能留下锁文件、临时目录、半成品文件或后台进程。生产脚本必须设计清理路径。

## 进程和后台任务

```bash
long_task &
pid=$!
wait "$pid"
```

`$!` 是最近后台进程 PID。`wait` 会等待并返回该任务退出状态。

并发示例：

```bash
pids=()
for host in "${hosts[@]}"; do
  check_host "$host" &
  pids+=("$!")
done

status=0
for pid in "${pids[@]}"; do
  wait "$pid" || status=1
done
exit "$status"
```

## subshell

```bash
(cd /tmp && pwd)
pwd
```

括号中的命令在子 Shell 中执行，`cd` 不影响外层。

## trap

```bash
tmpdir=$(mktemp -d)
cleanup() {
  rm -rf -- "$tmpdir"
}
trap cleanup EXIT
```

`EXIT` 在脚本退出时触发。还可以捕获 `INT`、`TERM`、`ERR`。

```bash
trap 'echo interrupted >&2; exit 130' INT
trap 'echo terminated >&2; exit 143' TERM
```

## 锁文件

```bash
lock=/tmp/myjob.lock
exec 9>"$lock"
flock -n 9 || {
  echo "already running" >&2
  exit 1
}
```

`flock` 比手写 `if [ -f lock ]` 更可靠，因为后者有竞态条件。

## cron 和 systemd timer

cron 环境很小，常见问题：

- `PATH` 不同。
- 当前目录不是脚本目录。
- 没有交互 Shell 配置。
- 输出未重定向会发邮件或丢失。

脚本中应设置：

```bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
cd -- "$(dirname -- "$0")"
```

## 练习

1. 写脚本创建临时目录，用 trap 保证退出时删除。
2. 启动 3 个后台任务，收集所有退出状态。
3. 写一个 flock 防重入脚本。
4. 模拟 cron 环境执行脚本：`env -i PATH=/usr/bin:/bin bash script.sh`。

## 验收

- 能解释 `$!`、`wait`、subshell。
- 能用 trap 清理临时资源。
- 能说明 cron 环境和交互终端的差异。

## 重点

- 生产脚本要能处理中断和失败。
- 后台任务要 wait，否则失败可能被忽略。
- cron 脚本不要依赖交互环境。

## 易错

> **易错：** 脚本启动后台任务后直接退出。
>
> 正确做法：保存 PID，用 `wait` 收集退出状态，并在 trap 中清理。

