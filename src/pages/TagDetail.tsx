import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { allPosts } from '../lib/posts'
import { siteConfig } from '../config'
import { PostCard } from '../components/PostCard'

/** 单个标签下的文章列表 */
export function TagDetail() {
  const { tag } = useParams<{ tag: string }>()
  const name = tag ? decodeURIComponent(tag) : ''
  const posts = allPosts.filter((p) => (p.tags ?? []).includes(name))

  useEffect(() => {
    document.title = `标签：${name} · ${siteConfig.title}`
    return () => {
      document.title = siteConfig.title
    }
  }, [name])

  return (
    <div className="page">
      <h1 className="page__title">
        标签：<span className="accent">{name}</span>
      </h1>
      <p className="page__subtitle">
        共 {posts.length} 篇 · <Link to="/tags">查看全部标签</Link>
      </p>

      <div className="post-list">
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>

      {posts.length === 0 && <p className="empty">该标签下还没有文章。</p>}
    </div>
  )
}
