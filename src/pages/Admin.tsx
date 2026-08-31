import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { siteConfig } from '../config'

/**
 * 本地文章管理页（新增文章）。
 * 编辑/删除入口在文章详情页（dev only）；本页仅在 import.meta.env.DEV 下挂载。
 */

export function Admin() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = `管理 · ${siteConfig.title}`
    return () => {
      document.title = siteConfig.title
    }
  }, [])

  return (
    <div className="page admin">
      <h1 className="page__title">文章管理</h1>
      <p className="page__subtitle">
        新增文章 · 编辑/删除请到对应文章详情页（本地模式）
      </p>
      <PostCreate onCreated={(slug) => navigate(`/posts/${slug}`)} />
    </div>
  )
}

// ---------- 新增文章 ----------

function PostCreate({ onCreated }: { onCreated: (slug: string) => void }) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [tags, setTags] = useState('')
  const [description, setDescription] = useState('')
  const [noReview, setNoReview] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!title.trim()) {
      alert('标题不能为空')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
          description: description.trim() || undefined,
          noReview,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      onCreated(data.slug)
    } catch (e) {
      alert(`创建失败：${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-form">
      <div className="admin-form__row">
        <label>标题 *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="文章标题" />
      </div>
      <div className="admin-form__row">
        <label>slug（可选，缺省由标题推导）</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-post 或 tech/hello" />
      </div>
      <div className="admin-form__row">
        <label>标签（逗号分隔）</label>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="前端, CSS, 设计" />
      </div>
      <div className="admin-form__row">
        <label>摘要</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="一句话简介" />
      </div>
      <div className="admin-form__row admin-form__row--check">
        <label>
          <input
            type="checkbox"
            checked={noReview}
            onChange={(e) => setNoReview(e.target.checked)}
          />
          不参与复习系统
        </label>
      </div>
      <button type="button" className="btn" onClick={submit} disabled={submitting}>
        {submitting ? '创建中…' : '创建文章'}
      </button>
    </div>
  )
}
