---
title: "Git 学习资料：阶段 1：Git 基础和本地提交"
date: 2026-06-20
description: "Git 基础操作围绕三块区域展开：工作区、暂存区、本地仓库。工作区像你的桌面，文件可以随时改；暂存区像拍照前摆好的画面，决定下一次提交包含哪些内容；本地仓库像相册，保存每一次已经拍好的快照。git status 是查看三块区域差异的仪表盘，…"
tags:
  - "工具&中间件"
  - "Git"
category: "工具&中间件"
---

# Git 学习资料：阶段 1：Git 基础和本地提交

[返回索引](../Git学习资料.md)

## 理论导读：一次本地提交是在制作“下一张快照”

Git 基础操作围绕三块区域展开：工作区、暂存区、本地仓库。工作区像你的桌面，文件可以随时改；暂存区像拍照前摆好的画面，决定下一次提交包含哪些内容；本地仓库像相册，保存每一次已经拍好的快照。`git status` 是查看三块区域差异的仪表盘，`git diff` 是查看具体差异的放大镜。

`git add` 的理论意义不是“添加文件到 Git”，而是把当前文件内容登记到暂存区。一个文件可以先暂存一部分，之后继续修改同一个文件，于是同一文件会同时存在“已暂存版本”和“工作区新修改版本”。`git commit` 则把暂存区当前状态固化成一个 commit 对象，并让当前分支指针前进到这个新提交。

因此，提交前固定检查 `status` 和 `diff` 不是形式流程，而是在确认“下一张快照到底长什么样”。如果没有这个意识，就很容易把临时文件、密钥、日志或半成品代码提交进去。

## 阶段 1：Git 基础和本地提交

### 学习目标

完成本阶段后，你应该能：

- 初始化一个 Git 仓库。
- 判断文件处于什么状态。
- 把修改加入暂存区并提交。
- 查看提交历史和文件差异。

### 初始化仓库

初始化仓库不是创建一个普通目录，而是在当前目录下建立 `.git` 元数据区。这个目录像 Git 的后台数据库，里面保存对象、引用、配置、暂存区和操作日志。工作区里的文件是你能直接编辑的内容，`.git` 目录则记录这些内容如何形成历史。

只要 `.git` 还在，Git 就能知道这个目录的版本历史；如果 `.git` 被删除，文件本身仍然存在，但它们和过去提交之间的关系就断开了。理解这一点，就能明白为什么复制项目时是否包含 `.git` 会产生完全不同的结果。

```bash
mkdir git-demo
cd git-demo
git init
```

初始化后会出现一个隐藏目录 `.git`。这个目录保存 Git 的全部元数据，包括提交对象、分支、配置、暂存区等。

> **重点：** `.git` 是仓库的核心。删除 `.git` 后，普通文件还在，但版本历史会消失。

### 配置用户名和邮箱

用户名和邮箱会写入每个 commit 的作者和提交者信息。它们不是登录凭据，也不决定你是否有远程仓库权限，而是历史记录里的身份标识。团队追踪问题、代码评审、贡献统计和审计时都会依赖这些信息。

配置有层级：系统级、全局用户级、仓库级。仓库级配置会覆盖全局配置，所以公司项目可以使用公司邮箱，个人项目可以使用个人邮箱。提交前检查当前仓库邮箱，是避免身份混乱的基本习惯。

第一次使用 Git 前建议配置身份信息：

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --list
```

只对当前仓库生效：

```bash
git config user.name "Project Name"
git config user.email "project@example.com"
```

> **易错：** 公司项目和个人项目可能需要不同邮箱。提交前可以用 `git config user.email` 检查当前仓库邮箱。

### 创建第一个文件并提交

创建文件只是改变工作区，Git 还不会自动把它放进历史。`git status` 中的 `??` 表示文件未跟踪，Git 只是看见它存在，但还没有把它纳入版本管理。`git add` 后，文件内容进入暂存区，下一次 commit 才会包含它。

暂存区是 Git 初学最容易忽略的层。它让你可以把一堆工作区修改拆成更清晰的提交：某些文件先进本次提交，其他文件留在工作区继续修改。好的提交不是“今天改过的所有东西”，而是“一组能独立解释的修改”。

创建 `README.md`：

```markdown
# Git Demo

这是一个 Git 练习仓库。
```

查看状态：

```bash
git status
git status --short
```

常见短状态：

```text
?? README.md       未跟踪文件
A  README.md       已暂存的新文件
 M README.md       已修改但未暂存
M  README.md       已暂存的修改
MM README.md       已暂存后又继续修改
```

加入暂存区并提交：

```bash
git add README.md
git commit -m "Add project README"
```

> **重点：** `git status --short` 很适合日常快速检查，尤其在提交前确认哪些文件会进入提交。

### 观察工作区差异

差异比较必须先看清比较对象。`git diff` 默认比较工作区和暂存区，回答“我还有哪些改动没放进下一次提交”；`git diff --staged` 比较暂存区和 HEAD，回答“下一次提交相对当前提交会改什么”。这两个问题不同，看到的内容也可能完全不同。

如果一个文件先 `git add`，再继续修改，那么同一个文件会同时存在已暂存版本和未暂存版本。此时只看 `git diff` 会漏掉已经进入暂存区的内容，只看 `git diff --staged` 又会漏掉工作区后续修改。提交前两个都看，才能确认快照完整。

修改 `README.md`：

```markdown
# Git Demo

这是一个 Git 练习仓库。

目标：学习 Git 的基础操作。
```

查看未暂存差异：

```bash
git diff
```

暂存修改：

```bash
git add README.md
```

查看已暂存差异：

```bash
git diff --staged
```

提交：

```bash
git commit -m "Document learning goal"
```

> **易错：** `git diff` 默认只看“工作区 vs 暂存区”的差异。已经 `git add` 的内容要用 `git diff --staged` 查看。

### 提交多个文件

多文件提交要关注“主题一致性”。一次提交可以包含多个文件，但这些文件最好服务于同一个目的，例如“新增计算器模块”可以同时包含代码和测试说明；如果一个提交里同时包含登录改动、格式化、临时日志和配置调整，后续回滚和审查都会变困难。

`git add .` 是范围命令，它会把当前目录及子目录下的改动放进暂存区。它本身不危险，危险的是在没看状态时使用。提交前用短状态检查文件列表，是防止误提交构建产物、密钥、日志和临时文件的最后一道门。

创建一个简单代码文件 `src/calculator.js`：

```javascript
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

module.exports = {
  add,
  subtract,
};
```

创建测试说明 `docs/test-plan.md`：

```markdown
# 测试计划

- add(1, 2) 应返回 3
- subtract(3, 1) 应返回 2
```

提交：

```bash
git add src/calculator.js docs/test-plan.md
git commit -m "Add calculator module"
```

如果要暂存当前目录下全部修改：

```bash
git add .
```

> **易错：** `git add .` 会把当前目录及子目录下的改动都暂存。提交前一定看 `git status --short`，避免把临时文件、日志、密钥文件提交进去。

### 查看提交历史

提交历史是由 commit 对象串成的图，不只是按时间排列的列表。普通线性开发时看起来像一条线；发生分支和合并后，历史会出现分叉和合流。`--graph` 能把这种结构画出来，帮助你理解提交之间的父子关系。

`HEAD` 表示当前检出位置，通常也就是当前分支指向的最新提交。`git show HEAD` 查看的是当前提交详情，`git log -- <file>` 则把历史限制在某个文件相关的提交上。查询历史时先问清“我要看提交列表、提交内容，还是某个文件历史”。

```bash
git log
git log --oneline
git log --oneline --graph --decorate
git log --stat
git show HEAD
```

常用含义：

| 命令 | 作用 |
| --- | --- |
| `git log --oneline` | 一行显示一个提交 |
| `git log --graph` | 用 ASCII 图显示分支结构 |
| `git show HEAD` | 查看当前提交详情 |
| `git show <commit>` | 查看指定提交 |
| `git log -- <file>` | 查看某文件相关历史 |

### 一个推荐的首次练习

```bash
mkdir git-basic-practice
cd git-basic-practice
git init

# 创建 README
git status
git add README.md
git commit -m "Add README"

# 创建代码文件
git status --short
git diff
git add src/calculator.js
git diff --staged
git commit -m "Add calculator"

# 修改代码文件
git status --short
git add .
git commit -m "Update calculator"

git log --oneline --graph
```

### 阶段 1 要点

> **重点：** 提交前的固定顺序是 `git status` -> `git diff` / `git diff --staged` -> `git add` -> `git commit`。

> **难点：** 暂存区不是可有可无的中间层，它允许你把一批修改拆成多个清晰的提交。

> **易错：** 提交信息不要写成 `update`、`fix`、`change`。更好的写法是描述本次提交做了什么，例如 `Add calculator module`。


