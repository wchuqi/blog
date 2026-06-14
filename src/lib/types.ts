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
