import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// 获取 Coze 部署环境变量或默认端口
const apiUrl = process.env.VITE_API_URL || `http://${process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'localhost'}:${process.env.DEPLOY_RUN_PORT || 5000}`

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    // 输出到 data/web 目录，与 Express 静态服务目录一致
    outDir: '../data/web',
    assetsDir: 'assets',
    sourcemap: false,
    // 部署时清理旧构建
    emptyOutDir: true
  },
  // 定义环境变量
  define: {
    __VITE_API_URL__: JSON.stringify(apiUrl)
  }
})
