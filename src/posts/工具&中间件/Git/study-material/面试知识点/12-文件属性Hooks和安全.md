---
title: "Git 面试知识点：文件属性、Hooks 和安全"
date: 2026-06-20
description: ".gitignore 只对未跟踪文件生效。已经被 Git 跟踪的文件，即使后来写入 .gitignore，Git 仍会继续跟踪它的变化。"
tags:
  - "工具&中间件"
  - "Git"
  - "面试"
category: "工具&中间件"
---

# Git 面试知识点：文件属性、Hooks 和安全

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../Git学习资料.md)

## 一、忽略规则和文件属性

### 56. `.gitignore` 为什么不能忽略已经提交过的文件？

**参考答案：**

`.gitignore` 只对未跟踪文件生效。已经被 Git 跟踪的文件，即使后来写入 `.gitignore`，Git 仍会继续跟踪它的变化。

停止跟踪但保留本地文件：

```bash
git rm --cached .env
git commit -m "Stop tracking env file"
```

> **重点：** `.gitignore` 控制的是“未跟踪文件是否显示和加入”，不是历史清理工具。

### 57. `.gitignore`、`.git/info/exclude`、全局 ignore 有什么区别？

**参考答案：**

`.gitignore` 是项目规则，会提交给团队；`.git/info/exclude` 是当前仓库本地规则，不提交；全局 ignore 是当前用户规则，适合操作系统或编辑器临时文件。

### 58. `.gitattributes` 有什么作用？

**参考答案：**

`.gitattributes` 用于定义文件属性，例如换行符、二进制识别、diff 方式、merge 策略、Git LFS 规则。

```gitattributes
* text=auto
*.sh text eol=lf
*.png binary
```

> **重点：** 跨平台团队应使用 `.gitattributes` 统一换行符策略。

## 二、Hooks

### 59. Git hooks 是什么？

**参考答案：**

Git hooks 是在特定 Git 操作前后自动执行的脚本，例如 `pre-commit`、`commit-msg`、`pre-push`。常用于格式检查、提交信息校验、测试、敏感信息扫描。

> **易错：** `.git/hooks` 默认不被 Git 跟踪，不能假设团队成员自动拥有同一套 hooks。

### 60. 本地 hook 能否替代 CI？

**参考答案：**

不能。本地 hook 可以被跳过，也可能因为环境不同而不执行。关键质量和安全检查应该放在 CI 或服务端规则中。本地 hook 适合提前反馈，CI 才是团队级门禁。

## 三、签名和安全

### 61. commit signing 有什么作用？

**参考答案：**

commit signing 用于证明提交由某个密钥持有者签署，提升提交身份可信度。它不能保证代码没有 bug，也不能保证代码经过审查。

```bash
git log --show-signature
```

### 62. 敏感信息误提交后应该怎么办？

**参考答案：**

第一步不是删文件，而是立即撤销或轮换泄露的密钥。然后从当前版本移除敏感信息，提交修复。若敏感信息进入历史并且有清理必要，再使用 `git filter-repo` 或 BFG 清理历史，并协调团队重新同步。

处理顺序：

1. 轮换密钥。
2. 删除当前代码中的敏感信息。
3. 加入 `.gitignore` 或配置模板。
4. 判断是否清理历史。
5. 通知团队。

> **重点：** 一旦推送到远程，就应该默认密钥已经泄露。

### 63. 为什么清理 Git 历史有风险？

**参考答案：**

清理历史会改写提交哈希，影响所有基于旧历史开发的人。团队成员需要重新拉取、重置或重新克隆，否则可能把旧历史再次推回远程。

> **易错：** 清理历史不能替代密钥轮换。

