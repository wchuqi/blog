---
title: "Shell学习资料：awk、sed 和正则深度解析"
date: 2026-06-20
description: "文本处理工具的深度不在记参数，而在理解数据模型。awk 以记录为单位执行程序，自动分字段，适合统计和报表。sed 以模式空间为核心，适合流式编辑。grep 负责筛选。正则语义受工具、选项和 locale 影响，生产脚本中要固定预期。"
tags:
  - "开发语言"
  - "Shell"
  - "深度解析"
category: "开发语言"
---

# Shell学习资料：awk、sed 和正则深度解析

[返回索引](../Shell学习资料.md)

## 学习目标

- 深入理解 awk 的记录、字段、模式和动作。
- 掌握 sed 的地址、模式空间、替换和原地修改风险。
- 区分 BRE、ERE、固定字符串和 locale 影响。

## 理论导读

文本处理工具的深度不在记参数，而在理解数据模型。awk 以记录为单位执行程序，自动分字段，适合统计和报表。sed 以模式空间为核心，适合流式编辑。grep 负责筛选。正则语义受工具、选项和 locale 影响，生产脚本中要固定预期。

## awk 模型

```text
BEGIN
  -> read record
  -> split fields
  -> pattern matches?
  -> action
  -> next record
END
```

常用变量：

- `$0`：整行。
- `$1`、`$2`：字段。
- `NF`：字段数。
- `NR`：总记录号。
- `FNR`：当前文件记录号。
- `FS`：输入字段分隔符。
- `OFS`：输出字段分隔符。

示例：

```bash
awk -F, 'BEGIN {OFS="\t"} NR > 1 {sum[$1] += $3} END {for (k in sum) print k, sum[k]}' data.csv
```

## awk 关联数组

```bash
awk '{count[$1]++} END {for (ip in count) print count[ip], ip}' access.log \
  | sort -nr \
  | head
```

awk 的关联数组是文本统计的核心能力。

## sed 模型

sed 读取一行到 pattern space，执行脚本，默认打印 pattern space，然后读取下一行。

```bash
sed -n '10,20p' file
sed '/^#/d' file
sed 's/[[:space:]]\+$//' file
```

原地修改建议保留备份：

```bash
sed -i.bak 's/old/new/g' file
```

## 正则差异

- BRE：Basic Regular Expression，sed 默认常见。
- ERE：Extended Regular Expression，`grep -E`、`sed -E`。
- PCRE：Perl Compatible Regex，不是所有 grep 都支持 `-P`。
- Fixed string：`grep -F`，完全不按正则解释。

## locale

排序、字符类别、大小写转换可能受 locale 影响。需要稳定结果时：

```bash
LC_ALL=C sort file
LC_ALL=C grep -E '^[A-Z]+$' file
```

## 练习

1. 用 awk 统计 access log 状态码分布。
2. 用 awk 处理 CSV，说明简单 CSV 和带引号逗号的真实 CSV 差异。
3. 用 sed 删除注释和空行。
4. 比较 `grep`、`grep -E`、`grep -F`。

## 验收

- 能解释 awk 的 `NR`、`FNR`、`NF`、`FS`。
- 能判断任务该用 grep、sed 还是 awk。
- 能说明 `grep -F` 的安全价值。

## 重点

- awk 适合字段和聚合。
- sed 适合流式编辑，不适合复杂统计。
- 真实 CSV/JSON/YAML 不要用正则硬解析。

## 易错

> **易错：** 用 awk `-F,` 处理所有 CSV。
>
> 正确做法：简单 CSV 可用，带引号、转义和嵌入逗号时应使用 CSV parser。

