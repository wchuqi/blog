import { useEffect } from 'react'
import { siteConfig } from '../config'
import { allPosts, getTags, getCategories } from '../lib/posts'

/** 关于页：站点简介 + 统计信息。可自由修改这里的文案。 */
export function About() {
  useEffect(() => {
    document.title = `关于 · ${siteConfig.title}`
    return () => {
      document.title = siteConfig.title
    }
  }, [])

  const totalWords = allPosts.reduce((sum, p) => sum + p.words, 0)

  return (
    <div className="page about">
      <h1 className="page__title">关于</h1>

      <div className="markdown-body">
        <p>
          你好，我是 <strong>{siteConfig.author}</strong>。{siteConfig.description}。
        </p>
        <p>
          这是一个用 Markdown 驱动的纯前端博客，基于 React + Vite 构建。
          所有文章都以 <code>.md</code> 文件的形式保存在 <code>src/posts</code> 目录下，
          带有 frontmatter 元数据，新增文章只需要丢一个 Markdown 文件进去。
        </p>

        <h2>站点统计</h2>
        <ul>
          <li>文章总数：{allPosts.length} 篇</li>
          <li>累计字数：约 {totalWords.toLocaleString()} 字</li>
          <li>标签数量：{getTags().length} 个</li>
          <li>分类数量：{getCategories().length} 个</li>
        </ul>

        {siteConfig.social.length > 0 && (
          <>
            <h2>联系我</h2>
            <ul>
              {siteConfig.social.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
