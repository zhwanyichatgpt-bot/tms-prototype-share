<script setup>
/**
 * 托运单管理 —— 待执行状态详情页
 * 需求归属：common；所属项目：null；研发版本：pending
 * 复用 TMS 业务系统框架 TmsWebShell
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { TmsWebShell } from '../../_shared/tms-web-shell/index.js'
import TaskTopLogo from '../../运输任务/components/TaskTopLogo.vue'
import WaybillDetailHeader from './components/WaybillDetailHeader.vue'
import WaybillLeftPanel from './components/WaybillLeftPanel.vue'
import WaybillSegmentsColumn from './components/WaybillSegmentsColumn.vue'
import WaybillMapCenter from './components/WaybillMapCenter.vue'
import WaybillBeidouColumn from './components/WaybillBeidouColumn.vue'
import { waybillDetailData } from './mock-data'
import './waybill-detail.css'

/* —— 顶部栏 / 系统框架数据 —— */
const siteName = '楹联集运站'
const organizationName = '企业名称企业名称企业企业名称...'
const dateText = '2022 年 05 月 27 日'
const weatherText = '24℃ 多云'
const tabs = [{ key: 'waybillManage', label: '托运订单管理' }]
const shellScale = 1

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

const detailData = ref(waybillDetailData)
const activeTab = ref('segments')

function handleBackToList() {
  if (typeof window !== 'undefined' && window.__TMS_SWITCH_PAGE__) {
    window.__TMS_SWITCH_PAGE__('waybillManage')
  } else {
    ElMessage.success('返回托运单列表')
  }
}

function handleTerminate() {
  ElMessage.warning(`已请求终止托运单：${detailData.value.id}`)
}

function handlePrint() {
  ElMessage.info(`打印托运单：${detailData.value.id}`)
}

function handleCopyContact() {
  ElMessage.success('联系人信息已复制到剪贴板')
}

function handleViewLossTemplate() {
  ElMessage.info(`查看路耗模板：${detailData.value.costInfo.lossTemplate}`)
}

function handleViewAttachment(att) {
  ElMessage.info(`查看附件：${att.name}`)
}

function handleViewModeChange(mode) {
  ElMessage.info(`切换线路视图：${mode}`)
}

function handleWaybillTypeChange(type) {
  ElMessage.info(`切换运单类型：${type}`)
}

function handleSearchWaybill(key) {
  ElMessage.info(`搜索运单：${key || '全部'}`)
}

function handleCreatePlan() {
  ElMessage.success('打开新建运输计划')
}

function handleRelatePlan() {
  ElMessage.info('打开关联计划弹窗')
}

function handleViewVoucher(wb) {
  ElMessage.info(`查看运单凭证：${wb.id}`)
}

/* 框架动作 */
function goWorkbench() { handleBackToList() }
function closeTab() { handleBackToList() }
function switchTab() {}
function onNavigate() {}
function onMenuSelect() {}
</script>

<template>
  <div class="waybill-detail-stage">
    <TmsWebShell
      :site-name="siteName"
      :organization-name="organizationName"
      :date-text="dateText"
      :weather-text="weatherText"
      :active-menu="'dashboard'"
      :tabs="tabs"
      :active-tab-key="'waybillManage'"
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
          class="tt-top-avatar"
          src="/tms-web-shell-assets/af74f762675bd2d9a53df99aaaab41f3519de48b.png"
          alt="企业头像"
        />
      </template>
      <template #weather-icon>
        <span class="tt-top-weather-glyph" aria-hidden="true">
          <img class="sun-glow" src="/tms-web-shell-assets/Vector_26_214.svg" alt="" />
          <img class="sun-core" src="/tms-web-shell-assets/Group_26_216.svg" alt="" />
          <img class="sun-ray" src="/tms-web-shell-assets/Vector_26_226.svg" alt="" />
        </span>
      </template>
      <template #actions>
        <img src="/tms-web-shell-assets/Group_26_152.svg" class="tt-top-window-icon" alt="" />
        <img src="/tms-web-shell-assets/Vector_26_158.svg" class="tt-top-window-icon" alt="" />
        <span class="tt-top-window-glyph">
          <img src="/tms-web-shell-assets/Group_26_162.svg" class="tt-top-window-icon" alt="" />
          <img src="/tms-web-shell-assets/Group_26_164.svg" class="tt-top-window-icon" alt="" />
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

      <div class="waybill-detail-page">
        <!-- 1. 页头面包屑与返回操作 -->
        <WaybillDetailHeader
          parent-title="托运订单"
          page-title="托运单详情"
          @back="handleBackToList"
        />

        <!-- 2. 主体左右分栏 -->
        <div class="waybill-main-layout">
          <!-- 左侧信息面板（宽 440px） -->
          <WaybillLeftPanel
            :data="detailData"
            @terminate="handleTerminate"
            @print="handlePrint"
            @copy-contact="handleCopyContact"
            @view-loss-template="handleViewLossTemplate"
            @view-attachment="handleViewAttachment"
          />

          <!-- 右侧多功能区（宽 1352px，三段式结构） -->
          <div class="waybill-right-section">
            <!-- 顶部选项卡栏 -->
            <div class="panel-top-tabs-bar">
              <div class="top-tabs-group">
                <button
                  type="button"
                  class="top-tab-btn"
                  :class="{ active: activeTab === 'segments' }"
                  @click="activeTab = 'segments'"
                >
                  路段信息
                </button>
                <button
                  type="button"
                  class="top-tab-btn"
                  :class="{ active: activeTab === 'settlement' }"
                  @click="activeTab = 'settlement'"
                >
                  结算明细
                </button>
                <button
                  type="button"
                  class="top-tab-btn"
                  :class="{ active: activeTab === 'process' }"
                  @click="activeTab = 'process'"
                >
                  流程管理
                </button>
              </div>
            </div>

            <!-- 固定三段式主体舞台 (1352 × 751) -->
            <div class="waybill-stage-grid">
              <!-- 左栏：路段信息 (约 352px) -->
              <WaybillSegmentsColumn
                :data="detailData"
                @create-plan="handleCreatePlan"
                @relate-plan="handleRelatePlan"
              />

              <!-- 中栏：真实地图区域 (约 652px) -->
              <WaybillMapCenter
                :data="detailData"
                @view-mode-change="handleViewModeChange"
              />

              <!-- 右栏：北斗轨迹运单 (约 348px) -->
              <WaybillBeidouColumn
                :data="detailData"
                @waybill-type-change="handleWaybillTypeChange"
                @search-waybill="handleSearchWaybill"
                @view-voucher="handleViewVoucher"
              />
            </div>
          </div>
        </div>
      </div>
    </TmsWebShell>
  </div>
</template>
