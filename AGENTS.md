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
    posts.ts         文章加载（元数据来自 virtual:posts-index，正文来自 ?raw glob 懒加载）、链接解析、复习判定
    search.ts        搜索纯逻辑（索引构建/AND 检索/打分/摘要/高亮区间），无 React 依赖
    topics.ts        主题（MOC）识别：从目录结构 + `X学习资料.md` 入口页派生知识地图
    link-path.ts     站内链接路径规则（归一/URL 解码/相对路径展开），构建期与运行时共用
    api.ts           本地 API 的 URL 构造（`apiUrl()` / `encodeSlug()`，统一做 slug 编码）
    types.ts         Post、PostFrontmatter、ReviewSnapshot、ReviewCard、IndexEntry、GraphNode、GraphEdge 等
    crypto.ts        客户端 AES-256-GCM 解密（加密文章用）
    format.ts        格式化辅助函数
  pages/             Home、Topics、TopicDetail、Search、Articles、PostDetail、Archives、Tags、TagDetail、Graph、Review、Cards、NotFound（另有 Admin、About 存在但未挂载路由）
  components/        Layout、Navbar、Footer、SearchBox、TableOfContents、CodeBlock、Pagination、PostCard、PasswordGate、HomeSidebar、Comments、ReviewPanel / ReviewProgressCard / ReviewToggle、DeletePostButton
  hooks/             useTheme
  styles.css         全局样式 + 明暗主题 CSS 变量
scripts/
  gen-rss.mjs        构建时生成 RSS/sitemap/404（纯 Node，无依赖）
  fix-space-links.py 一次性批量修复：把含空格的裸 Markdown 链接目标包上尖括号（幂等，默认 dry-run）
  check-links.py     体检：列出所有指向不存在文章的站内链接
  encrypt.mjs        文章加解密 CLI
  api-server.py      FastAPI 后端（仅本地 dev）：文章 CRUD + 复习评分（localhost:3001）
  db.py              SQLite 访问层（cards / reviews 两张表，review.db 在仓库根，gitignore）
  sync-reviews.py    从 review.db 刷写 frontmatter review 快照 + 生成 public/review.json
  gen-word-cards.py  一次性导入：把 10000 单词源文件切成 1 词 1 卡，写到
                     src/posts/卡片/单词/<word>.md（平铺、无前缀。分组 = 文件所在子目录，
                     按区间分子目录只会把分组拆成 10 个无意义的桶）
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
  - **已知例外**：`src/posts/卡片/单词/` 下 10000 张生成的单词卡直接拿单词作文件名（`abandon.md`），不遵守本条。它们是机器生成的批量数据，加 `单词卡-` 前缀只会让 10000 个文件同前缀、目录里完全排不了序。
- **子目录文章**：目录可任意多级嵌套（实际以中文分类目录为主，如 `src/posts/架构/分布式系统/study-material/01-xxx.md` → `/posts/架构/分布式系统/study-material/01-xxx`），目录前缀拼进 slug 保证同名文件不冲突。
- Vite 插件自动发现新文件——无需修改配置。
- Frontmatter 字段：`title`（必填）、`date`、`description`、`tags`、`cover`、`pinned`、`draft`、`encrypted`、`author`、`noReview`、`type`（`card` = 问答卡片）、`review`。
- `draft: true` 的文章在生产构建中排除，但在开发模式下可见。
- 文章排序：置顶优先，然后按日期降序。

### 文档粒度与标题结构

写学习/参考类文档时：

- **不要为了拆分而拆分**。一篇能讲完的主题就写一篇（如 `src/posts/AI/工具/Pi-Agent.md`）。拆成十几份 `study-material/NN-xxx.md` 只在主题确实大到单文件难以维护时才值得，而早期批量拆出的目录（如 `AI/工具/Claude Code/`）多半是过度拆分。
- **标题按内容自然走**，不要套固定骨架。不要每篇都重复「学习目标 / 理论导读 / 核心心智模型 / 知识点详解 / 例子 / 练习 / 验收 / 重点 / 难点 / 易错」——同一套骨架重复十几次会让文档读起来像填表。用能描述该段内容的标题，形式随内容变。
- **不要同时写 frontmatter 的 `title` 和正文的 `# 同名标题`**。页面已经把 frontmatter 的 title 渲染成大标题了，正文再写一遍就是重复。（历史上有 1288 篇这么写，那是拆分文档时代的遗留，不代表这是对的。）

### 笔记大纲浮层与回到顶部

`PostDetail` 左侧的笔记大纲（`.post-outline-flyout`）默认展开，点 `‹` / `›` 切换。

#### 滚动联动（`TableOfContents`）

- **不要用 `IntersectionObserver` 做滚动高亮**。它只在“相交状态发生变化”时回调，而且只给出状态变了的那几条。当一个标题向上离开观测带时，回调里只能拿到一条 `isIntersecting: false`，它上面那个标题并不在 `entries` 里，于是候选集为空、不更新——**向上滚动时高亮会停在原地**。
  - 正确做法：改成 `requestAnimationFrame` 节流的 scroll 监听，每次直接算“当前章节 = 最后一个已滚过命中线（88px，即导航栏下方）的标题”；都没有滚过时取第一个。上下滚动都准，一次 60 帧滚动实测平均 16.4ms、无长任务。
- **高亮选择器是 `.toc__item--active a`，不是 `> a`**。目录已经改成树形结构（`li.toc__item > div.toc__row > a`），`a` 是孙元素，用 `>` 会静默失效——类名加上了、颜色却不变，很难发现。
- **高亮项要自动滚进可视区**：面板可滚动（长文档装不下），高亮项在区外等于没高亮。只调面板的 `scrollTop`，不要用 `scrollIntoView`（会连带滚动页面）。
- 滚动到某章节时还要自动展开它的祖先，否则高亮项被折叠藏住。

#### 展开/收起的滚动锚定（`toggleOutline`）

展开/收起会改变正文宽度 → 文字重排 → 页面高度变化（实测同一篇文档宽 1104 与 1392 之间差 **673px**）。`scrollY` 数值不变，但视口上方的内容变短了，阅读位置就会漂移——表现就是“内容往下跳”。

- 做法：切换前选一个**贴近视口顶部的正文块**当锚点，在过渡期间（`requestAnimationFrame`，420ms）每帧把它钉回原来的视口位置。
- **锚点用 `.markdown-body > *`，不要只挑标题**。标题在小节内部很稀疏，落点可能离阅读位置几千像素，而重排位移并非均匀，锚点越远补偿越不准（实测差 30px）。改用正文块后降到 0.2px。
- `scrollBy` **必须显式传 `behavior: 'instant'`**：全局 `html { scroll-behavior: smooth }` 会把每帧的修正变成动画，互相打断反而拖出一段滑动。
- 验证方法：在不同 `scrollY` 下切换，用同一套锚点选法测 `getBoundingClientRect().top` 的变化，应在 1px 内。

#### 其他约束

1. **切换按钮 `z-index` 必须高于面板**，且**宽度 ≤ 24px**。按钮跨在留白右边缘（`left: calc(var(--outline-w) - 0.65rem)`）与面板重叠，面板在 DOM 里排在后面，不抬 z-index 就会被盖住而点不动；收起时按钮回到 `left: 0`，宽度超过 24px（`.post-detail` 的父级内边距）就会压在正文上。
2. **容器本身 `pointer-events: none`**，只给面板和按钮开 `auto`，避免固定层遮住内容。
3. **state 可以放在 `PostDetail`**（不像悬停那样需要 `:has()`）：切换是**点击**触发，不会因鼠标划过而重渲染正文。
4. **窄屏（≤1000px）不留白**：18rem 会把正文挤得没法读，且触屏没有抽屉式大纲的交互习惯。此时面板降级为覆盖在正文上。
5. **回到顶部（`components/BackToTop.tsx`）必须独立成组件**：滚动监听会频繁 setState，state 挂在 `PostDetail` 上同样会重渲染正文。平滑滚动交给全局 CSS，代码里**不传 `behavior`**，否则会绕过 `prefers-reduced-motion`。未显示时记得 `tabIndex={-1}`。

## 链接、主题 & 知识图谱

### 两种站内链接写法

正文里两种写法都能产生图谱边和反向链接，由 `NoteLink.kind` 区分：

| 写法 | kind | 解析规则 |
|---|---|---|
| `[[slug]]` / `[[slug\|显示名]]` | `wiki` | 宽松：完整 slug → frontmatter 标题 → slug 后缀匹配 |
| `[显示名](相对路径.md)` | `md` | 严格：按来源文章所在目录展开相对路径，必须精确命中 slug |

**`md` 链接为什么不能后缀匹配**：41 个主题各有一个 `study-material/00-总览与心智模型.md`，后缀匹配会命中任意一个（通常不是当前主题的）。宁可断链也不连错边。

路径规则集中在 `src/lib/link-path.ts`，被两端共用：

- 构建期 `vite.config.ts` 的 `extractNoteLinks` 抽边
- 运行时 `src/lib/posts.ts` 解析 `targetSlug` 并改写渲染链接（`resolveMarkdownPostHref`）

两处规则不一致就会出现"图上有边但点不动"或"点得动但图上没边"。改一处必须改另一处（同一个文件，所以改不岔）。

**运行时 href 必须 URL 解码**：react-markdown 交给 `a` 组件的 href 是 percent-encoded 的（`00-总览与心智模型.md` → `00-%E6%80%BB...md`），而 slug 是原始 UTF-8 中文。不解码就永远匹配不上，站内链接会原样渲染成 `<a href="xx.md">`，在 SPA 里被当相对路径解析 → 全部 404。

**CommonMark 的尖括号语法**：链接目标含空格时必须写成 `[文本](<../AI RAG学习资料.md>)`。裸写（`](../AI RAG学习资料.md)`）在任何 CommonMark 解析器里都**不是链接**，GitHub 与站内一致地不认。

仓库里原有 222 处裸写（全部是 `../X学习资料.md` 形式，因为目录名 `AI RAG` / `Claude Code` 带空格），已用 `scripts/fix-space-links.py` 批量包上尖括号。抽边正则同时认两种写法，所以作者写不写尖括号不影响图上有几条边。

### 主题（MOC）

约定：**一个目录只要含 `<任意名>学习资料.md`，它就是一个主题**。`src/lib/topics.ts` 据此派生：

- 主题可嵌套（`Python` 与 `Python/FastApi` 都是主题）；一篇文章只归属**最深**的包含它的主题，父子主题不重复计数。
- `/topics` 总览（按顶层分类分组，末尾列出"未归主题"的目录）、`/topics/*` 目录页（入口页 + 子主题 + 按子路径分段的文章清单）。
- `study-material` 在展示层映射为「学习材料」（`SECTION_ALIASES`），`面试知识点` 显示为「学习材料 / 面试知识点」。
- PostDetail 的 meta 行有「所属主题」链接。
- 新增一个主题 = 在目录下放一个 `X学习资料.md`，无需改配置。

### 图谱

`/graph` 用 D3 force-directed（Canvas 渲染）可视化。边来自 `noteLinks` 中 `targetSlug` 解析成功的部分（wiki + md 两种写法都算）。未解析成功的链接仍显示文本，但不产生边。

2650 条边实测无性能问题（6x CPU 降速下 goto 480ms，无长任务）。

### 出链与反向链接

文章页底部成对展示：

- **指向的笔记**（出链，`getOutgoingLinks`）：本文引用了谁
- **引用它的笔记**（入链，`getBacklinks`）：谁引用了本文

`noteLinks` 里的 `targetSlug` 解析成功后两者都能拿到。卡片不显示这两个区块。

### 相关文章（`getRelatedPosts`）

按共享标签的 **IDF 加权**得分排序，两个坑都是被实际数据教出来的：

1. **不能等权计数**。标签是层级路径式的（`AI / 核心概念 / AI RAG`），等权时共享「开发语言」（368 篇）与共享「AI RAG」（30 篇）得分相同，`Python学习资料` 会推荐 Java / Java设计模式 / JVM。用 `log(N/df)` 加权后才收敛。
2. **必须剔除「页面类型」标签**（`PAGE_TYPE_TAGS`）。`学习资料总览` 只出现在 41 篇索引页上，IDF 权重最高（3.50），于是 Redis 索引页的“相关文章”变成 Docker / Git / Maven 的索引页——同为“索引页”但主题无关。同理还有 `学习路线图`、`深度解析`（247 篇）、`面试`（278 篇）。

另加同目录（同主题）加成。实测 top3 与源文章同目录的比例：**53.9% → 94.0%**，无推荐的文章 9 篇 → 2 篇。

新增页面类型标签时，记得同步 `PAGE_TYPE_TAGS`。

## 搜索

两处入口共用同一套纯逻辑（`src/lib/search.ts`）：

- **模态**（`components/SearchBox.tsx`，Ctrl/Cmd+K）：快速跳转，最多 8 条，带高亮摘要
- **结果页**（`pages/Search.tsx`，`/search?q=&scope=&tag=&path=&page=`）：全量结果、分页、按标签/主题/分组筛选

### 索引拆分

全文索引按类型拆成两个虚拟模块，各自按需加载：

| 模块 | 体积 | 何时加载 |
|---|---|---|
| `virtual:posts-search-index` | 4.1MB raw / 1.4MB gzip（1353 篇） | 搜索范围为「文章」或「全部」时 |
| `virtual:cards-search-index` | 1.8MB raw / 0.6MB gzip（10002 张） | 搜索范围为「卡片」或「全部」时 |

默认范围是「文章」，所以搜文章不会付卡片索引的代价。合成一份会让每次搜索都多付 0.6MB gzip，而 10000 张单词卡对多数搜索是噪声。

### 检索语义

- **AND**：所有词都必须在「标题 + 标签 + 摘要 + 正文」里出现才算命中。旧实现是 OR，在 11353 篇的语料上会把结果淹掉。
- 权重：标题 12（开头再加 4）、标签 6、摘要 3、正文 1 + 词频（上限 6 次）。
- **浏览模式**：无关键词但带了 `tag` 或 `path` 筛选时，`runSearch` 返回所有符合条件的项（按日期倒序）。`/review` 的「不在复习里」面板就用这个当目录入口（`/search?scope=article&path=<目录>`）。
- `lower` 在 `buildSearchIndex` 里只算一次——每次按键都对 6MB 文本调 `toLowerCase()` 会卡死。
- **下划线不能被索引侧剔除**。`plainText`（vite.config.ts）原本把 `_` 也当成 Markdown 强调符替成空格，而 `parseTerms` 只按空白切分、不替换下划线——两侧归一化不对称，导致搜 `tool_call` 永远 0 条（搜 `tool call` 却能中）。本站内容是编程主题，`tool_call`、`ctx.hasUI`、`session_before_compact` 这类标识符很多，所以索引保留下划线，并用 `termVariants()` 让含下划线的词同时用「原形」与「下划线当空格」两种形式匹配，两种写法互相都能搜到。改 `plainText` 的替换集时注意别再把 `_` 加回去。
- 高亮返回**结构化区间**（`splitByRanges`）而不是 HTML 字符串，避免正文里的 `<` 被当标签。
- 摘要以命中词为中心开窗（前 24 / 后 90 字符），并尽量对齐词边界。

## 间隔重复复习系统

本地 SM-2 算法（`scripts/db.py` 实现），公网只读展示。评分：`5 = 记得`、`4 = 模糊`、`0 = 忘了`；`grade >= 3` 算成功，否则 `reps` 归零、`interval=1`、`ease -0.2`。`ease` 初始 2.5，范围 1.3–3.0。间隔：第 1 次 → 1 天，第 2 次 → 6 天，之后 `round(上次 interval × ease)`。

### 问答卡片（type: card）

除文章外，复习系统支持 Anki 式问答卡片——也是 `.md` 文件，但粒度更小（一文件一卡）：

- frontmatter 标 `type: card`，正文约定两个一级标题段：`# 问题` / `# 答案`（解析器在 `src/lib/cards.ts`，标题名匹配不到时按出现顺序兜底：第一段=问题、第二段=答案）。
- 卡片**不进**首页/归档/标签/搜索/图谱/RSS/sitemap（`allPosts` 已排除；搜索索引在 vite 插件里跳过），只通过 `/cards` 复习会话和直链 `/posts/<slug>` 访问。
- SM-2 状态与文章共用同一套机制：`review.db` 按 slug 记卡、sync 刷 frontmatter `review:` 快照、`public/review.json` 条目带 `type` 字段（`article`/`card`）。
- `/cards`（`src/pages/Cards.tsx`，懒加载）：翻转式复习会话（看问题 → 显示答案 → 打分），队列来自 `getDueCards()`（frontmatter 快照静态计算，无快照的新卡视为到期），打分走 `POST /api/cards/{slug}/review`（仅 dev），会话结束可点「同步复习数据」。

  换卡只有两个动作：**打分**（`忘了/模糊/记得`，该卡移出前进队列，游标不动即自动指向下一张）和**下一张**（游标后移、不打分，卡仍算到期）。导航按钮统一为 `上一张` / `下一张`（不再有单独的「跳过」，两者本来就是同一个动作），配 <kbd>←</kbd>/<kbd>→</kbd>，在翻面前后、dev/生产**都**存在（生产无打分按钮）。键盘：空格/回车翻面，1/2/3 打分（仅 dev），←/→ 换卡。

**到期数有两个口径，别混**：`dueCount`（当前筛选下的到期数，用作 tab 计数与队列上限）与 `globalDue`（全库到期数）。完成页两者都要提：“当前筛选下还有 N 张”+“其他分组/标签下还有 M 张”。曾经只有一个全局 `totalDue` 且未过筛选就传给会话，导致筛到 1 张卡的分组却报“还有 10001 张到期”。

  会话状态是 `grades`（slug→评分）+ `skipped`（Set）+ `trail`（看过的 queue 下标，严格递增）+ `trailPos`：

  - **「上一张」= 沿 `trail` 回看**。`trailPos` 未到 `trail.length - 1` 时 `goNext` 只是回放，**不会**把跳过的卡重新计入，也不会重新落库。
  - **进度条/标签是「第几张」（`position = trailPos + 1`），所以「上一张」会回退**，如 `11/100 → 10/100`。别把它和「已处理数」（`processedCount = graded + skippedCount`）搞混：后者只用于完成页统计，回看时不变。两者都不是 `trail.length`——展示过不等于处理过。
  - **已打分卡回看时只读**：`grades.has(slug)` 则自动展开答案并隐藏评分按钮。这是刻意的——回看时再打一次会给 SQLite 再追一条 review、把一个 SM-2 间隔推两轮；要改分请到文章页用 `ReviewPanel`。
  - **只有「从最前沿往前走」才记跳过**（`goNext(asGraded)`）：`grade()` 传 `true`，否则会把自己刚打分的卡又记成跳过，`processedCount` 翻倍；曾跳过又回头补打分的卡会从 `skipped` 中移除，避免重复计数。
  - 前沿扫不到未处理的卡 → `finished`，完成页可点「回看最后一张」返回。

  每批 `SESSION_BATCH`（100）张：打分的卡要 sync 后才不再到期，跳过的卡下一批会再次出现。
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

### 两个已修的坑（都让加密功能完全不可用）

全库长期是 0 篇加密文章，所以这条路径从未被真正跑通。实测发现两个 bug：

1. **加密后 frontmatter 与密文之间缺换行**（`noReview: true---`）。`FM_RE` 的捕获组不含结尾换行（`\r?\n---` 把换行吃掉了），`setEncryptedFlag` 直接返回 `fmText` 就会粘住。后果：`front-matter` 返回空 `attributes`，文章既不被识别为加密、正文也全部丢失。已加 `ensureTrailingNewline()`。
2. **正确密码也报“密码错误”**。`getPostContent` 剥掉 frontmatter 后正文以 `\n` 开头，而 `decryptBody` 没 `trim`，于是 `split('::')[0]` 是 `"\nENC"` 不等于 `'ENC'`，抛“无法识别的密文格式”后被调用方 catch 成“密码错误”。已在 `decryptBody` 和 `isEncrypted` 里 trim。

（`encrypt.mjs` 的 `isAlreadyEncrypted` 一直用了 `.trim()`——加密端意识到了空白问题，解密端漏了。）

### 验证方式

加密是少走的路径，改动 `crypto.ts` / `encrypt.mjs` 后必须端到端验一次：

```bash
# 造一篇临时加密文章（须先手动写 encrypted: true，脚本会拒绝未标记的文件）
BLOG_ENCRYPT_KEY=pw node scripts/encrypt.mjs src/posts/<临时>.md
# 然后浏览器验证：锁定态不泄露密文 / 错误密码被拒 / 正确密码能渲染 / 不在 RSS+sitemap
```

也可用 Node 的 `webcrypto` 解密同一份密文来隔离“算法不一致”与“调用方 bug”。

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
- **`api-server.py` 启动时会跑 `check_routes()` 自检**（路径 + 函数名）。往这个文件里加新函数时，**不要插到 `@app.xxx(...)` 装饰器和它原本的函数之间**——装饰器会挂到错函数上，原端点静默变成 422，而语法/启动/日志全正常。自检就是为了抽这个（只查路径存在是抽不到的，因为路径依旧在）。
- **所有写回 .md 的路径必须走 `compose_md()`**（api-server.py）或等价的“确保 frontmatter 结尾有换行”逻辑。`FM_RE` 的捕获组不含结尾换行，直接 `f"---\\n{fm_text}---"` 会粘成 `noReview: true---`，让 front-matter 返回空 attributes（文章既不被识别为加密、正文也全丢）。这个坑在仓库里出现过三次：`encrypt.mjs`、`api-server.py` 的 content 端点、以及 `sync-reviews.py`（它修了，注释里写了“避免 ease: 2.5--- 粘连”）。
- **往 frontmatter 写字符串值必须转义**（api-server.py 的 `yaml_str()`）。`title: false` / `title: 123` / `description: a: b` 都会被 YAML 解析成布尔值 / 数字 / 嵌套结构，前端一调 `.toLowerCase()` 就崩。
- **`title` 与 `date` 缺失会造成一串连锁问题**：标题退化成 slug、日期变成 1970-01-01（进而影响首页排序）、且 `sync-reviews.py` 会用「今天」兜底 `lastReview`，导致每次 sync 都改一次文件、git 里每天多一条无意义 diff（sync 就不再幂等）。全库曾有四篇这种文件（`AI/AI Agent Loop Engineering`、`AI/工程实践/AI Agent Loop Engineering`、`英语/1-7`、`英语/单词记忆法`），已修。`scripts/sync-reviews.py` 的回退顺序已改为「卡片 created > frontmatter date > 今天」，新增文章时仍要记得写齐 `title` 和 `date`。
- **双 frontmatter 会让整个 frontmatter 当作正文渲染**。`git log` 里的 `70450dc fix: 修复 sync-reviews 的 frontmatter 写入 bug（重复 review 块 / --- 粘连 / 行尾符污染）` 修了写入逻辑，但没清理已被写坏的历史文件。仓库里曾有四篇带双 frontmatter 的文章，已修。修改 `sync_frontmatter` / `compose_md` 这类拼接逻辑时，记得用 `git show HEAD:<file>` 抽查历史文件而不是只看代码。
- 调本地 API 必须用 `apiUrl()`（`src/lib/api.ts`），不要手写 `fetch(`/api/posts/${slug}`)`。slug 是中文文件路径，含空格（`AI RAG`，224 篇）与 `&`（`工具&中间件`，231 篇）。实测浏览器会自动百分号编码中文与空格，但**不编码 `&`**，会直接把它发出去；当前语料里 `&` 后面总是“中”字所以侥幸能过（FastAPI 容忍），但目录名一旦出现 `A&B=C` 形式就会被当成查询串截断。所有调用点已统一走 `apiUrl()`。
- 用 curl 测本地 API 时，**slug 必须先 URL 编码**（`curl` 发裸 UTF-8 会得到 “Invalid HTTP request” 或 HTTP 000），否则会误判成产品 bug。用浏览器 `fetch` 测时，注意它会自动编码中文/空格但不编码 `&`。
- **卡片库的条目必须走 `LibraryItem`（`React.memo`）**，不要把它内联回父组件。卡片库可以“加载更多”到 10000 张，内联时每次 `setVisible` 都会让 React 重建全部已渲染条目，实测单帧阻塞从 84ms 线性涨到 **760ms**（CPU 4x，越点越卡）。memo 后旧条目跳过重渲染，10000 张时降到 **47ms**，从 O(n) 变成 O(增量)。同理，归集与排序要放在 `useMemo` 里，不要在渲染时对片段 `slice().sort()`。
- 用 `git checkout` 恢复 `src/posts` 下的文件前想清楚：那些文件同时带着链接修复（尖括号）等真实改动，checkout 会把修复一起还原。恢复后必须用 `git diff --stat src/posts` 核对总数（当前应为 218 files / 1507 与 1507 对称）。
- 在 `src/posts` 里做测试（新建/删除临时文章、打分、切 `noReview`）会留下持久副作用：SQLite 记录、`public/review.json`、frontmatter 的 `review:` 快照。测完必须：清 `reviews` 表、把 `cards` 表里被测卡的 `reps/interval/ease/last_review` 恢复、`git checkout -- public/review.json`。**删掉 SQLite 记录后再 sync 会按 `date` 重建 `created`**，从而改掉 frontmatter（`英语/1-7` 就这么被改过）—— 要么避免删记录，要么把 `created`/`last_review` 手工对齐回已提交值。
- `review.db` 是 gitignore 的本地文件，`public/review.json` 是提交的公网快照；两者语义不同，别混用。
- `src/pages/Admin.tsx` 和 `src/pages/About.tsx` 目前**均未被路由表挂载**（App.tsx 没有 `/admin`、`/about` 路由），属于未接入的残留页面；新建文章能力实际通过 Admin 页的 `POST /api/posts`，但页面本身需要手动接线才能用。
- `scripts/check-col1.cjs` 是针对旧内联 Vditor 编辑器的一次性排障脚本，当前前端已无内联编辑入口，属遗留文件。
- 站内链接路径规则只有一份（`src/lib/link-path.ts`），`vite.config.ts`（构建期抽边）与 `src/lib/posts.ts`（运行时解析）共用；别在任一侧另写一套正则。
- 主题识别靠文件名后缀 `学习资料` / `学习路线图`（`src/lib/topics.ts` 的 `INDEX_SUFFIXES`），没有额外的配置表；重命名入口页会直接让该目录从 `/topics` 消失。
- `gen-rss.mjs` 的 `collectMd` 必须继续跳过点目录（`.solomd`、`.pytest_cache`），否则 RSS/sitemap 会多出站点上不存在的 URL（已修过一次）。
- `gen-rss.mjs` 的 `staticPaths` 手写维护，新增页面路由时记得同步（否则 sitemap 缺 URL）；列表里不能再出现未挂载路由（`/about` 已移除）。
- 写含空格的链接目标必须用尖括号：`[文本](<../AI RAG学习资料.md>)`。裸写在 CommonMark 里不是链接，会静默变成纯文本（不报错）。新增这类链接后可以跑 `python scripts/check-links.py` 体检。
- **frontmatter 的 `title` 未必是字符串**：YAML 会把 `title: false` / `title: none` 解析成布尔值 / null（单词表里恰好有 `false`、`none` 两个词）。生成脚本用 `yaml_str()` 加引号，vite 插件也有 `String()` 兜底——否则前端一调 `.toLowerCase()` 就崩。新增批量生成的卡片/文章时注意同样问题。
- 主包（`index-*.js`）约 4.3MB raw / 0.49MB gzip，其中 2.7MB 是 10000 张卡片的元数据（`virtual:posts-index` 全量进主包）。**已实测（4x CPU 降速）：首屏脚本解析+执行 133ms，gzip 后仅 0.49MB——不是性能问题，不要为它做高风险重构。** 若要优化，方向是把 `allCards` 拆成按需加载的虚拟模块（参考搜索索引），但 `lib/posts.ts` 的模块级 `parsedPosts`/`allCards` 被 8 个页面同步引用，改动面较大。
- `/review` 看板的统计条以**文章口径**重新计算（不用 `review.json` 的 `stats`，那是文章+卡片的全局值）。卡片有 10002 张，混进来会让读者看到「参与复习 10004」紧跟着「今日待复习 2」这种口径跳跃。改这个页面时保持两个口径不混。
