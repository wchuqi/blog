import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 部署到 GitHub Pages 项目站点时，CI 会传入 BASE_PATH="/仓库名/"。
// 本地开发与根路径部署（Vercel/Netlify/用户主页站点）保持默认 "/"。
const base = process.env.BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 把 React 全家桶单独拆出来，长期缓存
          react: ['react', 'react-dom', 'react-router-dom'],
          // Markdown 渲染 + 代码高亮是最重的部分，单独成块
          markdown: [
            'react-markdown',
            'remark-gfm',
            'rehype-slug',
            'rehype-highlight',
          ],
        },
      },
    },
  },
})
