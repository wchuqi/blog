import { daysUntilDue, retentionRate, nextReviewDate } from '../lib/posts'
import { formatDate } from '../lib/format'
import type { Post } from '../lib/types'

/** 文章详情页的复习进度卡：基于 frontmatter 快照纯静态展示。 */
export function ReviewProgressCard({ post }: { post: Post }) {
  const review = post.review
  const due = daysUntilDue(review)
  const retention = retentionRate(review)
  const next = nextReviewDate(review)

  // 没有复习数据（从没复习过），显示初始状态
  const hasData = !!review?.lastReview

  return (
    <div className="review-card">
      <div className="review-card__title">记忆进度</div>
      <div className="review-card__body">
        <div className="review-card__row">
          <span className="review-card__label">已复习</span>
          <span className="review-card__value">
            {review?.reps ?? 0} 次
          </span>
        </div>
        <div className="review-card__row">
          <span className="review-card__label">难度系数</span>
          <span className="review-card__value">
            {(review?.ease ?? 2.5).toFixed(2)}
          </span>
        </div>
        <div className="review-card__row">
          <span className="review-card__label">间隔</span>
          <span className="review-card__value">
            {review?.interval ?? 0} 天
          </span>
        </div>
        {hasData && (
          <div className="review-card__row">
            <span className="review-card__label">上次复习</span>
            <span className="review-card__value">
              {formatDate(review!.lastReview)}
            </span>
          </div>
        )}
        <div className="review-card__row">
          <span className="review-card__label">下次复习</span>
          <span className="review-card__value">
            {next ? formatDate(next) : '待定'}
            {due !== null && (
              <span className={`review-card__due ${due <= 0 ? 'review-card__due--now' : ''}`}>
                {due === 0
                  ? '（今天）'
                  : due < 0
                    ? `（逾期 ${-due} 天）`
                    : `（${due} 天后）`}
              </span>
            )}
          </span>
        </div>
        <div className="review-card__retention">
          <span className="review-card__label">记忆保留</span>
          <div className="review-card__bar">
            <div
              className="review-card__bar-fill"
              style={{ transform: `scaleX(${retention})` }}
            />
          </div>
          <span className="review-card__percent">
            {Math.round(retention * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}
