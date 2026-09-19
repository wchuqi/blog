import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { allCards, allPosts } from '../lib/posts'
import { buildSearchIndex, findRanges, parseTerms, runSearch, splitByRanges } from '../lib/search'
import type { IndexedDoc, SearchDoc, SearchScope } from '../lib/search'
import { formatDate } from '../lib/format'
import type { Post } from '../lib/types'

/** 模态里最多显示几条（要看全部就去 /search 结果页） */
const MODAL_LIMIT = 8

/** 把标题/摘要按命中词高亮。区间计算走 search.ts 的 findRanges，避免和检索逻辑分叉。 */
function Highlighted({ text, terms }: { text: string; terms: string[] }) {
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

/** 站内搜索：点击后弹出模态，支持键盘 ↑↓ 选择、Enter 跳转、Esc 关闭 */
export function SearchBox() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [scope, setScope] = useState<SearchScope>('article')
  // 全文索引按范围分开加载：默认只拉文章索引，切到卡片才拉卡片索引
  const [articleDocs, setArticleDocs] = useState<IndexedDoc[] | null>(null)
  const [cardDocs, setCardDocs] = useState<IndexedDoc[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const needArticles = scope === 'article' || scope === 'all'
  const needCards = scope === 'card' || scope === 'all'

  useEffect(() => {
    if (open && needArticles && articleDocs === null) {
      import('virtual:posts-search-index').then((m) =>
        setArticleDocs(buildSearchIndex(m.default as SearchDoc[]))
      )
    }
  }, [open, needArticles, articleDocs])

  useEffect(() => {
    if (open && needCards && cardDocs === null) {
      import('virtual:cards-search-index').then((m) =>
        setCardDocs(buildSearchIndex(m.default as SearchDoc[]))
      )
    }
  }, [open, needCards, cardDocs])

  const terms = useMemo(() => parseTerms(query), [query])

  const results = useMemo(() => {
    if (terms.length === 0) return []
    const posts =
      scope === 'card' ? allCards : scope === 'article' ? allPosts : [...allPosts, ...allCards]
    const bodyIndex = new Map<string, IndexedDoc>()
    if (articleDocs) for (const d of articleDocs) bodyIndex.set(d.slug, d)
    if (cardDocs) for (const d of cardDocs) bodyIndex.set(d.slug, d)
    return runSearch(
      posts.map((post) => ({ post, body: bodyIndex.get(post.slug) })),
      query
    )
  }, [terms, query, scope, articleDocs, cardDocs])

  const shown = results.slice(0, MODAL_LIMIT)

  // 打开时聚焦输入框
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      // 等待 DOM 渲染后聚焦
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // 全局快捷键：Cmd/Ctrl+K 打开
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Esc 全局关闭：无论焦点在不在输入框（点击遮罩后焦点丢失也能关）
  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  const go = useCallback(
    (post: Post) => {
      navigate(`/posts/${post.slug}`)
      setOpen(false)
    },
    [navigate]
  )

  /** 跳到结果页看全部（带上当前范围与查询） */
  const goAll = useCallback(() => {
    const p = new URLSearchParams({ q: query, scope })
    navigate(`/search?${p.toString()}`)
    setOpen(false)
  }, [navigate, query, scope])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, shown.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && shown[active]) {
      go(shown[active].post)
    }
  }

  const scopeTabs: { value: SearchScope; label: string }[] = [
    { value: 'article', label: '文章' },
    { value: 'card', label: '卡片' },
    { value: 'all', label: '全部' },
  ]

  return (
    <>
      <button
        type="button"
        className="search-trigger"
        onClick={() => setOpen(true)}
        aria-label="搜索文章"
        title="搜索 (Ctrl/Cmd + K)"
      >
        <span className="search-trigger__icon" aria-hidden="true">🔍</span>{' '}
        <span className="search-trigger__hint">搜索</span>
      </button>

      {open && (
        <div className="search-modal" role="dialog" aria-modal="true" aria-label="站内搜索">
          <div className="search-modal__backdrop" onClick={close} />
          <div className="search-modal__panel">
            <input
              ref={inputRef}
              className="search-modal__input"
              type="text"
              placeholder="搜索标题、标签、内容…（多个词用空格分隔）"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={onKeyDown}
            />

            <div className="search-modal__scopes" role="tablist" aria-label="搜索范围">
              {scopeTabs.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  aria-selected={scope === t.value}
                  className={
                    'search-modal__scope' + (scope === t.value ? ' search-modal__scope--active' : '')
                  }
                  onClick={() => {
                    setScope(t.value)
                    setActive(0)
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <ul className="search-modal__results">
              {query && results.length === 0 && (
                <li className="search-modal__empty">
                  {needCards && cardDocs === null ? '索引加载中…' : '没有找到相关内容'}
                </li>
              )}
              {shown.map((hit, i) => (
                <li key={hit.post.slug}>
                  <button
                    type="button"
                    className={
                      'search-modal__item' +
                      (i === active ? ' search-modal__item--active' : '')
                    }
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(hit.post)}
                  >
                    <span className="search-modal__item-body">
                      <span className="search-modal__item-title">
                        <Highlighted text={hit.post.title} terms={terms} />
                      </span>
                      {hit.snippet && (
                        <span className="search-modal__item-snippet">
                          <Highlighted text={hit.snippet} terms={terms} />
                        </span>
                      )}
                    </span>
                    <span className="search-modal__item-date">{formatDate(hit.post.date)}</span>
                  </button>
                </li>
              ))}
            </ul>

            {query && results.length > MODAL_LIMIT && (
              <button type="button" className="search-modal__all" onClick={goAll}>
                查看全部 {results.length} 条结果 →
              </button>
            )}

            <div className="search-modal__footer">
              <kbd>↑</kbd><kbd>↓</kbd> 选择
              <kbd>↵</kbd> 打开
              <kbd>esc</kbd> 关闭
              {query && <span className="search-modal__footer-hint">结果不全？回车搜全部</span>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
