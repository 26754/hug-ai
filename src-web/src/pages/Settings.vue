<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(true)

const settings = ref({
  theme: 'dark',
  language: 'zh-CN',
  autoSave: true,
  notifications: true
})

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
            <h1>设置</h1>
            <p>配置您的偏好设置</p>
          </div>
        </div>
      </header>
      
      <div class="settings-sections">
        <div class="settings-section">
          <h3>外观</h3>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">主题</span>
              <span class="setting-desc">选择界面显示主题</span>
            </div>
            <select v-model="settings.theme">
              <option value="dark">深色</option>
              <option value="light">浅色</option>
              <option value="auto">跟随系统</option>
            </select>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">语言</span>
              <span class="setting-desc">选择界面显示语言</span>
            </div>
            <select v-model="settings.language">
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>功能</h3>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">自动保存</span>
              <span class="setting-desc">自动保存编辑内容</span>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="settings.autoSave">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">通知</span>
              <span class="setting-desc">接收生成完成通知</span>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="settings.notifications">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>账户</h3>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">修改密码</span>
              <span class="setting-desc">更新您的账户密码</span>
            </div>
            <button class="action-link">修改</button>
          </div>
          <div class="setting-item danger">
            <div class="setting-info">
              <span class="setting-label">删除账户</span>
              <span class="setting-desc">永久删除您的账户和数据</span>
            </div>
            <button class="action-link danger">删除</button>
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
.settings-sections { display: flex; flex-direction: column; gap: 32px; }
.settings-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px; }
.settings-section h3 { font-size: 16px; font-weight: 600; margin-bottom: 20px; color: rgba(255,255,255,0.8); }
.setting-item { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
.setting-item:last-child { border-bottom: none; padding-bottom: 0; }
.setting-item:first-of-type { padding-top: 0; }
.setting-info { display: flex; flex-direction: column; gap: 4px; }
.setting-label { font-size: 14px; font-weight: 500; }
.setting-desc { font-size: 13px; color: rgba(255,255,255,0.5); }
.setting-item select { padding: 8px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 14px; outline: none; }
.setting-item select option { background: #1a1a2e; }
.toggle { position: relative; display: inline-block; width: 48px; height: 26px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; inset: 0; background: rgba(255,255,255,0.2); border-radius: 13px; transition: all 0.3s; }
.toggle-slider::before { content: ''; position: absolute; height: 20px; width: 20px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: all 0.3s; }
.toggle input:checked + .toggle-slider { background: #6366f1; }
.toggle input:checked + .toggle-slider::before { transform: translateX(22px); }
.action-link { background: none; border: none; color: #6366f1; font-size: 14px; cursor: pointer; padding: 8px 16px; border-radius: 8px; transition: all 0.2s; }
.action-link:hover { background: rgba(99, 102, 241, 0.1); }
.action-link.danger { color: #ef4444; }
.action-link.danger:hover { background: rgba(239, 68, 68, 0.1); }
</style>
