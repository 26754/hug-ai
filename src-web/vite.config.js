import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// 获取 Coze 部署环境变量或默认端口
const apiUrl = process.env.VITE_API_URL || `http://${process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'localhost'}:${process.env.DEPLOY_RUN_PORT || 5000}`

// 输出目录：使用绝对路径或相对于项目根目录
const outDir = path.resolve(__dirname, '../data/web')

export default defineConfig({
  plugins: [
    vue(),
  ],
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
    cssMinify: 'esbuild',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vue 核心
          if (id.includes('node_modules/vue') || id.includes('node_modules/@vue')) {
            return 'vue-vendor'
          }
          // TDesign 组件库
          if (id.includes('node_modules/tdesign-vue-next')) {
            return 'tdesign'
          }
          // 工具库
          if (id.includes('node_modules/axios') || 
              id.includes('node_modules/@vueuse') ||
              id.includes('node_modules/dayjs')) {
            return 'utils'
          }
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // 自定义文件名规则，减少缓存失效
        format: 'es',
      },
    },
    // 调整警告限制，因为 TDesign 组件库本身较大
    chunkSizeWarningLimit: 600,
    // 报告压缩后的大小
    reportCompressedSize: true,
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
