import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fm from 'front-matter'
// 链接路径规则必须和运行时（src/lib/posts.ts）一致，所以两端共用同一个无依赖模块
import { normalizeLinkTarget } from './src/lib/link-path'

// 部署到 GitHub Pages 项目站点时，CI 会传入 BASE_PATH="/仓库名/"。
// 本地开发与根路径部署（Vercel/Netlify/用户主页站点）保持默认 "/"。
const base = process.env.BASE_PATH || '/'

const POSTS_DIR = fileURLToPath(new URL('./src/posts', import.meta.url))
const INDEX_ID = '\0virtual:posts-index'
const SEARCH_ID = '\0virtual:posts-search-index'
const CARD_SEARCH_ID = '\0virtual:cards-search-index'

interface IndexEntry {
  slug: string
  title: string
  date: string
  description?: string
  tags?: string[]
  cover?: string
  pinned?: boolean
  draft?: boolean
  encrypted?: boolean
  author?: string
  noReview?: boolean
  type?: string
  review?: unknown
  words: number
  readingMinutes: number
  noteLinks: { target: string; label: string; kind: 'wiki' | 'md' }[]
}

/** 统计字数：中文按字符计，英文按单词计（与旧运行时逻辑保持一致） */
function countWords(text: string): number {
  const cjk = (text.match(/[一-龥]/g) || []).length
  const en = text.replace(/[一-龥]/g, ' ').match(/[a-zA-Z0-9]+/g)?.length ?? 0
  return cjk + en
}

/**
 * 从 `[文本](括号内容)` 的括号内容里取出链接目标。
 * 返回 null 表示这不是一个站内 .md 链接。
 *
 * 要处理三种写法，否则图上的边数会随作者怎么写而变：
 *   裸路径       (../AI RAG学习资料.md)      —— 含空格时其实不是合法 CommonMark，但仓库里历史遗留很多
 *   尖括号路径   (<../AI RAG学习资料.md>)     —— 含空格路径的合法写法
 *   带 title     (foo.md "标题")
 */
function parseMdLinkTarget(inner: string): string | null {
  let value = inner.trim()
  if (value.startsWith('<') && value.endsWith('>')) value = value.slice(1, -1)
  // 去掉 title：url "title" / url 'title' / url (title)
  value = value.replace(/\s+(?:"[^"]*"|'[^']*'|\([^)]*\))\s*$/, '')
  // 去掉锚点（图谱只看文章级别的关系，不看章节）
  const hash = value.indexOf('#')
  if (hash >= 0) value = value.slice(0, hash)
  if (!/\.md$/i.test(value)) return null
  return value
}

/**
 * 从 Markdown 正文提取站内链接（跳过代码块与行内代码）。
 *
 * 两种写法都提取，靠 kind 区分：
 *   - `[[目标]]` / `[[目标|显示名]]` —— Obsidian 双链，kind = 'wiki'
 *   - `[显示名](相对路径.md)` —— 普通 Markdown 链接，kind = 'md'（这类链接是相对
 *     来源文件所在目录的，图谱/反向链接不能直接拿 target 当 slug，必须按 kind 区分解析）
 *
 * 二者产出同一种边，所以知识图谱和反向链接能同时看到两种写法。
 */
function extractNoteLinks(
  markdown: string
): { target: string; label: string; kind: 'wiki' | 'md' }[] {
  const links: { target: string; label: string; kind: 'wiki' | 'md' }[] = []
  let inCodeBlock = false
  for (const line of markdown.split('\n')) {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue
    // 行内代码（`...`）里的链接不是真链接，只扫描反引号外的片段
    const segments = line.split('`').filter((_, i) => i % 2 === 0)
    for (const segment of segments) {
      for (const match of segment.matchAll(/\[\[([^\]\|\n]+)(?:\|([^\]\n]+))?\]\]/g)) {
        const target = match[1].trim()
        const label = (match[2] ?? target).trim()
        if (target) links.push({ target, label, kind: 'wiki' })
      }
      // 目标里可能有空格（如 `../AI RAG学习资料.md`），所以不能用 \S+ 收尾；
      // 具体解析交给 parseMdLinkTarget，它同时认裸路径、尖括号路径和带 title 的写法。
      for (const match of segment.matchAll(/(!?)\[([^\]\n]*)\]\(([^)\n]*)\)/gi)) {
        if (match[1] === '!') continue // 图片，不是链接
        const raw = parseMdLinkTarget(match[3])
        if (!raw) continue
        if (/^[a-z][a-z\d+.-]*:/i.test(raw)) continue // 外链
        const target = normalizeLinkTarget(raw)
        if (!target) continue
        links.push({ target, label: match[2].trim() || target, kind: 'md' })
      }
    }
  }
  return links
}

/** 去掉代码块和 Markdown 链接语法后的正文纯文本，供全文搜索用 */
function plainText(body: string): string {
  let inCodeBlock = false
  const lines = body.split('\n').filter((line) => {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock
      return false
    }
    return !inCodeBlock
  })
  return lines
    .join('\n')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // 注意不要剔除下划线：本站内容是编程主题，`tool_call`、`ctx.hasUI`、
    // `session_before_compact` 这类标识符很多。剔除后索引里变成 `tool call`，
    // 而查询侧 parseTerms 只按空白切分、不替换下划线，于是搜 `tool_call`
    // 永远 0 条（搜 `tool call` 却能中）——两侧归一化不对称。
    // 保留下划线后，子串匹配能同时覆盖两种写法；
    // search.ts 的 termVariants 再把下划线当空格试一次，反向也能命中。
    .replace(/[#>*`~\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function collectMarkdown(dir: string): string[] {
  const out: string[] = []
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.')) continue
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) out.push(...collectMarkdown(p))
    else if (name.endsWith('.md')) out.push(p)
  }
  return out
}

/**
 * 扫描 src/posts 生成轻量元数据索引（进主包）与全文搜索索引（按需 chunk）。
 * 文章正文不再打包进主 bundle，只有打开文章时才通过非 eager 的 ?raw glob 懒加载。
 */
function scanPosts(): {
  meta: IndexEntry[]
  search: { slug: string; text: string }[]
  cardSearch: { slug: string; text: string }[]
} {
  const meta: IndexEntry[] = []
  const search: { slug: string; text: string }[] = []
  const cardSearch: { slug: string; text: string }[] = []

  for (const file of collectMarkdown(POSTS_DIR)) {
    const rel = path.relative(POSTS_DIR, file).replace(/\\/g, '/')
    const slug = rel.replace(/\.md$/, '')
    const raw = fs.readFileSync(file, 'utf8')
    const parsed = fm<Record<string, unknown>>(raw)
    const attrs = parsed.attributes
    const body = parsed.body

    const words = countWords(body)

    // frontmatter 里的 title 未必是字符串：YAML 会把 `title: false` / `title: none`
    // 解析成布尔值 / null。这类标题会让前端 `.toLowerCase()` 直接抛错（搜索、排序都挂）。
    // 单词卡里恰好有 false / none 两个词，生成脚本已修，这里再加一道兵兵。
    const rawTitle = attrs.title
    const title =
      typeof rawTitle === 'string' && rawTitle.trim()
        ? rawTitle
        : rawTitle === undefined || rawTitle === null
          ? slug
          : String(rawTitle)

    meta.push({
      slug,
      title,
      date: (attrs.date as string) ?? '1970-01-01',
      description: attrs.description as string | undefined,
      tags: attrs.tags as string[] | undefined,
      cover: attrs.cover as string | undefined,
      pinned: attrs.pinned as boolean | undefined,
      draft: attrs.draft as boolean | undefined,
      encrypted: attrs.encrypted as boolean | undefined,
      author: attrs.author as string | undefined,
      noReview: attrs.noReview as boolean | undefined,
      type: attrs.type as string | undefined,
      review: attrs.review,
      words,
      readingMinutes: Math.max(1, Math.round(words / 400)),
      noteLinks: extractNoteLinks(body),
    })

    // 卡片与文章分开索引：10000 张卡片约 1.8MB（0.6MB gzip），
    // 合进文章索引会让每次搜索都白付这份代价，而卡片对多数搜索是噪声。
    // 卡片索引只在用户真的搜卡片时才加载（见 SearchBox 的 scope）。
    if (!attrs.encrypted && !attrs.draft) {
      if (attrs.type === 'card') cardSearch.push({ slug, text: plainText(body) })
      else search.push({ slug, text: plainText(body) })
    }
  }

  return { meta, search, cardSearch }
}

/**
 * 文章索引插件：
 * - virtual:posts-index             轻量元数据（主包同步引入）
 * - virtual:posts-search-index      文章全文（SearchBox 打开时动态 import，独立 chunk）
 * - virtual:cards-search-index      卡片全文（切到「卡片」范围时才加载，独立 chunk）
 * dev 模式下监听 src/posts 变化自动重建。
 */
function postsIndexPlugin(): Plugin {
  let cache: ReturnType<typeof scanPosts> | null = null
  const data = () => (cache ??= scanPosts())

  return {
    name: 'posts-index',
    resolveId(id) {
      if (id === 'virtual:posts-index') return INDEX_ID
      if (id === 'virtual:posts-search-index') return SEARCH_ID
      if (id === 'virtual:cards-search-index') return CARD_SEARCH_ID
    },
    load(id) {
      if (id === INDEX_ID) return `export default ${JSON.stringify(data().meta)}`
      if (id === SEARCH_ID) return `export default ${JSON.stringify(data().search)}`
      if (id === CARD_SEARCH_ID) return `export default ${JSON.stringify(data().cardSearch)}`
    },
    configureServer(server) {
      const invalidate = () => {
        cache = null
        for (const id of [INDEX_ID, SEARCH_ID, CARD_SEARCH_ID]) {
          const mod = server.moduleGraph.getModuleById(id)
          if (mod) server.moduleGraph.invalidateModule(mod)
        }
        server.ws.send({ type: 'full-reload' })
      }

      // dev 专用端点：页面上的「更新双链」按钮调用。
      // 文件监听在 Windows 重命名/移动时可能漏事件，这里提供手动
      // 重扫入口：清缓存 → 失效虚拟模块 → 返回最新文章数，随后前端整页刷新。
      server.middlewares.use('/__refresh-posts-index', (_req, res) => {
        cache = null
        for (const id of [INDEX_ID, SEARCH_ID, CARD_SEARCH_ID]) {
          const mod = server.moduleGraph.getModuleById(id)
          if (mod) server.moduleGraph.invalidateModule(mod)
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ ok: true, posts: data().meta.length }))
      })

      // dev 专用端点：页面上的「更新复习」按钮调用。
      // 执行 scripts/sync-reviews.py（刷 frontmatter 快照 + 重新生成 public/review.json），
      // 完成后失效文章索引虚拟模块（触发 HMR 原地更新），并通过 WebSocket
      // 广播自定义事件，让 /review 页重新拉取 review.json —— 全程不整页刷新。
      let syncing = false
      server.middlewares.use('/__sync-reviews', (_req, res) => {
        if (syncing) {
          res.statusCode = 429
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ok: false, error: '正在刷新中，请稍候' }))
          return
        }
        syncing = true
        const script = fileURLToPath(new URL('./scripts/sync-reviews.py', import.meta.url))
        execFile(
          process.platform === 'win32' ? 'python' : 'python3',
          [script],
          { cwd: path.dirname(script), timeout: 120_000 },
          (err, _stdout, stderr) => {
            syncing = false
            if (err) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.statusCode = 500
              res.end(JSON.stringify({ ok: false, error: stderr || err.message }))
              return
            }
            cache = null
            for (const id of [INDEX_ID, SEARCH_ID, CARD_SEARCH_ID]) {
              const mod = server.moduleGraph.getModuleById(id)
              if (mod) server.moduleGraph.invalidateModule(mod)
            }
            server.ws.send({ type: 'custom', event: 'reviews-synced' })
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: true }))
          }
        )
      })
      const watch = (file: string) => {
        if (file.startsWith(POSTS_DIR) && file.endsWith('.md')) invalidate()
      }
      server.watcher.on('add', watch)
      server.watcher.on('unlink', watch)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), postsIndexPlugin()],
  server: {
    // 端口 3000 在 Windows 上常被 Hyper-V/WSL 纳入保留区间（EACCES），
    // 改用 Vite 默认端口 5173 避开冲突。
    port: 5173,
    open: true,
    proxy: {
      // 本地 API server（FastAPI, localhost:3001）只在 dev 时存在；
      // 生产构建不打包 server 代码，proxy 自动失效。
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 把 React 全家桶单独拆出来，长期缓存
          react: ['react', 'react-dom', 'react-router-dom'],
          // Markdown 渲染 + 代码高亮是最重的部分，单独成块
          markdown: [
            'react-markdown',
            'remark-gfm',
            'rehype-slug',
            'rehype-highlight',
          ],
        },
      },
    },
  },
})
