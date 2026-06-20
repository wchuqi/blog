# AGENTS.md

Vite + React + TypeScript 个人博客。Markdown 驱动，无后端，无数据库。

## 命令

```bash
npm install       # 安装依赖
npm run dev       # 开发服务器 localhost:5173（自动打开浏览器）
npm run build     # tsc -b && vite build && node scripts/gen-rss.mjs
npm run preview   # 预览 dist/
npm run lint      # eslint . — 警告：eslint 不在 devDependencies 中，需单独安装才能运行
npm run rss       # 重新生成 rss.xml + sitemap.xml + 404.html 到 dist/
npm run encrypt   # 加密/解密文章（见下文）
```

**没有单独的 typecheck 或 test 脚本**。类型检查仅在 `npm run build`（`tsc -b`）中运行。**没有测试套件**。

## 构建流程

`npm run build` 按顺序执行三个步骤：
1. `tsc -b` — 类型检查（严格模式，`noUnusedLocals`，`noUnusedParameters`）
2. `vite build` — 打包到 `dist/`，含手动分块（react / markdown 独立 chunk，长期缓存）
3. `node scripts/gen-rss.mjs` — 生成 `rss.xml`、`sitemap.xml` 和 `404.html`（GitHub Pages 的 SPA 回退）

如果需要验证类型正确性但不想完整构建，没有快捷方式——必须运行完整构建。

## 项目结构

```
src/
  config.ts          站点全局设置（标题、导航、社交、评论、分页、个人名片）
  main.tsx           入口 — BrowserRouter，basename 来自 Vite 的 base
  App.tsx            路由表（PostDetail 懒加载）
  posts/             Markdown 文章（含子目录，文件名即 URL slug）
  lib/
    posts.ts         通过 import.meta.glob 加载所有 .md（eager，raw strings），提取双链、构建图谱
    types.ts         Post、PostFrontmatter、TocItem、Taxonomy、NoteLink、GraphNode、GraphEdge
    crypto.ts        客户端 AES-256-GCM 解密（加密文章用）
    format.ts        格式化辅助函数
  pages/             路由级组件（Home、PostDetail、Archives、Tags、Categories、Graph、About 等）
  components/        共享 UI（Navbar、Footer、SearchBox、TOC、PostCard、PasswordGate、HomeSidebar 等）
  hooks/             useTheme 等
  styles.css         全局样式 + 明暗主题 CSS 变量
scripts/
  gen-rss.mjs        构建时生成 RSS/sitemap/404（纯 Node，无依赖）
  encrypt.mjs        文章加解密 CLI
```

## 文章

- 文件放在 `src/posts/`（或子目录）。文件名即 URL slug。
- **子目录文章**：`src/posts/tech/hello.md` → `/posts/tech/hello`，目录前缀保证同名文件不冲突。
- Vite 的 `import.meta.glob('../posts/**/*.md', { eager: true })` 自动发现新文件——无需修改配置。
- Frontmatter 字段：`title`（必填）、`date`、`description`、`tags`、`category`、`cover`、`pinned`、`draft`、`encrypted`、`author`。
- `draft: true` 的文章在生产构建中排除，但在开发模式下可见。
- 文章排序：置顶优先，然后按日期降序。

## 双链 & 知识图谱

- 正文中使用 Obsidian 风格双链语法引用其他文章：`[[slug]]` 或 `[[slug|显示文本]]`。
- `src/lib/posts.ts` 解析双链，构建有向图（`GraphNode` + `GraphEdge`）。
- `/graph` 页面使用 D3 force-directed 布局（Canvas 渲染）可视化文章之间的关联关系。
- 双链仅在正文段落中解析，代码块内的 `[[...]]` 会被忽略。
- 未匹配到现有文章的双链仍会显示文本，但不会产生图谱边。

## 加密文章

工作流程：
1. 正常写文章，在 frontmatter 中添加 `encrypted: true`。
2. 运行 `npm run encrypt -- src/posts/your-post.md`（提示输入密码，或使用 `BLOG_ENCRYPT_KEY` 环境变量）。
3. 脚本将正文替换为 `ENC::v1::<salt>::<iv>::<ciphertext>`。

浏览器端解密使用 Web Crypto API（PBKDF2 + AES-256-GCM），实现在 `src/lib/crypto.ts`。密码在每个标签页的 `sessionStorage` 中缓存。

批量加密所有标记的文章：`npm run encrypt -- --all`

加密文章从 RSS、sitemap 和所有列表/搜索视图中排除。只能通过直接访问 `/posts/<slug>` 访问。

**重要**：`scripts/encrypt.mjs` 和 `src/lib/crypto.ts` 必须保持同步（相同的 PBKDF2 迭代次数、相同的加密算法、相同的格式）。

## 部署

这是一个使用 `BrowserRouter`（无 hash URL）的 SPA。托管平台必须将未匹配的路由重写为 `index.html`。已预配置：

- **Vercel**：`vercel.json` 将所有路由重写 → `/index.html`
- **Netlify**：`netlify.toml` 将 `/*` 重定向 → `/index.html`（200）
- **GitHub Pages**：CI 通过 `gen-rss.mjs` 将 `index.html` 复制为 `404.html`。`BASE_PATH` 环境变量在 `.github/workflows/deploy.yml` 中设置，用于项目站点（`username.github.io/repo/`）。对于用户主页仓库，删除或将 `BASE_PATH` 设为 `/`。

`vite.config.ts` 读取 `process.env.BASE_PATH` 设置 Vite 的 `base`。`main.tsx` 将 `import.meta.env.BASE_URL` 传给 `BrowserRouter.basename`。

## TypeScript 严格性

`tsconfig.json` 启用了：`strict`、`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`。任何未使用的变量或参数都会导致构建失败。

## 注意事项

- `npm run lint` 会失败——`eslint` 在脚本中引用但不在 `devDependencies` 中。需单独安装或跳过 lint。
- `scripts/gen-rss.mjs` 使用正则解析 `src/config.ts`（不是导入 TS）。如果重命名配置键，RSS 脚本会静默失败。
- `gen-rss.mjs` 也读取 `encrypted` frontmatter 以从 RSS/sitemap 中排除加密文章。
- `encrypt` CLI 和 `crypto.ts` 必须使用完全相同的加密参数（PBKDF2 迭代次数、密钥长度、IV 长度、格式）。修改其中一个而不修改另一个会导致解密失败。
- 子目录文章会添加前缀 slug：`src/posts/tech/hello.md` → `/posts/tech/hello`。
- `vite.config.ts` 配置了 `manualChunks`：React 全家桶和 Markdown 渲染各自独立 chunk，优化长期缓存。
- PostDetail 页面使用 `React.lazy` + `Suspense` 懒加载（react-markdown + highlight.js 较重）。
- `src/config.ts` 中的 `profile` 字段控制首页侧边栏个人名片的显示。
