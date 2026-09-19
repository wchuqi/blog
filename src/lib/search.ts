// 站内搜索的纯逻辑层（无 React 依赖，便于单独推演与复用）。
//
// 索引分两份：文章索引（4.1MB / 1.4MB gzip，首次打开搜索时加载）与卡片索引
// （1.8MB / 0.6MB gzip，只在用户真的搜卡片时才加载）。合成一份会让每次搜索
// 都付 2MB gzip 的代价，而 10000 张单词卡对多数搜索是纯噪声。

import type { Post } from './types'

/** 构建期产出的原始文档：text 是去 Markdown 后的纯文本（保留原大小写，供摘要展示） */
export interface SearchDoc {
  slug: string
  text: string
}

/** 客户端索引：lower 只算一次，避免每次按键都对 6MB 文本调 toLowerCase */
export interface IndexedDoc {
  slug: string
  text: string
  lower: string
}

/** 正文摘要里高亮的区间 [start, end) */
export type Range = [number, number]

export interface SearchHit {
  post: Post
  score: number
  /** 正文里命中词附近的片段；正文没命中时为空串 */
  snippet: string
  /** snippet 内需要高亮的区间（相对 snippet 起点） */
  snippetRanges: Range[]
}

/** 检索范围 */
export type SearchScope = 'article' | 'card' | 'all'

export interface SearchFilters {
  /** 标签，空串表示不限 */
  tag?: string
  /**
   * 目录前缀。文章传主题 slug（如 'AI/核心概念/AI RAG'），
   * 卡片传分组 slug（如 '卡片/记忆方法'）。空串表示不限。
   */
  scopePath?: string
}

const WEIGHT_TITLE = 12
const WEIGHT_TAG = 6
const WEIGHT_DESC = 3
const WEIGHT_BODY = 1
/** 命中次数达到这个值就给正文加成，避免长文靠"刷词"压过标题命中 */
const BODY_FREQ_CAP = 6

/** 把构建期文档转成可检索索引（lower 只算一次） */
export function buildSearchIndex(docs: SearchDoc[]): IndexedDoc[] {
  return docs.map((d) => ({ slug: d.slug, text: d.text, lower: d.text.toLowerCase() }))
}

/** 把查询切成词：按空白切分，丢掉空串 */
export function parseTerms(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

/**
 * 查询词的等价写法。
 *
 * 索引侧保留下划线（`tool_call` 不被改成 `tool call`），
 * 但正文里也确实会写「tool call」这种散文形式。
 * 所以带下划线的词同时用「原形」和「下划线当空格」两种形式去匹配，
 * `tool_call` 与 `tool call` 才能互相搜到。
 */
function termVariants(term: string): string[] {
  if (!term.includes('_')) return [term]
  return [term, term.replace(/_/g, ' ')]
}

/** 命中判定：任一变体出现在 haystack 里就算命中 */
function matchesTerm(haystack: string, term: string): boolean {
  return termVariants(term).some((v) => haystack.includes(v))
}

/** 转义正则元字符，避免用户输入的 `(`、`*` 等把高亮正则搞崩 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 找出 text 中所有命中词的区间并合并重叠部分。
 * 用于把标题/摘要切成"普通段 + 高亮段"。
 */
export function findRanges(text: string, terms: string[]): Range[] {
  if (!text || terms.length === 0) return []
  const lower = text.toLowerCase()
  const ranges: Range[] = []
  for (const term of terms) {
    // 每个变体都要找：正文可能写 `tool_call` 也可能写 `tool call`
    for (const variant of termVariants(term)) {
      const re = new RegExp(escapeRegExp(variant), 'g')
      for (const m of lower.matchAll(re)) {
        ranges.push([m.index, m.index + variant.length])
      }
    }
  }
  if (ranges.length === 0) return []
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  // 合并重叠/相邻区间，否则渲染时会切出嵌套片段
  const merged: Range[] = [ranges[0]]
  for (const [start, end] of ranges.slice(1)) {
    const last = merged[merged.length - 1]
    if (start <= last[1]) last[1] = Math.max(last[1], end)
    else merged.push([start, end])
  }
  return merged
}

/**
 * 把文本按区间切成片段，供 React 渲染（返回结构化片段而不是 HTML 字符串，
 * 避免正文里的 `<` 之类被当成标签）。
 */
export function splitByRanges(
  text: string,
  ranges: Range[]
): { text: string; hit: boolean }[] {
  if (ranges.length === 0) return text ? [{ text, hit: false }] : []
  const out: { text: string; hit: boolean }[] = []
  let cursor = 0
  for (const [start, end] of ranges) {
    if (start > cursor) out.push({ text: text.slice(cursor, start), hit: false })
    out.push({ text: text.slice(start, end), hit: true })
    cursor = end
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), hit: false })
  return out
}

/** 摘要窗口：命中词前后各留多少字符 */
const SNIPPET_BEFORE = 24
const SNIPPET_AFTER = 90

/**
 * 从正文里截一段包含命中词的摘要。
 * 截断处尽量对齐到空格，避免把英文单词切成两半；中文没有空格则直接截。
 */
export function makeSnippet(
  text: string,
  ranges: Range[]
): { snippet: string; snippetRanges: Range[] } {
  if (!text || ranges.length === 0) return { snippet: '', snippetRanges: [] }
  const [firstStart, firstEnd] = ranges[0]

  let start = Math.max(0, firstStart - SNIPPET_BEFORE)
  if (start > 0) {
    // 往前找最近的空格，让摘要从词边界开始
    const space = text.lastIndexOf(' ', start)
    if (space >= 0 && firstStart - space < SNIPPET_BEFORE * 2) start = space + 1
  }
  let end = Math.min(text.length, firstEnd + SNIPPET_AFTER)
  if (end < text.length) {
    const space = text.indexOf(' ', end)
    if (space >= 0 && space - end < 30) end = space
  }

  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  const snippet = prefix + text.slice(start, end) + suffix

  // 把原区间平移到 snippet 坐标系，并裁掉窗口外的部分
  const offset = start - prefix.length
  const snippetRanges = ranges
    .map(([s, e]): Range => [s - offset, e - offset])
    .filter(([s, e]) => e > 0 && s < snippet.length)
    .map(([s, e]): Range => [Math.max(0, s), Math.min(snippet.length, e)])

  return { snippet, snippetRanges }
}

/** 统计 term 在 haystack 里出现的次数（用于正文加成） */
function countOccurrences(haystack: string, term: string): number {
  let count = 0
  let from = 0
  for (;;) {
    const i = haystack.indexOf(term, from)
    if (i === -1) return count
    count += 1
    from = i + term.length
  }
}

interface Candidate {
  post: Post
  /** 正文纯文本；卡片索引未加载时为 undefined */
  body?: IndexedDoc
}

/**
 * 检索。
 *
 * 语义是 AND：所有词都要在「标题 + 标签 + 摘要 + 正文」里出现才算命中。
 * 旧实现是 OR（命中任一词即返回），在 11353 篇的语料上会把结果淹掉。
 *
 * 没有关键词但带了筛选条件时，退化成「浏览模式」：返回所有符合筛选的项，
 * 按日期倒序。这样 /search 也能当按标签/主题/分组浏览的入口用。
 */
export function runSearch(
  candidates: Candidate[],
  query: string,
  filters: SearchFilters = {}
): SearchHit[] {
  const terms = parseTerms(query)
  const browsing = terms.length === 0
  if (browsing && !filters.tag && !filters.scopePath) return []

  const hits: SearchHit[] = []

  for (const { post, body } of candidates) {
    if (filters.tag && !(post.tags ?? []).includes(filters.tag)) continue
    if (filters.scopePath) {
      const inScope =
        post.slug === filters.scopePath || post.slug.startsWith(filters.scopePath + '/')
      if (!inScope) continue
    }

    if (browsing) {
      hits.push({ post, score: 0, snippet: '', snippetRanges: [] })
      continue
    }

    const title = post.title
    const titleLower = title.toLowerCase()
    const tagsLower = (post.tags ?? []).join(' ').toLowerCase()
    const desc = post.description ?? ''
    const descLower = desc.toLowerCase()
    const bodyLower = body?.lower ?? ''

    // 所有词都必须出现（AND）
    const haystack = titleLower + ' ' + tagsLower + ' ' + descLower + ' ' + bodyLower
    if (!terms.every((t) => matchesTerm(haystack, t))) continue

    let score = 0
    for (const term of terms) {
      if (termVariants(term).some((v) => titleLower.includes(v))) {
        score += WEIGHT_TITLE
        // 标题以该词开头，相关性更高
        if (termVariants(term).some((v) => titleLower.startsWith(v))) score += 4
      }
      if (termVariants(term).some((v) => tagsLower.includes(v))) score += WEIGHT_TAG
      if (termVariants(term).some((v) => descLower.includes(v))) score += WEIGHT_DESC
      if (bodyLower) {
        const freq = termVariants(term).reduce(
          (sum, v) => sum + countOccurrences(bodyLower, v),
          0
        )
        if (freq > 0) score += WEIGHT_BODY + Math.min(freq, BODY_FREQ_CAP) * 0.5
      }
    }

    // 摘要只从正文里取（正文没命中时留空，前端退化为展示 description）
    const bodyRanges = body ? findRanges(body.text, terms) : []
    const { snippet, snippetRanges } = makeSnippet(body?.text ?? '', bodyRanges)

    hits.push({ post, score, snippet, snippetRanges })
  }

  return hits.sort((a, b) => b.score - a.score || (b.post.date || '').localeCompare(a.post.date || ''))
}
