<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const showImportModal = ref(false)
const showPreviewModal = ref(false)
const selectedNovel = ref(null)
const searchQuery = ref('')
const filterStatus = ref('all')
const importMode = ref('text')
const newNovel = ref({
  title: '',
  author: '',
  content: ''
})

// 模拟小说数据
const novels = ref([
  { 
    id: 1, 
    title: '霸道总裁的契约娇妻', 
    author: '都市言情',
    status: 'imported', 
    chapters: 50,
    words: 128000,
    importedAt: '2024-03-01',
    projectId: 1,
    projectName: '霸道总裁爱上我',
    summary: '一场意外，她与他签订契约婚姻。从互相试探到真心相爱，经历重重考验后终成眷属。'
  },
  { 
    id: 2, 
    title: '仙逆之途', 
    author: '玄幻修仙',
    status: 'imported', 
    chapters: 120,
    words: 385000,
    importedAt: '2024-02-15',
    projectId: 2,
    projectName: '修仙世界',
    summary: '平凡少年逆天改命，以凡人之躯对抗仙魔两界，最终成就无上大道。'
  },
  { 
    id: 3, 
    title: '都市异能觉醒', 
    author: '都市异能',
    status: 'importing', 
    chapters: 0,
    words: 0,
    importedAt: '2024-03-10',
    projectId: 3,
    projectName: '都市异能',
    summary: '普通白领意外觉醒异能，在都市中展开一段惊心动魄的冒险之旅。'
  },
  { 
    id: 4, 
    title: '穿越之凤谋天下', 
    author: '古风穿越',
    status: 'imported', 
    chapters: 80,
    words: 220000,
    importedAt: '2024-02-28',
    projectId: 4,
    projectName: '穿越古代',
    summary: '现代女设计师穿越到古代，凭借聪明才智在宫廷斗争中站稳脚跟。'
  }
])

const filteredNovels = computed(() => {
  let result = novels.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(n => 
      n.title.toLowerCase().includes(query) || 
      n.author.toLowerCase().includes(query) ||
      n.summary.toLowerCase().includes(query)
    )
  }
  
  if (filterStatus.value !== 'all') {
    result = result.filter(n => n.status === filterStatus.value)
  }
  
  return result
})

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'imported', label: '已导入' },
  { value: 'importing', label: '导入中' },
  { value: 'draft', label: '草稿' }
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

function openImportModal() {
  newNovel.value = { title: '', author: '', content: '' }
  showImportModal.value = true
}

function closeImportModal() {
  showImportModal.value = false
}

function importNovel() {
  if (!newNovel.value.title.trim()) return
  
  const novel = {
    id: Date.now(),
    title: newNovel.value.title,
    author: newNovel.value.author || '未知作者',
    status: 'importing',
    chapters: 0,
    words: newNovel.value.content.length,
    importedAt: new Date().toISOString().split('T')[0],
    projectId: null,
    projectName: '未关联',
    summary: newNovel.value.content.slice(0, 100) + '...'
  }
  
  novels.value.unshift(novel)
  closeImportModal()
  
  // 模拟导入完成
  setTimeout(() => {
    novel.status = 'imported'
    novel.chapters = Math.floor(novel.words / 3000)
  }, 2000)
}

function previewNovel(novel) {
  selectedNovel.value = novel
  showPreviewModal.value = true
}

function closePreviewModal() {
  showPreviewModal.value = false
  selectedNovel.value = null
}

function formatWords(words) {
  if (words >= 10000) {
    return (words / 10000).toFixed(1) + '万'
  }
  return words.toString()
}

function getStatusLabel(status) {
  const option = statusOptions.find(s => s.value === status)
  return option ? option.label : status
}

function getStatusClass(status) {
  const classMap = {
    'imported': 'status-imported',
    'importing': 'status-importing',
    'draft': 'status-draft'
  }
  return classMap[status] || 'status-draft'
}
</script>

<template>
  <div class="novels-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="novels-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" @click="router.push('/home')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="page-title">
            <h1>小说管理</h1>
            <p>导入和管理您的原创小说</p>
          </div>
        </div>
        
        <button class="create-btn" @click="openImportModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          导入小说
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
            placeholder="搜索小说..."
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

      <!-- Novels List -->
      <div class="novels-list">
        <div 
          v-for="novel in filteredNovels" 
          :key="novel.id" 
          class="novel-card"
          @click="previewNovel(novel)"
        >
          <div class="novel-cover">
            <div class="cover-placeholder" :style="{ backgroundColor: `hsl(${(novel.id * 80) % 360}, 70%, 40%)` }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
          </div>
          
          <div class="novel-content">
            <div class="novel-header">
              <h3 class="novel-title">{{ novel.title }}</h3>
              <span class="status-badge" :class="getStatusClass(novel.status)">
                {{ novel.status === 'importing' ? '导入中...' : getStatusLabel(novel.status) }}
              </span>
            </div>
            
            <p class="novel-author">{{ novel.author }}</p>
            <p class="novel-summary">{{ novel.summary }}</p>
            
            <div class="novel-meta">
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <span>{{ novel.chapters }} 章</span>
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span>{{ formatWords(novel.words) }} 字</span>
              </div>
              <div class="meta-item" v-if="novel.projectName">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span>{{ novel.projectName }}</span>
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{{ novel.importedAt }}</span>
              </div>
            </div>
          </div>
          
          <div class="novel-actions">
            <button class="action-btn primary" v-if="novel.status === 'imported'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
              </svg>
              AI 改编
            </button>
            <button class="action-btn" v-else-if="novel.status === 'importing'">
              <span class="spinner"></span>
              处理中
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredNovels.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <h3>暂无小说</h3>
          <p>点击上方按钮导入您的第一本小说</p>
        </div>
      </div>

      <!-- Import Modal -->
      <Teleport to="body">
        <div v-if="showImportModal" class="modal-overlay" @click="closeImportModal">
          <div class="modal-content modal-large" @click.stop>
            <div class="modal-header">
              <h3>导入小说</h3>
              <div class="import-tabs">
                <button 
                  class="import-tab"
                  :class="{ active: importMode === 'text' }"
                  @click="importMode = 'text'"
                >
                  文本输入
                </button>
                <button 
                  class="import-tab"
                  :class="{ active: importMode === 'file' }"
                  @click="importMode = 'file'"
                >
                  文件上传
                </button>
              </div>
              <button class="modal-close" @click="closeImportModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div v-if="importMode === 'text'">
                <div class="form-group">
                  <label>小说标题 <span class="required">*</span></label>
                  <input 
                    type="text" 
                    v-model="newNovel.title" 
                    placeholder="输入小说标题"
                  />
                </div>
                
                <div class="form-group">
                  <label>作者/分类</label>
                  <input 
                    type="text" 
                    v-model="newNovel.author" 
                    placeholder="输入作者名或分类"
                  />
                </div>
                
                <div class="form-group">
                  <label>小说内容</label>
                  <textarea 
                    v-model="newNovel.content" 
                    placeholder="粘贴小说内容..."
                    rows="12"
                  ></textarea>
                </div>
              </div>
              
              <div v-else class="file-upload-area">
                <div class="upload-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p class="upload-text">拖拽文件到此处，或点击选择文件</p>
                <span class="upload-hint">支持 .txt, .doc, .docx, .epub 格式</span>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="closeImportModal">取消</button>
              <button class="btn-primary" @click="importNovel" :disabled="!newNovel.title.trim()">
                开始导入
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Preview Modal -->
      <Teleport to="body">
        <div v-if="showPreviewModal" class="modal-overlay" @click="closePreviewModal">
          <div class="modal-content modal-large" @click.stop>
            <div class="modal-header">
              <h3>{{ selectedNovel?.title }}</h3>
              <button class="modal-close" @click="closePreviewModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body preview-body">
              <div class="preview-cover">
                <div class="cover-placeholder large" :style="{ backgroundColor: `hsl(${(selectedNovel?.id * 80) % 360}, 70%, 40%)` }">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
              </div>
              
              <div class="preview-info">
                <div class="info-row">
                  <span class="info-label">作者/分类</span>
                  <span class="info-value">{{ selectedNovel?.author }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">字数</span>
                  <span class="info-value">{{ formatWords(selectedNovel?.words || 0) }} 字</span>
                </div>
                <div class="info-row">
                  <span class="info-label">章节</span>
                  <span class="info-value">{{ selectedNovel?.chapters }} 章</span>
                </div>
                <div class="info-row">
                  <span class="info-label">导入日期</span>
                  <span class="info-value">{{ selectedNovel?.importedAt }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">关联项目</span>
                  <span class="info-value">{{ selectedNovel?.projectName }}</span>
                </div>
                
                <div class="info-section">
                  <span class="info-label">简介</span>
                  <p class="info-text">{{ selectedNovel?.summary }}</p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="closePreviewModal">关闭</button>
              <button class="btn-primary" @click="router.push('/scripts'); closePreviewModal()">
                查看剧本
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.novels-page {
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

.novels-container {
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

/* Novels List */
.novels-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.novel-card {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.novel-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(99, 102, 241, 0.3);
}

.novel-cover {
  flex-shrink: 0;
}

.cover-placeholder {
  width: 80px;
  height: 110px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.2);
}

.cover-placeholder svg {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.5);
}

.cover-placeholder.large {
  width: 120px;
  height: 170px;
}

.cover-placeholder.large svg {
  width: 48px;
  height: 48px;
}

.novel-content {
  flex: 1;
  min-width: 0;
}

.novel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.novel-title {
  font-size: 18px;
  font-weight: 600;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-imported {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-importing {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.status-draft {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.novel-author {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.novel-summary {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.novel-meta {
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

.novel-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
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

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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

.modal-large {
  max-width: 640px;
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

.import-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: 8px;
  margin-right: auto;
  margin-left: 20px;
}

.import-tab {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.import-tab.active {
  background: rgba(99, 102, 241, 0.3);
  color: #fff;
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

.preview-body {
  display: flex;
  gap: 24px;
}

.preview-cover {
  flex-shrink: 0;
}

.preview-info {
  flex: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.info-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.info-value {
  font-size: 14px;
  font-weight: 500;
}

.info-section {
  margin-top: 16px;
}

.info-section .info-label {
  display: block;
  margin-bottom: 8px;
}

.info-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
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
  min-height: 120px;
}

.file-upload-area {
  padding: 48px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.file-upload-area:hover {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(99, 102, 241, 0.05);
}

.upload-icon {
  width: 64px;
  height: 64px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.upload-icon svg {
  width: 32px;
  height: 32px;
  color: #6366f1;
}

.upload-text {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
