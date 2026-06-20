import { Link } from 'react-router-dom'
import { allPosts, getCategories, getTags } from '../lib/posts'
import { siteConfig } from '../config'
import { formatShortDate } from '../lib/format'

export function Home() {
  const categories = getCategories()
  const tags = getTags()
  const totalWords = allPosts.reduce((sum, post) => sum + post.words, 0)
  const latestPosts = allPosts.slice(0, 5)
  const uncategorizedPosts = allPosts.filter((post) => !post.category)
  const categorySections = [
    ...categories.map((category) => ({
      name: category.name,
      count: category.count,
      posts: allPosts.filter((post) => post.category === category.name),
    })),
    ...(uncategorizedPosts.length > 0
      ? [
          {
            name: '未分类',
            count: uncategorizedPosts.length,
            posts: uncategorizedPosts,
          },
        ]
      : []),
  ]

  return (
    <div className="home">
      <section className="home-brief" aria-labelledby="home-title">
        <div>
          <p className="home-brief__eyebrow">知识库总览</p>
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
            <dt>分类</dt>
            <dd>{categories.length}</dd>
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
        <div className="section-head">
          <div>
            <p className="section-head__eyebrow">全貌</p>
            <h2 id="knowledge-title" className="section-head__title">
              知识架构
            </h2>
          </div>
        </div>

        <div className="knowledge-grid">
          <div className="knowledge-panel knowledge-panel--wide">
            <div className="knowledge-panel__head">
              <h3>知识树</h3>
              <Link to="/categories">全部分类</Link>
            </div>
            {categorySections.length === 0 ? (
              <p className="knowledge-empty">还没有分类。</p>
            ) : (
              <div className="knowledge-tree" role="tree">
                <div className="knowledge-tree__root">
                  <span>{siteConfig.title}</span>
                  <strong>{allPosts.length} 篇</strong>
                </div>
                <ul className="knowledge-tree__branches">
                  {categorySections.map((category) => (
                    <li className="knowledge-tree__branch" key={category.name}>
                      <details className="knowledge-tree__details">
                        <summary className="knowledge-tree__summary">
                          <span className="knowledge-tree__category-name">
                            {category.name}
                          </span>
                          <span className="knowledge-tree__latest">
                            {category.posts[0]?.title}
                          </span>
                          <strong>{category.count}</strong>
                        </summary>
                        <div className="knowledge-tree__category-actions">
                          {category.name === '未分类' ? (
                            <span>未分类文章</span>
                          ) : (
                            <Link
                              to={`/categories/${encodeURIComponent(category.name)}`}
                            >
                              查看分类页
                            </Link>
                          )}
                        </div>
                        <ul className="knowledge-tree__posts">
                          {category.posts.map((post) => (
                            <li key={post.slug}>
                              <Link
                                to={`/posts/${post.slug}`}
                                className="knowledge-tree__post"
                              >
                                <span>{post.title}</span>
                                <time dateTime={post.date}>
                                  {formatShortDate(post.date)}
                                </time>
                              </Link>
                              {post.tags && post.tags.length > 0 && (
                                <div className="knowledge-tree__tags">
                                  {post.tags.map((tag) => (
                                    <Link
                                      key={tag}
                                      to={`/tags/${encodeURIComponent(tag)}`}
                                    >
                                      {tag}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

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
        </div>
      </section>
    </div>
  )
}
