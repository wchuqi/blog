import { useMemo, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import { getPost, extractToc, getRelatedPosts } from '../lib/posts'
import { siteConfig } from '../config'
import { formatDate } from '../lib/format'
import { TableOfContents } from '../components/TableOfContents'
import { Comments } from '../components/Comments'
import { CodeBlock } from '../components/CodeBlock'

/** 文章详情页：正文渲染 + 目录 + 相关文章 + 评论 */
export function PostDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const post = slug ? getPost(slug) : undefined

  const toc = useMemo(
    () => (post ? extractToc(post.content) : []),
    [post]
  )
  const related = useMemo(
    () => (post ? getRelatedPosts(post) : []),
    [post]
  )

  // 设置页面标题；卸载时还原
  useEffect(() => {
    if (post) {
      document.title = `${post.title} · ${siteConfig.title}`
    }
    return () => {
      document.title = siteConfig.title
    }
  }, [post])

  // 切换文章时回到顶部
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!post) {
    return (
      <div className="empty">
        <p>文章不存在或已被移除。</p>
        <button className="btn" onClick={() => navigate('/')}>
          返回首页
        </button>
      </div>
    )
  }

  return (
    <div className="post-detail">
      <article className="post">
        <header className="post__header">
          <h1 className="post__title">{post.title}</h1>
          <div className="post__meta">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span className="dot">·</span>
            <span>{post.readingMinutes} 分钟阅读</span>
            <span className="dot">·</span>
            <span>{post.words} 字</span>
            <span className="dot">·</span>
            <span>{post.author ?? siteConfig.author}</span>
          </div>

          {post.category && (
            <div className="post__category">
              分类：
              <Link to={`/categories/${encodeURIComponent(post.category)}`}>
                {post.category}
              </Link>
            </div>
          )}
        </header>

        {post.cover && (
          <img className="post__cover" src={post.cover} alt={post.title} />
        )}

        <div className="markdown-body post__content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
            components={{
              // 代码块渲染成带语言标签 + 复制按钮的深色卡片
              pre: CodeBlock,
              // 让站内相对链接走 SPA 路由，外链新开标签页
              a: ({ href, children, ...props }) => {
                const isExternal = /^https?:\/\//.test(href ?? '')
                if (isExternal) {
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  )
                }
                return (
                  <a href={href} {...props}>
                    {children}
                  </a>
                )
              },
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="post__tags">
            {post.tags.map((t) => (
              <Link key={t} to={`/tags/${encodeURIComponent(t)}`} className="tag">
                # {t}
              </Link>
            ))}
          </div>
        )}
      </article>

      <aside className="post-aside">
        <div className="post-aside__sticky">
          <TableOfContents items={toc} />
        </div>
      </aside>

      {related.length > 0 && (
        <section className="related">
          <h2 className="related__title">相关文章</h2>
          <ul className="related__list">
            {related.map((p) => (
              <li key={p.slug}>
                <Link to={`/posts/${p.slug}`}>{p.title}</Link>
                <span className="related__date">{formatDate(p.date)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Comments />
    </div>
  )
}
