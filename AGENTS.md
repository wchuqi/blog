# AGENTS.md

Vite + React + TypeScript 个人博客。Markdown 驱动，静态部署为主，附带一个仅本地运行的 FastAPI + SQLite 后端用于写作和间隔重复复习。

## 命令

```bash
npm install         # 安装依赖
npm run dev         # 开发服务器 localhost:5173（仅前端，不含 API server）
npm run build       # tsc -b && vite build && node scripts/gen-rss.mjs
npm run preview     # 预览 dist/
npm run lint        # eslint . — 警告：eslint 不在 devDependencies 中，需单独安装才能运行
npm run rss         # 重新生成 rss.xml + sitemap.xml + 404.html 到 dist/
npm run encrypt     # 加密/解密文章（见下文）
npm run sync-reviews # 运行 scripts/sync-reviews.py，刷 frontmatter 快照 + 重新生成 public/review.json
npm run api         # 启动 FastAPI 后端 localhost:3001（写作 / 复习评分，见下文）
```

**没有单独的 typecheck 或 test 脚本**。类型检查仅在 `npm run build`（`tsc -b`）中运行。**没有测试套件**。

### 本地完整开发环境（Windows）

仓库根目录的 `dev.bat` 是一键启动脚本，封装了完整本地开发环境：

- `dev.bat` —— 清理残留进程（占用 3001 / 5173 端口的）→ 运行 `sync-reviews.py` 生成快照 → 启动 FastAPI（3001）→ 启动 Vite（5173）。隐藏窗口运行，日志写入 `dev.log`；`scripts/dev-monitor.ps1` 轮询 5173，就绪后自动打开浏览器。
- `dev.bat sync` —— 复习完后同步数据：运行 `sync-reviews.py` + `git add src/posts public/review.json` + 提交 "chore: sync review data"。

`dev.bat` 不是 npm 脚本，仅在 Windows 上使用。跨平台时手动分别跑 `npm run api` 和 `npm run dev`。

## 构建流程

`npm run build` 按顺序执行三个步骤：
1. `tsc -b` — 类型检查（严格模式，`noUnusedLocals`，`noUnusedParameters`）
2. `vite build` — 打包到 `dist/`，含手动分块（react / markdown 独立 chunk，长期缓存）
3. `node scripts/gen-rss.mjs` — 生成 `rss.xml`、`sitemap.xml` 和 `404.html`（GitHub Pages 的 SPA 回退）

**构建产物是纯静态站点**：FastAPI 后端、SQLite、`review.db` 都不进生产构建，只有 Vite 代理在 dev 时把它们接到前端。如果需要验证类型正确性但不想完整构建，没有快捷方式——必须运行完整构建。

## 项目结构

```
src/
  config.ts          站点全局设置（标题、导航、社交、评论、分页、个人名片）
  main.tsx           入口 — BrowserRouter，basename 来自 Vite 的 base
  App.tsx            路由表（所有路由包在 components/Layout.tsx 里；PostDetail 懒加载）
  posts/             Markdown 文章（中文多级目录分类，文件全路径即 URL slug）
  lib/
    posts.ts         文章加载（元数据来自 virtual:posts-index，正文来自 ?raw glob 懒加载）、双链解析、复习判定
    types.ts         Post、PostFrontmatter、ReviewSnapshot、ReviewCard、IndexEntry、GraphNode、GraphEdge 等
    crypto.ts        客户端 AES-256-GCM 解密（加密文章用）
    format.ts        格式化辅助函数
  pages/             Home、Articles、PostDetail、Archives、Tags、TagDetail、Graph、Review、NotFound（另有 Admin、About 存在但未挂载路由）
  components/        Layout、Navbar、Footer、SearchBox、TableOfContents、CodeBlock、Pagination、PostCard、PasswordGate、HomeSidebar、Comments、ReviewPanel / ReviewProgressCard / ReviewToggle、DeletePostButton
  hooks/             useTheme
  styles.css         全局样式 + 明暗主题 CSS 变量
scripts/
  gen-rss.mjs        构建时生成 RSS/sitemap/404（纯 Node，无依赖）
  encrypt.mjs        文章加解密 CLI
  api-server.py      FastAPI 后端（仅本地 dev）：文章 CRUD + 复习评分（localhost:3001）
  db.py              SQLite 访问层（cards / reviews 两张表，review.db 在仓库根，gitignore）
  sync-reviews.py    从 review.db 刷写 frontmatter review 快照 + 生成 public/review.json
  dev-monitor.ps1    dev.bat 的就绪监视器（轮询 5173，就绪后开浏览器）
  check-col1.cjs     一次性 Playwright 排障脚本（手动跑，非构建链路）
public/
  review.json        公网只读的复习数据快照（构建时静态引入，随仓库提交）
```

## 文章加载机制

文章加载分两层（区别于旧的 eager raw glob）：

- **元数据**：`vite.config.ts` 中的 `postsIndexPlugin()` 在构建/dev 启动时扫描 `src/posts`，用 `front-matter` 解析 frontmatter，计算字数 / 阅读时长 / 双链，产出 `virtual:posts-index`（进主包）和 `virtual:posts-search-index`（搜索用，独立 chunk，按需 import）。`src/lib/posts.ts` 通过 `import indexData from 'virtual:posts-index'` 读取。
- **正文**：`import.meta.glob('../posts/**/*.md', { query: '?raw', import: 'default' })` 是**非 eager** 的，每篇文章单独成块，只在打开文章时 `getPostContent(slug)` 按需加载，加载后去掉 frontmatter 返回正文。有 `contentCache` 和 HMR 守卫，避免通过 API 编辑 `.md` 后整页刷新。

dev 模式下插件监听 `src/posts` 的 `add`/`unlink` 事件自动重建索引；Windows 上重命名/移动可能漏事件，前端有两个手动兜底入口（见"Dev 专用端点"）。

## 文章

- 文件放在 `src/posts/`（或子目录）。文件名即 URL slug。
- **文档名称必须使用中文**（如 `单词王体系总览.md`），可用短横线 `-` 分隔主副标题；禁止使用英文 slug 或 `#`、空格等特殊字符。双链引用时同样使用中文文件名（去掉 `.md` 后缀）。
- **子目录文章**：目录可任意多级嵌套（实际以中文分类目录为主，如 `src/posts/架构/分布式系统/study-material/01-xxx.md` → `/posts/架构/分布式系统/study-material/01-xxx`），目录前缀拼进 slug 保证同名文件不冲突。
- Vite 插件自动发现新文件——无需修改配置。
- Frontmatter 字段：`title`（必填）、`date`、`description`、`tags`、`cover`、`pinned`、`draft`、`encrypted`、`author`、`noReview`、`type`（`card` = 问答卡片）、`review`。
- `draft: true` 的文章在生产构建中排除，但在开发模式下可见。
- 文章排序：置顶优先，然后按日期降序。

## 双链 & 知识图谱

- 正文中使用 Obsidian 风格双链语法引用其他文章：`[[slug]]` 或 `[[slug|显示文本]]`。
- `vite.config.ts` 的 `extractNoteLinks` 在构建时解析双链（跳过代码块和行内代码），结果随元数据索引暴露。
- `/graph` 页面使用 D3 force-directed 布局（Canvas 渲染）可视化文章之间的关联关系。
- 未匹配到现有文章的双链仍会显示文本，但不会产生图谱边。

## 间隔重复复习系统

本地 SM-2 算法（`scripts/db.py` 实现），公网只读展示。评分：`5 = 记得`、`4 = 模糊`、`0 = 忘了`；`grade >= 3` 算成功，否则 `reps` 归零、`interval=1`、`ease -0.2`。`ease` 初始 2.5，范围 1.3–3.0。间隔：第 1 次 → 1 天，第 2 次 → 6 天，之后 `round(上次 interval × ease)`。

### 问答卡片（type: card）

除文章外，复习系统支持 Anki 式问答卡片——也是 `.md` 文件，但粒度更小（一文件一卡）：

- frontmatter 标 `type: card`，正文约定两个一级标题段：`# 问题` / `# 答案`（解析器在 `src/lib/cards.ts`，标题名匹配不到时按出现顺序兜底：第一段=问题、第二段=答案）。
- 卡片**不进**首页/归档/标签/搜索/图谱/RSS/sitemap（`allPosts` 已排除；搜索索引在 vite 插件里跳过），只通过 `/cards` 复习会话和直链 `/posts/<slug>` 访问。
- SM-2 状态与文章共用同一套机制：`review.db` 按 slug 记卡、sync 刷 frontmatter `review:` 快照、`public/review.json` 条目带 `type` 字段（`article`/`card`）。
- `/cards`（`src/pages/Cards.tsx`，懒加载）：翻转式复习会话（看问题 → 显示答案 → 打分），队列来自 `getDueCards()`（frontmatter 快照静态计算，无快照的新卡视为到期），打分走 `POST /api/cards/{slug}/review`（仅 dev），会话结束可点「同步复习数据」。键盘：空格翻面，1/2/3 打分。
- 卡片**分组与标签**：分组 = 文件所在子目录（slug 目录前缀，如 `卡片/记忆方法/xxx.md` → 分组「卡片/记忆方法」，根目录 = 未分组，`cardGroupOf()`）；标签 = frontmatter `tags`（与文章同字段，但独立统计，不进文章 `/tags` 页）。`/cards` 页有「复习 / 卡片库」两个视图，均可按分组/标签筛选（`getCardGroups()` / `getCardTags()`），卡片库按分组浏览、按到期排序。
- `/review` 看板把 `review.json` 里 `type === 'card'` 的条目拆进「记忆卡片」面板，不混入文章分组。
- 新建卡片文件：手动写（照 `src/posts/卡片/什么是间隔重复.md` 模板抄），或 dev 时 `POST /api/posts` 带 `"type": "card"` 生成模板。
- 已知限制：`api-server.py` 的 `/api/cards/*` 已改为 `{slug:path}` 支持子目录 slug，但一天内打过分的卡片不会自动重新到期（同日重复打分是允许的，行为与文章 ReviewPanel 一致）。

### 数据流

```
本地 SQLite (review.db)  ──sync-reviews.py──►  每篇文章 frontmatter 的 review: 快照
                   │                          ＋
                   └────────────────────────►  public/review.json（公网只读）
```

- `review.db`（仓库根）是本机真相源，**gitignore**，不入仓库。
- `scripts/sync-reviews.py` 读 `review.db`，把 SM-2 状态（`created`/`lastReview`/`reps`/`interval`/`ease`）写回每篇文章 frontmatter 的 `review:` 块，同时聚合生成 `public/review.json`（含 `stats`/`cards`/`heatmap`/`excluded`）。跳过 `encrypted`/`draft`/`noReview` 的文章。
- `public/review.json` **随仓库提交**，是公网唯一可见的复习数据；生产构建不跑 sync，公网数据只在���地 sync 后随提交更新。
- 判定文章是否在复习池：`isInReviewPool(post) = !encrypted && !draft && !noReview`（`src/lib/posts.ts`）。

### 前端入口

- `/review` 页（`src/pages/Review.tsx`）：统计条 + 热力图（近 182 天）+ ease 趋势 + 分组列表（已逾期/今日/即将到期/尚未到期/不在复习里）+「记忆卡片」概览面板（链接到 /cards）。数据来自 `public/review.json`，带时间戳防缓存。
- `/cards` 页：问答卡片复习会话（见上文「问答卡片」）。
- `PostDetail`（`/posts/*`）：
  - `ReviewProgressCard`（静态，所有在复习池的非加密文章）—— 读 `post.review` 快照，展示保留率 / 下次复习。
  - `ReviewPanel`（**仅 dev**）—— `忘了/模糊/记得` 按钮，`POST /api/cards/{slug}/review` 写入 SQLite。
  - `ReviewToggle`（**仅 dev**）—— `PUT /api/posts/{slug}/frontmatter` 切 `noReview`，然后触发 `POST /api/sync-review` 重生成快照。
  - `DeletePostButton`（**仅 dev**）—— 删文章。
- 所有写操作都受 `import.meta.env.DEV` 门控；生产构建里这些 UI 不渲染，公网纯只读。

### 触发 sync 的途径

- 手动 `npm run sync-reviews`
- API 端点 `POST /api/sync-review`（内部 subprocess 调 `sync-reviews.py`）
- Vite dev 中间件 `/__sync-reviews`（导航栏"更新复习"按钮调用）
- `dev.bat` 启动时跑一次；`dev.bat sync` 跑一次并提交

**重要**：`review.db` 不进仓库，`public/review.json` 进仓库。换机器或重置环境后，本地 `review.db` 与已提交的 `public/review.json` 可能不一致——以本地 `review.db` 为准，sync 后覆盖 `public/review.json`。

## 本地 API 后端（仅 dev）

`scripts/api-server.py` 是 FastAPI 应用，监听 `127.0.0.1:3001`，**无鉴权**（CORS `*`，无 token/密码）；唯一的"门"是前端 `import.meta.env.DEV`，生产构建不打包 server 代码，Vite proxy 也自动失效。Vite dev 把 `/api` 代理到它。

主要端点：

- 复习：`GET /api/stats`、`GET /api/today`、`GET /api/cards`、`GET /api/cards/{slug:path}`、`POST /api/cards/{slug:path}/review`（`{slug:path}` 支持子目录卡片/文章 slug）
- 文章：`GET /api/posts`、`GET /api/posts/{slug:path}`、`POST /api/posts`（新建；请求体带 `"type": "card"` 时生成问答卡片模板）、`PUT /api/posts/{slug:path}/content`（替换正文）、`PUT /api/posts/{slug:path}/frontmatter`（改 title/description/tags/noReview；设 `noReview:true` 会同时删 card/复习记录并剥离 `review:` 块）、`DELETE /api/posts/{slug:path}`
- `POST /api/sync-review`：subprocess 跑 `sync-reviews.py`

前端当前实际用到的写操作：新建文章（`POST /api/posts`，来自 `Admin.tsx`）、删除文章（`DeletePostButton`）、切 `noReview`（`ReviewToggle`）、改 tags（`PostDetail` 的 `removeTag`）、复习评分（`ReviewPanel`）。`PUT .../content` 端点存在但**前端暂未接入**（无内联正文编辑器；`vditor` 在 devDependencies 中但 `src/` 没有引用）。

### Dev 专用端点（Vite 中间件，非 Python）

- `POST /__refresh-posts-index` —— 重扫 `src/posts`、失效虚拟模块、整页刷新。导航栏"更新双链"按钮、`DeletePostButton` 和 `PostDetail` 的标签删除都会调用。
- `POST /__sync-reviews` —— 跑 `sync-reviews.py`、失效索引、广播 `reviews-synced` WebSocket 事件让 `/review` 页原地刷新。导航栏"更新复习"按钮调用。

## 加密文章

工作流程：
1. 正常写文章，在 frontmatter 中添加 `encrypted: true`。
2. 运行 `npm run encrypt -- src/posts/your-post.md`（提示输入密码，或使用 `BLOG_ENCRYPT_KEY` 环境变量）。
3. 脚本将正文替换为 `ENC::v1::<salt>::<iv>::<ciphertext>`。

浏览器端解密使用 Web Crypto API（PBKDF2 + AES-256-GCM），实现在 `src/lib/crypto.ts`。密码在每个标签页的 `sessionStorage` 中缓存。

批量加密所有标记的文章：`npm run encrypt -- --all`

加密文章从 RSS、sitemap、搜索索引和所有列表视图中排除，也不进入复习池。只能通过直接访问 `/posts/<slug>` 访问。`PasswordGate.tsx` 是加密文章的解密门，与管理/写作鉴权无关。

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
- 子目录文章会添加前缀 slug：`src/posts/架构/分布式系统/study-material/01-xxx.md` → `/posts/架构/分布式系统/study-material/01-xxx`。
- `vite.config.ts` 配置了 `manualChunks`：React 全家桶和 Markdown 渲染各自独立 chunk，优化长期缓存。
- PostDetail 页面使用 `React.lazy` + `Suspense` 懒加载（react-markdown + highlight.js 较重）。
- `src/config.ts` 中的 `profile` 字段控制首页侧边栏个人名片的显示；`comments` 字段（Giscus，默认 `enabled: false`）控制文章评论。
- FastAPI 后端**无鉴权**，监听 `127.0.0.1`，只在本机可用；不要改成 `0.0.0.0` 暴露到公网。
- `review.db` 是 gitignore 的本地文件，`public/review.json` 是提交的公网快照；两者语义不同，别混用。
- `src/pages/Admin.tsx` 和 `src/pages/About.tsx` 目前**均未被路由表挂载**（App.tsx 没有 `/admin`、`/about` 路由），属于未接入的残留页面；新建文章能力实际通过 Admin 页的 `POST /api/posts`，但页面本身需要手动接线才能用。
- `scripts/check-col1.cjs` 是针对旧内联 Vditor 编辑器的一次性排障脚本，当前前端已无内联编辑入口，属遗留文件。
