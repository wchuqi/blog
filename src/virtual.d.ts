// 构建期由 vite.config.ts 的 postsIndexPlugin 产出的虚拟模块。
// 三个模块拆开是为了让首屏只付元数据的代价：
//   文章全文 4.1MB / 卡片全文 1.8MB，都在真正需要时才动态 import。

declare module 'virtual:posts-index' {
  const entries: import('./lib/types').IndexEntry[]
  export default entries
}

declare module 'virtual:posts-search-index' {
  const docs: import('./lib/search').SearchDoc[]
  export default docs
}

// 卡片全文索引（10000 张单词卡）。只在用户把搜索范围切到「卡片」或「全部」时加载。
declare module 'virtual:cards-search-index' {
  const docs: import('./lib/search').SearchDoc[]
  export default docs
}
