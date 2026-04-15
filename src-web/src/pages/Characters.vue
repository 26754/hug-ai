<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(true)

const characters = ref([
  { id: 1, name: '苏晚', role: '女主', project: '霸道总裁爱上我', avatar: '#ec4899', description: '聪明独立的现代女性，性格倔强但内心柔软。' },
  { id: 2, name: '陆景琛', role: '男主', project: '霸道总裁爱上我', avatar: '#6366f1', description: '霸道总裁，外冷内热，对感情专一。' },
  { id: 3, name: '林尘', role: '主角', project: '修仙世界', avatar: '#8b5cf6', description: '平凡少年，逆天改命，最终成为一代仙尊。' },
  { id: 4, name: '沈若', role: '女主', project: '穿越古代', avatar: '#f59e0b', description: '现代设计师，聪慧机敏，善于谋略。' }
])

onMounted(async () => {
  try {
    if (!authStore.token) {
      router.push('/login')
      return
    }
  } catch (err) {
    router.push('/login')
  } finally {
    isLoading.value = false
  }
})

function getRoleClass(role) {
  const map = { '男主': 'role-male', '女主': 'role-female', '主角': 'role-main', '配角': 'role-support' }
  return map[role] || 'role-support'
}
</script>

<template>
  <div class="page-container">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
    <div v-else class="page-content">
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" @click="router.push('/home')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="page-title">
            <h1>角色管理</h1>
            <p>创建和管理剧本角色</p>
          </div>
        </div>
        <button class="create-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          创建角色
        </button>
      </header>
      
      <div class="characters-grid">
        <div v-for="char in characters" :key="char.id" class="character-card">
          <div class="char-avatar" :style="{ backgroundColor: char.avatar }">
            {{ char.name[0] }}
          </div>
          <div class="char-info">
            <h3>{{ char.name }}</h3>
            <span class="char-role" :class="getRoleClass(char.role)">{{ char.role }}</span>
            <p class="char-project">{{ char.project }}</p>
            <p class="char-desc">{{ char.description }}</p>
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
.back-btn { width: 44px; height: 44px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: rgba(255,255,255,0.7); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.back-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.back-btn svg { width: 20px; height: 20px; }
.page-title h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.page-title p { font-size: 14px; color: rgba(255,255,255,0.5); }
.create-btn { display: flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; border-radius: 12px; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.create-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4); }
.create-btn svg { width: 18px; height: 18px; }
.characters-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.character-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; align-items: center; text-align: center; transition: all 0.3s; cursor: pointer; }
.character-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(99, 102, 241, 0.3); transform: translateY(-4px); }
.char-avatar { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: #fff; margin-bottom: 16px; }
.char-info h3 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
.char-role { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; margin-bottom: 8px; }
.role-male { background: rgba(99, 102, 241, 0.2); color: #6366f1; }
.role-female { background: rgba(236, 72, 153, 0.2); color: #ec4899; }
.role-main { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
.role-support { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6); }
.char-project { font-size: 13px; color: rgba(255, 255, 255, 0.5); margin-bottom: 8px; }
.char-desc { font-size: 13px; color: rgba(255, 255, 255, 0.7); line-height: 1.5; }
</style>
