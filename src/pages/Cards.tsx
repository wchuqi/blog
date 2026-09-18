import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  allCards,
  cardGroupOf,
  daysUntilDue,
  getCardGroups,
  getCardTags,
  getDueCards,
  getPostContent,
} from '../lib/posts'
import { parseCardBody } from '../lib/cards'
import { formatDate } from '../lib/format'
import { siteConfig } from '../config'
import type { Post } from '../lib/types'

/**
 * 卡片复习页（Anki 式）：
 * - 分组 = 卡片文件所在子目录（与文章的目录分类同理），标签 = frontmatter tags
 * - 「复习」标签页：到期队列的翻转会话（看问题 → 显示答案 → 打分，仅 dev）
 * - 「卡片库」标签页：全部卡片按分组浏览，可点分组/标签筛选
 * - 队列来自 frontmatter review 快照静态计算；打分写本地 SQLite（仅 dev）
 */

/** 分组筛选：'all' = 全部，'none' = 未分组，其余为目录前缀 */
type GroupFilter = string
const GROUP_ALL = 'all'
const GROUP_NONE = 'none'
const TAG_ALL = 'all'

/** 复习会话每批最多进入队列的卡片数（大词库下防止 0/10000 的进度条和过长会话） */
const SESSION_BATCH = 100
/** 卡片库首屏渲染条数，之后按页加载 */
const LIBRARY_PAGE = 300
/** SM-2 评分 → 文案（0 = 忘了、4 = 模糊、5 = 记得） */
const GRADE_LABEL: Record<number, string> = { 0: '忘了', 4: '模糊', 5: '记得' }

/** 两个视图共用的筛选器 */
function matchFilters(post: Post, group: GroupFilter, tag: string): boolean {
  if (group !== GROUP_ALL && cardGroupOf(post) !== (group === GROUP_NONE ? null : group)) {
    return false
  }
  if (tag !== TAG_ALL && !(post.tags ?? []).includes(tag)) {
    return false
  }
  return true
}

export function Cards() {
  const [mode, setMode] = useState<'review' | 'library'>('review')
  const [group, setGroup] = useState<GroupFilter>(GROUP_ALL)
  const [tag, setTag] = useState<string>(TAG_ALL)

  const groups = useMemo(() => getCardGroups(), [])
  const tags = useMemo(() => getCardTags(), [])
  const totalDue = useMemo(() => getDueCards().length, [])

  useEffect(() => {
    document.title = `卡片复习 · ${siteConfig.title}`
    return () => {
      document.title = siteConfig.title
    }
  }, [])

  if (allCards.length === 0) {
    return (
      <div className="page cards-session">
        <h1 className="page__title">卡片复习</h1>
        <p className="empty">
          还没有问答卡片。卡片是 frontmatter 标了 <code>type: card</code> 的 .md 文件，
          正文写成 <code># 问题</code> / <code># 答案</code> 两段即可；
          放进子目录即为分组，frontmatter 的 <code>tags</code> 即卡片标签。
        </p>
      </div>
    )
  }

  return (
    <div className="page cards-session">
      <h1 className="page__title">卡片复习</h1>

      <div className="cards-tabs">
        <button
          type="button"
          className={'cards-tabs__btn' + (mode === 'review' ? ' cards-tabs__btn--active' : '')}
          onClick={() => setMode('review')}
        >
          复习<span className="cards-tabs__count">{totalDue}</span>
        </button>
        <button
          type="button"
          className={'cards-tabs__btn' + (mode === 'library' ? ' cards-tabs__btn--active' : '')}
          onClick={() => setMode('library')}
        >
          卡片库<span className="cards-tabs__count">{allCards.length}</span>
        </button>
      </div>

      <FilterBar
        groups={groups}
        tags={tags}
        group={group}
        tag={tag}
        onGroup={setGroup}
        onTag={setTag}
      />

      {mode === 'review' ? (
        // key：切换筛选后重开会话（已打分的卡已写库，进度重置无碍）
        <CardSession key={`${group}|${tag}`} group={group} tag={tag} totalDue={totalDue} />
      ) : (
        <CardLibrary key={`${group}|${tag}`} group={group} tag={tag} onTag={setTag} />
      )}
    </div>
  )
}

// ---------- 筛选栏 ----------

function FilterBar({
  groups,
  tags,
  group,
  tag,
  onGroup,
  onTag,
}: {
  groups: { name: string | null; count: number }[]
  tags: { name: string; count: number }[]
  group: GroupFilter
  tag: string
  onGroup: (g: GroupFilter) => void
  onTag: (t: string) => void
}) {
  return (
    <div className="cards-filters">
      <div className="cards-filters__row">
        <span className="cards-filters__label">分组</span>
        <Chip active={group === GROUP_ALL} onClick={() => onGroup(GROUP_ALL)}>
          全部
        </Chip>
        {groups.map((g) => (
          <Chip
            key={g.name ?? 'root'}
            active={group === (g.name ?? GROUP_NONE)}
            onClick={() => onGroup(g.name ?? GROUP_NONE)}
          >
            {g.name ?? '未分组'}（{g.count}）
          </Chip>
        ))}
      </div>
      {tags.length > 0 && (
        <div className="cards-filters__row">
          <span className="cards-filters__label">标签</span>
          <Chip active={tag === TAG_ALL} onClick={() => onTag(TAG_ALL)}>
            全部
          </Chip>
          {tags.map((t) => (
            <Chip key={t.name} active={tag === t.name} onClick={() => onTag(t.name)}>
              {t.name}（{t.count}）
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={'chip' + (active ? ' chip--active' : '')}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// ---------- 复习会话 ----------

function CardSession({ group, tag, totalDue }: { group: GroupFilter; tag: string; totalDue: number }) {
  // 会话开始时的到期队列（每批最多 SESSION_BATCH 张）；本会话内打过分的卡片不再出现
  const queue = useMemo(
    () => getDueCards().filter((p) => matchFilters(p, group, tag)).slice(0, SESSION_BATCH),
    [group, tag]
  )
  /** 本会话给出的评分：slug -> grade。打分过的卡不再作为「新卡」前进 */
  const [grades, setGrades] = useState<Map<string, number>>(() => new Map())
  /** 被「跳过」的卡（离开时未打分）。回头再打分的会从中移除，避免重复计数 */
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set())
  /** 会话内实际看过的卡（queue 下标），按展示顺序且严格递增；「上一张」就是沿它回看 */
  const [trail, setTrail] = useState<number[]>(() => (queue.length > 0 ? [0] : []))
  /** 游标在 trail 中的位置；等于 trail.length - 1 时位于最前沿 */
  const [trailPos, setTrailPos] = useState(0)
  /** 前沿已无未看过的卡 */
  const [finished, setFinished] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [content, setContent] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [syncing, setSyncing] = useState(false)

  const graded = grades.size
  const skippedCount = skipped.size
  /**
   * 进度条/标签显示「当前是第几张」，所以点「上一张」会回退（11/100 → 10/100）。
   * 注意不能拿 processedCount 当进度：展示过不等于处理过，而且回看时它不会变。
   */
  const position = trailPos + 1
  /** 真正处理过的数量（打分 ∪ 跳过），只用于完成页统计 */
  const processedCount = graded + skippedCount
  const current: Post | undefined = finished ? undefined : queue[trail[trailPos]]
  /**
   * 已打分的卡回看时只读：再打一次会给 SQLite 追加一条 review、把 SM-2 间隔推两轮。
   */
  const currentGrade = current ? grades.get(current.slug) : undefined
  const isGraded = currentGrade !== undefined
  /** 已打分的卡直接展开答案，回看时不必再点一次「显示答案」 */
  const showAnswer = revealed || isGraded

  // 换卡：懒加载正文并重置翻转状态
  useEffect(() => {
    setRevealed(false)
    setMsg('')
    setContent(undefined)
    if (!current) return
    let cancelled = false
    getPostContent(current.slug).then((raw) => {
      if (!cancelled) setContent(raw ?? '')
    })
    return () => {
      cancelled = true
    }
  }, [current])

  const qa = useMemo(() => (content === undefined ? null : parseCardBody(content)), [content])

  /**
   * 前进：未到前沿时沿 trail 回放；到了前沿才取下一张没看过的卡。
   * 只有「从最前沿往前走」才把当前卡记为跳过——回放不应改变任何卡的状态。
   * asGraded：由 grade() 调用，此时当前卡当作已打分（grades 还是旧值，不能靠它判断）。
   */
  const goNext = useCallback(
    (asGraded = false) => {
      if (trailPos < trail.length - 1) {
        setTrailPos((p) => p + 1)
        return
      }
      const leaving = queue[trail[trailPos]]
      if (leaving && !asGraded && !grades.has(leaving.slug)) {
        setSkipped((s) => new Set(s).add(leaving.slug))
      }
      for (let i = trail[trailPos] + 1; i < queue.length; i++) {
        if (!grades.has(queue[i].slug)) {
          setTrail((t) => [...t, i])
          setTrailPos((p) => p + 1)
          return
        }
      }
      setFinished(true)
    },
    [trail, trailPos, queue, grades]
  )

  /** 后退：回看上一张（可能是已打分卡，渲染成只读） */
  const goPrev = useCallback(() => {
    setFinished(false)
    setTrailPos((p) => Math.max(0, p - 1))
  }, [])

  const grade = useCallback(
    async (g: number) => {
      if (!current || submitting || isGraded) return
      setSubmitting(true)
      setMsg('')
      try {
        const res = await fetch(`/api/cards/${current.slug}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grade: g }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        setGrades((m) => new Map(m).set(current.slug, g))
        // 之前跳过过这张、现在补打分了：从跳过集合里拿掉，免得进度重复计一次
        setSkipped((s) => {
          if (!s.has(current.slug)) return s
          const next = new Set(s)
          next.delete(current.slug)
          return next
        })
        // 打分后前进。goNext(true) 表示当前卡已算已处理，别再记成跳过。
        goNext(true)
      } catch (e) {
        setMsg(`打分失败：${e instanceof Error ? e.message : '未知错误'}（确认本地 API server 已启动）`)
      } finally {
        setSubmitting(false)
      }
    },
    [current, submitting, isGraded, goNext]
  )

  const syncAll = useCallback(() => {
    setSyncing(true)
    fetch('/__sync-reviews')
      .then((res) => (res.ok ? null : res.json().then((b) => Promise.reject(b?.error))))
      .then(() => setMsg('复习数据已同步到 frontmatter 与 review.json。'))
      .catch((e) => setMsg(`同步失败：${typeof e === 'string' ? e : '未知错误'}`))
      .finally(() => setSyncing(false))
  }, [])

  // 键盘：空格翻面；← / → 换卡；翻面后 1/2/3 = 忘了/模糊/记得（仅 dev）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      // 打分请求在飞的时候忽略按键，避免请求回来后 goNext 再往前推一格
      if (!current || submitting) return
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        if (!showAnswer) setRevealed(true)
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
        return
      }
      if (showAnswer && !isGraded && import.meta.env.DEV && e.key >= '1' && e.key <= '3') {
        e.preventDefault()
        grade([0, 4, 5][Number(e.key) - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, submitting, showAnswer, isGraded, grade, goNext, goPrev])

  if (queue.length === 0) {
    return (
      <p className="empty">
        {totalDue === 0
          ? '没有到期的问答卡片，复习完成。'
          : '当前筛选下没有到期卡片，可切到「卡片库」查看全部，或换个分组/标签。'}
      </p>
    )
  }

  // 会话完成
  if (!current) {
    const remainingDue = Math.max(0, totalDue - graded)
    return (
      <div className="cards-done">
        <div className="cards-done__emoji">✓</div>
        <p className="cards-done__text">
          本轮复习完成：处理 {processedCount} 张，其中打分 {graded} 张、跳过 {skippedCount} 张。
          {skippedCount > 0 && (
            <>
              <br />
              跳过的卡片不算复习过，仍计为到期，下一批会再次出现。
            </>
          )}
          {remainingDue > 0 && (
            <>
              <br />
              {import.meta.env.DEV
                ? `还有 ${remainingDue} 张到期：点下方「同步复习数据」，同步完成后重新进入本页即可继续下一批。`
                : `还有 ${remainingDue} 张到期。公网环境不计分，队列不会推进；想看其它卡片请切到「卡片库」。`}
            </>
          )}
        </p>
        {msg && <p className="card-review__msg">{msg}</p>}
        <div className="cards-done__actions">
          {trail.length > 0 && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setFinished(false)
                setTrailPos(trail.length - 1)
              }}
            >
              回看最后一张
            </button>
          )}
          {import.meta.env.DEV && (
            <button
              type="button"
              className="btn"
              onClick={syncAll}
              disabled={syncing}
              title="运行 sync-reviews.py：把打分结果刷进卡片 frontmatter 并重新生成 review.json"
            >
              {syncing ? '同步中…' : '同步复习数据'}
            </button>
          )}
          <Link className="btn" to="/review">
            查看复习看板
          </Link>
        </div>
      </div>
    )
  }

  const review = current.review

  return (
    <>
      <div className="cards-progress">
        <div className="cards-progress__bar">
          <div
            className="cards-progress__fill"
            style={{ transform: `scaleX(${position / queue.length})` }}
          />
        </div>
        <span className="cards-progress__label">
          {position} / {queue.length}
        </span>
        <span className="cards-progress__hint">
          {import.meta.env.DEV
            ? '空格 显示答案 · 1/2/3 打分 · ← → 换卡'
            : '空格 显示答案 · ← → 换卡'}
        </span>
      </div>

      <article className="flip-card">
        <header className="flip-card__head">
          <span className="flip-card__badge">卡片</span>
          <Link className="flip-card__title" to={`/posts/${current.slug}`}>
            {current.title}
          </Link>
          {cardGroupOf(current) && (
            <span className="flip-card__group">{cardGroupOf(current)}</span>
          )}
        </header>

        <section className="flip-card__face">
          <div className="flip-card__label">问题</div>
          {content === undefined ? (
            <p className="empty">加载中…</p>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{qa?.question ?? ''}</ReactMarkdown>
            </div>
          )}
        </section>

        <section className={`flip-card__face flip-card__face--answer ${showAnswer ? 'is-revealed' : ''}`}>
          <div className="flip-card__label">答案</div>
          {showAnswer ? (
            qa &&
            (qa.answer ? (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{qa.answer}</ReactMarkdown>
              </div>
            ) : (
              <p className="flip-card__missing">该卡片没有「# 答案」段，请检查正文格式。</p>
            ))
          ) : (
            <button type="button" className="flip-card__reveal" onClick={() => setRevealed(true)}>
              显示答案
            </button>
          )}
        </section>

        {review && (
          <div className="flip-card__meta">
            <span>复习 {review.reps} 次</span>
            <span>间隔 {review.interval} 天</span>
            <span>难度 {review.ease.toFixed(2)}</span>
            {review.lastReview && <span>上次 {formatDate(review.lastReview)}</span>}
          </div>
        )}

        <footer className="flip-card__actions">
          {currentGrade !== undefined && (
            <p className="flip-card__graded">
              已打分「{GRADE_LABEL[currentGrade]}」。回看时不可重复打分（再写一条 review
              会把 SM-2 间隔推两轮）；要改分请去
              <Link to={`/posts/${current.slug}`}>文章页</Link>用「复习」面板。
            </p>
          )}
          {!isGraded && showAnswer && import.meta.env.DEV && (
            <>
              <button
                type="button"
                className="review-panel__btn review-panel__btn--forgot"
                onClick={() => grade(0)}
                disabled={submitting}
              >
                忘了
              </button>
              <button
                type="button"
                className="review-panel__btn review-panel__btn--vague"
                onClick={() => grade(4)}
                disabled={submitting}
              >
                模糊
              </button>
              <button
                type="button"
                className="review-panel__btn review-panel__btn--remember"
                onClick={() => grade(5)}
                disabled={submitting}
              >
                记得
              </button>
            </>
          )}
          {!isGraded && showAnswer && !import.meta.env.DEV && (
            <p className="flip-card__prod-hint">
              打分需要运行本地写作环境（<code>npm run api</code> + <code>npm run dev</code>），
              公网仅支持翻转查看。
            </p>
          )}
          {/* 上一张/下一张在任何状态下都存在：回看与前进都不会卡死 */}
          <button
            type="button"
            className="btn"
            onClick={goPrev}
            disabled={trailPos === 0 || submitting}
          >
            上一张
          </button>
          <button type="button" className="btn" onClick={() => goNext()} disabled={submitting}>
            下一张
          </button>
        </footer>

        {msg && <p className="card-review__msg card-review__msg--error">{msg}</p>}
      </article>
    </>
  )
}

// ---------- 卡片库 ----------

function CardLibrary({
  group,
  tag,
  onTag,
}: {
  group: GroupFilter
  tag: string
  onTag: (t: string) => void
}) {
  const [visible, setVisible] = useState(LIBRARY_PAGE)

  const filtered = useMemo(
    () => allCards.filter((p) => matchFilters(p, group, tag)),
    [group, tag]
  )

  const byGroup = useMemo(() => {
    const m = new Map<string | null, Post[]>()
    for (const c of filtered) {
      const g = cardGroupOf(c)
      if (!m.has(g)) m.set(g, [])
      m.get(g)!.push(c)
    }
    return [...m.entries()].sort((a, b) => (a[0] ?? '').localeCompare(b[0] ?? ''))
  }, [filtered])

  if (filtered.length === 0) {
    return <p className="empty">当前筛选下没有卡片。</p>
  }

  // 大词库下分批渲染：每组按剩余预算截取，超出部分由「加载更多」补
  let budget = visible
  let shownCount = 0
  const shown = byGroup.map(([g, cards]) => {
    const take = cards.slice(0, Math.max(0, budget))
    budget -= take.length
    shownCount += take.length
    return { g, take, total: cards.length }
  })
  const hasMore = shownCount < filtered.length

  return (
    <div className="card-library">
      {shown.map(({ g, take, total }) => take.length > 0 && (
        <section key={g ?? 'root'} className="card-library__group">
          <h2 className="card-library__group-title">
            {g ?? '未分组'}
            <span className="review-section__count">
              {take.length === total ? total : `${take.length} / ${total}`}
            </span>
          </h2>
          <ul className="card-library__list">
            {take
              .slice()
              .sort((a, b) => {
                const da = daysUntilDue(a.review) ?? Infinity
                const db = daysUntilDue(b.review) ?? Infinity
                return da - db
              })
              .map((c) => {
                const due = daysUntilDue(c.review)
                return (
                  <li key={c.slug} className="card-library__item">
                    <Link className="card-library__title" to={`/posts/${c.slug}`}>
                      {c.title}
                    </Link>
                    <div className="card-library__meta">
                      {(c.tags ?? []).map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={'chip chip--tag' + (tag === t ? ' chip--active' : '')}
                          onClick={() => onTag(t)}
                          title={`筛选标签「${t}」`}
                        >
                          {t}
                        </button>
                      ))}
                      <span>复习 {c.review?.reps ?? 0} 次</span>
                      <span
                        className={
                          'card-library__due' +
                          (due !== null && due <= 0 ? ' card-library__due--now' : '')
                        }
                      >
                        {c.review
                          ? due === null
                            ? '待同步'
                            : due < 0
                              ? `逾期 ${-due} 天`
                              : due === 0
                                ? '今天到期'
                                : `${due} 天后`
                          : '新卡'}
                      </span>
                    </div>
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
      {hasMore && (
        <button
          type="button"
          className="btn card-library__more"
          onClick={() => setVisible((v) => v + LIBRARY_PAGE)}
        >
          加载更多（已显示 {shownCount} / {filtered.length}）
        </button>
      )}
    </div>
  )
}
