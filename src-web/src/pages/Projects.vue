<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const selectedProject = ref(null)
const searchQuery = ref('')
const filterStatus = ref('all')
const newProject = ref({
  name: '',
  description: '',
  type: 'short_drama'
})

// 模拟项目数据
const projects = ref([
  { 
    id: 1, 
    name: '霸道总裁爱上我', 
    description: '都市言情短剧，讲述职场女强人与霸道总裁的爱情故事',
    status: 'active', 
    progress: 65, 
    type: 'short_drama',
    created: '2024-03-01',
    updated: '2024-03-15',
    chapters: 20,
    scripts: 45,
    images: 128,
    videos: 8
  },
  { 
    id: 2, 
    name: '修仙世界', 
    description: '玄幻修仙题材，主人公逆天改命的成长历程',
    status: 'completed', 
    progress: 100, 
    type: 'anime',
    created: '2024-02-15',
    updated: '2024-03-14',
    chapters: 50,
    scripts: 120,
    images: 320,
    videos: 25
  },
  { 
    id: 3, 
    name: '都市异能', 
    description: '都市异能类小说改编，展现超能力者的都市生活',
    status: 'draft', 
    progress: 30, 
    type: 'short_drama',
    created: '2024-03-10',
    updated: '2024-03-13',
    chapters: 5,
    scripts: 12,
    images: 24,
    videos: 0
  },
  { 
    id: 4, 
    name: '穿越古代', 
    description: '现代女穿越到古代，卷入宫廷斗争',
    status: 'active', 
    progress: 45, 
    type: 'historical',
    created: '2024-02-28',
    updated: '2024-03-12',
    chapters: 15,
    scripts: 35,
    images: 86,
    videos: 5
  }
])

const filteredProjects = computed(() => {
  let result = projects.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query)
    )
  }
  
  if (filterStatus.value !== 'all') {
    result = result.filter(p => p.status === filterStatus.value)
  }
  
  return result
})

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'draft', label: '草稿' },
  { value: 'completed', label: '已完成' }
]

const typeOptions = [
  { value: 'short_drama', label: '短剧', icon: '🎬' },
  { value: 'anime', label: '动漫', icon: '🎨' },
  { value: 'historical', label: '古风', icon: '🏯' }
]

onMounted(async () => {
  try {
    if (!authStore.token) {
      router.push('/login')
      return
    }
  } catch (err) {
    console.error('Auth check failed:', err)
    router.push('/login')
  } finally {
    isLoading.value = false
  }
})

function openCreateModal() {
  newProject.value = { name: '', description: '', type: 'short_drama' }
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

function createProject() {
  if (!newProject.value.name.trim()) return
  
  const project = {
    id: Date.now(),
    name: newProject.value.name,
    description: newProject.value.description,
    type: newProject.value.type,
    status: 'draft',
    progress: 0,
    created: new Date().toISOString().split('T')[0],
    updated: new Date().toISOString().split('T')[0],
    chapters: 0,
    scripts: 0,
    images: 0,
    videos: 0
  }
  
  projects.value.unshift(project)
  closeCreateModal()
  router.push(`/projects/${project.id}`)
}

function openDeleteModal(project) {
  selectedProject.value = project
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  selectedProject.value = null
}

function deleteProject() {
  if (!selectedProject.value) return
  
  const index = projects.value.findIndex(p => p.id === selectedProject.value.id)
  if (index > -1) {
    projects.value.splice(index, 1)
  }
  
  closeDeleteModal()
}

function openProject(project) {
  router.push(`/projects/${project.id}`)
}

function getTypeLabel(type) {
  const option = typeOptions.find(t => t.value === type)
  return option ? option.label : type
}

function getTypeIcon(type) {
  const option = typeOptions.find(t => t.value === type)
  return option ? option.icon : '📁'
}

function getStatusLabel(status) {
  const option = statusOptions.find(s => s.value === status)
  return option ? option.label : status
}

function getStatusClass(status) {
  const classMap = {
    'active': 'status-active',
    'draft': 'status-draft',
    'completed': 'status-completed'
  }
  return classMap[status] || 'status-draft'
}
</script>

<template>
  <div class="projects-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="projects-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" @click="router.push('/home')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="page-title">
            <h1>项目管理</h1>
            <p>管理您的短剧漫剧创作项目</p>
          </div>
        </div>
        
        <button class="create-btn" @click="openCreateModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建项目
        </button>
      </header>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索项目..."
          />
        </div>
        
        <div class="filter-tabs">
          <button 
            v-for="option in statusOptions" 
            :key="option.value"
            class="filter-tab"
            :class="{ active: filterStatus === option.value }"
            @click="filterStatus = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Projects Grid -->
      <div class="projects-grid">
        <div 
          v-for="project in filteredProjects" 
          :key="project.id" 
          class="project-card"
          @click="openProject(project)"
        >
          <div class="card-header">
            <div class="project-type">
              <span class="type-icon">{{ getTypeIcon(project.type) }}</span>
              <span class="type-label">{{ getTypeLabel(project.type) }}</span>
            </div>
            <button class="more-btn" @click.stop="openDeleteModal(project)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="19" cy="12" r="1"/>
                <circle cx="5" cy="12" r="1"/>
              </svg>
            </button>
          </div>
          
          <div class="card-cover">
            <div class="cover-placeholder" :style="{ backgroundColor: `hsl(${(project.id * 60) % 360}, 70%, 40%)` }">
              <span>{{ project.name[0] }}</span>
            </div>
          </div>
          
          <div class="card-body">
            <h3 class="project-name">{{ project.name }}</h3>
            <p class="project-desc">{{ project.description }}</p>
            
            <div class="project-stats">
              <div class="stat">
                <span class="stat-value">{{ project.chapters }}</span>
                <span class="stat-label">章节</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ project.scripts }}</span>
                <span class="stat-label">剧本</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ project.images }}</span>
                <span class="stat-label">图片</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ project.videos }}</span>
                <span class="stat-label">视频</span>
              </div>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="progress-info">
              <span class="progress-label">进度</span>
              <span class="progress-value">{{ project.progress }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: project.progress + '%' }"></div>
            </div>
            <div class="card-meta">
              <span class="status-badge" :class="getStatusClass(project.status)">
                {{ getStatusLabel(project.status) }}
              </span>
              <span class="update-time">更新于 {{ project.updated }}</span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredProjects.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3>暂无项目</h3>
          <p>点击上方按钮创建您的第一个项目</p>
        </div>
      </div>

      <!-- Create Modal -->
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
                <label>项目名称 <span class="required">*</span></label>
                <input 
                  type="text" 
                  v-model="newProject.name" 
                  placeholder="输入项目名称"
                />
              </div>
              
              <div class="form-group">
                <label>项目类型</label>
                <div class="type-selector">
                  <button 
                    v-for="type in typeOptions" 
                    :key="type.value"
                    class="type-option"
                    :class="{ active: newProject.type === type.value }"
                    @click="newProject.type = type.value"
                  >
                    <span class="type-icon">{{ type.icon }}</span>
                    <span class="type-name">{{ type.label }}</span>
                  </button>
                </div>
              </div>
              
              <div class="form-group">
                <label>项目描述</label>
                <textarea 
                  v-model="newProject.description" 
                  placeholder="简要描述项目内容（可选）"
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="closeCreateModal">取消</button>
              <button class="btn-primary" @click="createProject" :disabled="!newProject.name.trim()">
                创建项目
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Delete Modal -->
      <Teleport to="body">
        <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
          <div class="modal-content modal-small" @click.stop>
            <div class="modal-header">
              <h3>删除项目</h3>
              <button class="modal-close" @click="closeDeleteModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="delete-warning">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p>确定要删除项目「{{ selectedProject?.name }}」吗？</p>
                <span>此操作不可恢复，所有相关数据将被永久删除。</span>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="closeDeleteModal">取消</button>
              <button class="btn-danger" @click="deleteProject">删除</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.projects-page {
  min-height: 100vh;
  background: #0a0a0f;
  color: #fff;
}

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

.projects-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.page-title h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.page-title p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}

.create-btn svg {
  width: 18px;
  height: 18px;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 20px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  width: 320px;
}

.search-box svg {
  width: 20px;
  height: 20px;
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

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tab {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.filter-tab.active {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.5);
  color: #fff;
}

/* Projects Grid */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.project-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.project-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.project-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-icon {
  font-size: 16px;
}

.type-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.more-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.more-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.more-btn svg {
  width: 18px;
  height: 18px;
}

.card-cover {
  padding: 0 20px;
}

.cover-placeholder {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 700;
  color: #fff;
}

.card-body {
  padding: 20px;
}

.project-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.project-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #6366f1;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-label,
.progress-value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.progress-value {
  color: #6366f1;
  font-weight: 600;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #a855f7);
  border-radius: 2px;
  transition: width 0.3s;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: rgba(99, 102, 241, 0.2);
  color: #6366f1;
}

.status-completed {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-draft {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.update-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-icon svg {
  width: 40px;
  height: 40px;
  color: #6366f1;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
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
  max-width: 520px;
  overflow: hidden;
}

.modal-small {
  max-width: 400px;
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

.required {
  color: #ef4444;
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

.type-selector {
  display: flex;
  gap: 12px;
}

.type-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-option:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.type-option.active {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

.type-option .type-icon {
  font-size: 24px;
}

.type-option .type-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.delete-warning {
  text-align: center;
}

.delete-warning svg {
  width: 48px;
  height: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}

.delete-warning p {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.delete-warning span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary,
.btn-primary,
.btn-danger {
  padding: 12px 24px;
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

.btn-danger {
  background: #ef4444;
  border: none;
  color: #fff;
}

.btn-danger:hover {
  background: #dc2626;
}
</style>
