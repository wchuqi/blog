import { siteConfig } from '../config'

/** 把 ISO 日期格式化为本地化字符串，如 2026年6月10日 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return String(date)
  return d.toLocaleDateString(siteConfig.lang, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** 短日期，如 06-10 */
export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return String(date)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}
