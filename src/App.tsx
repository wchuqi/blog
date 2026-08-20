import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Archives } from './pages/Archives'
import { Tags } from './pages/Tags'
import { TagDetail } from './pages/TagDetail'
import { Categories } from './pages/Categories'
import { CategoryDetail } from './pages/CategoryDetail'
import { Graph } from './pages/Graph'
import { Review } from './pages/Review'
import { About } from './pages/About'
import { NotFound } from './pages/NotFound'

// 文章详情页依赖 react-markdown + highlight.js（较重），懒加载按需引入
const PostDetail = lazy(() =>
  import('./pages/PostDetail').then((m) => ({ default: m.PostDetail }))
)

// Admin 页只在本地 dev 下挂载（Vditor + API 调用）；公网构建不打包
const Admin = import.meta.env.DEV
  ? lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })))
  : null

/** 应用路由表 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
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
        <Route path="categories" element={<Categories />} />
        <Route path="categories/:category" element={<CategoryDetail />} />
        <Route path="graph" element={<Graph />} />
        <Route path="review" element={<Review />} />
        {Admin && (
          <Route
            path="admin"
            element={
              <Suspense fallback={<div className="empty">加载中…</div>}>
                <Admin />
              </Suspense>
            }
          />
        )}
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
