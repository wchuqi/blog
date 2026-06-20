// 文章相关的类型定义

/** Markdown frontmatter 中允许的字段 */
export interface PostFrontmatter {
  /** 标题 */
  title: string
  /** 发布日期，ISO 字符串，如 2026-06-10 */
  date: string
  /** 文章摘要，列表页展示 */
  description?: string
  /** 标签列表 */
  tags?: string[]
  /** 分类，单选 */
  category?: string
  /** 封面图地址 */
  cover?: string
  /** 是否置顶 */
  pinned?: boolean
  /** 是否为草稿，草稿不会出现在生产构建中 */
  draft?: boolean
  /** 自定义作者，缺省使用站点作者 */
  author?: string
  /** 是否为加密文章：加密后正文以密文存储，需读者输入密码才可见；不会出现在任何列表/搜索/RSS 中 */
  encrypted?: boolean
}

/** 解析后的完整文章对象 */
export interface Post extends PostFrontmatter {
  /** 路由用的唯一标识，来自文件名 */
  slug: string
  /** 正文 Markdown 原文 */
  content: string
  /** 预估阅读时间，单位分钟 */
  readingMinutes: number
  /** 正文字数（中英文混合估算） */
  words: number
  /** 标准化后的日期对象 */
  dateObj: Date
  /** 正文里的双链关系，语法：[[slug]] 或 [[slug|显示名]] */
  noteLinks: NoteLink[]
}

/** 双链引用 */
export interface NoteLink {
  /** 原始目标文本，通常是 slug，也可以写文章标题 */
  target: string
  /** 页面上显示的文本 */
  label: string
  /** 解析成功后的文章 slug；未解析成功则为空 */
  targetSlug?: string
}

/** 知识图谱节点 */
export interface GraphNode {
  slug: string
  title: string
  category?: string
  tags?: string[]
}

/** 知识图谱边 */
export interface GraphEdge {
  source: string
  target: string
}

/** 文章目录中的一个标题项 */
export interface TocItem {
  /** 标题层级 1-6 */
  depth: number
  /** 锚点 id */
  id: string
  /** 标题文本 */
  text: string
}

/** 标签 / 分类的聚合统计 */
export interface Taxonomy {
  name: string
  count: number
}
