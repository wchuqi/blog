import { useEffect, useRef } from 'react'
import { siteConfig } from '../config'

/**
 * Giscus 评论组件（基于 GitHub Discussions，纯前端方案）。
 * 通过动态注入官方 script 加载，主题跟随站点深浅色。
 * 在 config.ts 里把 comments.enabled 设为 true 并填好仓库参数即可启用。
 */
export function Comments() {
  const ref = useRef<HTMLDivElement>(null)
  const c = siteConfig.comments

  useEffect(() => {
    if (!c.enabled || !ref.current) return
    // 避免重复注入（路由切换时）
    ref.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.setAttribute('data-repo', c.repo)
    script.setAttribute('data-repo-id', c.repoId)
    script.setAttribute('data-category', c.category)
    script.setAttribute('data-category-id', c.categoryId)
    script.setAttribute('data-mapping', c.mapping)
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'top')
    script.setAttribute('data-theme', c.theme)
    script.setAttribute('data-lang', c.lang)

    ref.current.appendChild(script)
  }, [c])

  if (!c.enabled) return null

  return (
    <section className="comments" aria-label="评论区">
      <h2 className="comments__title">评论</h2>
      <div ref={ref} className="giscus" />
    </section>
  )
}
