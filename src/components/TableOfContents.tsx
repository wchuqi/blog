import { useEffect, useState } from 'react'
import type { TocItem } from '../lib/types'

/**
 * 文章目录。监听滚动高亮当前章节，点击平滑跳转。
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
  const visible = items.filter((i) => i.depth >= 1 && i.depth <= 3)

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
        {visible.map((item) => (
          <li
            key={item.id}
            className={
              'toc__item toc__item--h' +
              item.depth +
              (activeId === item.id ? ' toc__item--active' : '')
            }
          >
            <a href={`#${item.id}`} onClick={(e) => handleClick(e, item.id)}>
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
