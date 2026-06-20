---
title: "Shell学习资料：文本处理 grep、sed、awk、cut、sort、uniq"
date: 2026-06-20
description: "Shell 文本处理的优势是流式组合。grep 负责筛选行，sed 负责简单替换和行编辑，awk 负责按字段处理和统计，sort/uniq 负责排序去重，cut 负责简单列提取。工具选错会让命令复杂且脆弱。"
tags:
  - "开发语言"
  - "Shell"
category: "开发语言"
---

# Shell学习资料：文本处理 grep、sed、awk、cut、sort、uniq

[返回索引](../Shell学习资料.md)

## 学习目标

- 掌握常见文本处理工具的职责边界。
- 能组合 grep、sed、awk、sort、uniq 处理日志。
- 知道什么时候应使用 jq、python 或专用工具。

## 理论导读

Shell 文本处理的优势是流式组合。grep 负责筛选行，sed 负责简单替换和行编辑，awk 负责按字段处理和统计，sort/uniq 负责排序去重，cut 负责简单列提取。工具选错会让命令复杂且脆弱。

## 工具职责

| 工具 | 适合 | 不适合 |
| --- | --- | --- |
| grep | 按行筛选 | 复杂字段计算 |
| sed | 简单替换、删除、插入 | 复杂状态统计 |
| awk | 字段提取、聚合、报表 | 复杂 JSON |
| cut | 固定分隔符列提取 | 多空格、不规则格式 |
| sort | 排序 | 结构化解析 |
| uniq | 相邻去重和计数 | 未排序全局去重 |

## grep

```bash
grep -n 'ERROR' app.log
grep -E 'ERROR|FATAL' app.log
grep -F -- "$literal" app.log
grep -r --include='*.log' 'timeout' /var/log/app
```

## sed

```bash
sed -n '1,10p' app.log
sed 's/old/new/g' file
sed -n '/ERROR/p' app.log
```

原地修改要谨慎：

```bash
sed -i.bak 's/old/new/g' config.conf
```

## awk

```bash
awk '{print $1, $7}' access.log
awk '$9 >= 500 {count++} END {print count}' access.log
awk '{ip[$1]++} END {for (i in ip) print ip[i], i}' access.log | sort -nr | head
```

awk 的心智模型是“对每一行执行一次脚本”，最后执行 `END`。

## sort 和 uniq

```bash
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head
```

`uniq` 只合并相邻重复项，所以通常先 `sort`。

## 例子：统计 Nginx 5xx Top IP

```bash
awk '$9 ~ /^5/ {ip[$1]++} END {for (i in ip) print ip[i], i}' access.log \
  | sort -nr \
  | head -n 10
```

## 练习

1. 从 access log 中统计状态码分布。
2. 用 sed 去掉配置文件中的空行和注释行。
3. 用 awk 计算某列数字总和。
4. 用 sort/uniq 找出重复最多的字段。

## 验收

- 能根据任务选择 grep、sed、awk。
- 能解释为什么 `uniq` 前通常需要 `sort`。
- 能写出一个日志 Top N 统计命令。

## 重点

- 简单筛选用 grep，字段统计用 awk。
- 用户输入当固定字符串时用 `grep -F`。
- 复杂 JSON 不要用 grep/sed 硬切，使用 jq。

## 易错

> **易错：** 用 `cut -d' ' -f2` 处理多个空格分隔的日志。
>
> 正确做法：使用 awk，默认能按连续空白分隔字段。

