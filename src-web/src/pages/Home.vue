<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const showProfileMenu = ref(false)

const stats = ref([
  { label: '项目数', value: '0', icon: '📁' },
  { label: '剧本数', value: '0', icon: '📜' },
  { label: '图片数', value: '0', icon: '🖼️' },
  { label: '视频数', value: '0', icon: '🎬' }
])

const features = ref([
  {
    title: '智能剧本生成',
    description: '利用 AI 技术将小说自动转化为剧本',
    icon: '✍️',
    color: '#6366f1'
  },
  {
    title: 'AI 图片生成',
    description: '根据剧本内容智能生成配套图片',
    icon: '🎨',
    color: '#8b5cf6'
  },
  {
    title: '视频制作',
    description: '将图片和剧本合成为精美短剧',
    icon: '🎥',
    color: '#ec4899'
  },
  {
    title: '多项目管理',
    description: '便捷管理您的所有创作项目',
    icon: '📋',
    color: '#14b8a6'
  }
])

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value
}
</script>

<template>
  <div class="home-container">
    <header class="header">
      <div class="header-content">
        <h1 class="logo">HUG AI</h1>
        <div class="user-menu">
          <button class="profile-btn" @click="toggleProfileMenu">
            <span class="avatar">{{ authStore.user?.username?.[0]?.toUpperCase() || authStore.user?.email?.[0]?.toUpperCase() || 'U' }}</span>
            <span class="username">{{ authStore.user?.username || authStore.user?.email }}</span>
            <span class="arrow">▼</span>
          </button>
          <div v-if="showProfileMenu" class="profile-dropdown">
            <div class="dropdown-header">
              <p class="dropdown-email">{{ authStore.user?.email }}</p>
            </div>
            <button class="dropdown-item" @click="handleLogout">
              退出登录
            </button>
          </div>
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <section class="welcome-section fade-in">
        <h2 class="welcome-title">欢迎回来，{{ authStore.user?.username || '创作者' }}！</h2>
        <p class="welcome-subtitle">开始您的 AI 短剧创作之旅</p>
      </section>
      
      <section class="stats-section">
        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.label" class="stat-card card">
            <span class="stat-icon">{{ stat.icon }}</span>
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </section>
      
      <section class="features-section">
        <h3 class="section-title">核心功能</h3>
        <div class="features-grid">
          <div v-for="feature in features" :key="feature.title" class="feature-card card">
            <div class="feature-icon" :style="{ backgroundColor: feature.color + '20', color: feature.color }">
              {{ feature.icon }}
            </div>
            <h4 class="feature-title">{{ feature.title }}</h4>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </section>
      
      <section class="quick-start-section">
        <h3 class="section-title">快速开始</h3>
        <div class="quick-start-cards">
          <div class="quick-start-card card">
            <div class="quick-start-icon">🚀</div>
            <h4>创建新项目</h4>
            <p>开始一个全新的短剧创作</p>
            <button class="btn btn-primary">立即创建</button>
          </div>
          <div class="quick-start-card card">
            <div class="quick-start-icon">📖</div>
            <h4>导入小说</h4>
            <p>将您的小说作品导入平台</p>
            <button class="btn btn-secondary">导入小说</button>
          </div>
          <div class="quick-start-card card">
            <div class="quick-start-icon">📂</div>
            <h4>打开项目</h4>
            <p>继续您未完成的创作</p>
            <button class="btn btn-secondary">浏览项目</button>
          </div>
        </div>
      </section>
    </main>
    
    <footer class="footer">
      <p>© 2024 HUG AI. 利用 AI 技术赋能短剧创作。</p>
    </footer>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-menu {
  position: relative;
}

.profile-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.profile-btn:hover {
  background: var(--card-hover);
  border-color: var(--border-light);
}

.avatar {
  width: 32px;
  height: 32px;
  background: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.username {
  color: var(--text);
  font-size: 14px;
}

.arrow {
  color: var(--text-secondary);
  font-size: 10px;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: fadeIn 0.2s ease;
}

.dropdown-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.dropdown-email {
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
}

.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: var(--text);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;
}

.dropdown-item:hover {
  background: var(--card-hover);
}

/* Main Content */
.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
  width: 100%;
}

/* Welcome Section */
.welcome-section {
  text-align: center;
  margin-bottom: 48px;
}

.welcome-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
  background: linear-gradient(135deg, var(--text) 0%, var(--text-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
}

/* Stats Section */
.stats-section {
  margin-bottom: 48px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  padding: 24px;
  text-align: center;
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 12px;
  display: block;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-light);
  display: block;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

/* Features Section */
.features-section,
.quick-start-section {
  margin-bottom: 48px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.feature-card {
  padding: 24px;
}

.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 16px;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.feature-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Quick Start Section */
.quick-start-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.quick-start-card {
  padding: 32px;
  text-align: center;
}

.quick-start-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.quick-start-card h4 {
  font-size: 18px;
  margin-bottom: 8px;
}

.quick-start-card p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

/* Footer */
.footer {
  text-align: center;
  padding: 24px;
  border-top: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 14px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
