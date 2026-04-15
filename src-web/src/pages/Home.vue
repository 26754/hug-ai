<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const showUserMenu = ref(false)

// 获取用户信息
const user = computed(() => authStore.user || {})
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

onMounted(async () => {
  try {
    // 确保用户已认证
    if (!authStore.token) {
      router.push('/login')
      return
    }
    
    // 尝试获取最新用户信息
    if (!authStore.user) {
      await authStore.checkAuth()
    }
  } catch (err) {
    console.error('Auth check failed:', err)
    router.push('/login')
  } finally {
    isLoading.value = false
  }
})

async function handleLogout() {
  showUserMenu.value = false
  await authStore.logout()
  router.push('/login')
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

// 关闭菜单
function closeMenu() {
  showUserMenu.value = false
}
</script>

<template>
  <div class="home-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="home-container">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <div class="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <span>HUG AI</span>
          </div>
        </div>
        
        <div class="header-right">
          <div class="user-menu" @click.stop>
            <button class="user-button" @click="toggleUserMenu">
              <div class="user-avatar">
                {{ user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U' }}
              </div>
              <span class="user-name">{{ user.username || user.email?.split('@')[0] || '用户' }}</span>
              <svg class="arrow" :class="{ 'arrow-up': showUserMenu }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            
            <Transition name="menu">
              <div v-if="showUserMenu" class="dropdown-menu" @click.stop>
                <div class="menu-header">
                  <div class="menu-avatar">
                    {{ user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U' }}
                  </div>
                  <div class="menu-info">
                    <span class="menu-name">{{ user.username || '未设置用户名' }}</span>
                    <span class="menu-email">{{ user.email }}</span>
                  </div>
                </div>
                <div class="menu-divider"></div>
                <button class="menu-item" @click="closeMenu">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  个人资料
                </button>
                <button class="menu-item" @click="closeMenu">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  设置
                </button>
                <div class="menu-divider"></div>
                <button class="menu-item logout" @click="handleLogout">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  退出登录
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Overlay for closing menu -->
      <div v-if="showUserMenu" class="menu-overlay" @click="closeMenu"></div>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">
            {{ greeting }}，<span class="highlight">{{ user.username || '创作者' }}</span>
          </h1>
          <p class="hero-subtitle">欢迎使用 HUG AI 短剧漫剧创作平台</p>
        </div>
        
        <div class="hero-cards">
          <div class="card">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
                <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
                <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
                <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/>
                <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
                <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/>
                <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/>
              </svg>
            </div>
            <h3>AI 智能创作</h3>
            <p>利用 AI 技术将小说自动转化为剧本</p>
          </div>
          
          <div class="card">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <h3>图片生成</h3>
            <p>一键生成精美的剧情插图和场景</p>
          </div>
          
          <div class="card">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h3>视频制作</h3>
            <p>快速生成高质量的短剧和漫剧视频</p>
          </div>
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="quick-actions">
        <h2>快速开始</h2>
        <div class="action-grid">
          <button class="action-button primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            创建新项目
          </button>
          <button class="action-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            导入小说
          </button>
          <button class="action-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            我的作品
          </button>
          <button class="action-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            设置
          </button>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <p>&copy; 2024 HUG AI. All rights reserved.</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
}

/* Loading */
.loading-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(15, 15, 35, 0.9);
  color: #fff;
  gap: 16px;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(99, 102, 241, 0.3);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Container */
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
}

.logo svg {
  width: 32px;
  height: 32px;
  color: #6366f1;
}

.logo span {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* User Menu */
.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.user-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.arrow-up {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background: rgba(30, 30, 50, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px;
  z-index: 100;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.menu-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}

.menu-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.menu-info {
  display: flex;
  flex-direction: column;
}

.menu-name {
  color: #fff;
  font-weight: 500;
  font-size: 14px;
}

.menu-email {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.menu-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  background: rgba(99, 102, 241, 0.2);
  color: #fff;
}

.menu-item svg {
  width: 18px;
  height: 18px;
}

.menu-item.logout:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Menu Transitions */
.menu-enter-active,
.menu-leave-active {
  transition: all 0.2s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
}

/* Hero Section */
.hero {
  padding: 60px 0;
  text-align: center;
}

.hero-title {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
}

.highlight {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 48px;
}

.hero-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.3s;
}

.card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(99, 102, 241, 0.3);
}

.card-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon svg {
  width: 28px;
  height: 28px;
  color: #6366f1;
}

.card h3 {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.card p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

/* Quick Actions */
.quick-actions {
  padding: 40px 0;
}

.quick-actions h2 {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.action-button svg {
  width: 20px;
  height: 20px;
}

.action-button.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  color: #fff;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
}

.action-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(99, 102, 241, 0.4);
}

/* Footer */
.footer {
  padding: 40px 0;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer p {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-cards {
    grid-template-columns: 1fr;
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .hero-title {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .user-name {
    display: none;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>
