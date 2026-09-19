import { useState } from 'react'
import { apiUrl } from '../lib/api'

/**
 * 本地 dev 模式下的复习打分面板。
 * 调用 /api/cards/:slug/review 写入 SQLite。公网构建时通过 import.meta.env.DEV 守卫移除。
 */
export function ReviewPanel({ slug }: { slug: string }) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submitReview(grade: number) {
    setStatus('submitting')
    try {
      const res = await fetch(apiUrl('cards', slug, 'review'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setStatus('done')
      setMessage(
        `已记录 · 下次复习间隔 ${data.interval} 天（ease ${data.ease}，reps ${data.reps}）`
      )
    } catch (e) {
      setStatus('error')
      setMessage(`打分失败：${e instanceof Error ? e.message : '未知错误'}（确认本地 API server 已启动）`)
    }
  }

  return (
    <div className="review-panel">
      <div className="review-panel__title">复习打分（本地）</div>
      <div className="review-panel__buttons">
        <button
          type="button"
          className="review-panel__btn review-panel__btn--forgot"
          onClick={() => submitReview(0)}
          disabled={status === 'submitting'}
        >
          忘了
        </button>
        <button
          type="button"
          className="review-panel__btn review-panel__btn--vague"
          onClick={() => submitReview(4)}
          disabled={status === 'submitting'}
        >
          模糊
        </button>
        <button
          type="button"
          className="review-panel__btn review-panel__btn--remember"
          onClick={() => submitReview(5)}
          disabled={status === 'submitting'}
        >
          记得
        </button>
      </div>
      {message && (
        <p className={`review-panel__msg review-panel__msg--${status}`}>
          {message}
        </p>
      )}
      {status === 'done' && (
        <p className="review-panel__hint">
          记录已写入本地 SQLite。运行 <code>python scripts/sync-reviews.py</code> 后提交即可同步到公网。
        </p>
      )}
    </div>
  )
}
