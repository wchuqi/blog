---
title: "Paramiko学习资料：SFTP 文件传输和远程文件操作"
date: 2026-06-20
description: "SFTP 是基于 SSH 的文件传输协议，走 SSH 加密通道。Paramiko 的 SFTPClient 提供 put、get、listdir、stat、mkdir、remove 等方法。文件传输要考虑目录存在性、权限、原子替换、断点失败…"
tags:
  - "开发语言"
  - "paramiko"
category: "开发语言"
---

# Paramiko学习资料：SFTP 文件传输和远程文件操作

[返回索引](../Paramiko学习资料.md)

## 学习目标

- 使用 SFTP 上传、下载、列目录和操作远程文件。
- 理解 SFTP 与 SCP、FTP 的区别。
- 设计安全可靠的文件同步流程。

## 理论导读

SFTP 是基于 SSH 的文件传输协议，走 SSH 加密通道。Paramiko 的 `SFTPClient` 提供 `put`、`get`、`listdir`、`stat`、`mkdir`、`remove` 等方法。文件传输要考虑目录存在性、权限、原子替换、断点失败和校验。

## 示例

```python
sftp = client.open_sftp()
try:
    sftp.put("local.conf", "/tmp/app.conf")
    sftp.rename("/tmp/app.conf", "/etc/app/app.conf")
    print(sftp.stat("/etc/app/app.conf").st_size)
finally:
    sftp.close()
```

## 可靠上传模式

```text
上传到临时路径 -> 校验大小或哈希 -> 原子 rename -> 远程命令 reload
```

## 常见操作

| 操作 | 方法 |
| --- | --- |
| 上传 | `put` |
| 下载 | `get` |
| 打开远程文件 | `open` |
| 列目录 | `listdir`、`listdir_attr` |
| 查看属性 | `stat` |
| 创建目录 | `mkdir` |
| 重命名 | `rename` |
| 删除 | `remove` |

## 练习

实现一个上传函数：若远程目录不存在则创建，先上传到 `.tmp` 文件，校验大小后 rename。

## 验收

- 能上传和下载文件。
- 能处理远程目录不存在。
- 能说明为什么先上传临时文件再 rename。

## 重点

- 文件传输成功不等于业务生效，还要校验权限、内容和后续 reload。

## 难点

- 远程权限不足、磁盘满、路径不存在和网络中断会产生不同失败，需要记录清楚。

## 易错

> **易错：** 直接覆盖生产配置文件。
>
> 正确做法：先备份、上传临时文件、校验、rename，并提供回滚策略。

