<template>
  <div class="sync-status">
    <!-- 同步指示器 -->
    <div class="sync-indicator" :class="statusClass">
      <t-icon :name="statusIcon" size="16px" />
      <span class="sync-text">{{ statusText }}</span>
    </div>
    
    <!-- 详细信息（hover时显示） -->
    <div class="sync-detail" v-if="showDetail">
      <div class="detail-row">
        <span class="label">云端状态:</span>
        <span class="value">{{ cloudStatus }}</span>
      </div>
      <div class="detail-row" v-if="lastSyncTime">
        <span class="label">上次同步:</span>
        <span class="value">{{ lastSyncTime }}</span>
      </div>
      <div class="detail-row" v-if="syncVersion > 0">
        <span class="label">同步版本:</span>
        <span class="value">{{ syncVersion }}</span>
      </div>
      <div class="detail-actions" v-if="!isSyncing && isLoggedIn">
        <t-button size="small" variant="outline" @click="forceSync">
          强制同步
        </t-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const isSyncing = ref(false)
const lastSyncAt = ref<Date | null>(null)
const syncVersion = ref(0)
const isCloudEnabled = ref(false)
const showDetail = ref(false)

// 计算属性
const isLoggedIn = computed(() => userStore.isLoggedIn)

const statusClass = computed(() => {
  if (!isCloudEnabled.value) return 'cloud-disabled'
  if (isSyncing.value) return 'syncing'
  return 'synced'
})

const statusIcon = computed(() => {
  if (!isCloudEnabled.value) return 'cloud-off'
  if (isSyncing.value) return 'sync'
  return 'cloud-check'
})

const statusText = computed(() => {
  if (!isCloudEnabled.value) return '本地模式'
  if (isSyncing.value) return '同步中...'
  return '已同步'
})

const cloudStatus = computed(() => {
  if (!isCloudEnabled.value) return '未启用'
  return '已启用'
})

const lastSyncTime = computed(() => {
  if (!lastSyncAt.value) return '从未同步'
  const date = new Date(lastSyncAt.value)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleDateString()
})

// 方法
async function fetchStatus() {
  if (!isLoggedIn.value) return
  
  try {
    const response = await fetch('/api/sync/status', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.code === 200) {
        isSyncing.value = data.data.isSyncing
        lastSyncAt.value = data.data.lastSyncAt ? new Date(data.data.lastSyncAt) : null
        syncVersion.value = data.data.syncVersion
        isCloudEnabled.value = data.data.isCloudEnabled
      }
    }
  } catch (err) {
    console.warn('获取同步状态失败:', err)
  }
}

async function forceSync() {
  if (!isLoggedIn.value || isSyncing.value) return
  
  isSyncing.value = true
  
  try {
    const response = await fetch('/api/sync/force', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    if (response.ok) {
      // 开始轮询状态
      pollSyncStatus()
    }
  } catch (err) {
    console.error('强制同步失败:', err)
    isSyncing.value = false
  }
}

let pollTimer: number | null = null

function pollSyncStatus() {
  pollTimer = window.setInterval(async () => {
    await fetchStatus()
    if (!isSyncing.value && pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }, 2000)
  
  // 最多轮询30秒
  setTimeout(() => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
      isSyncing.value = false
    }
  }, 30000)
}

// 生命周期
let refreshTimer: number | null = null

onMounted(() => {
  fetchStatus()
  // 每60秒刷新一次状态
  refreshTimer = window.setInterval(fetchStatus, 60000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.sync-status {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.sync-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sync-indicator:hover {
  background-color: var(--td-bg-color-container-hover);
}

.sync-text {
  color: var(--td-text-color-secondary);
}

/* 状态样式 */
.synced .sync-text {
  color: var(--td-success-color);
}

.syncing {
  animation: pulse 1.5s infinite;
}

.syncing .sync-text {
  color: var(--td-primary-color);
}

.cloud-disabled .sync-text {
  color: var(--td-text-color-disabled);
}

.cloud-disabled {
  opacity: 0.7;
}

/* 详情弹出 */
.sync-detail {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  padding: 12px;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 6px;
  box-shadow: var(--td-shadow-2);
  min-width: 180px;
  z-index: 1000;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
}

.detail-row .label {
  color: var(--td-text-color-secondary);
}

.detail-row .value {
  color: var(--td-text-color-primary);
}

.detail-actions {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--td-border-level-1-color);
  text-align: center;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
