---
title: "Git 学习资料：Git对象模型和内部原理"
date: 2026-06-20
description: "Git 的历史不是一串文本补丁，而是一张由 blob、tree、commit、tag 组成的对象图。blob 保存文件内容，tree 保存目录结构，commit 指向一棵 tree 并记录父提交和元数据，tag 给对象提供稳定名字。命令输出…"
tags:
  - "工具&中间件"
  - "Git"
category: "工具&中间件"
---

# Git 学习资料：Git对象模型和内部原理

[返回索引](../Git学习资料.md)

## 理论导读：对象模型是理解所有 Git 命令的底层地图

Git 的历史不是一串文本补丁，而是一张由 blob、tree、commit、tag 组成的对象图。blob 保存文件内容，tree 保存目录结构，commit 指向一棵 tree 并记录父提交和元数据，tag 给对象提供稳定名字。命令输出里的 diff，是 Git 在两个快照之间计算出来的差异，不是 commit 本身保存的一份补丁。

对象哈希像内容指纹。内容变了，哈希就变；父提交变了，commit 哈希也会变。这解释了为什么 amend、rebase、cherry-pick 会生成新提交，为什么分支可以很轻量，为什么 reflog 能找回暂时没有分支指向的提交。

理解对象模型后，Git 不再是一堆命令，而是对对象和引用的操作：创建对象、查找对象、移动引用、压缩对象、清理不可达对象。

## 学习目标

完成本章后，你应该能：

- 解释 Git 为什么说“提交是快照”。
- 说清楚 blob、tree、commit、tag 四类对象。
- 理解分支为什么轻量。
- 知道 `.git/objects`、packfile、引用和对象之间的关系。
- 能用底层命令观察 Git 对象。

## 一、Git 保存的不是文件差异，而是对象图

Git 通常被描述为“快照系统”。一次提交记录的是某一时刻项目目录树的状态，而不是只保存一段 diff。

这并不表示 Git 内部完全不做压缩。Git 在存储和传输时会使用 packfile 做压缩和 delta 优化，但概念模型上，提交指向的是一棵完整目录树。

> **重点：** 学习 Git 时先用“快照 + 对象图”理解历史，再理解 packfile 的压缩优化。

> **易错：** 不要把 commit 理解成“补丁文件”。`git show` 能显示补丁，是 Git 根据两个快照计算出来的差异。

## 二、四类核心对象

### 1. blob

blob 保存文件内容，不保存文件名。

同样内容的文件会对应同一个 blob，即使文件名不同。

```bash
echo "hello" > a.txt
git hash-object a.txt
```

### 2. tree

tree 保存目录结构，包含：

- 文件名
- 文件模式
- blob 对象哈希
- 子目录 tree 对象哈希

查看提交对应的 tree：

```bash
git cat-file -p HEAD^{tree}
```

### 3. commit

commit 保存一次提交的元数据，包括：

- tree 哈希
- 父提交哈希
- 作者
- 提交者
- 时间
- 提交信息

查看 commit 原始内容：

```bash
git cat-file -p HEAD
```

输出类似：

```text
tree 9fceb02...
parent 3d9a4aa...
author Alice <alice@example.com> 1710000000 +0800
committer Alice <alice@example.com> 1710000000 +0800

Add README
```

### 4. tag

tag 分两类：

- 轻量标签：只是一个引用，直接指向提交。
- 附注标签：是一个 tag 对象，包含标签作者、时间、说明，甚至可以签名。

```bash
git tag v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"
git cat-file -p v1.0.0
```

> **重点：** 发布版本建议使用附注标签，因为它包含更多元数据。

## 三、对象之间的关系

一次提交大致是这样：

```text
commit
  |
  v
tree
  |-- README.md -> blob
  |-- src/      -> tree
                  |-- app.js -> blob
```

多次提交通过 parent 串起来：

```text
A <- B <- C <- D
               ^
              main
```

分支只是指向提交的引用：

```text
refs/heads/main -> D
```

> **难点：** Git 历史是对象图，不是简单线性列表。merge commit 会有多个 parent。

## 四、`.git` 目录里有什么

常见结构：

```text
.git/
  HEAD
  config
  index
  objects/
  refs/
    heads/
    tags/
    remotes/
  logs/
```

含义：

| 路径 | 作用 |
| --- | --- |
| `.git/HEAD` | 当前 HEAD 指向 |
| `.git/config` | 当前仓库配置 |
| `.git/index` | 暂存区 |
| `.git/objects` | Git 对象数据库 |
| `.git/refs` | 分支、标签、远程跟踪分支 |
| `.git/logs` | reflog |

查看 HEAD：

```bash
cat .git/HEAD
```

可能输出：

```text
ref: refs/heads/main
```

## 五、松散对象和 packfile

刚创建的对象通常是 loose object，保存在 `.git/objects/xx/yyyy...`。

随着仓库变大，Git 会把对象压缩到 packfile：

```text
.git/objects/pack/
  pack-xxxx.pack
  pack-xxxx.idx
```

触发维护：

```bash
git gc
```

> **重点：** packfile 是存储优化，不改变 Git 的对象模型。

## 六、用底层命令观察对象

计算文件对象哈希：

```bash
git hash-object README.md
```

查看对象类型：

```bash
git cat-file -t HEAD
git cat-file -t HEAD^{tree}
```

查看对象内容：

```bash
git cat-file -p HEAD
git cat-file -p HEAD^{tree}
```

查看 tree：

```bash
git ls-tree HEAD
git ls-tree -r HEAD
```

解析引用：

```bash
git rev-parse HEAD
git rev-parse main
git rev-parse HEAD^{tree}
```

## 七、为什么分支很轻量

创建分支本质是创建一个引用文件或 packed refs 中的一条记录：

```bash
git branch feature/login
```

它不会复制所有文件，也不会复制完整历史。

> **重点：** 分支轻量是因为它只是指向提交对象的引用。

## 八、对象模型对日常操作的帮助

理解对象模型后，很多现象会变清楚：

- `commit --amend` 会生成新 commit，所以哈希变化。
- `rebase` 会复制提交到新基底，所以哈希变化。
- `merge` 会生成有两个 parent 的 commit。
- `tag` 是给某个对象起稳定名字。
- `reflog` 能找回“消失”的提交，因为对象还没被清理。

## 练习

在任意 Git 仓库中执行：

```bash
git rev-parse HEAD
git cat-file -p HEAD
git cat-file -p HEAD^{tree}
git ls-tree -r HEAD
```

回答：

- 当前提交指向哪个 tree？
- 当前提交有几个 parent？
- 某个文件对应的 blob 哈希是什么？
- 分支名最终解析到哪个提交哈希？

## 验收

你能做到以下几点，就说明本章掌握合格：

- 能解释 blob、tree、commit、tag。
- 能说出 `.git/index` 和 `.git/objects` 的作用。
- 能解释为什么 amend 和 rebase 会改变提交哈希。
- 能用 `cat-file` 和 `ls-tree` 观察对象。
