import { Link } from 'react-router-dom'
import type { Post } from '../lib/types'
import { formatDate } from '../lib/format'

/** 首页 / 列表页的文章卡片 */
export function PostCard({ post }: { post: Post }) {
  return (
    <article className="post-card">
      {post.cover && (
        <Link to={`/posts/${post.slug}`} className="post-card__cover">
          <img src={post.cover} alt={post.title} loading="lazy" />
        </Link>
      )}
      <div className="post-card__body">
        <h2 className="post-card__title">
          {post.pinned && <span className="post-card__pin" title="置顶">📌</span>}
          <Link to={`/posts/${post.slug}`}>{post.title}</Link>
        </h2>

        <div className="post-card__meta">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span className="dot">·</span>
          <span>{post.readingMinutes} 分钟</span>
          {post.category && (
            <>
              <span className="dot">·</span>
              <Link to={`/categories/${encodeURIComponent(post.category)}`}>
                {post.category}
              </Link>
            </>
          )}
        </div>

        {post.description && (
          <p className="post-card__desc">{post.description}</p>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="post-card__tags">
            {post.tags.map((t) => (
              <Link
                key={t}
                to={`/tags/${encodeURIComponent(t)}`}
                className="tag"
              >
                {t}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
