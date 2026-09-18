import { useState } from 'react'
import { Link } from 'react-router-dom'
import { allPosts } from '../lib/posts'
import { siteConfig } from '../config'
import { formatShortDate } from '../lib/format'

/** localStorage 键：记住用户手动展开的目录分支，下次进入保持一致 */
const TREE_STATE_KEY = 'articles-tree-open'

const loadOpenKeys = (): Set<string> => {
  try {
    const raw = localStorage.getItem(TREE_STATE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

interface DirectoryNode {
  name: string
  fullPath: string
  count: number
  directPosts: typeof allPosts
  latest: (typeof allPosts)[number] | null
  children: Map<string, DirectoryNode>
}

const collectPosts = (map: Map<string, DirectoryNode>): typeof allPosts => {
  let out: typeof allPosts = []
  for (const node of map.values()) {
    out = out.concat(node.directPosts, collectPosts(node.children))
  }
  return out
}

/** 文章总览页：按磁盘目录（slug 的目录段）组织的树形列表，默认全部收起 */
export function Articles() {
  const [openKeys, setOpenKeys] = useState<Set<string>>(loadOpenKeys)

  const buildDirectoryTree = () => {
    const root: Map<string, DirectoryNode> = new Map()

    for (const post of allPosts) {
      const segs = post.slug.split('/')
      if (segs.length <= 1) continue

      let level = root
      let fullPath = ''
      let parent: DirectoryNode | null = null
      for (let i = 0; i < segs.length - 1; i++) {
        const segment = segs[i]
        fullPath = fullPath ? `${fullPath}/${segment}` : segment
        if (!level.has(segment)) {
          level.set(segment, {
            name: segment,
            fullPath,
            count: 0,
            directPosts: [],
            latest: null,
            children: new Map(),
          })
        }
        const node = level.get(segment)!
        if (i === segs.length - 2) parent = node
        level = node.children
      }
      parent!.directPosts.push(post)
    }

    // 二次遍历：每个目录的 count = 子树文章总数；latest = 子树中日期最新的一篇
    const finalize = (map: Map<string, DirectoryNode>) => {
      for (const node of map.values()) {
        node.directPosts.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        const subtree = [...node.directPosts, ...collectPosts(node.children)]
        node.count = subtree.length
        node.latest = subtree.reduce<(typeof allPosts)[number] | null>(
          (m, p) => (!m || (p.date || '') >= (m.date || '')) ? p : m,
          null,
        )
        finalize(node.children)
      }
    }
    finalize(root)
    return root
  }

  const directoryTree = buildDirectoryTree()
  const uncategorizedPosts = [...allPosts]
    .filter((post) => !post.slug.includes('/'))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const setAll = (open: boolean) => {
    const keys = new Set<string>()
    if (open) {
      const collect = (map: Map<string, DirectoryNode>) => {
        for (const node of map.values()) {
          keys.add(node.fullPath)
          collect(node.children)
        }
      }
      collect(directoryTree)
      if (uncategorizedPosts.length > 0) keys.add('root')
    }
    setOpenKeys(keys)
    try {
      localStorage.setItem(TREE_STATE_KEY, JSON.stringify([...keys]))
    } catch {
      /* localStorage 不可用时仅本次会话生效 */
    }
  }

  const handleToggle = (key: string, open: boolean) => {
    setOpenKeys((prev) => {
      if (prev.has(key) === open) return prev
      const next = new Set(prev)
      if (open) next.add(key)
      else next.delete(key)
      try {
        localStorage.setItem(TREE_STATE_KEY, JSON.stringify([...next]))
      } catch {
        /* localStorage 不可用时仅本次会话生效 */
      }
      return next
    })
  }

  const renderDetails = (
    key: string,
    summaryClass: string,
    summary: React.ReactNode,
    children: React.ReactNode
  ) => (
    <details
      className="knowledge-tree__details"
      open={openKeys.has(key)}
      onToggle={(e) => handleToggle(key, e.currentTarget.open)}
    >
      <summary className={summaryClass}>{summary}</summary>
      {children}
    </details>
  )

  const renderDirectoryNode = (node: DirectoryNode, level = 0) => {
    const depthClass = `knowledge-tree__summary--l${Math.min(level, 3)}`
    return (
      <li className="knowledge-tree__branch" key={node.fullPath}>
        {renderDetails(
          node.fullPath,
          `knowledge-tree__summary ${depthClass}`,
          <>
            <span className="knowledge-tree__category-name">{node.name}</span>
            {node.latest && (
              <span className="knowledge-tree__latest">{node.latest.title}</span>
            )}
            <strong>{node.count}</strong>
          </>,
          <>
            {node.children.size > 0 && (
              <ul className="knowledge-tree__subcategories">
                {[...node.children.values()].map((child) => renderDirectoryNode(child, level + 1))}
              </ul>
            )}

            {node.directPosts.length > 0 && (
              <ul className="knowledge-tree__posts">
                {node.directPosts.map((post) => (
                  <li key={post.slug}>
                    <Link to={`/posts/${post.slug}`} className="knowledge-tree__post">
                      <span>{post.title}</span>
                      <time dateTime={post.date}>{formatShortDate(post.date)}</time>
                    </Link>
                    {post.tags && post.tags.length > 0 && (
                      <div className="knowledge-tree__tags">
                        {post.tags.map((tag) => (
                          <Link key={tag} to={`/tags/${encodeURIComponent(tag)}`}>
                            {tag}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </li>
    )
  }

  return (
    <div className="page articles">
      <h1 className="page__title">文章</h1>
      <p className="page__subtitle">共 {allPosts.length} 篇 · 按子目录展开</p>

      <div className="knowledge-tree__toolbar">
        <button type="button" className="btn-ghost" onClick={() => setAll(true)}>
          展开全部
        </button>
        <button type="button" className="btn-ghost" onClick={() => setAll(false)}>
          收起全部
        </button>
      </div>

      <div className="knowledge-panel knowledge-panel--wide">
        {directoryTree.size === 0 && uncategorizedPosts.length === 0 ? (
          <p className="knowledge-empty">还没有文章。</p>
        ) : (
          <div className="knowledge-tree" role="tree">
            <div className="knowledge-tree__root">
              <span>{siteConfig.title}</span>
              <strong>{allPosts.length} 篇</strong>
            </div>
            <ul className="knowledge-tree__branches">
              {[...directoryTree.values()].map((node) => renderDirectoryNode(node))}
              {uncategorizedPosts.length > 0 && (
                <li className="knowledge-tree__branch" key="root">
                  {renderDetails(
                    'root',
                    'knowledge-tree__summary knowledge-tree__summary--l0',
                    <>
                      <span className="knowledge-tree__category-name">根目录</span>
                      {uncategorizedPosts[0] && (
                        <span className="knowledge-tree__latest">{uncategorizedPosts[0].title}</span>
                      )}
                      <strong>{uncategorizedPosts.length}</strong>
                    </>,
                    <ul className="knowledge-tree__posts">
                      {uncategorizedPosts.map((post) => (
                        <li key={post.slug}>
                          <Link to={`/posts/${post.slug}`} className="knowledge-tree__post">
                            <span>{post.title}</span>
                            <time dateTime={post.date}>{formatShortDate(post.date)}</time>
                          </Link>
                          {post.tags && post.tags.length > 0 && (
                            <div className="knowledge-tree__tags">
                              {post.tags.map((tag) => (
                                <Link key={tag} to={`/tags/${encodeURIComponent(tag)}`}>
                                  {tag}
                                </Link>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
