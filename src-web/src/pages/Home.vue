<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const showUserMenu = ref(false)
const activeTab = ref('projects')
const searchQuery = ref('')
const showCreateModal = ref(false)
const newProjectName = ref('')
const newProjectDesc = ref('')
const recentProjects = ref([
  { id: 1, name: '霸道总裁爱上我', status: '进行中', progress: 65, updated: '2024-03-15' },
  { id: 2, name: '修仙世界', status: '已完成', progress: 100, updated: '2024-03-14' },
  { id: 3, name: '都市异能', status: '草稿', progress: 30, updated: '2024-03-13' }
])

// 获取用户信息
const user = computed(() => authStore.user || {})
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

// 功能模块数据
const featureModules = computed(() => [
  {
    id: 'workbench',
    name: '无限画布',
    desc: '可视化生产工作台',
    icon: 'canvas',
    color: '#a855f7',
    path: '/workbench',
    count: 1
  },
  {
    id: 'novels',
    name: '小说管理',
    desc: '导入和管理小说文本',
    icon: 'book',
    color: '#6366f1',
    path: '/novels',
    count: 12
  },
  {
    id: 'scripts',
    name: '剧本管理',
    desc: '编辑和管理剧本',
    icon: 'script',
    color: '#8b5cf6',
    path: '/scripts',
    count: 8
  },
  {
    id: 'characters',
    name: '角色管理',
    desc: '创建和管理角色',
    icon: 'user',
    color: '#ec4899',
    path: '/characters',
    count: 24
  },
  {
    id: 'storyboard',
    name: '分镜设计',
    desc: '设计剧情分镜',
    icon: 'layout',
    color: '#06b6d4',
    path: '/storyboard',
    count: 45
  },
  {
    id: 'images',
    name: '图片生成',
    desc: 'AI 生成剧情图片',
    icon: 'image',
    color: '#f59e0b',
    path: '/images',
    count: 128
  },
  {
    id: 'videos',
    name: '视频生成',
    desc: 'AI 生成短剧视频',
    icon: 'video',
    color: '#10b981',
    path: '/videos',
    count: 32
  }
])

// 工作流程步骤
const workflowSteps = [
  { step: 1, name: '导入小说', icon: 'book', desc: '上传或输入小说文本' },
  { step: 2, name: 'AI 改编', icon: 'magic', desc: '自动转换为剧本' },
  { step: 3, name: '角色设计', icon: 'user', desc: '创建角色设定' },
  { step: 4, name: '分镜制作', icon: 'layout', desc: '设计分镜画面' },
  { step: 5, name: '生成图片', icon: 'image', desc: 'AI 生成剧照' },
  { step: 6, name: '视频合成', icon: 'video', desc: '生成短剧视频' }
]

onMounted(async () => {
  try {
    if (!authStore.token) {
      router.push('/login')
      return
    }
    
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

function closeMenu() {
  showUserMenu.value = false
}

function navigateTo(path) {
  router.push(path)
}

function openCreateModal() {
  showCreateModal.value = true
  newProjectName.value = ''
  newProjectDesc.value = ''
}

function closeCreateModal() {
  showCreateModal.value = false
}

function createProject() {
  if (!newProjectName.value.trim()) return
  // 创建项目的逻辑
  console.log('Creating project:', newProjectName.value)
  closeCreateModal()
  router.push('/projects/new')
}

function getStatusClass(status) {
  const statusMap = {
    '进行中': 'active',
    '已完成': 'completed',
    '草稿': 'draft'
  }
  return statusMap[status] || 'draft'
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
          <div class="logo" @click="navigateTo('/home')">
            <svg viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="url(#logoGrad)"/>
              <path d="M12 20L20 12L28 20L20 28L12 20Z" fill="white" fill-opacity="0.9"/>
              <path d="M20 14L26 20L20 26L14 20L20 14Z" fill="white" fill-opacity="0.6"/>
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40">
                  <stop offset="0%" stop-color="#6366f1"/>
                  <stop offset="100%" stop-color="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
            <span>HUG AI</span>
          </div>
          
          <nav class="nav-tabs">
            <button 
              class="nav-tab" 
              :class="{ active: activeTab === 'projects' }"
              @click="activeTab = 'projects'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              项目
            </button>
            <button 
              class="nav-tab" 
              :class="{ active: activeTab === 'workflow' }"
              @click="activeTab = 'workflow'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              工作流
            </button>
            <button 
              class="nav-tab" 
              :class="{ active: activeTab === 'gallery' }"
              @click="activeTab = 'gallery'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              作品库
            </button>
          </nav>
        </div>
        
        <div class="header-right">
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="搜索项目、小说、剧本..."
            />
          </div>
          
          <button class="create-btn" @click="openCreateModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            新建项目
          </button>
          
          <div class="user-menu" @click.stop>
            <button class="user-button" @click="toggleUserMenu">
              <div class="user-avatar">
                {{ user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U' }}
              </div>
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
                <button class="menu-item" @click="navigateTo('/profile'); closeMenu()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  个人资料
                </button>
                <button class="menu-item" @click="navigateTo('/settings'); closeMenu()">
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

      <!-- Main Content Area -->
      <main class="main-content">
        <!-- Projects Tab -->
        <div v-if="activeTab === 'projects'" class="tab-content">
          <!-- Welcome Section -->
          <section class="welcome-section">
            <div class="welcome-text">
              <h1 class="welcome-title">
                {{ greeting }}，<span class="highlight">{{ user.username || '创作者' }}</span>
              </h1>
              <p class="welcome-subtitle">今天想创作什么精彩故事？</p>
            </div>
            <div class="welcome-stats">
              <div class="stat-item">
                <span class="stat-value">{{ recentProjects.length }}</span>
                <span class="stat-label">项目中</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">24</span>
                <span class="stat-label">角色</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">128</span>
                <span class="stat-label">生成</span>
              </div>
            </div>
          </section>

          <!-- Feature Modules -->
          <section class="modules-section">
            <h2 class="section-title">功能模块</h2>
            <div class="modules-grid">
              <div 
                v-for="module in featureModules" 
                :key="module.id"
                class="module-card"
                @click="navigateTo(module.path)"
              >
                <div class="module-icon" :style="{ backgroundColor: module.color + '20', color: module.color }">
                  <!-- Book Icon -->
                  <svg v-if="module.icon === 'book'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  <!-- Script Icon -->
                  <svg v-else-if="module.icon === 'script'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <!-- User Icon -->
                  <svg v-else-if="module.icon === 'user'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <!-- Layout Icon -->
                  <svg v-else-if="module.icon === 'layout'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                  <!-- Image Icon -->
                  <svg v-else-if="module.icon === 'image'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <!-- Video Icon -->
                  <svg v-else-if="module.icon === 'video'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  <!-- Canvas Icon -->
                  <svg v-else-if="module.icon === 'canvas'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="3" y1="15" x2="21" y2="15"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                    <line x1="15" y1="3" x2="15" y2="21"/>
                  </svg>
                </div>
                <div class="module-info">
                  <h3 class="module-name">{{ module.name }}</h3>
                  <p class="module-desc">{{ module.desc }}</p>
                </div>
                <div class="module-count">{{ module.count }}</div>
                <div class="module-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>
            </div>
          </section>

          <!-- Recent Projects -->
          <section class="projects-section">
            <div class="section-header">
              <h2 class="section-title">最近项目</h2>
              <button class="view-all-btn" @click="navigateTo('/projects')">
                查看全部
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
            <div class="projects-list">
              <div v-for="project in recentProjects" :key="project.id" class="project-item" @click="navigateTo('/projects/' + project.id)">
                <div class="project-cover">
                  <div class="cover-placeholder" :style="{ backgroundColor: project.id === 1 ? '#6366f1' : project.id === 2 ? '#10b981' : '#f59e0b' }">
                    <span>{{ project.name[0] }}</span>
                  </div>
                </div>
                <div class="project-info">
                  <h4 class="project-name">{{ project.name }}</h4>
                  <div class="project-meta">
                    <span class="project-status" :class="getStatusClass(project.status)">{{ project.status }}</span>
                    <span class="project-date">{{ project.updated }}</span>
                  </div>
                </div>
                <div class="project-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: project.progress + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ project.progress }}%</span>
                </div>
                <button class="project-action" @click.stop="navigateTo('/projects/' + project.id)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- Workflow Tab -->
        <div v-if="activeTab === 'workflow'" class="tab-content">
          <section class="workflow-section">
            <div class="section-header">
              <h2 class="section-title">AI 创作工作流</h2>
              <p class="section-desc">从小说到视频，一站式智能创作流程</p>
            </div>
            <div class="workflow-timeline">
              <div v-for="(step, index) in workflowSteps" :key="step.step" class="workflow-step">
                <div class="step-number">{{ step.step }}</div>
                <div class="step-connector" v-if="index < workflowSteps.length - 1"></div>
                <div class="step-content">
                  <div class="step-icon">
                    <svg v-if="step.icon === 'book'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    <svg v-else-if="step.icon === 'magic'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
                      <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z"/>
                    </svg>
                    <svg v-else-if="step.icon === 'user'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <svg v-else-if="step.icon === 'layout'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    <svg v-else-if="step.icon === 'image'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <svg v-else-if="step.icon === 'video'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="23 7 16 12 23 17 23 7"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                  </div>
                  <h3 class="step-name">{{ step.name }}</h3>
                  <p class="step-desc">{{ step.desc }}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Gallery Tab -->
        <div v-if="activeTab === 'gallery'" class="tab-content">
          <section class="gallery-section">
            <div class="section-header">
              <h2 class="section-title">我的作品</h2>
              <div class="gallery-filters">
                <button class="filter-btn active">全部</button>
                <button class="filter-btn">图片</button>
                <button class="filter-btn">视频</button>
              </div>
            </div>
            <div class="gallery-grid">
              <div v-for="i in 12" :key="i" class="gallery-item">
                <div class="gallery-placeholder" :style="{ backgroundColor: `hsl(${(i * 30) % 360}, 70%, 50%)` }">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div class="gallery-info">
                  <span class="gallery-title">作品 {{ i }}</span>
                  <span class="gallery-date">2024-03-{{ String(i).padStart(2, '0') }}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <!-- Create Project Modal -->
      <Teleport to="body">
        <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>创建新项目</h3>
              <button class="modal-close" @click="closeCreateModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>项目名称</label>
                <input 
                  type="text" 
                  v-model="newProjectName" 
                  placeholder="输入项目名称"
                  @keyup.enter="createProject"
                />
              </div>
              <div class="form-group">
                <label>项目描述</label>
                <textarea 
                  v-model="newProjectDesc" 
                  placeholder="简要描述项目内容（可选）"
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="closeCreateModal">取消</button>
              <button class="btn-primary" @click="createProject" :disabled="!newProjectName.trim()">
                创建项目
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #0a0a0f;
  color: #fff;
}

/* Loading */
.loading-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 15, 0.95);
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
  position: relative;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 48px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo svg {
  width: 40px;
  height: 40px;
}

.logo span {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-tabs {
  display: flex;
  gap: 8px;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-tab:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.05);
}

.nav-tab.active {
  color: #fff;
  background: rgba(99, 102, 241, 0.15);
}

.nav-tab svg {
  width: 18px;
  height: 18px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  width: 280px;
}

.search-box svg {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.4);
}

.search-box input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #fff;
  font-size: 14px;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}

.create-btn svg {
  width: 18px;
  height: 18px;
}

/* User Menu */
.user-menu {
  position: relative;
}

.user-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  transition: transform 0.2s;
}

.user-button:hover .user-avatar {
  transform: scale(1.05);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 240px;
  background: rgba(20, 20, 30, 0.95);
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

/* Main Content */
.main-content {
  padding: 32px 0;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Welcome Section */
.welcome-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 48px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.highlight {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}

.welcome-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

/* Section Styles */
.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

/* Modules Section */
.modules-section {
  margin-bottom: 48px;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.module-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.module-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
}

.module-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.module-icon svg {
  width: 24px;
  height: 24px;
}

.module-info {
  flex: 1;
}

.module-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.module-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.module-count {
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
}

.module-arrow {
  position: absolute;
  right: 20px;
  opacity: 0;
  transition: all 0.2s;
}

.module-card:hover .module-arrow {
  opacity: 0.5;
  transform: translateX(4px);
}

.module-arrow svg {
  width: 20px;
  height: 20px;
}

/* Projects Section */
.projects-section {
  margin-bottom: 48px;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-all-btn:hover {
  border-color: rgba(99, 102, 241, 0.5);
  color: #fff;
}

.view-all-btn svg {
  width: 16px;
  height: 16px;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.project-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.project-cover {
  flex-shrink: 0;
}

.cover-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}

.project-info {
  flex: 1;
}

.project-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-status {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.project-status.active {
  background: rgba(99, 102, 241, 0.2);
  color: #6366f1;
}

.project-status.completed {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.project-status.draft {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.project-date {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.project-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 160px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #a855f7);
  border-radius: 2px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  width: 36px;
  text-align: right;
}

.project-action {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-action:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.project-action svg {
  width: 18px;
  height: 18px;
}

/* Workflow Section */
.workflow-section {
  padding: 40px 0;
}

.workflow-timeline {
  display: flex;
  justify-content: space-between;
  position: relative;
  margin-top: 48px;
  padding: 0 20px;
}

.workflow-timeline::before {
  content: '';
  position: absolute;
  top: 24px;
  left: 60px;
  right: 60px;
  height: 2px;
  background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #06b6d4, #10b981, #f59e0b);
  opacity: 0.3;
}

.workflow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  flex: 1;
}

.step-number {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
}

.step-connector {
  display: none;
}

.step-content {
  text-align: center;
  max-width: 120px;
}

.step-icon {
  width: 56px;
  height: 56px;
  background: rgba(99, 102, 241, 0.1);
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.step-icon svg {
  width: 24px;
  height: 24px;
  color: #6366f1;
}

.step-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.step-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* Gallery Section */
.gallery-section {
  padding: 20px 0;
}

.gallery-filters {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.filter-btn.active {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.5);
  color: #fff;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.gallery-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.gallery-item:hover {
  transform: translateY(-4px);
}

.gallery-placeholder {
  aspect-ratio: 16/10;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.gallery-placeholder svg {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.5);
}

.gallery-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gallery-title {
  font-size: 14px;
  font-weight: 500;
}

.gallery-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.modal-close svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.8);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.btn-secondary:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Footer */
.footer {
  padding: 32px 0;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: 48px;
}

.footer p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
