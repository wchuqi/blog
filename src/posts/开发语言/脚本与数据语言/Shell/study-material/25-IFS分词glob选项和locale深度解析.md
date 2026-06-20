---
title: "Shell学习资料：IFS、分词、glob 选项和 locale 深度解析"
date: 2026-06-20
description: "Shell 分词不是简单的 split(\" \")。未引用展开结果会按 IFS 分词，IFS 中的空白字符和非空白字符处理规则不同；空字段的保留也受引用影响。随后发生的 pathname expansion 又会把 、?、[] 变成文件名列表…"
tags:
  - "开发语言"
  - "Shell"
  - "深度解析"
category: "开发语言"
---

# Shell学习资料：IFS、分词、glob 选项和 locale 深度解析

[返回索引](../Shell学习资料.md)

## 学习目标

- 理解 word splitting 中 IFS whitespace 和 non-whitespace 的差异。
- 掌握 glob 选项对匹配结果和失败行为的影响。
- 知道 locale 如何影响排序、字符范围和正则字符类。

## 理论导读

Shell 分词不是简单的 `split(" ")`。未引用展开结果会按 IFS 分词，IFS 中的空白字符和非空白字符处理规则不同；空字段的保留也受引用影响。随后发生的 pathname expansion 又会把 `*`、`?`、`[]` 变成文件名列表。locale 会影响字符范围和排序，导致同一脚本在不同环境输出不同。

## IFS 分词规则

默认：

```bash
printf '<%q>\n' "$IFS"
```

默认 IFS 是空格、制表符、换行。IFS 分隔符分两类：

- IFS whitespace：空格、tab、newline。
- IFS non-whitespace：例如 `,`、`:`。

IFS whitespace 会合并连续分隔符并忽略首尾分隔符；non-whitespace 分隔符会更明显地产生字段边界。

示例：

```bash
input=' a  b '
set -- $input
printf '<%s>\n' "$@"

IFS=,
input='a,,b,'
set -- $input
printf '<%s>\n' "$@"
```

> **重点：** 不要把 IFS 当作通用 CSV parser。真实 CSV 的引号和转义不是 IFS 能处理的。

## 空字段

未引用空变量通常会消失：

```bash
a=
printf '<%s>\n' $a X
printf '<%s>\n' "$a" X
```

第一条只输出 `X`，第二条输出空参数和 `X`。这会影响命令参数数量。

## read 和 IFS

```bash
while IFS= read -r line; do
  printf '<%s>\n' "$line"
done < file
```

`IFS=` 防止 read 去掉前后空白，`-r` 防止反斜杠转义。

读取 null 分隔：

```bash
while IFS= read -r -d '' file; do
  printf '<%s>\n' "$file"
done < <(find . -type f -print0)
```

## glob 选项

```bash
shopt -s nullglob
shopt -s failglob
shopt -s dotglob
shopt -s globstar
shopt -s extglob
```

| 选项 | 含义 | 风险 |
| --- | --- | --- |
| nullglob | 无匹配时展开为空 | 可能静默跳过 |
| failglob | 无匹配时报错 | 脚本中需处理错误 |
| dotglob | `*` 匹配点文件 | 可能包含隐藏文件 |
| globstar | `**` 递归匹配 | 可能范围过大 |
| extglob | 启用扩展模式 | 兼容性下降 |

示例：

```bash
shopt -s nullglob
files=(./*.log)
if ((${#files[@]} == 0)); then
  echo "no logs"
fi
```

## GLOBIGNORE 副作用

设置 `GLOBIGNORE` 会影响 glob 匹配，并可能隐式启用 dotglob 类行为。生产脚本不建议依赖用户环境中的 `GLOBIGNORE`，必要时应重置或显式设置 shopt。

## locale

```bash
locale
LC_ALL=C sort file
LC_ALL=C grep -E '^[A-Z]+$' file
```

locale 影响：

- `sort` 顺序。
- 字符范围，如 `[a-z]`。
- 字符类，如 `[[:alpha:]]`。
- 大小写转换。

为了稳定和性能，日志处理常设置 `LC_ALL=C`。

## 练习

1. 用不同 IFS 分割 `a,,b,`，观察空字段。
2. 比较 `nullglob`、`failglob`、默认行为。
3. 比较 `LC_ALL=C sort` 和默认 locale 的排序。
4. 使用 `read -d ''` 处理包含换行的文件名。

## 验收

- 能解释未引用空变量为什么会消失。
- 能说明 nullglob 和 failglob 的取舍。
- 能知道什么时候设置 `LC_ALL=C`。

## 易错

> **易错：** 改全局 `IFS` 后不恢复，导致后续脚本分词异常。
>
> 正确做法：尽量局部设置，如 `while IFS= read -r line`，或用数组和专用 parser。

