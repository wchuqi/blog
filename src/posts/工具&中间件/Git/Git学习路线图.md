---
title: "Git 学习路线图"
date: 2026-06-20
description: "这份路线图按从基础到协作、从日常使用到内部原理、排障、安全和大型仓库治理的顺序设计。建议每个阶段都配合真实仓库练习，不只记命令。"
tags:
  - "工具&中间件"
  - "Git"
  - "学习路线图"
category: "工具&中间件"
---

# Git 学习路线图

这份路线图按从基础到协作、从日常使用到内部原理、排障、安全和大型仓库治理的顺序设计。建议每个阶段都配合真实仓库练习，不只记命令。

## 学习总原则

Git 学习要先建立四个核心画面：工作区是你正在编辑的文件，暂存区是下一次提交的预备快照，本地仓库保存提交对象和引用，远程仓库是另一份可同步的对象数据库。每条命令都要放回这四个位置里理解。

每个知识点按“它在移动什么、它改了哪个区域、它是否生成新对象、它是否改写历史、它对团队有没有影响”来复述。能讲清这些，再记命令才稳定。

## 阶段 1：理解版本控制和 Git 基础

目标：知道 Git 解决什么问题，能在本地创建仓库并保存版本。

需要掌握：

- Git、GitHub/GitLab/Gitee 的区别
- 工作区、暂存区、本地仓库、远程仓库
- 提交记录、提交哈希、HEAD 的含义
- `.git` 目录的作用

核心命令：

```bash
git init
git status
git add .
git commit -m "message"
git log --oneline --graph
```

练习任务：

- 新建一个练习目录并初始化 Git 仓库
- 创建、修改、删除文件，观察 `git status` 的变化
- 至少提交 5 次，并用 `git log` 查看历史

验收标准：

- 能解释一次 `git add` 和一次 `git commit` 分别做了什么
- 能根据 `git status` 判断当前文件处于什么状态

## 阶段 2：掌握分支开发

目标：能使用分支隔离不同任务，并安全合并代码。

需要掌握：

- 分支的本质是提交指针
- `main` / `master` 与功能分支的关系
- 快进合并和三方合并
- 合并冲突为什么会发生

核心命令：

```bash
git branch
git switch -c feature/login
git switch main
git merge feature/login
git branch -d feature/login
```

练习任务：

- 从主分支创建 2 个功能分支
- 在不同分支修改不同文件并合并
- 在不同分支修改同一行，故意制造一次冲突并解决

验收标准：

- 能说清楚当前所在分支和 HEAD 指向哪里
- 能独立解决简单文本冲突

## 阶段 3：学习远程仓库协作

目标：能把本地仓库同步到远程，并参与基础团队协作。

需要掌握：

- `origin` 的含义
- clone、fetch、pull、push 的区别
- 远程分支和本地分支的追踪关系
- Pull Request / Merge Request 的基本流程

核心命令：

```bash
git clone <repo-url>
git remote -v
git push -u origin main
git fetch origin
git pull --rebase
git push
```

练习任务：

- 创建一个远程仓库并推送本地代码
- 克隆同一个仓库到另一个目录，模拟两个人协作
- 分别在两个目录提交并同步，观察冲突和历史变化

验收标准：

- 能解释 `fetch` 和 `pull` 的区别
- 能处理 push 被拒绝后的常见同步流程

## 阶段 4：回退、撤销和恢复

目标：能在出错时准确恢复，不误删重要历史。

需要掌握：

- 撤销工作区修改
- 从暂存区撤回文件
- 修改最近一次提交
- 用新提交反向撤销历史提交
- `reset`、`revert`、`restore` 的区别

核心命令：

```bash
git restore <file>
git restore --staged <file>
git commit --amend
git revert <commit>
git reset --soft HEAD~1
git reset --mixed HEAD~1
```

练习任务：

- 修改文件后撤销工作区改动
- `git add` 后再从暂存区撤回
- 写错提交信息后用 `commit --amend` 修正
- 对已经推送的提交使用 `git revert`

验收标准：

- 能判断什么时候应该用 `revert`，什么时候可以用 `reset`
- 不在共享分支上随意改写已推送历史

## 阶段 5：变基和整理提交历史

目标：能保持提交历史清晰，理解 rebase 的适用场景和风险。

需要掌握：

- merge 和 rebase 的区别
- rebase 为什么会改写提交历史
- 交互式 rebase 的 squash、reword、drop
- 何时避免对公共分支执行 rebase

核心命令：

```bash
git rebase main
git rebase -i HEAD~3
git push --force-with-lease
```

练习任务：

- 在功能分支上基于主分支执行 rebase
- 使用交互式 rebase 合并多个零散提交
- 修改历史提交信息

验收标准：

- 能画出 merge 和 rebase 后的提交历史差异
- 知道 `--force-with-lease` 比 `--force` 更安全的原因

## 阶段 6：标签、忽略文件和常用配置

目标：能把 Git 用得更顺手，并管理发布节点和仓库规则。

需要掌握：

- `.gitignore` 的写法
- 全局配置和仓库配置
- 轻量标签和附注标签
- 常用别名

核心命令：

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --list
git tag
git tag -a v1.0.0 -m "release v1.0.0"
git push origin v1.0.0
```

练习任务：

- 为练习仓库添加 `.gitignore`
- 配置 2 到 3 个常用 Git alias
- 为一个稳定版本打 tag 并推送

验收标准：

- 能避免把日志、依赖目录、构建产物提交进仓库
- 能使用 tag 标记一个明确的发布版本

## 阶段 7：排障和高级工具

目标：遇到复杂问题时能定位原因并恢复。

需要掌握：

- reflog 恢复误操作
- stash 临时保存现场
- cherry-pick 挑选提交
- bisect 定位引入问题的提交
- blame 追踪代码来源

核心命令：

```bash
git reflog
git stash push -m "work in progress"
git stash list
git stash pop
git cherry-pick <commit>
git bisect start
git blame <file>
```

练习任务：

- 使用 stash 暂存未完成修改，切换分支修复另一个问题
- 删除一个分支后通过 reflog 找回提交
- 用 cherry-pick 把某个提交应用到另一个分支
- 手动构造一个 bug，用 bisect 找到问题提交

验收标准：

- 能通过 `reflog` 找回误删或误 reset 前的提交
- 能在不合并整个分支的情况下迁移单个提交

## 阶段 8：理解 Git 内部模型

目标：理解 Git 为什么这样工作，能从对象、引用和索引角度解释常见现象。

需要掌握：

- blob、tree、commit、tag 四类对象
- `.git` 目录、对象数据库、引用和 reflog
- HEAD、分支、tag、远程跟踪分支
- `HEAD~1`、`HEAD^2`、`A..B`、`A...B`
- `cat-file`、`ls-tree`、`rev-parse`

核心命令：

```bash
git cat-file -p HEAD
git cat-file -p HEAD^{tree}
git ls-tree -r HEAD
git rev-parse HEAD
git show-ref
```

练习任务：

- 找出当前提交指向的 tree
- 找出某个文件对应的 blob
- 用 `rev-parse` 比较 `HEAD`、分支名和 tag
- 用双点和三点比较两个分支

验收标准：

- 能解释为什么 amend 和 rebase 会改变提交哈希
- 能解释分支为什么只是轻量指针

## 阶段 9：文件规则、安全和团队治理

目标：能管理真实项目中的文件规则、安全风险和团队协作约束。

需要掌握：

- `.gitignore`、全局 ignore、`.git/info/exclude`
- `.gitattributes`、换行符、二进制文件
- hooks、提交信息校验、pre-push 检查
- commit / tag 签名
- 敏感信息误提交后的处理
- protected branch、PR/MR、CI 和发布 tag

核心命令：

```bash
git check-ignore -v <file>
git rm --cached <file>
git config core.hooksPath .githooks
git log --show-signature
git tag -s v1.0.0 -m "release v1.0.0"
```

练习任务：

- 为仓库添加 `.gitattributes`
- 配置一个 `commit-msg` hook
- 模拟 `.env` 误提交并用正确流程处理
- 设计一个 PR/MR 模板和分支保护规则

验收标准：

- 能说明 `.gitignore` 为什么不影响已跟踪文件
- 能说出敏感信息误提交后的正确优先级

## 阶段 10：大型仓库、维护和高级能力

目标：能处理大型仓库、特殊仓库结构和仓库维护问题。

需要掌握：

- Git LFS
- submodule 和 subtree
- worktree
- sparse checkout、shallow clone、partial clone
- `gc`、`fsck`、`repack`、`count-objects`
- 镜像仓库和迁移风险

核心命令：

```bash
git lfs track "*.zip"
git submodule update --init --recursive
git worktree add ../project-hotfix main
git sparse-checkout init --cone
git count-objects -vH
git fsck
git gc
```

练习任务：

- 使用 worktree 同时处理 feature 和 hotfix
- 添加一个 submodule 并更新其指针
- 使用 sparse checkout 只检出部分目录
- 查看仓库对象统计并解释输出

验收标准：

- 能判断什么时候使用 LFS、submodule、worktree
- 能说明 `git gc` 与 reflog 恢复之间的关系

## 推荐学习节奏

| 周期 | 学习重点 | 产出 |
| --- | --- | --- |
| 第 1 周 | 基础概念、提交、日志 | 一个至少 10 次提交的本地仓库 |
| 第 2 周 | 分支、合并、冲突 | 一个包含 3 条功能分支的练习仓库 |
| 第 3 周 | 远程协作、PR/MR | 一个能模拟多人协作的远程仓库 |
| 第 4 周 | 撤销、恢复、rebase | 一份常见误操作处理笔记 |
| 第 5 周 | tag、stash、cherry-pick、bisect | 一个完整发布和排障练习 |
| 第 6 周 | 对象模型、引用、历史查询 | 一份 Git 内部模型笔记 |
| 第 7 周 | 文件规则、安全、团队治理 | 一个带 hooks、属性和 PR 模板的练习仓库 |
| 第 8 周 | LFS、submodule、worktree、维护 | 一个大型仓库场景模拟练习 |

## 日常工作建议流程

```bash
git switch main
git pull --rebase
git switch -c feature/task-name

# 开发并多次提交
git status
git add .
git commit -m "Implement task"

# 合并主分支最新变化
git fetch origin
git rebase origin/main

# 推送并创建 PR/MR
git push -u origin feature/task-name
```

## 必备心智模型

- 先看状态，再做操作：多数 Git 误操作都能通过 `git status` 提前发现。
- 提交要小而完整：一次提交最好只表达一个明确改动。
- 共享分支要保守：已经推送给他人使用的历史，不要随意 rebase 或 reset。
- 不确定就先备份：复杂操作前可以创建临时分支保存当前位置。

```bash
git branch backup/before-risky-operation
```

## 最终能力清单

完成路线图后，应具备以下能力：

- 独立完成本地版本管理
- 使用分支开发并解决冲突
- 与远程仓库同步并参与 PR/MR 流程
- 安全撤销错误修改和错误提交
- 整理功能分支提交历史
- 使用 tag 管理发布版本
- 使用 reflog、stash、cherry-pick、bisect 处理常见复杂场景
- 理解 Git 对象模型、引用系统和版本选择器
- 管理 `.gitignore`、`.gitattributes`、hooks、签名和敏感信息风险
- 处理 LFS、submodule、worktree、sparse checkout 等大型仓库场景
- 使用维护和底层命令排查仓库性能与对象问题
