<!-- 标注圆点：显示在页面上的编号标记，支持 page/modal/drawer 三种宿主容器 -->
<template>
  <!-- 角标和锚点统一使用视口坐标，避免抽屉变换重复偏移。 -->
  <Teleport to="body">
    <div
      class="annotation-dot"
      :data-annot-id="annotation.id"
      :class="{
        'annotation-dot-active': isActive,
        'annotation-dot-edit': editMode,
        'annotation-dot-dragging': isDragging,
        'annotation-dot-unplaced': isUnplaced && !isDragging
      }"
      :style="{ ...dotStyle, '--dot-color': dotColor }"
      @click.stop="handleClick"
      @pointerdown.stop="handleDragStart"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <span class="dot-number">{{ index + 1 }}</span>

      <!-- hover 摘要气泡 -->
      <div v-if="showTooltip && !isActive" class="dot-tooltip">
        <div class="tooltip-title">{{ annotation.title }}</div>
        <div class="tooltip-category">{{ categoryLabel }}</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { AnnotationItem } from './types'
import type { Point } from './annotationContext'

const props = defineProps<{
  annotation: AnnotationItem
  index: number
  isActive: boolean
  editMode: boolean
  origin: Point
}>()

const emit = defineEmits<{
  click: [id: string]
  move: [id: string, pos: { x: number; y: number }]
}>()

const dragPos = ref<Point | null>(null)
const isDragging = computed(() => !!dragPos.value)
const showTooltip = ref(false)
const isUnplaced = computed(() => props.annotation.type === 'position' && !props.annotation.position.x && !props.annotation.position.y)
let hasMoved = false
let cleanup: (() => void) | undefined

const dotColor = computed(() => props.annotation.color || '#1677ff')

const categoryMap: Record<string, string> = {
  filter: '筛选', field: '字段', action: '操作', rule: '规则', custom: '自定义'
}
const categoryLabel = computed(() => categoryMap[props.annotation.category] || props.annotation.category)

// 微调只改相对偏移；取消手势或切换状态时不提交。
const dotStyle = computed(() => {
  const pos = dragPos.value || {
    x: props.origin.x + props.annotation.position.x,
    y: props.origin.y + props.annotation.position.y
  }
  return { position: 'fixed' as const, left: pos.x+'px', top: pos.y+'px', zIndex: 9991 }
})
function handleDragStart(e: PointerEvent) {
  hasMoved = false
  if (!props.editMode || e.button !== 0 || !e.isPrimary) return
  cleanup?.()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const move = (ev: PointerEvent) => {
    if (ev.pointerId !== e.pointerId) return
    const dx = ev.clientX-e.clientX, dy = ev.clientY-e.clientY
    if (!hasMoved && Math.hypot(dx,dy) < 4) return
    hasMoved = true
    ev.preventDefault()
    dragPos.value = {x:rect.left+dx, y:rect.top+dy}
  }
  const finish = (ev: PointerEvent) => {
    if (ev.pointerId !== e.pointerId) return
    const point = dragPos.value
    if (point && ev.type === 'pointerup') emit('move', props.annotation.id, {
      x:point.x-props.origin.x, y:point.y-props.origin.y
    })
    cleanup?.()
  }
  cleanup = () => {
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerup', finish)
    document.removeEventListener('pointercancel', finish)
    dragPos.value = null
    cleanup = undefined
  }
  document.addEventListener('pointermove', move, {passive:false})
  document.addEventListener('pointerup', finish)
  document.addEventListener('pointercancel', finish)
}
function handleClick() { if (!hasMoved) emit('click', props.annotation.id) }
onUnmounted(() => cleanup?.())
</script>

<style scoped lang="scss">
.annotation-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--dot-color, #1677ff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--dot-color, #1677ff) 50%, transparent);
  transition: transform 0.15s, box-shadow 0.15s;
  user-select: none;
  pointer-events: auto;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
}

.annotation-dot:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--dot-color, #1677ff) 60%, transparent);
}

.annotation-dot-active {
  --dot-color: #ff4d4f;
  transform: scale(1.1);
}

.annotation-dot-edit {
  cursor: grab;
  /* 编辑模式下用指针拖拽，禁用触屏默认手势（滚动/缩放），否则移动端拖不动 */
  touch-action: none;
}

/* 未定位的 position 标注：编辑模式下固定显示在右下角，虚线边框提示需要拖放 */
.annotation-dot-unplaced {
  position: fixed !important;
  bottom: 80px;
  right: 24px;
  left: auto !important;
  top: auto !important;
  border: 1.5px dashed rgba(255, 255, 255, 0.8) !important;
  opacity: 0.85;
}

.annotation-dot-dragging {
  cursor: grabbing;
  transform: scale(1.15);
}

.dot-number {
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.dot-tooltip {
  position: absolute;
  top: -8px;
  left: calc(100% + 8px);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  white-space: nowrap;
  font-size: 12px;
  pointer-events: none;
  z-index: 9999;
}

.tooltip-title {
  font-weight: 500;
  margin-bottom: 2px;
}

.tooltip-category {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}
</style>
