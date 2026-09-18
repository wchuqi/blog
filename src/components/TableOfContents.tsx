import { useEffect, useMemo, useState } from 'react'
import type { TocItem } from '../lib/types'

/**
 * 文章目录（树形，默认只显示顶层章节）。
 * 子级标题默认收起，点箭头展开；滚动时自动展开当前章节的祖先，保证高亮可见。
 * 展示 h1 / h2 / h3，避免过深。
 */
interface TableOfContentsProps {
  items: TocItem[]
  title?: string
  onClose?: () => void
}

export function TableOfContents({
  items,
  title = '目录',
  onClose,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  // 已展开的章节 id 集合（仅父级章节有意义）
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const visible = useMemo(
    () => items.filter((i) => i.depth >= 1 && i.depth <= 3),
    [items]
  )

  // 每一项的直接父级下标（前面最近的、深度更小的项），-1 表示顶层
  const parentIndex = useMemo(() => {
    const parents: number[] = []
    const stack: number[] = []
    visible.forEach((item, i) => {
      while (stack.length > 0 && visible[stack[stack.length - 1]].depth >= item.depth) {
        stack.pop()
      }
      parents[i] = stack.length > 0 ? stack[stack.length - 1] : -1
      stack.push(i)
    })
    return parents
  }, [visible])

  // 有子级的章节 id，用于决定是否显示展开箭头
  const hasChildren = useMemo(() => {
    const ids = new Set<string>()
    parentIndex.forEach((p) => {
      if (p !== -1) ids.add(visible[p].id)
    })
    return ids
  }, [visible, parentIndex])

  // 某项是否可见：其所有祖先章节都已展开
  const isShown = (index: number) => {
    let p = parentIndex[index]
    while (p !== -1) {
      if (!expanded.has(visible[p].id)) return false
      p = parentIndex[p]
    }
    return true
  }

  // 收集某项的全部祖先 id
  const ancestorIds = (index: number) => {
    const ids: string[] = []
    let p = parentIndex[index]
    while (p !== -1) {
      ids.push(visible[p].id)
      p = parentIndex[p]
    }
    return ids
  }

  useEffect(() => {
    if (visible.length === 0) return

    const headings = visible
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        // 取当前在视口顶部区域内最靠上的标题
        const visibleEntries = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visibleEntries.length > 0) {
          setActiveId(visibleEntries[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    )

    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [visible])

  // 滚动到某章节时自动展开其祖先，避免高亮项被折叠藏住
  useEffect(() => {
    if (!activeId) return
    const idx = visible.findIndex((i) => i.id === activeId)
    if (idx === -1) return
    setExpanded((prev) => {
      const missing = ancestorIds(idx).filter((id) => !prev.has(id))
      if (missing.length === 0) return prev
      const next = new Set(prev)
      missing.forEach((id) => next.add(id))
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, visible, parentIndex])

  if (visible.length === 0) return null

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
      history.replaceState(null, '', `#${id}`)
      setActiveId(id)
    }
  }

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <nav className="toc" aria-label="文章目录">
      <div className="toc__head">
        <div className="toc__title">{title}</div>
        {onClose && (
          <button className="toc__toggle" type="button" onClick={onClose}>
            关闭
          </button>
        )}
      </div>
      <ul className="toc__list">
        {visible.map((item, i) =>
          !isShown(i) ? null : (
            <li
              key={item.id}
              className={
                'toc__item toc__item--h' +
                item.depth +
                (activeId === item.id ? ' toc__item--active' : '')
              }
            >
              <div className="toc__row">
                <a href={`#${item.id}`} onClick={(e) => handleClick(e, item.id)}>
                  {item.text}
                </a>
                {hasChildren.has(item.id) && (
                  <button
                    type="button"
                    className="toc__chevron"
                    aria-expanded={expanded.has(item.id)}
                    aria-label={expanded.has(item.id) ? '收起子标题' : '展开子标题'}
                    onClick={() => toggle(item.id)}
                  >
                    {expanded.has(item.id) ? '▾' : '▸'}
                  </button>
                )}
              </div>
            </li>
          )
        )}
      </ul>
    </nav>
  )
}
