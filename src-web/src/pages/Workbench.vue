<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isLoading = ref(true)
const projectId = ref(null)
const scriptId = ref(null)

// 画布状态
const canvasState = reactive({
  scale: 1,
  translateX: 0,
  translateY: 0,
  isDragging: false,
  isPanning: false,
  startX: 0,
  startY: 0,
  selectedNode: null
})

// 节点数据
const nodes = ref([
  { id: 'script-1', type: 'script', x: 100, y: 100, width: 200, height: 80, data: { title: '剧本大纲', content: '第1集剧本内容...' }, status: 'completed' },
  { id: 'character-1', type: 'character', x: 400, y: 50, width: 180, height: 120, data: { title: '主角', name: '林尘', avatar: null }, status: 'completed' },
  { id: 'storyboard-1', type: 'storyboard', x: 700, y: 100, width: 200, height: 80, data: { title: '分镜1', scene: '第1幕' }, status: 'editing' },
  { id: 'asset-1', type: 'asset', x: 400, y: 250, width: 160, height: 100, data: { title: '场景图', prompt: '古风仙侠风格' }, status: 'generating' },
  { id: 'video-1', type: 'video', x: 700, y: 280, width: 200, height: 80, data: { title: '第1集', duration: '5:00' }, status: 'pending' }
])

// 连接边
const edges = ref([
  { id: 'e1-2', source: 'script-1', target: 'character-1', sourceHandle: 'right', targetHandle: 'left' },
  { id: 'e1-3', source: 'script-1', target: 'storyboard-1', sourceHandle: 'right', targetHandle: 'left' },
  { id: 'e2-4', source: 'character-1', target: 'asset-1', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e3-5', source: 'storyboard-1', target: 'video-1', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'e4-5', source: 'asset-1', target: 'video-1', sourceHandle: 'right', targetHandle: 'left' }
])

// 拖拽状态
const dragState = reactive({
  node: null,
  offsetX: 0,
  offsetY: 0
})

// 连接状态
const connectionState = reactive({
  active: false,
  sourceNode: null,
  tempX: 0,
  tempY: 0
})

// 节点类型配置
const nodeTypes = {
  script: { label: '剧本', icon: 'document', color: '#6366f1' },
  character: { label: '角色', icon: 'user', color: '#ec4899' },
  storyboard: { label: '分镜', icon: 'grid', color: '#06b6d4' },
  asset: { label: '素材', icon: 'image', color: '#f59e0b' },
  video: { label: '视频', icon: 'video', color: '#10b981' }
}

// 添加节点
const showAddMenu = ref(false)
const addMenuPosition = reactive({ x: 0, y: 0 })

function openAddMenu(e) {
  const canvas = document.querySelector('.canvas-content')
  const rect = canvas.getBoundingClientRect()
  addMenuPosition.x = (e.clientX - rect.left - canvasState.translateX) / canvasState.scale
  addMenuPosition.y = (e.clientY - rect.top - canvasState.translateY) / canvasState.scale
  showAddMenu.value = true
}

function addNode(type) {
  const config = nodeTypes[type]
  const newNode = {
    id: `${type}-${Date.now()}`,
    type,
    x: addMenuPosition.x,
    y: addMenuPosition.y,
    width: 180,
    height: type === 'character' ? 120 : 80,
    data: {
      title: `新建${config.label}`,
      content: '',
      name: type === 'character' ? '' : undefined,
      avatar: null,
      prompt: type === 'asset' ? '' : undefined,
      duration: type === 'video' ? '0:00' : undefined
    },
    status: 'draft'
  }
  nodes.value.push(newNode)
  showAddMenu.value = false
  saveFlowData()
}

function closeAddMenu() {
  showAddMenu.value = false
}

// 节点拖拽
function startDrag(e, node) {
  if (e.target.closest('.node-handle')) return
  e.stopPropagation()
  dragState.node = node
  dragState.offsetX = e.clientX - node.x * canvasState.scale - canvasState.translateX
  dragState.offsetY = e.clientY - node.y * canvasState.scale - canvasState.translateY
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (!dragState.node) return
  const canvas = document.querySelector('.canvas-content')
  const rect = canvas.getBoundingClientRect()
  dragState.node.x = (e.clientX - rect.left - dragState.offsetX) / canvasState.scale
  dragState.node.y = (e.clientY - rect.top - dragState.offsetY) / canvasState.scale
}

function stopDrag() {
  dragState.node = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  saveFlowData()
}

// 画布缩放
function handleWheel(e) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(0.25, Math.min(2, canvasState.scale + delta))
  
  const canvas = document.querySelector('.canvas-content')
  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  canvasState.translateX = mouseX - (mouseX - canvasState.translateX) * (newScale / canvasState.scale)
  canvasState.translateY = mouseY - (mouseY - canvasState.translateY) * (newScale / canvasState.scale)
  canvasState.scale = newScale
}

// 画布拖拽
function startPan(e) {
  if (e.target.closest('.node')) return
  canvasState.isPanning = true
  canvasState.startX = e.clientX - canvasState.translateX
  canvasState.startY = e.clientY - canvasState.translateY
  document.addEventListener('mousemove', onPan)
  document.addEventListener('mouseup', stopPan)
}

function onPan(e) {
  canvasState.translateX = e.clientX - canvasState.startX
  canvasState.translateY = e.clientY - canvasState.startY
}

function stopPan() {
  canvasState.isPanning = false
  document.removeEventListener('mousemove', onPan)
  document.removeEventListener('mouseup', stopPan)
}

// 连接线
function startConnection(e, nodeId, handle) {
  e.stopPropagation()
  connectionState.active = true
  connectionState.sourceNode = { id: nodeId, handle }
  const canvas = document.querySelector('.canvas-content')
  const rect = canvas.getBoundingClientRect()
  connectionState.tempX = (e.clientX - rect.left) / canvasState.scale
  connectionState.tempY = (e.clientY - rect.top) / canvasState.scale
  document.addEventListener('mousemove', onConnection)
  document.addEventListener('mouseup', stopConnection)
}

function onConnection(e) {
  const canvas = document.querySelector('.canvas-content')
  const rect = canvas.getBoundingClientRect()
  connectionState.tempX = (e.clientX - rect.left) / canvasState.scale
  connectionState.tempY = (e.clientY - rect.top) / canvasState.scale
}

function stopConnection(e, targetNodeId) {
  if (connectionState.active && targetNodeId && targetNodeId !== connectionState.sourceNode.id) {
    const newEdge = {
      id: `e-${Date.now()}`,
      source: connectionState.sourceNode.id,
      target: targetNodeId,
      sourceHandle: connectionState.sourceNode.handle,
      targetHandle: 'left'
    }
    // 检查是否已存在
    const exists = edges.value.find(e => e.source === newEdge.source && e.target === newEdge.target)
    if (!exists) {
      edges.value.push(newEdge)
      saveFlowData()
    }
  }
  connectionState.active = false
  connectionState.sourceNode = null
  document.removeEventListener('mousemove', onConnection)
  document.removeEventListener('mouseup', stopConnection)
}

// 删除节点/边
function deleteNode(nodeId) {
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
  saveFlowData()
}

function deleteEdge(edgeId) {
  edges.value = edges.value.filter(e => e.id !== edgeId)
  saveFlowData()
}

// 获取节点位置（用于连接线）
function getNodePosition(nodeId, handle) {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) return { x: 0, y: 0 }
  
  switch (handle) {
    case 'right': return { x: node.x + node.width, y: node.y + node.height / 2 }
    case 'left': return { x: node.x, y: node.y + node.height / 2 }
    case 'top': return { x: node.x + node.width / 2, y: node.y }
    case 'bottom': return { x: node.x + node.width / 2, y: node.y + node.height }
    default: return { x: node.x + node.width, y: node.y + node.height / 2 }
  }
}

// 获取连接线路径
function getEdgePath(edge) {
  const source = getNodePosition(edge.source, edge.sourceHandle)
  const target = getNodePosition(edge.target, edge.targetHandle)
  
  const midX = (source.x + target.x) / 2
  const dx = target.x - source.x
  const controlOffset = Math.min(Math.abs(dx) / 2, 50)
  
  return `M ${source.x} ${source.y} C ${source.x + controlOffset} ${source.y}, ${target.x - controlOffset} ${target.y}, ${target.x} ${target.y}`
}

// 保存数据
async function saveFlowData() {
  try {
    const token = authStore.token
    await fetch('/api/production/saveFlowData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        projectId: projectId.value,
        episodesId: scriptId.value,
        data: {
          nodes: nodes.value,
          edges: edges.value,
          viewport: { x: canvasState.translateX, y: canvasState.translateY, scale: canvasState.scale }
        }
      })
    })
  } catch (err) {
    console.error('保存失败:', err)
  }
}

// 加载数据
async function loadFlowData() {
  try {
    const token = authStore.token
    const response = await fetch('/api/production/getFlowData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        projectId: projectId.value,
        episodesId: scriptId.value
      })
    })
    const result = await response.json()
    if (result.code === 200 && result.data) {
      if (result.data.nodes) nodes.value = result.data.nodes
      if (result.data.edges) edges.value = result.data.edges
      if (result.data.viewport) {
        canvasState.translateX = result.data.viewport.x || 0
        canvasState.translateY = result.data.viewport.y || 0
        canvasState.scale = result.data.viewport.scale || 1
      }
    }
  } catch (err) {
    console.error('加载失败:', err)
  }
}

// 重置视图
function resetView() {
  canvasState.scale = 1
  canvasState.translateX = 0
  canvasState.translateY = 0
}

// 缩放控制
function zoomIn() {
  canvasState.scale = Math.min(2, canvasState.scale + 0.1)
}

function zoomOut() {
  canvasState.scale = Math.max(0.25, canvasState.scale - 0.1)
}

onMounted(async () => {
  try {
    if (!authStore.token) {
      router.push('/login')
      return
    }
    
    projectId.value = parseInt(route.params.projectId) || 1
    scriptId.value = parseInt(route.params.scriptId) || 1
    
    await loadFlowData()
  } catch (err) {
    console.error('初始化失败:', err)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', onPan)
  document.removeEventListener('mouseup', stopPan)
  document.removeEventListener('mousemove', onConnection)
  document.removeEventListener('mouseup', stopConnection)
})
</script>

<template>
  <div class="workbench-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="workbench-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" @click="router.push('/projects')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="page-title">
            <h1>无限画布工作台</h1>
            <p>策划 → 编剧 → 分镜 → 出片</p>
          </div>
        </div>
        
        <div class="header-actions">
          <button class="action-btn" @click="resetView">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            重置视图
          </button>
          <button class="action-btn" @click="zoomOut">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <span class="zoom-level">{{ Math.round(canvasState.scale * 100) }}%</span>
          <button class="action-btn" @click="zoomIn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Canvas Area -->
      <div class="canvas-wrapper">
        <!-- Grid Background -->
        <div class="canvas-grid"></div>
        
        <!-- Canvas Content -->
        <div 
          class="canvas-content"
          :style="{
            transform: `translate(${canvasState.translateX}px, ${canvasState.translateY}px) scale(${canvasState.scale})`,
            transformOrigin: '0 0'
          }"
          @mousedown="startPan"
          @wheel.prevent="handleWheel"
          @dblclick="openAddMenu"
        >
          <!-- Edges (SVG Layer) -->
          <svg class="edges-layer">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1"/>
              </marker>
            </defs>
            
            <!-- Existing edges -->
            <path 
              v-for="edge in edges" 
              :key="edge.id"
              :d="getEdgePath(edge)"
              class="edge-path"
              marker-end="url(#arrowhead)"
              @click.stop="deleteEdge(edge.id)"
            />
            
            <!-- Temporary connection line -->
            <path 
              v-if="connectionState.active && connectionState.sourceNode"
              :d="`M ${getNodePosition(connectionState.sourceNode.id, connectionState.sourceNode.handle).x} ${getNodePosition(connectionState.sourceNode.id, connectionState.sourceNode.handle).y} L ${connectionState.tempX} ${connectionState.tempY}`"
              class="edge-path temp"
            />
          </svg>
          
          <!-- Nodes -->
          <div 
            v-for="node in nodes" 
            :key="node.id"
            class="node"
            :class="[node.type, node.status, { selected: canvasState.selectedNode === node.id }]"
            :style="{
              left: node.x + 'px',
              top: node.y + 'px',
              width: node.width + 'px',
              height: node.height + 'px',
              borderColor: nodeTypes[node.type]?.color
            }"
            @mousedown="startDrag($event, node)"
            @click.stop="canvasState.selectedNode = node.id"
          >
            <!-- Node Header -->
            <div class="node-header" :style="{ backgroundColor: nodeTypes[node.type]?.color }">
              <span class="node-type">{{ nodeTypes[node.type]?.label }}</span>
              <button class="node-delete" @click.stop="deleteNode(node.id)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <!-- Node Content -->
            <div class="node-content">
              <h4 class="node-title">{{ node.data.title }}</h4>
              <p class="node-desc" v-if="node.data.name">角色: {{ node.data.name }}</p>
              <p class="node-desc" v-if="node.data.duration">时长: {{ node.data.duration }}</p>
              <p class="node-status" :class="node.status">{{ 
                node.status === 'completed' ? '已完成' : 
                node.status === 'generating' ? '生成中' :
                node.status === 'editing' ? '编辑中' : '待处理'
              }}</p>
            </div>
            
            <!-- Connection Handles -->
            <div class="node-handle left" @mousedown.stop="startConnection($event, node.id, 'left')"></div>
            <div class="node-handle right" @mousedown.stop="startConnection($event, node.id, 'right')"></div>
            <div class="node-handle top" @mouseup="(e) => stopConnection(e, node.id)"></div>
            <div class="node-handle bottom" @mouseup="(e) => stopConnection(e, node.id)"></div>
          </div>
        </div>
        
        <!-- Add Node Menu -->
        <Transition name="menu">
          <div 
            v-if="showAddMenu" 
            class="add-menu"
            :style="{ left: addMenuPosition.x * canvasState.scale + canvasState.translateX + 'px', top: addMenuPosition.y * canvasState.scale + canvasState.translateY + 'px' }"
            @click.stop
          >
            <button class="add-menu-item" @click="addNode('script')">
              <span class="menu-icon" style="background: rgba(99, 102, 241, 0.2); color: #6366f1;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </span>
              <span>剧本节点</span>
            </button>
            <button class="add-menu-item" @click="addNode('character')">
              <span class="menu-icon" style="background: rgba(236, 72, 153, 0.2); color: #ec4899;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <span>角色节点</span>
            </button>
            <button class="add-menu-item" @click="addNode('storyboard')">
              <span class="menu-icon" style="background: rgba(6, 182, 212, 0.2); color: #06b6d4;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
              </span>
              <span>分镜节点</span>
            </button>
            <button class="add-menu-item" @click="addNode('asset')">
              <span class="menu-icon" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </span>
              <span>素材节点</span>
            </button>
            <button class="add-menu-item" @click="addNode('video')">
              <span class="menu-icon" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </span>
              <span>视频节点</span>
            </button>
            <button class="add-menu-close" @click="closeAddMenu">取消</button>
          </div>
        </Transition>
        
        <!-- Overlay for closing menu -->
        <div v-if="showAddMenu" class="menu-overlay" @click="closeAddMenu"></div>
      </div>
      
      <!-- Minimap -->
      <div class="minimap">
        <div class="minimap-viewport" :style="{
          left: (-canvasState.translateX / 20) + 'px',
          top: (-canvasState.translateY / 20) + 'px',
          width: (100 / canvasState.scale) + 'px',
          height: (60 / canvasState.scale) + 'px'
        }"></div>
        <div 
          v-for="node in nodes" 
          :key="node.id"
          class="minimap-node"
          :style="{
            left: (node.x / 20) + 'px',
            top: (node.y / 20) + 'px',
            width: (node.width / 20) + 'px',
            height: (node.height / 20) + 'px',
            backgroundColor: nodeTypes[node.type]?.color
          }"
        ></div>
      </div>
      
      <!-- Instructions -->
      <div class="instructions">
        <span>双击画布添加节点</span>
        <span>拖拽节点移动</span>
        <span>按住节点边缘创建连接</span>
        <span>滚轮缩放</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workbench-page {
  min-height: 100vh;
  background: #0a0a0f;
  color: #fff;
  overflow: hidden;
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

.workbench-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(20, 20, 30, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
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
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 2px;
}

.page-title p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.zoom-level {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 48px;
  text-align: center;
}

/* Canvas */
.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;
}

.canvas-wrapper:active {
  cursor: grabbing;
}

.canvas-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

.canvas-content {
  position: absolute;
  width: 100%;
  height: 100%;
  will-change: transform;
}

/* Edges Layer */
.edges-layer {
  position: absolute;
  width: 10000px;
  height: 10000px;
  pointer-events: none;
  overflow: visible;
}

.edge-path {
  fill: none;
  stroke: #6366f1;
  stroke-width: 2;
  pointer-events: stroke;
  cursor: pointer;
  transition: stroke 0.2s;
}

.edge-path:hover {
  stroke: #a855f7;
  stroke-width: 3;
}

.edge-path.temp {
  stroke-dasharray: 5, 5;
  opacity: 0.7;
}

/* Nodes */
.node {
  position: absolute;
  background: rgba(26, 26, 46, 0.95);
  border: 2px solid;
  border-radius: 12px;
  cursor: move;
  transition: box-shadow 0.2s, transform 0.1s;
  overflow: hidden;
}

.node:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.node.selected {
  box-shadow: 0 0 0 2px #fff, 0 8px 32px rgba(0, 0, 0, 0.4);
}

.node.draft {
  opacity: 0.7;
}

.node.generating .node-content::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  color: #fff;
}

.node-type {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.node-delete {
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.2);
  border: none;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
}

.node:hover .node-delete {
  opacity: 1;
}

.node-delete:hover {
  background: rgba(239, 68, 68, 0.8);
  color: #fff;
}

.node-delete svg {
  width: 12px;
  height: 12px;
}

.node-content {
  padding: 12px;
  position: relative;
}

.node-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
}

.node-status {
  font-size: 11px;
  font-weight: 500;
  margin-top: 8px;
}

.node-status.completed { color: #10b981; }
.node-status.generating { color: #f59e0b; }
.node-status.editing { color: #6366f1; }
.node-status.pending { color: rgba(255, 255, 255, 0.4); }

/* Node Handles */
.node-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  border: 2px solid #6366f1;
  border-radius: 50%;
  cursor: crosshair;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 10;
}

.node:hover .node-handle {
  opacity: 1;
}

.node-handle:hover {
  transform: scale(1.3);
  background: #6366f1;
}

.node-handle.left { left: -6px; top: 50%; transform: translateY(-50%); }
.node-handle.right { right: -6px; top: 50%; transform: translateY(-50%); }
.node-handle.top { top: -6px; left: 50%; transform: translateX(-50%); }
.node-handle.bottom { bottom: -6px; left: 50%; transform: translateX(-50%); }

.node-handle.left:hover, .node-handle.right:hover {
  transform: translateY(-50%) scale(1.3);
}

/* Add Menu */
.add-menu {
  position: absolute;
  background: rgba(26, 26, 46, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px;
  z-index: 1000;
  min-width: 180px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.add-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
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

.add-menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.menu-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-icon svg {
  width: 18px;
  height: 18px;
}

.add-menu-close {
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-menu-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.menu-overlay {
  position: absolute;
  inset: 0;
  z-index: 999;
}

.menu-enter-active,
.menu-leave-active {
  transition: all 0.2s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Minimap */
.minimap {
  position: absolute;
  right: 20px;
  bottom: 60px;
  width: 160px;
  height: 100px;
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  pointer-events: none;
}

.minimap-viewport {
  position: absolute;
  border: 2px solid #6366f1;
  border-radius: 2px;
  pointer-events: none;
}

.minimap-node {
  position: absolute;
  border-radius: 2px;
  opacity: 0.8;
}

/* Instructions */
.instructions {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 24px;
  padding: 10px 20px;
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.instructions span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
