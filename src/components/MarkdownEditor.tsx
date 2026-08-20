import { useEffect, useRef, useState } from 'react'

// Vditor 只在本地 dev 用，动态导入避免打进生产 bundle
type VditorInstance = {
  getValue: () => string
  setValue: (value: string) => void
  destroy: () => void
}

/**
 * Vditor 所见即所得 Markdown 编辑器封装。
 * 仅在本地 dev 模式使用，通过 import.meta.env.DEV 守卫后才渲染。
 */
export function MarkdownEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (markdown: string) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const vditorRef = useRef<VditorInstance | null>(null)
  const [loaded, setLoaded] = useState(false)
  // 用 ref 保存最新的 onChange，避免 effect 依赖变化导致重复初始化
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    let destroyed = false
    // 动态导入 + 动态加载 CSS
    import('vditor/dist/method.min').then((mod) => {
      const Vditor = mod.default
      if (destroyed || !containerRef.current) return

      const vd = new Vditor(containerRef.current, {
        height: '60vh',
        mode: 'wysiwyg',
        toolbar: [
          'headings', 'bold', 'italic', 'strike', '|',
          'link', 'list', 'ordered-list', 'check', 'outdent', 'indent', '|',
          'quote', 'code', 'inline-code', 'table', '|',
          'undo', 'redo', '|',
          'edit-mode', 'preview', 'fullscreen',
        ],
        placeholder: '开始写作…',
        cache: { enable: false },
        value,
        input: (v: string) => onChangeRef.current(v),
        after: () => {
          vditorRef.current = vd as unknown as VditorInstance
          setLoaded(true)
        },
      })
    }).catch((e) => {
      console.error('Vditor 加载失败：', e)
    })

    return () => {
      destroyed = true
      vditorRef.current?.destroy()
      vditorRef.current = null
    }
    // 只在挂载时初始化一次；外部 value 变化不重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 外部 value 变化时同步到编辑器（如切换文章）
  useEffect(() => {
    if (loaded && vditorRef.current) {
      const current = vditorRef.current.getValue()
      if (current !== value) {
        vditorRef.current.setValue(value)
      }
    }
  }, [value, loaded])

  return <div ref={containerRef} className="markdown-editor" />
}
