/**
 * 响应式布局 Hook
 * 支持断点检测、响应式类名、移动端适配
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 断点定义
export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const

export type Breakpoint = keyof typeof breakpoints

// 当前窗口宽度
const windowWidth = ref(1920)
const windowHeight = ref(1080)

// 断点检测
function getBreakpoint(width: number): Breakpoint {
  if (width < breakpoints.sm) return 'xs'
  if (width < breakpoints.md) return 'sm'
  if (width < breakpoints.lg) return 'md'
  if (width < breakpoints.xl) return 'lg'
  if (width < breakpoints.xxl) return 'xl'
  return 'xxl'
}

// 创建响应式 Hook
export function useResponsive() {
  const breakpoint = computed(() => getBreakpoint(windowWidth.value))
  
  const isMobile = computed(() => windowWidth.value < breakpoints.md)
  const isTablet = computed(() => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg)
  const isDesktop = computed(() => windowWidth.value >= breakpoints.lg)
  const isWide = computed(() => windowWidth.value >= breakpoints.xl)
  
  // 断点状态
  const isXs = computed(() => breakpoint.value === 'xs')
  const isSm = computed(() => breakpoint.value === 'sm')
  const isMd = computed(() => breakpoint.value === 'md')
  const isLg = computed(() => breakpoint.value === 'lg')
  const isXl = computed(() => breakpoint.value === 'xl')
  const isXxl = computed(() => breakpoint.value === 'xxl')
  
  // 响应式类名
  const responsiveClass = computed(() => {
    const classes = ['responsive']
    classes.push(`bp-${breakpoint.value}`)
    
    if (isMobile.value) classes.push('is-mobile')
    if (isTablet.value) classes.push('is-tablet')
    if (isDesktop.value) classes.push('is-desktop')
    if (isWide.value) classes.push('is-wide')
    
    return classes.join(' ')
  })
  
  // 栅格列数（基于断点）
  const gridColumns = computed(() => {
    if (isMobile.value) return 1
    if (isTablet.value) return 2
    if (isDesktop.value) return 3
    return 4
  })
  
  // 侧边栏宽度
  const sidebarWidth = computed(() => {
    if (isMobile.value) return 0
    if (isTablet.value) return 200
    return 240
  })
  
  return {
    windowWidth,
    windowHeight,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,
    responsiveClass,
    gridColumns,
    sidebarWidth,
  }
}

// 窗口尺寸监听
let resizeObserver: ResizeObserver | null = null

function setupWindowListener() {
  const updateSize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }
  
  // 初始化
  updateSize()
  
  // 监听 resize
  window.addEventListener('resize', updateSize)
  
  // 使用 ResizeObserver 监听元素
  resizeObserver = new ResizeObserver(() => {
    updateSize()
  })
  
  return () => {
    window.removeEventListener('resize', updateSize)
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }
}

// 初始化响应式监听
export function initResponsive() {
  return setupWindowListener()
}

// 移动端检测
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 横屏检测
export function useLandscape() {
  const isLandscape = ref(window.innerWidth > window.innerHeight)
  
  onMounted(() => {
    const handler = () => {
      isLandscape.value = window.innerWidth > window.innerHeight
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  })
  
  return { isLandscape }
}

// 触控设备检测
export function useTouchDevice() {
  const isTouch = ref('ontouchstart' in window || navigator.maxTouchPoints > 0)
  
  return { isTouch }
}

// 响应式工具类生成器
export function generateResponsiveClasses(styles: Record<Breakpoint, Record<string, string | number>>) {
  const css: string[] = []
  
  for (const [bp, rules] of Object.entries(styles)) {
    const bpStyles = Object.entries(rules)
      .map(([prop, value]) => `${prop}: ${value};`)
      .join(' ')
    
    if (bp === 'xs') {
      css.push(`.${bpStyles}`)
    } else {
      css.push(`@media (min-width: ${breakpoints[bp as Breakpoint]}px) { .${bpStyles} }`)
    }
  }
  
  return css.join('\n')
}

// 栅格系统工具
export interface GridItem {
  span?: number      // 占据的列数
  offset?: number    // 左侧偏移
  pull?: number      // 向左移动
  push?: number      // 向右移动
}

export function getGridClass(item: GridItem, breakpoint: Breakpoint = 'md'): string {
  const classes = ['grid-item']
  
  if (item.span) {
    classes.push(`span-${item.span}`)
  }
  if (item.offset) {
    classes.push(`offset-${item.offset}`)
  }
  
  return classes.join(' ')
}

// Flex 布局工具
export interface FlexOptions {
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'end' | 'center' | 'stretch' | 'baseline'
  wrap?: boolean
  gap?: number | string
}

export function getFlexClass(options: FlexOptions): string {
  const classes = ['flex']
  
  if (options.direction) {
    classes.push(`flex-${options.direction}`)
  }
  if (options.justify) {
    classes.push(`justify-${options.justify}`)
  }
  if (options.align) {
    classes.push(`align-${options.align}`)
  }
  if (options.wrap) {
    classes.push('flex-wrap')
  }
  if (options.gap) {
    classes.push(`gap-${options.gap}`)
  }
  
  return classes.join(' ')
}
