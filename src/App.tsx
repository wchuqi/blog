import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Articles } from './pages/Articles'
import { Archives } from './pages/Archives'
import { Tags } from './pages/Tags'
import { TagDetail } from './pages/TagDetail'
import { Graph } from './pages/Graph'
import { Review } from './pages/Review'
import { NotFound } from './pages/NotFound'

// 文章详情页依赖 react-markdown + highlight.js（较重），懒加载按需引入
const PostDetail = lazy(() =>
  import('./pages/PostDetail').then((m) => ({ default: m.PostDetail }))
)

// 卡片复习会话同样依赖 react-markdown，懒加载复用同一 chunk
const Cards = lazy(() => import('./pages/Cards').then((m) => ({ default: m.Cards })))

/** 应用路由表 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="articles" element={<Articles />} />
        <Route
          path="posts/*"
          element={
            <Suspense fallback={<div className="empty">加载中…</div>}>
              <PostDetail />
            </Suspense>
          }
        />
        <Route path="archives" element={<Archives />} />
        <Route path="tags" element={<Tags />} />
        <Route path="tags/:tag" element={<TagDetail />} />
        <Route path="graph" element={<Graph />} />
        <Route path="review" element={<Review />} />
        <Route
          path="cards"
          element={
            <Suspense fallback={<div className="empty">加载中…</div>}>
              <Cards />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
