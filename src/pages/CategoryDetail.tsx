import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { allPosts } from '../lib/posts'
import { siteConfig } from '../config'
import { PostCard } from '../components/PostCard'

/** 单个分类下的文章列表 */
export function CategoryDetail() {
  const { category } = useParams<{ category: string }>()
  const name = category ? decodeURIComponent(category) : ''
  const posts = allPosts.filter((p) => p.category === name)

  useEffect(() => {
    document.title = `分类：${name} · ${siteConfig.title}`
    return () => {
      document.title = siteConfig.title
    }
  }, [name])

  return (
    <div className="page">
      <h1 className="page__title">
        分类：<span className="accent">{name}</span>
      </h1>
      <p className="page__subtitle">
        共 {posts.length} 篇 · <Link to="/categories">查看全部分类</Link>
      </p>

      <div className="post-list">
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>

      {posts.length === 0 && <p className="empty">该分类下还没有文章。</p>}
    </div>
  )
}
