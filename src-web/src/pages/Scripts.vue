<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const searchQuery = ref('')
const filterProject = ref('all')
const selectedScript = ref(null)
const showPreviewModal = ref(false)

// 模拟剧本数据
const scripts = ref([
  { 
    id: 1, 
    title: '第一集：意外相遇', 
    projectId: 1,
    projectName: '霸道总裁爱上我',
    episode: 1,
    scenes: 12,
    duration: '5:30',
    status: 'completed',
    createdAt: '2024-03-05',
    summary: '女主苏晚在咖啡厅不小心撞到了男主陆景琛，两人第一次相遇。',
    characters: ['苏晚', '陆景琛']
  },
  { 
    id: 2, 
    title: '第二集：契约签订', 
    projectId: 1,
    projectName: '霸道总裁爱上我',
    episode: 2,
    scenes: 15,
    duration: '7:00',
    status: 'completed',
    createdAt: '2024-03-06',
    summary: '陆景琛提出契约婚姻，苏晚被迫答应。',
    characters: ['苏晚', '陆景琛', '陆母']
  },
  { 
    id: 3, 
    title: '第三集：新婚生活', 
    projectId: 1,
    projectName: '霸道总裁爱上我',
    episode: 3,
    scenes: 10,
    duration: '4:45',
    status: 'editing',
    createdAt: '2024-03-10',
    summary: '苏晚搬入陆家，开始了与陆景琛的同居生活。',
    characters: ['苏晚', '陆景琛']
  },
  { 
    id: 4, 
    title: '第一集：天赋觉醒', 
    projectId: 2,
    projectName: '修仙世界',
    episode: 1,
    scenes: 20,
    duration: '8:00',
    status: 'completed',
    createdAt: '2024-02-20',
    summary: '普通少年林尘意外获得上古传承，开始修仙之路。',
    characters: ['林尘', '神秘老者']
  },
  { 
    id: 5, 
    title: '第二集：宗门考核', 
    projectId: 2,
    projectName: '修仙世界',
    episode: 2,
    scenes: 18,
    duration: '7:30',
    status: 'completed',
    createdAt: '2024-02-22',
    summary: '林尘参加青云宗入门考核，展现惊人天赋。',
    characters: ['林尘', '考核长老', '其他弟子']
  },
  { 
    id: 6, 
    title: '第一集：宫廷选秀', 
    projectId: 4,
    projectName: '穿越古代',
    episode: 1,
    scenes: 14,
    duration: '6:15',
    status: 'draft',
    createdAt: '2024-03-01',
    summary: '现代设计师沈若意外穿越到古代，被迫参加宫廷选秀。',
    characters: ['沈若', '皇帝', '皇后']
  }
])

const filteredScripts = computed(() => {
  let result = scripts.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s => 
      s.title.toLowerCase().includes(query) || 
      s.summary.toLowerCase().includes(query) ||
      s.projectName.toLowerCase().includes(query)
    )
  }
  
  if (filterProject.value !== 'all') {
    result = result.filter(s => s.projectId === parseInt(filterProject.value))
  }
  
  return result
})

const projects = computed(() => {
  const uniqueProjects = [...new Set(scripts.value.map(s => s.projectId))]
  return uniqueProjects.map(id => {
    const script = scripts.value.find(s => s.projectId === id)
    return { id, name: script.projectName }
  })
})

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'editing', label: '编辑中' },
  { value: 'completed', label: '已完成' }
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

function previewScript(script) {
  selectedScript.value = script
  showPreviewModal.value = true
}

function closePreviewModal() {
  showPreviewModal.value = false
  selectedScript.value = null
}

function getStatusLabel(status) {
  const option = statusOptions.find(s => s.value === status)
  return option ? option.label : status
}

function getStatusClass(status) {
  const classMap = {
    'completed': 'status-completed',
    'editing': 'status-editing',
    'draft': 'status-draft'
  }
  return classMap[status] || 'status-draft'
}

function formatDuration(duration) {
  return duration
}
</script>

<template>
  <div class="scripts-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="scripts-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" @click="router.push('/home')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="page-title">
            <h1>剧本管理</h1>
            <p>管理和编辑 AI 改编的剧本</p>
          </div>
        </div>
        
        <button class="create-btn" @click="router.push('/novels')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
          </svg>
          AI 改编小说
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
            placeholder="搜索剧本..."
          />
        </div>
        
        <div class="filter-group">
          <label>项目筛选</label>
          <select v-model="filterProject">
            <option value="all">全部项目</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Scripts List -->
      <div class="scripts-list">
        <div 
          v-for="script in filteredScripts" 
          :key="script.id" 
          class="script-card"
          @click="previewScript(script)"
        >
          <div class="script-number">
            <span class="episode">第{{ script.episode }}集</span>
          </div>
          
          <div class="script-content">
            <div class="script-header">
              <h3 class="script-title">{{ script.title }}</h3>
              <span class="status-badge" :class="getStatusClass(script.status)">
                {{ getStatusLabel(script.status) }}
              </span>
            </div>
            
            <p class="script-summary">{{ script.summary }}</p>
            
            <div class="script-meta">
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
                <span>{{ script.scenes }} 场景</span>
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>{{ script.duration }}</span>
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{{ script.characters.slice(0, 2).join('、') }}<template v-if="script.characters.length > 2">等</template></span>
              </div>
            </div>
          </div>
          
          <div class="script-actions">
            <button class="action-btn" @click.stop="router.push('/storyboard')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              分镜
            </button>
            <button class="action-btn primary" @click.stop="router.push('/images')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              生图
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredScripts.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <h3>暂无剧本</h3>
          <p>先去小说管理中导入并改编小说</p>
          <button class="empty-action" @click="router.push('/novels')">
            前往小说管理
          </button>
        </div>
      </div>

      <!-- Preview Modal -->
      <Teleport to="body">
        <div v-if="showPreviewModal" class="modal-overlay" @click="closePreviewModal">
          <div class="modal-content modal-large" @click.stop>
            <div class="modal-header">
              <div class="header-info">
                <span class="episode-badge">第{{ selectedScript?.episode }}集</span>
                <h3>{{ selectedScript?.title }}</h3>
              </div>
              <button class="modal-close" @click="closePreviewModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="script-detail">
                <div class="detail-row">
                  <div class="detail-item">
                    <span class="detail-label">所属项目</span>
                    <span class="detail-value">{{ selectedScript?.projectName }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">场景数</span>
                    <span class="detail-value">{{ selectedScript?.scenes }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">时长</span>
                    <span class="detail-value">{{ selectedScript?.duration }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">创建日期</span>
                    <span class="detail-value">{{ selectedScript?.createdAt }}</span>
                  </div>
                </div>
                
                <div class="detail-section">
                  <span class="detail-label">剧情简介</span>
                  <p class="detail-text">{{ selectedScript?.summary }}</p>
                </div>
                
                <div class="detail-section">
                  <span class="detail-label">出场人物</span>
                  <div class="character-tags">
                    <span v-for="char in selectedScript?.characters" :key="char" class="character-tag">
                      {{ char }}
                    </span>
                  </div>
                </div>
                
                <div class="detail-section">
                  <span class="detail-label">场景预览</span>
                  <div class="scenes-preview">
                    <div v-for="i in Math.min(selectedScript?.scenes || 0, 6)" :key="i" class="scene-item">
                      <div class="scene-number">{{ i }}</div>
                      <div class="scene-content">
                        <span class="scene-title">场景 {{ i }}</span>
                        <span class="scene-type">内/外景</span>
                      </div>
                    </div>
                    <div v-if="(selectedScript?.scenes || 0) > 6" class="scene-more">
                      +{{ (selectedScript?.scenes || 0) - 6 }} 个场景
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="closePreviewModal">关闭</button>
              <button class="btn-primary" @click="router.push('/storyboard'); closePreviewModal()">
                编辑分镜
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.scripts-page {
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

.scripts-container {
  max-width: 1200px;
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
  gap: 20px;
  margin-bottom: 24px;
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

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-group label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.filter-group select {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  outline: none;
  cursor: pointer;
}

.filter-group select option {
  background: #1a1a2e;
}

/* Scripts List */
.scripts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.script-card {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.script-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(99, 102, 241, 0.3);
}

.script-number {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
}

.episode {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.script-content {
  flex: 1;
  min-width: 0;
}

.script-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.script-title {
  font-size: 18px;
  font-weight: 600;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-completed {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-editing {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.status-draft {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.script-summary {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.script-meta {
  display: flex;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

.script-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.action-btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  color: #fff;
}

.action-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

/* Empty State */
.empty-state {
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
  margin-bottom: 20px;
}

.empty-action {
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
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
  max-width: 720px;
  overflow: hidden;
}

.modal-large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.episode-badge {
  padding: 6px 12px;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
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
  max-height: 60vh;
  overflow-y: auto;
}

.script-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.character-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.character-tag {
  padding: 6px 12px;
  background: rgba(99, 102, 241, 0.15);
  border-radius: 8px;
  font-size: 13px;
  color: #a855f7;
}

.scenes-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.scene-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.scene-number {
  width: 32px;
  height: 32px;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #6366f1;
}

.scene-content {
  display: flex;
  flex-direction: column;
}

.scene-title {
  font-size: 13px;
  font-weight: 500;
}

.scene-type {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.scene-more {
  grid-column: 1 / -1;
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
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
.btn-primary {
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

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}
</style>
