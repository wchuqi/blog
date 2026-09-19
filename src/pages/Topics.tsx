import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getTopicGroups,
  getTopicStats,
  getUntopicedGroups,
  type Topic,
} from '../lib/topics'
import { siteConfig } from '../config'

/** 主题卡片：学科名称 + 描述 + 规模，点进去是该主题的目录页 */
function TopicCard({ topic }: { topic: Topic }) {
  const materials = topic.sections.find((s) => s.path === 'study-material')
  return (
    <Link to={`/topics/${topic.slug}`} className="topic-card">
      <div className="topic-card__head">
        <span className="topic-card__name">{topic.name}</span>
        <span className="topic-card__count">{topic.totalPosts}</span>
      </div>
      {topic.description && (
        <p className="topic-card__desc">{topic.description}</p>
      )}
      <div className="topic-card__meta">
        {topic.parents.length > 0 && (
          <span className="topic-card__path">{topic.parents.join(' / ')}</span>
        )}
        {materials && (
          <span className="topic-card__pill">学习材料 {materials.posts.length}</span>
        )}
        {topic.subtopics.length > 0 && (
          <span className="topic-card__pill">子主题 {topic.subtopics.length}</span>
        )}
        {topic.latest && <span className="topic-card__date">{topic.latest.slice(0, 10)}</span>}
      </div>
    </Link>
  )
}

/** 主题总览：把 src/posts 的目录结构 + 主题入口页提升成知识库的一级导航 */
export function Topics() {
  const groups = getTopicGroups()
  const stats = getTopicStats()
  const untopiced = getUntopicedGroups()

  useEffect(() => {
    document.title = `主题 · ${siteConfig.title}`
    return () => {
      document.title = siteConfig.title
    }
  }, [])

  return (
    <div className="page topics-page">
      <h1 className="page__title">主题</h1>
      <p className="page__subtitle">
        {stats.topics} 个主题 · 覆盖 {stats.coveredPosts} 篇文章
        {stats.uncoveredPosts > 0 && ` · 另有 ${stats.uncoveredPosts} 篇未归主题`}
      </p>

      {groups.map((group) => (
        <section className="topic-group" key={group.name}>
          <h2 className="topic-group__title">
            {group.name}
            <span className="topic-group__count">{group.topics.length}</span>
          </h2>
          <div className="topic-grid">
            {group.topics.map((topic) => (
              <TopicCard key={topic.slug} topic={topic} />
            ))}
          </div>
        </section>
      ))}

      {untopiced.length > 0 && (
        <section className="topic-group topic-group--muted">
          <h2 className="topic-group__title">未归主题</h2>
          <p className="topic-group__hint">
            这些目录下还没有 <code>X学习资料.md</code> 入口页，所以在上面看不到。
            补一个同名入口页就会自动变成主题；也可以直接去
            <Link to="/articles"> 文章目录 </Link>
            里按磁盘结构浏览。
          </p>
          <div className="knowledge-tags">
            {untopiced.map((g) => (
              <span className="knowledge-tag" key={g.name}>
                {g.name}
                <span>{g.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {groups.length === 0 && (
        <p className="empty">
          还没有主题。在 <code>src/posts</code> 的某个目录下放一个
          <code>X学习资料.md</code> 即可。
        </p>
      )}
    </div>
  )
}
