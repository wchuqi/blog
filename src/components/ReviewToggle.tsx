import { useState } from 'react'

/**
 * 文章详情页的「复习」开关。
 * 仅在本地 dev 模式渲染（公网静态只读，没有 API server）。
 * 调用 PUT /api/posts/:slug/frontmatter 切换 noReview 字段。
 * 按钮文字始终为「复习」，通过灰/绿颜色区分状态。
 */
export function ReviewToggle({
  slug,
  inReview,
  setInReview,
}: {
  slug: string
  inReview: boolean
  setInReview: (next: boolean) => void
}) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function toggle() {
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch(`/api/posts/${slug}/frontmatter`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noReview: inReview }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setInReview(!inReview)
      fetch('/api/sync-review', { method: 'POST' }).catch(() => {})
    } catch (e) {
      setMsg(`操作失败：${e instanceof Error ? e.message : '未知错误'}（确认本地 API server 已启动）`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="review-toggle">
      <button
        type="button"
        className={
          'review-toggle__btn ' +
          (inReview ? 'review-toggle__btn--active' : 'review-toggle__btn--inactive')
        }
        onClick={toggle}
        disabled={busy}
      >
        复习
      </button>
      {msg && <span className="review-toggle__msg">{msg}</span>}
    </div>
  )
}
