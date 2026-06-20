import { useMemo, useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import {
  extractToc,
  getBacklinks,
  getPost,
  getRelatedPosts,
  renderNoteLinks,
  resolveMarkdownPostHref,
} from '../lib/posts'
import { siteConfig } from '../config'
import { formatDate } from '../lib/format'
import { TableOfContents } from '../components/TableOfContents'
import { Comments } from '../components/Comments'
import { CodeBlock } from '../components/CodeBlock'
import { PasswordGate } from '../components/PasswordGate'

/** 文章详情页：正文渲染 + 目录 + 相关文章 + 评论 */
export function PostDetail() {
  // 路由用 splat（posts/*）匹配多段 slug，如 tech/hello，参数挂在 '*'
  const params = useParams<'*'>()
  const slug = params['*']
  const navigate = useNavigate()
  const post = slug ? getPost(slug) : undefined

  // 加密文章：解锁前的明文，null 表示尚未解锁
  const [decrypted, setDecrypted] = useState<string | null>(null)

  // 切换文章时重置解锁状态（防止上一篇的明文残留）
  useEffect(() => {
    setDecrypted(null)
  }, [slug])

  // 实际用于渲染的正文：加密文章用解密后的明文，否则用原文
  const displayContent = (post?.encrypted ? decrypted : post?.content) ?? ''
  const renderedContent = useMemo(
    () => renderNoteLinks(displayContent),
    [displayContent]
  )

  // 加密文章解锁前不显示目录（否则泄露标题结构）；解锁后从明文派生
  const toc = useMemo(
    () => (post?.encrypted && decrypted === null ? [] : displayContent ? extractToc(displayContent) : []),
    [post, decrypted, displayContent]
  )
  const hasOutline = toc.some((item) => item.depth >= 1 && item.depth <= 3)
  const showOutline = !!displayContent && !(post?.encrypted && decrypted === null)
  const related = useMemo(
    () => (post ? getRelatedPosts(post) : []),
    [post]
  )
  const backlinks = useMemo(() => (post ? getBacklinks(post) : []), [post])

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

  // PasswordGate 解锁成功回调：useCallback 保持引用稳定，避免触发 PasswordGate 的 effect 重跑
  const handleUnlock = useCallback((plaintext: string) => {
    setDecrypted(plaintext)
  }, [])

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

        {post.encrypted && decrypted === null ? (
          // 加密文章解锁前：显示密码门，正文不渲染
          <PasswordGate encryptedBody={post.content} onUnlock={handleUnlock} />
        ) : (
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
                  const resolvedHref = resolveMarkdownPostHref(post.slug, href)
                  if (isExternal) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                        {children}
                      </a>
                    )
                  }
                  if (resolvedHref?.startsWith('/')) {
                    return (
                      <Link to={resolvedHref} {...props}>
                        {children}
                      </Link>
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
              {renderedContent}
            </ReactMarkdown>
          </div>
        )}

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

      {showOutline && (
        <aside className="post-outline-flyout" aria-label="笔记大纲">
          <div className="post-outline-flyout__edge" aria-hidden="true" />
          <div className="post-outline-flyout__panel">
            {hasOutline ? (
              <TableOfContents items={toc} title="笔记大纲" />
            ) : (
              <div className="toc" aria-label="文章目录">
                <div className="toc__head">
                  <div className="toc__title">笔记大纲</div>
                </div>
                <p className="toc__empty">本文暂无可用标题</p>
              </div>
            )}
          </div>
        </aside>
      )}

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

      {backlinks.length > 0 && (
        <section className="backlinks">
          <h2 className="backlinks__title">反向链接</h2>
          <ul className="backlinks__list">
            {backlinks.map((p) => (
              <li key={p.slug}>
                <Link to={`/posts/${p.slug}`}>{p.title}</Link>
                <span className="backlinks__date">{formatDate(p.date)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Comments />
    </div>
  )
}
