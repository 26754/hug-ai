<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(true)

const videos = ref([
  { id: 1, title: '第1集预告', project: '霸道总裁爱上我', duration: '1:30', status: 'completed', created: '2024-03-15' },
  { id: 2, title: '第2集预告', project: '霸道总裁爱上我', duration: '1:45', status: 'processing', created: '2024-03-14' },
  { id: 3, title: '第1集完整版', project: '修仙世界', duration: '8:00', status: 'completed', created: '2024-03-10' }
])

onMounted(async () => {
  try {
    if (!authStore.token) { router.push('/login'); return }
  } catch (err) { router.push('/login') } 
  finally { isLoading.value = false }
})

function getStatusClass(status) {
  return status === 'completed' ? 'status-completed' : 'status-processing'
}
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
            <h1>视频生成</h1>
            <p>AI 生成短剧和漫剧视频</p>
          </div>
        </div>
        <button class="create-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          生成视频
        </button>
      </header>
      
      <div class="videos-grid">
        <div v-for="video in videos" :key="video.id" class="video-card">
          <div class="video-thumbnail" :style="{ backgroundColor: `hsl(${(video.id * 80) % 360}, 60%, 35%)` }">
            <div class="play-btn">
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <span class="duration">{{ video.duration }}</span>
            <span v-if="video.status === 'processing'" class="processing-overlay">
              <span class="spinner"></span>
              生成中
            </span>
          </div>
          <div class="video-info">
            <div class="video-header">
              <h4>{{ video.title }}</h4>
              <span class="status-badge" :class="getStatusClass(video.status)">
                {{ video.status === 'completed' ? '已完成' : '生成中' }}
              </span>
            </div>
            <p>{{ video.project }} · {{ video.created }}</p>
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
.page-content { max-width: 1200px; margin: 0 auto; padding: 32px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
.header-left { display: flex; align-items: center; gap: 20px; }
.back-btn { width: 44px; height: 44px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: rgba(255,255,255,0.7); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.back-btn:hover { background: rgba(255,255,255,0.1); }
.back-btn svg { width: 20px; height: 20px; }
.page-title h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.page-title p { font-size: 14px; color: rgba(255,255,255,0.5); }
.create-btn { display: flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; border-radius: 12px; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
.create-btn svg { width: 18px; height: 18px; }
.videos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
.video-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; cursor: pointer; transition: all 0.3s; }
.video-card:hover { transform: translateY(-4px); border-color: rgba(99, 102, 241, 0.3); }
.video-thumbnail { aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; position: relative; }
.play-btn { width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.play-btn svg { width: 24px; height: 24px; color: #fff; margin-left: 4px; }
.video-card:hover .play-btn { background: rgba(255,255,255,0.3); transform: scale(1.1); }
.duration { position: absolute; bottom: 12px; right: 12px; padding: 4px 8px; background: rgba(0,0,0,0.7); border-radius: 4px; font-size: 12px; }
.processing-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 14px; }
.spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
.video-info { padding: 16px; }
.video-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.video-info h4 { font-size: 15px; font-weight: 600; }
.video-info p { font-size: 13px; color: rgba(255,255,255,0.5); }
.status-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.status-completed { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.status-processing { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
</style>
