import { Link } from 'react-router-dom'

/** 404 页面 */
export function NotFound() {
  return (
    <div className="empty notfound">
      <h1 className="notfound__code">404</h1>
      <p>这个页面走丢了。</p>
      <Link className="btn" to="/">
        返回首页
      </Link>
    </div>
  )
}
