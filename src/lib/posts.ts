import fm from 'front-matter'
import GithubSlugger from 'github-slugger'
import type {
  GraphEdge,
  GraphNode,
  NoteLink,
  Post,
  PostFrontmatter,
  TocItem,
} from './types'

/**
 * 用 Vite 的 import.meta.glob 在构建时把 src/posts 下（含任意子目录）的所有 .md 文件
 * 以原始字符串的形式静态打包进来。eager: true 表示同步加载。
 * 下面的 glob 用了递归通配模式，会匹配子目录，所以可以按 年份/分类 等方式任意分目录存放文章。
 */
const modules = import.meta.glob<string>('../posts/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** 统计字数：中文按字符计，英文按单词计 */
function countWords(text: string): number {
  const cjk = (text.match(/[一-龥]/g) || []).length
  const en = (text.replace(/[一-龥]/g, ' ').match(/[a-zA-Z0-9]+/g) || [])
    .length
  return cjk + en
}

/**
 * 把相对 src/posts 的路径转成路由 slug：去掉前缀与扩展名。
 *   ../posts/hello-world.md        -> hello-world      （根目录文章，保持原样）
 *   ../posts/tech/hello.md         -> tech/hello        （子目录文章，带目录前缀）
 *   ../posts/2024/notes/intro.md   -> 2024/notes/intro
 * 目录前缀让重名文件也能各自唯一，URL 形如 /posts/tech/hello。
 */
function slugFromPath(path: string): string {
  return path
    .replace(/^.*\/posts\//, '')
    .replace(/\.md$/, '')
}

/** 从 Markdown 正文提取 Obsidian 风格双链：[[slug]] 或 [[slug|显示名]] */
function extractNoteLinks(markdown: string): NoteLink[] {
  const links: NoteLink[] = []
  let inCodeBlock = false

  for (const line of markdown.split('\n')) {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const matches = line.matchAll(/\[\[([^\]\|\n]+)(?:\|([^\]\n]+))?\]\]/g)
    for (const match of matches) {
      const target = match[1].trim()
      const label = (match[2] ?? target).trim()
      if (target) links.push({ target, label })
    }
  }

  return links
}

function resolveNoteLinks(posts: Post[]): Post[] {
  const bySlug = new Map(posts.map((post) => [post.slug, post]))
  const byTitle = new Map(posts.map((post) => [post.title, post]))

  return posts.map((post) => ({
    ...post,
    noteLinks: post.noteLinks.map((link) => {
      const normalizedTarget = link.target.replace(/^\/?posts\//, '')
      const targetPost = bySlug.get(normalizedTarget) ?? byTitle.get(link.target)
      return {
        ...link,
        targetSlug: targetPost?.slug,
      }
    }),
  }))
}

/** 解析单个 Markdown 文件为 Post 对象 */
function parsePost(path: string, raw: string): Post {
  const { attributes, body } = fm<PostFrontmatter>(raw)
  const slug = slugFromPath(path)

  if (!attributes.title) {
    console.warn(`[posts] ${slug} 缺少 title，已用 slug 兜底`)
  }

  const words = countWords(body)

  return {
    ...attributes,
    title: attributes.title ?? slug,
    date: attributes.date ?? '1970-01-01',
    slug,
    content: body,
    words,
    noteLinks: extractNoteLinks(body),
    // 按每分钟约 400 字（中英文混合）估算阅读时间，至少 1 分钟
    readingMinutes: Math.max(1, Math.round(words / 400)),
    dateObj: new Date(attributes.date ?? '1970-01-01'),
  }
}

/**
 * 全部文章（含加密文章），按日期倒序；生产环境过滤草稿。
 * 这是内部完整集合，仅供 getPost 用——加密文章不进列表，但可通过直链访问。
 */
const parsedPosts: Post[] = Object.entries(modules)
  .map(([path, raw]) => parsePost(path, raw as string))
  .filter((p) => (import.meta.env.PROD ? !p.draft : true))

const allParsedPosts: Post[] = resolveNoteLinks(parsedPosts)
  .sort((a, b) => {
    // 置顶优先
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
    return b.dateObj.getTime() - a.dateObj.getTime()
  })

/**
 * 对外暴露的文章集合：排除加密文章。
 * 这样首页/归档/标签/分类/搜索侧边栏等所有消费者都不需要单独判断，
 * 加密文章自然不会出现在任何列表里，只能通过直链 /posts/xxx 访问。
 */
export const allPosts: Post[] = allParsedPosts.filter((p) => !p.encrypted)

/** 按 slug 取单篇（从完整集合查，所以直链能命中加密文章） */
export function getPost(slug: string): Post | undefined {
  return allParsedPosts.find((p) => p.slug === slug)
}

function normalizeSlugPath(path: string): string {
  const parts: string[] = []
  for (const segment of path.split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') {
      parts.pop()
      continue
    }
    parts.push(segment)
  }
  return parts.join('/')
}

/** 把文章内的相对 .md 链接解析成博客文章路由 */
export function resolveMarkdownPostHref(
  currentSlug: string,
  href: string | undefined
): string | undefined {
  if (!href) return href
  const value = href.trim()
  if (!value || /^([a-z][a-z\d+.-]*:|\/\/)/i.test(value) || value.startsWith('#')) {
    return href
  }

  const suffixIndex = value.search(/[?#]/)
  const pathPart = suffixIndex >= 0 ? value.slice(0, suffixIndex) : value
  const suffix = suffixIndex >= 0 ? value.slice(suffixIndex) : ''
  const normalizedPath = pathPart.replace(/\\/g, '/')
  if (!/\.md$/i.test(normalizedPath)) return href

  const withoutExt = normalizedPath.replace(/\.md$/i, '')
  const targetSlug = withoutExt.startsWith('/')
    ? withoutExt.replace(/^\/+/, '').replace(/^posts\//, '')
    : normalizeSlugPath(
        [...currentSlug.split('/').slice(0, -1), withoutExt].join('/')
      )

  const targetPost = allParsedPosts.find((p) => p.slug === targetSlug)
  if (!targetPost) return href
  return `/posts/${targetPost.slug}${suffix}`
}

/** 标签聚合统计，按出现次数倒序 */
export function getTags() {
  const map = new Map<string, number>()
  for (const p of allPosts) {
    for (const t of p.tags ?? []) {
      map.set(t, (map.get(t) ?? 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

/** 分类聚合统计 */
export function getCategories() {
  const map = new Map<string, number>()
  for (const p of allPosts) {
    if (p.category) map.set(p.category, (map.get(p.category) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

/** 按年份分组归档 */
export function getArchives() {
  const map = new Map<number, Post[]>()
  for (const p of allPosts) {
    const year = p.dateObj.getFullYear()
    if (!map.has(year)) map.set(year, [])
    map.get(year)!.push(p)
  }
  return [...map.entries()]
    .map(([year, posts]) => ({ year, posts }))
    .sort((a, b) => b.year - a.year)
}

/** 把正文中的 [[双链]] 转成普通 Markdown 链接，供 react-markdown 渲染 */
export function renderNoteLinks(markdown: string): string {
  let inCodeBlock = false

  return markdown
    .split('\n')
    .map((line) => {
      if (/^```/.test(line.trim())) {
        inCodeBlock = !inCodeBlock
        return line
      }
      if (inCodeBlock) return line

      return line.replace(
        /\[\[([^\]\|\n]+)(?:\|([^\]\n]+))?\]\]/g,
        (raw, target: string, label?: string) => {
          const normalizedTarget = target.trim().replace(/^\/?posts\//, '')
          const targetPost =
            allParsedPosts.find((post) => post.slug === normalizedTarget) ??
            allParsedPosts.find((post) => post.title === target.trim())
          if (!targetPost) return raw
          return `[${(label ?? targetPost.title).trim()}](/posts/${targetPost.slug})`
        }
      )
    })
    .join('\n')
}

/** 当前文章的反向链接 */
export function getBacklinks(post: Post): Post[] {
  return allPosts.filter((item) =>
    item.noteLinks.some((link) => link.targetSlug === post.slug)
  )
}

/** 知识图谱：只展示公开文章，排除加密文章 */
export function getPostGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const publicSlugs = new Set(allPosts.map((post) => post.slug))
  const nodes = allPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    category: post.category,
    tags: post.tags,
  }))
  const edgeKeys = new Set<string>()
  const edges: GraphEdge[] = []

  for (const post of allPosts) {
    for (const link of post.noteLinks) {
      if (!link.targetSlug || !publicSlugs.has(link.targetSlug)) continue
      const key = `${post.slug}->${link.targetSlug}`
      if (edgeKeys.has(key)) continue
      edgeKeys.add(key)
      edges.push({ source: post.slug, target: link.targetSlug })
    }
  }

  return { nodes, edges }
}

/**
 * 从 Markdown 正文中抽取标题，生成目录(TOC)。
 * 用 github-slugger 生成锚点，与 rehype-slug 渲染时完全一致，
 * 包括对同名标题追加 -1 / -2 后缀的处理，确保目录跳转准确。
 */
export function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split('\n')
  const toc: TocItem[] = []
  const slugger = new GithubSlugger()
  let inCodeBlock = false

  for (const line of lines) {
    const normalizedLine = line.replace(/\r$/, '')
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(normalizedLine)
    if (!match) continue

    const depth = match[1].length
    const text = match[2].replace(/[#*`]/g, '').trim()
    const id = slugger.slug(text)
    toc.push({ depth, id, text })
  }
  return toc
}

/** 简单的相关文章推荐：按共享标签数排序 */
export function getRelatedPosts(post: Post, limit = 3): Post[] {
  const tags = new Set(post.tags ?? [])
  if (tags.size === 0) return []
  return allPosts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      post: p,
      shared: (p.tags ?? []).filter((t) => tags.has(t)).length,
    }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, limit)
    .map((x) => x.post)
}
