import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getArchives } from '../lib/posts'
import { siteConfig } from '../config'
import { formatShortDate } from '../lib/format'

/** 归档页：按年份分组，倒序列出全部文章 */
export function Archives() {
  const archives = getArchives()
  const total = archives.reduce((sum, g) => sum + g.posts.length, 0)

  useEffect(() => {
    document.title = `归档 · ${siteConfig.title}`
    return () => {
      document.title = siteConfig.title
    }
  }, [])

  return (
    <div className="page archives">
      <h1 className="page__title">归档</h1>
      <p className="page__subtitle">共 {total} 篇文章</p>

      {archives.map((group) => (
        <section key={group.year} className="archive-group">
          <h2 className="archive-group__year">{group.year}</h2>
          <ul className="archive-group__list">
            {group.posts.map((post) => (
              <li key={post.slug} className="archive-item">
                <span className="archive-item__date">
                  {formatShortDate(post.date)}
                </span>
                <Link to={`/posts/${post.slug}`} className="archive-item__title">
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {archives.length === 0 && <p className="empty">还没有文章。</p>}
    </div>
  )
}
