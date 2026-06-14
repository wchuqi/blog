import { useSearchParams } from 'react-router-dom'
import { allPosts } from '../lib/posts'
import { siteConfig } from '../config'
import { PostCard } from '../components/PostCard'
import { Pagination } from '../components/Pagination'
import { HomeSidebar } from '../components/HomeSidebar'

/** 首页：文章列表 + 侧边栏 + 分页（通过 ?page=N 控制页码） */
export function Home() {
  const [params] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const { pageSize } = siteConfig

  const totalPages = Math.max(1, Math.ceil(allPosts.length / pageSize))
  const start = (page - 1) * pageSize
  const pagePosts = allPosts.slice(start, start + pageSize)

  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__desc">{siteConfig.description}</p>
      </section>

      <div className="home-layout">
        <div className="home-main">
          {pagePosts.length === 0 ? (
            <p className="empty">还没有文章，去 src/posts 写第一篇吧。</p>
          ) : (
            <div className="post-list">
              {pagePosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}

          <Pagination
            current={page}
            total={totalPages}
            hrefFor={(p) => (p === 1 ? '/' : `/?page=${p}`)}
          />
        </div>

        <HomeSidebar />
      </div>
    </div>
  )
}
