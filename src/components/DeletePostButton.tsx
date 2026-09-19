import { useState } from 'react'
import { apiUrl } from '../lib/api'

/**
 * 文章详情页的「删除」按钮（dev only，依赖本地 API server）。
 * 删除文件后强制刷新 posts-index，让所有反向链接、相关推荐和图谱即时更新。
 */
export function DeletePostButton({
  slug,
  title,
}: {
  slug: string
  title: string
}) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function remove() {
    if (!confirm(`确认删除文章「${title}」？此操作不可撤销（会从 src/posts 删除文件并清理复习记录）。`)) {
      return
    }
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch(apiUrl('posts', slug), { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // 强制刷新文章索引，使其他文章的反向链接 / 相关推荐 / 图谱立即反映删除
      await fetch('/__refresh-posts-index').catch(() => {})
      // 硬刷新跳转：spa navigate 会复用旧的虚拟模块，全页刷新最稳妥
      window.location.href = '/'
    } catch (e) {
      setMsg(`删除失败：${e instanceof Error ? e.message : '未知错误'}（确认本地 API server 已启动）`)
      setBusy(false)
    }
  }

  return (
    <div className="delete-post">
      <button
        type="button"
        className="delete-post__btn"
        onClick={remove}
        disabled={busy}
        title="删除文章并更新所有反向链接"
      >
        {busy ? '删除中…' : '删除'}
      </button>
      {msg && <span className="delete-post__msg">{msg}</span>}
    </div>
  )
}