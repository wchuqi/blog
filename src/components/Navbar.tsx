import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { siteConfig } from '../config'
import { useTheme } from '../hooks/useTheme'
import { SearchBox } from './SearchBox'

/** 顶部导航栏：站点标题、导航链接、搜索、主题切换 */
export function Navbar() {
  const { theme, toggle } = useTheme()
  const [syncState, setSyncState] = useState<'idle' | 'syncing'>('idle')
  const [refreshState, setRefreshState] = useState<'idle' | 'busy'>('idle')

  // dev server 刷完复习数据后广播 reviews-synced：通知 /review 页重新拉取 review.json。
  // 按钮复位只靠 fetch 的 .finally，不依赖 HMR 自定义事件——旧代码用 HMR 事件复位按钮，
  // 但回调里误用 MessageEvent 的 e.data.event 判定（Vite 传的是 payload，恒为 undefined），
  // 复位永远不触发，按钮就永远停在「刷新中」。
  useEffect(() => {
    if (!import.meta.env.DEV) return
    // 后端 /__sync-reviews 成功后下发自定义事件。Vite 的 import.meta.hot.on 回调
    // 直接收到事件 payload（这里没带 payload，所以是 undefined），并非 MessageEvent，
    // 不能用 e.data.event 判断——回调只会在该事件名下触发，事件名本身就是判定依据。
    const onSynced = () => window.dispatchEvent(new Event('reviews-synced'))
    import.meta.hot?.on('reviews-synced', onSynced)
    return () => import.meta.hot?.off('reviews-synced', onSynced)
  }, [])

  // 提取可读的错误信息：超时 / 断连 / HTTP 状态各给一句明确提示
  const fetchErrorText = (e: unknown) => {
    if (e instanceof DOMException && e.name === 'TimeoutError') return '请求超时（dev server 可能已卡死，请重启 dev.bat）'
    if (e instanceof DOMException && e.name === 'AbortError') return '请求被中止'
    return '无法连接 dev server（可能已卡死或未启动，请重启 dev.bat）'
  }

  const syncReviews = () => {
    if (syncState === 'syncing') return
    setSyncState('syncing')
    // 3 分钟兜底超时：sync 脚本正常几秒内完成；若 dev server 卡死，
    // 没有超时的话 fetch 永不 settle，按钮会永远停在「刷新中」。
    fetch('/__sync-reviews', { signal: AbortSignal.timeout(180_000) })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          alert(`刷新复习数据失败：${body?.error ?? res.status}`)
        }
      })
      .catch((e) => {
        alert(`刷新复习数据失败：${fetchErrorText(e)}`)
      })
      .finally(() => {
        // 成功路径服务端会失效 posts-index 虚拟模块（触发 HMR 原地更新或整页刷新），
        // 但无论走哪条路，按钮状态必须由这里兜底复位，不能依赖 HMR 事件。
        setSyncState('idle')
      })
  }

  const refreshIndex = () => {
    if (refreshState === 'busy') return
    setRefreshState('busy')
    // 重扫 1350+ 篇文章是同步操作，约需 10 秒；同样加超时防 dev server 卡死时无响应。
    fetch('/__refresh-posts-index', { signal: AbortSignal.timeout(120_000) })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          alert(`重建索引失败：${body?.error ?? res.status}`)
        }
      })
      .catch((e) => {
        alert(`重建索引失败：${fetchErrorText(e)}`)
      })
      .finally(() => {
        setRefreshState('idle')
        window.location.reload()
      })
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <nav className="navbar__nav" aria-label="主导航">
          {siteConfig.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                'navbar__link' + (isActive ? ' navbar__link--active' : '')
              }
            >
              {item.label}
            </NavLink>
          ))}
          {/* dev 专用：手动重扫 src/posts 重建双链/搜索索引，应对文件删除或移动后监听漏事件 */}
          {import.meta.env.DEV && (
            <button
              type="button"
              className="navbar__link navbar__link--refresh"
              onClick={refreshIndex}
              disabled={refreshState === 'busy'}
              title="重新扫描 src/posts 并重建双链/搜索索引（约 10 秒，完成后页面自动刷新）"
            >
              {refreshState === 'busy' ? '扫描中…' : '更新双链'}
            </button>
          )}
          {/* dev 专用：跑 scripts/sync-reviews.py 刷复习快照 + review.json */}
          {import.meta.env.DEV && (
            <button
              type="button"
              className="navbar__link navbar__link--refresh"
              onClick={syncReviews}
              disabled={syncState === 'syncing'}
              title="运行 sync-reviews.py：把 SQLite 复习进度刷进 frontmatter 并重新生成 review.json"
            >
              {syncState === 'syncing' ? '刷新中…' : '更新复习'}
            </button>
          )}
        </nav>

        <div className="navbar__actions">
          <SearchBox />
          <button
            type="button"
            className="navbar__theme"
            onClick={toggle}
            aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}
