import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// 获取 Coze 部署环境变量或默认端口
const apiUrl = process.env.VITE_API_URL || `http://${process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'localhost'}:${process.env.DEPLOY_RUN_PORT || 5000}`

// 输出目录：使用绝对路径或相对于项目根目录
const outDir = path.resolve(__dirname, '../data/web')

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
    outDir,
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    // CSS 压缩配置，safari5+: true 修复选择器错误
    cssMinify: 'esbuild',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia', 'vue-i18n'],
          'tdesign': ['tdesign-vue-next'],
          'utils': ['axios', '@vueuse/core', 'dayjs'],
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'vue-i18n',
      'tdesign-vue-next',
      'axios',
      '@vueuse/core',
      'dayjs',
    ],
  },
  define: {
    __VITE_API_URL__: JSON.stringify(apiUrl)
  }
})
