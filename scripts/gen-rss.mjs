// 构建时生成 RSS feed 与 sitemap，输出到 dist/
// 纯 Node 脚本，不依赖打包器；手动解析 frontmatter，避免引入额外依赖。
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const postsDir = join(root, 'src', 'posts')
const distDir = join(root, 'dist')

/** 从 config.ts 里用正则抽取站点基本信息（避免运行 TS） */
function readSiteConfig() {
  const src = readFileSync(join(root, 'src', 'config.ts'), 'utf-8')
  const pick = (key) => {
    const m = new RegExp(`${key}:\\s*'([^']*)'`).exec(src)
    return m ? m[1] : ''
  }
  return {
    title: pick('title'),
    description: pick('description'),
    url: pick('url').replace(/\/$/, ''),
    author: pick('author'),
    lang: pick('lang'),
  }
}

/** 极简 frontmatter 解析：取 --- 之间的 key: value */
function parseFrontmatter(raw) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw)
  if (!m) return { data: {}, body: raw }
  const data = {}
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    // 去引号
    val = val.replace(/^['"]|['"]$/g, '')
    // 数组 [a, b]
    if (/^\[.*\]$/.test(val)) {
      val = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    }
    data[key] = val
  }
  return { data, body: m[2] }
}

/** XML 转义 */
function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function main() {
  const site = readSiteConfig()

  if (!existsSync(postsDir)) {
    console.warn('[rss] 没有找到 src/posts，跳过')
    return
  }

  const posts = readdirSync(postsDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = readFileSync(join(postsDir, f), 'utf-8')
      const { data, body } = parseFrontmatter(raw)
      return {
        slug: f.replace(/\.md$/, ''),
        title: data.title || f,
        date: data.date || '1970-01-01',
        description: data.description || body.slice(0, 200).replace(/\n/g, ' '),
        draft: data.draft === 'true' || data.draft === true,
      }
    })
    .filter((p) => !p.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const now = new Date().toUTCString()

  // ---- RSS ----
  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${site.url}/posts/${p.slug}</link>
      <guid>${site.url}/posts/${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
    </item>`
    )
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.title)}</title>
    <link>${site.url}</link>
    <description>${esc(site.description)}</description>
    <language>${site.lang}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`

  // ---- sitemap ----
  const staticPaths = ['', '/archives', '/tags', '/categories', '/about']
  const urls = [
    ...staticPaths.map((p) => `${site.url}${p}`),
    ...posts.map((p) => `${site.url}/posts/${p.slug}`),
  ]
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n')}
</urlset>
`

  if (!existsSync(distDir)) {
    console.warn('[rss] dist/ 不存在（先执行 vite build），仍尝试写入')
  }
  writeFileSync(join(distDir, 'rss.xml'), rss)
  writeFileSync(join(distDir, 'sitemap.xml'), sitemap)

  // GitHub Pages 没有服务端重定向，靠 404.html 兜底实现 SPA fallback：
  // 任意未匹配的深层路由都会返回这份与 index.html 相同的内容，
  // 由前端路由接管渲染。其他平台（Vercel/Netlify）用各自的 rewrite 配置。
  const indexPath = join(distDir, 'index.html')
  if (existsSync(indexPath)) {
    writeFileSync(join(distDir, '404.html'), readFileSync(indexPath, 'utf-8'))
  }

  console.log(
    `[postbuild] 已生成 rss.xml、sitemap.xml、404.html，共 ${posts.length} 篇文章`
  )
}

main()
