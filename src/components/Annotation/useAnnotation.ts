// 标注状态管理
import { ref, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import type { AnnotationItem, PageAnnotation } from './types'
import { annotationLoadUrl } from '../../../review/annotation-paths.mjs'

// 全局状态
const visible = ref(true)
const editMode = ref(false)
const activeId = ref<string>('')
const annotations = ref<AnnotationItem[]>([])
const pageTitle = ref('')
const visibleCount = ref(0)
let writes = Promise.resolve()

const setVisible = (nextVisible: boolean) => {
  visible.value = nextVisible
  if (!nextVisible) {
    activeId.value = ''
    editMode.value = false
  }
}

const toggleVisible = () => setVisible(!visible.value)

const setEditMode = (nextEditMode: boolean) => {
  editMode.value = import.meta.env.DEV && nextEditMode
  if (nextEditMode) {
    visible.value = true
  } else {
    activeId.value = ''
  }
}

const toggleEditMode = () => setEditMode(!editMode.value)

/** 工作台控制入口：不重复注册路由监听，只共享全局标注状态 */
export function useAnnotationControl() {
  return {
    visible,
    editMode,
    annotations, visibleCount,
    setVisible,
    toggleVisible,
    setEditMode,
    toggleEditMode
  }
}

// 路由路径转文件名
// 优先用路由模板路径（去掉动态参数，如 /inspection/task/:id → inspection-task-detail）
// 避免 /inspection/task/1 和 /inspection/task/2 生成不同文件
const pathToFileName = (path: string) =>
  path.replace(/^\//, '').replace(/\//g, '-') || 'index'

const routeToFileName = (route: ReturnType<typeof useRoute>): string => {
  // 取 matched 中最后一个路由的 path（模板路径，含 :id 占位符）
  const matched = route.matched
  if (matched.length === 0) return pathToFileName(route.path)

  const routePath = matched[matched.length - 1].path
  // 将动态参数段替换为语义化名称，如 :id → detail
  const normalized = routePath
    .replace(/^\//, '')
    .replace(/\/:id$/, '-detail')      // /task/:id → task-detail
    .replace(/\/:id\//, '-detail-')    // /task/:id/sub → task-detail-sub
    .replace(/:[^/]+/g, 'detail')      // 其他动态参数兜底
    .replace(/\//g, '-')

  return normalized || 'index'
}

export function useAnnotation() {
  const route = useRoute()

  const annotationTarget = () => {
    if (route.name === 'versionPrototype') {
      return {
        versionId: String(route.params.versionId || ''),
        pageKey: String(route.params.pageKey || '')
      }
    }
    return { versionId: '', pageKey: routeToFileName(route) }
  }

  const ready = ref(false)
  const dataError = ref('')
  let generation = 0
  const loadAnnotations = async () => {
    const current = ++generation
    const { versionId, pageKey } = annotationTarget()
    ready.value = false
    dataError.value = ''
    annotations.value = []
    pageTitle.value = ''
    try {
      await writes
      if (generation !== current) return
      const url = annotationLoadUrl({ baseUrl: import.meta.env.BASE_URL, versionId: versionId || null, pageKey })
      const response = await fetch(url, {cache:'no-store'})
      if (response.ok && !response.headers.get('content-type')?.includes('text/html')) {
        const data: PageAnnotation = await response.json()
        if (generation !== current) return
        if (!Array.isArray(data.annotations)) throw new Error('标注数据格式错误')
        annotations.value = data.annotations
        pageTitle.value = data.title || ''
      } else if (!response.ok && response.status !== 404) throw new Error(String(response.status))
      if (generation === current) ready.value = true
    } catch {
      if (generation === current) dataError.value = '读取标注失败，请刷新后重试'
    }
  }

  /** 保存标注数据到文件（通过 viteAnnotationPlugin 中间件写入磁盘） */
  const saveAnnotations = async () => {
    const { versionId, pageKey } = annotationTarget()
    const data: PageAnnotation = {
      ...(versionId ? { versionId } : {}),
      page: pageKey,
      title: pageTitle.value || pageKey,
      updatedAt: new Date().toISOString().split('T')[0],
      annotations: annotations.value
    }
    // 在入队时固定版本、页面和内容，连续拖动或切页时仍按操作顺序落盘。
    const body = JSON.stringify(data)
    const current = generation
    writes = writes.then(async () => {
      const result = await fetch('/__annotation_save__', {
        method:'POST', headers:{'Content-Type':'application/json'}, body
      })
      if (!result.ok) throw new Error(String(result.status))
      if (current === generation) dataError.value = ''
    }).catch(() => { dataError.value = pageKey + ' 的标注未保存，请检查本地服务后重试' })
  }

  const addAnnotation = (item: AnnotationItem) => {
    if (!ready.value || !editMode.value || !import.meta.env.DEV) return
    annotations.value.push(item)
    saveAnnotations()
  }

  const updateAnnotation = (id: string, updates: Partial<AnnotationItem>) => {
    if (!ready.value || !editMode.value || !import.meta.env.DEV) return
    const idx = annotations.value.findIndex(a => a.id === id)
    if (idx > -1) {
      annotations.value[idx] = { ...annotations.value[idx], ...updates }
      saveAnnotations()
    }
  }

  const removeAnnotation = (id: string) => {
    if (!ready.value || !editMode.value || !import.meta.env.DEV) return
    annotations.value = annotations.value.filter(a => a.id !== id)
    saveAnnotations()
  }

  watch(() => route.path, () => {
    activeId.value = ''
    editMode.value = false
    void loadAnnotations()
  }, {immediate:true, flush:'sync'})
  onUnmounted(() => { generation++; setEditMode(false) })

  return {
    visible, editMode, activeId, annotations, pageTitle,
    visibleCount, ready, dataError, loadAnnotations, addAnnotation, updateAnnotation,
    removeAnnotation, toggleVisible, toggleEditMode
  }
}
