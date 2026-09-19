import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../config'
import { formatDate } from '../lib/format'
import type { ReviewCard, ReviewData, ReviewHeatmapCell } from '../lib/types'

const BASE_URL = import.meta.env.BASE_URL

/** 复习总览页：读 public/review.json 展示复习进度、热力图、趋势。 */
export function Review() {
  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    document.title = `复习 · ${siteConfig.title}`
    return () => {
      document.title = siteConfig.title
    }
  }, [])

  // dev 下点导航栏「更新复习」后，服务端会广播自定义事件触发这里重新拉取
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const onSynced = () => setReloadKey((k) => k + 1)
    window.addEventListener('reviews-synced', onSynced)
    return () => window.removeEventListener('reviews-synced', onSynced)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${BASE_URL}review.json?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((d: ReviewData) => {
        if (cancelled) return
        setData(d)
        setLoading(false)
      })
      .catch((e: Error) => {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  if (loading) {
    return (
      <div className="page review">
        <h1 className="page__title">复习看板</h1>
        <p className="empty">加载中…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page review">
        <h1 className="page__title">复习看板</h1>
        <p className="empty">
          暂无复习数据。请先在本地运行 <code>python scripts/sync-reviews.py</code> 生成
          <code>public/review.json</code>。
        </p>
      </div>
    )
  }

  const { stats, cards, heatmap } = data
  // 问答卡片（type: card）单独成流：不混入文章分组，聚合为一个「记忆卡片」面板
  const articleCards = cards.filter((c) => c.type !== 'card')
  const qaCards = cards.filter((c) => c.type === 'card')
  const reviewedCards = articleCards.filter((c) => c.reps > 0)

  const overdue = articleCards.filter((c) => c.dueIn < 0 && c.reps > 0)
  const dueToday = articleCards.filter((c) => c.dueIn === 0)
  const upcoming = articleCards
    .filter((c) => c.dueIn > 0 && c.dueIn <= 7)
    .sort((a, b) => a.dueIn - b.dueIn)
  const later = articleCards
    .filter((c) => c.dueIn > 7)
    .sort((a, b) => a.dueIn - b.dueIn)

  return (
    <div className="page review">
      <h1 className="page__title">复习看板</h1>
      <p className="page__subtitle">
        {articleCards.length} 篇文章 + {qaCards.length} 张卡片参与复习
        {stats.totalReviews > 0 && ` · 累计复习 ${stats.totalReviews} 次`}
        {stats.streakDays > 0 && ` · 连续 ${stats.streakDays} 天`}
      </p>

      {/* 统计条只算文章：卡片有 10000 张，混在一起会把文章的数字淹没，
          下面的四个分组列表也只列文章，数字与列表口径必须一致。 */}
      <ReviewStats stats={stats} articleCards={articleCards} />
      {qaCards.length > 0 && <CardSummaryPanel qaCards={qaCards} />}
      <ReviewHeatmap heatmap={heatmap} />
      <ReviewTrend cards={reviewedCards} />

      <ReviewSection
        title="已逾期"
        cards={overdue}
        empty="没有逾期文章。"
        highlight
      />
      <ReviewSection
        title="今日待复习"
        cards={dueToday}
        empty="今天没有待复习的文章。"
        highlight
      />
      <ReviewSection
        title="即将到期（7 天内）"
        cards={upcoming}
        empty="没有即将到期的文章。"
      />
      <ReviewSection
        title="尚未到期"
        cards={later}
        empty="所有文章都在 7 天内到期。"
      />

      <ExcludedPanel excluded={data.excluded ?? []} />
    </div>
  )
}

// ---------- 记忆卡片概览 ----------

function CardSummaryPanel({ qaCards }: { qaCards: ReviewCard[] }) {
  const due = qaCards.filter((c) => c.dueIn <= 0)
  const overdue = qaCards.filter((c) => c.dueIn < 0 && c.reps > 0)

  return (
    <section className="card-summary">
      <h2 className="review-section__title">
        记忆卡片
        <span className="review-section__count">{qaCards.length}</span>
      </h2>
      <div className="card-summary__stats">
        <span>今日到期 {due.length}</span>
        <span>已逾期 {overdue.length}</span>
        <Link className="btn card-summary__cta" to="/cards">
          开始复习卡片 →
        </Link>
      </div>
      {due.length > 0 && (
        <ul className="card-summary__list">
          {due.slice(0, 6).map((c) => (
            <li key={c.slug}>
              <Link to={`/posts/${c.slug}`}>{c.title}</Link>
              <span className="card-summary__due">
                {c.dueIn < 0 ? `逾期 ${-c.dueIn} 天` : '今天'}
              </span>
            </li>
          ))}
          {due.length > 6 && <li className="card-summary__more">…等 {due.length} 张</li>}
        </ul>
      )}
    </section>
  )
}

// ---------- 统计条 ----------

/**
 * 统计条。
 *
 * 注意：review.json 的 stats 是「文章 + 卡片」的全局值，而本页四个分组列表
 * 只列文章（卡片有 10002 张，混进来就没法看了）。所以这里以文章口径重新算，
 * 卡片数量只在「记忆卡片」面板里单独展示——避免出现「参与复习 10004」
 * 紧跟着「今日待复习 2」这种读者无法理解的口径跳跃。
 */
function ReviewStats({
  stats,
  articleCards,
}: {
  stats: ReviewData['stats']
  articleCards: ReviewCard[]
}) {
  const dueToday = articleCards.filter((c) => c.dueIn <= 0).length
  const overdue = articleCards.filter((c) => c.dueIn < 0 && c.reps > 0).length
  const started = articleCards.filter((c) => c.reps > 0).length

  return (
    <section className="review-stats">
      <div className="review-stat">
        <div className="review-stat__value">{articleCards.length}</div>
        <div className="review-stat__label">在复习池</div>
      </div>
      <div className="review-stat">
        <div className="review-stat__value">{started}</div>
        <div className="review-stat__label">已开始复习</div>
      </div>
      <div className="review-stat">
        <div className="review-stat__value">{stats.totalReviews}</div>
        <div className="review-stat__label">累计复习</div>
      </div>
      <div className="review-stat">
        <div className="review-stat__value">{stats.streakDays}</div>
        <div className="review-stat__label">连续天数</div>
      </div>
      <div className="review-stat">
        <div className="review-stat__value">{dueToday}</div>
        <div className="review-stat__label">今日待复习</div>
      </div>
      <div className="review-stat">
        <div className="review-stat__value">{overdue}</div>
        <div className="review-stat__label">已逾期</div>
      </div>
      <div className="review-stat">
        <div className="review-stat__value">{stats.avgEase.toFixed(2)}</div>
        <div className="review-stat__label">平均难度</div>
      </div>
    </section>
  )
}

// ---------- 不在复习里的文章 ----------

/**
 * 被排除的文章（frontmatter 标了 noReview）。
 *
 * 数量很大（全库 1352 篇），但之前只在统计里提一句、没有任何入口，
 * 读者既不知道是哪些、也不知道怎么把它们加回复习。这里按目录聚合并给出样例。
 */
function ExcludedPanel({ excluded }: { excluded: { slug: string; title: string }[] }) {
  const byDir = useMemo(() => {
    const map = new Map<string, { title: string; slug: string }[]>()
    for (const item of excluded) {
      const i = item.slug.lastIndexOf('/')
      const dir = i === -1 ? '根目录' : item.slug.slice(0, i)
      const list = map.get(dir)
      if (list) list.push(item)
      else map.set(dir, [item])
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [excluded])

  if (excluded.length === 0) return null

  return (
    <section className="review-section">
      <h2 className="review-section__title">
        不在复习里
        <span className="review-section__count">{excluded.length}</span>
      </h2>
      <p className="review-section__empty">
        这些文章在 frontmatter 标了 <code>noReview: true</code>，不参与遗忘曲线复习。
        在 dev 模式下打开任意一篇，用页面上的开关即可重新加入。
      </p>
      <ul className="review-list">
        {byDir.slice(0, 12).map(([dir, items]) => (
          <li className="review-list__item" key={dir}>
            <Link className="review-list__link" to={`/search?q=&scope=article&path=${encodeURIComponent(dir)}`}>
              {dir}
            </Link>
            <span className="review-list__meta">{items.length} 篇</span>
          </li>
        ))}
      </ul>
      {byDir.length > 12 && (
        <p className="review-section__empty">…另有 {byDir.length - 12} 个目录</p>
      )}
    </section>
  )
}

// ---------- 热力图（GitHub 贡献图风格） ----------

function ReviewHeatmap({ heatmap }: { heatmap: ReviewHeatmapCell[] }) {
  const cells = useMemo(() => {
    const map = new Map(heatmap.map((c) => [c.date, c.count]))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days: { date: string; count: number }[] = []
    // 最近 182 天（约半年）
    for (let i = 181; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      days.push({ date: iso, count: map.get(iso) ?? 0 })
    }
    return days
  }, [heatmap])

  const maxCount = useMemo(
    () => Math.max(1, ...cells.map((c) => c.count)),
    [cells]
  )

  const level = (count: number) => {
    if (count === 0) return 0
    const ratio = count / maxCount
    if (ratio > 0.75) return 4
    if (ratio > 0.5) return 3
    if (ratio > 0.25) return 2
    return 1
  }

  // 按 7 列（一周）分组
  const weeks: { date: string; count: number }[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return (
    <section className="review-heatmap">
      <h2 className="review-section__title">复习热力图（近半年）</h2>
      <div className="review-heatmap__grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="review-heatmap__col">
            {week.map((cell) => (
              <div
                key={cell.date}
                className={`review-heatmap__cell level-${level(cell.count)}`}
                title={`${cell.date}: ${cell.count} 次`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="review-heatmap__legend">
        <span>少</span>
        <div className="review-heatmap__cell level-1" />
        <div className="review-heatmap__cell level-2" />
        <div className="review-heatmap__cell level-3" />
        <div className="review-heatmap__cell level-4" />
        <span>多</span>
      </div>
    </section>
  )
}

// ---------- 趋势图：ease 演化 ----------

function ReviewTrend({ cards }: { cards: ReviewCard[] }) {
  // 取所有有历史记录的卡片，画 ease 变化趋势
  const points = useMemo(() => {
    const pts: { x: number; y: number; label: string }[] = []
    for (const card of cards) {
      card.history.forEach((h, i) => {
        pts.push({ x: i, y: h.ease, label: `${card.slug} #${i}` })
      })
    }
    return pts
  }, [cards])

  if (points.length === 0) return null

  const width = 600
  const height = 120
  const padding = 20
  const maxReps = Math.max(...cards.map((c) => c.history.length), 1)

  const xScale = (x: number) =>
    padding + (x / Math.max(1, maxReps - 1)) * (width - padding * 2)
  const yScale = (y: number) =>
    height - padding - ((y - 1.3) / (3.0 - 1.3)) * (height - padding * 2)

  return (
    <section className="review-trend">
      <h2 className="review-section__title">难度系数趋势</h2>
      <svg viewBox={`0 0 ${width} ${height}`} className="review-trend__svg">
        {/* y 轴范围线 1.3-3.0 */}
        <line x1={padding} y1={yScale(1.3)} x2={width - padding} y2={yScale(1.3)} stroke="var(--border)" />
        <line x1={padding} y1={yScale(2.5)} x2={width - padding} y2={yScale(2.5)} stroke="var(--border)" strokeDasharray="4 4" />
        <line x1={padding} y1={yScale(3.0)} x2={width - padding} y2={yScale(3.0)} stroke="var(--border)" />
        <text x={4} y={yScale(3.0)} fontSize="10" fill="var(--text-soft)">3.0</text>
        <text x={4} y={yScale(1.3)} fontSize="10" fill="var(--text-soft)">1.3</text>
        {cards.map((card) => {
          if (card.history.length < 2) return null
          const path = card.history
            .map((h, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(h.ease)}`)
            .join(' ')
          return <path key={card.slug} d={path} fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.4" />
        })}
        {points.map((p, i) => (
          <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r="2" fill="var(--accent)" opacity="0.6" />
        ))}
      </svg>
    </section>
  )
}

// ---------- 分组列表 ----------

function ReviewSection({
  title,
  cards,
  empty,
  highlight = false,
}: {
  title: string
  cards: ReviewCard[]
  empty: string
  highlight?: boolean
}) {
  return (
    <section className={`review-section ${highlight ? 'review-section--highlight' : ''}`}>
      <h2 className="review-section__title">
        {title}
        <span className="review-section__count">{cards.length}</span>
      </h2>
      {cards.length === 0 ? (
        <p className="review-section__empty">{empty}</p>
      ) : (
        <ul className="review-list">
          {cards.map((card) => (
            <li key={card.slug} className="review-list__item">
              <Link to={`/posts/${card.slug}`} className="review-list__link">
                {card.title}
              </Link>
              <div className="review-list__meta">
                <span className="review-list__stat">复习 {card.reps} 次</span>
                <span className="review-list__stat">难度 {card.ease.toFixed(2)}</span>
                <span className="review-list__stat">间隔 {card.interval} 天</span>
                {card.reps > 0 && (
                  <span className="review-list__stat">
                    保留率 {Math.round(card.retention * 100)}%
                  </span>
                )}
                {card.dueIn < 0 && card.reps > 0 ? (
                  <span className="review-list__due review-list__due--overdue">
                    逾期 {-card.dueIn} 天
                  </span>
                ) : card.dueIn === 0 ? (
                  <span className="review-list__due review-list__due--today">今天</span>
                ) : (
                  <span className="review-list__due">
                    {formatDate(card.nextReview)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
