<!-- 标注覆盖层：全局挂载，整合标注点、详情面板、编辑器 -->
<template>
  <div class="annotation-overlay">
    <!-- 标注点：每个 dot 自己决定是否显示及渲染到哪个容器 -->
    <template v-if="visible">
      <AnnotationDot
        v-for="ann in annotations"
        :key="ann.id"
        :annotation="ann"
        :index="displayIndexById[ann.id] ?? 0"
        :is-active="activeId === ann.id"
        :edit-mode="editMode"
        :modal-open="modalOpen"
        :drawer-open="drawerOpen"
        @click="handleDotClick"
        @move="handleDotMove"
      />
    </template>

    <!-- 详情面板：teleport 到 body -->
    <Teleport to="body">
      <AnnotationPanel
        :annotation="activeAnnotation"
        :index="activeIndex"
        :edit-mode="editMode"
        @close="activeId = ''"
        @edit="openEditor"
        @delete="handleDelete"
      />
    </Teleport>

    <!-- 编辑模式工具栏 -->
    <div v-if="editMode" class="annotation-toolbar">
      <span class="toolbar-label">标注编辑模式</span>
      <span class="toolbar-hint">点击页面添加标注</span>
      <button class="toolbar-btn toolbar-btn-exit" @click="toggleEditMode">退出编辑</button>
    </div>

    <!-- 点击页面添加标注（编辑模式下）-->
    <!-- 无弹窗/抽屉时：全屏覆盖层，点击任意位置添加标注 -->
    <div
      v-if="editMode && !editorVisible && !modalOpen && !drawerOpen"
      class="annotation-click-layer"
      @click="handleAddClick"
    ></div>
    <!-- 有弹窗时：click-layer teleport 到弹窗内容区，避免遮挡弹窗外的标注点交互 -->
    <Teleport v-if="editMode && !editorVisible && (modalOpen || drawerOpen)" :to="overlayClickTarget || 'body'">
      <div
        class="annotation-click-layer annotation-click-layer-inset"
        @click="handleAddClick"
      ></div>
    </Teleport>

    <!-- 编辑器弹窗：teleport 到 body，避免被 overlay stacking context 限制 -->
    <Teleport to="body">
      <AnnotationEditor
        :visible="editorVisible"
        :edit-item="editorItem"
        @save="handleEditorSave"
        @cancel="editorVisible = false"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * 标注覆盖层组件
 * 全局挂载在 MainLayout 中，提供标注查看和编辑功能
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AnnotationDot from './AnnotationDot.vue'
import AnnotationPanel from './AnnotationPanel.vue'
import AnnotationEditor from './AnnotationEditor.vue'
import { useAnnotation } from './useAnnotation'
import { subscribe, unsubscribe } from './annotationTracker'
import type { AnnotationItem, AnnotationCategory } from './types'

const {
  visible, editMode, activeId, annotations,
  addAnnotation, updateAnnotation, removeAnnotation,
  toggleEditMode
} = useAnnotation()

// 当前选中的标注
const activeAnnotation = computed(() =>
  annotations.value.find(a => a.id === activeId.value) || null
)

// 编号只统计当前 DOM 中实际可见的标注目标。
// 同一路由可能同时登记货源报价、运力报价和提交弹窗等分支标注，
// 直接按 group 编号会让页面出现多个“1”；按当前可见目标重新编号，
// 才能保证用户看到的标注点始终从 1 连续展示。
const displayVersion = ref(0)

const isAnnotationTargetVisible = (annotation: AnnotationItem) => {
  const container = annotation.container || 'page'
  if (container === 'modal' && !modalOpen.value) return false
  if (container === 'drawer' && !drawerOpen.value) return false
  if (container === 'page' && (modalOpen.value || drawerOpen.value)) return false

  if (annotation.type === 'position') {
    return !(annotation.position.x === 0 && annotation.position.y === 0)
  }

  if (!annotation.selector) return false
  const target = document.querySelector(annotation.selector)
  if (!target) return false
  const rect = target.getBoundingClientRect()
  const style = window.getComputedStyle(target as HTMLElement)
  return rect.width > 0 && rect.height > 0 &&
    style.display !== 'none' && style.visibility !== 'hidden' &&
    parseFloat(style.opacity || '1') > 0
}

const displayIndexById = computed<Record<string, number>>(() => {
  void displayVersion.value
  const indexes: Record<string, number> = {}
  let visibleIndex = 0
  for (const annotation of annotations.value) {
    if (!isAnnotationTargetVisible(annotation)) continue
    indexes[annotation.id] = visibleIndex
    visibleIndex += 1
  }
  return indexes
})
const activeIndex = computed(() => displayIndexById.value[activeId.value] ?? -1)

// 点击标注点
const handleDotClick = (id: string) => {
  activeId.value = activeId.value === id ? '' : id
}

// 编辑模式下 click-layer 的 Teleport 目标（弹窗/抽屉打开时定位到浮层内容区）
const OVERLAY_CLICK_MODAL_SELECTORS = [
  '.ant-modal-content', '.el-dialog', '.van-dialog', '.t-dialog', '.n-dialog',
  '[data-annotation-content="modal"]',
  '[class*="modal-content"]', '[class*="dialog-content"]'
]
const OVERLAY_CLICK_DRAWER_SELECTORS = [
  '.ant-drawer-body', '.el-drawer__body', '.van-popup', '.t-drawer__body',
  '.n-drawer-body-content', '[data-annotation-content="drawer"]',
  '[class*="drawer-body"]', '[class*="drawer-content"]'
]
// 多弹窗共存时取第一个匹配会选到隐藏容器，需返回当前可见的浮层容器 DOM 元素
const overlayClickTarget = computed<Element | null>(() => {
  void modalOpen.value
  void drawerOpen.value
  const selectors = drawerOpen.value ? OVERLAY_CLICK_DRAWER_SELECTORS : OVERLAY_CLICK_MODAL_SELECTORS
  for (const sel of selectors) {
    const nodes = Array.from(document.querySelectorAll(sel))
    for (const node of nodes) {
      const rect = node.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) return node
    }
  }
  return null
})

// 拖拽移动标注点：直接存屏幕坐标
const handleDotMove = (id: string, pos: { x: number; y: number }) => {
  updateAnnotation(id, { position: pos, type: 'position', selector: '' })
}

// 编辑器状态
const editorVisible = ref(false)
const editorItem = ref<AnnotationItem | null>(null)
const pendingPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })
// 新建标注 ID 自增计数器：避免同一毫秒连续添加时 Date.now() 撞 ID
let idCounter = 0

// 编辑模式下点击页面添加标注
const handleAddClick = (e: MouseEvent) => {
  pendingPosition.value = { x: e.clientX, y: e.clientY }
  // 记录当前容器上下文：弹窗/抽屉打开时新建的标注归属对应容器
  pendingContainer.value = drawerOpen.value ? 'drawer' : modalOpen.value ? 'modal' : 'page'
  editorItem.value = null
  editorVisible.value = true
}

const pendingContainer = ref<'page' | 'modal' | 'drawer'>('page')

// 打开编辑器（编辑已有标注）
const openEditor = (id: string) => {
  editorItem.value = annotations.value.find(a => a.id === id) || null
  editorVisible.value = true
}

// 编辑器保存
const handleEditorSave = (data: { title: string; content: string; category: AnnotationCategory; source: string; color: string }) => {
  if (editorItem.value) {
    updateAnnotation(editorItem.value.id, data)
  } else {
    const newItem: AnnotationItem = {
      id: `ann-${Date.now()}-${++idCounter}`,
      type: 'position',
      selector: '',
      position: pendingPosition.value,
      title: data.title,
      content: data.content,
      category: data.category,
      source: data.source,
      color: data.color || undefined,
      container: pendingContainer.value !== 'page' ? pendingContainer.value : undefined,
      createdAt: new Date().toISOString().split('T')[0]
    }
    addAnnotation(newItem)
  }
  editorVisible.value = false
}

// 删除标注
const handleDelete = (id: string) => {
  removeAnnotation(id)
  activeId.value = ''
}

// 弹窗/抽屉状态检测：随全局 tracker 触发，区分 modal 和 drawer
// 支持 Ant Design（ant-scrolling-effect）和 Element Plus（el-popup-parent--hidden）
const modalOpen = ref(false)
const drawerOpen = ref(false)

/**
 * 通用 overlay 检测：不绑定任何具体 UI 库
 *
 * 策略（双重检测，任一命中即判定为打开）：
 * 1. body class 信号：各 UI 库在弹窗打开时会给 body 加特征 class
 *    - Ant Design Vue: ant-scrolling-effect
 *    - Element Plus: el-popup-parent--hidden
 *    - Vant: van-overflow-hidden
 *    - TDesign: t-overflow-hidden
 * 2. DOM 可见元素检测：在 body 子树中找到可见的弹窗/抽屉容器
 *    - 判断可见：元素有实际尺寸 + opacity > 0 + 不是 mask 遮罩
 *
 * 抽屉优先于弹窗：同时存在时，drawerOpen=true，modalOpen=false
 */

// body class 信号（各 UI 库在弹窗打开时给 body 加的 class）
const BODY_MODAL_SIGNALS = [
  'ant-scrolling-effect',       // Ant Design Vue modal
  'el-popup-parent--hidden',    // Element Plus
  'van-overflow-hidden',        // Vant
  't-overflow-hidden',          // TDesign
  'overflow-hidden',            // 通用（shadcn/ui 等）
]

const BODY_DRAWER_SIGNALS = [
  'ant-drawer-open',            // Ant Design Vue drawer（body 上的标记）
]

// DOM 元素选择器（找到可见元素即判定打开）
const DRAWER_VISIBLE_SELECTORS = [
  '.ant-drawer-open .ant-drawer-content-wrapper',  // Ant Design Vue
  '.el-drawer__body',                               // Element Plus（2.x 抽屉可见时内容区即存在，无 is-visible 类）
  '.van-popup--left, .van-popup--right, .van-popup--top, .van-popup--bottom',  // Vant
  '.t-drawer__body',                                // TDesign
  '.n-drawer-body-content',                         // Naive UI
  '[data-annotation-container="drawer"]',          // 项目自定义抽屉显式接入
]

const MODAL_VISIBLE_SELECTORS = [
  '.ant-modal-wrap:not([style*="display: none"])',  // Ant Design Vue
  '.el-overlay-dialog',                              // Element Plus
  '.van-dialog',                                     // Vant
  '.t-dialog__wrap',                                 // TDesign
  '.n-modal-container',                              // Naive UI
  '[data-annotation-container="modal"]',           // 项目自定义弹层显式接入
]

const isElementVisible = (el: Element): boolean => {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  const style = window.getComputedStyle(el as HTMLElement)
  return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0
}

const checkOverlayState = () => {
  const bodyClass = document.body.className || ''

  // 1. body class 信号检测
  const bodySignalsDrawer = BODY_DRAWER_SIGNALS.some(c => bodyClass.includes(c))
  const bodySignalsModal = !bodySignalsDrawer && BODY_MODAL_SIGNALS.some(c => bodyClass.includes(c))

  // 2. DOM 可见元素检测
  let domFoundDrawer = false
  let domFoundModal = false

  for (const sel of DRAWER_VISIBLE_SELECTORS) {
    const el = document.querySelector(sel)
    if (el && isElementVisible(el)) { domFoundDrawer = true; break }
  }

  if (!domFoundDrawer) {
    for (const sel of MODAL_VISIBLE_SELECTORS) {
      const el = document.querySelector(sel)
      if (el && isElementVisible(el)) { domFoundModal = true; break }
    }
  }

  const foundDrawer = bodySignalsDrawer || domFoundDrawer
  const foundModal = !foundDrawer && (bodySignalsModal || domFoundModal)

  drawerOpen.value = foundDrawer
  modalOpen.value = foundModal
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick, true)

  // 标注目标可能因货源/运力分支、弹窗或抽屉切换而增删，
  // 复用现有追踪器让可见编号同步刷新。
  subscribe('__annotation_display_index__', () => { displayVersion.value += 1 })

  // 复用全局 tracker 的单例 observer：弹窗/抽屉状态检测随 DOM 变化触发，
  // 且自动获得 rAF 防抖（避免每次 mutation 同步跑重排密集的 checkOverlayState）
  checkOverlayState()
  subscribe('__overlay_state__', checkOverlayState)
})
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick, true)
  unsubscribe('__overlay_state__')
  unsubscribe('__annotation_display_index__')
})

// 点击外部关闭详情面板（标注点、面板本身、编辑器弹窗打开时除外）
const handleOutsideClick = (e: MouseEvent) => {
  if (!activeId.value) return
  if (editorVisible.value) return  // 编辑器弹窗打开时不关闭详情面板
  const target = e.target as Element
  if (
    target.closest('.annotation-panel') ||
    target.closest('.annotation-dot')
  ) return
  activeId.value = ''
}
</script>

<style scoped>
/* 覆盖层：fixed 覆盖整个视口，pointer-events: none 不阻断页面交互 */
/* AnnotationDot 的 position: absolute 相对此容器定位，坐标用视口百分比 */
.annotation-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9980;
}

/* 需要响应点击的子元素单独开启 pointer-events */
.annotation-toolbar,
.annotation-click-layer {
  pointer-events: auto;
}

/* 编辑模式工具栏 */
.annotation-toolbar {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.toolbar-label {
  font-weight: 600;
}

.toolbar-hint {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.toolbar-btn {
  padding: 3px 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: transparent;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.toolbar-btn-exit {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

/* 编辑模式点击层（全屏，无弹窗时使用） */
.annotation-click-layer {
  position: fixed;
  inset: 0;
  z-index: 9989;
  cursor: crosshair;
}

/* 弹窗/抽屉内的点击层（相对容器定位，不遮挡弹窗外的标注点） */
.annotation-click-layer-inset {
  position: absolute;
  inset: 0;
  z-index: 1050;
}

/* 移动端适配：窄屏下编辑工具栏顶部贴边横向铺满，避免居中后宽度不足竖排挤压 */
@media (max-width: 640px) {
  .annotation-toolbar {
    top: 8px;
    left: 8px;
    right: 8px;
    transform: none;
    justify-content: space-between;
    padding: 6px 10px;
    gap: 8px;
    font-size: 12px;
  }
  /* 空间有限，隐藏提示文字，保留标题和操作按钮 */
  .toolbar-hint {
    display: none;
  }
}
</style>
