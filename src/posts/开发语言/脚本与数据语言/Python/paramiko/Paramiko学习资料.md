---
title: "Paramiko学习资料"
date: 2026-06-20
description: "这是一套面向 Python SSH 自动化、远程运维、文件传输和面试准备的 Paramiko 中文学习资料。内容从 SSH 安全模型、Host Key、认证和连接开始，逐步推进到远程命令执行、Channel、SFTP、跳板机、端口转发、并发…"
tags:
  - "开发语言"
  - "paramiko"
  - "学习资料总览"
category: "开发语言"
---

# Paramiko学习资料

这是一套面向 Python SSH 自动化、远程运维、文件传输和面试准备的 Paramiko 中文学习资料。内容从 SSH 安全模型、Host Key、认证和连接开始，逐步推进到远程命令执行、Channel、SFTP、跳板机、端口转发、并发、超时重试、日志排障、测试和生产安全规范。

版本基准：Paramiko 5.0.0、Python 3.10+。目录名按 Python 包名使用 `paramiko`，正文使用项目名 `Paramiko`。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览、定位和 SSH 心智模型 | [00-总览与SSH心智模型.md](study-material/00-总览与SSH心智模型.md) |
| 1 | 环境安装、依赖和最小连接 | [01-环境安装依赖和最小连接.md](study-material/01-环境安装依赖和最小连接.md) |
| 2 | SSH 安全模型、Host Key 和认证 | [02-SSH安全模型HostKey和认证.md](study-material/02-SSH安全模型HostKey和认证.md) |
| 3 | SSHClient、Transport、Channel 架构 | [03-SSHClientTransportChannel架构.md](study-material/03-SSHClientTransportChannel架构.md) |
| 4 | 远程命令执行、stdout、stderr 和退出码 | [04-远程命令执行stdoutstderr和退出码.md](study-material/04-远程命令执行stdoutstderr和退出码.md) |
| 5 | SFTP 文件传输和远程文件操作 | [05-SFTP文件传输和远程文件操作.md](study-material/05-SFTP文件传输和远程文件操作.md) |
| 6 | 密钥、密码、代理和凭据管理 | [06-密钥密码代理和凭据管理.md](study-material/06-密钥密码代理和凭据管理.md) |
| 7 | 跳板机、代理命令和端口转发 | [07-跳板机代理命令和端口转发.md](study-material/07-跳板机代理命令和端口转发.md) |
| 8 | 超时、重试、幂等和错误处理 | [08-超时重试幂等和错误处理.md](study-material/08-超时重试幂等和错误处理.md) |
| 9 | 并发批量执行和连接池边界 | [09-并发批量执行和连接池边界.md](study-material/09-并发批量执行和连接池边界.md) |
| 10 | 日志、调试和生产排障 | [10-日志调试和生产排障.md](study-material/10-日志调试和生产排障.md) |
| 11 | 测试、Mock 和本地 SSH 实验环境 | [11-测试Mock和本地SSH实验环境.md](study-material/11-测试Mock和本地SSH实验环境.md) |
| 12 | 安全规范、运维集成和替代方案 | [12-安全规范运维集成和替代方案.md](study-material/12-安全规范运维集成和替代方案.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | Paramiko 完整知识点清单 | [14-Paramiko完整知识点清单.md](study-material/14-Paramiko完整知识点清单.md) |
| 15 | 综合练习项目 | [15-综合练习项目.md](study-material/15-综合练习项目.md) |

## 使用建议

先读 [Paramiko学习路线图.md](Paramiko学习路线图.md)，再按上表顺序推进。若目标是日常远程运维，重点看第 1、2、4、5、8、10、12 章；若目标是批量自动化平台，重点看第 3、7、8、9、11、15 章。

准备面试时先看 [13-面试知识点整理.md](study-material/13-面试知识点整理.md)，再按类别阅读 `study-material/面试知识点/`。

## 推荐产出

学习过程中至少完成三个产出：一个安全执行远程命令的小工具、一个批量 SFTP 同步脚本、一个支持跳板机、超时、日志和结果汇总的批量运维执行器。

