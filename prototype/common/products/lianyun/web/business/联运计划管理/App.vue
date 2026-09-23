<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { TmsWebShell } from '../../../../../shared/web/tms-web-shell/index.js'
import PlanStatusTabs from './components/PlanStatusTabs.vue'
import PlanFilterBar from './components/PlanFilterBar.vue'
import PlanToolbar from './components/PlanToolbar.vue'
import PlanCard from './components/PlanCard.vue'
import PlanPagination from './components/PlanPagination.vue'
import { statusTabs, plans as mockPlans, paginationMeta } from './mock-data'
import './multimodal-plan.css'

/* —— 顶部栏 / 系统框架数据（复用共享框架）—— */
const siteName = '楹联集运站'
const organizationName = '企业名称企业名称企业企业名称...'
const dateText = '2022 年 05 月 27 日'
const weatherText = '24℃ 多云'
const tabs = [{ key: 'multimodalPlan', label: '联运计划' }]
const shellScale = 0.85

const navItems = [
  {
    key: 'plan', label: '联运计划', left: 0, top: 0, width: 32, height: 32,
    imgs: [
      { src: '/tms-web-shell-assets/Vector_26_236.svg', x: 3.2, y: 3.2, w: 13.5, h: 13.9 },
      { src: '/tms-web-shell-assets/Vector_26_237.svg', x: 7.4, y: 16.1, w: 13.6, h: 12.7 },
      { src: '/tms-web-shell-assets/Vector_26_238.svg', x: 17.1, y: 4.4, w: 11.7, h: 15 },
    ],
  },
  {
    key: 'other', label: '其他', left: 1, top: 87, width: 30, height: 30,
    imgs: [{ src: '/tms-web-shell-assets/Group_26_241.svg', x: 3.75, y: 3.43, w: 22, h: 22.5 }],
    badge: { x: 13.9, y: 2.6, w: 9, h: 9 },
  },
]

/* —— 页面级状态 —— */
const activeStatus = ref('全部')
const filters = ref({ keyword: '', creator: '' })
const planList = ref(mockPlans.map(p => ({ ...p, expanded: false })))
const page = ref(paginationMeta.current)

const visiblePlans = computed(() => {
  return planList.value.filter(p => {
    if (activeStatus.value !== '全部' && p.status !== activeStatus.value) return false
    if (filters.value.keyword) {
      const k = filters.value.keyword.toLowerCase()
      if (!p.id.toLowerCase().includes(k) && !p.title.toLowerCase().includes(k)) return false
    }
    if (filters.value.creator && p.creator !== filters.value.creator) return false
    return true
  })
})

function onFilterSearch(f) {
  filters.value = { keyword: f.keyword || '', creator: f.creator || '' }
  ElMessage.success(`查询完成，共 ${visiblePlans.value.length} 条`)
}
function onFilterReset() {
  filters.value = { keyword: '', creator: '' }
}

function toggleExpand(plan) {
  const item = planList.value.find(p => p.id === plan.id)
  if (item) item.expanded = !item.expanded
}

/* —— 操作（二次确认）—— */
function onAction({ name, plan }) {
  switch (name) {
    case '删除':
      confirmBox('删除联运计划', `确认删除「${plan.title}」？删除后不可恢复。`, () => {
        const idx = planList.value.findIndex(p => p.id === plan.id)
        if (idx >= 0) planList.value.splice(idx, 1)
        ElMessage.success('已删除')
      })
      break
    case '暂停':
      confirmBox('暂停联运计划', `确认暂停「${plan.title}」？`, () => {
        setStatus(plan, '已暂停')
        ElMessage.success('已暂停')
      })
      break
    case '开启':
      confirmBox('开启联运计划', `确认开启「${plan.title}」？`, () => {
        setStatus(plan, '生效中')
        ElMessage.success('已开启')
      })
      break
    case '作废':
      confirmBox('作废联运计划', `确认作废「${plan.title}」？`, () => {
        setStatus(plan, '已作废')
        ElMessage.success('已作废')
      })
      break
    case '编辑':
      ElMessage.info(`编辑：${plan.id}`)
      break
    case '详情':
      ElMessage.info(`查看详情：${plan.id}`)
      break
    default:
      ElMessage.info(`${name}：${plan.id}`)
  }
}

function setStatus(plan, status) {
  const item = planList.value.find(p => p.id === plan.id)
  if (item) item.status = status
}

function confirmBox(title, message, action) {
  ElMessageBox.confirm(message, title, {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(() => action()).catch(() => {})
}

/* —— 工具栏 —— */
const router = useRouter()
function onCreate() {
  router.push({ name: 'multimodalCreate' })
}
function onExport() {
  ElMessage.info('导出联运计划')
}

/* —— 系统框架事件 —— */
function onMenuSelect() {}
function goWorkbench() {}
function closeTab() {}
function switchTab() {}
function onNavigate() {}
</script>

<template>
  <div class="multimodal-plan-viewport">
    <div class="multimodal-plan-stage">
      <TmsWebShell
        :site-name="siteName"
        :organization-name="organizationName"
        :date-text="dateText"
        :weather-text="weatherText"
        :active-menu="'dashboard'"
        :tabs="tabs"
        :active-tab-key="'multimodalPlan'"
        :nav-items="navItems"
        :active-nav="'plan'"
        :scale="shellScale"
        @menu-select="onMenuSelect"
        @go-workbench="goWorkbench"
        @close-tab="closeTab"
        @switch-tab="switchTab"
        @navigate="onNavigate"
      >
        <template #logo>
          <span class="lp-logo-text">至简集运</span>
        </template>
        <template #avatar>
          <img class="lp-top-avatar" src="/tms-web-shell-assets/af74f762675bd2d9a53df99aaaab41f3519de48b.png" alt="企业头像" />
        </template>
        <template #weather-icon>
          <span class="lp-weather-glyph" aria-hidden="true">☀</span>
        </template>
        <template #actions>
          <img src="/tms-web-shell-assets/Group_26_152.svg" class="lp-top-icon" alt="" />
          <img src="/tms-web-shell-assets/Vector_26_158.svg" class="lp-top-icon" alt="" />
        </template>
        <template #home-icon>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="8.4" y="0.6" width="7" height="7" rx="1.2" fill="#909499" />
            <rect x="0" y="0.6" width="7" height="7" rx="1.2" fill="#909499" />
            <rect x="8.4" y="8.2" width="7" height="7" rx="1.2" fill="#909499" />
            <rect x="0" y="8.2" width="7" height="7" rx="1.2" fill="#909499" />
          </svg>
        </template>

        <div class="multimodal-plan-page">
          <PlanStatusTabs :tabs="statusTabs" :active-key="activeStatus" @change="activeStatus = $event" />
          <PlanFilterBar @search="onFilterSearch" @reset="onFilterReset" />
          <PlanToolbar @create="onCreate" @export="onExport" />

          <div class="plan-list">
            <PlanCard
              v-for="plan in visiblePlans"
              :key="plan.id"
              :plan="plan"
              :expanded="plan.expanded"
              @toggle-expand="toggleExpand"
              @action="onAction"
            />
          </div>
          <div v-if="!visiblePlans.length" class="plan-empty">暂无符合条件的联运计划</div>

          <PlanPagination
            :total="paginationMeta.total"
            :page-size="paginationMeta.pageSize"
            :current="page"
            :pages="paginationMeta.pages"
            @change="page = $event"
          />
        </div>
      </TmsWebShell>
    </div>
  </div>
</template>

<style scoped>
.multimodal-plan-viewport {
  width: 100%;
  min-height: calc(100vh - 48px);
  overflow: auto;
}
.multimodal-plan-stage {
  width: 1920px;
  transform-origin: left top;
}
.lp-logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #1d2129;
  letter-spacing: 1px;
}
.lp-top-avatar { width: 34px; height: 34px; border-radius: 50%; }
.lp-weather-glyph { font-size: 18px; }
.lp-top-icon { width: 24px; height: 24px; }
</style>
