import { useEffect, useState } from 'react'

/** 滚动超过这么多像素后才出现，避免刚进页面就浮一个按钮 */
const SHOW_AFTER = 400

/**
 * 右下角的「回到顶部」。
 *
 * 拆成独立组件而不是写在 PostDetail 里：滚动监听会频繁 setState，
 * 如果 state 挂在 PostDetail 上，每次滚动都会重渲染整棵 markdown 渲染树。
 *
 * 平滑滚动交给全局 `html { scroll-behavior: smooth }`（styles.css），
 * 它在 `prefers-reduced-motion: reduce` 下会被覆盖成 auto，
 * 所以这里不传 behavior，让 CSS 决定。
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER)
    onScroll() // 刷新后停在中间位置时也要显示
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      className={'back-to-top' + (visible ? ' back-to-top--visible' : '')}
      onClick={() => window.scrollTo({ top: 0 })}
      aria-label="回到顶部"
      title="回到顶部"
      // 未显示时不参与 tab 顺序，避免键盘用户 Tab 到一个看不见的按钮
      tabIndex={visible ? 0 : -1}
    >
      <span aria-hidden="true">🚀</span>
    </button>
  )
}
