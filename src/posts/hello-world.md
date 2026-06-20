---
title: 你好，世界 —— 这个博客是怎么搭起来的
date: 2026-06-10
description: 第一篇文章。介绍这个纯前端 Markdown 博客的技术选型、功能特性，以及如何写作和部署。
tags:
  - "公告"
  - "前端"
category: 随笔
pinned: true
---

欢迎来到这个博客！这是一篇示例文章，同时也是一份简易的使用说明。

如果想快速测试写作语法，可以看 [[markdown-cheatsheet|Markdown 写作语法速查]]；主题设计相关的思路可以接着读 [[thoughts-on-dark-mode|关于深色模式的一些思考]]。

## 它是怎么搭起来的

这个博客是一个**纯前端**应用，没有后端、没有数据库。所有文章都是 `src/posts/` 目录下的 Markdown 文件，在构建时被静态打包进来。

技术栈很简单：

- **Vite + React + TypeScript** —— 开发与构建
- **react-router-dom** —— 客户端路由
- **react-markdown** —— Markdown 渲染，配合 `remark-gfm`、`rehype-highlight`、`rehype-slug`
- **front-matter** —— 解析文章元数据

## 支持哪些功能

我把常见的博客功能都做了进来：

1. 文章列表与分页
2. 标签（tags）与分类（category）
3. 按年份归档
4. 站内全文搜索（试试按 `Ctrl / Cmd + K`）
5. 深色 / 浅色模式，手动切换
6. 文章目录（TOC）与阅读进度高亮
7. 代码高亮
8. 相关文章推荐
9. RSS 订阅
10. 评论（基于 Giscus，可选开启）
11. 双链与知识图谱（使用 `[[文章 slug]]` 连接笔记）

## 怎么写一篇新文章

在 `src/posts/` 下新建一个 `.md` 文件，文件名就是文章的网址（slug）。开头用 frontmatter 写元数据：

```markdown
---
title: 我的新文章
date: 2026-06-11
description: 一句话摘要
tags:
  - 标签A
  - 标签B
category: 技术
---

正文从这里开始……
```

可用的字段：

| 字段 | 说明 | 必填 |
| --- | --- | --- |
| `title` | 标题 | 是 |
| `date` | 日期 `YYYY-MM-DD` | 是 |
| `description` | 摘要 | 否 |
| `tags` | 标签数组 | 否 |
| `category` | 分类 | 否 |
| `cover` | 封面图地址 | 否 |
| `pinned` | 是否置顶 | 否 |
| `draft` | 草稿（生产构建中隐藏） | 否 |

## 代码也能高亮

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`
}

console.log(greet('world'))
```

## 接下来

打开 `src/config.ts` 改成你自己的站点信息，然后开始写作吧。祝玩得开心。

> 这是一段引用。Markdown 的常见语法都支持：**加粗**、*斜体*、`行内代码`、[链接](https://vite.dev)、列表、表格、引用等等。
