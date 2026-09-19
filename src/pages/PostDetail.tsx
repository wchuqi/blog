import { useMemo, useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import {
  extractToc,
  getBacklinks,
  getOutgoingLinks,
  getPost,
  getPostContent,
  getRelatedPosts,
  renderNoteLinks,
  resolveMarkdownPostHref,
} from '../lib/posts'
import { siteConfig } from '../config'
import { apiUrl } from '../lib/api'
import { formatDate } from '../lib/format'
import { parseCardBody } from '../lib/cards'
import { getTopicOf } from '../lib/topics'
import { TableOfContents } from '../components/TableOfContents'
import { Comments } from '../components/Comments'
import { CodeBlock } from '../components/CodeBlock'
import { PasswordGate } from '../components/PasswordGate'
import { ReviewProgressCard } from '../components/ReviewProgressCard'
import { ReviewPanel } from '../components/ReviewPanel'
import { ReviewToggle } from '../components/ReviewToggle'
import { DeletePostButton } from '../components/DeletePostButton'
import { BackToTop } from '../components/BackToTop'

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
      fetch(apiUrl('posts', slug))
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
        const res = await fetch(apiUrl('posts', slug, 'frontmatter'), {
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
  // 出链：本文引用/链接了哪些笔记。与反向链接互补，但此前只有反向链接有 UI。
  const outgoing = useMemo(() => (post ? getOutgoingLinks(post) : []), [post])
  // 所属主题（目录约定见 lib/topics.ts）：把文章挂回知识库的一级导航
  const topic = useMemo(() => (post ? getTopicOf(post.slug) : undefined), [post])

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

  // 笔记大纲默认展开，点 ‹ / › 切换。
  // state 放在这里只会被“点击”触发（不是悬停），不会因为鼠标划过而重渲染正文。
  const [outlineOpen, setOutlineOpen] = useState(true)

  /**
   * 切换大纲。
   *
   * 展开/收起会改变正文宽度，文字随之重排，页面高度会变（实测同一篇文档
   * 宽 1104 与 1392 之间差 673px）。`scrollY` 数值不变，但视口上方的内容变短了，
   * 阅读位置就会漂移——表现就是“内容往下跳”。
   *
   * 所以这里在切换前选一个贴近视口顶部的正文块当锚点，在过渡期间每帧把它
   * 钉回原来的视口位置。选正文块而不是选 .post：文章自身的 top 不受内部重排影响，
   * 当不了锚点。
   */
  const toggleOutline = useCallback(() => {
    // 锚点用正文的直接子元素（段落/标题/列表/代码块…），而不是只挑标题：
    // 标题在小节内部很稀疏，落点可能离阅读位置几千像素，
    // 而重排引起的位移并非均匀，锚点离得越远补偿越不准（实测能差 30px）。
    const blocks = document.querySelectorAll<HTMLElement>('.markdown-body > *')
    let anchor: HTMLElement | null = null
    let bestDist = Infinity
    for (const el of blocks) {
      const dist = Math.abs(el.getBoundingClientRect().top)
      if (dist < bestDist) {
        bestDist = dist
        anchor = el
      }
    }

    setOutlineOpen((o) => !o)

    // 没有标题可当锚点（短文章 / 纯卡片）就不补偿：此时页面通常还没法滚动
    if (!anchor) return
    const pinned = anchor
    const offset = pinned.getBoundingClientRect().top
    const t0 = performance.now()

    const hold = () => {
      if (!pinned.isConnected) return
      const delta = pinned.getBoundingClientRect().top - offset
      if (Math.abs(delta) > 0.5) {
        // 必须显式 instant：全局 `html { scroll-behavior: smooth }` 会把 scrollBy 变成动画，
        // 那样每帧的修正会互相打断、反而拖出一段滑动
        window.scrollBy({ top: delta, behavior: 'instant' })
      }
      // 过渡是 260ms，多跟一点确保末帧也修正到位
      if (performance.now() - t0 < 420) requestAnimationFrame(hold)
    }
    requestAnimationFrame(hold)
  }, [])

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
            {topic && (
              <>
                <span className="dot">·</span>
                <Link to={`/topics/${topic.slug}`} className="post__topic">
                  {topic.name}
                </Link>
              </>
            )}
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
        <aside
          className={
            'post-outline-flyout' + (outlineOpen ? ' post-outline-flyout--open' : '')
          }
          aria-label="笔记大纲"
        >
          <button
            type="button"
            className="post-outline-flyout__toggle"
            onClick={toggleOutline}
            aria-expanded={outlineOpen}
            aria-controls="post-outline-panel"
            aria-label={outlineOpen ? '收起笔记大纲' : '展开笔记大纲'}
            title={outlineOpen ? '收起笔记大纲' : '展开笔记大纲'}
          >
            <span aria-hidden="true">{outlineOpen ? '‹' : '›'}</span>
          </button>
          <div className="post-outline-flyout__panel" id="post-outline-panel">
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

      {/* 出链与反向链接成对展示：知识库的导航就是“从这里能去哪”＋“什么会带你来这”。
          两者合并到一个区块里，避免两个结构完全相同的列表各占一段。 */}
      {!isCard && (outgoing.length > 0 || backlinks.length > 0) && (
        <section className="backlinks">
          {outgoing.length > 0 && (
            <>
              <h2 className="backlinks__title">
                指向的笔记
                <span className="backlinks__count">{outgoing.length}</span>
              </h2>
              <ul className="backlinks__list">
                {outgoing.map((p) => (
                  <li key={p.slug}>
                    <Link to={`/posts/${p.slug}`}>{p.title}</Link>
                    <span className="backlinks__date">{formatDate(p.date)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {backlinks.length > 0 && (
            <>
              <h2 className="backlinks__title">
                引用它的笔记
                <span className="backlinks__count">{backlinks.length}</span>
              </h2>
              <ul className="backlinks__list">
                {backlinks.map((p) => (
                  <li key={p.slug}>
                    <Link to={`/posts/${p.slug}`}>{p.title}</Link>
                    <span className="backlinks__date">{formatDate(p.date)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {!isCard && <Comments />}

      <BackToTop />
    </div>
  )
}