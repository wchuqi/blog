import fm from 'front-matter'
import GithubSlugger from 'github-slugger'
import type { Post, PostFrontmatter, TocItem } from './types'

/**
 * 用 Vite 的 import.meta.glob 在构建时把 src/posts 下所有 .md 文件
 * 以原始字符串的形式静态打包进来。eager: true 表示同步加载。
 */
const modules = import.meta.glob<string>('../posts/*.md', {
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

/** 从文件路径中提取 slug：../posts/hello-world.md -> hello-world */
function slugFromPath(path: string): string {
  return path.split('/').pop()!.replace(/\.md$/, '')
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
    // 按每分钟约 400 字（中英文混合）估算阅读时间，至少 1 分钟
    readingMinutes: Math.max(1, Math.round(words / 400)),
    dateObj: new Date(attributes.date ?? '1970-01-01'),
  }
}

/** 全部文章，按日期倒序；生产环境过滤草稿 */
export const allPosts: Post[] = Object.entries(modules)
  .map(([path, raw]) => parsePost(path, raw as string))
  .filter((p) => (import.meta.env.PROD ? !p.draft : true))
  .sort((a, b) => {
    // 置顶优先
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
    return b.dateObj.getTime() - a.dateObj.getTime()
  })

/** 按 slug 取单篇 */
export function getPost(slug: string): Post | undefined {
  return allPosts.find((p) => p.slug === slug)
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
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = /^(#{1,6})\s+(.*)$/.exec(line)
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
