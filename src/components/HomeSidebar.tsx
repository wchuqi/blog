import { Link } from 'react-router-dom'
import { allPosts, getTags, getCategories } from '../lib/posts'
import { siteConfig } from '../config'
import { formatShortDate } from '../lib/format'

export function HomeSidebar() {
  const { profile } = siteConfig
  const tags = getTags().slice(0, 12)
  const categories = getCategories().slice(0, 6)
  const recent = allPosts.slice(0, 5)

  const tagCount = getTags().length
  const totalPosts = allPosts.length
  const totalWords = allPosts.reduce((s, p) => s + p.words, 0)

  return (
    <aside className="home-sidebar">
      <div className="home-sidebar__inner">
        {profile.enabled && (
          <section className="widget card-profile">
            <div className="card-profile__avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} />
              ) : (
                <span>{profile.name.slice(0, 1)}</span>
              )}
            </div>
            <div className="card-profile__name">{profile.name}</div>
            <p className="card-profile__bio">{profile.bio}</p>
            {siteConfig.social.length > 0 && (
              <div className="card-profile__social">
                {siteConfig.social.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="widget">
          <h3 className="widget__title">站点统计</h3>
          <div className="stats">
            <Link to="/archives" className="stats__item">
              <span className="stats__num">{totalPosts}</span>
              <span className="stats__label">文章</span>
            </Link>
            <Link to="/tags" className="stats__item">
              <span className="stats__num">{tagCount}</span>
              <span className="stats__label">标签</span>
            </Link>
            <Link to="/categories" className="stats__item">
              <span className="stats__num">{categories.length}</span>
              <span className="stats__label">分类</span>
            </Link>
            <div className="stats__item">
              <span className="stats__num">
                {totalWords >= 10000
                  ? (totalWords / 10000).toFixed(1) + 'w'
                  : totalWords >= 1000
                    ? (totalWords / 1000).toFixed(1) + 'k'
                    : totalWords}
              </span>
              <span className="stats__label">字数</span>
            </div>
          </div>
        </section>

        {tags.length > 0 && (
          <section className="widget">
            <h3 className="widget__title">热门标签</h3>
            <div className="widget__tags">
              {tags.map((t) => (
                <Link
                  key={t.name}
                  to={`/tags/${encodeURIComponent(t.name)}`}
                  className="tag"
                >
                  {t.name}
                  <span className="widget__tag-count">{t.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {recent.length > 0 && (
          <section className="widget">
            <h3 className="widget__title">最新文章</h3>
            <ul className="widget__list">
              {recent.map((p) => (
                <li key={p.slug}>
                  <Link to={`/posts/${p.slug}`} className="widget__post">
                    <span className="widget__post-title">{p.title}</span>
                    <span className="widget__post-date">
                      {formatShortDate(p.date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  )
}
