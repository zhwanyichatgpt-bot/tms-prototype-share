<template>
  <div class="app-shell">
    <el-container class="app-container">
      <el-header v-if="currentPage === 'home'" class="app-header">
        <div class="header-inner">
          <h1 class="app-title">TMS 3.0 原型验证</h1>
          <p class="app-sub">PM 工作流 · 原型迁移标准化（Vue 3 + Element Plus）</p>
        </div>
      </el-header>

      <el-main class="app-main" :class="{ 'no-header': currentPage !== 'home' }">
        <!-- 首页导航 -->
        <div v-if="currentPage === 'home'" class="home-view">
          <p class="home-tip">点击下方卡片进入对应原型页面</p>

          <!-- 通用功能 -->
          <h2 class="category-title">通用功能</h2>
          <p class="category-desc">TMS 3.0 核心业务能力，适用于所有项目</p>
          <el-row :gutter="16">
            <el-col
              v-for="page in generalPages"
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

        <!-- 动态加载的原型页面 -->
        <div v-else class="prototype-view">
          <component :is="currentComponent" />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { shallowRef, markRaw, computed, onMounted, onUnmounted, nextTick } from 'vue'
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
  resetViewportScroll()
})
onUnmounted(() => window.removeEventListener('prototype-go-home', handleGoHome))

// 原型页面注册表：key → 异步加载函数
// 每个原型页面在 prototype/<模块>/<页面>/App.vue
const pageLoaders = {
  waybillManage: () => import('../prototype/托运单管理/App.vue').then(m => markRaw(m.default)),
  inquiryHall: () => import('../prototype/询价大厅/App.vue').then(m => markRaw(m.default)),
  containerPlan: () => import('../prototype/集装箱运输计划创建/App.vue').then(m => markRaw(m.default)),
  multimodalManage: () => import('../prototype/联运计划管理页/App.vue').then(m => markRaw(m.default)),
  transportChannel: () => import('../prototype/运输通道管理/App.vue').then(m => markRaw(m.default)),
  multimodalCreate: () => import('../prototype/创建联运计划/App.vue').then(m => markRaw(m.default)),
  inquiryShipper: () => import('../prototype/广林询价三端/App.vue').then(m => markRaw(m.default)),
  shipperSettlement: () => import('../prototype/货主结算/App.vue').then(m => markRaw(m.default)),
  waybillQuote: () => import('../prototype/承运商报价/App.vue').then(m => markRaw(m.default)),
}

// 页面清单（首页卡片展示 + 状态标记）
// category: general 通用功能 / custom 项目定制
// status: ready 已迁完 / pending 待迁移
const pages = [
  // 通用功能
  { key: 'waybillManage', name: '托运单管理', module: '托运单管理 · 列表 + 创建', icon: '📦', status: 'ready', category: 'general' },
  { key: 'waybillQuote', name: '承运商报价', module: '托运单管理 · 报价页', icon: '💰', status: 'ready', category: 'general' },
  { key: 'inquiryHall', name: '货源大厅', module: '托运单管理 · 承运商报价入口', icon: '🏷️', status: 'ready', category: 'general' },
  { key: 'multimodalCreate', name: '创建联运计划', module: '多式联运', icon: '🚢', status: 'ready', category: 'general' },
  { key: 'multimodalManage', name: '联运计划管理', module: '多式联运', icon: '📋', status: 'ready', category: 'general' },
  { key: 'shipperSettlement', name: '货主结算', module: '多式联运', icon: '🧾', status: 'ready', category: 'general' },
  { key: 'containerPlan', name: '集装箱计划创建', module: '公路计划', icon: '🚂', status: 'ready', category: 'general' },
  { key: 'transportChannel', name: '运输通道管理', module: '运输通道', icon: '🛣️', status: 'ready', category: 'general' },
  // 项目定制
  { key: 'inquiryShipper', name: '货源询价（广林三端）', module: '广林项目定制 · 货主/无车承运人/承运商', icon: '📮', status: 'ready', category: 'custom' },
]

const generalPages = computed(() => pages.filter(p => p.category === 'general'))
const customPages = computed(() => pages.filter(p => p.category === 'custom'))

const currentComponent = shallowRef(null)

// 响应式读取当前页（来自 store）
const currentPage = computed(() => prototypeStore.currentPage)

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
  padding: 24px 32px;
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

.prototype-view {
  width: 100%;
}

/* 项目定制卡片左侧橙色标记 */
.page-card.custom {
  border-left: 3px solid #f2870b;
}
</style>
