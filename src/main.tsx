import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
// Markdown 排版与语法高亮配色全部在 styles.css 里自定义，
// 不再依赖 github-markdown-css / highlight.js 自带主题，便于统一设计。
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* basename 取自 vite 的 base（import.meta.env.BASE_URL），
        子路径部署（GitHub Pages 项目站点）时路由才能正确匹配。
        BrowserRouter 的 basename 不需要结尾斜杠，这里去掉。 */}
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
