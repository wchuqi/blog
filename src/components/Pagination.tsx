import { Link } from 'react-router-dom'

interface PaginationProps {
  /** 当前页，从 1 开始 */
  current: number
  /** 总页数 */
  total: number
  /** 根据页码生成链接地址；第 1 页通常回到无参数路径 */
  hrefFor: (page: number) => string
}

/** 文章列表分页器 */
export function Pagination({ current, total, hrefFor }: PaginationProps) {
  if (total <= 1) return null

  // 生成要展示的页码：首尾 + 当前页附近，过多则用省略号
  const pages: (number | '…')[] = []
  const push = (p: number) => pages.push(p)
  const window = 1

  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - window && p <= current + window)) {
      push(p)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <nav className="pagination" aria-label="分页">
      {current > 1 ? (
        <Link className="pagination__btn" to={hrefFor(current - 1)} rel="prev">
          上一页
        </Link>
      ) : (
        <span className="pagination__btn pagination__btn--disabled">上一页</span>
      )}

      <ul className="pagination__pages">
        {pages.map((p, i) =>
          p === '…' ? (
            <li key={`gap-${i}`} className="pagination__gap">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                to={hrefFor(p)}
                className={
                  'pagination__page' +
                  (p === current ? ' pagination__page--active' : '')
                }
                aria-current={p === current ? 'page' : undefined}
              >
                {p}
              </Link>
            </li>
          )
        )}
      </ul>

      {current < total ? (
        <Link className="pagination__btn" to={hrefFor(current + 1)} rel="next">
          下一页
        </Link>
      ) : (
        <span className="pagination__btn pagination__btn--disabled">下一页</span>
      )}
    </nav>
  )
}
