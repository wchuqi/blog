/// <reference types="vite/client" />

declare module '*.md' {
  const content: string
  export default content
}

// Vditor 没有 bundled 类型声明，运行时动态导入
declare module 'vditor/dist/method.min' {
  export default class Vditor {
    constructor(element: HTMLElement, options: Record<string, unknown>)
    getValue(): string
    setValue(value: string): void
    destroy(): void
  }
}

// 本地 API server 返回的复习数据结构（未定型，宽松匹配）
interface ApiResponse {
  [key: string]: unknown
}
