import { useState, useRef, type ReactNode, type ComponentPropsWithoutRef } from 'react'

/**
 * 代码块：深色发光卡片 + 语言标签 + 复制按钮。
 *
 * react-markdown 把围栏代码块渲染成 <pre><code class="hljs language-xxx">…</code></pre>，
 * 我们用这个组件替换默认的 <pre>，从子 <code> 的 className 中提取语言名，
 * 并把高亮后的 DOM 原样保留在内部（rehype-highlight 已经处理好了 hljs-* 类）。
 *
 * props 用标准 <pre> 的属性类型，以便直接作为 react-markdown 的 `pre` 组件，
 * 同时 react-markdown 会额外传入一个 `node` 字段，这里一并接收后丢弃。
 */
export function CodeBlock({
  children,
}: ComponentPropsWithoutRef<'pre'> & { node?: unknown }) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  // 从 <code class="language-js"> 中解析语言名
  const lang = extractLang(children)

  const handleCopy = async () => {
    const text = preRef.current?.innerText ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // 剪贴板不可用（非 https / 权限）时静默失败
    }
  }

  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span className="code-block__lang">{lang || 'code'}</span>
        <button
          type="button"
          className="code-block__copy"
          onClick={handleCopy}
          aria-label="复制代码"
        >
          {copied ? '已复制 ✓' : '复制'}
        </button>
      </div>
      <pre ref={preRef}>{children}</pre>
    </div>
  )
}

/** 从子节点（<code class="language-xxx">）里取语言名 */
function extractLang(children: ReactNode): string {
  // children 通常是单个 <code> 元素
  const child = Array.isArray(children) ? children[0] : children
  if (
    child &&
    typeof child === 'object' &&
    'props' in child &&
    child.props &&
    typeof child.props === 'object'
  ) {
    const className: string =
      (child.props as { className?: string }).className ?? ''
    const match = /language-([\w-]+)/.exec(className)
    if (match) return match[1]
  }
  return ''
}
