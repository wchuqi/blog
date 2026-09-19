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
  /** 内容类型：'card' 表示 Anki 式问答卡片（正文为 `# 问题` / `# 答案` 两段），缺省为普通文章 */
  type?: 'article' | 'card'
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

/** 解析后的完整文章对象（不含正文，正文通过 getPostContent 懒加载） */
export interface Post extends PostFrontmatter {
  /** 路由用的唯一标识，来自文件名 */
  slug: string
  /** 预估阅读时间，单位分钟 */
  readingMinutes: number
  /** 正文字数（中英文混合估算） */
  words: number
  /** 标准化后的日期对象 */
  dateObj: Date
  /** 正文里的双链关系，语法：[[slug]] 或 [[slug|显示名]] */
  noteLinks: NoteLink[]
}

/** 构建时生成的文章元数据索引条目（vite 插件扫描 src/posts 产出） */
export interface IndexEntry extends PostFrontmatter {
  slug: string
  date: string
  words: number
  readingMinutes: number
  noteLinks: NoteLink[]
}

/** 双链引用 / 站内 Markdown 链接 */
export interface NoteLink {
  /** 原始目标文本：双链是 slug 或标题；md 链接是相对路径（可带 ../，已去 .md） */
  target: string
  /** 页面上显示的文本 */
  label: string
  /** 解析成功后的文章 slug；未解析成功则为空 */
  targetSlug?: string
  /**
   * 链接写法。'wiki' = `[[双链]]`（target 是 slug / 标题 / 无前缀路径，可后缀匹配）；
   * 'md' = `[文本](相对路径.md)`（target 必须按来源文章所在目录展开，不能后缀匹配）。
   * 缺省视为 'wiki'，兼容旧索引。
   */
  kind?: 'wiki' | 'md'
}

/** 知识图谱节点 */
export interface GraphNode {
  slug: string
  title: string
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
  /** 内容类型：article（文章）或 card（问答卡片）；旧快照缺省视为 article */
  type?: 'article' | 'card'
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

/** 未纳入复习的文章（frontmatter 标了 noReview: true） */
export interface ReviewExcludedItem {
  slug: string
  title: string
}

/** public/review.json 的完整结构 */
export interface ReviewData {
  stats: ReviewStats
  cards: ReviewCard[]
  heatmap: ReviewHeatmapCell[]
  /** 显式退出复习池的文章 */
  excluded: ReviewExcludedItem[]
}
