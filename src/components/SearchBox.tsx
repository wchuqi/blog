import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { allPosts } from '../lib/posts'
import { formatDate } from '../lib/format'
import type { Post } from '../lib/types'

type SearchDoc = { slug: string; text: string }

/** 在标题、摘要、标签、正文中做大小写不敏感的包含匹配并打分 */
function search(query: string, docs: SearchDoc[] | null): Post[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/)
  const bodyMap = docs ? new Map(docs.map((d) => [d.slug, d.text])) : null

  return allPosts
    .map((post) => {
      const title = post.title.toLowerCase()
      const desc = (post.description ?? '').toLowerCase()
      const tags = (post.tags ?? []).join(' ').toLowerCase()

      let score = 0
      for (const term of terms) {
        if (title.includes(term)) score += 10
        if (tags.includes(term)) score += 5
        if (desc.includes(term)) score += 3
        // 全文索引是独立 chunk，首次打开搜索时才开始加载；未就绪前只搜元数据
        if (bodyMap?.get(post.slug)?.includes(term)) score += 1
      }
      return { post, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.post)
}

/** 站内搜索：点击后弹出模态，支持键盘 ↑↓ 选择、Enter 跳转、Esc 关闭 */
export function SearchBox() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  // 全文搜索索引：首次打开搜索框时才动态加载（独立 chunk，避免拖慢首屏）
  const [docs, setDocs] = useState<SearchDoc[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open && docs === null) {
      import('virtual:posts-search-index').then((m) => setDocs(m.default))
    }
  }, [open, docs])

  const results = useMemo(() => search(query, docs), [query, docs])

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

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      go(results[active])
    }
  }

  return (
    <>
      <button
        type="button"
        className="search-trigger"
        onClick={() => setOpen(true)}
        aria-label="搜索文章"
        title="搜索 (Ctrl/Cmd + K)"
      >
        🔍 <span className="search-trigger__hint">搜索</span>
      </button>

      {open && (
        <div className="search-modal" role="dialog" aria-modal="true" aria-label="站内搜索">
          <div className="search-modal__backdrop" onClick={close} />
          <div className="search-modal__panel">
            <input
              ref={inputRef}
              className="search-modal__input"
              type="text"
              placeholder="搜索标题、标签、内容…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={onKeyDown}
            />

            <ul className="search-modal__results">
              {query && results.length === 0 && (
                <li className="search-modal__empty">没有找到相关文章</li>
              )}
              {results.map((post, i) => (
                <li key={post.slug}>
                  <button
                    type="button"
                    className={
                      'search-modal__item' +
                      (i === active ? ' search-modal__item--active' : '')
                    }
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(post)}
                  >
                    <span className="search-modal__item-title">{post.title}</span>
                    <span className="search-modal__item-date">
                      {formatDate(post.date)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="search-modal__footer">
              <kbd>↑</kbd><kbd>↓</kbd> 选择
              <kbd>↵</kbd> 打开
              <kbd>esc</kbd> 关闭
            </div>
          </div>
        </div>
      )}
    </>
  )
}
