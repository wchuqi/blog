---
title: "Git 学习资料：完整知识点清单"
date: 2026-06-20
description: "这份清单用于检查 Git 学习资料是否覆盖完整。阅读时不要只看“会不会敲命令”，还要判断自己是否理解命令背后的对象、引用、索引、远程状态和历史风险。"
tags:
  - "工具&中间件"
  - "Git"
  - "知识清单"
category: "工具&中间件"
---

# Git 学习资料：完整知识点清单

[返回索引](../Git学习资料.md)

## 使用方式

这份清单用于检查 Git 学习资料是否覆盖完整。阅读时不要只看“会不会敲命令”，还要判断自己是否理解命令背后的对象、引用、索引、远程状态和历史风险。

> **重点：** Git 的完整知识体系至少包含对象模型、引用系统、索引、工作区、分支、远程、合并、变基、撤销、查询、配置、属性、安全、维护和团队流程。

> **易错：** 只掌握 `add`、`commit`、`push`、`pull` 不能算掌握 Git。真实项目中更关键的是能解释状态、判断风险、恢复误操作、整理历史和协作排障。

## 理论学习检查标准

检查每个 Git 知识点时，至少回答五个问题：

1. 它影响哪里：工作区、暂存区、本地提交、引用、远程引用，还是对象数据库。
2. 它是否生成新对象：例如 commit、merge、rebase、revert 都可能产生新的提交对象。
3. 它是否移动指针：例如 branch、reset、merge、checkout/switch 都会影响引用或 HEAD。
4. 它是否改写历史：例如 amend、rebase、reset 会改变分支指向的提交序列。
5. 它对团队有什么风险：共享分支、强推、冲突解决、敏感信息提交都必须考虑协作后果。

> **验收：** 如果只能说出命令格式，但说不清命令前后对象、引用和工作区怎么变化，这个知识点还没有掌握。

## 一、基础认知

必须掌握：

- Git 是分布式版本控制系统。
- GitHub / GitLab / Gitee 是代码托管平台，不是 Git 本身。
- 仓库、工作区、暂存区、本地仓库、远程仓库的边界。
- 文件状态：未跟踪、已修改、已暂存、已提交、冲突中。
- `.git` 目录保存仓库元数据和历史。
- 提交是快照，不是简单补丁文件。

关联文档：

- [00-总览与心智模型.md](00-总览与心智模型.md)
- [01-Git基础和本地提交.md](01-Git基础和本地提交.md)

## 二、对象模型和内部原理

必须掌握：

- blob、tree、commit、tag 四类核心对象。
- SHA 哈希如何标识对象。
- commit 如何通过父提交形成历史。
- tree 如何表达目录结构。
- tag 对象和轻量 tag 的区别。
- `.git/objects`、packfile、loose object 的基本含义。
- Git 为什么能高效创建分支。

关联文档：

- [15-Git对象模型和内部原理.md](15-Git对象模型和内部原理.md)

## 三、引用系统和版本选择器

必须掌握：

- HEAD、分支、tag、远程跟踪分支都是引用或指针。
- detached HEAD 的含义和风险。
- `HEAD~1`、`HEAD^`、`main..feature`、`main...feature` 的区别。
- `refs/heads/`、`refs/tags/`、`refs/remotes/`。
- upstream / tracking branch 的含义。
- reflog 记录引用移动历史。

关联文档：

- [16-引用规范和版本选择器.md](16-引用规范和版本选择器.md)
- [07-排障和高级工具.md](07-排障和高级工具.md)

## 四、工作区、暂存区和提交组织

必须掌握：

- `git status`、`git diff`、`git diff --staged` 的观察范围。
- `git add`、`git add -p`、`git restore --staged`。
- 暂存区的作用是组织下一次提交。
- 小而完整的提交原则。
- `commit --amend` 的风险。
- 路径选择器 pathspec 的基本用法。

关联文档：

- [01-Git基础和本地提交.md](01-Git基础和本地提交.md)
- [17-文件跟踪忽略属性和换行.md](17-文件跟踪忽略属性和换行.md)

## 五、分支、合并和冲突

必须掌握：

- 分支是提交指针。
- `switch`、`branch`、`merge`、`branch -d`。
- fast-forward merge 和 three-way merge。
- merge commit 的意义。
- 冲突标记和冲突解决流程。
- ours / theirs 在 merge 和 rebase 中的语义差异。
- merge strategy 和 strategy option 的基本概念。
- rerere 可以复用冲突解决结果。

关联文档：

- [02-分支开发合并和冲突.md](02-分支开发合并和冲突.md)

## 六、远程协作

必须掌握：

- remote、origin、upstream 的区别。
- 本地分支、远程跟踪分支、远程服务器分支的区别。
- clone、fetch、pull、push 的区别。
- `push -u` 建立 upstream。
- push 被拒绝的原因和处理。
- fork 工作流中的 `origin` 与 `upstream`。
- PR / MR、代码评审、CI 状态和保护分支。
- SSH / HTTPS 认证方式。

关联文档：

- [03-远程仓库协作.md](03-远程仓库协作.md)
- [19-高级协作工作流和发布模型.md](19-高级协作工作流和发布模型.md)

## 七、撤销、回退和恢复

必须掌握：

- `restore`、`reset`、`revert` 的区别。
- `reset --soft`、`--mixed`、`--hard`。
- 已推送错误提交优先 `revert`。
- `reflog` 找回误操作。
- `clean` 删除未跟踪文件的风险。
- `rm`、`mv` 与文件删除、重命名。
- `checkout` 老命令和 `switch` / `restore` 新命令的职责拆分。

关联文档：

- [04-回退撤销和恢复.md](04-回退撤销和恢复.md)
- [09-常见错误和处理方式.md](09-常见错误和处理方式.md)

## 八、变基和历史整理

必须掌握：

- merge 和 rebase 的历史差异。
- rebase 会改写提交哈希。
- rebase 冲突解决流程。
- `rebase -i` 的 pick、reword、edit、squash、fixup、drop。
- `rebase --onto` 的用途。
- `--autosquash` 与 fixup commit。
- `push --force-with-lease` 的安全边界。

关联文档：

- [05-变基和整理提交历史.md](05-变基和整理提交历史.md)

## 九、查询、比较和搜索

必须掌握：

- `log`、`show`、`diff`、`grep`、`blame`。
- 按作者、日期、文件、提交信息过滤历史。
- 双点和三点范围选择。
- pickaxe：`git log -S`、`git log -G`。
- `bisect` 二分定位问题提交。
- `shortlog` 统计贡献。

关联文档：

- [18-历史查询比较和搜索.md](18-历史查询比较和搜索.md)
- [07-排障和高级工具.md](07-排障和高级工具.md)

## 十、忽略规则、属性和文件处理

必须掌握：

- `.gitignore`、全局 ignore、`.git/info/exclude`。
- 已跟踪文件不会被 `.gitignore` 自动忽略。
- `git rm --cached` 停止跟踪。
- `.gitattributes`、换行符处理、文本/二进制识别。
- `assume-unchanged` 与 `skip-worktree` 的区别和风险。
- 大文件不应直接提交到普通 Git 历史。

关联文档：

- [06-标签忽略文件和常用配置.md](06-标签忽略文件和常用配置.md)
- [17-文件跟踪忽略属性和换行.md](17-文件跟踪忽略属性和换行.md)

## 十一、配置、别名、hooks、签名和安全

必须掌握：

- system / global / local 配置层级。
- 常用 alias。
- hook 的触发时机和本地性质。
- commit signing / tag signing。
- 敏感信息误提交后的处理思路。
- `filter-repo` / BFG 的历史清理场景。
- `.git` 目录、凭据和令牌的安全风险。

关联文档：

- [20-Hooks签名安全和敏感信息.md](20-Hooks签名安全和敏感信息.md)

## 十二、大型仓库和高级能力

必须掌握：

- submodule 的适用场景和复杂性。
- subtree 与 submodule 的差异。
- Git LFS 管理大文件。
- worktree 同仓库多工作区。
- sparse checkout 只检出部分目录。
- shallow clone、partial clone。
- monorepo 中的 Git 使用注意点。

关联文档：

- [21-大型仓库子模块LFS和工作树.md](21-大型仓库子模块LFS和工作树.md)

## 十三、仓库维护和底层命令

必须掌握：

- `gc`、`fsck`、`prune`、`repack`。
- packfile、对象压缩、垃圾回收。
- `cat-file`、`hash-object`、`ls-tree`、`rev-parse`。
- reflog 过期和对象清理的关系。
- 仓库变慢的常见原因。

关联文档：

- [22-仓库维护性能和底层命令.md](22-仓库维护性能和底层命令.md)

## 十四、团队流程和工程实践

必须掌握：

- feature branch workflow。
- Git Flow。
- trunk-based development。
- release / hotfix 分支。
- protected branch。
- PR / MR 规范。
- commit message 规范。
- 代码评审和 CI 失败时的 Git 处理方式。
- 发布 tag 和回滚策略。

关联文档：

- [19-高级协作工作流和发布模型.md](19-高级协作工作流和发布模型.md)

## 十五、面试知识点

必须掌握：

- 能解释概念，不只是背命令。
- 能回答场景题，例如“push 被拒绝怎么办”“误 reset 怎么恢复”“已推送提交怎么撤销”。
- 能说明 risky command 的风险。
- 能比较相近概念，例如 fetch/pull、merge/rebase、reset/revert/restore。

关联文档：

- [13-面试知识点整理.md](13-面试知识点整理.md)

## 最终覆盖检查

学习完成后，至少能回答：

- Git 对象模型是什么？
- 分支为什么轻量？
- HEAD、branch、tag、remote tracking branch 有什么区别？
- `git diff`、`git diff --staged`、`git diff A..B` 分别比较什么？
- 为什么共享分支上优先 revert？
- rebase 为什么会改写历史？
- `.gitignore` 为什么不能忽略已跟踪文件？
- `origin/main` 为什么不是远程实时状态？
- 如何找回误删分支？
- 如何处理敏感信息误提交？
- submodule、LFS、worktree 分别解决什么问题？
- 如何定位哪个提交引入了 bug？
