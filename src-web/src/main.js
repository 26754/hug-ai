import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

import App from './App.vue'
import router from './router'
import './styles/main.css'

// 导入语言包
import zhCN from './locales/zh-CN'
import en from './locales/en'

// 导入工具
import { initTheme } from './utils/useTheme'
import { initResponsive } from './utils/useResponsive'
import { initShortcuts, destroyShortcuts } from './utils/useShortcuts'

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en': en,
  },
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

// 初始化主题
initTheme()

// 初始化响应式监听
const cleanupResponsive = initResponsive()

// 初始化快捷键
initShortcuts()

// 应用挂载
app.mount('#app')

// 清理
app.onUnmounted(() => {
  cleanupResponsive()
  destroyShortcuts()
})
