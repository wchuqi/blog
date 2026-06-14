import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCategories } from '../lib/posts'
import { siteConfig } from '../config'

/** 分类列表页 */
export function Categories() {
  const categories = getCategories()

  useEffect(() => {
    document.title = `分类 · ${siteConfig.title}`
    return () => {
      document.title = siteConfig.title
    }
  }, [])

  return (
    <div className="page">
      <h1 className="page__title">分类</h1>
      <p className="page__subtitle">共 {categories.length} 个分类</p>

      <ul className="category-list">
        {categories.map((c) => (
          <li key={c.name} className="category-list__item">
            <Link to={`/categories/${encodeURIComponent(c.name)}`}>
              <span className="category-list__name">{c.name}</span>
              <span className="category-list__count">{c.count} 篇</span>
            </Link>
          </li>
        ))}
      </ul>

      {categories.length === 0 && <p className="empty">还没有分类。</p>}
    </div>
  )
}
