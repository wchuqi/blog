// 站内链接路径的归一与解析。
//
// 这套规则有两个消费者，必须完全一致，所以抽成无依赖的独立模块：
//   1. 构建期 vite.config.ts 的 extractNoteLinks —— 从正文里抽出图谱边
//   2. 运行时 src/lib/posts.ts —— 把边解析成 slug、把相对 .md 链接改写成站内路由
//
// 两处只要有一处不一致，就会出现"图上有边但点不动"或"点得动但图上没边"。

/**
 * 归一 slug 路径：丢掉空段和 `.`，用 `..` 逐级上退，统一用 `/` 连接。
 *   ['AI','核心概念','AI RAG','study-material','../AI RAG学习资料'] -> 'AI/核心概念/AI RAG/AI RAG学习资料'
 */
export function normalizeSlugPath(path: string): string {
  const parts: string[] = []
  for (const segment of path.split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') {
      parts.pop()
      continue
    }
    parts.push(segment)
  }
  return parts.join('/')
}

/**
 * URL 解码，失败时原样返回。
 *
 * 为什么必须解码：react-markdown 交给 `a` 组件的 href 是 percent-encoded 的
 * （`00-总览与心智模型.md` → `00-%E6%80%BB...md`），而 slug 是原始 UTF-8 中文。
 * 不解码就永远匹配不上，站内链接会原样渲染成 `<a href="xx.md">`，
 * 在 SPA 里被当成相对路径解析 → 全部 404。文件名含裸 `%` 时 decode 会抛错，
 * 这种情况按原样处理。
 */
export function safeDecodeUri(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * 把 Markdown 链接目标归一成 slug 路径：解码、统一正斜杠、去掉 `.md` 后缀。
 * `../` 前缀保留——它的基准是来源文章所在目录，要等解析阶段才知道。
 */
export function normalizeLinkTarget(raw: string): string {
  return safeDecodeUri(raw.trim().replace(/^<|>$/g, ''))
    .replace(/\\/g, '/')
    .replace(/\.md$/i, '')
}

/**
 * 把链接目标展开成绝对 slug 路径。
 *   以 `/` 开头 —— 站点根路径（`/posts/foo` 与 `/foo` 等价）
 *   其余 —— 相对来源文章所在目录，`../` 逐级上退
 *
 * 返回 null 表示这个目标不该按路径解析（不含 `/`，可能是在引用标题或裸 slug），
 * 交给调用方的宽松匹配兜底。
 */
export function absoluteSlugFor(currentSlug: string, target: string): string | null {
  if (target.startsWith('/')) {
    const stripped = target.replace(/^\/+/, '').replace(/^posts\//, '')
    return stripped ? normalizeSlugPath(stripped) : null
  }
  if (!target.includes('/')) return null
  const dir = currentSlug.split('/').slice(0, -1)
  return normalizeSlugPath([...dir, target].join('/'))
}
