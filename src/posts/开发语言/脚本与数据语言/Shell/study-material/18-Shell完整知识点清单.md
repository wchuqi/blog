---
title: "Shell学习资料：Shell完整知识点清单"
date: 2026-06-20
description: "Shell、terminal、TTY、command、process。"
tags:
  - "开发语言"
  - "Shell"
  - "知识清单"
category: "开发语言"
---

# Shell学习资料：Shell完整知识点清单

[返回索引](../Shell学习资料.md)

## 1. 基础和环境

- Shell、terminal、TTY、command、process。
- Bash、sh、dash、zsh、fish、BusyBox ash。
- POSIX sh 与 Bash 扩展。
- shebang、执行权限、`PATH`。
- 交互 Shell、登录 Shell、非交互脚本。

## 2. 解析和展开

- token、word、command、assignment。
- brace、tilde、parameter、command、arithmetic expansion。
- word splitting、IFS、pathname expansion。
- quote removal。
- 单引号、双引号、反斜杠、ANSI-C quoting。
- glob、Shell pattern、regex 差异。

## 3. 变量和参数

- 变量赋值。
- 环境变量和 `export`。
- 位置参数和特殊参数。
- `"$@"`、`"$*"`。
- `local`、`readonly`、`declare`。
- 参数默认值、必填值、替换、截取。
- Bash 数组和关联数组。

## 4. 控制流和函数

- `if`、`case`、`for`、`while`、`until`。
- `[ ]`、`[[ ]]`、`(( ))`。
- 函数定义、返回状态、作用域。
- `break`、`continue`、`return`、`exit`。
- 参数解析和 usage。

## 5. 错误处理

- 退出状态。
- `set -e`、`set -u`、`pipefail`、`ERR trap`。
- `&&`、`||`、管道状态。
- `PIPESTATUS`。
- 预期失败和异常失败的区分。
- 日志和错误上下文。

## 6. IO 和进程

- stdin、stdout、stderr、文件描述符。
- 重定向顺序。
- 管道、tee、here document、process substitution。
- 后台任务、`$!`、`wait`。
- subshell、命令组。
- 信号、trap、清理。
- cron、systemd timer。

## 7. 文本处理和文件批处理

- grep、sed、awk。
- cut、tr、sort、uniq、wc、head、tail。
- find、xargs、`-print0`。
- tar、gzip、rsync。
- jq/yq 与结构化数据。
- locale 对排序和字符处理的影响。

## 8. 工程化

- 脚本模板。
- ShellCheck。
- bash -n、bash -x、PS4。
- bats/shunit2 测试。
- dry-run、幂等、锁。
- README、退出码约定、日志约定。

## 9. 安全

- `eval` 风险。
- 未引用变量和命令注入。
- 删除路径校验。
- secret 泄漏。
- 临时文件安全。
- `curl | sh` 风险。
- 最小权限和 umask。

## 10. 深度机制

- Bash 解析执行顺序。
- `set -e` 例外。
- pipeline subshell 行为。
- `lastpipe`。
- trap 继承和 ERR trap。
- Bash 版本差异。
- GNU/BSD/BusyBox 工具差异。

## 11. 生产排障

- cron 下运行失败。
- 路径含空格导致失败。
- 管道吞掉前序失败。
- while 管道变量丢失。
- rm 误删风险。
- ShellCheck 告警处理。
- 大文件处理性能问题。

## 12. 学习验收

- 能写安全 Bash 脚本模板。
- 能解释展开顺序和引用规则。
- 能处理文件名空格、换行和 `-` 开头。
- 能设计可靠错误处理和日志。
- 能用 find/xargs/awk/sed 处理真实日志。
- 能通过 ShellCheck 和基本测试。

## 13. Bash 机制级清单

- simple command 的组成：assignment、redirection、command name、arguments。
- command 查找顺序：alias、reserved word、function、builtin、hashed command、PATH。
- Bash special builtin 与普通 builtin 的差异。
- assignment command 对函数、内建、special builtin、外部命令的影响。
- redirection-only command 的效果，如 `>file`、`exec >log`。
- `command`、`builtin`、`enable`、`hash` 对命令查找的影响。
- alias 展开时机、非交互脚本 alias 默认关闭、函数替代 alias。

## 14. 展开和分词深度清单

- IFS whitespace 和 non-whitespace 分隔规则。
- 空字段保留和丢弃规则。
- quoted null、unquoted null 的差异。
- glob 选项：nullglob、failglob、dotglob、globstar、extglob、nocaseglob。
- locale 对 `[a-z]`、排序、字符类的影响。
- `GLOBIGNORE` 的副作用。
- `read`、`mapfile`、`readarray`、`read -d ''`。

## 15. IO、进程和并发深度清单

- 文件描述符复制、移动、关闭。
- `exec` 修改当前 Shell FD。
- command group `{ ...; }` 和 subshell `( ... )` 的差异。
- process substitution 和命名管道/`/dev/fd`。
- coproc 双向通信。
- pipeline 每段子进程、`lastpipe` 条件。
- job control、wait、wait -n、并发限制、后台任务失败收集。

## 16. trap 和信号深度清单

- EXIT、ERR、DEBUG、RETURN trap。
- ERR trap 和 `set -e` 例外关系。
- `set -E`、`functrace`、`errtrace`。
- SIGINT、SIGTERM、SIGHUP、SIGPIPE。
- trap 中避免递归和二次失败。
- 清理函数幂等性。
- trap 不能捕获 SIGKILL、SIGSTOP。

## 17. 生产治理深度清单

- 参数优先级：命令行 > 环境变量 > 配置文件 > 默认值。
- getopts 和长选项手写解析。
- 配置文件 source 风险和 key=value 安全解析。
- TOCTOU、临时文件、符号链接攻击。
- root 脚本权限降级、umask、目录权限。
- 脚本版本化、测试矩阵、ShellCheck gate、CI 发布。
- 性能剖析、外部进程数量、一次扫描、多阶段管道替代方案。
