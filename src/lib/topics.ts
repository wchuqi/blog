// 主题（Topic / MOC）—— 把 src/posts 的目录结构识别成可导航的知识地图。
//
// 约定：一个目录只要含 `<任意名>学习资料.md`，它就是一个主题目录。
// 这类文件是作者手写的主题入口页，正文里已经用相对 .md 链接列全了本主题的文章——
// 也就是说"知识库的目录"本来就在正文里写着，只是原先它和 1355 篇按日期排序的文章
// 混在同一个列表里，被淹没了。这里把它提升成站点的一级导航。
//
// 主题可以嵌套：`Python` 和 `Python/FastApi` 都是主题，前者把后者当子主题展示。
// 一篇文章只归属"最深的那个包含它的主题"，所以不会在父子主题里重复出现。

import { allPosts } from './posts'
import type { Post } from './types'

/** 索引文章命名后缀：命中即视为主题入口页，不算主题的"正文文章" */
const INDEX_SUFFIXES = ['学习资料', '学习路线图'] as const

/** 子目录名 → 展示名。`study-material` 是历史遗留的英文目录名，展示时中文化 */
const SECTION_ALIASES: Record<string, string> = {
  'study-material': '学习材料',
}

/** /topics 页的分类顺序；未列出的分类排在后面按名称排序 */
const GROUP_ORDER = [
  'AI',
  '开发语言',
  '框架',
  '架构',
  '数据库',
  '工具&中间件',
  '运维',
  '算法',
  '英语',
]

export interface TopicSection {
  /** 主题目录下的子路径，如 'study-material/面试知识点'；空串 = 直接放在主题目录下 */
  path: string
  /** 展示名，如 '学习材料 / 面试知识点' */
  label: string
  posts: Post[]
}

export interface Topic {
  /** 目录 slug，同时是路由参数，如 'AI/核心概念/AI RAG' */
  slug: string
  /** 主题名 = 目录名，如 'AI RAG' */
  name: string
  /** 顶层分类 = slug 第一段，如 'AI'；/topics 按它分组 */
  group: string
  /** 中间层目录，如 ['核心概念']；不含顶层分类（顶层分类见 group） */
  parents: string[]
  /** 主题描述，取自索引文章的 description */
  description?: string
  /** 全部索引页（同一目录可能有多套，如 SpringBoot / SpringBoot4） */
  indexes: Post[]
  /** 主入口页：目录名同名的"学习资料"优先，否则取第一个索引页 */
  index?: Post
  /** 主题直属文章（不含索引页、不含子主题），按日期倒序 */
  posts: Post[]
  /** posts 按子路径分组，学习材料排在前面 */
  sections: TopicSection[]
  /** 直接子主题 */
  subtopics: Topic[]
  /** 含子主题的文章总数 */
  totalPosts: number
  /** 含子主题的总字数 */
  words: number
  /** 含子主题的最近更新日期 */
  latest?: string
}

/** 文件名是主题入口页则返回去掉后缀的主题名，否则 null */
function indexNameOf(fileName: string): string | null {
  for (const suffix of INDEX_SUFFIXES) {
    if (fileName.length > suffix.length && fileName.endsWith(suffix)) {
      return fileName.slice(0, fileName.length - suffix.length)
    }
  }
  return null
}

/** slug 的最后一段（文件名或最深层目录名） */
function lastSegment(slug: string): string {
  return slug.slice(slug.lastIndexOf('/') + 1)
}

function sectionLabel(path: string): string {
  return path
    .split('/')
    .map((segment) => SECTION_ALIASES[segment] ?? segment)
    .join(' / ')
}

/** 分组展示顺序：先按 GROUP_ORDER，再按剩余分组名称 */
function groupRank(name: string): number {
  const i = GROUP_ORDER.indexOf(name)
  return i === -1 ? GROUP_ORDER.length : i
}

export function compareTopics(a: Topic, b: Topic): number {
  const byGroup = groupRank(a.group) - groupRank(b.group)
  if (byGroup !== 0) return byGroup
  if (a.group !== b.group) return a.group.localeCompare(b.group)
  return a.slug.localeCompare(b.slug)
}

function buildTopics(): Topic[] {
  // 1. 找出主题目录：含入口页的目录
  const indexesByDir = new Map<string, Post[]>()
  for (const post of allPosts) {
    const slash = post.slug.lastIndexOf('/')
    if (slash === -1) continue
    if (!indexNameOf(post.slug.slice(slash + 1))) continue
    const dir = post.slug.slice(0, slash)
    const list = indexesByDir.get(dir)
    if (list) list.push(post)
    else indexesByDir.set(dir, [post])
  }

  // 2. 每篇文章归属"最深的包含它的主题"。按长度倒序，第一个命中的前缀就是最深主题。
  const dirsByDepth = [...indexesByDir.keys()].sort((a, b) => b.length - a.length)
  const ownerOf = (slug: string): string | null => {
    for (const dir of dirsByDepth) {
      if (slug === dir || slug.startsWith(dir + '/')) return dir
    }
    return null
  }

  const membersByDir = new Map<string, Post[]>(dirsByDepth.map((dir) => [dir, []]))

  // 3. 先建出所有空壳主题（子主题归属要等主题表建完才知道）
  const shell = new Map<string, Topic>()
  for (const dir of indexesByDir.keys()) {
    const name = lastSegment(dir)
    const parents = dir.split('/').slice(0, -1)
    const indexes = [...(indexesByDir.get(dir) ?? [])].sort((a, b) =>
      a.slug.localeCompare(b.slug)
    )
    shell.set(dir, {
      slug: dir,
      name,
      group: parents[0] ?? dir,
      parents: parents.slice(1),
      description: indexes.find((p) => p.description)?.description,
      indexes,
      index: indexes.find((p) => indexNameOf(lastSegment(p.slug)) === name) ?? indexes[0],
      posts: [],
      sections: [],
      subtopics: [],
      totalPosts: 0,
      words: 0,
      latest: undefined,
    })
  }

  // 4. 把文章分发到各自归属的主题
  for (const post of allPosts) {
    const owner = ownerOf(post.slug)
    if (!owner) continue
    membersByDir.get(owner)!.push(post)
  }

  // 5. 同一目录下的子主题：父主题是它自己目录链上最深的那个主题
  for (const dir of indexesByDir.keys()) {
    const parent = ownerOf(dir.slice(0, dir.lastIndexOf('/')))
    if (parent && parent !== dir) shell.get(parent)!.subtopics.push(shell.get(dir)!)
  }

  // 6. 组内文章：剔掉索引页，按子路径分段
  for (const [dir, members] of membersByDir) {
    const topic = shell.get(dir)!
    const indexSlugs = new Set(topic.indexes.map((p) => p.slug))
    const posts = members
      .filter((p) => !indexSlugs.has(p.slug))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    topic.posts = posts

    const byPath = new Map<string, Post[]>()
    for (const post of posts) {
      const rel = post.slug.slice(dir.length + 1)
      const slash = rel.lastIndexOf('/')
      const path = slash === -1 ? '' : rel.slice(0, slash)
      const list = byPath.get(path)
      if (list) list.push(post)
      else byPath.set(path, [post])
    }
    topic.sections = [...byPath.entries()]
      .map(([path, list]) => ({ path, label: path ? sectionLabel(path) : '直属文章', posts: list }))
      // 学习材料是主体，放最前；其余的按路径名排；"直属文章"垫底
      .sort((a, b) => {
        if (a.path === '') return 1
        if (b.path === '') return -1
        if (a.path === 'study-material') return -1
        if (b.path === 'study-material') return 1
        return a.path.localeCompare(b.path)
      })
  }

  // 7. 汇总统计：先算子主题（已经建完），再累加到父主题
  const topics = [...shell.values()]
  for (const topic of topics) {
    topic.subtopics.sort(compareTopics)
    topic.totalPosts = topic.posts.length + topic.subtopics.reduce((n, t) => n + t.totalPosts, 0)
    topic.words = topic.posts.reduce((n, p) => n + p.words, 0) +
      topic.subtopics.reduce((n, t) => n + t.words, 0)
    const dates = [
      ...topic.posts.map((p) => p.date),
      ...topic.subtopics.map((t) => t.latest),
    ].filter((d): d is string => !!d)
    topic.latest = dates.sort().slice(-1)[0]
  }

  return topics.sort(compareTopics)
}

let cached: Topic[] | null = null

/** 全部主题（模块级缓存，构建期索引是静态的） */
export function getTopics(): Topic[] {
  return (cached ??= buildTopics())
}

/** 按目录 slug 取主题 */
export function getTopic(slug: string): Topic | undefined {
  return getTopics().find((t) => t.slug === slug)
}

/**
 * 一篇文章所属的主题（最深包含它的那个）。
 * 父主题也算命中——`Python/FastApi` 下的文章会先返回 FastApi，
 * 找不到才回退到 Python。用于 PostDetail 的面包屑。
 */
export function getTopicOf(slug: string): Topic | undefined {
  const topics = getTopics()
  const candidates = topics
    .filter((t) => slug === t.slug || slug.startsWith(t.slug + '/'))
    .sort((a, b) => b.slug.length - a.slug.length)
  return candidates[0]
}

/** /topics 页的分组：按 GROUP_ORDER 排序，组内按 slug 排序 */
export function getTopicGroups(): { name: string; topics: Topic[] }[] {
  const map = new Map<string, Topic[]>()
  for (const topic of getTopics()) {
    const list = map.get(topic.group)
    if (list) list.push(topic)
    else map.set(topic.group, [topic])
  }
  return [...map.entries()]
    .map(([name, topics]) => ({ name, topics }))
    .sort((a, b) => groupRank(a.name) - groupRank(b.name) || a.name.localeCompare(b.name))
}

export interface TopicStats {
  /** 主题总数 */
  topics: number
  /** 落在某个主题下的文章数 */
  coveredPosts: number
  /** 没有归属主题的文章数（根目录文章、source_code 等） */
  uncoveredPosts: number
}

let statsCache: TopicStats | null = null

/** 主题覆盖率统计。主题之间互不重叠（一篇文章只有一个归属主题），所以直接求和即可。 */
export function getTopicStats(): TopicStats {
  if (statsCache) return statsCache
  const topics = getTopics()
  let coveredPosts = 0
  for (const topic of topics) coveredPosts += topic.posts.length
  statsCache = {
    topics: topics.length,
    coveredPosts,
    uncoveredPosts: allPosts.length - coveredPosts,
  }
  return statsCache
}

/** 没有归属主题的文章，按顶层目录聚合——保证任何一篇都不会在 /topics 里彻底看不到 */
export function getUntopicedGroups(): { name: string; count: number }[] {
  const map = new Map<string, number>()
  for (const post of allPosts) {
    if (getTopicOf(post.slug)) continue
    const slash = post.slug.indexOf('/')
    const name = slash === -1 ? '根目录' : post.slug.slice(0, slash)
    map.set(name, (map.get(name) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}
