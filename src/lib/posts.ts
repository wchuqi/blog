import GithubSlugger from 'github-slugger'
import indexData from 'virtual:posts-index'
import { absoluteSlugFor, normalizeLinkTarget } from './link-path'
import type {
  GraphEdge,
  GraphNode,
  NoteLink,
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

/**
 * 把 md 链接的相对目标展开成绝对 slug（规则见 lib/link-path.ts）。
 * 纯文件名（不含 `/`）交给调用方的宽松匹配兜底。
 */
function resolveExactSlug(currentSlug: string, bySlug: Map<string, Post>, target: string) {
  const resolved = absoluteSlugFor(currentSlug, target)
  return resolved ? bySlug.get(resolved) : undefined
}

/**
 * 解析单条链接指向的 slug。
 *
 * 两条完全不同的路径，不能混着套后缀匹配：
 *   wiki —— 沿用宽松匹配（slug / 标题 / 后缀），因为 `[[00-总览与心智模型]]` 这种写法依赖后缀
 *   md   —— 必须严格按“来源目录 + 相对路径”算出唯一 slug，算不出就算断链
 *
 * md 链接为什么不能后缀匹配：41 个主题各有一个 `study-material/00-总览与心智模型.md`，
 * 后缀匹配会命中任意一个（通常不是当前主题的）。宁可断链也不要连错边——错误的边会污染图谱。
 */
function resolveLinkTarget(
  posts: Post[],
  bySlug: Map<string, Post>,
  currentSlug: string,
  link: NoteLink
): string | undefined {
  if (link.kind === 'md') {
    return resolveExactSlug(currentSlug, bySlug, link.target)?.slug
  }
  return findPostByLink(posts, link.target)?.slug
}

function resolveNoteLinks(posts: Post[]): Post[] {
  // md 链接的解析是精确 slug 查找，用 Map 而不是数组扫描：
  // 全站 ~3100 条 md 链接 × ~11000 篇文章，数组扫描会在页面加载时阻塞好几秒。
  const bySlug = new Map(posts.map((post) => [post.slug, post]))
  return posts.map((post) => ({
    ...post,
    noteLinks: post.noteLinks.map((link) => ({
      ...link,
      targetSlug: resolveLinkTarget(posts, bySlug, post.slug, link),
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

/** slug -> 文章，供需要精确匹配的场景使用 */
let postBySlug: Map<string, Post> | null = null
function getPostBySlug(): Map<string, Post> {
  return (postBySlug ??= new Map(parsedPosts.map((post) => [post.slug, post])))
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
  // react-markdown 传进来的 href 是 percent-encoded 的，slug 是原始中文，必须先解码
  const target = normalizeLinkTarget(pathPart)
  if (!target) return href

  // 优先按“来源目录 + 相对路径”精确解析（和 md 链接建边用的是同一套规则），
  // 命中不了再退回宽松匹配（允许省略目录前缀、按标题引用）
  const targetPost =
    resolveExactSlug(currentSlug, getPostBySlug(), target) ??
    findPostByLink(parsedPosts, target)
  if (!targetPost) {
    console.warn(`[resolveMarkdownPostHref] 找不到目标文章: ${target}, 当前文章: ${currentSlug}, 原始链接: ${href}`)
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

/**
 * 当前文章的出链：本文指向了哪些笔记。
 *
 * 只保留解析成功的链接（`targetSlug` 存在）、去掉自链与重复项，
 * 同一篇被引用多次只算一条。按文章列表顺序（置顶优先 + 日期倒序）返回，
 * 保证列表稳定。
 */
export function getOutgoingLinks(post: Post): Post[] {
  const seen = new Set<string>()
  const out: Post[] = []
  for (const link of post.noteLinks) {
    const slug = link.targetSlug
    if (!slug || slug === post.slug || seen.has(slug)) continue
    seen.add(slug)
    const target = getPost(slug)
    if (target) out.push(target)
  }
  // 按 allPosts 的顺序排，与反向链接列表的观感一致
  const order = new Map(allPosts.map((p, i) => [p.slug, i]))
  return out.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0))
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

/**
 * 「页面类型」标签：表达这篇是什么形态的页面（索引页 / 路线图 / 练习 / 面试题），
 * 而不是它在讲什么主题。
 *
 * 必须从相关性计算里排除。反例：`学习资料总览` 只出现在 41 篇索引页上，
 * IDF 权重最高（3.50），于是 Redis 索引页的“相关文章”变成了 Docker / Git / Maven
 * 的索引页——它们同为“索引页”，但主题毫无关系。
 *
 * 同理，“深度解析”（247 篇）、“面试”（278 篇）也是横切维度。
 */
const PAGE_TYPE_TAGS = new Set([
  '学习资料总览',
  '学习路线图',
  '深度解析',
  '面试',
  '实践练习',
  '综合练习',
  '知识点清单',
])

/** 取文章的“主题标签”：剔除页面类型标签后的剩余标签 */
function topicTagsOf(post: Post): string[] {
  return (post.tags ?? []).filter((t) => !PAGE_TYPE_TAGS.has(t))
}

/**
 * 相关文章推荐。
 *
 * 两个要点，都是被实际数据教出来的：
 *
 * 1. **不能等权计数**：标签是层级路径式的（`AI / 核心概念 / AI RAG`），
 *    等权时共享「开发语言」（368 篇）与共享「AI RAG」（30 篇）得分一样，
 *    `Python学习资料` 会推荐 Java / Java设计模式 / JVM。用 log(N/df) 加权后才收敛。
 * 2. **要剔除页面类型标签**：否则 IDF 会把“同为索引页”当成最强相似信号
 *    （`学习资料总览` idf=3.50），Redis 索引页会推荐 Docker / Git / Maven。
 *
 * 另加一条同目录加成：同一目录（同一主题）下的文章优先。
 */
export function getRelatedPosts(post: Post, limit = 3): Post[] {
  const tags = new Set(topicTagsOf(post))
  const ownDir = post.slug.includes('/') ? post.slug.slice(0, post.slug.lastIndexOf('/')) : ''

  // 文档频率：有多少篇文章带这个标签（只统计主题标签）
  const df = new Map<string, number>()
  for (const p of allPosts) {
    for (const t of topicTagsOf(p)) df.set(t, (df.get(t) ?? 0) + 1)
  }
  const total = allPosts.length
  const idf = (tag: string) => Math.log(total / (df.get(tag) ?? 1))

  return allPosts
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      const shared = topicTagsOf(p).filter((t) => tags.has(t))
      const sameDir =
        ownDir && (p.slug === ownDir || p.slug.startsWith(ownDir + '/')) ? 1 : 0
      // 同目录给一个与标签权重同量级的加成（典型 idf 约 2~4）
      const score = shared.reduce((sum, t) => sum + idf(t), 0) + sameDir * 3
      return { post: p, score, hasSignal: shared.length > 0 || sameDir > 0 }
    })
    .filter((x) => x.hasSignal)
    .sort((a, b) => b.score - a.score)
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
