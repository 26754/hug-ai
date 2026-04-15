<template>
  <div 
    ref="containerRef"
    class="virtual-list"
    :style="{ height: `${height}px`, overflow: 'auto' }"
    @scroll="handleScroll"
  >
    <div 
      class="virtual-list-spacer"
      :style="{ height: `${totalHeight}px`, position: 'relative' }"
    >
      <div 
        class="virtual-list-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <slot 
          v-for="item in visibleItems" 
          :key="item[dataKey]" 
          :item="item"
          :index="item.index"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 虚拟滚动组件
 * 用于大数据列表的性能优化
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

interface Props {
  /** 数据列表 */
  items: any[]
  /** 行高（固定高度模式） */
  itemHeight?: number
  /** 缓冲区大小 */
  buffer?: number
  /** 容器高度 */
  height?: number
  /** 数据键名 */
  dataKey?: string
  /** 是否启用虚拟滚动 */
  enabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  itemHeight: 50,
  buffer: 5,
  height: 400,
  dataKey: 'id',
  enabled: true,
})

const emit = defineEmits<{
  (e: 'scroll', event: Event): void
  (e: 'reach-end'): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)

// 总高度
const totalHeight = computed(() => props.items.length * props.itemHeight)

// 计算可见区域
const visibleCount = computed(() => {
  const containerHeight = props.height
  return Math.ceil(containerHeight / props.itemHeight) + props.buffer * 2
})

// 计算起始索引
const startIndex = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight) - props.buffer
  return Math.max(0, start)
})

// 计算结束索引
const endIndex = computed(() => {
  return Math.min(props.items.length, startIndex.value + visibleCount.value)
})

// 偏移量
const offsetY = computed(() => startIndex.value * props.itemHeight)

// 可见项
const visibleItems = computed(() => {
  if (!props.enabled) {
    return props.items.map((item, index) => ({ ...item, index }))
  }
  
  return props.items.slice(startIndex.value, endIndex.value).map((item, index) => ({
    ...item,
    index: startIndex.value + index,
  }))
})

// 滚动处理
function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  
  emit('scroll', event)
  
  // 检测是否到达底部
  const { scrollTop: st, clientHeight, scrollHeight } = target
  if (st + clientHeight >= scrollHeight - 50) {
    emit('reach-end')
  }
}

// 滚动到指定位置
function scrollTo(index: number, smooth = true) {
  if (containerRef.value) {
    const top = index * props.itemHeight
    containerRef.value.scrollTo({
      top,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }
}

// 滚动到顶部
function scrollToTop(smooth = true) {
  scrollTo(0, smooth)
}

// 滚动到底部
function scrollToBottom(smooth = true) {
  scrollTo(props.items.length - 1, smooth)
}

// 刷新
function refresh() {
  scrollTop.value = 0
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
  }
}

// 重置
function reset() {
  scrollTop.value = 0
}

// 暴露方法
defineExpose({
  scrollTo,
  scrollToTop,
  scrollToBottom,
  refresh,
  reset,
})
</script>

<style scoped>
.virtual-list {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

.virtual-list-spacer {
  overflow: hidden;
}

.virtual-list-content {
  will-change: transform;
}
</style>
