<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(true)
const filterType = ref('all')

const images = ref([
  { id: 1, title: '咖啡厅相遇', project: '霸道总裁爱上我', scene: '第1集', type: 'scene', created: '2024-03-15', url: '' },
  { id: 2, title: '签约场景', project: '霸道总裁爱上我', scene: '第1集', type: 'scene', created: '2024-03-15', url: '' },
  { id: 3, title: '林尘觉醒', project: '修仙世界', scene: '第1集', type: 'character', created: '2024-03-14', url: '' },
  { id: 4, title: '宗门考核', project: '修仙世界', scene: '第2集', type: 'scene', created: '2024-03-13', url: '' }
])

onMounted(async () => {
  try {
    if (!authStore.token) { router.push('/login'); return }
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
            <h1>图片生成</h1>
            <p>AI 生成剧情图片和角色立绘</p>
          </div>
        </div>
        <button class="create-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          生成图片
        </button>
      </header>
      
      <div class="filter-tabs">
        <button class="filter-tab" :class="{ active: filterType === 'all' }" @click="filterType = 'all'">全部</button>
        <button class="filter-tab" :class="{ active: filterType === 'scene' }" @click="filterType = 'scene'">场景图</button>
        <button class="filter-tab" :class="{ active: filterType === 'character' }" @click="filterType = 'character'">角色图</button>
      </div>
      
      <div class="images-grid">
        <div v-for="img in images" :key="img.id" class="image-card">
          <div class="image-placeholder" :style="{ backgroundColor: `hsl(${(img.id * 50) % 360}, 60%, 40%)` }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <div class="image-info">
            <h4>{{ img.title }}</h4>
            <p>{{ img.project }} · {{ img.scene }}</p>
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
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.header-left { display: flex; align-items: center; gap: 20px; }
.back-btn { width: 44px; height: 44px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: rgba(255,255,255,0.7); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.back-btn:hover { background: rgba(255,255,255,0.1); }
.back-btn svg { width: 20px; height: 20px; }
.page-title h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.page-title p { font-size: 14px; color: rgba(255,255,255,0.5); }
.create-btn { display: flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; border-radius: 12px; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
.create-btn svg { width: 18px; height: 18px; }
.filter-tabs { display: flex; gap: 8px; margin-bottom: 24px; }
.filter-tab { padding: 10px 20px; background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: rgba(255,255,255,0.6); font-size: 14px; cursor: pointer; transition: all 0.2s; }
.filter-tab:hover { border-color: rgba(255,255,255,0.2); color: #fff; }
.filter-tab.active { background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.5); color: #fff; }
.images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
.image-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; cursor: pointer; transition: all 0.3s; }
.image-card:hover { transform: translateY(-4px); border-color: rgba(99, 102, 241, 0.3); }
.image-placeholder { aspect-ratio: 16/10; display: flex; align-items: center; justify-content: center; }
.image-placeholder svg { width: 40px; height: 40px; color: rgba(255,255,255,0.4); }
.image-info { padding: 16px; }
.image-info h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.image-info p { font-size: 12px; color: rgba(255,255,255,0.5); }
</style>
