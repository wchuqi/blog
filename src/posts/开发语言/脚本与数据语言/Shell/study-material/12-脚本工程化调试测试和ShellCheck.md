---
title: "Shell学习资料：脚本工程化、调试、测试和 ShellCheck"
date: 2026-06-20
description: "Shell 脚本短时可以随手写，长期维护时必须工程化。工程化不是复杂化，而是让脚本具备清晰入口、参数校验、日志、错误处理、dry-run、幂等性、测试和静态检查。否则脚本最容易变成生产事故入口。"
tags:
  - "开发语言"
  - "Shell"
category: "开发语言"
---

# Shell学习资料：脚本工程化、调试、测试和 ShellCheck

[返回索引](../Shell学习资料.md)

## 学习目标

- 建立生产脚本结构模板。
- 掌握调试、日志、ShellCheck、测试和代码评审重点。
- 能让脚本失败时有证据可查。

## 理论导读

Shell 脚本短时可以随手写，长期维护时必须工程化。工程化不是复杂化，而是让脚本具备清晰入口、参数校验、日志、错误处理、dry-run、幂等性、测试和静态检查。否则脚本最容易变成生产事故入口。

## 推荐结构

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
readonly SCRIPT_DIR

log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*" >&2; }
die() { log "fatal: $*"; exit 1; }

usage() {
  cat <<'EOF'
usage: script.sh [--dry-run] --src DIR --dst DIR
EOF
}

main() {
  # parse args
  :
}

main "$@"
```

## 调试

```bash
bash -n script.sh       # 语法检查
bash -x script.sh       # 跟踪执行
set -x                  # 打开跟踪
set +x                  # 关闭跟踪
```

更清晰的 trace：

```bash
export PS4='+ ${BASH_SOURCE}:${LINENO}:${FUNCNAME[0]}: '
bash -x script.sh
```

## ShellCheck

```bash
shellcheck script.sh
```

ShellCheck 能发现未引用变量、无效 POSIX 写法、无意义命令替换、数组展开错误、`read` 缺少 `-r` 等问题。

不要盲目禁用规则。需要禁用时写明原因：

```bash
# shellcheck disable=SC2086 # intentional word splitting for user-provided flags after validation
```

## 测试

Shell 测试可以用：

- bats-core。
- shunit2。
- 直接写小型测试脚本。
- 在临时目录中构造输入和断言输出。

最小测试思路：

```bash
tmp=$(mktemp -d)
trap 'rm -rf -- "$tmp"' EXIT

printf 'hello\n' >"$tmp/input"
./script.sh "$tmp/input" >"$tmp/out"
grep -q 'hello' "$tmp/out"
```

## 代码评审清单

- 解释器是否正确。
- 变量是否加引号。
- 是否使用 `"$@"`。
- 是否处理命令失败。
- 删除类操作是否有路径校验和 dry-run。
- 是否依赖交互环境。
- 是否泄露 secret。
- 是否通过 ShellCheck。

## 练习

1. 为一个脚本加 `usage`、`log`、`die`、`main`。
2. 用 ShellCheck 修复所有高危问题。
3. 写一个基于临时目录的测试。

## 验收

- 脚本 `bash -n` 通过。
- ShellCheck 无关键告警。
- 失败时能输出行号或明确错误信息。

## 重点

- 调试输出不能泄露密码。
- 工程化脚本要有 dry-run 和幂等性。
- 脚本入口统一放在 `main "$@"`。

## 易错

> **易错：** 在 CI 中直接运行脚本，没有先 `bash -n` 和 ShellCheck。
>
> 正确做法：把语法检查、静态检查和关键测试纳入 CI。

