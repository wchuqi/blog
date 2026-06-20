# 个人博客

一个纯前端、用 Markdown 驱动的个人博客。基于 Vite + React + TypeScript，写完文章直接构建成静态站点，可部署到任意静态托管（GitHub Pages、Vercel、Netlify、Cloudflare Pages 等）。

## 功能

- 📝 **Markdown 写作** —— 文章放在 `src/posts/*.md`（支持子目录组织），用 frontmatter 写元数据，无需数据库
- 🌗 **深色模式** —— 跟随系统，可手动切换并记忆
- 🔍 **站内搜索** —— 标题/标签/摘要/正文全文检索，`Ctrl/Cmd + K` 唤起
- 🏷️ **标签 & 分类** —— 自动聚合，独立列表页
- 🗂️ **归档** —— 按年份时间线
- 📑 **文章目录（TOC）** —— 滚动高亮、平滑跳转
- 🔗 **相关文章** —— 按共享标签推荐
- 🔗 **双链 & 知识图谱** —— Obsidian 风格 `[[wikilinks]]`，D3 力导向图谱可视化文章关联
- 💬 **评论** —— 集成 [Giscus](https://giscus.app)（基于 GitHub Discussions，纯前端）
- 📡 **RSS + Sitemap** —— 构建时自动生成
- 🔐 **加密文章** —— AES-256-GCM 客户端解密，密码保护敏感内容
- 💡 **代码高亮**、阅读时长、字数统计、置顶、草稿、封面图、自定义作者
- 📱 **响应式**，移动端适配
- 👤 **侧边栏个人名片** —— 首页侧边栏展示头像、签名等信息

## 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 本地开发，默认 http://localhost:5173
npm run build    # 构建到 dist/（含 RSS、sitemap）
npm run preview  # 预览构建产物
```

## 写文章

在 `src/posts/` 下新建一个 `.md` 文件，文件名即文章的 URL slug（如 `my-post.md` → `/posts/my-post`）。可以用子目录组织文章（如 `src/posts/tech/hello.md` → `/posts/tech/hello`）。顶部用 frontmatter 写元数据：

```markdown
---
title: 文章标题
date: 2026-06-10
description: 一句话摘要，显示在列表页
tags: [React, 前端]
category: 技术
cover: /images/cover.jpg   # 可选，封面图
pinned: false              # 可选，是否置顶
draft: false               # 可选，草稿不会出现在生产构建
author: 张三               # 可选，缺省使用站点作者
---

正文用标准 Markdown，支持 GFM（表格、任务列表、删除线等）和代码高亮。
```

新增文件后会被 Vite 自动发现，无需改任何配置。

### 双链 & 知识图谱

正文中可以用 Obsidian 风格的双链引用其他文章：

```markdown
参见 [[hello-world]] 或者 [[hello-world|这篇文章]]
```

`/graph` 页面会以力导向图的形式可视化所有文章之间的关联关系。双链在代码块内会被自动忽略。

### 加密文章

1. 在 frontmatter 中添加 `encrypted: true`。
2. 运行 `npm run encrypt -- src/posts/your-post.md`，按提示输入密码（或设置 `BLOG_ENCRYPT_KEY` 环境变量）。
3. 正文会被加密替换，读者访问时需输入密码解密。

加密文章不出现在 RSS、sitemap、列表和搜索中，只能通过直接 URL 访问。

## 自定义

站点信息集中在 `src/config.ts`：

- `title` / `description` / `author` / `url` —— 站点基本信息（`url` 用于 RSS 绝对链接）
- `nav` —— 导航栏链接
- `social` —— 页脚社交链接
- `pageSize` —— 首页每页文章数
- `profile` —— 首页侧边栏个人名片（头像、名字、签名）
- `comments` —— Giscus 评论配置（默认关闭）

主题颜色在 `src/styles.css` 顶部的 CSS 变量里调整（`:root` 为浅色，`[data-theme="dark"]` 为深色）。

## 开启评论（Giscus）

1. 在 GitHub 仓库开启 Discussions。
2. 打开 https://giscus.app ，填入仓库，按向导得到 `repo-id`、`category-id` 等。
3. 把这些值填到 `src/config.ts` 的 `comments` 字段，并将 `enabled` 设为 `true`。

## 部署

构建产物在 `dist/`，是纯静态文件。本项目用 **BrowserRouter**（无 hash 的干净 URL），所以静态托管必须把未匹配的深层路由（如 `/posts/xxx`）回退到 `index.html`，否则直接访问或刷新会 404。下面三个平台的配置**已经内置在仓库里，开箱即用**：

- **Vercel** —— 已有 `vercel.json`（rewrite 全部回退到 `index.html`）。导入仓库后无需额外配置。
- **Netlify** —— 已有 `netlify.toml`（构建命令 + SPA 回退 `200` 重写）。连接仓库即可。
- **GitHub Pages** —— 已有 `.github/workflows/deploy.yml`，推送到 `main` 自动构建部署。只需在仓库 **Settings → Pages → Source** 选 "GitHub Actions"。

SPA 回退已自动处理：

- 构建后 `scripts/gen-rss.mjs` 会把 `index.html` 复制成 `404.html`，GitHub Pages 靠它兜底深层路由。
- 子路径部署（如 `https://用户名.github.io/仓库名/`）由 GitHub Actions 自动设置 `BASE_PATH`，`vite.config.ts` 据此设 `base`，`main.tsx` 用 `import.meta.env.BASE_URL` 同步给 `BrowserRouter` 的 `basename`，全程无需手改。
- **用户主页仓库**（`用户名.github.io`）部署在根路径，把工作流里 `BASE_PATH` 那行删掉或设为 `/` 即可。

**Cloudflare Pages** 等其他平台：构建命令填 `npm run build`、输出目录 `dist`，再加一条 `/* → /index.html`（200）的回退规则即可。

## 目录结构

```
src/
  config.ts          站点配置（标题、导航、社交、评论、个人名片）
  main.tsx           入口
  App.tsx            路由表（PostDetail 懒加载）
  styles.css         全局样式与主题变量
  posts/             ← 你的文章放这里（支持子目录）
  lib/
    posts.ts         文章加载、双链解析、图谱构建
    types.ts         类型定义
    crypto.ts        加密文章解密
    format.ts        格式化工具
  hooks/             useTheme 等
  components/        Navbar、Footer、SearchBox、TOC、PostCard、PasswordGate、HomeSidebar…
  pages/             Home、PostDetail、Archives、Tags、Categories、Graph、About…
scripts/
  gen-rss.mjs        构建时生成 RSS、sitemap、404.html
  encrypt.mjs        文章加解密 CLI
```
