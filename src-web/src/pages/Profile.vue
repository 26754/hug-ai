<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(true)

const user = computed(() => authStore.user || {})

const stats = ref({
  projects: 4,
  scripts: 12,
  images: 256,
  videos: 16
})

onMounted(async () => {
  try {
    if (!authStore.token) { router.push('/login'); return }
    if (!authStore.user) { await authStore.checkAuth() }
  } catch (err) { router.push('/login') } 
  finally { isLoading.value = false }
})
</script>

<template>
  <div class="page-container">
    <div v-if="isLoading" class="loading-overlay"><div class="loading-spinner"></div></div>
    <div v-else class="page-content">
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" @click="router.push('/home')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="page-title">
            <h1>个人资料</h1>
            <p>管理您的账户信息</p>
          </div>
        </div>
      </header>
      
      <div class="profile-card">
        <div class="profile-avatar">
          {{ user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U' }}
        </div>
        <div class="profile-info">
          <h2>{{ user.username || '未设置用户名' }}</h2>
          <p>{{ user.email }}</p>
        </div>
        <button class="edit-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          编辑资料
        </button>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ stats.projects }}</span>
          <span class="stat-label">项目</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.scripts }}</span>
          <span class="stat-label">剧本</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.images }}</span>
          <span class="stat-label">图片</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.videos }}</span>
          <span class="stat-label">视频</span>
        </div>
      </div>
      
      <div class="profile-section">
        <h3>账户信息</h3>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">用户名</span>
            <span class="info-value">{{ user.username || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">邮箱</span>
            <span class="info-value">{{ user.email }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">注册时间</span>
            <span class="info-value">2024-01-01</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container { min-height: 100vh; background: #0a0a0f; color: #fff; }
.loading-overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }
.loading-spinner { width: 40px; height: 40px; border: 3px solid rgba(99, 102, 241, 0.3); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.page-content { max-width: 720px; margin: 0 auto; padding: 32px; }
.page-header { margin-bottom: 32px; }
.header-left { display: flex; align-items: center; gap: 20px; }
.back-btn { width: 44px; height: 44px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: rgba(255,255,255,0.7); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.back-btn:hover { background: rgba(255,255,255,0.1); }
.back-btn svg { width: 20px; height: 20px; }
.page-title h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.page-title p { font-size: 14px; color: rgba(255,255,255,0.5); }
.profile-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 32px; display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }
.profile-avatar { width: 80px; height: 80px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; flex-shrink: 0; }
.profile-info { flex: 1; }
.profile-info h2 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.profile-info p { font-size: 14px; color: rgba(255,255,255,0.5); }
.edit-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: rgba(255,255,255,0.8); font-size: 14px; cursor: pointer; transition: all 0.2s; }
.edit-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.edit-btn svg { width: 16px; height: 16px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px; text-align: center; }
.stat-value { display: block; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px; }
.stat-label { font-size: 13px; color: rgba(255,255,255,0.5); }
.profile-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px; }
.profile-section h3 { font-size: 16px; font-weight: 600; margin-bottom: 20px; color: rgba(255,255,255,0.8); }
.info-list { display: flex; flex-direction: column; }
.info-item { display: flex; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
.info-item:last-child { border-bottom: none; }
.info-label { font-size: 14px; color: rgba(255,255,255,0.5); }
.info-value { font-size: 14px; font-weight: 500; }
</style>
