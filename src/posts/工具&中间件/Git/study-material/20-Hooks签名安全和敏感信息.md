---
title: "Git 学习资料：Hooks、签名、安全和敏感信息"
date: 2026-06-20
description: "Git 历史一旦推送并被复制，就很难彻底消除影响。敏感信息、私钥、token、大型二进制、恶意脚本如果进入历史，即使后来删除，旧提交里仍然可能存在。因此安全治理的第一目标是在提交前阻止风险进入仓库。"
tags:
  - "工具&中间件"
  - "Git"
category: "工具&中间件"
---

# Git 学习资料：Hooks、签名、安全和敏感信息

[返回索引](../Git学习资料.md)

## 理论导读：安全治理是在防止坏内容进入历史并证明来源可信

Git 历史一旦推送并被复制，就很难彻底消除影响。敏感信息、私钥、token、大型二进制、恶意脚本如果进入历史，即使后来删除，旧提交里仍然可能存在。因此安全治理的第一目标是在提交前阻止风险进入仓库。

Hooks 是本地或服务端的检查关卡，可以在提交、推送、接收时执行规则；签名用于证明提交或标签来自可信身份；secret scanning 和依赖扫描用于发现已经进入仓库或依赖树的风险。它们共同解决“谁提交的、提交了什么、是否可信、是否泄露”的问题。

安全策略要区分本地约束和服务端强制。本地 hooks 容易被绕过，适合提醒；服务端保护、CI 扫描和分支规则更适合做团队级硬约束。

## 学习目标

完成本章后，你应该能：

- 理解 Git hooks 的触发时机和适用场景。
- 区分本地 hooks 和服务端 hooks。
- 知道 commit / tag 签名的作用。
- 掌握敏感信息误提交后的处理步骤。
- 理解凭据、令牌、`.git` 目录和历史清理的安全风险。

## 一、Git hooks 是什么

Git hooks 是 Git 在特定操作前后自动执行的脚本。它们位于：

```text
.git/hooks/
```

常见 hook：

| Hook | 触发时机 | 常见用途 |
| --- | --- | --- |
| `pre-commit` | 创建提交前 | 格式化、lint、阻止敏感信息 |
| `prepare-commit-msg` | 打开提交信息前 | 自动填充 issue 编号 |
| `commit-msg` | 提交信息生成后 | 校验提交信息规范 |
| `post-commit` | 提交完成后 | 通知、记录 |
| `pre-push` | push 前 | 运行测试 |
| `pre-rebase` | rebase 前 | 阻止危险 rebase |
| `post-checkout` | checkout 后 | 初始化本地环境 |
| `post-merge` | merge 后 | 安装依赖或刷新生成文件 |

> **重点：** `.git/hooks/` 默认不会被 Git 跟踪，因此团队共享 hooks 通常需要额外工具或模板目录。

## 二、pre-commit 示例

`.git/hooks/pre-commit`：

```bash
#!/usr/bin/env bash
set -e

git diff --cached --check
npm test
```

赋予执行权限：

```bash
chmod +x .git/hooks/pre-commit
```

效果：

- 如果暂存内容有空白错误，阻止提交。
- 如果测试失败，阻止提交。

> **易错：** Windows 环境下 hook 脚本解释器、换行符和执行权限可能导致 hook 不执行或执行失败。

## 三、团队共享 hooks

因为 `.git/hooks/` 不会被提交，常见共享方式包括：

- 使用 Husky、lefthook、pre-commit 等工具。
- 使用仓库内目录，例如 `.githooks/`。
- 配置 `core.hooksPath`。

```bash
git config core.hooksPath .githooks
```

目录示例：

```text
.githooks/
  pre-commit
  commit-msg
```

> **重点：** hook 是质量门禁的补充，不应替代 CI。关键检查必须放到服务端或 CI 中。

## 四、提交信息校验

`commit-msg` 示例：

```bash
#!/usr/bin/env bash
message_file="$1"

if ! grep -Eq '^(feat|fix|docs|refactor|test|chore)(\(.+\))?: .+' "$message_file"; then
  echo "Invalid commit message"
  echo "Example: feat(auth): add login timeout"
  exit 1
fi
```

> **易错：** 本地 hook 可以被绕过，例如 `git commit --no-verify`。团队强约束仍应放在 CI 或远程平台规则中。

## 五、GPG / SSH 签名

签名用于证明提交或标签确实由某个密钥持有者创建。

查看签名：

```bash
git log --show-signature
git show --show-signature <commit>
```

启用提交签名：

```bash
git config --global commit.gpgsign true
git config --global user.signingkey <key-id>
```

签名 tag：

```bash
git tag -s v1.0.0 -m "Release v1.0.0"
```

> **重点：** 签名解决的是提交身份可信问题，不保证代码逻辑没有 bug。

## 六、敏感信息误提交怎么办

敏感信息包括：

- 密码
- API token
- 私钥
- `.env`
- 生产配置
- 数据库连接串
- 云服务访问密钥

处理顺序：

1. 立即撤销或轮换泄露的密钥。
2. 从当前代码中删除敏感信息。
3. 提交修复。
4. 判断是否需要清理 Git 历史。
5. 通知团队重新拉取或重置受影响分支。

> **重点：** 一旦敏感信息进入远程仓库，就应该默认它已经泄露。删除文件本身不等于密钥安全。

## 七、从当前版本移除敏感文件

如果只需要停止继续跟踪：

```bash
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Stop tracking env file"
```

如果已经推送到共享分支：

```bash
git push
```

同时必须轮换密钥。

## 八、清理历史

如果必须从历史中移除敏感文件，可用：

- `git filter-repo`
- BFG Repo-Cleaner

示例，删除历史中的 `.env`：

```bash
git filter-repo --path .env --invert-paths
```

清理后通常需要强推：

```bash
git push --force --all
git push --force --tags
```

> **易错：** 历史清理会改写大量提交哈希，对团队影响很大。执行前要备份、通知团队，并明确恢复方案。

> **重点：** 即使清理了历史，也不能假设密钥没泄露。密钥轮换仍是第一优先级。

## 九、凭据存储

查看凭据助手：

```bash
git config --global credential.helper
```

常见方式：

- Windows Credential Manager
- macOS Keychain
- libsecret
- cache
- store

> **易错：** `credential.helper store` 会把凭据明文保存到磁盘，不适合高安全要求环境。

## 十、`.git` 目录安全

不要把 `.git` 目录暴露到 Web 静态服务中。

风险：

- 源码泄露。
- 历史泄露。
- 密钥泄露。
- 内部路径和提交信息泄露。

检查部署产物时要确保：

```text
.git/
.env
id_rsa
*.pem
```

没有被发布。

## 十一、提交前安全检查

常用检查：

```bash
git diff --staged
git diff --cached --check
git status --short
```

搜索敏感模式：

```bash
git grep -n "AKIA"
git grep -n "PRIVATE KEY"
git grep -n "password"
```

也可以使用专门工具：

- gitleaks
- trufflehog
- detect-secrets

## 十二、服务端保护

本地检查可以被绕过，重要规则应放到：

- protected branch
- required review
- required CI
- secret scanning
- pre-receive hook
- push rule

> **重点：** 真正可靠的团队安全策略应在远程平台和 CI 层执行。

## 练习

1. 配置一个 `commit-msg` hook 校验提交信息。
2. 配置 `core.hooksPath` 使用仓库内 `.githooks/`。
3. 创建 `.env`，确认它被 `.gitignore` 忽略。
4. 模拟误提交 `.env`，使用 `git rm --cached` 停止跟踪。
5. 解释为什么还需要轮换密钥。

## 验收

- 能说明 hook 的触发时机。
- 能解释本地 hook 为什么不能替代 CI。
- 能说明提交签名的作用和边界。
- 能给出敏感信息误提交后的正确处理顺序。
- 能说明历史清理为什么危险。
