/**
 * 主题管理 Hook
 * 支持自动/浅色/深色模式切换
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export type ThemeMode = 'auto' | 'light' | 'dark'
export type FontSize = 12 | 13 | 14 | 16 | 18 | 20

export interface ThemeConfig {
  mode: ThemeMode
  primaryColor: string
  fontSize: FontSize
}

const STORAGE_KEY = 'hug-ai-theme-config'

// 默认配置
const defaultConfig: ThemeConfig = {
  mode: 'auto',
  primaryColor: '#0052d9',
  fontSize: 16,
}

// 响应式状态
const config = ref<ThemeConfig>(loadConfig())
const isDark = ref(false)
const isInitialized = ref(false)

// 预设颜色
export const presetColors = [
  '#0052d9', // 科技蓝
  '#0594fa', // 天蓝色
  '#008d57', // 翡翠绿
  '#00a870', // 薄荷绿
  '#d94008', // 橙红色
  '#e34d26', // 珊瑚红
  '#7a34eb', // 紫罗兰
  '#8b5cf6', // 靛蓝色
  '#0f172a', // 深灰蓝
  '#1e293b', // 石墨灰
]

// 加载配置
function loadConfig(): ThemeConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.warn('Failed to load theme config:', e)
  }
  return { ...defaultConfig }
}

// 保存配置
function saveConfig() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
  } catch (e) {
    console.warn('Failed to save theme config:', e)
  }
}

// 检测系统主题
function getSystemTheme(): 'dark' | 'light' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// 更新暗色模式状态
function updateDarkMode() {
  if (config.value.mode === 'auto') {
    isDark.value = getSystemTheme() === 'dark'
  } else {
    isDark.value = config.value.mode === 'dark'
  }
  applyThemeToDOM()
}

// 应用主题到 DOM
function applyThemeToDOM() {
  const html = document.documentElement
  
  // 设置暗色模式
  if (isDark.value) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
  
  // 设置主题色 (通过 CSS 变量)
  html.style.setProperty('--td-brand-color', config.value.primaryColor)
  html.style.setProperty('--td-brand-color-hover', adjustColor(config.value.primaryColor, -10))
  html.style.setProperty('--td-brand-color-active', adjustColor(config.value.primaryColor, -20))
  html.style.setProperty('--td-brand-color-disabled', adjustColor(config.value.primaryColor, 30))
  
  // 设置字体大小
  html.style.fontSize = `${config.value.fontSize}px`
}

// 调整颜色亮度
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// 监听系统主题变化
let mediaQuery: MediaQueryList | null = null
function setupMediaQueryListener() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateDarkMode)
  }
}

function cleanupMediaQueryListener() {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', updateDarkMode)
    mediaQuery = null
  }
}

// 初始化主题
export function useTheme() {
  onMounted(() => {
    if (!isInitialized.value) {
      updateDarkMode()
      setupMediaQueryListener()
      isInitialized.value = true
    }
  })

  onUnmounted(() => {
    cleanupMediaQueryListener()
  })

  // 监听配置变化
  watch(config, () => {
    updateDarkMode()
    saveConfig()
  }, { deep: true })

  // 计算属性
  const currentMode = computed(() => isDark.value ? 'dark' : 'light')
  
  const modeLabel = computed(() => {
    switch (config.value.mode) {
      case 'auto': return isDark.value ? '深色' : '浅色'
      case 'light': return '浅色'
      case 'dark': return '深色'
    }
  })

  // 设置模式
  function setMode(mode: ThemeMode) {
    config.value.mode = mode
    updateDarkMode()
  }

  // 设置主题色
  function setPrimaryColor(color: string) {
    config.value.primaryColor = color
    applyThemeToDOM()
  }

  // 设置字体大小
  function setFontSize(size: FontSize) {
    config.value.fontSize = size
    document.documentElement.style.fontSize = `${size}px`
  }

  // 保存配置
  function save() {
    saveConfig()
  }

  // 重置为默认
  function reset() {
    config.value = { ...defaultConfig }
    applyThemeToDOM()
  }

  return {
    config,
    isDark,
    currentMode,
    modeLabel,
    presetColors,
    setMode,
    setPrimaryColor,
    setFontSize,
    save,
    reset,
    updateDarkMode,
  }
}

// 导出配置加载（用于 App.vue 初始化）
export function initTheme() {
  updateDarkMode()
}
