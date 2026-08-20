import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { siteConfig } from '../config'

/**
 * 本地文章管理页（新增 / 编辑 frontmatter / 编辑正文 / 删除）。
 * 仅在 import.meta.env.DEV 下渲染；公网构建不打包此路由对应代码（见 App.tsx 动态导入守卫）。
 */

interface PostListItem {
  slug: string
  title: string
  date: string | null
  category: string | null
  path: string
}

interface PostDetail {
  slug: string
  raw: string
  content: string
  frontmatter: string
  title: string | null
}

export function Admin() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [detail, setDetail] = useState<PostDetail | null>(null)
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
  const [loading, setLoading] = useState(false)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/posts')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setPosts(await res.json())
    } catch (e) {
      console.error('加载文章列表失败：', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (slug: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${slug}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setDetail(await res.json())
    } catch (e) {
      console.error('加载文章详情失败：', e)
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = `管理 · ${siteConfig.title}`
    return () => {
      document.title = siteConfig.title
    }
  }, [])

  useEffect(() => {
    if (view === 'list') loadPosts()
  }, [view, loadPosts])

  useEffect(() => {
    if (selectedSlug && view === 'edit') loadDetail(selectedSlug)
  }, [selectedSlug, view, loadDetail])

  return (
    <div className="page admin">
      <h1 className="page__title">文章管理</h1>
      <p className="page__subtitle">
        本地模式 · 仅在 <code>npm run dev</code> 时可用
      </p>

      <div className="admin__toolbar">
        <button type="button" className="btn" onClick={() => setView('list')}>
          文章列表
        </button>
        <button type="button" className="btn" onClick={() => setView('create')}>
          新增文章
        </button>
      </div>

      {view === 'list' && (
        <PostList
          posts={posts}
          loading={loading}
          onEdit={(slug) => {
            setSelectedSlug(slug)
            setView('edit')
          }}
          onDeleted={() => loadPosts()}
        />
      )}

      {view === 'create' && <PostCreate onCreated={(slug) => {
        navigate(`/posts/${slug}`)
      }} />}

      {view === 'edit' && detail && (
        <PostEdit detail={detail} onSaved={() => loadDetail(detail.slug)} />
      )}
    </div>
  )
}

// ---------- 文章列表 ----------

function PostList({
  posts,
  loading,
  onEdit,
  onDeleted,
}: {
  posts: PostListItem[]
  loading: boolean
  onEdit: (slug: string) => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function deletePost(slug: string) {
    if (!confirm(`确认删除文章「${slug}」？此操作不可撤销（会删除 .md 文件和 SQLite 复习记录）。`)) return
    setDeleting(slug)
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      onDeleted()
    } catch (e) {
      alert(`删除失败：${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <p className="empty">加载中…</p>

  return (
    <ul className="admin-list">
      {posts.map((post) => (
        <li key={post.slug} className="admin-list__item">
          <div className="admin-list__info">
            <strong>{post.title}</strong>
            <span className="admin-list__meta">
              {post.date} · {post.category ?? '未分类'} · {post.slug}
            </span>
          </div>
          <div className="admin-list__actions">
            <button type="button" className="btn" onClick={() => onEdit(post.slug)}>
              编辑
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => deletePost(post.slug)}
              disabled={deleting === post.slug}
            >
              {deleting === post.slug ? '删除中…' : '删除'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ---------- 新增文章 ----------

function PostCreate({ onCreated }: { onCreated: (slug: string) => void }) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('')
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
          category: category.trim() || undefined,
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
        <label>分类</label>
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="如 AI/工具" />
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

// ---------- 编辑文章 ----------

function PostEdit({ detail, onSaved }: { detail: PostDetail; onSaved: () => void }) {
  const [content, setContent] = useState(detail.content)
  const [title, setTitle] = useState(detail.title ?? '')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [description, setDescription] = useState('')
  const [noReview, setNoReview] = useState(false)
  const [savingContent, setSavingContent] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)
  const [editorLoaded, setEditorLoaded] = useState(false)

  // 从 frontmatter 解析当前元数据（简单字符串提取）
  useEffect(() => {
    const fm = detail.frontmatter
    const get = (key: string) => {
      const m = new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(fm)
      return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : ''
    }
    setCategory(get('category'))
    setDescription(get('description'))
    setNoReview(/noReview:\s*true/.test(fm))
    const tagLines = fm
      .split('\n')
      .filter((l) => l.startsWith('  - '))
      .map((l) => l.replace(/^\s*-\s*/, ''))
    setTags(tagLines.join(', '))
  }, [detail])

  async function saveContent() {
    setSavingContent(true)
    try {
      const res = await fetch(`/api/posts/${detail.slug}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      alert('正文已保存')
      onSaved()
    } catch (e) {
      alert(`保存失败：${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setSavingContent(false)
    }
  }

  async function saveMeta() {
    setSavingMeta(true)
    try {
      const res = await fetch(`/api/posts/${detail.slug}/frontmatter`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || undefined,
          category: category.trim() || undefined,
          description: description.trim() || undefined,
          noReview,
          tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      alert('元数据已保存')
      onSaved()
    } catch (e) {
      alert(`保存失败：${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setSavingMeta(false)
    }
  }

  return (
    <div className="admin-edit">
      <h2 className="admin-edit__slug">{detail.slug}</h2>

      <section className="admin-form">
        <h3>Frontmatter</h3>
        <div className="admin-form__row">
          <label>标题</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="admin-form__row">
          <label>分类</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="admin-form__row">
          <label>标签（逗号分隔）</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div className="admin-form__row">
          <label>摘要</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
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
        <button type="button" className="btn" onClick={saveMeta} disabled={savingMeta}>
          {savingMeta ? '保存中…' : '保存元数据'}
        </button>
      </section>

      <section className="admin-edit__content">
        <h3>正文</h3>
        <LocalMarkdownEditor value={content} onChange={setContent} onReady={() => setEditorLoaded(true)} />
        <button type="button" className="btn" onClick={saveContent} disabled={savingContent || !editorLoaded}>
          {savingContent ? '保存中…' : '保存正文'}
        </button>
      </section>
    </div>
  )
}

// 本地 Vditor 编辑器（动态导入，dev only）
function LocalMarkdownEditor({
  value,
  onChange,
  onReady,
}: {
  value: string
  onChange: (v: string) => void
  onReady: () => void
}) {
  const [Editor, setEditor] = useState<React.ComponentType<{
    value: string
    onChange: (v: string) => void
  }> | null>(null)

  useEffect(() => {
    // 动态导入，生产构建会被 tree-shake（但此组件本身只在 DEV 路由下挂载）
    import('../components/MarkdownEditor').then((mod) => {
      setEditor(() => mod.MarkdownEditor)
      onReady()
    })
  }, [onReady])

  if (!Editor) return <p className="empty">编辑器加载中…</p>
  return <Editor value={value} onChange={onChange} />
}
