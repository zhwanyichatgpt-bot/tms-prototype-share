<script setup>
/**
 * 北港运单中心 —— 页面主入口（北港水运定制：含卸货地址及运输单价变更）
 * 来源：prototype/common/business/web/运单中心，2026-08-27 起归集为北港项目专属页面。
 * 职责：组合公共系统框架 + 运单中心业务组件 + 页面级状态，不承载重复运单结构。
 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { openPrototypePage } from '../../../../src/review/prototype-navigation.mjs'
import { TmsWebShell } from '../../../common/business/web/_shared/tms-web-shell/index.js'
import TaskTopLogo from '../../../common/business/web/运输任务/components/TaskTopLogo.vue'
import WaybillKindTabs from './components/WaybillKindTabs.vue'
import WaybillStatusTabs from './components/WaybillStatusTabs.vue'
import WaybillFilterBar from './components/WaybillFilterBar.vue'
import WaybillTable from './components/WaybillTable.vue'
import WaybillPagination from './components/WaybillPagination.vue'
import AddressChangeDialog from './components/AddressChangeDialog.vue'
import { paginationMeta } from './mock-data'
import { buildWaybillRows, submitChange, getWaybill } from './address-change-store'
import './waybill-center.css'

/* —— 顶部栏 / 系统框架数据 —— */
const siteName = '至简集运'
const organizationName = '至简测试企业'
const dateText = '2026 年 08 月 25 日'
const weatherText = '27℃ 多云'
const tabs = [
  { key: 'waybillCenter', label: '运单中心' },
  { key: 'transportTemplate', label: '运输模板' },
  { key: 'containerDispatch', label: '集装箱调度3.0' },
]
const shellScale = 0.85

const navItems = [
  {
    key: 'task', label: '运输任务', left: 0, top: 0, width: 32, height: 32,
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
const kindTab = ref('normal')
const statusTab = ref('all')
const page = ref(paginationMeta.current)

/* 行数据从统一数据源派生（响应式）：提交/撤回后列表自动更新 */
const rows = computed(() => buildWaybillRows())

/* 按运单类型 tab（普通/委外）+ 状态 tab 过滤 */
const visibleRows = computed(() => {
  let list = rows.value
  if (kindTab.value === 'outsourced') list = list.filter(r => r.kindTab === 'outsourced')
  else if (kindTab.value === 'normal' || kindTab.value === 'platform') list = list.filter(r => r.kindTab === 'normal')
  if (statusTab.value !== 'all') list = list.filter(r => r.status === statusTab.value)
  return list
})

function onFilterSearch() {
  page.value = 1
}
function onFilterReset() {
  statusTab.value = 'all'
  page.value = paginationMeta.current
}

const router = useRouter()
const route = useRoute()

/* 地址变更弹窗 */
const addressChangeVisible = ref(false)
const addressChangeWaybillKey = ref('')

/* 抽屉打开时锁定页面滚动，只留抽屉自身滚动条 */
watch(addressChangeVisible, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})

function onAction({ row, action }) {
  if (action === '详情') {
    /* 携带运单标识，详情页加载同一张运单；版本感知导航，保留 versionId */
    openPrototypePage(router, route, 'waybillCenterDetailBeigang', { key: row.key })
  } else if (action === '地址变更') {
    addressChangeWaybillKey.value = row.key
    addressChangeVisible.value = true
  } else if (action === '查看地址变更' || action === '处理地址变更') {
    /* 处理中申请 / 实际承运商待处理：直接进详情地址变更页签；版本感知导航 */
    openPrototypePage(router, route, 'waybillCenterDetailBeigang', { key: row.key, tab: 'addressChange' })
  }
}

function onAddressChangeSubmit(payload) {
  /* 提交后生成处理中记录并联动：列表状态、禁止重复发起、详情页签同步 */
  const record = submitChange(payload.waybillKey, {
    id: `AC${Date.now()}`,
    time: payload.time,
    newAddress: payload.newAddress,
    newPrice: payload.newPrice,
    downstreamPrice: payload.downstreamPrice,
    reason: payload.reason,
    note: payload.note,
  })
  addressChangeVisible.value = false
  if (record) {
    const w = getWaybill(payload.waybillKey)
    const nextLabel = w.orgMode === 'direct' ? '待船东处理' : '待实际承运商处理'
    ElMessage.success(`已提交地址及运价变更，${nextLabel}`)
  }
}

/* 框架动作：原型层保持静态，不外跳 */
function goWorkbench() {}
function closeTab() {}
function switchTab() {}
function onNavigate() {}
function onMenuSelect() {}
</script>

<template>
  <div class="waybill-center-viewport">
    <div class="waybill-center-stage">
      <TmsWebShell
        :site-name="siteName"
        :organization-name="organizationName"
        :date-text="dateText"
        :weather-text="weatherText"
        :active-menu="'dashboard'"
        :tabs="tabs"
        :active-tab-key="'waybillCenter'"
        :nav-items="navItems"
        :active-nav="'task'"
        :scale="shellScale"
        @menu-select="onMenuSelect"
        @go-workbench="goWorkbench"
        @close-tab="closeTab"
        @switch-tab="switchTab"
        @navigate="onNavigate"
      >
        <template #logo>
          <TaskTopLogo />
        </template>
        <template #avatar>
          <img
            class="wc-top-avatar"
            src="/tms-web-shell-assets/af74f762675bd2d9a53df99aaaab41f3519de48b.png"
            alt="企业头像"
          />
        </template>
        <template #weather-icon>
          <span class="wc-top-weather-glyph" aria-hidden="true">
            <img class="sun-glow" src="/tms-web-shell-assets/Vector_26_214.svg" alt="" />
            <img class="sun-core" src="/tms-web-shell-assets/Group_26_216.svg" alt="" />
            <img class="sun-ray" src="/tms-web-shell-assets/Vector_26_226.svg" alt="" />
          </span>
        </template>
        <template #actions>
          <img src="/tms-web-shell-assets/Group_26_152.svg" class="wc-top-window-icon" alt="" />
          <img src="/tms-web-shell-assets/Vector_26_158.svg" class="wc-top-window-icon" alt="" />
          <span class="wc-top-window-glyph">
            <img src="/tms-web-shell-assets/Group_26_162.svg" class="wc-top-window-icon" alt="" />
            <img src="/tms-web-shell-assets/Group_26_164.svg" class="wc-top-window-icon" alt="" />
          </span>
        </template>
        <template #home-icon>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="8.4" y="0.6" width="7" height="7" rx="1.2" fill="#909499" />
            <rect x="0" y="0.6" width="7" height="7" rx="1.2" fill="#909499" />
            <rect x="8.4" y="8.2" width="7" height="7" rx="1.2" fill="#909499" />
            <rect x="0" y="8.2" width="7" height="7" rx="1.2" fill="#909499" />
          </svg>
        </template>

        <div class="waybill-center-page">
          <div class="wc-main">
            <WaybillKindTabs :active-key="kindTab" @change="kindTab = $event" />
            <WaybillFilterBar @search="onFilterSearch" @reset="onFilterReset" />
            <WaybillStatusTabs :active-key="statusTab" @change="statusTab = $event" />

            <div class="wc-toolbar">
              <button type="button" class="wc-toolbar-btn">导出</button>
            </div>

            <WaybillTable :rows="visibleRows" @action="onAction" />
            <WaybillPagination :current="page" @change="page = $event" />
          </div>
        </div>

        <!-- 地址及运价变更弹窗 -->
        <AddressChangeDialog
          :visible="addressChangeVisible"
          :waybill-key="addressChangeWaybillKey"
          @close="addressChangeVisible = false"
          @submit="onAddressChangeSubmit"
        />
      </TmsWebShell>
    </div>
  </div>
</template>

<style>
/* 顶部栏插槽内联尺寸 */
.wc-top-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}

.wc-top-weather-glyph {
  position: relative;
  display: block;
  width: 36.9px;
  height: 30.6px;
}
.wc-top-weather-glyph img { position: absolute; display: block; }
.wc-top-weather-glyph .sun-glow { left: 6.24px; top: 11.86px; width: 54.69px; height: 46.74px; }
.wc-top-weather-glyph .sun-core { left: 12.57px; top: 0; width: 24.34px; height: 24.34px; }
.wc-top-weather-glyph .sun-ray { left: 0; top: 6.74px; width: 27.8px; height: 19.52px; }

.wc-top-window-icon {
  width: 24px;
  height: 24px;
  display: block;
}
.wc-top-window-glyph {
  width: 24px;
  height: 24px;
  position: relative;
}
.wc-top-window-glyph .wc-top-window-icon {
  position: absolute;
  left: 0;
  top: 0;
}
</style>
