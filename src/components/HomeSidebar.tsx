import { Link } from 'react-router-dom'
import { allPosts, getTags, getCategories } from '../lib/posts'
import { siteConfig } from '../config'
import { formatShortDate } from '../lib/format'

/**
 * 首页右侧边栏：个人名片 + 站点统计 + 热门标签 + 最新文章。
 * 用来填充宽屏下首页两侧的空白，并提供站点导航入口。
 * sticky 跟随滚动。
 */
export function HomeSidebar() {
  const { profile } = siteConfig
  const tags = getTags().slice(0, 12)
  const categories = getCategories().slice(0, 6)
  const recent = allPosts.slice(0, 5)

  const tagCount = getTags().length
  const totalPosts = allPosts.length

  return (
    <aside className="home-aside">
      <div className="home-aside__sticky">
        {/* 个人名片 */}
        {profile.enabled && (
          <section className="widget profile-card">
            <div className="profile-card__avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} />
              ) : (
                <span>{profile.name.slice(0, 1)}</span>
              )}
            </div>
            <div className="profile-card__name">{profile.name}</div>
            <p className="profile-card__bio">{profile.bio}</p>
            {siteConfig.social.length > 0 && (
              <div className="profile-card__social">
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

        {/* 站点统计 */}
        <section className="widget stats">
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
        </section>

        {/* 热门标签 */}
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
                  <span className="tag__count">{t.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 最新文章 */}
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
