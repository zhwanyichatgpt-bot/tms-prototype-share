<!-- 标注覆盖层：全局挂载，整合标注点、详情面板、编辑器 -->
<template>
  <div class="annotation-overlay">
    <!-- 标注点：每个 dot 自己决定是否显示及渲染到哪个容器 -->
    <template v-if="visible">
      <AnnotationDot
        v-for="({item: ann, origin}, index) in badges"
        :key="ann.id"
        :annotation="ann"
        :index="index" :origin="origin"
        :is-active="activeId === ann.id"
        :edit-mode="editMode"
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
        @rebind="startRebind"
        @edit="openEditor"
        @delete="handleDelete"
      />
    </Teleport>

    <!-- 编辑模式工具栏 -->
    <div v-if="editMode" class="annotation-toolbar">
      <span class="toolbar-label">标注编辑模式</span>
      <span class="toolbar-hint" role="status">{{ placementHint || (fixedPlacement ? '点击页面设置固定位置' : '点击要说明的字段或区域') }}</span>
      <button v-if="rebindId" class="toolbar-btn" @click="cancelRebind">取消重新绑定</button>
      <label v-else><input type="checkbox" v-model="fixedPlacement" @change="placementHint = ''"> 固定坐标</label>
      <button class="toolbar-btn toolbar-btn-exit" @click="toggleEditMode">退出编辑</button>
    </div>

    <!-- 点击页面添加标注（编辑模式下）-->
    <!-- 无弹窗/抽屉时：全屏覆盖层，点击任意位置添加标注 -->
    <div
      v-if="ready && editMode && !editorVisible && !modalOpen && !drawerOpen"
      class="annotation-click-layer"
      @click="handleAddClick"
    ></div>
    <!-- 有弹窗时：click-layer teleport 到弹窗内容区，避免遮挡弹窗外的标注点交互 -->
    <Teleport v-if="ready && editMode && !editorVisible && (modalOpen || drawerOpen)" :to="overlayClickTarget || 'body'">
      <div
        class="annotation-click-layer annotation-click-layer-inset"
        @click="handleAddClick"
      ></div>
    </Teleport>

    <div v-if="dataError" class="annotation-toolbar" role="alert">{{ dataError }}</div>

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
import { ref, computed, shallowRef, watch, onMounted, onUnmounted } from 'vue'
import AnnotationDot from './AnnotationDot.vue'
import AnnotationPanel from './AnnotationPanel.vue'
import AnnotationEditor from './AnnotationEditor.vue'
import { currentLayer, visibleBadges } from './annotationContext'
import { useRoute } from 'vue-router'
import { useAnnotation } from './useAnnotation'
import { subscribe, unsubscribe } from './annotationTracker'
import type { AnnotationItem, AnnotationCategory } from './types'

const {
  visible, editMode, activeId, annotations,
  addAnnotation, updateAnnotation, removeAnnotation,
  toggleEditMode, visibleCount, ready, dataError
} = useAnnotation()

const route = useRoute()
const layer = shallowRef(currentLayer())
const displayVersion = ref(0)
const modalOpen = computed(() => layer.value.kind === 'modal')
const drawerOpen = computed(() => layer.value.kind === 'drawer')
const overlayClickTarget = computed(() => layer.value.root)
const badges = computed(() => {
  void displayVersion.value
  return visibleBadges(annotations.value, layer.value, editMode.value)
})
watch(() => badges.value.length, count => { visibleCount.value = count }, {immediate:true})
const activeIndex = computed(() => badges.value.findIndex(({item}) => item.id === activeId.value))
const activeAnnotation = computed(() => badges.value[activeIndex.value]?.item || null)
watch(activeAnnotation, item => { if (!item) activeId.value = '' })
function handleDotClick(id: string) { activeId.value = activeId.value === id ? '' : id }
function handleDotMove(id: string, position: {x:number; y:number}) { updateAnnotation(id, {position}) }

// 编辑器状态
const editorVisible = ref(false)
const editorItem = ref<AnnotationItem | null>(null)
const pendingPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })
// 新建标注 ID 自增计数器：避免同一毫秒连续添加时 Date.now() 撞 ID
let idCounter = 0

const fixedPlacement = ref(false)
const placementHint = ref('')
const pendingSelector = ref('')
const pendingAnchor = ref<AnnotationItem['anchorPoint']>()
const pendingGroup = ref<string>()
const rebindId = ref('')
function cancelRebind() { rebindId.value = ''; placementHint.value = '' }
function startRebind(id: string) {
  rebindId.value = id
  fixedPlacement.value = false
  activeId.value = ''
  placementHint.value = '点击此条标注应关联的字段或区域'
}
function resetEditor() {
  fixedPlacement.value = false
  cancelRebind()
  editorVisible.value = false
  editorItem.value = null
}
watch([editMode, () => route.fullPath, () => layer.value.root], resetEditor)

// 只取点击位置下方真实业务元素的祖先，不穿过遮罩猜测底层字段。
function handleAddClick(e: MouseEvent) {
  const root = modalOpen.value || drawerOpen.value ? overlayClickTarget.value : document.querySelector('.prototype-workbench-canvas')
  const hit = document.elementsFromPoint(e.clientX, e.clientY).find(el =>
    !el.closest('.annotation-overlay, .annotation-click-layer, .annotation-dot'))
  if (!root || !hit || !root.contains(hit)) return
  pendingContainer.value = drawerOpen.value ? 'drawer' : modalOpen.value ? 'modal' : 'page'
  pendingSelector.value = ''
  pendingAnchor.value = undefined
  pendingGroup.value = undefined
  pendingPosition.value = { x: e.clientX, y: e.clientY }
  if (!fixedPlacement.value) {
    for (let el: Element | null = hit; el && root.contains(el); el = el.parentElement) {
      const name = Array.from(el.classList).find(c => c.startsWith('annot-') &&
        document.querySelectorAll('.' + CSS.escape(c)).length === 1)
      if (!name) continue
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) continue
      pendingSelector.value = '.' + CSS.escape(name)
      pendingAnchor.value = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }
      pendingPosition.value = { x: 0, y: 0 }
      pendingGroup.value = annotations.value.find(item => item.selector === pendingSelector.value)?.group
      break
    }
    if (!pendingSelector.value) {
      placementHint.value = rebindId.value ? '此位置没有可绑定的区域，请重新选择' : '这里没有可绑定的区域，请换个位置，或勾选固定坐标'
      return
    }
  }
  const groups = new Set(badges.value.map(({item}) => item.group).filter((g): g is string => !!g))
  if (!pendingGroup.value && groups.size === 1) pendingGroup.value = [...groups][0]
  if (rebindId.value) {
    const id = rebindId.value
    updateAnnotation(id, { type:'selector', selector:pendingSelector.value, anchorPoint:pendingAnchor.value,
      position:{x:0,y:0}, container:pendingContainer.value, group:pendingGroup.value })
    cancelRebind()
    activeId.value = id
    return
  }
  placementHint.value = ''
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
      type: pendingSelector.value ? 'selector' : 'position',
      selector: pendingSelector.value,
      anchorPoint: pendingAnchor.value,
      group: pendingGroup.value,
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

function refreshContext() {
  const next = currentLayer()
  if (next.root !== layer.value.root || next.kind !== layer.value.kind) layer.value = next
  displayVersion.value++
}
onMounted(() => {
  document.addEventListener('click', handleOutsideClick, true)
  subscribe('__annotation_context__', refreshContext)
  refreshContext()
})
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick, true)
  unsubscribe('__annotation_context__')
  visibleCount.value = 0
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
