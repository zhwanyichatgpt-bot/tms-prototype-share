<template>
  <div class="zy-page">
    <div class="zy-phone">
      <div class="zy-screen">
        <QuickPublishFlow
          v-if="showQuickPublish"
          :prefill="publishPrefill"
          @back="showQuickPublish = false"
          @published="showQuickPublish = false"
        />
        <AddressPickerPage
          v-if="addressPicker.mode"
          :mode="addressPicker.mode"
          @back="addressPicker.mode = null"
          @confirm="onAddressConfirm"
          @set-alias="addressPicker.mode = null"
        />
        <CargoSourcePage
          v-if="!showQuickPublish && currentTab === 'goods'"
          @publish="openQuickPublish"
        />
        <WaybillPage v-if="!showQuickPublish && currentTab === 'order'" />
        <MinePage
          v-if="!showQuickPublish && currentTab === 'mine'"
          @open-invoice="openInvoice"
          @open-account="openAccount"
          @open-payment="openPaymentFromMine"
        />
        <AccountPage
          v-if="!showQuickPublish && currentTab === 'mine' && accountOpen"
          :initial-view="accountInitialView"
          @back="closeAccount"
          @open-payment="openPaymentFromAccount"
        />
        <InvoicePage
          v-show="!showQuickPublish && currentTab === 'mine' && invoiceOpen && !invoiceDetail && !invoiceTitlesOpen"
          ref="invoicePageRef"
          :initial-tab="invoiceTab"
          :reset-token="invoiceResetToken"
          @back="closeInvoice"
          @open-detail="openInvoiceDetail"
          @manage-titles="openInvoiceTitles"
        />
        <InvoiceTitlePage
          v-if="!showQuickPublish && currentTab === 'mine' && invoiceTitlesOpen"
          mode="manage"
          @back="closeInvoiceTitles"
          @changed="onTitleChanged"
        />
        <InvoiceDetailPage
          v-if="!showQuickPublish && currentTab === 'mine' && invoiceDetail"
          :record="invoiceDetail"
          @back="invoiceDetail = null"
          @reapply="reapplyInvoice"
        />
        <AiHomePage
          v-if="!showQuickPublish && currentTab === 'ai' && !aiConversation.open && !subPage.key"
          :entry="aiEntry"
          :restore-state="aiHomeState"
          @open-conversation="openConversation"
          @close="currentTab = 'home'"
        />
        <AiPublishAdjustPage
          v-show="!showQuickPublish && currentTab === 'ai' && subPage.key === 'adjust'"
          :initial-state="subPage.state"
          :active="!showQuickPublish && currentTab === 'ai' && subPage.key === 'adjust'"
          @back="closeSubPage"
          @open-conversation="openConversation"
        />
        <AiCargoRiskPage
          v-show="!showQuickPublish && currentTab === 'ai' && subPage.key === 'risk'"
          @back="closeSubPage"
          @open-conversation="openConversation"
        />
        <AiSettlementPage
          v-show="!showQuickPublish && currentTab === 'ai' && subPage.key === 'settlement'"
          :initial-tab="subPage.state.tab"
          @back="closeSettlementPage"
          @open-conversation="openConversation"
        />
        <AiMarketInsightPage
          v-show="!showQuickPublish && currentTab === 'ai' && subPage.key === 'market'"
          @back="closeSubPage"
          @open-conversation="openConversation"
          @prepare-cargo="openQuickPublishWithPrefill"
        />
        <AiConversationPage
          v-show="!showQuickPublish && currentTab === 'ai' && aiConversation.open"
          :context="aiConversation.context"
          :detail="aiConversation.detail"
          @back="closeConversation"
        />
        <!-- 可滚动内容区 -->
        <div v-show="!showQuickPublish && currentTab === 'home'" class="zy-scroll">
        <!-- 1. iOS 状态栏 -->
        <div class="status-bar">
          <span class="status-time">9:41</span>
          <span class="status-icons">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
            <span class="battery"></span>
          </span>
        </div>

        <!-- 2. 顶部：定位 -->
        <div class="top-nav">
          <div class="loc-row">
            <svg class="loc-pin" width="11" height="11" viewBox="0 0 22 22" fill="none"><path d="M11 1.6C6.4 1.6 2.7 5.3 2.7 9.9C2.7 14.4 8.1 19.1 10.2 20.7C10.7 21.1 11.3 21.1 11.8 20.7C13.9 19.1 19.3 14.4 19.3 9.9C19.3 5.3 15.6 1.6 11 1.6Z" fill="#333"/><circle cx="11" cy="9.7" r="3" fill="#fff"/></svg>
            <span class="loc-text">{{ locationBar.city }}</span>
            <svg class="loc-tri" width="6" height="3.75" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <!-- 3. 主标语区 -->
        <div class="hero">
          <h1 class="hero-title">找运力·上至简智运</h1>
          <img class="hero-swoosh" src="/zhiyun-mobile-assets/icons/title-swoosh.svg" alt="" />
          <img class="hero-truck" src="/zhiyun-mobile-assets/mascot-benben.png" alt="象奔奔" />
          <ul class="hero-points">
            <li v-for="s in heroSlogans" :key="s">
              <span class="check">
                <svg width="10" height="10" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#374f68"/><path d="M5.6 10.2L8.4 13L14.4 7" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>{{ s }}
            </li>
          </ul>
        </div>

        <!-- 4. 地图卡片 -->
        <div class="map-card">
          <img class="map-img" src="/zhiyun-mobile-assets/map-embedded.png" alt="" />
          <div class="map-pin"></div>
          <div class="map-tag">{{ mapCard.tag }}</div>
          <div class="map-bubble">
            <span>{{ mapCard.address }}</span>
            <svg width="4" height="6" viewBox="0 0 8 12" fill="none"><path d="M5.02 0L0 4.72L5.02 9.45" stroke="#333" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="matrix(-1,0,0,-1,6.52,10.95)"/></svg>
          </div>
        </div>

        <!-- 5. 小简洞察（蓝色半透明提示条，压在发货卡后） -->
        <div class="ai-tip" @click="openInsight">
          <div class="ai-tip-body">
            <p class="ai-tip-route">{{ aiTip.route }}</p>
            <p class="ai-tip-line">
              {{ aiTip.trend }}<b class="ai-tip-price">{{ aiTip.price }}</b>{{ aiTip.trendTail }}
            </p>
            <p class="ai-tip-line">
              {{ aiTip.capacity }}<span class="ai-tip-action">{{ aiTip.action }}</span>
            </p>
          </div>
        </div>

        <!-- 6. 发货表单卡片 -->
        <div class="ship-card">
          <div class="row-load" @click="openAddressPicker('load')">
            <span class="dot dot-blue"></span>
            <div class="row-main">
              <p class="row-line">将在 <b>{{ shipForm.loadPoint }}</b> 装货</p>
              <p class="row-sub">{{ shipForm.loadHint }}</p>
            </div>
            <svg class="row-chev" width="3.6" height="6.75" viewBox="0 0 10 17" fill="none"><path d="M7.18 0L0 6.75L7.18 13.51" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="matrix(-1,0,0,-1,8.43,14.76)"/></svg>
          </div>
          <div class="row-unload" @click="openAddressPicker('unload')">
            <span class="dot dot-green"></span>
            <span class="unload-text">{{ unloadText }}</span>
            <svg class="row-chev" width="3.6" height="6.75" viewBox="0 0 10 17" fill="none"><path d="M7.18 0L0 6.75L7.18 13.51" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="matrix(-1,0,0,-1,8.43,14.76)"/></svg>
          </div>
          <div class="quick-row">
            <span class="quick-routes-label">{{ shipForm.quickRoutesLabel }}</span>
            <button
              v-for="r in shipForm.quickRoutes"
              :key="r.id"
              type="button"
              class="quick-route-chip"
              @click="applyRoute(r)"
            >{{ r.label }}</button>
            <span class="quick-setting">{{ shipForm.settingText }}</span>
          </div>
          <button class="submit-btn" @click="openQuickPublish">{{ shipForm.submitText }}</button>
        </div>

        <!-- 7. 进行中运输：一张卡汇总全部执行中货源 -->
        <section class="transit-summary" aria-label="进行中运输概况">
          <div class="transit-summary-head">
            <div>
              <span class="transit-summary-icon" aria-hidden="true">↗</span>
              <h2>进行中运输</h2>
            </div>
            <button type="button" @click="openTransitSummary('all')">查看全部 <span>›</span></button>
          </div>

          <div class="transit-overview" @click="openTransitSummary('all')">
            <div class="transit-total">
              <p><strong>{{ transitSummary.totalCargoes }}</strong><span>票货源正在执行</span></p>
              <small>涉及 {{ transitSummary.activeVehicles }} 辆车</small>
            </div>
            <div class="transit-metrics">
              <button
                v-for="metric in transitSummary.metrics"
                :key="metric.key"
                type="button"
                :class="{ warning: metric.tone === 'warning' }"
                @click.stop="openTransitSummary(metric.key)"
              >
                <strong>{{ metric.value }}<em>{{ metric.unit }}</em></strong>
                <span>{{ metric.label }}</span>
              </button>
            </div>
          </div>

          <button type="button" class="transit-alert" @click="openTransitSummary('abnormal')">
            <span class="transit-alert-mark" aria-hidden="true">!</span>
            <span class="transit-alert-copy">
              <strong>{{ transitSummary.alert.route }} · {{ transitSummary.alert.detail }}</strong>
              <small>{{ transitSummary.alert.extra }}</small>
            </span>
            <b>{{ transitSummary.alert.action }} ›</b>
          </button>
        </section>

        <!-- 8. 推荐运力 -->
        <div class="rec-section">
          <div class="rec-head">
            <div class="rec-head-main">
              <h2 class="rec-title">推荐<em>运力</em></h2>
            </div>
            <span class="rec-more">
              {{ recommendSection.moreText }}
              <svg width="10" height="10" viewBox="0 0 11 19" fill="none"><path d="M1.25 18.99C1.06 18.99 0.87 18.92 0.72 18.77C0.43 18.47 0.43 18 0.72 17.7L8.68 9.75L0.72 1.79C0.43 1.49 0.43 1.02 0.72 0.72C1.02 0.43 1.49 0.43 1.79 0.72L10.28 9.21C10.57 9.51 10.57 9.98 10.28 10.28L1.79 18.77C1.64 18.92 1.45 18.99 1.25 18.99Z" fill="#999"/></svg>
            </span>
          </div>
          <!-- 筛选条：智能排序样式，三项各自切换 -->
          <div class="carrier-filter">
            <button type="button" class="filter-item" :class="{ active: carrierFilter === 'rate' }" @click="carrierFilter = 'rate'">
              综合推荐<i class="filter-caret" :class="{ on: carrierFilter === 'rate' }"></i>
            </button>
            <button type="button" class="filter-item" :class="{ active: carrierFilter === 'distance' }" @click="carrierFilter = 'distance'">
              距离最近<i class="filter-caret" :class="{ on: carrierFilter === 'distance' }"></i>
            </button>
            <button type="button" class="filter-item" :class="{ active: carrierFilter === 'vehicle' }" @click="toggleVehicleFilter">
              {{ carrierFilter === 'vehicle' && vehicleFilter ? vehicleFilter : '车型' }}<i class="filter-caret" :class="{ on: carrierFilter === 'vehicle' }"></i>
            </button>
          </div>
          <div v-if="carrierFilter === 'vehicle'" class="vehicle-chips">
            <button
              v-for="vt in vehicleTypes"
              :key="vt"
              type="button"
              class="vehicle-chip"
              :class="{ active: vehicleFilter === vt }"
              @click="vehicleFilter = vehicleFilter === vt ? '' : vt"
            >{{ vt }}</button>
          </div>
          <div
            v-for="c in filteredCarriers"
            :key="c.id"
            class="carrier-card"
            :class="{ 'carrier-card-company': c.kind === 'company' }"
            @click="openCarrier(c)"
          >
            <div class="carrier-side">
              <img class="carrier-photo" :src="c.photo" alt="" />
              <span v-if="c.coop" class="carrier-coop">{{ c.coop }}</span>
            </div>
            <div class="carrier-info">
              <div class="carrier-topline">
                <p class="carrier-name">{{ c.name }}</p>
                <span class="carrier-rate"><b>{{ c.rate }}</b>推荐</span>
              </div>
              <div class="carrier-rows">
                <p v-if="c.kind === 'company'" class="carrier-row">
                  <span class="carrier-row-label">运力</span>{{ c.fleet }}
                </p>
                <p v-else class="carrier-row">
                  <span class="carrier-row-label">常跑</span>{{ c.route }} · {{ c.trips }} 趟
                </p>
                <p v-if="carrierFilter === 'distance'" class="carrier-row carrier-row-hl">
                  <span class="carrier-row-label">距装货点</span>{{ c.distance }}km · 预计{{ c.distance <= 15 ? 40 : 70 }}分钟到场
                </p>
                <p v-else-if="carrierFilter === 'vehicle'" class="carrier-row carrier-row-hl">
                  <span class="carrier-row-label">车型</span>{{ c.vehicleType }} · {{ c.kind === 'company' ? '车队匹配' : '整车运输' }}
                </p>
                <p class="carrier-row">
                  <span class="carrier-row-label">车型</span>{{ c.vehicle }}<template v-if="c.kind === 'driver'"> · {{ c.load }}</template>
                </p>
                <p v-if="c.kind === 'driver'" class="carrier-row">
                  <span class="carrier-row-label">承运</span>{{ c.goods }}
                </p>
              </div>
              <div class="carrier-tags">
                <span class="carrier-tag carrier-tag-gold">{{ c.trustTags[0] }}</span>
                <span v-if="c.trustTags[1]" class="carrier-tag carrier-tag-purple">{{ c.trustTags[1] }}</span>
                <span class="carrier-tag carrier-tag-blue">{{ c.platform }}</span>
              </div>
            </div>
          </div>
        </div>
        </div>
        <!-- /可滚动内容区 -->

        <!-- 9. 底部 Tab 栏（设计 组合585：渐变背景带 + 中央缺口玻璃带 + 4 Tab + 小简AI白猫） -->
        <div v-show="!showQuickPublish && !aiConversation.open && !subPage.key && !invoiceOpen && !accountOpen" class="tab-bar">
          <img class="tab-bg-top" src="/zhiyun-mobile-assets/icons/tab-band-top.svg" alt="" />
          <img class="tab-bg-bottom" src="/zhiyun-mobile-assets/icons/tab-band-bottom.svg" alt="" />
          <img class="tab-glass" src="/zhiyun-mobile-assets/icons/tab-glass-band.svg" alt="" />
          <button
            v-for="tab in tabBar"
            :key="tab.key"
            type="button"
            class="tab-item"
            :class="[`tab-${tab.key}`, { active: currentTab === tab.key }]"
            @click="selectTab(tab.key)"
          >
            <img class="tab-icon" :src="tab.icon" alt="" />
            <span class="tab-label">{{ tab.label }}</span>
          </button>
          <button type="button" class="tab-ai" :class="{ active: currentTab === 'ai' }" @click="openAi()" aria-label="小简AI">
            <img class="tab-cat" :src="aiTab.cat" alt="小简AI" />
            <span class="tab-label">{{ aiTab.label }}</span>
          </button>
        </div>
        <FleetDetailPage v-if="selectedFleet" :carrier="selectedFleet" @back="selectedFleet = null" @target-publish="openTargetedPublish" />
        <DriverDetailPage v-if="selectedDriver" :driver="selectedDriver" @back="selectedDriver = null" @target-publish="openTargetedPublish" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import AiHomePage from './AiHomePage.vue'
import AiPublishAdjustPage from './AiPublishAdjustPage.vue'
import AiCargoRiskPage from './AiCargoRiskPage.vue'
import AiSettlementPage from './AiSettlementPage.vue'
import AiMarketInsightPage from './AiMarketInsightPage.vue'
import AiConversationPage from './AiConversationPage.vue'
import QuickPublishFlow from './QuickPublishFlow.vue'
import FleetDetailPage from './FleetDetailPage.vue'
import DriverDetailPage from './DriverDetailPage.vue'
import CargoSourcePage from './CargoSourcePage.vue'
import WaybillPage from './WaybillPage.vue'
import MinePage from './MinePage.vue'
import AccountPage from './AccountPage.vue'
import InvoicePage from './InvoicePage.vue'
import InvoiceTitlePage from './InvoiceTitlePage.vue'
import InvoiceDetailPage from './InvoiceDetailPage.vue'
import AddressPickerPage from './AddressPickerPage.vue'
import {
  locationBar,
  heroSlogans,
  mapCard,
  aiTip,
  shipForm,
  transitSummary,
  recommendSection,
  carriers,
  vehicleTypes,
  tabBar,
  aiTab,
} from './mock-data.js'

const emit = defineEmits(['pick-load', 'pick-unload', 'quick-publish', 'open-ai', 'open-transit', 'open-carrier'])
/* 推荐运力筛选：rate=综合推荐 / distance=距离最近 / vehicle=车型过滤 */
const carrierFilter = ref('rate')
const vehicleFilter = ref('')
/* 综合推荐/车型：物流企业整体优先，同类内按推荐分降序（大宗批量找车先看企业运力） */
const sortByRateThenKind = (a, b) => {
  if (a.kind !== b.kind) return a.kind === 'company' ? -1 : 1
  return Number.parseInt(b.rate, 10) - Number.parseInt(a.rate, 10)
}
const filteredCarriers = computed(() => {
  let list = [...carriers]
  if (carrierFilter.value === 'distance') list.sort((a, b) => a.distance - b.distance)
  else if (carrierFilter.value === 'vehicle') {
    if (vehicleFilter.value) list = list.filter(c => c.vehicleType === vehicleFilter.value)
    list.sort(sortByRateThenKind)
  } else list.sort(sortByRateThenKind)
  return list
})
function toggleVehicleFilter() {
  if (carrierFilter.value === 'vehicle') {
    carrierFilter.value = 'rate'
    vehicleFilter.value = ''
  } else {
    carrierFilter.value = 'vehicle'
  }
}
const showQuickPublish = ref(false)
const selectedFleet = ref(null)
const selectedDriver = ref(null)
const openCarrier = (carrier) => {
  if (carrier.kind === 'company') selectedFleet.value = carrier
  else selectedDriver.value = carrier
}
const publishPrefill = ref(null)
const currentTab = ref('home')
const aiEntry = ref('')
const aiConversation = ref({ open: false, context: 'overview', from: '' })
/* 二级页：'' | 'adjust' | 'risk' | 'settlement' | 'market'；用 v-show 保持页面内输入与选择状态 */
const subPage = ref({ key: '', state: {} })
const settlementReturn = ref('ai')
const aiHomeState = ref({ scrollTop: 0, evidenceOpen: false })
const openAi = (entry = '') => {
  aiEntry.value = entry
  aiConversation.value = { open: false, context: entry || 'overview', from: '' }
  currentTab.value = 'ai'
  emit('open-ai', entry === 'market' ? { route: '福州→天津' } : undefined)
}
const openConversation = (payload = {}) => {
  aiHomeState.value = {
    scrollTop: payload.scrollTop || 0,
    evidenceOpen: Boolean(payload.evidenceOpen),
  }
  const context = payload.context || 'question'
  // 二级页内点“问小简”：打开关联对话，返回时回到来源二级页
  if (payload.from) {
    aiConversation.value = { open: true, context, from: payload.from, detail: payload.detail || '' }
    return
  }
  if (context === 'plan') {
    subPage.value = { key: 'adjust', state: payload.adjustState || {} }
    return
  }
  if (context === 'risk') {
    subPage.value = { key: 'risk', state: {} }
    return
  }
  if (context === 'settlement' || context === 'payment') {
    settlementReturn.value = 'ai'
    subPage.value = { key: 'settlement', state: { tab: context } }
    return
  }
  if (context === 'market') {
    subPage.value = { key: 'market', state: {} }
    return
  }
  aiConversation.value = { open: true, context, from: '', detail: payload.detail || '' }
}
const closeConversation = () => {
  aiConversation.value = { ...aiConversation.value, open: false }
}
const closeSubPage = () => {
  subPage.value = { key: '', state: {} }
  aiHomeState.value = { ...aiHomeState.value, evidenceOpen: false }
}
const unloadText = ref(shipForm.unloadPlaceholder)
const addressPicker = ref({ mode: null }) // null | 'load' | 'unload'

/* 发票管理：从“我的-我的发票”进入；详情页叠在列表页之上，返回回到列表 */
const invoiceOpen = ref(false)
const invoiceDetail = ref(null)
const invoiceTab = ref('apply')
const invoiceResetToken = ref(0)
/* 抬头维护：发票管理域内的子页，退出时回到申请开票 */
const invoiceTitlesOpen = ref(false)
const invoicePageRef = ref(null)
/* 我的账户：统一承接余额、冻结、充值提现、流水与账户管理 */
const accountOpen = ref(false)
const accountInitialView = ref('overview')
const toast = (message) => {
  if (typeof window !== 'undefined' && window.sharedStorage && window.sharedStorage.toast) {
    window.sharedStorage.toast(message)
  }
}
const openInvoice = () => {
  accountOpen.value = false
  invoiceOpen.value = true
  invoiceDetail.value = null
  invoiceTitlesOpen.value = false
  invoiceTab.value = 'apply'
}
const openAccount = (view = 'overview') => {
  resetInvoice()
  accountInitialView.value = view
  accountOpen.value = true
}
const closeAccount = () => {
  accountOpen.value = false
  accountInitialView.value = 'overview'
}
const openPaymentFromAccount = () => {
  openPayment('account')
}
const openPaymentFromMine = () => {
  openPayment('mine')
}
const openPayment = (source) => {
  accountOpen.value = false
  resetInvoice()
  settlementReturn.value = source
  aiEntry.value = ''
  aiConversation.value = { open: false, context: 'payment', from: '' }
  currentTab.value = 'ai'
  subPage.value = { key: 'settlement', state: { tab: 'payment' } }
}
const closeSettlementPage = () => {
  const source = settlementReturn.value
  subPage.value = { key: '', state: {} }
  settlementReturn.value = 'ai'
  if (source === 'account' || source === 'mine') {
    currentTab.value = 'mine'
    accountOpen.value = source === 'account'
    accountInitialView.value = 'overview'
    return
  }
  closeSubPage()
}
const closeInvoice = () => {
  invoiceOpen.value = false
  invoiceDetail.value = null
  invoiceTitlesOpen.value = false
}
const openInvoiceTitles = () => {
  invoiceTitlesOpen.value = true
}
const closeInvoiceTitles = () => {
  invoiceTitlesOpen.value = false
  /* 入口在开票记录页，返回时回到记录视图；并校正表单当前选用的抬头 */
  invoiceTab.value = 'record'
  invoicePageRef.value?.refreshTitles()
}
const onTitleChanged = (message) => toast(message)
const openInvoiceDetail = (record) => {
  invoiceDetail.value = record
}
/* 驳回后重新申请：回到申请页，由货主重新选择货源与结算单 */
const reapplyInvoice = () => {
  invoiceDetail.value = null
  invoiceTab.value = 'apply'
  invoiceResetToken.value += 1
  invoiceOpen.value = true
}
/* 切走底部 Tab 时收起发票页，避免返回“我的”仍停留在发票管理 */
const resetInvoice = () => {
  invoiceOpen.value = false
  invoiceDetail.value = null
  invoiceTitlesOpen.value = false
}

const resetMineSubPages = () => {
  resetInvoice()
  closeAccount()
}

const applyRoute = (route) => {
  unloadText.value = route.unload
}

const openAddressPicker = (mode) => {
  addressPicker.value = { mode }
  emit(mode === 'load' ? 'pick-load' : 'pick-unload')
}

const onAddressConfirm = (addr) => {
  if (addr.mode === 'load') {
    shipForm.loadPoint = addr.name
  } else {
    unloadText.value = addr.name
  }
  addressPicker.value = { mode: null }
}

/* 首页洞察“查看方案”：直接进入常运线路行情二级页，不落到 AI 首页再滚动定位 */
const openInsight = () => {
  aiEntry.value = ''
  aiConversation.value = { open: false, context: 'market', from: '' }
  currentTab.value = 'ai'
  subPage.value = { key: 'market', state: {} }
}

const openQuickPublish = () => {
  publishPrefill.value = null
  showQuickPublish.value = true
  emit('quick-publish')
}
const openTargetedPublish = (target) => {
  publishPrefill.value = {
    targetFleet: { id: target.id, name: target.name, platform: target.platform, kind: target.kind },
  }
  selectedFleet.value = null
  selectedDriver.value = null
  showQuickPublish.value = true
}
/* 行情页“按此条件准备货源”：带入线路、货品、货量与测算单价，进入流程后仍需货主核对 */
const openQuickPublishWithPrefill = (payload = {}) => {
  publishPrefill.value = payload
  showQuickPublish.value = true
}

/* 首页运输汇总进入货源列表；filter 同步给外层，便于后续接入对应筛选。 */
const openTransitSummary = (filter = 'all') => {
  currentTab.value = 'goods'
  emit('open-transit', { filter })
}

const selectTab = (key) => {
  if (key === 'home' || key === 'goods' || key === 'order' || key === 'mine') {
    if (key !== 'mine') resetMineSubPages()
    currentTab.value = key
  }
}
</script>

<style scoped>
/* ===== 外层预览容器 ===== */
.zy-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  background: #eef0f5;
  padding: 24px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'SF Pro Text', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* 手机壳 375×812（750×1624 @0.5x） */
.zy-phone {
  width: 375px;
  height: 812px;
  background: #ffffff;
  border-radius: 44px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}
.zy-screen {
  position: relative;
  width: 375px;
  height: 812px;
  background: linear-gradient(180deg, #e6edfa 0%, #e4ebfa 100%);
  overflow: hidden;
}
/* 可滚动内容区：高度留给固定底部 Tab 栏，中间内容可上下滚动 */
.zy-scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}
.zy-scroll::-webkit-scrollbar {
  display: none;
}

/* 页面装饰：按 Pixso 背景组尺寸等比缩放，并随内容一起滚动 */
.zy-scroll::before {
  content: '';
  position: absolute;
  top: -132.5px;
  left: -91px;
  width: 612.5px;
  height: 945px;
  background: url('/zhiyun-mobile-assets/hero-decor.png') no-repeat;
  background-size: 100% 100%;
  opacity: 0.5;
  z-index: 0;
  pointer-events: none;
}

/* ===== 1. 状态栏 ===== */
.status-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 60px;
  padding: 16px 14.5px 0 16px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 30;
}
.status-time {
  font-size: 15px;
  font-weight: 600;
  color: #0c0c0c;
  letter-spacing: 0.3px;
}
.status-icons {
  display: flex;
  align-items: center;
  gap: 5px;
}
/* 电池：设计稿 45.6×23.5@750（22.8×11.75@375），2px 深色外框 + 整块黑色填充 + 右侧电极 */
.battery {
  position: relative;
  display: inline-block;
  width: 22.8px;
  height: 11.75px;
  box-sizing: border-box;
  border: 2px solid rgba(12, 12, 12, 0.35);
  border-radius: 1.5px;
}
.battery::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #0c0c0c;
  border-radius: 0.7px;
}
.battery::after {
  content: '';
  position: absolute;
  top: 1.8px;
  right: -3.4px;
  width: 1.4px;
  height: 4.15px;
  background: rgba(12, 12, 12, 0.35);
  border-radius: 0.7px;
}

/* ===== 2. 顶部定位行 ===== */
.top-nav {
  position: absolute;
  top: 47.6px;
  left: 15px;
  right: 12.5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 20;
}
.loc-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.loc-text {
  font-size: 12px;
  font-weight: 700;
  color: #333;
}

/* ===== 3. 主标语区（设计 750: 组81838 @[49,166.6]）===== */
.hero {
  position: absolute;
  top: 83.3px;
  left: 24.5px;
  width: 201.7px;
  z-index: 10;
}
.hero-title {
  margin: 0;
  font-size: 24px;
  line-height: 1;
  font-weight: 700;
  color: #162f4a;
  letter-spacing: 0;
  position: relative;
  display: inline-block;
}
.hero-swoosh {
  position: absolute;
  top: 11px;
  left: 124.3px;
  width: 23.7px;
  height: 12.2px;
  pointer-events: none;
}
.hero-truck {
  position: absolute;
  top: -25.8px;
  left: 204px;
  width: 98px;
  height: 60px;
  object-fit: contain;
}
.hero-points {
  list-style: none;
  margin: 3px 0 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 12.5px;
}
.hero-points li {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9.5px;
  line-height: 13.5px;
  color: #0e2743;
}
.hero-points .check {
  display: inline-flex;
}

/* ===== 4. 地图卡片 ===== */
.map-card {
  position: absolute;
  top: 133px;
  left: 16px;
  right: 16px;
  height: 172.5px;
  border-radius: 18px;
  overflow: hidden;
  background: #dfe7f3;
  z-index: 4;
}
.map-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.map-pin {
  position: absolute;
  left: 161.5px;
  top: 72.5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3a65ff;
  box-shadow: 0 0 0 4px rgba(58, 101, 255, 0.25);
}
.map-pin::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -7px;
  transform: translateX(-50%);
  width: 1px;
  height: 12px;
  background: #333;
}
.map-tag {
  position: absolute;
  left: 90px;
  top: 19px;
  background: #3a65ff;
  color: #fff;
  font-size: 8px;
  line-height: 11px;
  font-weight: 700;
  padding: 2.5px 10px;
  border-radius: 6.5px;
  white-space: nowrap;
  z-index: 2;
}
.map-bubble {
  position: absolute;
  left: 90px;
  top: 34px;
  min-width: 155px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 6.5px;
  box-shadow: 0 1.5px 10px rgba(0, 0, 0, 0.2);
  padding: 7.5px 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  z-index: 3;
}
.map-bubble span {
  font-size: 12px;
  line-height: 16.5px;
  font-weight: 700;
  color: #333;
}

/* ===== 5. 小简洞察（蓝色半透明提示条，承载线路+运价+查看方案） ===== */
.ai-tip {
  position: absolute;
  top: 218px;
  left: 16px;
  right: 16px;
  height: 160px;
  background: rgba(219, 230, 255, 0.5);
  border: 1px solid #426ce1;
  border-radius: 21px;
  display: flex;
  align-items: flex-start;
  padding: 9px 20px 8px 18.5px;
  gap: 8px;
  box-sizing: border-box;
  z-index: 5;
  cursor: pointer;
}
.ai-tip-body {
  flex: 1;
  min-width: 0;
}
.ai-tip-route {
  margin: 0 0 2px;
  font-size: 10.5px;
  line-height: 14px;
  font-weight: 700;
  color: #162f4a;
  letter-spacing: 0.2px;
  white-space: nowrap;
}
.ai-tip-line {
  margin: 0;
  font-size: 11px;
  line-height: 15px;
  font-weight: 500;
  color: #2a3a52;
  white-space: nowrap;
}
.ai-tip-price {
  color: #1e4df6;
  font-weight: 700;
}
.ai-tip-action {
  color: #1e4df6;
  font-weight: 700;
}
.ai-tip-arrow {
  flex-shrink: 0;
  display: inline-flex;
  margin-top: 12px;
}

/* ===== 6. 发货表单卡片 ===== */
.ship-card {
  position: absolute;
  top: 287px;
  left: 16px;
  right: 16px;
  height: 230px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(120, 140, 180, 0.12);
  padding: 21px 0 13px;
  box-sizing: border-box;
  z-index: 6;
  display: flex;
  flex-direction: column;
}
.row-load {
  margin: 0 30px;
  display: flex;
  align-items: flex-start;
  gap: 13px;
  cursor: pointer;
}
.dot {
  width: 6.5px; height: 6.5px;
  border-radius: 50%;
  margin-top: 7px;
  flex-shrink: 0;
}
.dot-blue { background: #3a65ff; }
.dot-green { background: #34c7a9; }
.row-main {
  flex: 1;
  min-width: 0;
}
.row-line {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #333;
  line-height: 20px;
}
.row-line b {
  color: #3a65ff;
  font-weight: 700;
}
.row-sub {
  margin: 3px 0 0;
  font-size: 10px;
  color: #999;
  line-height: 14px;
}
.row-chev {
  margin-top: 7px;
  flex-shrink: 0;
}
.row-unload {
  margin: 11px 14px 0;
  display: flex;
  align-items: center;
  gap: 13px;
  border: 1px solid #757b92;
  border-radius: 14px;
  height: 54.5px;
  padding: 0 20px 0 16px;
  box-sizing: border-box;
  cursor: pointer;
}
.row-unload .dot {
  margin-top: 0;
}
.unload-text {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: #333;
}
.quick-row {
  margin: 6px 16.5px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.quick-routes-label {
  font-size: 11px;
  color: #666;
}
.quick-route-chip {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid #c7d6f2;
  background: #f0f5ff;
  color: #1e4df6;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
}
.quick-route-chip:active {
  background: #dde8ff;
}
.quick-setting {
  margin-left: auto;
  font-size: 11px;
  color: #999;
}
.submit-btn {
  margin: 8.5px 26px 0;
  width: auto;
  height: 45px;
  flex-shrink: 0;
  border: none;
  border-radius: 12px;
  background: linear-gradient(93deg, #5c8bfe 0%, #1e4df6 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
}

/* ===== 7. 进行中运输汇总 ===== */
.transit-summary {
  position: absolute;
  top: 526px;
  left: 16px;
  right: 16px;
  height: 144px;
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid rgba(90, 125, 219, 0.18);
  border-radius: 14px;
  background:
    radial-gradient(circle at 94% 4%, rgba(109, 150, 255, 0.25), transparent 34%),
    linear-gradient(140deg, rgba(255, 255, 255, 0.98), rgba(242, 247, 255, 0.98));
  box-shadow: 0 5px 18px rgba(65, 91, 159, 0.1);
  z-index: 3;
  font-family: 'PingFang SC', sans-serif;
}
.transit-summary-head,
.transit-summary-head > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.transit-summary-head > div {
  gap: 7px;
}
.transit-summary-icon {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 7px;
  background: linear-gradient(135deg, #6f9cff, #3a65ff);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
.transit-summary-head h2 {
  margin: 0;
  color: #26324a;
  font-size: 15px;
  line-height: 20px;
  font-weight: 700;
}
.transit-summary-head > button {
  border: 0;
  padding: 2px 0;
  background: transparent;
  color: #7f8da6;
  font-size: 10px;
}
.transit-summary-head > button span {
  margin-left: 2px;
  color: #3a65ff;
  font-size: 14px;
}
.transit-overview {
  display: grid;
  grid-template-columns: 108px 1fr;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  cursor: pointer;
}
.transit-total {
  padding-right: 9px;
  border-right: 1px solid #e1e7f3;
}
.transit-total p {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 0;
}
.transit-total strong {
  color: #2f61f6;
  font-size: 27px;
  line-height: 30px;
  font-weight: 750;
}
.transit-total p span {
  color: #3d4657;
  font-size: 10px;
  font-weight: 600;
}
.transit-total small {
  display: block;
  margin-top: 1px;
  color: #8895aa;
  font-size: 9px;
}
.transit-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
}
.transit-metrics button {
  min-width: 0;
  border: 0;
  padding: 1px 0;
  background: transparent;
  color: #2e3748;
  text-align: center;
}
.transit-metrics strong,
.transit-metrics span {
  display: block;
}
.transit-metrics strong {
  font-size: 15px;
  line-height: 18px;
}
.transit-metrics strong em {
  margin-left: 1px;
  font-size: 8px;
  font-style: normal;
  font-weight: 500;
}
.transit-metrics span {
  margin-top: 2px;
  color: #7e8ba0;
  font-size: 8px;
  white-space: nowrap;
}
.transit-metrics button.warning strong,
.transit-metrics button.warning span {
  color: #e15b3a;
}
.transit-alert {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  width: 100%;
  margin-top: 9px;
  padding: 6px 8px;
  border: 0;
  border-radius: 8px;
  background: #fff1ec;
  text-align: left;
}
.transit-alert-mark {
  display: grid;
  place-items: center;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: #f27756;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}
.transit-alert-copy {
  min-width: 0;
}
.transit-alert-copy strong,
.transit-alert-copy small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.transit-alert-copy strong {
  color: #bd4e34;
  font-size: 9px;
  line-height: 12px;
}
.transit-alert-copy small {
  margin-top: 1px;
  color: #a57569;
  font-size: 7.5px;
}
.transit-alert b {
  color: #d95838;
  font-size: 9px;
  white-space: nowrap;
}

/* ===== 8. 推荐运力 ===== */
.rec-section {
  position: absolute;
  top: 686px;
  left: 16px;
  right: 16px;
  z-index: 3;
  padding-bottom: 150px;
  font-family: 'PingFang SC', sans-serif;
}
.rec-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.rec-head-main {
  flex: 1;
  min-width: 0;
}
.rec-title {
  margin: 0 0 0 3.65px;
  font-size: 17px;
  line-height: 1;
  font-weight: 700;
  color: #333;
}
.rec-title em {
  font-style: normal;
  color: #3a65ff;
}
.rec-subtitle {
  margin: 4px 0 0 3.65px;
  font-size: 11px;
  line-height: 15px;
  color: #8a96ad;
}
.rec-more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
/* 筛选条：智能排序样式（三项等分 + 实心小三角），active 时变蓝 */
.carrier-filter {
  display: flex;
  align-items: center;
  margin-top: 7px;
  padding: 0 4px;
}
.filter-item {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 0;
  background: none;
  padding: 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.filter-item.active {
  color: #3a65ff;
}
.filter-caret {
  width: 0;
  height: 0;
  border-left: 4.5px solid transparent;
  border-right: 4.5px solid transparent;
  border-bottom: 6px solid currentColor;
  transition: transform 0.2s;
}
.filter-caret.on {
  transform: rotate(180deg);
}
.vehicle-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 6px;
  padding: 0 4px;
}
.vehicle-chip {
  padding: 4px 12px;
  border: 1px solid #d9dde6;
  border-radius: 14px;
  background: #fff;
  font-size: 12px;
  color: #333;
}
.vehicle-chip.active {
  border-color: #3a65ff;
  background: #eaf2ff;
  color: #3a65ff;
  font-weight: 600;
}
.carrier-filter-result {
  margin: 8px 0 0 4px;
  font-size: 10px;
  color: #8a96ad;
}
/* 维度高亮行：当前筛选依据用主题蓝加重 */
.carrier-row-hl,
.carrier-row-hl .carrier-row-label {
  color: #3a65ff;
}
/* 首页推荐运力卡：规格取自设计稿 组81869（686×279@2x → 343×118@1x）
   照片 76×102 圆角6、卡片圆角10 内边距8、标题16px、数据行12px、标签9px */
.carrier-card {
  margin-top: 8px;
  background: #fff;
  border-radius: 10px;
  padding: 11px 10px;
  box-sizing: border-box;
  display: flex;
  gap: 12px;
  box-shadow: 0 2px 10px rgba(120, 140, 180, 0.08);
  cursor: pointer;
}
.carrier-side {
  position: relative;
  width: 76px;
  height: 106px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}
.carrier-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.carrier-coop {
  position: absolute;
  left: 50%;
  bottom: 5px;
  transform: translateX(-50%);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  height: 17.5px;
  padding: 0 6px;
  border-radius: 8.75px;
  background: rgba(39, 39, 39, 0.65);
  color: #f9d6ad;
  font-size: 9px;
  line-height: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.carrier-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.carrier-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}
.carrier-name {
  margin: 0;
  font-size: 16px;
  line-height: 22px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.carrier-rate {
  flex-shrink: 0;
  display: inline-flex;
  align-items: baseline;
  color: #1cae7d;
  font-size: 10px;
  line-height: 14px;
  font-weight: 600;
  margin-top: 4px;
}
.carrier-rate b {
  font-size: 16px;
  line-height: 16px;
  font-weight: 700;
  margin-right: 2px;
}
.carrier-rows {
  margin-top: 5px;
}
.carrier-row {
  margin: 0 0 3px;
  font-size: 12px;
  line-height: 17.5px;
  font-weight: 400;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.carrier-row-label {
  display: inline-block;
  width: 34px;
  color: #999;
  font-weight: 700;
}
.carrier-tags {
  margin-top: 9px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.carrier-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 4.5px;
  padding: 3px 7px;
  font-size: 9px;
  line-height: 12px;
  font-weight: 500;
}
.carrier-tag-gold {
  color: #784f21;
  background: #f9efd7;
}
.carrier-tag-purple {
  color: #808cb6;
  background: #edeff8;
}
.carrier-tag-blue {
  color: #27419c;
  background: #e8f1ff;
}

/* ===== 9. 底部 Tab 栏（设计 组合585 @750：总高 261，背景带 261，玻璃带 y112 h149） ===== */
.tab-bar {
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 130.5px; /* 261@750 → @375 */
  z-index: 20;
  pointer-events: none; /* 悬浮层不拦截内容点击，只让导航项可点 */
}
.tab-bg-top,
.tab-bg-bottom,
.tab-glass {
  position: absolute;
  left: 0;
  width: 375px;
  pointer-events: none;
}
/* 渐变背景上层：组合536 750×200 @y0 → 100px */
.tab-bg-top {
  top: 0;
  height: 100px;
}
/* 纯色背景下层：组合537 750×61 @y200 → 30.5px */
.tab-bg-bottom {
  bottom: -0.5px;
  height: 30.5px;
}
/* 中央缺口玻璃带：矢量108 750×149 @y112 → 74.5px */
.tab-glass {
  top: 56px;
  height: 74.5px;
}
.tab-item,
.tab-ai {
  pointer-events: auto;
}
/* Tab 定位（设计@750 y131 图标 44×44、y182 文字 20 高 → @375 半分） */
.tab-item {
  position: absolute;
  top: 65.5px;
  width: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  transform: translateX(-50%);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
/* 图标中心 x@750：首页81 / 货源216 / 运单534 / 我的669 → @375 */
.tab-home { left: 40.5px; }
.tab-goods { left: 108px; }
.tab-order { left: 267px; }
.tab-mine { left: 334.5px; }
.tab-icon {
  width: 22px;
  height: 22px;
}
.tab-label {
  font-size: 10px;
  line-height: 10px;
  font-weight: 700;
  color: #7b8699;
}
.tab-item.active .tab-label {
  color: #333;
}
.tab-item.active .tab-icon {
  filter: saturate(1.2) contrast(1.15);
}
/* 中央小简AI：白猫组合772 136×136 @dx308 dy39 → 68×68 @x154 y19.5；文字 59×20 @y182 → y91 居中 */
.tab-ai {
  border: 0;
  padding: 0;
  background: transparent;
  font: inherit;
  position: absolute;
  top: 0;
  left: 154px;
  width: 68px;
  height: 130.5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}
.tab-cat {
  margin-top: 19.5px;
  width: 68px;
  height: 67px;
  object-fit: contain;
  flex-shrink: 0;
}
.tab-ai .tab-label {
  margin-top: 4.5px;
  color: #7b8699;
}
.tab-ai.active .tab-label { color: #3a65ff; font-weight: 500; }
</style>
