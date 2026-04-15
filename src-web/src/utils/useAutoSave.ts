/**
 * 自动保存 Hook
 * 支持智能防抖、状态追踪、本地备份
 */
import { ref, computed, watch, onUnmounted } from 'vue'

export interface AutoSaveOptions {
  /** 延迟时间(ms) */
  delay?: number
  /** 最大备份数 */
  maxBackups?: number
  /** 是否启用本地备份 */
  enableLocalBackup?: boolean
  /** 存储键名 */
  storageKey?: string
  /** 保存前的处理函数 */
  beforeSave?: (data: any) => any
  /** 保存回调 */
  onSave?: (data: any) => Promise<void>
  /** 保存成功的回调 */
  onSaveSuccess?: () => void
  /** 保存失败的回调 */
  onSaveError?: (error: Error) => void
}

export interface SaveState {
  isSaving: boolean
  isDirty: boolean
  lastSaveTime: number | null
  lastSaveError: Error | null
  backupCount: number
}

const defaultOptions: Required<AutoSaveOptions> = {
  delay: 2000,
  maxBackups: 10,
  enableLocalBackup: true,
  storageKey: 'hug-ai-autosave',
  beforeSave: (data) => data,
  onSave: async () => {},
  onSaveSuccess: () => {},
  onSaveError: () => {},
}

// 创建自动保存 Hook
export function useAutoSave<T = any>(
  initialData: T,
  options: AutoSaveOptions = {}
) {
  const opts = { ...defaultOptions, ...options }
  
  // 状态
  const data = ref<T>(initialData) as any
  const isSaving = ref(false)
  const isDirty = ref(false)
  const lastSaveTime = ref<number | null>(null)
  const lastSaveError = ref<Error | null>(null)
  const backupCount = ref(0)
  
  // 定时器
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let backupTimer: ReturnType<typeof setTimeout> | null = null
  
  // 计算状态
  const state = computed<SaveState>(() => ({
    isSaving: isSaving.value,
    isDirty: isDirty.value,
    lastSaveTime: lastSaveTime.value,
    lastSaveError: lastSaveError.value,
    backupCount: backupCount.value,
  }))
  
  // 格式化时间
  const lastSaveTimeFormatted = computed(() => {
    if (!lastSaveTime.value) return null
    return new Date(lastSaveTime.value).toLocaleString()
  })
  
  // 加载本地备份
  function loadFromStorage(): boolean {
    if (!opts.enableLocalBackup) return false
    
    try {
      const stored = localStorage.getItem(opts.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        data.value = parsed.data
        backupCount.value = parsed.backupCount || 0
        lastSaveTime.value = parsed.lastSaveTime
        return true
      }
    } catch (e) {
      console.warn('Failed to load from storage:', e)
    }
    return false
  }
  
  // 保存到本地
  function saveToStorage() {
    if (!opts.enableLocalBackup) return
    
    try {
      const payload = {
        data: data.value,
        backupCount: backupCount.value,
        lastSaveTime: lastSaveTime.value,
        timestamp: Date.now(),
      }
      localStorage.setItem(opts.storageKey, JSON.stringify(payload))
    } catch (e) {
      console.warn('Failed to save to storage:', e)
    }
  }
  
  // 创建备份
  function createBackup() {
    if (!opts.enableLocalBackup) return
    
    try {
      const backupKey = `${opts.storageKey}-backup`
      const backups = JSON.parse(localStorage.getItem(backupKey) || '[]')
      
      // 添加新备份
      backups.unshift({
        data: JSON.parse(JSON.stringify(data.value)),
        timestamp: Date.now(),
      })
      
      // 限制备份数量
      while (backups.length > opts.maxBackups) {
        backups.pop()
      }
      
      backupCount.value = backups.length
      localStorage.setItem(backupKey, JSON.stringify(backups))
    } catch (e) {
      console.warn('Failed to create backup:', e)
    }
  }
  
  // 获取备份列表
  function getBackups(): Array<{ data: T; timestamp: number }> {
    if (!opts.enableLocalBackup) return []
    
    try {
      const backupKey = `${opts.storageKey}-backup`
      return JSON.parse(localStorage.getItem(backupKey) || '[]')
    } catch (e) {
      return []
    }
  }
  
  // 恢复到指定备份
  function restoreBackup(index: number) {
    const backups = getBackups()
    if (backups[index]) {
      data.value = backups[index].data
      markDirty()
    }
  }
  
  // 标记为已修改
  function markDirty() {
    isDirty.value = true
    scheduleSave()
  }
  
  // 调度保存
  function scheduleSave() {
    if (saveTimer) {
      clearTimeout(saveTimer)
    }
    
    saveTimer = setTimeout(() => {
      save()
    }, opts.delay)
  }
  
  // 立即保存
  async function save(): Promise<boolean> {
    if (isSaving.value) return false
    
    isSaving.value = true
    lastSaveError.value = null
    
    try {
      // 处理数据
      const processedData = opts.beforeSave(data.value)
      
      // 调用保存回调
      await opts.onSave(processedData)
      
      // 更新状态
      data.value = processedData
      isDirty.value = false
      lastSaveTime.value = Date.now()
      
      // 保存到本地
      saveToStorage()
      
      // 创建备份
      createBackup()
      
      opts.onSaveSuccess()
      return true
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      lastSaveError.value = error
      opts.onSaveError(error)
      return false
    } finally {
      isSaving.value = false
    }
  }
  
  // 手动保存并等待
  async function saveAndWait(): Promise<boolean> {
    return save()
  }
  
  // 更新数据
  function update(newData: Partial<T>) {
    data.value = { ...data.value, ...newData }
    markDirty()
  }
  
  // 重置数据
  function reset(newData?: T) {
    if (newData !== undefined) {
      data.value = newData
    }
    isDirty.value = false
    lastSaveError.value = null
  }
  
  // 清除所有备份
  function clearBackups() {
    if (!opts.enableLocalBackup) return
    
    try {
      const backupKey = `${opts.storageKey}-backup`
      localStorage.removeItem(backupKey)
      backupCount.value = 0
    } catch (e) {
      console.warn('Failed to clear backups:', e)
    }
  }
  
  // 清理
  function cleanup() {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    if (backupTimer) {
      clearInterval(backupTimer)
      backupTimer = null
    }
  }
  
  // 卸载时清理
  onUnmounted(cleanup)
  
  // 初始化时加载本地数据
  loadFromStorage()
  
  return {
    data,
    state,
    lastSaveTimeFormatted,
    save,
    saveAndWait,
    update,
    reset,
    markDirty,
    getBackups,
    restoreBackup,
    clearBackups,
    cleanup,
  }
}

// 创建防抖保存 Hook
export function useDebouncedSave<T>(
  dataRef: { value: T },
  saveFn: (data: T) => Promise<void>,
  delay = 1000
) {
  const isSaving = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  
  function debouncedSave() {
    if (timer) clearTimeout(timer)
    
    timer = setTimeout(async () => {
      isSaving.value = true
      try {
        await saveFn(dataRef.value)
      } finally {
        isSaving.value = false
      }
    }, delay)
  }
  
  function cancel() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  
  onUnmounted(cancel)
  
  return {
    isSaving,
    save: debouncedSave,
    cancel,
  }
}
