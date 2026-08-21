<template>
  <div class="shipowner-preview">
    <!-- 订单中心（包含报价与订单双 Tab） -->
    <OrderCenter
      v-if="currentView === 'orderCenter' || currentView === 'myQuotes'"
      :quotes="userQuoteList"
      :default-tab="orderCenterDefaultTab"
      @back="currentView = 'home'"
      @nav-home="currentView = 'home'"
      @view-detail="openQuoteDetail"
      @edit-quote="editQuote"
      @view-order="handleViewOrder"
      @view-task="handleViewTask"
    />

    <!-- 报价详情页 -->
    <QuoteDetail
      v-else-if="currentView === 'quoteDetail'"
      :quote="selectedQuote"
      @back="onBackFromDetail"
      @edit-quote="editQuote"
      @view-order="handleViewOrder"
      @view-task="handleViewTask"
    />

    <!-- 详情视图 -->
    <CargoBiddingDetail
      v-else-if="currentView === 'detail'"
      :cargo-data="selectedCargo"
      :has-submitted-quote="!!(selectedCargo && submittedQuotes[selectedCargo.id])"
      @back="currentView = 'home'"
      @open-quote="currentView = 'quote'"
    />

    <!-- 报价全屏页面视图 -->
    <BiddingQuotePage
      v-else-if="currentView === 'quote'"
      :bidding-type="selectedCargo?.businessType || 'freight'"
      :cargo-data="selectedCargo"
      :read-only="false"
      :initial-quote="editingQuote || (selectedCargo ? submittedQuotes[selectedCargo.id] : null)"
      @back="onQuoteBack"
      @submit-success="onQuoteSuccess"
    />

    <!-- 首页大厅视图 -->
    <main v-else class="shipowner-screen" aria-label="运力服务大厅">
      <!-- 1. 地图背景与渐变遮罩 -->
      <img class="map-art" src="/shipowner-map-original.png" alt="福州货源地图" />
      <div class="map-fade"></div>
      <img class="status-art" src="/shipowner-statusbar.svg" alt="" />

      <!-- 2. 城市定位按钮 (左上角) -->
      <button class="city-button" type="button" @click="showCityPicker = true">
        <van-icon name="location" size="12" />
        <span>{{ currentCity }}</span>
        <span class="city-arrow"></span>
      </button>

      <!-- 3. 地图右上角扫码接单 -->
      <button class="map-scan-button" type="button" aria-label="扫码接单" title="扫码接单" @click="showScan = true">
        <van-icon name="scan" size="18" color="#173664" />
      </button>

      <!-- 4. 品牌标语 -->
      <h1 class="slogan">船东接货，就上江海云航</h1>

      <!-- 5. 地图货源/运力标点（联动一级业务分类） -->
      <button
        v-for="pin in activeMapPins"
        :key="pin.id"
        class="map-pin"
        :style="{ left: `${pin.left}px`, top: `${pin.top}px` }"
        type="button"
        :aria-label="`${pin.name}，${pin.count}条${activeBusinessCategory === 'freight' ? '货源' : '运力'}`"
        @click="showToast(`${pin.name} ${activeBusinessCategory === 'freight' ? '货源需求' : '运力需求'}共${pin.count}条`)"
      >
        <img src="/shipowner-map-pin.svg" alt="" />
      </button>

      <!-- 6. 面板底板背景 -->
      <img class="panel-background" src="/shipowner-panel-bg.svg" alt="" />
      <img class="panel-header-gradient" src="/shipowner-panel-header-gradient.svg" alt="" />

      <!-- 7. 一级业务分类：高亮品牌蓝为选中态，半透明白色为未选中态透出地图 -->
      <div class="dual-header-tabs annot-shipowner-home-rule-market-filter" aria-label="业务分类切换">
        <!-- 矢量弧线拼接背景 -->
        <svg class="header-tab-svg" viewBox="0 0 375 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- 选中态：高亮品牌蓝渐变 -->
            <linearGradient id="selectedBlueGrad" x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#4A75FF" />
              <stop offset="100%" stop-color="#2F58EE" />
            </linearGradient>
            <!-- 未选中态：半透明浅色背景 (透出地图) -->
            <linearGradient id="unselectedWhiteGrad" x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.92" />
              <stop offset="100%" stop-color="#F0F4FA" stop-opacity="0.8" />
            </linearGradient>
          </defs>

          <template v-if="activeBusinessCategory === 'freight'">
            <!-- 未选中右侧：运力竞价 (浅色半透明，透出地图) -->
            <path
              d="M180 0 L361 0 C369 0 375 6 375 14 L375 44 L194 44 C190 44 187 41 185 37 L182 7 C180 3 177 0 173 0 Z"
              fill="url(#unselectedWhiteGrad)"
            />
            <!-- 选中左侧：货源竞价 (高亮蓝色选中效果) -->
            <path
              d="M0 44 L0 14 C0 6 6 0 14 0 L173 0 C177 0 180 3 182 7 L185 37 C187 41 190 44 194 44 L0 44 Z"
              fill="url(#selectedBlueGrad)"
            />
          </template>

          <template v-else>
            <!-- 未选中左侧：货源竞价 (浅色半透明，透出地图) -->
            <path
              d="M195 0 L14 0 C6 0 0 6 0 14 L0 44 L181 44 C185 44 188 41 190 37 L193 7 C195 3 198 0 202 0 Z"
              fill="url(#unselectedWhiteGrad)"
            />
            <!-- 选中右侧：运力竞价 (高亮蓝色选中效果) -->
            <path
              d="M375 44 L375 14 C375 6 369 0 361 0 L202 0 C198 0 195 3 193 7 L190 37 C188 41 185 44 181 44 L375 44 Z"
              fill="url(#selectedBlueGrad)"
            />
          </template>
        </svg>

        <!-- 左侧按钮：货源需求 -->
        <button
          type="button"
          class="tab-btn left-tab-btn"
          :class="{ active: activeBusinessCategory === 'freight' }"
          @click="switchBusinessCategory('freight')"
        >
          <span>货源需求</span>
        </button>

        <!-- 右侧按钮：运力需求 -->
        <button
          type="button"
          class="tab-btn right-tab-btn"
          :class="{ active: activeBusinessCategory === 'capacity' }"
          @click="switchBusinessCategory('capacity')"
        >
          <span>运力需求</span>
        </button>
      </div>

      <!-- 8. 二级排序 Tab -->
      <nav class="sort-tabs" aria-label="列表排序">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- 9. 货源/运力 竞价卡片列表 -->
      <section class="cargo-list annot-shipowner-home-field-market-cards" aria-label="竞价列表">
        <article
          v-for="cargo in sortedCargoList"
          :key="cargo.id"
          class="cargo-card"
          :class="cargo.businessType"
          @click="onCard(cargo)"
        >
          <!-- 卡片第一行：需求类型标签 + 推荐度 + 时间 -->
          <div class="card-heading">
            <span class="biz-badge" :class="cargo.businessType">
              {{ cargo.businessType === 'freight' ? '货源需求' : '运力需求' }}
            </span>
            <span class="recommend"><strong>{{ cargo.recommendRate }}</strong> 推荐</span>
            <span class="time-range">{{ cargo.timeRange }}</span>
          </div>

          <!-- 路线区段 -->
          <div class="route-block">
            <div class="route-row origin-row">
              <i class="route-dot origin-dot"></i>
              <span class="route-name">{{ cargo.origin }}</span>
              <span class="route-distance">{{ cargo.originDistance }}</span>
            </div>
            <div class="route-row">
              <i class="route-dot destination-dot" :class="cargo.businessType"></i>
              <span class="route-name">{{ cargo.destination }}</span>
              <span class="route-distance">{{ cargo.destinationDistance }}</span>
            </div>
          </div>

          <!-- 业务标签 -->
          <div class="tag-row">
            <span class="platform-tag" :class="cargo.businessType">
              <b>平台</b><em>{{ cargo.platformName }}</em>
            </span>
            <span class="cargo-tag cargo-type" :class="cargo.businessType">{{ cargo.cargoType }}</span>
            <span class="cargo-tag transport-type" :class="cargo.businessType">{{ cargo.transportType }}</span>
            <span class="cargo-tag cargo-spec">{{ cargo.cargoSpec }}</span>
          </div>

          <!-- 参考价格 -->
          <div class="price-block">
            <span>{{ cargo.businessType === 'freight' ? '参考运费' : '参考采购' }}</span>
            <strong :class="cargo.businessType">{{ cargo.price }}</strong>
            <b :class="cargo.businessType">{{ cargo.unit }}</b>
          </div>

          <div class="card-divider"></div>

          <!-- 发布企业与时间 -->
          <div class="publisher-row">
            <div class="publisher-info">
              <img src="/shipowner-publisher-logo.svg" alt="" />
              <span class="publisher-name">{{ cargo.publisher }}</span>
            </div>
            <span class="publish-time">{{ cargo.publishTime }}</span>
          </div>
        </article>
      </section>

      <!-- 10. 底部导航 -->
      <div class="bottom-mask"></div>
      <nav class="bottom-nav" aria-label="底部导航">
        <img src="/shipowner-tabbar.svg?v=hall2" alt="大厅、订单、运单、我的" />
        <button
          v-for="(nav, index) in navs"
          :key="nav"
          type="button"
          :style="{ left: `${index * 25}%` }"
          :aria-label="nav"
          @click="onNav(nav)"
        ></button>
      </nav>
    </main>

    <!-- 城市选择对话框 -->
    <van-popup v-model:show="showCityPicker" round position="bottom" teleport="body">
      <van-picker
        title="选择城市"
        :columns="cities"
        @confirm="onCity"
        @cancel="showCityPicker = false"
      />
    </van-popup>

    <!-- 扫码接单对话框 -->
    <van-dialog v-model:show="showScan" title="扫码接单" show-cancel-button teleport="body">
      <div class="scan-dialog-content">
        <van-icon name="qr" size="64" color="#3a65ff" />
        <p>请对准货源二维码进行扫描接单</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { showToast } from 'vant'
import CargoBiddingDetail from './CargoBiddingDetail.vue'
import BiddingQuotePage from './BiddingQuotePage.vue'
import OrderCenter from './OrderCenter.vue'
import QuoteDetail from './QuoteDetail.vue'
import { mockCargoList, mockFreightMapPins, mockCapacityMapPins } from './mock-data.js'

const currentView = ref('home') // 'home' | 'detail' | 'quote' | 'orderCenter' | 'quoteDetail'
const orderCenterDefaultTab = ref('quote') // 'quote' | 'order'
const currentCity = ref('福州市')
const showCityPicker = ref(false)
const showScan = ref(false)

// 一级业务分类：freight(货源需求，默认) | capacity(运力需求)
const activeBusinessCategory = ref('freight')

// 二级排序：recommend(综合排序) | distance(距离最近) | latest(最新发布)
const activeTab = ref('recommend')

const tabs = [
  { key: 'recommend', label: '综合排序' },
  { key: 'distance', label: '距离最近' },
  { key: 'latest', label: '最新发布' },
]

const navs = ['大厅', '订单', '运单', '我的']

const cities = [
  { text: '福州市', value: '福州市' },
  { text: '厦门市', value: '厦门市' },
  { text: '宁波市', value: '宁波市' },
]

// 联动地图标点
const activeMapPins = computed(() => {
  return activeBusinessCategory.value === 'freight' ? mockFreightMapPins : mockCapacityMapPins
})

// 切换一级业务分类
const switchBusinessCategory = (category) => {
  activeBusinessCategory.value = category
  showToast(category === 'freight' ? '已切换至：货源需求' : '已切换至：运力需求')
}

// 规范化数据处理
const normalizedCargoList = computed(() => mockCargoList.map((item) => ({
  ...item,
  platformName: item.platformTag ? item.platformTag.replace(/^平台\s*/, '') : '象笨笨',
})))

// 联动计算列表（按一级分类过滤 + 按二级排序处理）
const sortedCargoList = computed(() => {
  let list = normalizedCargoList.value.filter(
    (item) => item.businessType === activeBusinessCategory.value
  )

  if (activeTab.value === 'latest') {
    list = [...list].reverse()
  } else if (activeTab.value === 'distance') {
    list = [...list].sort(
      (a, b) => Number.parseFloat(a.originDistance) - Number.parseFloat(b.originDistance)
    )
  }

  return list
})

const onCity = ({ selectedOptions }) => {
  currentCity.value = selectedOptions[0].text
  showCityPicker.value = false
  showToast(`已切换至：${currentCity.value}`)
}

const selectedCargo = ref(null)
const selectedQuote = ref(null)
const submittedQuotes = reactive({})

const onCard = (cargo) => {
  selectedCargo.value = cargo
  currentView.value = 'detail'
}

const genQuoteNo = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  return `BJ${stamp}${String(now.getTime()).slice(-3)}`
}

const onQuoteSuccess = (quoteData) => {
  if (selectedCargo.value) {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    submittedQuotes[selectedCargo.value.id] = {
      ...quoteData,
      quoteNo: quoteData.quoteNo || genQuoteNo(),
      businessType: selectedCargo.value.businessType,
      quoteTime: timeStr,
      quoteNote: quoteData.quoteRemark || '',
    }
  }
  const fromOrderCenter = !!editingQuote.value
  editingQuote.value = null
  currentView.value = fromOrderCenter ? 'orderCenter' : 'detail'
}

const onQuoteBack = () => {
  const fromOrderCenter = !!editingQuote.value
  editingQuote.value = null
  currentView.value = fromOrderCenter ? 'orderCenter' : 'detail'
}

// 我的报价：把用户提交的报价转换成统一报价单结构
const userQuoteList = computed(() =>
  Object.entries(submittedQuotes).map(([cargoId, q]) => ({
    quoteNo: q.quoteNo,
    quoteType: q.businessType || 'freight',
    status: '报价中',
    cargoId,
    unitPrice: Number(q.unitPrice) || 0,
    unit: q.unitSuffix || '元/吨',
    totalFreight: Number(String(q.totalDisplay || 0).replace(/[^\d]/g, '')) || 0,
    quoteTime: q.quoteTime || '',
    quoteNote: q.quoteNote || '',
  }))
)

const openQuoteDetail = (quote) => {
  selectedQuote.value = quote
  orderCenterDefaultTab.value = 'quote'
  currentView.value = 'quoteDetail'
}

const onBackFromDetail = () => {
  orderCenterDefaultTab.value = 'quote'
  currentView.value = 'orderCenter'
}

const openOrderCenter = (tab = 'quote') => {
  orderCenterDefaultTab.value = tab
  currentView.value = 'orderCenter'
}

// 修改报价：携带上一次报价内容，进入报价页
const editingQuote = ref(null)
const editQuote = (quote) => {
  const cargo = mockCargoList.find((c) => c.id === quote.cargoId) || null
  selectedCargo.value = cargo
  editingQuote.value = {
    unitPrice: quote.unitPrice,
    unitSuffix: quote.unit,
    totalDisplay: quote.totalFreight,
    basis: '按吨',
    quoteRemark: quote.quoteNote || '',
  }
  currentView.value = 'quote'
}

const handleViewOrder = (quote) => {
  // 转入订单 Tab
  orderCenterDefaultTab.value = 'order'
  currentView.value = 'orderCenter'
}

const handleViewTask = (quote) => {
  showToast(`已确认，进入运输任务（演示：${quote.quoteNo}）`)
}

const onNav = (nav) => {
  if (nav === '大厅') {
    showToast('当前已在运力服务首页')
    return
  }
  if (nav === '订单') {
    openOrderCenter('quote')
    return
  }
  showToast(`${nav}页面待演示`)
}
</script>

<style scoped>
.shipowner-preview {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 0;
  background: #e7e9ed;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.shipowner-screen {
  position: relative;
  width: 375px;
  height: 812px;
  overflow: hidden;
  flex: 0 0 auto;
  background: #e2e8f5;
  box-shadow: 0 16px 46px rgba(20, 37, 68, 0.18);
}

.map-art {
  position: absolute;
  z-index: 1;
  left: -67px;
  top: 0;
  width: 532.5px;
  height: 536px;
  object-fit: contain;
  pointer-events: none;
}

.map-fade {
  position: absolute;
  z-index: 2;
  inset: 0 0 auto 0;
  height: 189px;
  background: linear-gradient(180deg, rgba(196, 218, 255, 0.88) 0%, rgba(222, 235, 255, 0.5) 52%, rgba(235, 243, 255, 0) 100%);
  pointer-events: none;
}

.status-art {
  position: absolute;
  z-index: 20;
  left: 0;
  top: 0;
  width: 375px;
  height: 72px;
  pointer-events: none;
}

.city-button {
  position: absolute;
  z-index: 24;
  left: 16px;
  top: 44px;
  width: 78.5px;
  height: 24px;
  border: 0;
  border-radius: 13px;
  background: rgba(238, 245, 255, 0.78);
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(5px);
}

.city-arrow {
  width: 0;
  height: 0;
  margin-top: 2px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #333;
}

/* 地图右上角扫码接单小图标按钮 */
.map-scan-button {
  position: absolute;
  z-index: 24;
  right: 16px;
  top: 75.5px;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(23, 54, 100, 0.12);
  backdrop-filter: blur(5px);
  transition: transform 0.15s ease;
}

.map-scan-button:active {
  transform: scale(0.95);
}

.slogan {
  position: absolute;
  z-index: 18;
  left: 18.5px;
  top: 75.5px;
  margin: 0;
  color: #173664;
  font-size: 22px;
  font-weight: 800;
  line-height: 36px;
  letter-spacing: -0.5px;
  white-space: nowrap;
}

.map-pin {
  position: absolute;
  z-index: 12;
  width: 26.8px;
  height: 29px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.map-pin:active {
  transform: scale(1.15);
}

.map-pin img {
  display: block;
  width: 26.8px;
  height: 29px;
}

.panel-background {
  position: absolute;
  z-index: 10;
  left: 0;
  top: 277.22px;
  width: 375px;
  height: 495.55px;
  pointer-events: none;
}

.panel-header-gradient {
  position: absolute;
  z-index: 12;
  left: 0;
  top: 349.5px;
  width: 375px;
  height: 130.5px;
  pointer-events: none;
}

/* 双页签 50/50 弧线拼接 header */
.dual-header-tabs {
  position: absolute;
  z-index: 18;
  left: 0;
  top: 306.5px;
  width: 375px;
  height: 44px;
}

.header-tab-svg {
  position: absolute;
  left: 0;
  top: 0;
  width: 375px;
  height: 44px;
  pointer-events: none;
}

.tab-btn {
  position: absolute;
  top: 0;
  height: 44px;
  width: 187.5px;
  padding: 0;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.left-tab-btn {
  left: 0;
  padding-right: 8px;
}

.right-tab-btn {
  left: 187.5px;
  padding-left: 8px;
}

/* 未选中项：深灰色文字 */
.tab-btn span {
  font-size: 15px;
  font-weight: 600;
  color: #4E5969;
  transition: all 0.2s ease;
}

/* 选中项样式：高亮纯白 17px Bold */
.tab-btn.active span {
  font-size: 17px;
  font-weight: 800;
  color: #FFFFFF;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* 二级排序 Tab */
.sort-tabs {
  position: absolute;
  z-index: 17;
  left: 20px;
  right: 20px;
  top: 366px;
  height: 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.sort-tabs button {
  position: relative;
  min-width: 44px;
  min-height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #555;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 24px;
  cursor: pointer;
}

.sort-tabs button.active {
  color: #3a65ff;
}

.sort-tabs button.active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -2px;
  width: 16px;
  height: 2px;
  border-radius: 2px;
  background: #3a65ff;
  transform: translateX(-50%);
}

/* 竞价卡片列表 */
.cargo-list {
  position: absolute;
  z-index: 15;
  left: 0;
  right: 0;
  top: 396px;
  bottom: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 16px 116px;
  scrollbar-width: none;
}

.cargo-list::-webkit-scrollbar {
  display: none;
}

.cargo-card {
  position: relative;
  width: 343px;
  height: 156px;
  margin: 0 0 12px;
  overflow: hidden;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(39, 62, 103, 0.04);
  cursor: pointer;
}

.card-heading {
  position: absolute;
  left: 12px;
  top: 9.5px;
  height: 20px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

/* 竞价类型徽章 */
.biz-badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 5px;
  margin-right: 6px;
  border-radius: 3px;
  font-size: 10.5px;
  font-weight: 700;
  line-height: 18px;
}

.biz-badge.freight {
  background: #eef3ff;
  color: #2f68ff;
  border: 1px solid #c2d5ff;
}

.biz-badge.capacity {
  background: #e6f7f2;
  color: #149e77;
  border: 1px solid #a3e5d2;
}

.recommend {
  color: #1db889;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}

.recommend strong {
  font-size: 15px;
  font-weight: 500;
}

.time-range {
  margin-left: 7px;
  color: #111;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 19px;
  letter-spacing: -0.35px;
}

.route-block {
  position: absolute;
  left: 12px;
  top: 37px;
  width: 252px;
  height: 38px;
}

.route-block::before {
  content: "";
  position: absolute;
  left: 3.5px;
  top: 10px;
  width: 1px;
  height: 18px;
  background: #c8ced9;
}

.route-row {
  position: relative;
  height: 19px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.route-dot {
  position: relative;
  z-index: 1;
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  margin-right: 7px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 2px #fff;
}

.origin-dot { background: #3a65ff; }
.destination-dot { background: #23b98e; }
.destination-dot.capacity { background: #149e77; }

.route-name {
  color: #292929;
  font-size: 14px;
  font-weight: 600;
  line-height: 19px;
  letter-spacing: -0.25px;
}

.route-distance {
  margin-left: 6px;
  color: #9ba4b5;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
}

.tag-row {
  position: absolute;
  left: 12px;
  top: 91.5px;
  right: 88px;
  height: 18px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.platform-tag {
  height: 18px;
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid #2f68ff;
  border-radius: 3px;
  color: #2f68ff;
  font-size: 10px;
  font-style: normal;
  line-height: 16px;
}

.platform-tag.capacity {
  border-color: #149e77;
  color: #149e77;
}

.platform-tag b {
  height: 18px;
  padding: 0 4px;
  margin: -1px 0 -1px -1px;
  background: #2f68ff;
  color: #fff;
  font-weight: 500;
  line-height: 18px;
}

.platform-tag.capacity b {
  background: #149e77;
}

.platform-tag em {
  padding: 0 4px;
  font-style: normal;
  font-weight: 500;
}

.cargo-tag {
  height: 18px;
  padding: 0 6px;
  border-radius: 3px;
  font-size: 10px;
  line-height: 18px;
}

.cargo-type {
  background: #edf1ff;
  color: #3158b0;
}

.cargo-type.capacity {
  background: #e6f7f2;
  color: #149e77;
}

.transport-type {
  background: #e5f6f2;
  color: #179b78;
}

.transport-type.capacity {
  background: #eef8f5;
  color: #149e77;
}

.cargo-spec {
  max-width: 78px;
  overflow: hidden;
  background: #e9edf5;
  color: #65718c;
  text-overflow: ellipsis;
}

.price-block {
  position: absolute;
  right: 13px;
  top: 84px;
  width: 68px;
  text-align: right;
  white-space: nowrap;
}

.price-block > span {
  display: block;
  color: #8b94a5;
  font-size: 9px;
  line-height: 12px;
}

.price-block strong {
  color: #3465ff;
  font-size: 21px;
  font-weight: 700;
  line-height: 23px;
}

.price-block strong.capacity {
  color: #149e77;
}

.price-block b {
  color: #3465ff;
  font-size: 10px;
  font-weight: 600;
}

.price-block b.capacity {
  color: #149e77;
}

.card-divider {
  position: absolute;
  left: 7px;
  right: 12px;
  top: 121px;
  height: 1px;
  background: #edf0f4;
  transform: scaleY(0.5);
}

.publisher-row {
  position: absolute;
  left: 12px;
  right: 13px;
  top: 128px;
  height: 18.5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.publisher-info {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5.5px;
  text-align: left;
}

.publisher-info img {
  display: block;
  width: 22px;
  height: 18.5px;
  flex: 0 0 auto;
}

.publisher-name {
  overflow: hidden;
  color: #7d8799;
  font-size: 10.5px;
  font-weight: 500;
  line-height: 13px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.publish-time {
  flex: 0 0 auto;
  color: #9da5b3;
  font-size: 10px;
  line-height: 18px;
}

.bottom-mask {
  position: absolute;
  z-index: 30;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100px;
  background: linear-gradient(180deg, rgba(228, 234, 247, 0) 0%, rgba(228, 234, 247, 0.94) 35%, #e4eaf7 100%);
  pointer-events: none;
}

.bottom-nav {
  position: absolute;
  z-index: 35;
  left: 15.5px;
  bottom: 17.5px;
  width: 343px;
  height: 55px;
}

.bottom-nav > img {
  display: block;
  width: 343px;
  height: 55px;
  pointer-events: none;
}

.bottom-nav button {
  position: absolute;
  top: 0;
  width: 25%;
  height: 55px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.scan-dialog-content {
  padding: 24px;
  text-align: center;
}

.scan-dialog-content p {
  margin: 12px 0 0;
  color: #333;
  font-size: 14px;
}

@media (max-width: 420px) {
  .shipowner-preview {
    min-height: 812px;
    padding: 0;
    background: #e2e8f5;
  }

  .shipowner-screen {
    width: 100vw;
    max-width: 375px;
    box-shadow: none;
  }
}
</style>
