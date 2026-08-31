import { Link } from 'react-router-dom'
import { allPosts, getTags } from '../lib/posts'
import { siteConfig } from '../config'
import { formatShortDate } from '../lib/format'

/** 首页：站点简介 + 统计 + 标签索引 + 最近更新（完整文章树在「文章」页） */
export function Home() {
  const tags = getTags()
  const totalWords = allPosts.reduce((sum, post) => sum + post.words, 0)
  const latestPosts = allPosts.slice(0, 5)

  return (
    <div className="home">
      <section className="home-brief" aria-labelledby="home-title">
        <div>
          <h1 id="home-title" className="home-brief__title">
            {siteConfig.title}
          </h1>
          <p className="home-brief__desc">{siteConfig.description}</p>
        </div>

        <dl className="home-brief__stats" aria-label="站点统计">
          <div>
            <dt>文章</dt>
            <dd>{allPosts.length}</dd>
          </div>
          <div>
            <dt>标签</dt>
            <dd>{tags.length}</dd>
          </div>
          <div>
            <dt>字数</dt>
            <dd>
              {totalWords >= 10000
                ? `${(totalWords / 10000).toFixed(1)}w`
                : totalWords >= 1000
                  ? `${(totalWords / 1000).toFixed(1)}k`
                  : totalWords}
            </dd>
          </div>
        </dl>
      </section>

      <section className="knowledge" aria-labelledby="knowledge-title">
        <div className="knowledge-grid">
          <div className="knowledge-panel">
            <div className="knowledge-panel__head">
              <h3>标签索引</h3>
              <Link to="/tags">全部标签</Link>
            </div>
            {tags.length === 0 ? (
              <p className="knowledge-empty">还没有标签。</p>
            ) : (
              <div className="knowledge-tags">
                {tags.map((tag) => (
                  <Link
                    key={tag.name}
                    to={`/tags/${encodeURIComponent(tag.name)}`}
                    className="knowledge-tag"
                  >
                    {tag.name}
                    <span>{tag.count}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="knowledge-panel">
            <div className="knowledge-panel__head">
              <h3>最近更新</h3>
              <Link to="/archives">时间线</Link>
            </div>
            {latestPosts.length === 0 ? (
              <p className="knowledge-empty">还没有文章。</p>
            ) : (
              <ol className="recent-list">
                {latestPosts.map((post) => (
                  <li key={post.slug}>
                    <Link to={`/posts/${post.slug}`}>
                      <span>{post.title}</span>
                      <time dateTime={post.date}>{formatShortDate(post.date)}</time>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="knowledge-panel knowledge-panel--wide">
            <div className="knowledge-panel__head">
              <h3>全部文章</h3>
              <Link to="/articles">浏览全部</Link>
            </div>
            <p className="knowledge-empty">
              完整的树形文章列表已移至
              <Link to="/articles">「文章」页</Link>。
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
