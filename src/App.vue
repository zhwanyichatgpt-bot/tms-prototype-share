<template>
  <div class="app-shell">
    <VersionManageView v-if="appView === 'manage'" />
    <ReviewEntryView v-else-if="appView === 'entry'" />
    <template v-else>
      <el-container class="app-container">
      <el-header v-if="currentPage === 'home'" class="app-header">
        <div class="header-inner">
          <h1 class="app-title">全部原型</h1>
          <p class="app-sub">项目当前登记的全部原型页面，包括尚未纳入研发版本的内容</p>
        </div>
        <el-button v-if="route.name === 'prototypeCatalog'" @click="router.push({ name: 'versionManage' })">返回版本管理</el-button>
      </el-header>

      <el-main
        class="app-main"
        :class="{
          'no-header': currentPage !== 'home',
          'waybill-workbench-main': currentPage === 'waybillManage',
        }"
      >
        <!-- 首页导航 -->
        <div v-if="isVersionWorkbench && versionWorkbenchLoading" class="workbench-loading">
          <el-skeleton :rows="8" animated />
        </div>

        <el-result
          v-else-if="isVersionWorkbench && versionWorkbenchError"
          icon="error"
          title="版本读取失败"
          :sub-title="versionWorkbenchError"
        />

        <div v-else-if="currentPage === 'home'" class="home-view">
          <p class="home-tip">点击下方卡片进入对应原型页面</p>

          <!-- 通用功能 · Web 端 -->
          <h2 class="category-title">通用功能</h2>
          <p class="category-desc">TMS 3.0 核心业务能力，适用于所有项目</p>
          <div class="subcategory-title">Web 端</div>
          <el-row :gutter="16">
            <el-col
              v-for="page in generalWebPages"
              :key="page.key"
              :xs="24"
              :sm="12"
              :md="8"
            >
              <div
                class="page-card-wrapper"
                :class="{ disabled: page.status !== 'ready' }"
                @click="openPage(page)"
              >
                <el-card shadow="hover" class="page-card">
                  <div class="page-card-body">
                    <div class="page-meta">
                      <div class="page-name">{{ page.name }}</div>
                      <div class="page-module">{{ page.module }}</div>
                      <div class="page-status">
                        <el-tag v-if="page.status === 'ready'" type="success" size="small">已就绪</el-tag>
                        <el-tag v-else type="info" size="small">待迁移</el-tag>
                      </div>
                    </div>
                  </div>
                </el-card>
              </div>
            </el-col>
          </el-row>

          <!-- 通用功能 · 移动端 (如有) -->
          <template v-if="generalMobilePages.length">
            <div class="subcategory-title" style="margin-top: 24px">移动端</div>
            <el-row :gutter="16">
              <el-col
                v-for="page in generalMobilePages"
                :key="page.key"
                :xs="24"
                :sm="12"
                :md="8"
              >
                <div
                  class="page-card-wrapper"
                  :class="{ disabled: page.status !== 'ready' }"
                  @click="openPage(page)"
                >
                  <el-card shadow="hover" class="page-card mobile">
                    <div class="page-card-body">
                      <div class="page-meta">
                        <div class="page-name">{{ page.name }}</div>
                        <div class="page-module">{{ page.module }}</div>
                        <div class="page-status">
                          <el-tag v-if="page.status === 'ready'" type="success" size="small">已就绪</el-tag>
                          <el-tag v-else type="info" size="small">待迁移</el-tag>
                        </div>
                      </div>
                    </div>
                  </el-card>
                </div>
              </el-col>
            </el-row>
          </template>

          <!-- 北港水运1.0.3.4 -->
          <h2 class="category-title" style="margin-top: 36px">北港水运1.0.3.4</h2>
          <p class="category-desc">北港水运专项 · 水运计划与承运商企业移动端社会运力采购闭环</p>
          <el-row :gutter="16">
            <el-col
              v-for="page in beigangPages"
              :key="page.key"
              :xs="24"
              :sm="12"
              :md="8"
            >
              <div
                class="page-card-wrapper"
                :class="{ disabled: page.status !== 'ready' }"
                @click="openPage(page)"
              >
                <el-card shadow="hover" class="page-card" :class="{ mobile: page.platform === 'mobile' }">
                  <div class="page-card-body">
                    <div class="page-meta">
                      <div class="page-name">{{ page.name }}</div>
                      <div class="page-module">{{ page.module }}</div>
                      <div class="page-status">
                        <el-tag v-if="page.status === 'ready'" type="success" size="small">已就绪</el-tag>
                        <el-tag v-else type="info" size="small">待迁移</el-tag>
                      </div>
                    </div>
                  </div>
                </el-card>
              </div>
            </el-col>
          </el-row>

          <!-- 项目定制 -->
          <h2 class="category-title" style="margin-top: 36px">项目定制</h2>
          <p class="category-desc">针对特定客户（如广林项目）的定制化功能，基于通用能力扩展</p>
          <el-row :gutter="16">
            <el-col
              v-for="page in customPages"
              :key="page.key"
              :xs="24"
              :sm="12"
              :md="8"
            >
              <div
                class="page-card-wrapper"
                :class="{ disabled: page.status !== 'ready' }"
                @click="openPage(page)"
              >
                <el-card shadow="hover" class="page-card custom">
                  <div class="page-card-body">
                    <div class="page-meta">
                      <div class="page-name">{{ page.name }}</div>
                      <div class="page-module">{{ page.module }}</div>
                      <div class="page-status">
                        <el-tag v-if="page.status === 'ready'" type="success" size="small">已就绪</el-tag>
                        <el-tag v-else type="info" size="small">待迁移</el-tag>
                      </div>
                    </div>
                  </div>
                </el-card>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 原型验证工作台：48px工具栏 + 左侧目录 + 画布（Web 端与移动端页面统一接入）-->
        <div
          v-else-if="currentPage !== 'home'"
          class="prototype-workbench"
          :class="{
            'directory-collapsed': directoryMode !== 'overlay' && directoryCollapsed,
            'directory-overlay': directoryMode === 'overlay',
            'directory-overlay-open': directoryMode === 'overlay' && directoryOverlayOpen,
          }"
        >
          <header class="prototype-workbench-toolbar">
            <button type="button" class="workbench-project" @click="goHome">
              <span class="workbench-project-mark">T</span>
              <span class="workbench-project-name">{{ versionContext?.name || 'TMS 3.0 原型' }}</span>
            </button>

            <div class="workbench-current-page">
              <button
                v-if="directoryMode === 'overlay'"
                type="button"
                class="directory-overlay-trigger"
                aria-label="展开原型目录"
                title="展开原型目录"
                @click="directoryOverlayOpen = true"
              >☰</button>
              <span class="workbench-current-label">{{ versionContext ? `${versionRevisionLabel} · 当前页面` : '当前页面' }}</span>
              <strong>{{ activeWorkbenchName }}</strong>
            </div>

            <div v-if="!isRequirementCatalog" class="workbench-annotation-actions">
              <button
                type="button"
                class="workbench-annotation-toggle"
                :class="{ active: annotationVisible }"
                :aria-pressed="annotationVisible"
                @click="toggleAnnotationVisible"
              >
                <span class="workbench-annotation-icon" aria-hidden="true">●</span>
                <span>原型标注</span>
                <span class="workbench-annotation-count">{{ annotationCount }}</span>
              </button>

              <button
                v-if="annotationCanEdit"
                type="button"
                class="workbench-annotation-edit"
                :class="{ active: annotationEditing }"
                :aria-pressed="annotationEditing"
                @click="toggleAnnotationEditing"
              >
                <span class="workbench-annotation-edit-icon" aria-hidden="true">✎</span>
                <span>标注编辑</span>
              </button>
            </div>

          </header>

          <button
            v-if="directoryMode === 'overlay' && directoryOverlayOpen"
            type="button"
            class="directory-overlay-mask"
            aria-label="关闭原型目录"
            @click="directoryOverlayOpen = false"
          />

          <aside class="prototype-directory" aria-label="原型目录">
            <div class="directory-header">
              <div v-if="directoryContentVisible" class="directory-header-main">
                <strong>原型目录</strong>
                <span>{{ isVersionWorkbench ? `${workbenchPages.length + 1} 项` : `${workbenchPages.length} 个页面` }}</span>
              </div>
              <button
                type="button"
                class="directory-collapse-toggle"
                :aria-label="directoryToggleLabel"
                :aria-expanded="directoryExpanded"
                :title="directoryToggleLabel"
                @click="togglePrototypeDirectory"
              >{{ directoryToggleIcon }}</button>
            </div>

            <template v-if="directoryContentVisible">
              <div v-if="isVersionWorkbench" class="directory-section">
                <div class="directory-section-header version-directory-heading">
                  <span class="directory-section-title">当前版本</span>
                  <span class="version-directory-revision">{{ versionRevisionLabel }}</span>
                </div>
                <div class="directory-section-body">
                  <button
                    type="button"
                    class="directory-item"
                    :class="{ active: isRequirementCatalog }"
                    @click="openRequirementCatalog"
                  >
                    <span class="directory-item-dot" />
                    <span class="directory-item-name">需求目录</span>
                  </button>
                  <button
                    v-for="page in workbenchPages"
                    :key="page.key"
                    type="button"
                    class="directory-item"
                    :class="{ active: currentPage === page.key, disabled: page.status !== 'ready' }"
                    :disabled="page.status !== 'ready'"
                    @click="openPage(page)"
                  >
                    <span class="directory-item-dot" />
                    <span class="directory-item-name">{{ page.name }}</span>
                  </button>
                </div>
              </div>

              <template v-else>
              <div class="directory-section">
                <div
                  class="directory-section-header"
                  role="button"
                  :aria-expanded="!collapsedSections.generalWeb"
                  @click="toggleSection('generalWeb')"
                >
                  <span class="directory-section-title">通用功能 · Web 端</span>
                  <span class="directory-section-arrow" :class="{ 'is-collapsed': collapsedSections.generalWeb }">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </div>
                <div v-show="!collapsedSections.generalWeb" class="directory-section-body">
                  <button
                    v-for="page in generalWebPages"
                    :key="page.key"
                    type="button"
                    class="directory-item"
                    :class="{ active: currentPage === page.key, disabled: page.status !== 'ready' }"
                    :disabled="page.status !== 'ready'"
                    @click="openPage(page)"
                  >
                    <span class="directory-item-dot" />
                    <span class="directory-item-name">{{ page.name }}</span>
                  </button>
                </div>
              </div>

              <div v-if="generalMobilePages.length" class="directory-section">
                <div
                  class="directory-section-header"
                  role="button"
                  :aria-expanded="!collapsedSections.generalMobile"
                  @click="toggleSection('generalMobile')"
                >
                  <span class="directory-section-title">通用功能 · 移动端</span>
                  <span class="directory-section-arrow" :class="{ 'is-collapsed': collapsedSections.generalMobile }">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </div>
                <div v-show="!collapsedSections.generalMobile" class="directory-section-body">
                  <button
                    v-for="page in generalMobilePages"
                    :key="page.key"
                    type="button"
                    class="directory-item"
                    :class="{ active: currentPage === page.key, disabled: page.status !== 'ready' }"
                    :disabled="page.status !== 'ready'"
                    @click="openPage(page)"
                  >
                    <span class="directory-item-dot" />
                    <span class="directory-item-name">{{ page.name }}</span>
                  </button>
                </div>
              </div>

              <div v-if="beigangPages.length" class="directory-section">
                <div
                  class="directory-section-header"
                  role="button"
                  :aria-expanded="!collapsedSections.beigang"
                  @click="toggleSection('beigang')"
                >
                  <span class="directory-section-title">北港水运1.0.3.4</span>
                  <span class="directory-section-arrow" :class="{ 'is-collapsed': collapsedSections.beigang }">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </div>
                <div v-show="!collapsedSections.beigang" class="directory-section-body">
                  <button
                    v-for="page in beigangPages"
                    :key="page.key"
                    type="button"
                    class="directory-item"
                    :class="{ active: currentPage === page.key, disabled: page.status !== 'ready' }"
                    :disabled="page.status !== 'ready'"
                    @click="openPage(page)"
                  >
                    <span class="directory-item-dot" />
                    <span class="directory-item-name">{{ page.name }}</span>
                  </button>
                </div>
              </div>

              <div class="directory-section">
                <div
                  class="directory-section-header"
                  role="button"
                  :aria-expanded="!collapsedSections.custom"
                  @click="toggleSection('custom')"
                >
                  <span class="directory-section-title">项目定制</span>
                  <span class="directory-section-arrow" :class="{ 'is-collapsed': collapsedSections.custom }">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </div>
                <div v-show="!collapsedSections.custom" class="directory-section-body">
                  <button
                    v-for="page in customPages"
                    :key="page.key"
                    type="button"
                    class="directory-item"
                    :class="{ active: currentPage === page.key, disabled: page.status !== 'ready' }"
                    :disabled="page.status !== 'ready'"
                    @click="openPage(page)"
                  >
                    <span class="directory-item-dot" />
                    <span class="directory-item-name">{{ page.name }}</span>
                  </button>
                </div>
              </div>
              </template>
            </template>
          </aside>

          <div class="prototype-workbench-canvas">
            <VersionRequirementView
              v-if="isRequirementCatalog"
              :version="versionContext"
              :changes="versionChanges"
              :pages="versionWorkbenchPages"
              :projects="versionProjects"
            />
            <component :is="currentComponent" v-else />
          </div>
        </div>
      </el-main>
      </el-container>
      <AnnotationOverlay v-if="currentPage !== 'home' && !isRequirementCatalog" />
    </template>
  </div>
</template>

<script setup>
import { shallowRef, computed, defineAsyncComponent, onMounted, onUnmounted, nextTick, ref, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElCard, ElCol, ElContainer, ElHeader, ElMain, ElRow, ElButton, ElTag } from 'element-plus'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/tag/style/css'
import { prototypeStore, setCurrentPage } from './shared/prototype-store'
import { pageLoaders, pages } from './page-registry'
import { useAnnotationControl } from './components/Annotation/useAnnotation'
import ReviewEntryView from './views/ReviewEntryView.vue'
import VersionManageView from './views/VersionManageView.vue'
import VersionRequirementView from './views/VersionRequirementView.vue'
import { createReviewDataClient } from './review/review-data-client.mjs'
import { formatRevisionLabel } from './review/review-ui-policy.mjs'
import {
  REQUIREMENT_CATALOG_KEY,
  resolveVersionWorkbench,
} from './review/version-workbench.mjs'

const route = useRoute()
const router = useRouter()
const reviewClient = createReviewDataClient()
const appView = computed(() => route.meta.view || 'legacy')
const isVersionWorkbench = computed(() => appView.value === 'reviewPrototype')
const versionContext = ref(null)
const versionChanges = ref({ revisions: [] })
const versionProjects = ref([])
const versionWorkbenchPages = ref([])
const versionWorkbenchLoading = ref(false)
const versionWorkbenchError = ref('')
const {
  visible: annotationVisible,
  editMode: annotationEditing,
  annotations: annotationItems,
  setEditMode: setAnnotationEditing,
  toggleVisible: toggleAnnotationVisible,
  toggleEditMode: toggleAnnotationEditing,
} = useAnnotationControl()
const annotationCanEdit = computed(() => import.meta.env.DEV)
const annotationCount = computed(() => annotationItems.value.length)
const AnnotationOverlay = defineAsyncComponent(
  () => import('./components/Annotation/AnnotationOverlay.vue'),
)

// 监听子页面发出的返回首页事件
function handleGoHome() {
  goHome()
}

// 监听子页面发出的跨页面跳转事件
function handleOpenCustomPage(e) {
  const key = e.detail?.key
  if (key) {
    const targetPage = pages.find(p => p.key === key) || { key, status: 'ready' }
    openPage(targetPage)
  }
}

onMounted(() => {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }
  window.addEventListener('prototype-go-home', handleGoHome)
  window.addEventListener('prototype-open-page', handleOpenCustomPage)
  window.addEventListener('resize', syncDirectoryMode)

  if (appView.value !== 'legacy') {
    resetViewportScroll()
    return
  }

  // 页面首次加载/刷新：优先使用路由，兼容旧的 ?page=xxx 地址
  const initialKey = route.meta.pageKey || prototypeStore.currentPage
  if (initialKey === 'home') {
    currentComponent.value = null
    setCurrentPage('home')
  }
  if (initialKey && initialKey !== 'home') {
    const targetPage = pages.find(p => p.key === initialKey) || { key: initialKey, status: 'ready' }
    openPage(targetPage)
  }

  resetViewportScroll()
})
onUnmounted(() => {
  window.removeEventListener('prototype-go-home', handleGoHome)
  window.removeEventListener('prototype-open-page', handleOpenCustomPage)
  window.removeEventListener('resize', syncDirectoryMode)
})

const workbenchPages = computed(() => isVersionWorkbench.value ? versionWorkbenchPages.value : pages)
const generalWebPages = computed(() => workbenchPages.value.filter(p => p.category === 'general' && p.platform === 'web'))
const generalMobilePages = computed(() => workbenchPages.value.filter(p => p.category === 'general' && p.platform === 'mobile'))
const beigangPages = computed(() => workbenchPages.value.filter(p => p.category === 'beigang'))
const customPages = computed(() => workbenchPages.value.filter(p => p.category === 'custom'))

const collapsedSections = reactive({
  generalWeb: false,
  generalMobile: false,
  beigang: false,
  custom: false,
})

function toggleSection(key) {
  collapsedSections[key] = !collapsedSections[key]
}

const currentComponent = shallowRef(null)
const directoryMode = ref(getDirectoryMode(window.innerWidth))
const directoryCollapsed = ref(directoryMode.value === 'compact')
const directoryOverlayOpen = ref(false)

// 响应式读取当前页（来自 store）
const currentPage = computed(() => prototypeStore.currentPage)
const activePage = computed(() => workbenchPages.value.find(p => p.key === currentPage.value))
const isRequirementCatalog = computed(() => (
  isVersionWorkbench.value && currentPage.value === REQUIREMENT_CATALOG_KEY
))
const activeWorkbenchName = computed(() => (
  isRequirementCatalog.value ? '需求目录' : activePage.value?.name
))
const versionRevisionLabel = computed(() => formatRevisionLabel(versionContext.value?.revision))
const directoryContentVisible = computed(() => directoryMode.value === 'overlay' || !directoryCollapsed.value)
const directoryExpanded = computed(() => (
  directoryMode.value === 'overlay' ? directoryOverlayOpen.value : !directoryCollapsed.value
))
const directoryToggleLabel = computed(() => {
  if (directoryMode.value === 'overlay') return '关闭原型目录'
  return directoryCollapsed.value ? '展开原型目录' : '收起原型目录'
})
const directoryToggleIcon = computed(() => {
  if (directoryMode.value === 'overlay') return '×'
  return directoryCollapsed.value ? '›' : '‹'
})

function getDirectoryMode(width) {
  if (width < 1100) return 'overlay'
  if (width < 1440) return 'compact'
  return 'wide'
}

function syncDirectoryMode() {
  const nextMode = getDirectoryMode(window.innerWidth)
  if (nextMode === directoryMode.value) return
  directoryMode.value = nextMode
  directoryOverlayOpen.value = false
  directoryCollapsed.value = nextMode === 'compact'
}

function resetViewportScroll() {
  nextTick(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  })
}

function openPage(page) {
  if (page.status !== 'ready') return
  if (isVersionWorkbench.value && !workbenchPages.value.some(item => item.key === page.key)) return
  if (isVersionWorkbench.value && route.params.pageKey !== page.key) {
    router.push({
      name: 'versionPrototype',
      params: { versionId: route.params.versionId, pageKey: page.key },
    })
    return
  }
  if (!isVersionWorkbench.value && route.meta.pageKey !== page.key) {
    router.push({ name: page.key })
    return
  }
  const loader = pageLoaders[page.key]
  if (!loader) return
  loader().then(comp => {
    currentComponent.value = comp
    setCurrentPage(page.key)
    resetViewportScroll()
  }).catch(err => {
    console.error('[openPage] load failed', err)
  })
}

function openRequirementCatalog() {
  if (!isVersionWorkbench.value) return
  if (route.params.pageKey) {
    router.push({ name: 'versionReview', params: { versionId: route.params.versionId } })
    return
  }
  currentComponent.value = null
  setCurrentPage(REQUIREMENT_CATALOG_KEY)
  resetViewportScroll()
}

function goHome() {
  if (isVersionWorkbench.value) {
    router.push({ name: 'versionReview', params: { versionId: route.params.versionId } })
    return
  }
  if (route.meta.pageKey !== 'home') {
    router.push({ name: 'prototypeCatalog' })
    return
  }
  currentComponent.value = null
  setCurrentPage('home')
  resetViewportScroll()
}

watch(() => route.meta.pageKey, (pageKey) => {
  if (appView.value !== 'legacy') return
  if (!pageKey || pageKey === 'home') {
    currentComponent.value = null
    setCurrentPage('home')
    resetViewportScroll()
    return
  }

  const targetPage = pages.find(page => page.key === pageKey)
  if (targetPage) openPage(targetPage)
})

async function loadVersionWorkbench() {
  if (!isVersionWorkbench.value) return
  versionWorkbenchLoading.value = true
  versionWorkbenchError.value = ''
  try {
    const [bundle, projectItems] = await Promise.all([
      reviewClient.getVersionBundle(String(route.params.versionId)),
      reviewClient.getProjects(),
    ])
    const pageKey = route.params.pageKey ? String(route.params.pageKey) : undefined
    const context = resolveVersionWorkbench(bundle.version, pageKey, pages)
    versionContext.value = bundle.version
    versionChanges.value = bundle.changes
    versionProjects.value = projectItems
    versionWorkbenchPages.value = context.pages
    if (context.activeKey === REQUIREMENT_CATALOG_KEY) {
      openRequirementCatalog()
    } else {
      openPage(context.activePage)
    }
  } catch (error) {
    console.warn('[version-workbench] 无法进入版本页面:', error)
    if (error?.code === 'PAGE_NOT_IN_VERSION' && route.params.pageKey) {
      router.replace({ name: 'versionReview', params: { versionId: route.params.versionId } })
    } else {
      versionWorkbenchError.value = error?.message || '版本数据读取失败'
    }
  } finally {
    versionWorkbenchLoading.value = false
  }
}

watch(
  () => [appView.value, route.params.versionId, route.params.pageKey],
  () => {
    if (isVersionWorkbench.value) loadVersionWorkbench()
  },
  { immediate: true },
)

function togglePrototypeDirectory() {
  if (directoryMode.value === 'overlay') {
    directoryOverlayOpen.value = false
    return
  }
  directoryCollapsed.value = !directoryCollapsed.value
}

</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f5f7fa;
}

.app-container {
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88px;
  padding: 0 32px;
  background: #ffffff;
  border-bottom: 1px solid #dcdfe6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.header-inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-title {
  font-size: 22px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0;
}

.app-sub {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.app-main {
  padding: 24px 32px 0;
}

.app-main.waybill-workbench-main {
  padding: 0;
}

.home-view {
  max-width: 1200px;
  margin: 0 auto;
}

.workbench-loading {
  max-width: 1120px;
  margin: 48px auto;
  padding: 32px;
  border: 1px solid #e5e9f0;
  border-radius: 8px;
  background: #ffffff;
}

.home-tip {
  font-size: 14px;
  color: #606266;
  margin: 0 0 20px;
}

.category-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2d3d;
  margin: 0 0 4px;
}

.category-desc {
  font-size: 12px;
  color: #909399;
  margin: 0 0 16px;
}

.subcategory-title {
  font-size: 14px;
  font-weight: 600;
  color: #4e5969;
  margin: 0 0 12px;
  padding-left: 8px;
  border-left: 3px solid #3a65ff;
  line-height: 18px;
}

.page-card-wrapper {
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.page-card-wrapper:hover .page-card {
  transform: translateY(-2px);
}

.page-card-wrapper.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.page-card-wrapper.disabled:hover .page-card {
  transform: none;
}

.page-card-body {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  font-size: 36px;
  line-height: 1;
}

.page-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.page-module {
  font-size: 12px;
  color: #909399;
}

.page-status {
  margin-top: 4px;
}

.prototype-workbench {
  /* 画布偏移量：供画布内弹窗约束定位消费（不盖工具栏、避让左侧目录）*/
  --canvas-toolbar-height: 48px;
  --canvas-offset-left: 232px;
  min-height: calc(100vh - 48px);
  background: #eef3f8;
}

.prototype-workbench-toolbar {
  position: fixed;
  z-index: 10000;
  top: 0;
  right: 0;
  left: 0;
  height: 48px;
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr) auto;
  align-items: center;
  background: #ffffff;
  border-bottom: 1px solid #e5e9f0;
  box-shadow: 0 1px 2px rgba(29, 41, 57, 0.04);
  transition: grid-template-columns 0.2s ease;
}

.workbench-project {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  border-right: 1px solid #edf0f4;
  background: transparent;
  color: #1f2937;
  cursor: pointer;
}

.workbench-project-mark {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #2468f2;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.workbench-project-name {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.version-directory-heading {
  cursor: default;
}

.version-directory-revision {
  color: #165dff;
  font-size: 11px;
  font-weight: 700;
}

.workbench-current-page {
  min-width: 0;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #273142;
  font-size: 14px;
}

.workbench-annotation-actions {
  margin-right: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.workbench-annotation-toggle,
.workbench-annotation-edit {
  height: 32px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #dfe4ec;
  border-radius: 6px;
  background: #ffffff;
  color: #475467;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
}

.workbench-annotation-toggle:hover,
.workbench-annotation-edit:hover {
  border-color: #9dbbf7;
  color: #165dff;
}

.workbench-annotation-toggle.active,
.workbench-annotation-edit.active {
  border-color: #2468f2;
  background: #eef4ff;
  color: #165dff;
}

.workbench-annotation-icon {
  font-size: 9px;
  color: #98a2b3;
}

.workbench-annotation-toggle.active .workbench-annotation-icon {
  color: #2468f2;
}

.workbench-annotation-edit-icon {
  font-size: 15px;
  line-height: 1;
}

.workbench-annotation-count {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #f2f4f7;
  color: #667085;
  font-size: 11px;
  font-weight: 600;
}

.workbench-annotation-toggle.active .workbench-annotation-count {
  background: #2468f2;
  color: #ffffff;
}

.directory-overlay-trigger {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dfe4ec;
  border-radius: 4px;
  background: #ffffff;
  color: #475467;
  font-size: 16px;
  cursor: pointer;
}

.directory-overlay-trigger:hover {
  border-color: #9dbbf7;
  color: #165dff;
}

.workbench-current-label {
  color: #98a2b3;
  font-size: 12px;
}

.prototype-directory {
  position: fixed;
  z-index: 60;
  top: 48px;
  bottom: 0;
  left: 0;
  width: 232px;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 16px 10px 24px;
  background: #ffffff;
  border-right: 1px solid #e5e9f0;
  transform: translateX(0);
  transition: width 0.2s ease, padding 0.2s ease, transform 0.2s ease;
}

.directory-overlay-mask {
  position: fixed;
  z-index: 55;
  top: 48px;
  right: 0;
  bottom: 0;
  left: 0;
  border: none;
  background: rgba(16, 24, 40, 0.22);
  cursor: default;
}

.directory-header {
  height: 34px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #273142;
  font-size: 14px;
}

.directory-header-main {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.directory-header span {
  color: #98a2b3;
  font-size: 12px;
  font-weight: 400;
}

.directory-collapse-toggle {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dfe4ec;
  border-radius: 4px;
  background: #ffffff;
  color: #667085;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.directory-collapse-toggle:hover {
  border-color: #9dbbf7;
  background: #f3f7ff;
  color: #165dff;
}

.directory-section {
  margin-top: 14px;
}

.directory-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 4px 9px;
  margin-bottom: 2px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease;
}

.directory-section-header:hover {
  background: #f0f2f5;
}

.directory-section-header:hover .directory-section-title {
  color: #475467;
}

.directory-section-title {
  padding: 0;
  color: #98a2b3;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  transition: color 0.15s ease;
}

.directory-section-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: #98a2b3;
  transition: transform 0.2s ease, color 0.15s ease;
}

.directory-section-header:hover .directory-section-arrow {
  color: #667085;
}

.directory-section-arrow.is-collapsed {
  transform: rotate(-90deg);
}

.directory-section-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.directory-item {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 9px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #475467;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.directory-item:hover {
  background: #f5f7fa;
  color: #1f2937;
}

.directory-item.active {
  background: #eef4ff;
  color: #165dff;
  font-weight: 600;
}

.directory-item.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.directory-item-dot {
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c4cad4;
}

.directory-item.active .directory-item-dot {
  background: #2468f2;
}

.directory-item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prototype-workbench-canvas {
  min-width: 980px;
  min-height: calc(100vh - 96px);
  margin-left: 232px;
  /* 统一避让外层 48px 工具栏：所有页面内容下移，不被工具栏遮挡 */
  padding-top: var(--canvas-toolbar-height, 48px);
  transition: margin-left 0.2s ease;
}

.prototype-workbench.directory-collapsed {
  --canvas-offset-left: 48px;
}

.prototype-workbench.directory-collapsed .prototype-workbench-toolbar {
  grid-template-columns: 48px minmax(0, 1fr) auto;
}

.prototype-workbench.directory-collapsed .workbench-project {
  padding: 0;
  justify-content: center;
}

.prototype-workbench.directory-collapsed .workbench-project-name {
  display: none;
}

.prototype-workbench.directory-collapsed .prototype-directory {
  width: 48px;
  padding: 12px 6px 24px;
}

.prototype-workbench.directory-collapsed .directory-header {
  padding: 0;
  justify-content: center;
}

.prototype-workbench.directory-collapsed .prototype-workbench-canvas {
  margin-left: 48px;
}

.prototype-workbench.directory-overlay {
  --canvas-offset-left: 0px;
}

.prototype-workbench.directory-overlay .prototype-workbench-toolbar {
  grid-template-columns: 48px minmax(0, 1fr) auto;
}

.prototype-workbench.directory-overlay .workbench-project {
  padding: 0;
  justify-content: center;
}

.prototype-workbench.directory-overlay .workbench-project-name {
  display: none;
}

.prototype-workbench.directory-overlay .prototype-directory {
  width: 232px;
  padding: 16px 10px 24px;
  transform: translateX(-100%);
  box-shadow: 10px 0 24px rgba(29, 41, 57, 0.12);
}

.prototype-workbench.directory-overlay-open .prototype-directory {
  transform: translateX(0);
}

.prototype-workbench.directory-overlay .prototype-workbench-canvas {
  margin-left: 0;
}

/* 项目定制卡片左侧橙色标记 */
.page-card.custom {
  border-left: 3px solid #f2870b;
}

/* 通用-移动端卡片左侧蓝色标记 */
.page-card.mobile {
  border-left: 3px solid #3a65ff;
}
</style>
