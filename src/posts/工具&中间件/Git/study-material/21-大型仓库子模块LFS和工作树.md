---
title: "Git 学习资料：大型仓库、子模块、LFS 和工作树"
date: 2026-06-20
description: "仓库变大后，Git 的成本会从“命令会不会用”变成“对象太多、历史太深、文件太大、检出太慢、依赖边界太复杂”。大型仓库需要关注克隆体积、对象压缩、稀疏检出、部分克隆、LFS、子模块、worktree 等工具。"
tags:
  - "工具&中间件"
  - "Git"
category: "工具&中间件"
---

# Git 学习资料：大型仓库、子模块、LFS 和工作树

[返回索引](../Git学习资料.md)

## 理论导读：大型仓库问题来自对象规模、依赖边界和检出成本

仓库变大后，Git 的成本会从“命令会不会用”变成“对象太多、历史太深、文件太大、检出太慢、依赖边界太复杂”。大型仓库需要关注克隆体积、对象压缩、稀疏检出、部分克隆、LFS、子模块、worktree 等工具。

子模块把另一个仓库固定到当前仓库的某个提交，适合表达独立仓库依赖，但会带来初始化、更新和协作成本；LFS 把大文件内容移出普通 Git 对象库，只在 Git 中保存指针，适合图片、模型、压缩包等大文件；worktree 则允许一个仓库同时检出多个分支，减少重复 clone。

这些工具都不是默认越多越好。它们解决规模问题，也引入操作复杂度。选择前要先判断问题是大文件、历史太大、目录太多、还是多分支并行开发。

## 学习目标

完成本章后，你应该能：

- 解释 submodule、subtree、Git LFS、worktree、sparse checkout 的用途。
- 判断什么时候不应该把大文件直接放入 Git。
- 理解 shallow clone、partial clone 的取舍。
- 掌握大型仓库常见性能优化手段。

## 一、为什么大型仓库会变慢

常见原因：

- 历史中有大二进制文件。
- 文件数量极多。
- 分支和 tag 极多。
- `node_modules`、构建产物、日志等误提交。
- 单仓库管理多个大型项目。
- 频繁修改大文件导致 packfile 膨胀。

> **重点：** Git 擅长管理文本源代码，不擅长管理频繁变化的大二进制文件。

## 二、Git LFS

Git LFS 用指针文件替代仓库中的大文件内容，大文件本体存储在 LFS 服务中。

安装后跟踪文件：

```bash
git lfs install
git lfs track "*.psd"
git lfs track "*.zip"
git add .gitattributes
git add design.psd
git commit -m "Track design files with LFS"
```

查看 LFS 文件：

```bash
git lfs ls-files
```

拉取 LFS 内容：

```bash
git lfs pull
```

> **易错：** 已经提交到普通 Git 历史的大文件，不会因为后来启用 LFS 自动迁移，需要单独迁移历史。

## 三、submodule

submodule 用来在一个仓库中引用另一个仓库的某个提交。

添加：

```bash
git submodule add <repo-url> libs/common
git commit -m "Add common submodule"
```

克隆包含 submodule 的仓库：

```bash
git clone --recurse-submodules <repo-url>
```

初始化和更新：

```bash
git submodule update --init --recursive
```

更新 submodule 指向：

```bash
cd libs/common
git fetch
git checkout <new-commit>
cd ../..
git add libs/common
git commit -m "Update common submodule"
```

> **难点：** 主仓库记录的是 submodule 的提交指针，不是 submodule 的完整文件历史。

> **易错：** 修改 submodule 后，需要在 submodule 仓库提交并推送，再回到主仓库提交新的 submodule 指针。

## 四、subtree

subtree 把另一个仓库内容合入当前仓库目录，不需要用户额外初始化 submodule。

常见命令：

```bash
git subtree add --prefix=libs/common <repo-url> main --squash
git subtree pull --prefix=libs/common <repo-url> main --squash
git subtree push --prefix=libs/common <repo-url> main
```

对比：

| 方案 | 优点 | 缺点 |
| --- | --- | --- |
| submodule | 依赖边界清晰 | 使用复杂，容易忘记更新 |
| subtree | 克隆后直接可用 | 历史和同步操作更重 |

## 五、worktree

worktree 允许同一个仓库同时检出多个工作区。

场景：

- 当前分支开发未完成，同时要切 hotfix。
- 同时比较两个分支。
- 避免频繁 stash。

创建：

```bash
git worktree add ../project-hotfix main
git worktree add -b hotfix/login ../project-hotfix main
```

查看：

```bash
git worktree list
```

删除：

```bash
git worktree remove ../project-hotfix
git worktree prune
```

> **重点：** worktree 比复制整个仓库更省空间，也比频繁切分支更安全。

## 六、sparse checkout

sparse checkout 只检出仓库中的部分目录。

启用：

```bash
git sparse-checkout init --cone
git sparse-checkout set apps/web packages/ui
```

查看规则：

```bash
git sparse-checkout list
```

取消：

```bash
git sparse-checkout disable
```

适合：

- monorepo。
- 只需要部分目录工作。
- 减少工作区文件数量。

## 七、shallow clone

只克隆最近历史：

```bash
git clone --depth 1 <repo-url>
```

拉深历史：

```bash
git fetch --deepen 50
git fetch --unshallow
```

适合：

- CI 只构建最新版本。
- 不需要完整历史的临时环境。

> **易错：** shallow clone 中某些历史命令不可用，例如深层 `git log`、`bisect` 或基于旧 tag 的操作。

## 八、partial clone

partial clone 可以延迟下载部分对象：

```bash
git clone --filter=blob:none <repo-url>
```

适合大型仓库减少初始下载体积。

> **难点：** partial clone 需要服务端支持。后续访问文件内容时可能再按需下载对象。

## 九、monorepo 中的 Git 注意点

建议：

- 使用 sparse checkout。
- 避免提交构建产物。
- 使用路径级 CI。
- 保持目录边界清晰。
- 规范大文件存储。
- 控制 tag 和分支数量。
- 定期维护仓库。

## 十、大文件误提交处理

如果大文件刚提交且未推送：

```bash
git reset --mixed HEAD~1
git rm --cached large-file.zip
echo "*.zip" >> .gitignore
git add .gitignore
git commit -m "Ignore zip artifacts"
```

如果已经进入历史并推送，需要考虑：

- `git filter-repo`
- BFG
- Git LFS migrate

```bash
git lfs migrate import --include="*.zip"
```

> **易错：** 删除当前版本的大文件不能减少历史体积，因为旧提交仍然包含它。

## 练习

1. 用 worktree 创建一个 hotfix 工作区。
2. 在测试仓库添加一个 submodule。
3. 配置 sparse checkout 只检出一个目录。
4. 创建 shallow clone，观察 `git log` 历史深度。
5. 解释 LFS 指针文件和真实大文件的关系。

## 验收

- 能判断 submodule 和 subtree 的适用场景。
- 能解释 LFS 为什么适合大文件。
- 能使用 worktree 并清理 worktree。
- 能说明 shallow clone 的限制。
- 能说明 sparse checkout 对 monorepo 的价值。
