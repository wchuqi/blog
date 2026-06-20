// 站点全局配置 —— 改这里就能定制你的博客
export const siteConfig = {
  /** 站点标题，显示在导航栏与浏览器标签 */
  title: '我的博客',
  /** 站点副标题 / 一句话简介 */
  description: '记录技术、思考与生活',
  /** 站点部署后的完整地址，用于生成 RSS 中的绝对链接，结尾不要带斜杠 */
  url: 'https://example.com',
  /** 默认作者 */
  author: '你的名字',
  /** 语言，用于 RSS 与 html lang */
  lang: 'zh-CN',

  /** 导航栏链接 */
  nav: [
    { label: '首页', to: '/' },
    { label: '归档', to: '/archives' },
    { label: '标签', to: '/tags' },
    { label: '分类', to: '/categories' },
    { label: '图谱', to: '/graph' },
    { label: '关于', to: '/about' },
  ],

  /** 社交链接，显示在页脚；留空数组则不显示 */
  social: [
    { label: 'GitHub', href: 'https://github.com/yourname' },
    { label: 'Email', href: 'mailto:you@example.com' },
  ],

  /** 首页每页文章数 */
  pageSize: 8,

  /** 首页侧边栏的个人名片 */
  profile: {
    /** 是否显示个人名片 */
    enabled: true,
    /** 头像图片地址；留空则用名字首字母占位 */
    avatar: '',
    /** 名字 */
    name: '你的名字',
    /** 一句话签名 */
    bio: '热爱技术与写作，记录点滴思考。',
  },

  /**
   * Giscus 评论配置（基于 GitHub Discussions，纯前端方案）。
   * 不需要评论就把 enabled 设为 false。
   * 配置向导见 https://giscus.app —— 把生成的参数填到这里即可。
   */
  comments: {
    enabled: false,
    repo: 'yourname/yourrepo',
    repoId: '',
    category: 'Announcements',
    categoryId: '',
    mapping: 'pathname',
    theme: 'preferred_color_scheme',
    lang: 'zh-CN',
  },
}

export type SiteConfig = typeof siteConfig
