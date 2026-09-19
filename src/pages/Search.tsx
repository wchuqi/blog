import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { allCards, allPosts, cardGroupOf, getCardGroups, getCardTags, getTags } from '../lib/posts'
import { buildSearchIndex, findRanges, parseTerms, runSearch, splitByRanges, type SearchDoc, type SearchHit, type SearchScope } from '../lib/search'
import { getTopics } from '../lib/topics'
import { siteConfig } from '../config'
import { formatDate } from '../lib/format'
import type { IndexedDoc } from '../lib/search'

/** 每页条数 */
const PAGE_SIZE = 20

/** 把标题/摘要按命中词高亮。区间计算走 search.ts 的 findRanges，避免和检索逻辑分叉。 */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const parts = useMemo(() => splitByRanges(text, findRanges(text, terms)), [text, terms])
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="search-hit">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  )
}

/** 结果条目 */
function ResultItem({ hit, terms, active }: { hit: SearchHit; terms: string[]; active: boolean }) {
  const { post, snippet, snippetRanges } = hit
  const isCard = post.type === 'card'
  const snippetParts = snippet ? splitByRanges(snippet, snippetRanges) : []
  const group = isCard ? cardGroupOf(post) : null

  return (
    <li className={'search-result' + (active ? ' search-result--active' : '')}>
      <Link to={`/posts/${post.slug}`} className="search-result__link">
        <div className="search-result__head">
          <h3 className="search-result__title">
            <Highlight text={post.title} terms={terms} />
          </h3>
          <span className="search-result__date">{formatDate(post.date)}</span>
        </div>

        {snippet ? (
          <p className="search-result__snippet">
            {snippetParts.map((p, i) =>
              p.hit ? (
                <mark key={i} className="search-hit">
                  {p.text}
                </mark>
              ) : (
                <span key={i}>{p.text}</span>
              )
            )}
          </p>
        ) : (
          post.description && <p className="search-result__snippet">{post.description}</p>
        )}

        <div className="search-result__meta">
          {isCard && <span className="search-result__badge">卡片</span>}
          {group && <span>{group}</span>}
          {post.tags?.slice(0, 4).map((t) => (
            <span key={t} className="search-result__tag">
              # {t}
            </span>
          ))}
        </div>
      </Link>
    </li>
  )
}

/**
 * 搜索结果页（/search?q=…&scope=…&tag=…&path=…&page=…）。
 *
 * 模态（SearchBox）只做快速跳转、限 8 条；要翻页、按标签/主题过滤、
 * 或者搜 10000 张单词卡，就落到这个页面。
 */
export function Search() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const query = params.get('q') ?? ''
  const scope = (params.get('scope') as SearchScope) || 'article'
  const tag = params.get('tag') ?? ''
  const scopePath = params.get('path') ?? ''
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)

  const [localQuery, setLocalQuery] = useState(query)

  // 两份全文索引各自按需加载
  const [articleDocs, setArticleDocs] = useState<IndexedDoc[] | null>(null)
  const [cardDocs, setCardDocs] = useState<IndexedDoc[] | null>(null)

  const needArticles = scope === 'article' || scope === 'all'
  const needCards = scope === 'card' || scope === 'all'

  useEffect(() => {
    if (needArticles && articleDocs === null) {
      import('virtual:posts-search-index').then((m) =>
        setArticleDocs(buildSearchIndex(m.default as SearchDoc[]))
      )
    }
  }, [needArticles, articleDocs])

  useEffect(() => {
    if (needCards && cardDocs === null) {
      import('virtual:cards-search-index').then((m) =>
        setCardDocs(buildSearchIndex(m.default as SearchDoc[]))
      )
    }
  }, [needCards, cardDocs])

  // 查询串同步到输入框（浏览器前进后退时也要跟上）
  useEffect(() => setLocalQuery(query), [query])

  useEffect(() => {
    document.title = query ? `搜索：${query} · ${siteConfig.title}` : `搜索 · ${siteConfig.title}`
    return () => {
      document.title = siteConfig.title
    }
  }, [query])

  const terms = useMemo(() => parseTerms(query), [query])

  const browsing = terms.length === 0 && !!(tag || scopePath)
  const hits = useMemo(() => {
    if (terms.length === 0 && !browsing) return []
    const posts = scope === 'card' ? allCards : scope === 'article' ? allPosts : [...allPosts, ...allCards]
    const bodyIndex = new Map<string, IndexedDoc>()
    if (articleDocs) for (const d of articleDocs) bodyIndex.set(d.slug, d)
    if (cardDocs) for (const d of cardDocs) bodyIndex.set(d.slug, d)

    return runSearch(
      posts.map((post) => ({ post, body: bodyIndex.get(post.slug) })),
      query,
      { tag, scopePath }
    )
  }, [terms, browsing, query, scope, tag, scopePath, articleDocs, cardDocs])

  const loading = (needArticles && articleDocs === null) || (needCards && cardDocs === null)

  const totalPages = Math.max(1, Math.ceil(hits.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const pageHits = hits.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params)
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '') next.delete(k)
        else next.set(k, v)
      }
      // 改筛选条件时回到第一页，否则会停在一个不存在的页码上
      if (!('page' in patch)) next.delete('page')
      setParams(next, { replace: true })
    },
    [params, setParams]
  )

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    update({ q: localQuery })
  }

  // 过滤选项：文章范围用文章标签/主题，卡片范围用卡片标签/分组
  const tagOptions = useMemo(
    () => (scope === 'card' ? getCardTags() : getTags()),
    [scope]
  )
  const pathOptions = useMemo(() => {
    if (scope === 'card') {
      return getCardGroups()
        .filter((g): g is { name: string; count: number } => g.name !== null)
        .map((g) => ({ name: g.name, count: g.count }))
    }
    return getTopics().map((t) => ({ name: t.slug, count: t.totalPosts }))
  }, [scope])

  const scopeTabs: { value: SearchScope; label: string }[] = [
    { value: 'article', label: '文章' },
    { value: 'card', label: '卡片' },
    { value: 'all', label: '全部' },
  ]

  const scopeHint =
    scope === 'card' ? `${allCards.length} 张卡片` : scope === 'all' ? '文章 + 卡片' : `${allPosts.length} 篇文章`

  return (
    <div className="page search-page">
      <h1 className="page__title">搜索</h1>
      <p className="page__subtitle">
        在 {scopeHint} 里检索标题、标签、摘要与正文
        {(tag || scopePath) && ' · 已按筛选条件过滤'}
      </p>

      <form className="search-page__form" onSubmit={submit} role="search">
        <input
          className="search-page__input"
          type="search"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="输入关键词，多个词用空格分隔（全部命中才返回）"
          aria-label="搜索关键词"
          autoFocus
        />
        <button type="submit" className="btn">
          搜索
        </button>
      </form>

      <div className="search-page__filters">
        <div className="search-page__tabs" role="tablist" aria-label="搜索范围">
          {scopeTabs.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={scope === t.value}
              className={'search-page__tab' + (scope === t.value ? ' search-page__tab--active' : '')}
              onClick={() => update({ scope: t.value, tag: null, path: null })}
            >
              {t.label}
            </button>
          ))}
        </div>

        <label className="search-page__select">
          <span>标签</span>
          <select value={tag} onChange={(e) => update({ tag: e.target.value })}>
            <option value="">全部</option>
            {tagOptions.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}（{t.count}）
              </option>
            ))}
          </select>
        </label>

        <label className="search-page__select">
          <span>{scope === 'card' ? '分组' : '主题'}</span>
          <select value={scopePath} onChange={(e) => update({ path: e.target.value })}>
            <option value="">全部</option>
            {pathOptions.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}（{p.count}）
              </option>
            ))}
          </select>
        </label>

        {(tag || scopePath) && (
          <button type="button" className="btn-ghost" onClick={() => update({ tag: null, path: null })}>
            清除筛选
          </button>
        )}
      </div>

      {terms.length === 0 && !browsing ? (
        <p className="empty">
          输入关键词开始搜索，或用上方的标签 / 主题筛选直接浏览。
        </p>
      ) : loading ? (
        <p className="empty">索引加载中…</p>
      ) : (
        <>
          <p className="search-page__count">
            {browsing ? `共 ${hits.length} 篇` : `共 ${hits.length} 条结果`}
            {totalPages > 1 && ` · 第 ${current} / ${totalPages} 页`}
          </p>

          {hits.length === 0 ? (
            <p className="empty">
              没有匹配的内容。
              {scope !== 'all' && (
                <>
                  {' '}
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => update({ scope: 'all', tag: null, path: null })}
                  >
                    扩大到全部范围
                  </button>
                </>
              )}
            </p>
          ) : (
            <ul className="search-results">
              {pageHits.map((hit, i) => (
                <ResultItem key={hit.post.slug} hit={hit} terms={terms} active={i === 0} />
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <nav className="pagination" aria-label="搜索结果分页">
              <button
                type="button"
                className="pagination__btn"
                disabled={current <= 1}
                onClick={() => update({ page: String(current - 1) })}
              >
                上一页
              </button>
              <span className="pagination__page pagination__page--active">{current}</span>
              <button
                type="button"
                className="pagination__btn"
                disabled={current >= totalPages}
                onClick={() => update({ page: String(current + 1) })}
              >
                下一页
              </button>
            </nav>
          )}

          <p className="search-page__hint">
            提示：按 <kbd>Ctrl</kbd>+<kbd>K</kbd> 打开快速搜索，或
            <button type="button" className="btn-ghost" onClick={() => navigate('/topics')}>
              按主题浏览
            </button>
          </p>
        </>
      )}
    </div>
  )
}
