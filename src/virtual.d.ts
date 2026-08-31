declare module 'virtual:posts-index' {
  const entries: import('./lib/types').IndexEntry[]
  export default entries
}

declare module 'virtual:posts-search-index' {
  interface SearchDoc {
    slug: string
    text: string
  }
  const docs: SearchDoc[]
  export default docs
}
