<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div v-for="stat in statCards" :key="stat.title" class="stat-card" :style="{ borderColor: stat.color }">
        <div class="stat-icon" :style="{ backgroundColor: stat.color + '20' }">
          <t-icon :name="stat.icon" :style="{ color: stat.color }" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-title">{{ stat.title }}</div>
        </div>
        <div v-if="stat.change !== undefined" class="stat-change" :class="stat.change >= 0 ? 'positive' : 'negative'">
          <t-icon :name="stat.change >= 0 ? 'trendrise' : 'trenddecline'" />
          {{ Math.abs(stat.change) }}%
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 项目统计 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>项目统计</h3>
          <t-select v-model="projectPeriod" :options="periodOptions" size="small" />
        </div>
        <div class="chart-body">
          <div v-html="barChartSvg" class="chart-svg"></div>
        </div>
      </div>

      <!-- 任务进度 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>任务进度</h3>
          <t-badge :count="taskStats.processing" dot />
        </div>
        <div class="chart-body">
          <div v-html="pieChartSvg" class="chart-svg pie-chart"></div>
          <div class="task-progress">
            <div class="progress-item">
              <span class="label">完成率</span>
              <t-progress 
                :percentage="completionRate" 
                :color="defaultColors[2]"
                :track-color="'rgba(0,0,0,0.1)'"
              />
            </div>
            <div class="progress-stats">
              <span>进行中: {{ taskStats.processing }}</span>
              <span>已完成: {{ taskStats.completed }}</span>
              <span>待处理: {{ taskStats.pending }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近活动 -->
      <div class="chart-card activity-card">
        <div class="chart-header">
          <h3>最近活动</h3>
        </div>
        <div class="activity-list">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <div class="activity-icon" :style="{ backgroundColor: activity.color + '20' }">
              <t-icon :name="activity.icon" :style="{ color: activity.color }" />
            </div>
            <div class="activity-content">
              <div class="activity-text">{{ activity.text }}</div>
              <div class="activity-time">{{ activity.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 素材分布 -->
    <div class="chart-card full-width">
      <div class="chart-header">
        <h3>素材分布</h3>
      </div>
      <div class="asset-distribution">
        <div v-for="asset in assetDistribution" :key="asset.type" class="asset-item">
          <div class="asset-info">
            <t-icon :name="asset.icon" />
            <span>{{ asset.type }}</span>
            <span class="asset-count">{{ asset.count }}</span>
          </div>
          <t-progress 
            :percentage="asset.percentage" 
            :color="asset.color"
            :track-color="'rgba(0,0,0,0.1)'"
            :show-text="false"
            size="small"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { createBarChart, createPieChart, defaultColors, formatNumber } from '@/utils/useCharts'

// 统计数据
const statCards = ref([
  { title: '总项目', value: 12, icon: 'folder', color: defaultColors[0], change: 15 },
  { title: '剧本数', value: 28, icon: 'file', color: defaultColors[1], change: 8 },
  { title: '素材数', value: 156, icon: 'image', color: defaultColors[2], change: 23 },
  { title: '视频数', value: 8, icon: 'video', color: defaultColors[3], change: -5 },
])

// 时间周期
const projectPeriod = ref('week')
const periodOptions = [
  { value: 'day', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'year', label: '本年' },
]

// 任务统计
const taskStats = ref({
  pending: 5,
  processing: 3,
  completed: 12,
  failed: 1,
})

const completionRate = computed(() => {
  const total = taskStats.value.pending + taskStats.value.processing + 
                taskStats.value.completed + taskStats.value.failed
  if (total === 0) return 0
  return Math.round((taskStats.value.completed / total) * 100)
})

// 图表数据
const chartData = ref([
  { label: '一', value: 30 },
  { label: '二', value: 45 },
  { label: '三', value: 28 },
  { label: '四', value: 52 },
  { label: '五', value: 38 },
  { label: '六', value: 65 },
  { label: '日', value: 42 },
])

const barChartSvg = computed(() => createBarChart(chartData.value, {
  height: 180,
  showValue: true,
}))

const pieChartSvg = computed(() => createPieChart([
  { label: '待处理', value: taskStats.value.pending, color: defaultColors[0] },
  { label: '进行中', value: taskStats.value.processing, color: defaultColors[1] },
  { label: '已完成', value: taskStats.value.completed, color: defaultColors[2] },
  { label: '失败', value: taskStats.value.failed, color: defaultColors[3] },
], { height: 180 }))

// 最近活动
const recentActivities = ref([
  { id: 1, icon: 'upload', text: '上传了素材 "背景图-001"', time: '5分钟前', color: defaultColors[0] },
  { id: 2, icon: 'edit', text: '编辑了剧本 "第一章"', time: '15分钟前', color: defaultColors[1] },
  { id: 3, icon: 'play-circle', text: '生成了视频片段', time: '30分钟前', color: defaultColors[2] },
  { id: 4, icon: 'check-circle', text: '完成了任务 "生成角色图"', time: '1小时前', color: defaultColors[3] },
  { id: 5, icon: 'folder', text: '创建了新项目 "都市言情"', time: '2小时前', color: defaultColors[4] },
])

// 素材分布
const assetDistribution = ref([
  { type: '角色', count: 45, percentage: 28, icon: 'user', color: defaultColors[0] },
  { type: '背景', count: 62, percentage: 38, icon: 'image', color: defaultColors[1] },
  { type: '道具', count: 28, percentage: 17, icon: 'cube', color: defaultColors[2] },
  { type: '特效', count: 12, percentage: 8, icon: 'sparkle', color: defaultColors[3] },
  { type: '音频', count: 9, percentage: 6, icon: 'music', color: defaultColors[4] },
  { type: '其他', count: 5, percentage: 3, icon: 'folder', color: defaultColors[5] },
])

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background: var(--td-bg-color-container, #f5f5f5);
  min-height: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: var(--td-bg-color-container, #fff);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-left: 4px solid;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon :deep(.t-icon) {
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--td-text-color-primary, #000);
  line-height: 1.2;
}

.stat-title {
  font-size: 13px;
  color: var(--td-text-color-secondary, #666);
  margin-top: 4px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
}

.stat-change.positive {
  color: #00a870;
  background: rgba(0, 168, 112, 0.1);
}

.stat-change.negative {
  color: #d94008;
  background: rgba(217, 64, 8, 0.1);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: var(--td-bg-color-container, #fff);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary, #000);
}

.chart-body {
  display: flex;
  gap: 20px;
}

.chart-svg {
  flex: 1;
}

.chart-svg :deep(svg) {
  width: 100%;
  height: auto;
}

.chart-svg.pie-chart {
  max-width: 200px;
}

.task-progress {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-item .label {
  font-size: 13px;
  color: var(--td-text-color-secondary, #666);
}

.progress-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: var(--td-text-color-secondary, #666);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 240px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.activity-item:hover {
  background: var(--td-bg-color-secondary, #f5f5f5);
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-text {
  font-size: 13px;
  color: var(--td-text-color-primary, #000);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-time {
  font-size: 12px;
  color: var(--td-text-color-secondary, #666);
  margin-top: 2px;
}

.asset-distribution {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .asset-distribution {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .asset-distribution {
    grid-template-columns: 1fr;
  }
}

.asset-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.asset-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.asset-count {
  margin-left: auto;
  font-weight: 600;
  color: var(--td-text-color-primary, #000);
}

/* 暗色模式适配 */
:deep(.dark) .stat-card,
.dark .stat-card {
  background: rgba(255, 255, 255, 0.05);
}

:deep(.dark) .chart-card,
.dark .chart-card {
  background: rgba(255, 255, 255, 0.05);
}

:deep(.dark) .activity-item:hover,
.dark .activity-item:hover {
  background: rgba(255, 255, 255, 0.05);
}
</style>
