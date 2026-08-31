import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fm from 'front-matter'

// 部署到 GitHub Pages 项目站点时，CI 会传入 BASE_PATH="/仓库名/"。
// 本地开发与根路径部署（Vercel/Netlify/用户主页站点）保持默认 "/"。
const base = process.env.BASE_PATH || '/'

const POSTS_DIR = fileURLToPath(new URL('./src/posts', import.meta.url))
const INDEX_ID = '\0virtual:posts-index'
const SEARCH_ID = '\0virtual:posts-search-index'

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
  review?: unknown
  words: number
  readingMinutes: number
  noteLinks: { target: string; label: string }[]
}

/** 统计字数：中文按字符计，英文按单词计（与旧运行时逻辑保持一致） */
function countWords(text: string): number {
  const cjk = (text.match(/[一-龥]/g) || []).length
  const en = text.replace(/[一-龥]/g, ' ').match(/[a-zA-Z0-9]+/g)?.length ?? 0
  return cjk + en
}

/** 从 Markdown 正文提取 Obsidian 风格双链（跳过代码块与行内代码） */
function extractNoteLinks(markdown: string): { target: string; label: string }[] {
  const links: { target: string; label: string }[] = []
  let inCodeBlock = false
  for (const line of markdown.split('\n')) {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue
    // 行内代码（`...`）中的 [[..]] 不是双链，只扫描反引号外的片段
    const segments = line.split('`').filter((_, i) => i % 2 === 0)
    for (const segment of segments) {
      for (const match of segment.matchAll(/\[\[([^\]\|\n]+)(?:\|([^\]\n]+))?\]\]/g)) {
        const target = match[1].trim()
        const label = (match[2] ?? target).trim()
        if (target) links.push({ target, label })
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
    .replace(/[#>*`_~\[\]]/g, ' ')
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
function scanPosts(): { meta: IndexEntry[]; search: { slug: string; text: string }[] } {
  const meta: IndexEntry[] = []
  const search: { slug: string; text: string }[] = []

  for (const file of collectMarkdown(POSTS_DIR)) {
    const rel = path.relative(POSTS_DIR, file).replace(/\\/g, '/')
    const slug = rel.replace(/\.md$/, '')
    const raw = fs.readFileSync(file, 'utf8')
    const parsed = fm<Record<string, unknown>>(raw)
    const attrs = parsed.attributes
    const body = parsed.body

    const words = countWords(body)

    meta.push({
      slug,
      title: (attrs.title as string) ?? slug,
      date: (attrs.date as string) ?? '1970-01-01',
      description: attrs.description as string | undefined,
      tags: attrs.tags as string[] | undefined,
      cover: attrs.cover as string | undefined,
      pinned: attrs.pinned as boolean | undefined,
      draft: attrs.draft as boolean | undefined,
      encrypted: attrs.encrypted as boolean | undefined,
      author: attrs.author as string | undefined,
      noReview: attrs.noReview as boolean | undefined,
      review: attrs.review,
      words,
      readingMinutes: Math.max(1, Math.round(words / 400)),
      noteLinks: extractNoteLinks(body),
    })

    if (!attrs.encrypted && !attrs.draft) {
      search.push({ slug, text: plainText(body) })
    }
  }

  return { meta, search }
}

/**
 * 文章索引插件：
 * - virtual:posts-index       轻量元数据（主包同步引入）
 * - virtual:posts-search-index 全文搜索文本（SearchBox 打开时动态 import，独立 chunk）
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
    },
    load(id) {
      if (id === INDEX_ID) return `export default ${JSON.stringify(data().meta)}`
      if (id === SEARCH_ID) return `export default ${JSON.stringify(data().search)}`
    },
    configureServer(server) {
      const invalidate = () => {
        cache = null
        for (const id of [INDEX_ID, SEARCH_ID]) {
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
        for (const id of [INDEX_ID, SEARCH_ID]) {
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
            for (const id of [INDEX_ID, SEARCH_ID]) {
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
