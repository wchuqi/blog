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

  /**
   * 滚动联动：高亮当前正在阅读的章节。
   *
   * 不用 IntersectionObserver：它只在“相交状态发生变化”时回调，
   * 而且只会给出状态变了的那几条。当一个标题向上离开观测带时，
   * 回调里拿到的是一条 isIntersecting: false，上面那个标题并不在 entries 里，
   * 于是 visibleEntries 为空、不更新——**往上滚动时高亮会停在原地**。
   *
   * 改成每次滚动直接算：当前章节 = 最后一个已滚过命中线的标题；
   * 都没有滚过（页顶）时取第一个。这样上下滚动都准，也不依赖回调时机。
   */
  useEffect(() => {
    if (visible.length === 0) return

    // 保持文档顺序，下面才能用 break 提前退出
    const headings = visible
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null)
    if (headings.length === 0) return

    /** 命中线：sticky 导航栏（64px）下方一点 */
    const LINE = 88
    let frame = 0

    const compute = () => {
      frame = 0
      let current = headings[0]
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= LINE) current = h
        else break
      }
      setActiveId((prev) => (prev === current.id ? prev : current.id))
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(compute)
    }

    compute()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
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

  /**
   * 把高亮项滚进可见范围。
   * 大纲面板可滚动（长文档下装不下），高亮项在可视区外的话用户根本看不到选中状态。
   * 只滚面板这个滚动容器，不动页面。
   */
  useEffect(() => {
    if (!activeId) return
    const item = document.querySelector<HTMLElement>('.toc__item--active')
    if (!item) return

    let box: HTMLElement | null = item.parentElement
    while (box && !/(auto|scroll)/.test(getComputedStyle(box).overflowY)) {
      box = box.parentElement
    }
    if (!box) return

    const PAD = 16
    const boxRect = box.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    if (itemRect.top < boxRect.top + PAD) {
      box.scrollTop -= boxRect.top + PAD - itemRect.top
    } else if (itemRect.bottom > boxRect.bottom - PAD) {
      box.scrollTop += itemRect.bottom - (boxRect.bottom - PAD)
    }
  }, [activeId, expanded])

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
