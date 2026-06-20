---
title: "Shell学习资料：安全、权限、Secrets 和高风险命令"
date: 2026-06-20
description: "Shell 天生负责拼接和调用命令，所以安全风险比很多语言更直接。未引用变量、eval、不可信输入参与命令、危险路径、临时文件竞争、日志打印 secret、curl sh 都可能导致事故。安全 Shell 脚本的原则是：输入校验、参数数组、…"
tags:
  - "开发语言"
  - "Shell"
category: "开发语言"
---

# Shell学习资料：安全、权限、Secrets 和高风险命令

[返回索引](../Shell学习资料.md)

## 学习目标

- 识别 Shell 脚本中的命令注入、路径注入、secret 泄漏和危险删除。
- 掌握安全执行外部命令的原则。
- 设计生产脚本的保护措施。

## 理论导读

Shell 天生负责拼接和调用命令，所以安全风险比很多语言更直接。未引用变量、`eval`、不可信输入参与命令、危险路径、临时文件竞争、日志打印 secret、`curl | sh` 都可能导致事故。安全 Shell 脚本的原则是：输入校验、参数数组、最小权限、显式路径、dry-run、审计日志和拒绝危险默认值。

## 高风险写法

### eval

```bash
eval "$user_input"
```

`eval` 会让字符串再次被 Shell 解析，几乎总是高风险。多数场景可用数组、case 或显式函数替代。

### 未引用变量

```bash
rm -rf $target
```

如果 target 为空、含空格或 glob，后果不可控。

### curl pipe shell

```bash
curl -fsSL https://example/install.sh | sh
```

这会直接执行远程内容，难以审计。至少应下载、校验、阅读、固定版本和校验和。

## 安全删除模板

```bash
safe_rm_tree() {
  local target=${1:?missing target}
  local root=/var/tmp/myapp

  target=$(realpath -m -- "$target")
  root=$(realpath -m -- "$root")

  [[ "$target" == "$root"/* ]] || {
    echo "refuse to remove outside root: $target" >&2
    return 2
  }

  [[ -d "$target" ]] || {
    echo "not a directory: $target" >&2
    return 2
  }

  rm -rf -- "$target"
}
```

## secret 处理

不要：

- 把密码写在命令行参数里，可能被 `ps` 看到。
- `set -x` 时打印含 secret 的命令。
- 把 `.env` 打进日志。
- 把 token 放进 Git。

更好：

- 从受控文件描述符或 secret 管理器读取。
- 对 secret 日志脱敏。
- 在敏感区域临时 `set +x`。

```bash
set +x
password=${DB_PASSWORD:?missing DB_PASSWORD}
set -x
```

## 临时文件安全

```bash
tmpdir=$(mktemp -d)
trap 'rm -rf -- "$tmpdir"' EXIT
```

不要手写 `/tmp/myfile.$$`，存在竞态和预测风险。

## 权限和 umask

```bash
umask 077
secret_file=$(mktemp)
printf '%s\n' "$secret" >"$secret_file"
```

`umask 077` 可让新建文件默认只有当前用户可读写。

## 练习

1. 找出脚本中所有 `eval` 和未引用变量。
2. 为删除脚本增加根路径限制和 dry-run。
3. 模拟 `set -x` 泄露密码，再修复。

## 验收

- 能解释 `eval` 为什么危险。
- 能写出安全删除函数。
- 能列出至少 5 种 secret 泄漏路径。

## 重点

- 不可信输入只能作为参数，不能作为代码。
- 删除前先校验路径范围。
- secret 不进日志、不进命令行、不进 Git。

## 易错

> **易错：** `rm -rf "$dir"` 只加引号就认为安全。
>
> 正确做法：还要校验非空、存在、类型、realpath 后位于允许根目录下，并支持 dry-run。

