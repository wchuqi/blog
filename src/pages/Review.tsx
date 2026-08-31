import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../config'
import { formatDate } from '../lib/format'
import type { ReviewCard, ReviewData, ReviewExcludedItem, ReviewHeatmapCell } from '../lib/types'

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

  const { stats, cards, heatmap, excluded = [] } = data
  const reviewedCards = cards.filter((c) => c.reps > 0)

  const overdue = cards.filter((c) => c.dueIn < 0 && c.reps > 0)
  const dueToday = cards.filter((c) => c.dueIn === 0)
  const upcoming = cards
    .filter((c) => c.dueIn > 0 && c.dueIn <= 7)
    .sort((a, b) => a.dueIn - b.dueIn)
  const later = cards
    .filter((c) => c.dueIn > 7)
    .sort((a, b) => a.dueIn - b.dueIn)

  return (
    <div className="page review">
      <h1 className="page__title">复习看板</h1>
      <p className="page__subtitle">
        共 {stats.totalCards} 篇参与复习 · {excluded.length} 篇不在复习 · 累计复习 {stats.totalReviews} 次 · 连续 {stats.streakDays} 天
      </p>

      <ReviewStats stats={stats} />
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
      <ExcludedSection items={excluded} />
    </div>
  )
}

// ---------- 统计条 ----------

function ReviewStats({ stats }: { stats: ReviewData['stats'] }) {
  return (
    <section className="review-stats">
      <div className="review-stat">
        <div className="review-stat__value">{stats.totalCards}</div>
        <div className="review-stat__label">参与复习</div>
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
        <div className="review-stat__value">{stats.dueToday}</div>
        <div className="review-stat__label">今日待复习</div>
      </div>
      <div className="review-stat">
        <div className="review-stat__value">{stats.overdue}</div>
        <div className="review-stat__label">已逾期</div>
      </div>
      <div className="review-stat">
        <div className="review-stat__value">{stats.avgEase.toFixed(2)}</div>
        <div className="review-stat__label">平均难度</div>
      </div>
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

// ---------- 不在复习池的文章 ----------

function ExcludedSection({ items }: { items: ReviewExcludedItem[] }) {
  return (
    <section className="review-section review-section--excluded">
      <h2 className="review-section__title">
        不在复习里
        <span className="review-section__count">{items.length}</span>
      </h2>
      {items.length === 0 ? (
        <p className="review-section__empty">所有文章都在复习池中。</p>
      ) : (
        <ul className="review-list">
          {items.map((item) => (
            <li key={item.slug} className="review-list__item">
              <Link to={`/posts/${item.slug}`} className="review-list__link">
                {item.title}
              </Link>
              <div className="review-list__meta">
                <span className="review-list__due">已退出复习</span>
              </div>
            </li>
          ))}
        </ul>
      )}
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
