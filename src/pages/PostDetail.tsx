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
  getPostContent,
  getRelatedPosts,
  renderNoteLinks,
  resolveMarkdownPostHref,
} from '../lib/posts'
import { siteConfig } from '../config'
import { formatDate } from '../lib/format'
import { parseCardBody } from '../lib/cards'
import { TableOfContents } from '../components/TableOfContents'
import { Comments } from '../components/Comments'
import { CodeBlock } from '../components/CodeBlock'
import { PasswordGate } from '../components/PasswordGate'
import { ReviewProgressCard } from '../components/ReviewProgressCard'
import { ReviewPanel } from '../components/ReviewPanel'
import { ReviewToggle } from '../components/ReviewToggle'
import { DeletePostButton } from '../components/DeletePostButton'

/** 文章详情页：正文渲染 + 目录 + 相关文章 + 评论 */
export function PostDetail() {
  // 路由用 splat（posts/*）匹配多段 slug，如 tech/hello，参数挂在 '*'
  const params = useParams<'*'>()
  const slug = params['*']
  const navigate = useNavigate()
  const post = slug ? getPost(slug) : undefined

  // 加密文章：解锁前的明文，null 表示尚未解锁
  const [decrypted, setDecrypted] = useState<string | null>(null)

  // 正文懒加载：undefined 表示还在加载
  const [content, setContent] = useState<string | undefined>(undefined)

  // 标签：本地状态，dev only 可删；切换文章时同步
  const [tags, setTags] = useState<string[]>(post?.tags ?? [])
  const [removingTag, setRemovingTag] = useState<string | null>(null)

  // 复习开关：本地状态，点击按钮即时切换，不刷新页面
  const [inReview, setInReview] = useState(!post?.noReview)

  // 切换文章时重置状态与正文（防止上一篇的残留）
  useEffect(() => {
    setDecrypted(null)
    setContent(undefined)
    setTags(slug ? (getPost(slug)?.tags ?? []) : [])
    setRemovingTag(null)
    setInReview(slug ? !getPost(slug)?.noReview : false)
    if (!slug) return
    let cancelled = false
    getPostContent(slug).then((raw) => {
      if (!cancelled) setContent(raw)
    })
    // dev 模式下从 API 获取实时 noReview（虚拟模块可能过期）
    if (import.meta.env.DEV) {
      fetch(`/api/posts/${slug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (cancelled || !d?.frontmatter) return
          setInReview(!/^noReview:\s*true\s*$/m.test(d.frontmatter))
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [slug])

  // 删除标签：写回 frontmatter（dev only，依赖本地 API server）
  const removeTag = useCallback(
    async (tag: string) => {
      if (!slug) return
      const next = tags.filter((t) => t !== tag)
      setRemovingTag(tag)
      try {
        const res = await fetch(`/api/posts/${slug}/frontmatter`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: next }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        setTags(next)
        // 清 Vite 服务端缓存，否则刷新页面时虚拟模块仍是旧数据
        await fetch('/__refresh-posts-index').catch(() => {})
      } catch (e) {
        alert(`删除标签失败：${e instanceof Error ? e.message : '未知错误'}（确认本地 API server 已启动）`)
      } finally {
        setRemovingTag(null)
      }
    },
    [slug, tags]
  )

  // 实际用于渲染的正文：加密文章用解密后的明文，否则用原文
  const displayContent = (post?.encrypted ? decrypted : content) ?? ''
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
  const showOutline = !!displayContent && !(post?.encrypted && decrypted === null) && post?.type !== 'card'
  const related = useMemo(
    () => (post ? getRelatedPosts(post) : []),
    [post]
  )
  const backlinks = useMemo(() => (post ? getBacklinks(post) : []), [post])

  // 问答卡片（type: card）：正文按「# 问题 / # 答案」两段解析，不走普通文章渲染
  const isCard = !!post && post.type === 'card'
  const cardQA = useMemo(
    () => (isCard && content !== undefined ? parseCardBody(content) : null),
    [isCard, content]
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
          <h1 className="post__title">
            {post.title}
            {isCard && <span className="cardqa__badge">问答卡片</span>}
          </h1>
          <div className="post__meta">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span className="dot">·</span>
            <span>{post.readingMinutes} 分钟阅读</span>
            <span className="dot">·</span>
            <span>{post.words} 字</span>
          </div>
        </header>

        {post.cover && (
          <img className="post__cover" src={post.cover} alt={post.title} />
        )}

        {import.meta.env.DEV && !post.encrypted && (
          <div className="post__devops">
            <ReviewToggle slug={post.slug} inReview={inReview} setInReview={setInReview} />
            <DeletePostButton slug={post.slug} title={post.title} />
          </div>
        )}

        {inReview && !post.encrypted && (
          <>
            <ReviewProgressCard post={post} />
            {import.meta.env.DEV && <ReviewPanel slug={post.slug} />}
          </>
        )}

        {tags.length > 0 && (
          <div className="post__tags">
            {tags.map((t) => (
              <span key={t} className="tag tag--card">
                <Link to={`/tags/${encodeURIComponent(t)}`} className="tag__link">
                  # {t}
                </Link>
                {import.meta.env.DEV && (
                  <button
                    type="button"
                    className="tag__remove"
                    onClick={() => removeTag(t)}
                    disabled={removingTag !== null}
                    aria-label={`删除标签 ${t}`}
                    title="删除此标签"
                  >
                    {removingTag === t ? '…' : '×'}
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {content === undefined ? (
          // 正文 chunk 加载中
          <p className="empty">加载中…</p>
        ) : post.encrypted && decrypted === null ? (
          // 加密文章解锁前：显示密码门，正文不渲染
          <PasswordGate encryptedBody={content} onUnlock={handleUnlock} />
        ) : isCard ? (
          <div className="cardqa">
            <section className="cardqa__face">
              <div className="cardqa__label">问题</div>
              <div className="markdown-body cardqa__text">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{cardQA?.question ?? ''}</ReactMarkdown>
              </div>
            </section>
            <section className="cardqa__face cardqa__face--answer">
              <div className="cardqa__label">答案</div>
              <div className="markdown-body cardqa__text">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{cardQA?.answer ?? ''}</ReactMarkdown>
              </div>
            </section>
          </div>
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
      </article>

      {showOutline && (
        <aside className="post-outline-flyout" aria-label="笔记大纲">
          <div className="post-outline-flyout__edge" aria-hidden="true" />
          <div className="post-outline-flyout__icon" aria-hidden="true">
            «
          </div>
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

      {!isCard && related.length > 0 && (
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

      {!isCard && backlinks.length > 0 && (
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

      {!isCard && <Comments />}
    </div>
  )
}