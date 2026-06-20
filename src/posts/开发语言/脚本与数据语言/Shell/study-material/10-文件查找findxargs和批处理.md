---
title: "Shell学习资料：文件查找、find、xargs 和批处理"
date: 2026-06-20
description: "Shell 批处理文件时最大的风险是把文件名当普通文本列表。Unix 文件名可以包含空格、制表符、换行和以 - 开头的字符。可靠批处理要使用空字符分隔，或者让 find -exec 直接传参，避免通过命令替换或空白分割。"
tags:
  - "开发语言"
  - "Shell"
category: "开发语言"
---

# Shell学习资料：文件查找、find、xargs 和批处理

[返回索引](../Shell学习资料.md)

## 学习目标

- 用 `find` 安全查找文件。
- 理解 `-print0`、`xargs -0`、`-exec` 的差异。
- 避免文件名空格、换行、短横线开头导致的批处理错误。

## 理论导读

Shell 批处理文件时最大的风险是把文件名当普通文本列表。Unix 文件名可以包含空格、制表符、换行和以 `-` 开头的字符。可靠批处理要使用空字符分隔，或者让 `find -exec` 直接传参，避免通过命令替换或空白分割。

## find 基础

```bash
find /var/log -type f -name '*.log'
find . -type f -mtime +7
find . -type f -size +100M
find . -type f -perm -111
```

常用条件：

- `-type f|d|l`：普通文件、目录、符号链接。
- `-name`：按文件名 glob。
- `-path`：按路径 glob。
- `-mtime`、`-mmin`：按修改时间。
- `-size`：按大小。
- `-perm`：按权限。
- `-maxdepth`、`-mindepth`：限制深度。

## find 动作

```bash
find . -type f -name '*.tmp' -print
find . -type f -name '*.tmp' -delete
find . -type f -name '*.log' -exec gzip -- {} \;
find . -type f -name '*.log' -exec gzip -- {} +
```

`-exec ... {} \;` 每个文件执行一次。`-exec ... {} +` 尽量批量传参，效率更高。

## xargs

```bash
find . -type f -name '*.log' -print0 | xargs -0 grep -H -- 'ERROR'
```

`-print0` 用空字符分隔，`xargs -0` 用空字符读取，能处理空格和换行。

## 安全删除

删除前先打印：

```bash
find "$dir" -type f -name '*.tmp' -print
```

确认后再删除：

```bash
find "$dir" -type f -name '*.tmp' -delete
```

生产脚本应先校验 `dir`：

```bash
[[ -n "$dir" && "$dir" == /var/tmp/myapp/* ]] || {
  echo "unsafe dir: $dir" >&2
  exit 2
}
```

## 练习

1. 创建包含空格和换行的文件名，验证 `find -print0 | xargs -0`。
2. 用 `find` 找出 7 天前的日志并压缩。
3. 写一个带 dry-run 的清理脚本。

## 验收

- 能解释为什么不用 `for f in $(find ...)`。
- 能使用 `-exec ... {} +` 和 `xargs -0`。
- 能为删除脚本加路径范围校验。

## 重点

- 文件名不是安全的“按行文本”。
- 删除类操作先 dry-run，再执行。
- 命令参数前加 `--`，防止文件名以 `-` 开头。

## 易错

> **易错：** `find . -name '*.log' | xargs rm`。
>
> 正确做法：`find . -name '*.log' -type f -print0 | xargs -0 rm --`，更安全时用 `-delete` 并先打印确认。

