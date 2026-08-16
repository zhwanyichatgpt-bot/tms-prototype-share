<template>
  <div class="app-shell">
    <el-container class="app-container">
      <el-header v-if="currentPage === 'home'" class="app-header">
        <div class="header-inner">
          <h1 class="app-title">TMS 3.0 原型验证</h1>
          <p class="app-sub">PM 工作流 · 原型迁移标准化（Vue 3 + Element Plus）</p>
        </div>
      </el-header>

      <el-main
        class="app-main"
        :class="{
          'no-header': currentPage !== 'home',
          'waybill-workbench-main': currentPage === 'waybillManage',
        }"
      >
        <!-- 首页导航 -->
        <div v-if="currentPage === 'home'" class="home-view">
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

          <!-- 通用功能 · 移动端 -->
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
              <span class="workbench-project-name">TMS 3.0 原型</span>
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
              <span class="workbench-current-label">当前页面</span>
              <strong>{{ activePage?.name }}</strong>
            </div>

            <div class="workbench-annotation-tools" aria-label="原型标注工具">
              <div class="prototype-annotation-toggle">
                <button id="toolbarAnnotationToggleBtn" class="btn" type="button">原型标注</button>
                <button id="toolbarAnnotationEditorBtn" type="button" hidden>新增标注</button>
                <button id="toolbarAnnotationPositionBtn" class="btn" type="button">调整标注</button>
              </div>
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
                <span>{{ pages.length }} 个页面</span>
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
              <div class="directory-section">
                <div class="directory-section-title">通用功能 · Web 端</div>
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

              <div class="directory-section">
                <div class="directory-section-title">通用功能 · 移动端</div>
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

              <div class="directory-section">
                <div class="directory-section-title">项目定制</div>
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
            </template>
          </aside>

          <div class="prototype-workbench-canvas">
            <component :is="currentComponent" />
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { shallowRef, markRaw, computed, onMounted, onUnmounted, nextTick, ref } from 'vue'
import { ElCard, ElCol, ElContainer, ElHeader, ElMain, ElRow, ElButton, ElTag } from 'element-plus'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/tag/style/css'
import { prototypeStore, setCurrentPage } from './shared/prototype-store'

// 监听子页面 WorkspaceShell 发出的返回首页事件
function handleGoHome() {
  currentComponent.value = null
  setCurrentPage('home')
  resetViewportScroll()
}
onMounted(() => {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }
  window.addEventListener('prototype-go-home', handleGoHome)
  window.addEventListener('resize', syncDirectoryMode)

  // 页面首次加载/刷新：若 URL 指定了 ?page=xxx 且非 home，自动加载对应组件
  const initialKey = prototypeStore.currentPage
  if (initialKey && initialKey !== 'home') {
    const targetPage = pages.find(p => p.key === initialKey) || { key: initialKey, status: 'ready' }
    openPage(targetPage)
  }

  resetViewportScroll()
})
onUnmounted(() => {
  window.removeEventListener('prototype-go-home', handleGoHome)
  window.removeEventListener('resize', syncDirectoryMode)
})

// 原型页面注册表：key → 异步加载函数
// 每个原型页面在 prototype/<模块>/<页面>/App.vue
const pageLoaders = {
  waybillManage: () => import('../prototype/托运单管理/App.vue').then(m => markRaw(m.default)),
  inquiryHall: () => import('../prototype/询价大厅/App.vue').then(m => markRaw(m.default)),
  containerPlan: () => import('../prototype/集装箱运输计划创建/App.vue').then(m => markRaw(m.default)),
  transportPlan: () => import('../prototype/运输计划/App.vue').then(m => markRaw(m.default)),
  multimodalManage: () => import('../prototype/联运计划管理页/App.vue').then(m => markRaw(m.default)),
  transportChannel: () => import('../prototype/运输通道管理/App.vue').then(m => markRaw(m.default)),
  multimodalCreate: () => import('../prototype/创建联运计划/App.vue').then(m => markRaw(m.default)),
  inquiryShipper: () => import('../prototype/广林询价三端/App.vue').then(m => markRaw(m.default)),
  shipperSettlement: () => import('../prototype/货主结算/App.vue').then(m => markRaw(m.default)),
  waybillQuote: () => import('../prototype/承运商报价/App.vue').then(m => markRaw(m.default)),
  shipownerMobileHome: () => import('../prototype/船东移动端/ShipownerHome.vue').then(m => markRaw(m.default)),
  cargoBiddingDetail: () => import('../prototype/船东移动端/CargoBiddingDetail.vue').then(m => markRaw(m.default)),
  biddingQuotePage: () => import('../prototype/船东移动端/BiddingQuotePage.vue').then(m => markRaw(m.default)),
}

// 页面清单（首页卡片展示 + 状态标记）
// category: general 通用功能 / custom 项目定制
// platform: web 通用-Web端 / mobile 通用-移动端（仅 category=general 时生效）
// status: ready 已迁完 / pending 待迁移
const pages = [
  // 通用功能 · Web 端
  { key: 'waybillManage', name: '托运单管理', module: '托运单管理 · 列表 + 创建', icon: '📦', status: 'ready', category: 'general', platform: 'web' },
  { key: 'waybillQuote', name: '承运商报价', module: '托运单管理 · 报价页', icon: '💰', status: 'ready', category: 'general', platform: 'web' },
  { key: 'inquiryHall', name: '货源大厅', module: '托运单管理 · 承运商报价入口', icon: '🏷️', status: 'ready', category: 'general', platform: 'web' },
  { key: 'multimodalCreate', name: '创建联运计划', module: '多式联运', icon: '🚢', status: 'ready', category: 'general', platform: 'web' },
  { key: 'multimodalManage', name: '联运计划管理', module: '多式联运', icon: '📋', status: 'ready', category: 'general', platform: 'web' },
  { key: 'transportPlan', name: '运输计划', module: '运输计划 · 列表', icon: '🚛', status: 'ready', category: 'general', platform: 'web' },
  { key: 'shipperSettlement', name: '货主结算', module: '多式联运', icon: '🧾', status: 'ready', category: 'general', platform: 'web' },
  { key: 'containerPlan', name: '集装箱计划创建', module: '公路计划', icon: '🚂', status: 'ready', category: 'general', platform: 'web' },
  { key: 'transportChannel', name: '运输通道管理', module: '运输通道', icon: '🛣️', status: 'ready', category: 'general', platform: 'web' },
  // 通用功能 · 移动端
  { key: 'shipownerMobileHome', name: '船东移动端', module: '移动端 H5 · 货源/运力大厅 + 竞价详情', icon: '📱', status: 'ready', category: 'general', platform: 'mobile' },
  { key: 'cargoBiddingDetail', name: '货源竞价详情页', module: '移动端 H5 · 货源竞价详情', icon: '📄', status: 'ready', category: 'general', platform: 'mobile' },
  { key: 'biddingQuotePage', name: '移动端报价填写页', module: '移动端 H5 · 参与竞价报价表单', icon: '📝', status: 'ready', category: 'general', platform: 'mobile' },
  // 项目定制
  { key: 'inquiryShipper', name: '货源询价（广林三端）', module: '广林项目定制 · 货主/无车承运人/承运商', icon: '📮', status: 'ready', category: 'custom' },
]

const generalWebPages = computed(() => pages.filter(p => p.category === 'general' && p.platform === 'web'))
const generalMobilePages = computed(() => pages.filter(p => p.category === 'general' && p.platform === 'mobile'))
const customPages = computed(() => pages.filter(p => p.category === 'custom'))

const currentComponent = shallowRef(null)
const directoryMode = ref(getDirectoryMode(window.innerWidth))
const directoryCollapsed = ref(directoryMode.value === 'compact')
const directoryOverlayOpen = ref(false)

// 响应式读取当前页（来自 store）
const currentPage = computed(() => prototypeStore.currentPage)
const activePage = computed(() => pages.find(p => p.key === currentPage.value))
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
  window.setTimeout(() => window.AnnotationCore?.refresh?.(), 220)
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
  console.log('[openPage] clicked', page.key, 'status=', page.status)
  if (page.status !== 'ready') return
  const loader = pageLoaders[page.key]
  console.log('[openPage] loader=', loader)
  if (!loader) return
  loader().then(comp => {
    console.log('[openPage] loaded component=', comp)
    currentComponent.value = comp
    setCurrentPage(page.key)
    resetViewportScroll()
  }).catch(err => {
    console.error('[openPage] load failed', err)
  })
}

function goHome() {
  currentComponent.value = null
  setCurrentPage('home')
  resetViewportScroll()
}

function togglePrototypeDirectory() {
  if (directoryMode.value === 'overlay') {
    directoryOverlayOpen.value = false
    window.setTimeout(() => window.AnnotationCore?.refresh?.(), 220)
    return
  }
  directoryCollapsed.value = !directoryCollapsed.value
  window.setTimeout(() => window.AnnotationCore?.refresh?.(), 220)
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
  z-index: 70;
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
  font-size: 14px;
  font-weight: 600;
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

.workbench-annotation-tools {
  height: 100%;
  padding: 0 16px;
  display: flex;
  align-items: center;
  border-left: 1px solid #edf0f4;
}

.prototype-annotation-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prototype-annotation-toggle .btn {
  height: 30px;
  padding: 0 13px;
  border: 1px solid #d8dee8;
  border-radius: 4px;
  background: #ffffff;
  color: #475467;
  font-size: 13px;
  cursor: pointer;
}

.prototype-annotation-toggle .btn:hover {
  border-color: #2468f2;
  color: #2468f2;
}

.prototype-annotation-toggle .btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
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

.directory-section-title {
  padding: 0 9px 7px;
  color: #98a2b3;
  font-size: 12px;
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

.prototype-workbench-canvas :deep(.ws-root) {
  min-height: calc(100vh - 48px);
  /* WorkspaceShell 自带 92px 业务品牌头（58顶栏+34tab条），画布已让 48px，这里只补 92px */
  padding-top: 92px;
}

.prototype-workbench-canvas :deep(.ws-topbar) {
  top: 48px;
  left: 232px;
  transition: left 0.2s ease;
}

.prototype-workbench-canvas :deep(.ws-workbench-row) {
  top: 106px;
  left: 232px;
  transition: left 0.2s ease;
}

.prototype-workbench-canvas :deep(.ws-sider) {
  top: 140px;
  left: 232px;
  transition: left 0.2s ease;
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

.prototype-workbench.directory-collapsed .prototype-workbench-canvas :deep(.ws-topbar),
.prototype-workbench.directory-collapsed .prototype-workbench-canvas :deep(.ws-workbench-row),
.prototype-workbench.directory-collapsed .prototype-workbench-canvas :deep(.ws-sider) {
  left: 48px;
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

.prototype-workbench.directory-overlay .prototype-workbench-canvas :deep(.ws-topbar),
.prototype-workbench.directory-overlay .prototype-workbench-canvas :deep(.ws-workbench-row),
.prototype-workbench.directory-overlay .prototype-workbench-canvas :deep(.ws-sider) {
  left: 0;
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
