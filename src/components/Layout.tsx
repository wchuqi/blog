import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

/** 全站布局：导航栏 + 主内容区 + 页脚 */
export function Layout() {
  return (
    <div className="app">
      <Navbar />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
