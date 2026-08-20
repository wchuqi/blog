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
  /** 设为 true 则该文章退出复习系统；缺省即参与遗忘曲线复习 */
  noReview?: boolean
  /** 间隔重复复习快照，由 sync 脚本从本地 SQLite 刷写 */
  review?: ReviewSnapshot
}

/** frontmatter 中的复习状态快照（公网展示用） */
export interface ReviewSnapshot {
  /** 开始记忆的日期，ISO 字符串；缺失时回退到 frontmatter.date */
  created: string
  /** 最近一次复习日期，ISO 字符串 */
  lastReview: string
  /** 已成功复习次数（连续答对计数，忘了归零） */
  reps: number
  /** 当前间隔天数，即下次复习距上次复习的天数 */
  interval: number
  /** SM-2 ease 因子，初始 2.5，范围 1.3–3.0 */
  ease: number
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

// ---------------------------------------------------------------------------
// 遗忘曲线复习系统类型（public/review.json 的数据结构）
// ---------------------------------------------------------------------------

/** 单次复习日志条目 */
export interface ReviewLogEntry {
  /** 复习日期，ISO 字符串 */
  date: string
  /** 这次复习的打分：5=记得 / 4=模糊 / 0=忘了 */
  grade: number
  /** 当时的 ease 因子 */
  ease: number
  /** 当时算出的间隔天数 */
  interval: number
}

/** review.json 里每张卡片的完整数据 */
export interface ReviewCard {
  slug: string
  title: string
  category?: string
  /** 开始记忆的日期 */
  created: string
  /** 最近一次复习日期 */
  lastReview: string
  /** 复习次数 */
  reps: number
  /** 当前间隔天数 */
  interval: number
  /** ease 因子 */
  ease: number
  /** 下次复习日期（lastReview + interval 天） */
  nextReview: string
  /** 当前记忆保留率 0–1，R = e^(-t/interval) */
  retention: number
  /** 距离下次复习的天数（负数=已逾期） */
  dueIn: number
  /** 完整复习历史 */
  history: ReviewLogEntry[]
}

/** review.json 顶层的全局统计 */
export interface ReviewStats {
  /** 参与复习的文章总数 */
  totalCards: number
  /** 累计复习总次数 */
  totalReviews: number
  /** 所有卡片的平均 ease */
  avgEase: number
  /** 当前连续复习天数 */
  streakDays: number
  /** 今日待复习数量 */
  dueToday: number
  /** 已逾期数量 */
  overdue: number
}

/** 热力图单日格 */
export interface ReviewHeatmapCell {
  date: string
  count: number
}

/** public/review.json 的完整结构 */
export interface ReviewData {
  stats: ReviewStats
  cards: ReviewCard[]
  heatmap: ReviewHeatmapCell[]
}
