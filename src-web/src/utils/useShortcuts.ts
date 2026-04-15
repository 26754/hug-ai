/**
 * 快捷键系统 Hook
 * 支持全局快捷键、组合键、范围限定
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'

export interface ShortcutOptions {
  /** 快捷键组合，如 'Ctrl+S', 'Cmd+Shift+P' */
  key: string
  /** 描述文字 */
  description: string
  /** 分类 */
  category?: 'global' | 'editor' | 'navigation' | 'file' | 'view'
  /** 是否启用 */
  enabled?: boolean
  /** 回调函数 */
  handler: (e: KeyboardEvent) => void
  /** 作用范围 */
  scope?: 'app' | 'editor' | 'modal'
}

interface ShortcutItem extends ShortcutOptions {
  id: string
}

// 快捷键注册表
const shortcuts = ref<Map<string, ShortcutItem>>(new Map())
const activeScope = ref<'app' | 'editor' | 'modal'>('app')

// 修饰键映射
const modifierMap: Record<string, string> = {
  ctrl: 'Control',
  control: 'Control',
  cmd: 'Meta',
  command: 'Meta',
  shift: 'Shift',
  alt: 'Alt',
  option: 'Alt',
}

// 解析快捷键字符串
function parseKeyString(key: string): { ctrl: boolean; shift: boolean; alt: boolean; key: string } {
  const parts = key.toLowerCase().split('+').map(p => p.trim())
  const result = { ctrl: false, shift: false, alt: false, key: '' }
  
  for (const part of parts) {
    if (modifierMap[part]) {
      const modifier = modifierMap[part].toLowerCase()
      if (modifier === 'control') result.ctrl = true
      if (modifier === 'shift') result.shift = true
      if (modifier === 'alt') result.alt = true
      if (modifier === 'meta') {
        // Mac 上是 Cmd，Windows 上是 Win
        result.ctrl = true
      }
    } else {
      result.key = part
    }
  }
  
  return result
}

// 检测快捷键是否匹配
function matchShortcut(e: KeyboardEvent, item: ShortcutItem): boolean {
  const parsed = parseKeyString(item.key)
  
  const ctrlMatch = e.ctrlKey === parsed.ctrl || e.metaKey === parsed.ctrl
  const shiftMatch = e.shiftKey === parsed.shift
  const altMatch = e.altKey === parsed.alt
  const keyMatch = e.key.toLowerCase() === parsed.key
  
  return ctrlMatch && shiftMatch && altMatch && keyMatch
}

// 快捷键显示格式化
export function formatShortcut(key: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  return key
    .replace(/ctrl|control/gi, isMac ? '⌘' : 'Ctrl')
    .replace(/cmd|command/gi, isMac ? '⌘' : 'Cmd')
    .replace(/shift/gi, isMac ? '⇧' : 'Shift')
    .replace(/alt|option/gi, isMac ? '⌥' : 'Alt')
    .replace(/\+/gi, ' + ')
}

// 全局键盘事件处理
function handleKeyDown(e: KeyboardEvent) {
  // 如果在输入框中且不是全局快捷键，跳过
  const target = e.target as HTMLElement
  const isInput = target.tagName === 'INPUT' || 
                  target.tagName === 'TEXTAREA' || 
                  target.isContentEditable

  for (const [id, shortcut] of shortcuts.value) {
    if (!shortcut.enabled) continue
    if (shortcut.scope !== 'app' && shortcut.scope !== activeScope.value) continue
    
    // 在输入框中只处理全局快捷键
    if (isInput && shortcut.category !== 'global') continue
    
    if (matchShortcut(e, shortcut)) {
      e.preventDefault()
      e.stopPropagation()
      shortcut.handler(e)
      return
    }
  }
}

// 创建快捷键 Hook
export function useShortcuts() {
  const registeredShortcuts = computed(() => Array.from(shortcuts.value.values()))
  
  const globalShortcuts = computed(() => 
    registeredShortcuts.value.filter(s => s.category === 'global')
  )
  
  const editorShortcuts = computed(() =>
    registeredShortcuts.value.filter(s => s.category === 'editor')
  )

  // 注册快捷键
  function register(options: ShortcutOptions): string {
    const id = `shortcut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    shortcuts.value.set(id, {
      ...options,
      id,
      enabled: options.enabled !== false,
    })
    return id
  }

  // 批量注册
  function registerBatch(optionsList: ShortcutOptions[]): string[] {
    return optionsList.map(register)
  }

  // 注销快捷键
  function unregister(id: string) {
    shortcuts.value.delete(id)
  }

  // 启用/禁用
  function enable(id: string) {
    const shortcut = shortcuts.value.get(id)
    if (shortcut) shortcut.enabled = true
  }

  function disable(id: string) {
    const shortcut = shortcuts.value.get(id)
    if (shortcut) shortcut.enabled = false
  }

  // 切换作用域
  function setScope(scope: 'app' | 'editor' | 'modal') {
    activeScope.value = scope
  }

  // 移除所有快捷键
  function clearAll() {
    shortcuts.value.clear()
  }

  // 按分类获取
  function getByCategory(category: ShortcutOptions['category']) {
    return registeredShortcuts.value.filter(s => s.category === category)
  }

  return {
    shortcuts: registeredShortcuts,
    globalShortcuts,
    editorShortcuts,
    activeScope,
    register,
    registerBatch,
    unregister,
    enable,
    disable,
    setScope,
    clearAll,
    getByCategory,
    formatShortcut,
  }
}

// 默认快捷键定义
export const defaultShortcuts: ShortcutOptions[] = [
  // 全局
  { key: 'Ctrl+S', description: '保存', category: 'global', handler: () => {} },
  { key: 'Ctrl+Z', description: '撤销', category: 'global', handler: () => {} },
  { key: 'Ctrl+Shift+Z', description: '重做', category: 'global', handler: () => {} },
  
  // 导航
  { key: 'Ctrl+1', description: '项目管理', category: 'navigation', handler: () => {} },
  { key: 'Ctrl+2', description: '小说编辑', category: 'navigation', handler: () => {} },
  { key: 'Ctrl+3', description: '剧本编辑', category: 'navigation', handler: () => {} },
  { key: 'Ctrl+4', description: '素材管理', category: 'navigation', handler: () => {} },
  { key: 'Ctrl+5', description: '工作台', category: 'navigation', handler: () => {} },
  
  // 文件
  { key: 'Ctrl+N', description: '新建项目', category: 'file', handler: () => {} },
  { key: 'Ctrl+O', description: '打开文件', category: 'file', handler: () => {} },
  { key: 'Ctrl+E', description: '导出', category: 'file', handler: () => {} },
  
  // 编辑器
  { key: 'Ctrl+B', description: '加粗', category: 'editor', scope: 'editor', handler: () => {} },
  { key: 'Ctrl+I', description: '斜体', category: 'editor', scope: 'editor', handler: () => {} },
  { key: 'Tab', description: '缩进', category: 'editor', scope: 'editor', handler: () => {} },
  
  // 视图
  { key: 'Ctrl++', description: '放大', category: 'view', handler: () => {} },
  { key: 'Ctrl+-', description: '缩小', category: 'view', handler: () => {} },
  { key: 'F11', description: '全屏', category: 'view', handler: () => {} },
  { key: 'Ctrl+D', description: '切换暗色模式', category: 'view', handler: () => {} },
]

// 初始化快捷键系统
export function initShortcuts() {
  window.addEventListener('keydown', handleKeyDown)
}

// 清理快捷键系统
export function destroyShortcuts() {
  window.removeEventListener('keydown', handleKeyDown)
  shortcuts.value.clear()
}
