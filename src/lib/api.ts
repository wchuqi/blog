// 本地 API 的 URL 构造。
//
// 为什么需要单独一层：文章与卡片的 slug 是**中文文件路径**，里面真实存在
// 空格（`AI RAG`，224 篇）与 `&`（`工具&中间件`，231 篇）这类 URL 保留字符。
// 直接写 `fetch(`/api/posts/${slug}`)` 会让：
//   - 含空格：请求根本发不出去（浏览器拒绝，net::ERR 层失败）
//   - 含 `&`：被当作查询串分隔符，服务端收到截断的路径 → 400
//
// 实测未编码时 `工具&中间件/Docker/Docker学习资料` 返回 400，
// `AI/核心概念/AI RAG/AI RAG学习资料` 直接 HTTP 000（请求未发出）。
//
// encodeURIComponent 会保留 `!'()*-._~` 与字母数字，其余（含 `/`）全部转义，
// 所以路径里的斜杠会变成 %2F —— FastAPI 的 `{slug:path}` 能正确还原它。

/** 把 slug 编码成可安全放进 URL 路径的形式（斜杠也会被编码） */
export function encodeSlug(slug: string): string {
  return encodeURIComponent(slug)
}

/** 本地 API 的基路径 */
export const API_BASE = '/api'

/** 构造 `/api/posts/<slug>` 之类的 URL */
export function apiUrl(...segments: string[]): string {
  return [API_BASE, ...segments.map(encodeSlug)].join('/')
}
