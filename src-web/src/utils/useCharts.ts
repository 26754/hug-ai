/**
 * 数据可视化组件
 * 支持项目统计、任务进度、素材分析等图表
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export interface ChartData {
  label: string
  value: number
  color?: string
}

export interface ChartOptions {
  /** 图表类型 */
  type: 'bar' | 'line' | 'pie' | 'donut' | 'area'
  /** 标题 */
  title?: string
  /** 数据 */
  data: ChartData[]
  /** 颜色数组 */
  colors?: string[]
  /** 是否显示图例 */
  showLegend?: boolean
  /** 是否显示数值 */
  showValue?: boolean
  /** 高度 */
  height?: number
  /** 宽度 */
  width?: number
  /** 动画时长 */
  animationDuration?: number
}

// 默认颜色
export const defaultColors = [
  '#0052d9', // 科技蓝
  '#00a870', // 薄荷绿
  '#d94008', // 橙红
  '#7a34eb', // 紫罗兰
  '#00c4e8', // 天蓝
  '#ffb020', // 金黄
  '#e34d26', // 珊瑚
  '#36b37e', // 翠绿
]

// 格式化数字
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return String(num)
}

// 计算百分比
export function calculatePercentage(value: number, total: number): string {
  if (total === 0) return '0%'
  return ((value / total) * 100).toFixed(1) + '%'
}

// 创建 SVG 条形图
export function createBarChart(data: ChartData[], options: Partial<ChartOptions> = {}): string {
  const { colors = defaultColors, showValue = true, height = 200 } = options
  
  const barCount = data.length
  const barWidth = Math.min(40, (100 - (barCount + 1) * 2) / barCount)
  const maxValue = Math.max(...data.map(d => d.value))
  const chartHeight = height - 40 // 预留标签空间
  
  let svg = `<svg viewBox="0 0 100 ${height}" xmlns="http://www.w3.org/2000/svg">`
  
  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * chartHeight
    const x = 5 + index * (barWidth + 4)
    const y = chartHeight - barHeight + 5
    
    svg += `<rect 
      x="${x}" y="${y}" 
      width="${barWidth}" height="${barHeight}" 
      rx="2" 
      fill="${item.color || colors[index % colors.length]}"
      class="chart-bar"
    />`
    
    if (showValue) {
      svg += `<text 
        x="${x + barWidth / 2}" y="${y - 3}" 
        text-anchor="middle" 
        class="chart-value"
      >${formatNumber(item.value)}</text>`
    }
    
    svg += `<text 
      x="${x + barWidth / 2}" y="${height - 5}" 
      text-anchor="middle" 
      class="chart-label"
    >${item.label}</text>`
  })
  
  svg += '</svg>'
  return svg
}

// 创建 SVG 饼图
export function createPieChart(data: ChartData[], options: Partial<ChartOptions> = {}): string {
  const { colors = defaultColors, showValue = true, height = 200 } = options
  
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const cx = 50
  const cy = height / 2
  const radius = Math.min(40, height / 2 - 10)
  
  let svg = `<svg viewBox="0 0 100 ${height}" xmlns="http://www.w3.org/2000/svg">`
  
  let currentAngle = -90 // 从顶部开始
  
  data.forEach((item, index) => {
    const percentage = item.value / total
    const angle = percentage * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    
    const x1 = cx + radius * Math.cos((startAngle * Math.PI) / 180)
    const y1 = cy + radius * Math.sin((startAngle * Math.PI) / 180)
    const x2 = cx + radius * Math.cos((endAngle * Math.PI) / 180)
    const y2 = cy + radius * Math.sin((endAngle * Math.PI) / 180)
    
    const largeArc = angle > 180 ? 1 : 0
    
    const path = `
      M ${cx} ${cy}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      Z
    `
    
    svg += `<path d="${path}" fill="${item.color || colors[index % colors.length]}" class="chart-slice" />`
    
    currentAngle = endAngle
  })
  
  // 中心文字
  svg += `<text x="${cx}" y="${cy - 5}" text-anchor="middle" class="chart-total">${formatNumber(total)}</text>`
  svg += `<text x="${cx}" y="${cy + 10}" text-anchor="middle" class="chart-total-label">总计</text>`
  
  svg += '</svg>'
  return svg
}

// 创建进度条组件
export function createProgressBar(
  value: number,
  max: number = 100,
  options: {
    color?: string
    height?: number
    showText?: boolean
    animated?: boolean
  } = {}
): string {
  const {
    color = defaultColors[0],
    height = 8,
    showText = true,
    animated = true
  } = options
  
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  return `
    <div class="progress-container" style="height: ${height}px">
      <div class="progress-bar ${animated ? 'animated' : ''}" 
           style="width: ${percentage}%; background: ${color}">
      </div>
      ${showText ? `<span class="progress-text">${percentage.toFixed(0)}%</span>` : ''}
    </div>
  `
}

// 统计卡片组件
export interface StatCardData {
  title: string
  value: number | string
  change?: number // 百分比变化
  icon?: string
  color?: string
}

// 项目统计类型
export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalNovels: number
  totalScripts: number
  totalAssets: number
  totalVideos: number
  tasksInProgress: number
  tasksCompleted: number
}

// 任务状态统计
export interface TaskStats {
  pending: number
  processing: number
  completed: number
  failed: number
}

// 素材类型统计
export interface AssetStats {
  characters: number
  backgrounds: number
  props: number
  effects: number
  audio: number
  video: number
}

// Vue 组合式函数：项目统计
export function useProjectStats() {
  const stats = ref<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalNovels: 0,
    totalScripts: 0,
    totalAssets: 0,
    totalVideos: 0,
    tasksInProgress: 0,
    tasksCompleted: 0,
  })
  
  const loading = ref(false)
  const error = ref<Error | null>(null)
  
  async function fetchStats() {
    loading.value = true
    error.value = null
    
    try {
      // TODO: 调用 API 获取统计数据
      // const res = await axios.get('/api/stats/project')
      // stats.value = res.data
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      loading.value = false
    }
  }
  
  // 计算统计数据
  const chartData = computed<ChartData[]>(() => [
    { label: '项目', value: stats.value.totalProjects, color: defaultColors[0] },
    { label: '小说', value: stats.value.totalNovels, color: defaultColors[1] },
    { label: '剧本', value: stats.value.totalScripts, color: defaultColors[2] },
    { label: '素材', value: stats.value.totalAssets, color: defaultColors[3] },
    { label: '视频', value: stats.value.totalVideos, color: defaultColors[4] },
  ])
  
  return {
    stats,
    loading,
    error,
    chartData,
    fetchStats,
  }
}

// Vue 组合式函数：任务统计
export function useTaskStats() {
  const stats = ref<TaskStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  })
  
  const loading = ref(false)
  
  async function fetchStats() {
    loading.value = true
    try {
      // TODO: 调用 API
    } catch (e) {
      console.error('Failed to fetch task stats:', e)
    } finally {
      loading.value = false
    }
  }
  
  const chartData = computed<ChartData[]>(() => [
    { label: '待处理', value: stats.value.pending, color: defaultColors[0] },
    { label: '进行中', value: stats.value.processing, color: defaultColors[1] },
    { label: '已完成', value: stats.value.completed, color: defaultColors[2] },
    { label: '失败', value: stats.value.failed, color: defaultColors[3] },
  ])
  
  const completionRate = computed(() => {
    const total = stats.value.pending + stats.value.processing + stats.value.completed + stats.value.failed
    if (total === 0) return 0
    return (stats.value.completed / total) * 100
  })
  
  return {
    stats,
    loading,
    chartData,
    completionRate,
    fetchStats,
  }
}
