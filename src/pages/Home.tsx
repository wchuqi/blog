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

  // 构建层级分类结构
  interface CategoryNode {
    name: string
    fullPath: string
    count: number
    posts: typeof allPosts
    children: Map<string, CategoryNode>
  }

  const buildCategoryTree = () => {
    const root: Map<string, CategoryNode> = new Map()

    for (const post of allPosts) {
      if (!post.category) continue

      const parts = post.category.split('/')
      let currentLevel = root
      let fullPath = ''

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        fullPath = fullPath ? `${fullPath}/${part}` : part

        if (!currentLevel.has(part)) {
          currentLevel.set(part, {
            name: part,
            fullPath: fullPath,
            count: 0,
            posts: [],
            children: new Map()
          })
        }

        const node = currentLevel.get(part)!

        // 所有层级都累加计数
        node.count++

        if (i === parts.length - 1) {
          // 叶子节点，添加文章
          node.posts.push(post)
        }

        currentLevel = node.children
      }
    }

    return root
  }

  const categoryTree = buildCategoryTree()

  // 递归渲染分类树
  const renderCategoryNode = (node: CategoryNode, level: number = 0): JSX.Element => {
    const hasChildren = node.children.size > 0

    return (
      <li className="knowledge-tree__branch" key={node.fullPath}>
        <details className="knowledge-tree__details">
          <summary className="knowledge-tree__summary">
            <span className="knowledge-tree__category-name">
              {node.name}
            </span>
            {node.posts.length > 0 && (
              <span className="knowledge-tree__latest">
                {node.posts[0]?.title}
              </span>
            )}
            <strong>{node.count}</strong>
          </summary>

          {hasChildren && (
            <ul className="knowledge-tree__subcategories">
              {[...node.children.values()].map(child =>
                renderCategoryNode(child, level + 1)
              )}
            </ul>
          )}

          {node.posts.length > 0 && (
            <>
              <div className="knowledge-tree__category-actions">
                <Link to={`/categories/${encodeURIComponent(node.fullPath)}`}>
                  查看分类页
                </Link>
              </div>
              <ul className="knowledge-tree__posts">
                {node.posts.map((post) => (
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
            </>
          )}
        </details>
      </li>
    )
  }

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
        <div className="knowledge-grid">
          <div className="knowledge-panel knowledge-panel--wide">
            {categoryTree.size === 0 && uncategorizedPosts.length === 0 ? (
              <p className="knowledge-empty">还没有分类。</p>
            ) : (
              <div className="knowledge-tree" role="tree">
                <div className="knowledge-tree__root">
                  <span>{siteConfig.title}</span>
                  <strong>{allPosts.length} 篇</strong>
                </div>
                <ul className="knowledge-tree__branches">
                  {[...categoryTree.values()].map((node) => renderCategoryNode(node))}
                  {uncategorizedPosts.length > 0 && (
                    <li className="knowledge-tree__branch" key="uncategorized">
                      <details className="knowledge-tree__details">
                        <summary className="knowledge-tree__summary">
                          <span className="knowledge-tree__category-name">
                            未分类
                          </span>
                          <span className="knowledge-tree__latest">
                            {uncategorizedPosts[0]?.title}
                          </span>
                          <strong>{uncategorizedPosts.length}</strong>
                        </summary>
                        <div className="knowledge-tree__category-actions">
                          <span>未分类文章</span>
                        </div>
                        <ul className="knowledge-tree__posts">
                          {uncategorizedPosts.map((post) => (
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
                  )}
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
