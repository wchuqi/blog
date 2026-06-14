import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTags } from '../lib/posts'
import { siteConfig } from '../config'

/** 标签云页：展示全部标签，字号随文章数变化 */
export function Tags() {
  const tags = getTags()
  const max = Math.max(1, ...tags.map((t) => t.count))

  useEffect(() => {
    document.title = `标签 · ${siteConfig.title}`
    return () => {
      document.title = siteConfig.title
    }
  }, [])

  return (
    <div className="page tags-page">
      <h1 className="page__title">标签</h1>
      <p className="page__subtitle">共 {tags.length} 个标签</p>

      <div className="tag-cloud">
        {tags.map((t) => {
          // 字号在 0.9rem ~ 1.8rem 之间线性映射
          const size = 0.9 + (t.count / max) * 0.9
          return (
            <Link
              key={t.name}
              to={`/tags/${encodeURIComponent(t.name)}`}
              className="tag-cloud__item"
              style={{ fontSize: `${size}rem` }}
            >
              {t.name}
              <span className="tag-cloud__count">{t.count}</span>
            </Link>
          )
        })}
      </div>

      {tags.length === 0 && <p className="empty">还没有标签。</p>}
    </div>
  )
}
