---
title: "Shell学习资料"
date: 2026-06-20
description: "这是一份面向 Linux 运维、后端开发、DevOps 和自动化脚本编写的 Shell 学习资料。主题以 Bash 为主，同时明确 POSIX sh、dash、zsh 的边界，重点覆盖解析执行模型、引用和展开、错误处理、管道、文本处理、安全…"
tags:
  - "开发语言"
  - "Shell"
  - "学习资料总览"
category: "开发语言"
---

# Shell学习资料

这是一份面向 Linux 运维、后端开发、DevOps 和自动化脚本编写的 Shell 学习资料。主题以 Bash 为主，同时明确 POSIX sh、dash、zsh 的边界，重点覆盖解析执行模型、引用和展开、错误处理、管道、文本处理、安全、可移植性和生产排障。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 环境、版本和 POSIX/Bash 差异 | [01-环境版本和POSIXBash差异.md](study-material/01-环境版本和POSIXBash差异.md) |
| 2 | 命令解析、展开和引用机制 | [02-命令解析展开和引用机制.md](study-material/02-命令解析展开和引用机制.md) |
| 3 | 变量、参数、环境和作用域 | [03-变量参数环境和作用域.md](study-material/03-变量参数环境和作用域.md) |
| 4 | 退出状态、条件判断和错误处理 | [04-退出状态条件判断和错误处理.md](study-material/04-退出状态条件判断和错误处理.md) |
| 5 | 重定向、管道、文件描述符和 Here 文档 | [05-重定向管道文件描述符和Here文档.md](study-material/05-重定向管道文件描述符和Here文档.md) |
| 6 | 控制流、函数和脚本结构 | [06-控制流函数和脚本结构.md](study-material/06-控制流函数和脚本结构.md) |
| 7 | 数组、字符串和参数展开 | [07-数组字符串和参数展开.md](study-material/07-数组字符串和参数展开.md) |
| 8 | 通配符、正则和模式匹配 | [08-通配符正则和模式匹配.md](study-material/08-通配符正则和模式匹配.md) |
| 9 | 文本处理：grep、sed、awk、cut、sort、uniq | [09-文本处理grepSedAwkCutSortUniq.md](study-material/09-文本处理grepSedAwkCutSortUniq.md) |
| 10 | 文件查找、find、xargs 和批处理 | [10-文件查找findxargs和批处理.md](study-material/10-文件查找findxargs和批处理.md) |
| 11 | 进程、作业、信号、trap 和定时任务 | [11-进程作业信号trap和定时任务.md](study-material/11-进程作业信号trap和定时任务.md) |
| 12 | 脚本工程化、调试、测试和 ShellCheck | [12-脚本工程化调试测试和ShellCheck.md](study-material/12-脚本工程化调试测试和ShellCheck.md) |
| 13 | 安全、权限、Secrets 和高风险命令 | [13-安全权限Secrets和高风险命令.md](study-material/13-安全权限Secrets和高风险命令.md) |
| 14 | 可移植性、性能和生产运维 | [14-可移植性性能和生产运维.md](study-material/14-可移植性性能和生产运维.md) |
| 15 | 综合练习项目 | [15-综合练习项目.md](study-material/15-综合练习项目.md) |
| 16 | 命令速查 | [16-命令速查.md](study-material/16-命令速查.md) |
| 17 | 面试知识点整理 | [17-面试知识点整理.md](study-material/17-面试知识点整理.md) |
| 18 | Shell 完整知识点清单 | [18-Shell完整知识点清单.md](study-material/18-Shell完整知识点清单.md) |
| 19 | 解析器、展开和执行模型深度解析 | [19-解析器展开执行模型深度解析.md](study-material/19-解析器展开执行模型深度解析.md) |
| 20 | 错误处理、set 选项和管道语义深度解析 | [20-错误处理set选项和管道语义深度解析.md](study-material/20-错误处理set选项和管道语义深度解析.md) |
| 21 | awk、sed 和正则深度解析 | [21-awkSed正则深度解析.md](study-material/21-awkSed正则深度解析.md) |
| 22 | 生产脚本排障案例和剧本 | [22-生产脚本排障案例和剧本.md](study-material/22-生产脚本排障案例和剧本.md) |
| 23 | 深度实验手册和能力验收 | [23-深度实验手册和能力验收.md](study-material/23-深度实验手册和能力验收.md) |
| 24 | Bash 语法、命令分类和查找顺序深度解析 | [24-Bash语法命令分类和查找顺序深度解析.md](study-material/24-Bash语法命令分类和查找顺序深度解析.md) |
| 25 | IFS、分词、glob 选项和 locale 深度解析 | [25-IFS分词glob选项和locale深度解析.md](study-material/25-IFS分词glob选项和locale深度解析.md) |
| 26 | 文件描述符、exec、进程替换和 coproc 深度解析 | [26-文件描述符exec进程替换和coproc深度解析.md](study-material/26-文件描述符exec进程替换和coproc深度解析.md) |
| 27 | Subshell、作用域、lastpipe 和并发控制深度解析 | [27-Subshell作用域lastpipe和并发控制深度解析.md](study-material/27-Subshell作用域lastpipe和并发控制深度解析.md) |
| 28 | trap、信号、ERR、DEBUG 和 RETURN 深度解析 | [28-trap信号ERRDEBUG和RETURN深度解析.md](study-material/28-trap信号ERRDEBUG和RETURN深度解析.md) |
| 29 | 参数解析、getopts、配置加载和优先级深度解析 | [29-参数解析getopts配置加载和优先级深度解析.md](study-material/29-参数解析getopts配置加载和优先级深度解析.md) |
| 30 | POSIX、dash、BusyBox、GNU/BSD 兼容深度解析 | [30-POSIXdashBusyBoxGNUBSD兼容深度解析.md](study-material/30-POSIXdashBusyBoxGNUBSD兼容深度解析.md) |
| 31 | Shell 安全攻防、TOCTOU 和权限边界深度解析 | [31-Shell安全攻防TOCTOU和权限边界深度解析.md](study-material/31-Shell安全攻防TOCTOU和权限边界深度解析.md) |
| 32 | 脚本框架化、测试、CI 和发布深度解析 | [32-脚本框架化测试CI和发布深度解析.md](study-material/32-脚本框架化测试CI和发布深度解析.md) |
| 33 | 大型日志处理、性能剖析和替代工具深度解析 | [33-大型日志处理性能剖析和替代工具深度解析.md](study-material/33-大型日志处理性能剖析和替代工具深度解析.md) |
| 34 | 生产故障深度复盘和事故预防 | [34-生产故障深度复盘和事故预防.md](study-material/34-生产故障深度复盘和事故预防.md) |

## 使用建议

- 入门：按 00 到 08 学习，重点掌握引用、变量、退出码、条件和重定向。
- 工作脚本：重点看 04、05、09、10、12、13、14，避免写出危险脚本。
- 深入机制：重点看 19、20、24、25、26、27、28，理解 Shell 为什么经常“看起来对，运行就错”。
- 排障：重点看 12、20、22、34，结合 `set -x`、`trap`、日志、ShellCheck。
- 生产设计：重点看 29、30、31、32、33，覆盖参数优先级、兼容性、安全边界、测试发布和性能剖析。
- 面试复习：先读 18，再读 17 和 `面试知识点/`。
