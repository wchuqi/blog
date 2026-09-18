import GithubSlugger from 'github-slugger'
import indexData from 'virtual:posts-index'
import type {
  GraphEdge,
  GraphNode,
  Post,
  ReviewSnapshot,
  TocItem,
} from './types'
import type { IndexEntry } from './types'

/**
 * 文章正文按需加载：构建时每个 .md 是一个独立 chunk，
 * 只有调用 getPostContent 时才会拉取对应文件。
 * 元数据（标题/标签/双链/复习快照等）来自 virtual:posts-index，主包内同步可用。
 */
const contentLoaders = import.meta.glob<string>('../posts/**/*.md', {
  query: '?raw',
  import: 'default',
})

const loaderBySlug = new Map(
  Object.entries(contentLoaders).map(([file, load]) => [slugFromPath(file), load])
)

const contentCache = new Map<string, Promise<string>>()

/**
 * 拦截 import.meta.glob 的 HMR 更新，防止 .md 文件被 API 修改时
 * 触发整页刷新或组件重挂载（导致 PostDetail 的 inReview 等本地状态丢失）。
 */
if (import.meta.hot) {
  import.meta.hot.accept()
}

/** 加载单篇文章的 Markdown 原文（带缓存）；slug 不存在则返回 undefined */
export function getPostContent(slug: string): Promise<string | undefined> {
  const loader = loaderBySlug.get(slug)
  if (!loader) return Promise.resolve(undefined)
  if (!contentCache.has(slug)) {
    contentCache.set(
      slug,
      loader().then((raw) => raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, ''))
    )
  }
  return contentCache.get(slug)!
}

/**
 * 把 glob key 转成路由 slug：去掉前缀与扩展名。
 *   ../posts/hello-world.md        -> hello-world      （根目录文章，保持原样）
 *   ../posts/tech/hello.md         -> tech/hello        （子目录文章，带目录前缀）
 */
function slugFromPath(path: string): string {
  return path
    .replace(/^.*\/posts\//, '')
    .replace(/\.md$/, '')
}

function entryToPost(entry: IndexEntry): Post {
  return {
    ...entry,
    dateObj: new Date(entry.date ?? '1970-01-01'),
    noteLinks: entry.noteLinks ?? [],
  }
}

/**
 * 按双链目标查找文章，依次尝试：
 *   1. 完整 slug（可带 /posts/ 前缀）
 *   2. frontmatter 标题精确匹配
 *   3. slug 后缀匹配（允许省略目录前缀，直接用中文文件名引用）
 */
function findPostByLink(posts: Post[], target: string): Post | undefined {
  const normalized = target.replace(/^\/?posts\//, '')
  return (
    posts.find((post) => post.slug === normalized) ??
    posts.find((post) => post.title === target) ??
    posts.find((post) => post.slug.endsWith('/' + normalized))
  )
}

function resolveNoteLinks(posts: Post[]): Post[] {
  return posts.map((post) => ({
    ...post,
    noteLinks: post.noteLinks.map((link) => ({
      ...link,
      targetSlug: findPostByLink(posts, link.target)?.slug,
    })),
  }))
}

/**
 * 全部文章（含加密文章），按日期倒序；生产环境过滤草稿。
 * 这是内部完整集合，仅供 getPost 用——加密文章不进列表，但可通过直链访问。
 */
const parsedPosts: Post[] = resolveNoteLinks(indexData.map(entryToPost))
  .filter((p) => (import.meta.env.PROD ? !p.draft : true))
  .sort((a, b) => {
    // 置顶优先
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
    return b.dateObj.getTime() - a.dateObj.getTime()
  })

/**
 * 对外暴露的文章集合：排除加密文章与问答卡片。
 * 这样首页/归档/标签/分类/搜索侧边栏等所有消费者都不需要单独判断，
 * 加密文章与卡片自然不会出现在任何列表里；卡片有自己的复习入口 /cards，
 * 两者均可通过直链 /posts/xxx 访问。
 */
export const allPosts: Post[] = parsedPosts.filter((p) => !p.encrypted && p.type !== 'card')

/** 全部问答卡片（排除加密），不混入文章列表 */
export const allCards: Post[] = parsedPosts.filter((p) => !p.encrypted && p.type === 'card')

/** 按 slug 取单篇（从完整集合查，所以直链能命中加密文章） */
export function getPost(slug: string): Post | undefined {
  return parsedPosts.find((p) => p.slug === slug)
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

  const targetPost = findPostByLink(parsedPosts, targetSlug)
  if (!targetPost) {
    console.warn(`[resolveMarkdownPostHref] 找不到目标文章: ${targetSlug}, 当前文章: ${currentSlug}, 原始链接: ${href}`)
    return href
  }
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

/** 把正文中的 [[双链]] 转成普通 Markdown 链接，供 react-markdown 渲染（跳过代码块与行内代码） */
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

      // 行内代码（`...`）中的 [[..]] 不是双链，只转换反引号外的片段
      const segments = line.split('`')
      const converted = segments.map((segment, i) =>
        i % 2 === 0 ? convertLine(segment) : segment
      )
      return converted.join('`')
    })
    .join('\n')

  function convertLine(line: string): string {
    return line.replace(
      /\[\[([^\]\|\n]+)(?:\|([^\]\n]+))?\]\]/g,
      (raw, target: string, label?: string) => {
        const targetPost = findPostByLink(parsedPosts, target.trim())
        if (!targetPost) return raw
        return `[${(label ?? targetPost.title).trim()}](/posts/${targetPost.slug})`
      }
    )
  }
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

// ---------------------------------------------------------------------------
// 遗忘曲线复习系统：基于 frontmatter 快照的纯静态计算
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** 取"今天"零点的 Date（只关心日期，不关心时刻） */
function today(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** 把日期字符串/Date 归一到当天零点 */
function startOfDay(value: string | Date): Date {
  const d = typeof value === 'string' ? new Date(value) : new Date(value)
  d.setHours(0, 0, 0, 0)
  return d
}

/** 两个日期之间的天数差（向下取整） */
function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / MS_PER_DAY)
}

/**
 * 记忆保留率 R = e^(-t/s)。
 * t = 自上次复习经过的天数，s = 记忆稳定性，用当前 interval 当作 s。
 * 没复习过的文章（interval=0）保留率视为 0。
 */
export function retentionRate(review: ReviewSnapshot | undefined, now = today()): number {
  if (!review || !review.interval || review.interval <= 0) return 0
  const last = startOfDay(review.lastReview)
  const t = Math.max(0, daysBetween(now, last))
  return Math.exp(-t / review.interval)
}

/** 下次复习日期 = lastReview + interval 天 */
export function nextReviewDate(review: ReviewSnapshot | undefined): Date | null {
  if (!review || !review.lastReview) return null
  const last = startOfDay(review.lastReview)
  return new Date(last.getTime() + (review.interval || 0) * MS_PER_DAY)
}

/** 距离下次复习的天数（负数=已逾期，null=无复习数据） */
export function daysUntilDue(review: ReviewSnapshot | undefined, now = today()): number | null {
  const next = nextReviewDate(review)
  if (!next) return null
  return daysBetween(next, now)
}

/** 文章是否参与复习系统 */
export function isInReviewPool(post: Post): boolean {
  return !post.encrypted && !post.draft && !post.noReview
}

/**
 * 取文章开始记忆的日期：优先 review.created，否则回退 frontmatter.date。
 * 返回 null 表示该文章不应该进复习池（没 date 也没 created）。
 */
export function reviewCreatedDate(post: Post): Date | null {
  if (post.review?.created) return startOfDay(post.review.created)
  if (post.date) return startOfDay(post.date)
  return null
}

/** 复习池：所有参与复习的文章，按下次复习日升序（最早该复习的排前面） */
export function getReviewPool(): Post[] {
  return allPosts
    .filter(isInReviewPool)
    .filter((p) => reviewCreatedDate(p) !== null)
    .sort((a, b) => {
      const da = daysUntilDue(a.review) ?? Infinity
      const db = daysUntilDue(b.review) ?? Infinity
      return da - db
    })
}

/** 今日待复习的文章（dueIn <= 0） */
export function getDueToday(): Post[] {
  return getReviewPool().filter((p) => {
    const due = daysUntilDue(p.review)
    return due !== null && due <= 0
  })
}

// ---------------------------------------------------------------------------
// 问答卡片（type: card）的复习池：算法与文章一致，只是独立成流
// ---------------------------------------------------------------------------

/** 卡片复习池：按下次复习日升序 */
export function getCardPool(): Post[] {
  return allCards
    .filter(isInReviewPool)
    .filter((p) => reviewCreatedDate(p) !== null)
    .sort((a, b) => {
      const da = daysUntilDue(a.review) ?? Infinity
      const db = daysUntilDue(b.review) ?? Infinity
      return da - db
    })
}

/**
 * 今日到期的卡片（含从未 sync 过的新卡：没有 review 快照即视为新卡，直接到期）。
 * 与文章的 getDueToday 不同——卡片生命周期短，新卡应当立刻进复习队列。
 */
export function getDueCards(): Post[] {
  return getCardPool().filter((p) => {
    if (!p.review) return true
    const due = daysUntilDue(p.review)
    return due === null || due <= 0
  })
}

/** 卡片的分组 = 文件所在子目录（slug 的目录前缀）；根目录卡片为 null（未分组） */
export function cardGroupOf(card: Post): string | null {
  const idx = card.slug.lastIndexOf('/')
  return idx === -1 ? null : card.slug.slice(0, idx)
}

/** 卡片分组聚合（null = 未分组），按名称排序 */
export function getCardGroups(): { name: string | null; count: number }[] {
  const map = new Map<string | null, number>()
  for (const c of allCards) {
    const g = cardGroupOf(c)
    map.set(g, (map.get(g) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
}

/** 卡片标签聚合（与文章 tags 字段同一来源，但独立统计，不进文章 /tags 页） */
export function getCardTags(): { name: string; count: number }[] {
  const map = new Map<string, number>()
  for (const c of allCards) {
    for (const t of c.tags ?? []) {
      map.set(t, (map.get(t) ?? 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}
