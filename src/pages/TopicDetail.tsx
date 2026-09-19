import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTopic } from '../lib/topics'
import { siteConfig } from '../config'
import { formatShortDate } from '../lib/format'
import { NotFound } from './NotFound'

/** 主题目录页：入口页 + 子主题 + 按子目录分组的文章清单 */
export function TopicDetail() {
  // 路由用 splat（topics/*）匹配多段 slug，如 AI/核心概念/AI RAG
  const params = useParams<'*'>()
  const slug = params['*']
  const topic = slug ? getTopic(slug) : undefined

  useEffect(() => {
    document.title = topic ? `${topic.name} · ${siteConfig.title}` : siteConfig.title
    return () => {
      document.title = siteConfig.title
    }
  }, [topic])

  if (!topic) return <NotFound />

  return (
    <div className="page topic-page">
      <nav className="topic-breadcrumb" aria-label="主题路径">
        <Link to="/topics">主题</Link>
        {[...topic.parents, topic.name].map((segment, i) => (
          <span key={`${segment}-${i}`} className="topic-breadcrumb__seg">
            <span className="topic-breadcrumb__sep">/</span>
            {segment}
          </span>
        ))}
      </nav>

      <h1 className="page__title">{topic.name}</h1>
      {topic.description && <p className="page__subtitle">{topic.description}</p>}

      <div className="topic-actions">
        {topic.indexes.map((post) => (
          <Link key={post.slug} to={`/posts/${post.slug}`} className="btn">
            {post.title}
          </Link>
        ))}
      </div>

      <div className="topic-stats">
        <div className="topic-stat">
          <span className="topic-stat__value">{topic.totalPosts}</span>
          <span className="topic-stat__label">篇文章</span>
        </div>
        <div className="topic-stat">
          <span className="topic-stat__value">{topic.sections.length}</span>
          <span className="topic-stat__label">个分段</span>
        </div>
        <div className="topic-stat">
          <span className="topic-stat__value">{Math.round(topic.words / 1000)}k</span>
          <span className="topic-stat__label">字数</span>
        </div>
        {topic.latest && (
          <div className="topic-stat">
            <span className="topic-stat__value">{topic.latest.slice(0, 10)}</span>
            <span className="topic-stat__label">最近更新</span>
          </div>
        )}
      </div>

      {topic.subtopics.length > 0 && (
        <section className="topic-section">
          <h2 className="topic-section__title">
            子主题
            <span className="topic-section__count">{topic.subtopics.length}</span>
          </h2>
          <div className="knowledge-tags">
            {topic.subtopics.map((sub) => (
              <Link className="knowledge-tag" key={sub.slug} to={`/topics/${sub.slug}`}>
                {sub.name}
                <span>{sub.totalPosts}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {topic.sections.map((section) => (
        <section className="topic-section" key={section.path || '__direct'}>
          <h2 className="topic-section__title">
            {section.label}
            <span className="topic-section__count">{section.posts.length}</span>
          </h2>
          <ol className="post-index">
            {section.posts.map((post) => (
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
        </section>
      ))}

      {topic.totalPosts === 0 && <p className="empty">这个主题下还没有文章。</p>}
    </div>
  )
}
