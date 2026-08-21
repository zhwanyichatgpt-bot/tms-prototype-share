<template>
  <div class="hall-design-page">
    <!-- ============ 1. 顶部门户导航栏 (白底设计稿) ============ -->
    <header class="top-nav-header">
      <div class="header-inner">
        <!-- 原版真实 Logo -->
        <div class="logo-cluster" @click="handleGoHome" style="cursor: pointer;">
          <img src="/hall-assets/header_logo.png" alt="至简至一 · 融合TMS数字货运平台" class="brand-real-logo-img" />
        </div>

        <!-- 导航菜单 -->
        <nav class="center-nav-menu">
          <span class="nav-link" @click="handleGoHome">首页</span>
          <span class="nav-link active">货源大厅</span>
          <span class="nav-link">联运方案</span>
          <span class="nav-link">物流专线</span>
          <span class="nav-link" @click="handleSwitchView('capacity')">运力大厅</span>
        </nav>

        <!-- 右侧操作 -->
        <div class="right-action-group">
          <div class="action-item icon-text">
            <span class="shield-icon">🛡️</span>
            <span>至简严选</span>
          </div>
          <div class="action-item">
            <span>APP下载</span>
            <span class="drop-arrow">▾</span>
          </div>
          <div class="action-item">商务合作</div>
          <div class="action-item" @click="handleGoHome">工作台</div>
          <div class="action-item">注册</div>
        </div>
      </div>
    </header>

    <!-- ============ 2. Hero 营销与搜索区 (浅蓝渐变背景 + 设计稿原图3D插画) ============ -->
    <section class="hero-search-container">
      <div class="hero-top-wrap">
        <div class="hero-text-col">
          <h1 class="hero-heading">找货源就上智慧梧州港—物流综合信息“一站式”平台</h1>
          <div class="hero-tags-line">
            <span class="hero-pill">整合物流资源</span>
            <span class="hero-pill">精准找货无忧</span>
            <span class="hero-pill">赋能企业降本增效</span>
          </div>
          <p class="hero-paragraph">
            通过协同区域内港口企业、船公司及私人船东、配送车队、货代等物流服务企业，整合物流运力资源，打造基于梧州港的供应链平台，实现为客户提供“一单制”、“一站式”的物流及贸易服务平台。
          </p>
        </div>

        <!-- 设计稿原版真实 3D 智慧物流插画原图 -->
        <div class="hero-3d-graphic">
          <img src="/hall-assets/hero_illustration.png" alt="智慧物流一站式平台" class="hero-real-illustration-img" />
        </div>
      </div>

      <!-- 搜索卡片与右侧快捷入口并排 -->
      <div class="search-row-layout">
        <!-- 左侧搜索卡片 -->
        <div class="main-search-card">
          <!-- 搜索卡片顶 Tab -->
          <div class="search-card-top-bar">
            <div class="card-tab-buttons">
              <span class="c-tab active">货源大厅</span>
              <span class="c-tab">联运方案</span>
              <span class="c-tab">运力大厅</span>
            </div>
            <div class="filter-toggle-link" @click="showMoreFilter = !showMoreFilter">
              <span class="funnel-icon">⚙</span>
              <span>更多筛选</span>
            </div>
          </div>

          <!-- 4 字段输入行（带中间切换按钮） -->
          <div class="search-fields-inline-row">
            <div class="address-date-item">
              <label class="item-lbl">装货地址</label>
              <div class="input-select-box">
                <input v-model="filters.loadCity" placeholder="湖北省武汉市长江新区" class="pure-input" />
                <span class="select-arrow">▾</span>
              </div>
            </div>

            <div class="address-date-item">
              <label class="item-lbl">装货时间</label>
              <div class="input-select-box">
                <input v-model="filters.loadTime" placeholder="2025-05-08 10:00:00" class="pure-input" />
                <span class="select-arrow">▾</span>
              </div>
            </div>

            <!-- 中间交换按钮 -->
            <div class="swap-direction-circle" title="交换起终点" @click="handleSwapCity">
              <span>⇄</span>
            </div>

            <div class="address-date-item">
              <label class="item-lbl">卸货地址</label>
              <div class="input-select-box">
                <input v-model="filters.unloadCity" placeholder="湖北省武汉市长江新区" class="pure-input" />
                <span class="select-arrow">▾</span>
              </div>
            </div>

            <div class="address-date-item">
              <label class="item-lbl">卸货时间</label>
              <div class="input-select-box">
                <input v-model="filters.unloadTime" placeholder="2025-05-09 10:00:00" class="pure-input" />
                <span class="select-arrow">▾</span>
              </div>
            </div>
          </div>

          <!-- 底部快速选项单选行 -->
          <div class="search-options-bottom-line">
            <!-- 业务类型 -->
            <div class="opt-group">
              <span class="opt-lbl">业务类型</span>
              <span
                v-for="b in businessTypeOptions"
                :key="b"
                class="opt-val"
                :class="{ active: filters.businessType === b }"
                @click="filters.businessType = b"
              >{{ b }}</span>
            </div>

            <span class="opt-divider"></span>

            <!-- 竞价模式 -->
            <div class="opt-group">
              <span class="opt-lbl">竞价模式</span>
              <span
                v-for="m in quoteModeOptions"
                :key="m"
                class="opt-val"
                :class="{ active: filters.quoteMode === m }"
                @click="filters.quoteMode = m"
              >{{ m }}</span>
            </div>

            <span class="opt-divider"></span>

            <!-- 车型 -->
            <div class="opt-group">
              <span class="opt-lbl">车型</span>
              <span
                v-for="v in vehicleTypeOptions"
                :key="v"
                class="opt-val"
                :class="{ active: filters.vehicleType === v }"
                @click="filters.vehicleType = v"
              >{{ v }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧两个并排快捷胶囊卡片 -->
        <div class="right-two-capsules">
          <div class="capsule-card bg-blue-grad" @click="handleMyQuotes">
            <div class="cap-icon-box blue-icon">📋</div>
            <div class="cap-text-box">
              <span class="cap-title">我的报价</span>
              <span class="cap-sub">空闲运力找货主</span>
            </div>
            <span class="cap-arrow">›</span>
          </div>

          <div class="capsule-card bg-green-grad" @click="handleMyTasks">
            <div class="cap-icon-box green-icon">🚚</div>
            <div class="cap-text-box">
              <span class="cap-title">我的托运</span>
              <span class="cap-sub">查看我承接的任务</span>
            </div>
            <span class="cap-arrow">›</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 3. 运输方式顶级 Tab 栏 ============ -->
    <div class="transport-big-tabs-bar">
      <div class="tabs-inner-row">
        <span
          v-for="t in transportModeOptions"
          :key="t"
          class="t-tab-item"
          :class="{ active: filters.transportMode === t }"
          @click="filters.transportMode = t"
        >{{ t }}</span>
      </div>
    </div>

    <!-- ============ 4. 货源列表主体 ============ -->
    <main class="portal-body-wrapper">
      <div class="body-main-grid">
        <!-- 左侧货源卡片流 (100% 还原图 2 设计稿精确属性) -->
        <div class="cargo-main-col">
          <!-- 排序与条数指示 -->
          <div class="sort-indicator-row">
            <div class="sort-pill-list">
              <span
                v-for="tab in sortTabs"
                :key="tab"
                class="sort-pill-btn"
                :class="{ active: currentSortTab === tab }"
                @click="currentSortTab = tab"
              >{{ tab }}</span>
            </div>

            <div class="match-stat-wrap">
              <span>已为您匹配 <b class="blue-bold">{{ filteredList.length }}</b> 条货源</span>
              <span class="refresh-clickable" @click="handleRefresh">↻ 刷新</span>
            </div>
          </div>

          <!-- 卡片列表 (严格对齐 Pixso 30:4665 规范) -->
          <div class="cargo-card-list">
            <div
              v-for="item in pagedList"
              :key="item.id"
              class="pixso-cargo-card"
              @click="handleCardClick(item)"
            >
              <!-- 1. 顶部路线与右侧大价格行 (35吨/元 一口价) -->
              <div class="card-line-top">
                <div class="route-and-tags">
                  <span class="route-city">{{ item.startCity }}</span>
                  <span class="route-gray-arrow">
                    <svg width="42" height="10" viewBox="0 0 42 10" fill="none">
                      <path d="M0 5H38M38 5L33 1M38 5L33 9" stroke="#999999" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <span class="route-city">{{ item.endCity }}</span>

                  <!-- 运输方式徽标 (带小图标) -->
                  <span class="badge-mode-pill" :class="item.transportMode === '公路' ? 'mode-green' : (item.transportMode === '水路' ? 'mode-blue' : 'mode-purple')">
                    <span v-if="item.transportMode === '公路'">🚌</span>
                    <span v-else-if="item.transportMode === '水路'">🚢</span>
                    <span v-else>✈️</span>
                    <span>{{ item.transportMode }}</span>
                  </span>

                  <!-- 短途/长途 标签 -->
                  <span class="badge-sub-pill">短途</span>
                  <!-- 货物大类标签 -->
                  <span class="badge-sub-pill">{{ item.cargoTypeTag }}</span>
                </div>

                <!-- 右侧价格 (35吨/元 一口价) -->
                <div class="card-price-unit-col">
                  <div class="red-price-text">
                    <span class="price-val">{{ item.expectedPrice }}</span>
                    <span class="price-unit">{{ item.priceUnit }}</span>
                  </div>
                  <span class="sub-price-desc">{{ item.priceType }}</span>
                </div>
              </div>

              <!-- 2. 中间 4 行参数（带浅灰线条小图标） -->
              <div class="card-params-four-lines">
                <div class="p-line">
                  <span class="p-icon-box">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="2" width="12" height="12" rx="2" stroke="#999999" stroke-width="1.2"/>
                      <path d="M8 5V8.5L10.5 10" stroke="#999999" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <span class="p-text">{{ item.timeWindow }}</span>
                </div>
                <div class="p-line">
                  <span class="p-icon-box">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2L14 5V11L8 14L2 11V5L8 2Z" stroke="#999999" stroke-width="1.2"/>
                      <path d="M8 2V14M2 5L8 8L14 5" stroke="#999999" stroke-width="1.2"/>
                    </svg>
                  </span>
                  <span class="p-text bold-item">{{ item.cargoDesc }}</span>
                </div>
                <div class="p-line">
                  <span class="p-icon-box">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="4" width="8" height="7" rx="1" stroke="#999999" stroke-width="1.2"/>
                      <path d="M10 6H13L14 8.5V11H10V6Z" stroke="#999999" stroke-width="1.2"/>
                      <circle cx="5" cy="12" r="1.5" fill="#999999"/>
                      <circle cx="12" cy="12" r="1.5" fill="#999999"/>
                    </svg>
                  </span>
                  <span class="p-text">{{ item.vehicleRequirement }}</span>
                </div>
                <div class="p-line">
                  <span class="p-icon-box">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M4 2H10L13 5V13C13 13.5523 12.5523 14 12 14H4C3.44772 14 3 13.5523 3 13V3C3 2.44772 3.44772 2 4 2Z" stroke="#999999" stroke-width="1.2"/>
                      <path d="M6 7H10M6 10H9" stroke="#999999" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <span class="p-text">{{ item.channelSource }}</span>
                </div>
              </div>

              <!-- 3. 底部横排：左侧企业信息 + 右侧倒计时小方块与大按钮 -->
              <div class="card-bottom-split-row">
                <div class="company-brand-left">
                  <div class="comp-box-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect width="28" height="28" rx="4" fill="#ffffff" stroke="#ebebeb"/>
                      <path d="M14 6L21 19H7L14 6Z" fill="#165dff"/>
                      <path d="M14 11L18 19H10L14 11Z" fill="#f53f3f"/>
                    </svg>
                  </div>
                  <div class="comp-brand-text">
                    <div class="comp-title-line">{{ item.shipperCompany }}</div>
                    <div class="comp-cred-line">
                      交易 {{ item.tradeCount }}次 | 发货量 {{ item.shipmentVolume }}吨 | 评分 <b>{{ item.score }}分</b>
                    </div>
                  </div>
                </div>

                <div class="actions-group-right">
                  <!-- 倒计时方块：距离竞价结束 0 1 : 1 3 : 2 0 -->
                  <div v-if="item.quoteMode === '竞价'" class="countdown-digit-boxes">
                    <span class="cd-title-text">距离竞价结束</span>
                    <span class="single-digit-box">0</span>
                    <span class="single-digit-box">1</span>
                    <span class="digit-colon">:</span>
                    <span class="single-digit-box">1</span>
                    <span class="single-digit-box">3</span>
                    <span class="digit-colon">:</span>
                    <span class="single-digit-box">2</span>
                    <span class="single-digit-box">0</span>
                  </div>

                  <!-- 操作大按钮 (实心深蓝 #165dff) -->
                  <button
                    class="action-cta-big-btn"
                    @click.stop="handleQuoteOrGrab(item)"
                  >
                    立即{{ item.quoteMode === '抢单' ? '抢单' : '报价' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页器 -->
          <div class="pagination-footer-row">
            <span class="total-txt">共 {{ filteredList.length }} 条</span>
            <select v-model="pageSize" class="size-dropdown">
              <option :value="6">6条/页</option>
              <option :value="12">12条/页</option>
            </select>
            <div class="page-numbers">
              <button class="pg-btn" :disabled="currentPage <= 1" @click="currentPage--">‹</button>
              <button
                v-for="p in totalPages"
                :key="p"
                class="pg-btn"
                :class="{ active: currentPage === p }"
                @click="currentPage = p"
              >{{ p }}</button>
              <button class="pg-btn" :disabled="currentPage >= totalPages" @click="currentPage++">›</button>
            </div>
            <div class="jump-box">
              <span>到第</span>
              <input v-model.number="currentPage" class="jump-inp" type="number" min="1" :max="totalPages" />
              <span>页</span>
            </div>
          </div>
        </div>

        <!-- 右侧「最新货源」侧边栏 (设计图右侧垂直列表) -->
        <aside class="latest-cargo-sidebar">
          <div class="sidebar-cards-stack">
            <div
              v-for="(sub, idx) in demoWaybills"
              :key="'sub-' + idx"
              class="sub-cargo-card"
            >
              <div class="sub-top-line">
                <span class="sub-comp">{{ sub.shipperCompany }}</span>
                <span class="sub-status-pill" :class="idx % 2 === 0 ? 'pill-taken' : 'pill-pub'">
                  {{ idx % 2 === 0 ? '已承接' : '已发布' }}
                </span>
              </div>
              <div class="sub-time">{{ sub.publishTime }}</div>
              <div class="sub-cargo-name">{{ sub.cargoDesc.split('|')[0].trim() }} | 50吨</div>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <!-- 交互出价弹窗 -->
    <div v-if="quoteDialogVisible" class="modal-overlay" @click.self="quoteDialogVisible = false">
      <div class="dialog-panel">
        <div class="dialog-head">
          <span class="d-title">{{ activeItem?.quoteMode === '抢单' ? '抢单确认' : '提交承运报价' }}</span>
          <span class="d-close" @click="quoteDialogVisible = false">×</span>
        </div>
        <div class="dialog-body">
          <div class="target-cargo-summary">
            <div>货源单号：<b>{{ activeItem?.id }}</b></div>
            <div>路线：<b>{{ activeItem?.startCity }} → {{ activeItem?.endCity }}</b></div>
            <div>货品：<b>{{ activeItem?.cargoDesc }}</b></div>
            <div>期望价格：<b style="color: #f53f3f;">{{ activeItem?.expectedPrice }} {{ activeItem?.priceUnit }}</b></div>
          </div>
          <div class="form-inputs-col mt-16">
            <div class="field-item">
              <label>承运运力/车船号</label>
              <input class="modal-inp" v-model="quoteForm.vehicleInfo" placeholder="如：闽A88888 (9.6米厢式货车)" />
            </div>
            <div class="field-item">
              <label>出价单价 ({{ activeItem?.priceUnit }})</label>
              <input class="modal-inp" v-model.number="quoteForm.price" type="number" placeholder="请输入单价" />
            </div>
            <div class="field-item">
              <label>联系电话</label>
              <input class="modal-inp" v-model="quoteForm.contactPhone" placeholder="请输入调度电话" />
            </div>
          </div>
        </div>
        <div class="dialog-foot">
          <button class="btn-gray" @click="quoteDialogVisible = false">取消</button>
          <button class="btn-blue" @click="handleConfirmQuote">确认提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { setCurrentWaybill } from '../../src/shared/prototype-store.js'
import {
  transportModeOptions,
  businessTypeOptions,
  quoteModeOptions,
  vehicleTypeOptions,
  sortTabs,
  demoWaybills
} from './mock-data.js'

const filters = reactive({
  loadCity: '',
  unloadCity: '',
  loadTime: '',
  unloadTime: '',
  businessType: '全部',
  quoteMode: '全部',
  vehicleType: '不限',
  transportMode: '全部',
})

const showMoreFilter = ref(false)
const currentSortTab = ref('最新')
const waybillList = ref([...demoWaybills])

function handleSwapCity() {
  const tmp = filters.loadCity
  filters.loadCity = filters.unloadCity
  filters.unloadCity = tmp
  ElMessage.info('已交换装卸货地址')
}

// 过滤列表
const filteredList = computed(() => {
  return waybillList.value.filter(item => {
    if (filters.businessType !== '全部' && item.businessType !== filters.businessType) return false
    if (filters.quoteMode !== '全部' && item.quoteMode !== filters.quoteMode) return false
    if (filters.transportMode !== '全部' && !item.transportMode.includes(filters.transportMode)) return false
    if (filters.loadCity && !item.startCity.includes(filters.loadCity)) return false
    if (filters.unloadCity && !item.endCity.includes(filters.unloadCity)) return false
    return true
  })
})

// 分页
const currentPage = ref(1)
const pageSize = ref(6)
const totalPages = computed(() => Math.ceil(filteredList.value.length / pageSize.value) || 1)

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

function handleRefresh() {
  ElMessage.success('货源列表已刷新')
}

function handleGoHome() {
  window.dispatchEvent(new CustomEvent('prototype-go-home'))
}

function handleSwitchView(tab) {
  if (tab === 'capacity') {
    window.dispatchEvent(new CustomEvent('prototype-open-page', { detail: { key: 'shipownerMobileHome' } }))
  } else {
    ElMessage.info(`正在切换至${tab}`)
  }
}

// 点击立即报价 / 立即抢单 -> 联动跳转至承运商报价页
function handleQuoteOrGrab(item) {
  setCurrentWaybill(item)
  ElMessage.success(`正在进入【${item.shipperCompany}】货源报价页面...`)
  window.dispatchEvent(new CustomEvent('prototype-open-page', { detail: { key: 'waybillQuote' } }))
}

function handleCardClick(item) {
  handleQuoteOrGrab(item)
}

function handleMyQuotes() {
  window.dispatchEvent(new CustomEvent('prototype-open-page', { detail: { key: 'waybillQuote' } }))
}

function handleMyTasks() {
  window.dispatchEvent(new CustomEvent('prototype-open-page', { detail: { key: 'transportPlan' } }))
}
</script>

<style scoped>
/* ============ 全局样式重置与背景 ============ */
.hall-design-page {
  min-height: 100vh;
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  color: #333333;
}

/* ============ 1. 顶部门户导航栏 (白底) ============ */
.top-nav-header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #ebebeb;
  display: flex;
  align-items: center;
}
.header-inner {
  width: 1440px;
  max-width: 95%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-cluster {
  display: flex;
  align-items: center;
}
.brand-real-logo-img {
  height: 38px;
  object-fit: contain;
}

.center-nav-menu {
  display: flex;
  gap: 36px;
}
.nav-link {
  font-size: 14px;
  color: #4e5969;
  cursor: pointer;
  padding: 8px 0;
  transition: color 0.15s;
}
.nav-link.active {
  color: #165dff;
  font-weight: 700;
}
.nav-link:hover { color: #165dff; }

.right-action-group {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 13px;
  color: #4e5969;
}
.action-item {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.action-item:hover { color: #165dff; }
.shield-icon { font-size: 14px; }
.drop-arrow { font-size: 10px; }

/* ============ 2. Hero 营销与搜索区 (浅蓝渐变 + 设计稿原版真实插画) ============ */
.hero-search-container {
  background: linear-gradient(180deg, #edf4ff 0%, #f4f8fe 60%, #f8fafc 100%);
  padding: 28px 0 20px;
  border-bottom: 1px solid #eef2f7;
}
.hero-top-wrap {
  width: 1440px;
  max-width: 95%;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hero-text-col {
  max-width: 760px;
}
.hero-heading {
  font-size: 26px;
  font-family: "PingFang SC-Bold", sans-serif;
  font-weight: 700;
  color: #333333;
  margin-bottom: 12px;
}
.hero-tags-line {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.hero-pill {
  font-size: 12px;
  font-weight: 700;
  background: #ffffff;
  border: 1px solid #d4e2ff;
  color: #165dff;
  padding: 3px 12px;
  border-radius: 4px;
}
.hero-paragraph {
  font-size: 13px;
  color: #647090;
  line-height: 1.6;
}

.hero-3d-graphic {
  flex-shrink: 0;
}
.hero-real-illustration-img {
  width: 480px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 8px 24px rgba(22, 93, 255, 0.08));
}

/* 搜索大卡片与右侧胶囊卡片布局 */
.search-row-layout {
  width: 1440px;
  max-width: 95%;
  margin: 0 auto;
  display: flex;
  gap: 20px;
  align-items: stretch;
}

.main-search-card {
  flex: 1;
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  border: 1px solid #eff2f9;
  padding: 16px 20px 14px;
}

/* 搜索卡片顶 Tab */
.search-card-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.card-tab-buttons {
  display: flex;
  gap: 8px;
}
.c-tab {
  font-size: 13px;
  padding: 4px 14px;
  border-radius: 4px;
  cursor: pointer;
  color: #4e5969;
  background: #f2f3f5;
}
.c-tab.active {
  background: #165dff;
  color: #ffffff;
  font-weight: 700;
}
.filter-toggle-link {
  font-size: 13px;
  color: #165dff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 4 字段输入行 */
.search-fields-inline-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.address-date-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.item-lbl {
  font-size: 12px;
  color: #999999;
}
.input-select-box {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #e0e2e6;
  border-radius: 4px;
  height: 34px;
  padding: 0 24px 0 10px;
  background: #ffffff;
}
.pure-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 13px;
  color: #333333;
}
.select-arrow {
  position: absolute;
  right: 8px;
  color: #999999;
  font-size: 10px;
  pointer-events: none;
}

.swap-direction-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f2f3f5;
  border: 1px solid #e0e2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4e5969;
  font-size: 14px;
  margin-top: 18px;
  flex-shrink: 0;
}
.swap-direction-circle:hover {
  background: #e8f3ff;
  color: #165dff;
  border-color: #165dff;
}

/* 底部快速选项单选行 */
.search-options-bottom-line {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-top: 10px;
  border-top: 1px solid #f2f4f8;
}
.opt-group {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}
.opt-lbl { color: #999999; }
.opt-val {
  color: #4e5969;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 2px;
}
.opt-val.active {
  color: #165dff;
  font-weight: 700;
}
.opt-divider {
  width: 1px;
  height: 14px;
  background: #e5e6eb;
}

/* 右侧两个快捷胶囊卡片 */
.right-two-capsules {
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}
.capsule-card {
  flex: 1;
  border-radius: 4px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: transform 0.15s;
}
.capsule-card:hover { transform: translateY(-2px); }
.bg-blue-grad {
  background: linear-gradient(135deg, #eaf2ff 0%, #d8e8ff 100%);
  border: 1px solid #c2dbff;
}
.bg-green-grad {
  background: linear-gradient(135deg, #eafff2 0%, #d4f7e2 100%);
  border: 1px solid #b7edd0;
}

.cap-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.cap-text-box {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.cap-title {
  font-size: 14px;
  font-weight: 700;
  color: #333333;
}
.cap-sub {
  font-size: 11px;
  color: #647090;
  margin-top: 2px;
}
.cap-arrow {
  font-size: 18px;
  color: #999999;
  font-weight: 700;
}

/* ============ 3. 运输方式顶级 Tab 栏 ============ */
.transport-big-tabs-bar {
  background: #ffffff;
  border-bottom: 1px solid #ebebeb;
}
.tabs-inner-row {
  width: 1440px;
  max-width: 95%;
  margin: 0 auto;
  display: flex;
  gap: 40px;
}
.t-tab-item {
  font-size: 16px;
  font-family: "PingFang SC-Regular", sans-serif;
  color: #333333;
  padding: 14px 0;
  cursor: pointer;
  position: relative;
}
.t-tab-item.active {
  color: #165dff;
  font-weight: 700;
}
.t-tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #165dff;
}

/* ============ 4. 货源列表主体 ============ */
.portal-body-wrapper {
  width: 1440px;
  max-width: 95%;
  margin: 20px auto 40px;
}
.body-main-grid {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.cargo-main-col {
  flex: 1;
}

/* 排序与条数指示 */
.sort-indicator-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.sort-pill-list {
  display: flex;
  gap: 8px;
}
.sort-pill-btn {
  font-size: 13px;
  color: #4e5969;
  padding: 4px 12px;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid #e0e2e6;
  cursor: pointer;
}
.sort-pill-btn.active {
  background: #165dff;
  border-color: #165dff;
  color: #ffffff;
  font-weight: 700;
}

.match-stat-wrap {
  font-size: 13px;
  color: #333333;
  display: flex;
  align-items: center;
  gap: 12px;
}
.blue-bold { color: #165dff; font-size: 15px; font-weight: 700; }
.refresh-clickable {
  color: #165dff;
  cursor: pointer;
}

/* ============ 货源卡片 (严格对齐 Pixso 30:4665 规范) ============ */
.cargo-card-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pixso-cargo-card {
  background: #ffffff;
  border: 1px solid #eff2f9;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  padding: 18px 24px 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.pixso-cargo-card:hover {
  border-color: #bad3ff;
  box-shadow: 0 4px 16px rgba(22, 93, 255, 0.06);
}

/* 1. 顶部路线与右侧价格 (35吨/元 一口价) */
.card-line-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.route-and-tags {
  display: flex;
  align-items: center;
  gap: 12px;
}
.route-city {
  font-size: 20px;
  font-family: "PingFang SC-Bold", sans-serif;
  font-weight: 700;
  color: #333333;
  line-height: 36px;
}
.route-gray-arrow {
  display: inline-flex;
  align-items: center;
}

/* 徽章 */
.badge-mode-pill {
  height: 24px;
  padding: 0 10px 0 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: "PingFang SC-Bold", sans-serif;
  font-weight: 700;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.mode-green { background: #00b42a; }
.mode-blue { background: #165dff; }
.mode-purple { background: #722ed1; }

.badge-sub-pill {
  height: 24px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 12px;
  font-family: "PingFang SC-Bold", sans-serif;
  font-weight: 700;
  color: #647090;
  background: #eff2f9;
  display: inline-flex;
  align-items: center;
}

/* 价格区 */
.card-price-unit-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.red-price-text {
  display: flex;
  align-items: baseline;
  color: #f53f3f;
}
.price-val {
  font-size: 24px;
  font-family: "PingFang SC-Bold", sans-serif;
  font-weight: 800;
  line-height: 1;
}
.price-unit {
  font-size: 14px;
  font-family: "PingFang SC-Bold", sans-serif;
  font-weight: 700;
  margin-left: 2px;
}
.sub-price-desc {
  font-size: 14px;
  font-family: "PingFang SC-Regular", sans-serif;
  color: #999999;
  line-height: 20px;
  margin-top: 4px;
}

/* 2. 中间 4 行参数 (带浅灰线条小图标) */
.card-params-four-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}
.p-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-family: "PingFang SC-Regular", sans-serif;
  line-height: 24px;
}
.p-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
}
.p-text {
  color: #333333;
}
.p-text.bold-item {
  color: #333333;
  font-weight: 600;
}

/* 3. 底部横排：左侧企业信息 + 右侧倒计时小方块与大按钮 */
.card-bottom-split-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #ebebeb;
}
.company-brand-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.comp-box-icon {
  display: flex;
  align-items: center;
}
.comp-brand-text {
  display: flex;
  flex-direction: column;
}
.comp-title-line {
  font-size: 16px;
  font-family: "PingFang SC-Regular", sans-serif;
  color: #333333;
  line-height: 24px;
}
.comp-cred-line {
  font-size: 13px;
  color: #999999;
  margin-top: 2px;
}
.comp-cred-line b {
  color: #333333;
}

.actions-group-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 倒计时小方块：0 1 : 1 3 : 2 0 */
.countdown-digit-boxes {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}
.cd-title-text {
  color: #333333;
  margin-right: 6px;
}
.single-digit-box {
  width: 20px;
  height: 24px;
  background: #e8f3ff;
  color: #165dff;
  font-weight: 700;
  font-size: 14px;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.digit-colon {
  color: #165dff;
  font-weight: 700;
  margin: 0 1px;
}

/* 操作大按钮 */
.action-cta-big-btn {
  width: 112px;
  height: 36px;
  border-radius: 4px;
  border: none;
  background: #165dff;
  color: #ffffff;
  font-size: 16px;
  font-family: "PingFang SC-Bold", sans-serif;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.action-cta-big-btn:hover {
  background: #3c7eff;
}

/* 分页栏 */
.pagination-footer-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  font-size: 13px;
  color: #4e5969;
}
.size-dropdown {
  height: 28px;
  border: 1px solid #e0e2e6;
  border-radius: 3px;
  padding: 0 8px;
  outline: none;
}
.page-numbers { display: flex; gap: 4px; }
.pg-btn {
  min-width: 28px;
  height: 28px;
  border: 1px solid #e0e2e6;
  background: #ffffff;
  border-radius: 3px;
  cursor: pointer;
}
.pg-btn.active {
  background: #165dff;
  border-color: #165dff;
  color: #ffffff;
}
.pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.jump-box { display: flex; align-items: center; gap: 4px; }
.jump-inp {
  width: 36px;
  height: 26px;
  border: 1px solid #e0e2e6;
  border-radius: 3px;
  text-align: center;
  outline: none;
}

/* ============ 右侧最新货源侧栏 ============ */
.latest-cargo-sidebar {
  width: 260px;
  flex-shrink: 0;
}
.sidebar-cards-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sub-cargo-card {
  background: #ffffff;
  border: 1px solid #eff2f9;
  border-radius: 4px;
  padding: 12px 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}
.sub-top-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.sub-comp {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}
.sub-status-pill {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
}
.pill-taken { background: #f2f7ff; color: #165dff; border: 1px solid #adcaff; }
.pill-pub { background: #f2f7ff; color: #165dff; border: 1px solid #adcaff; }

.sub-time {
  font-size: 12px;
  color: #999999;
  margin-bottom: 4px;
}
.sub-cargo-name {
  font-size: 13px;
  color: #666666;
}

/* ============ 弹窗 ============ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog-panel {
  width: 480px;
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
.dialog-head {
  height: 48px;
  padding: 0 20px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.d-title { font-size: 15px; font-weight: 700; }
.d-close { font-size: 18px; cursor: pointer; color: #86909c; }
.dialog-body { padding: 20px; }
.target-cargo-summary {
  background: #f8f9fc;
  border: 1px solid #eef1f5;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}
.form-inputs-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.field-item { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.modal-inp {
  height: 32px;
  border: 1px solid #e0e2e6;
  border-radius: 3px;
  padding: 0 10px;
  outline: none;
}
.modal-inp:focus { border-color: #165dff; }
.dialog-foot {
  height: 48px;
  padding: 0 20px;
  border-top: 1px solid #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
.btn-gray { height: 30px; padding: 0 16px; border: 1px solid #d8dce3; background: #ffffff; border-radius: 3px; cursor: pointer; }
.btn-blue { height: 30px; padding: 0 18px; border: none; background: #165dff; color: #ffffff; border-radius: 3px; cursor: pointer; }

.mt-16 { margin-top: 16px; }
</style>
