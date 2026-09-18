import { Link } from 'react-router-dom'
import { allPosts, getTags } from '../lib/posts'
import { siteConfig } from '../config'
import { formatShortDate } from '../lib/format'

/** 首页：站点简介 + 最新文章列表（主角） */
export function Home() {
  const tags = getTags()
  const totalWords = allPosts.reduce((sum, post) => sum + post.words, 0)
  const latestPosts = allPosts.slice(0, 10)

  return (
    <div className="home">
      <section className="home-hero" aria-labelledby="home-title">
        <h1 id="home-title" className="home-hero__title">
          {siteConfig.title}
        </h1>
        <p className="home-hero__desc">{siteConfig.description}</p>
        <p className="home-hero__meta">
          <span>{allPosts.length} 篇文章</span>
          <span className="dot">·</span>
          <span>
            {totalWords >= 10000
              ? `${(totalWords / 10000).toFixed(1)} 万字`
              : totalWords >= 1000
                ? `${(totalWords / 1000).toFixed(1)} 千字`
                : `${totalWords} 字`}
          </span>
          <span className="dot">·</span>
          <span>{tags.length} 个标签</span>
        </p>
      </section>

      <section className="home-latest" aria-labelledby="latest-title">
        <div className="home-latest__head">
          <h2 id="latest-title" className="home-latest__heading">
            最新文章
          </h2>
          <Link to="/articles" className="home-latest__link">
            全部 {allPosts.length} 篇 →
          </Link>
        </div>

        {latestPosts.length === 0 ? (
          <p className="home-latest__empty">还没有文章。</p>
        ) : (
          <ol className="post-index">
            {latestPosts.map((post) => (
              <li key={post.slug} className="post-index__item">
                <Link to={`/posts/${post.slug}`} className="post-index__link">
                  <time dateTime={post.date} className="post-index__date">
                    {formatShortDate(post.date)}
                  </time>
                  <div className="post-index__body">
                    <h3 className="post-index__title">{post.title}</h3>
                    {post.description && (
                      <p className="post-index__desc">{post.description}</p>
                    )}
                    <p className="post-index__meta">
                      {post.readingMinutes} 分钟阅读
                      {post.tags && post.tags.length > 0 && (
                        <>
                          <span className="dot">·</span>
                          <span>{post.tags.slice(0, 3).join(' / ')}</span>
                        </>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
