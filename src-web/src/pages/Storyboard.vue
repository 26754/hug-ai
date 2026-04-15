<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(true)

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
            <h1>分镜设计</h1>
            <p>设计剧情分镜画面</p>
          </div>
        </div>
      </header>
      <div class="placeholder-content">
        <div class="placeholder-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
        </div>
        <h2>分镜设计功能</h2>
        <p>可视化设计剧情分镜，定义每个场景的画面布局</p>
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
.page-header { display: flex; align-items: center; margin-bottom: 32px; }
.header-left { display: flex; align-items: center; gap: 20px; }
.back-btn { width: 44px; height: 44px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: rgba(255,255,255,0.7); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.back-btn:hover { background: rgba(255,255,255,0.1); }
.back-btn svg { width: 20px; height: 20px; }
.page-title h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.page-title p { font-size: 14px; color: rgba(255,255,255,0.5); }
.placeholder-content { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120px 20px; text-align: center; }
.placeholder-icon { width: 100px; height: 100px; background: rgba(99, 102, 241, 0.1); border-radius: 24px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
.placeholder-icon svg { width: 48px; height: 48px; color: #6366f1; }
.placeholder-content h2 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
.placeholder-content p { font-size: 14px; color: rgba(255, 255, 255, 0.5); }
</style>
