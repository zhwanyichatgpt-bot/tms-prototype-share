<template>
  <div class="hall-page">
    <BackBar current-title="询价大厅" />
    <!-- 顶部品牌头（简化版） -->
    <header class="site-header">
      <div class="header-inner">
        <div class="brand">
          <div class="brand-mark">至</div>
          <div class="brand-copy">
            <strong>TMS 货源大厅</strong>
            <span>承运商报价入口</span>
          </div>
        </div>
        <nav class="site-nav">
          <button type="button" class="active">货源大厅</button>
        </nav>
      </div>
    </header>

    <!-- Hero 区（保留营销头） -->
    <section class="hero-section">
      <div class="hero-inner">
        <div class="hero-copy">
          <h1>TMS 3.0 货源大厅</h1>
          <div class="hero-tags">
            <span>整合物流资源</span>
            <span>精准找货无忧</span>
            <span>赋能企业降本增效</span>
          </div>
          <p>承运商在货源大厅查看公开托运单，点击进入承运商报价页提交报价。</p>
        </div>
      </div>

      <!-- 搜索筛选卡 -->
      <div class="search-card">
        <div class="search-grid">
          <el-form :inline="true" :model="filters" size="small">
            <el-form-item label="装货地址">
              <el-select v-model="filters.loadCity" placeholder="全部" clearable style="width: 200px">
                <el-option v-for="c in cityOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="装货时间">
              <el-date-picker v-model="filters.loadTime" type="datetime" placeholder="装货时间" style="width: 200px" />
            </el-form-item>
            <el-form-item label="卸货地址">
              <el-select v-model="filters.unloadCity" placeholder="全部" clearable style="width: 200px">
                <el-option v-for="c in cityOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="卸货时间">
              <el-date-picker v-model="filters.unloadTime" type="datetime" placeholder="卸货时间" style="width: 200px" />
            </el-form-item>
          </el-form>
        </div>
        <div class="quick-filter">
          <span>业务类型</span>
          <el-radio-group v-model="filters.businessType" size="small">
            <el-radio-button v-for="t in businessTypeFilters" :key="t" :label="t">{{ t }}</el-radio-button>
          </el-radio-group>
          <i></i>
          <span>竞价模式</span>
          <el-radio-group v-model="filters.quoteMode" size="small">
            <el-radio-button v-for="m in quoteModeFilters" :key="m" :label="m">{{ m }}</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </section>

    <main class="hall-main">
      <!-- 运输方式 Tabs -->
      <el-tabs v-model="filters.transportTab">
        <el-tab-pane v-for="tab in transportTabs" :key="tab" :label="tab" :name="tab" />
      </el-tabs>

      <div class="content-layout">
        <!-- 左侧货源列表 -->
        <section class="source-column">
          <div class="sort-row">
            <el-radio-group v-model="filters.sort" size="small">
              <el-radio-button v-for="s in sortOptions" :key="s" :label="s">{{ s }}</el-radio-button>
            </el-radio-group>
            <div class="match-stat">
              已为您匹配 <strong>{{ filteredWaybills.length }}</strong> 条货源
              <el-button type="primary" link size="small" @click="refreshList">刷新</el-button>
            </div>
          </div>

          <el-empty
            v-if="!filteredWaybills.length"
            description="暂无符合条件的公开托运单，可返回托运单管理创建公开托运单后再查看。"
          />

          <article
            v-for="item in pagedWaybills"
            :key="item.id"
            class="source-card"
            @click="viewDetail(item)"
          >
            <div class="source-content">
              <div class="route-line">
                <strong>{{ routeStart(item.routeTitle) }}</strong>
                <span class="arrow">→</span>
                <strong>{{ routeEnd(item.routeTitle) }}</strong>
                <em class="mode-solid-tag" :class="'mode-' + shortTransportMode(item.transportMode)">{{ shortTransportMode(item.transportMode) }}</em>
                <em class="mode-light-tag">{{ item.businessType }}</em>
              </div>
              <div class="requirement-list">
                <p><b>◴</b>{{ item.loadWindow }}装货 - {{ item.unloadWindow }}卸货</p>
                <p><b>◈</b>{{ cargoSummary(item) }}</p>
                <p><b>▣</b>{{ item.vehicleRequirement }}　|　总里程{{ item.mileage }}km</p>
                <p><b>▤</b>{{ item.serviceRequirement }}</p>
              </div>
              <div class="company-line">
                <div class="company-logo">{{ (item.carrierName || '?').charAt(0) }}</div>
                <div>
                  <strong>{{ item.carrierName }}</strong>
                  <span>交易 {{ item.tradeCount }}次　|　发货量 {{ item.shipmentVolume }}吨　|　评分 <b>{{ item.score }}</b>分</span>
                </div>
              </div>
            </div>
            <aside class="price-box">
              <strong>{{ item.expectedPrice || 35 }}<span>元/吨</span></strong>
              <span class="price-tag">一口价</span>
              <button class="cta-btn" @click.stop="goQuote(item)">
                立即{{ item.quoteMode === '抢单' ? '抢单' : '报价' }}
              </button>
              <div v-if="item.status === '竞价中'" class="countdown">
                <span>距离竞价结束</span>
                <i>{{ countdownText(item).slice(0,2) }}</i><em>:</em><i>{{ countdownText(item).slice(2,4) }}</i><em>:</em><i>{{ countdownText(item).slice(4,6) }}</i>
              </div>
            </aside>
          </article>

          <div v-if="filteredWaybills.length" class="pagination-row">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :total="filteredWaybills.length"
              :page-sizes="[6, 12]"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
        </section>

        <!-- 右侧最新货源 -->
        <aside class="right-column">
          <h3 class="right-title">最新货源</h3>
          <div
            v-for="(item, index) in recentWaybills"
            :key="item.id + '-' + index"
            class="recent-card"
            @click="viewDetail(item)"
          >
            <div>
              <strong>{{ item.carrierName }}</strong>
              <el-tag size="small" type="info" effect="plain">{{ item.recentStatus }}</el-tag>
            </div>
            <span>{{ item.publishTime }}</span>
            <p>{{ compactCargo(item) }}</p>
          </div>
        </aside>
      </div>
    </main>

    <!-- 货源详情弹窗 -->
    <el-dialog v-model="showDetailDialog" title="货源详情" width="720px">
      <template v-if="currentWaybill">
        <div class="detail-sub">托运单号：{{ currentWaybill.id }}</div>
        <section class="detail-section">
          <div class="section-title">基础信息</div>
          <div class="detail-grid">
            <div class="detail-cell"><span>业务类型</span><b>{{ currentWaybill.businessType }}</b></div>
            <div class="detail-cell"><span>运输方式</span><b>{{ currentWaybill.transportMode }}</b></div>
            <div class="detail-cell"><span>托运企业</span><b>{{ currentWaybill.shipperCompany }}</b></div>
            <div class="detail-cell"><span>联系人</span><b>{{ currentWaybill.contactName }} / {{ currentWaybill.contactPhone }}</b></div>
          </div>
        </section>
        <section class="detail-section">
          <div class="section-title">货品信息</div>
          <el-table :data="currentWaybill.cargoItems" border size="small">
            <el-table-column prop="cargoName" label="货品" />
            <el-table-column label="包装">
              <template #default="{ row }">{{ row.packageType || row.package || '-' }}</template>
            </el-table-column>
            <el-table-column label="重量">
              <template #default="{ row }">{{ row.weight || 0 }}吨</template>
            </el-table-column>
            <el-table-column label="数量">
              <template #default="{ row }">{{ row.quantity || 0 }}{{ row.unit || '吨' }}</template>
            </el-table-column>
            <el-table-column label="装货点">
              <template #default="{ row }">{{ row.loadPoint || row.loadNodeName || '-' }}</template>
            </el-table-column>
            <el-table-column label="卸货点">
              <template #default="{ row }">{{ row.unloadPoint || currentWaybill.unloadName || '-' }}</template>
            </el-table-column>
          </el-table>
        </section>
        <section class="detail-section">
          <div class="section-title">运输要求</div>
          <div class="detail-grid">
            <div class="detail-cell"><span>期望价格</span><b class="amount">¥{{ currentWaybill.expectedPrice || 0 }}/吨</b></div>
            <div class="detail-cell"><span>计费依据</span><b>{{ currentWaybill.billingBasis || '-' }}</b></div>
            <div class="detail-cell"><span>税务要求</span><b>{{ currentWaybill.taxRequirement || '-' }}</b></div>
            <div class="detail-cell"><span>付款方式</span><b>{{ currentWaybill.paymentMethod || '-' }}</b></div>
          </div>
        </section>
      </template>
      <template #footer>
        <el-button @click="closeDetail">关闭</el-button>
        <el-button v-if="currentWaybill" type="primary" @click="goQuote(currentWaybill)">去报价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { demoWaybills } from './mock-data'
import { prototypeStore } from '../../src/shared/prototype-store'
import BackBar from '../../src/components/BackBar.vue'

const waybillList = ref([])
const showDetailDialog = ref(false)
const currentWaybill = ref(null)
const page = ref(1)
const pageSize = ref(6)

const transportTabs = ['全部', '汽运', '水运', '火运', '联运']
const sortOptions = ['最新', '长途', '短途', '价格最优', '零担运输', '整车运输']
const businessTypeFilters = ['全部', '普通运输', '集装箱运输']
const quoteModeFilters = ['全部', '抢单', '竞价']
const cityOptions = ['湖北省武汉市长江新区', '福建 福州', '福建 厦门', '安徽 宿迁', '浙江 金华']

const filters = reactive({
  transportTab: '全部',
  sort: '最新',
  businessType: '全部',
  quoteMode: '全部',
  loadCity: '',
  unloadCity: '',
  loadTime: '',
  unloadTime: '',
})

function loadWaybillList() {
  // 从 prototype-store 读取托运单（管理页写入的），过滤掉草稿
  const all = prototypeStore.waybills.filter(item => item.status !== '草稿')
  const sorted = all.sort((a, b) => new Date(b.publishTime || 0) - new Date(a.publishTime || 0))
  waybillList.value = sorted.length ? sorted : demoWaybills
  if (page.value > totalPages.value) page.value = totalPages.value
}

function normalizeWaybill(raw) {
  // 集装箱业务：从 containerNodes 取装货/卸货节点作为起止地址
  const containerNodes = Array.isArray(raw.containerNodes) ? raw.containerNodes : []
  const isContainer = raw.businessType === '集装箱' || (containerNodes.length > 0 && (!raw.loadNodes || raw.loadNodes.length === 0))
  let loadName, unloadName
  if (isContainer && containerNodes.length > 0) {
    const loadNode = containerNodes.find(n => n.nodeType === '装货' || n.nodeType === '提重') || containerNodes[0]
    const unloadNode = containerNodes.find(n => n.nodeType === '卸货' || n.nodeType === '还重') || containerNodes[containerNodes.length - 1]
    loadName = (loadNode && (loadNode.name || loadNode.address)) || '-'
    unloadName = (unloadNode && (unloadNode.name || unloadNode.address)) || '-'
  } else {
    loadName = raw.loadNodes && raw.loadNodes[0] ? raw.loadNodes[0].name : (raw.loadName || '-')
    unloadName = raw.unloadNodes && raw.unloadNodes[raw.unloadNodes.length - 1] ? raw.unloadNodes[raw.unloadNodes.length - 1].name : (raw.unloadName || '-')
  }
  const cargoItems = (raw.cargoItems && raw.cargoItems.length ? raw.cargoItems : []).map(cargo => ({
    ...cargo,
    loadPoint: cargo.loadPoint || cargo.loadNodeName || loadName,
    unloadPoint: cargo.unloadPoint || unloadName,
    unit: cargo.unit || '吨',
  }))
  return {
    ...raw,
    cargoItems,
    unloadName,
    routeTitle: `${loadName || '起点'} → ${unloadName || '终点'}`,
    carrierName: raw.shipperCompany || '厦门港口物流有限公司',
    tradeCount: raw.tradeCount || 2000,
    shipmentVolume: raw.shipmentVolume || 10000,
    score: raw.score || 4.5,
    quoteMode: raw.quoteMode || (raw.publishMode && raw.publishMode.includes('抢单') ? '抢单' : '竞价'),
    vehicleRequirement: raw.vehicleRequirement || '9.6米厢式货车',
    serviceRequirement: raw.serviceRequirement || '超好运',
    mileage: raw.mileage || 89,
    recentStatus: raw.status === '已成交' ? '已承接' : '已发布',
    loadWindow: '8月10日上午10:00',
    unloadWindow: '8月15日下午10:00',
    publishTime: raw.publishTime
      ? new Date(raw.publishTime).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      : '2026-07-05 10:00:30',
  }
}

const normalizedWaybills = computed(() => waybillList.value.map(normalizeWaybill))

const filteredWaybills = computed(() => {
  return normalizedWaybills.value.filter(item => {
    if (filters.transportTab !== '全部' && shortTransportMode(item.transportMode) !== filters.transportTab) return false
    if (filters.businessType === '普通运输' && item.businessType === '集装箱') return false
    if (filters.businessType === '集装箱运输' && item.businessType !== '集装箱') return false
    if (filters.quoteMode !== '全部' && item.quoteMode !== filters.quoteMode) return false
    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredWaybills.value.length / pageSize.value)))

const pagedWaybills = computed(() => {
  const safePage = Math.min(page.value, totalPages.value)
  const start = (safePage - 1) * pageSize.value
  return filteredWaybills.value.slice(start, start + pageSize.value)
})

const recentWaybills = computed(() => {
  const list = filteredWaybills.value.length ? filteredWaybills.value : normalizedWaybills.value
  return list.concat(list).slice(0, 9)
})

// 倒计时文本（原型用：基于 id 生成稳定的 HHMMSS 格式，真实应取竞价截止时间）
function countdownText(item) {
  const idStr = String(item.id || '')
  let hash = 0
  for (let i = 0; i < idStr.length; i++) hash = (hash + idStr.charCodeAt(i) * (i + 1)) >>> 0
  const hh = String(hash % 48).padStart(2, '0')
  const mm = String(Math.floor(hash / 60) % 60).padStart(2, '0')
  const ss = String(Math.floor(hash / 3600) % 60).padStart(2, '0')
  return `${hh}${mm}${ss}`
}

function routeStart(routeTitle) {
  return (routeTitle || '').split('→')[0].trim() || '待确认'
}
function routeEnd(routeTitle) {
  return (routeTitle || '').split('→')[1].trim() || '路线'
}
function shortTransportMode(mode) {
  if (!mode) return '汽运'
  if (mode.includes('水')) return '水运'
  if (mode.includes('铁') || mode.includes('火')) return '火运'
  if (mode.includes('联运')) return '联运'
  return '汽运'
}
function modeTagType(mode) {
  const short = shortTransportMode(mode)
  if (short === '水运') return 'primary'
  if (short === '火运') return 'success'
  if (short === '联运') return 'warning'
  return 'info'
}
function cargoSummary(item) {
  return item.cargoItems.map(c => `${c.cargoName}　|　${c.weight || 0}吨　|　${c.quantity || 0}${c.unit || '吨'}　|　${c.packageType || c.package || '无包装'}`).join('，')
}
function compactCargo(item) {
  const c = item.cargoItems[0] || {}
  return `${c.cargoName || '货品'} | ${c.weight || 0}吨`
}
function viewDetail(item) {
  currentWaybill.value = item
  showDetailDialog.value = true
}
function closeDetail() {
  showDetailDialog.value = false
  currentWaybill.value = null
}
function refreshList() {
  loadWaybillList()
  ElMessage.success('已刷新')
}
function goQuote(item) {
  ElMessage.info(`去报价：${item.id}（承运商报价页待迁移后才能跳转）`)
  closeDetail()
}

onMounted(() => {
  loadWaybillList()
})
</script>

<style scoped>
.hall-page {
  min-height: 100vh;
  background: #fff;
  overflow-x: hidden;
}

.site-header {
  height: 58px;
  border-bottom: 1px solid #eef0f5;
  background: #fff;
}
.header-inner {
  width: 1200px;
  max-width: calc(100vw - 64px);
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
}
.brand {
  width: 300px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-mark {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #2468f2;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 3px 8px rgba(36, 104, 242, 0.18);
}
.brand-copy {
  padding-left: 14px;
  border-left: 1px solid #cfd6e3;
}
.brand-copy strong {
  display: block;
  font-size: 17px;
  color: #212936;
}
.brand-copy span {
  display: block;
  margin-top: 2px;
  color: #9aa3b2;
  font-size: 10px;
  letter-spacing: 3px;
}
.site-nav {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}
.site-nav button {
  border: 0;
  background: transparent;
  color: #6f7785;
  font-size: 14px;
  cursor: pointer;
}
.site-nav button.active {
  color: #1f2937;
  font-weight: 600;
}

.hero-section {
  background: linear-gradient(135deg, #f5f9ff 0%, #e8f1ff 100%);
  padding: 24px 0 28px;
}
.hero-inner {
  width: 1200px;
  max-width: calc(100vw - 64px);
  margin: 0 auto;
  padding: 0 0 20px;
}
.hero-copy h1 {
  font-size: 26px;
  color: #1d2433;
  margin: 0 0 12px;
  font-weight: 700;
}
.hero-tags {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.hero-tags span {
  padding: 4px 12px;
  border-radius: 14px;
  background: #d9e7ff;
  color: #2468f2;
  font-size: 12px;
}
.hero-copy p {
  color: #5d6b80;
  font-size: 13px;
  max-width: 720px;
  line-height: 1.7;
}

.search-card {
  width: 1200px;
  max-width: calc(100vw - 64px);
  margin: 0 auto;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(36, 104, 242, 0.08);
  padding: 18px 22px;
}
.search-grid :deep(.el-form--inline .el-form-item) {
  margin-bottom: 8px;
}
.quick-filter {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #eef0f5;
  color: #4e5969;
  font-size: 13px;
}
.quick-filter i {
  display: inline-block;
  width: 1px;
  height: 16px;
  background: #dfe3ea;
}

.hall-main {
  width: 1200px;
  max-width: calc(100vw - 64px);
  margin: 24px auto;
}
.content-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 20px;
  margin-top: 16px;
}

.sort-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.match-stat {
  font-size: 13px;
  color: #6b7280;
}
.match-stat strong {
  color: #2468f2;
}

.source-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px;
  gap: 20px;
  background: #fff;
  border: 1px solid #eef0f5;
  border-radius: 6px;
  padding: 18px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}
.source-card:hover {
  box-shadow: 0 4px 14px rgba(36, 104, 242, 0.1);
  transform: translateY(-1px);
}
.source-content {
  min-width: 0;
}
.route-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 15px;
}
.route-line strong {
  color: #1d2433;
  font-size: 16px;
}
.route-line .arrow {
  color: #9aa3b2;
}
.requirement-list {
  margin-bottom: 12px;
}
.requirement-list p {
  color: #5d6b80;
  font-size: 13px;
  line-height: 1.9;
}
.requirement-list b {
  color: #2468f2;
  margin-right: 8px;
}
.company-line {
  display: flex;
  align-items: center;
  gap: 10px;
}
.company-logo {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: #2468f2;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.company-line strong {
  color: #1d2433;
  font-size: 13px;
  display: block;
}
.company-line span {
  color: #9aa3b2;
  font-size: 12px;
}
/* 实心彩色 mode-tag */
.mode-solid-tag {
  padding: 2px 10px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  font-style: normal;
}
.mode-solid-tag.mode-汽运 { background: #21bd88; }
.mode-solid-tag.mode-水运 { background: #4aa8e8; }
.mode-solid-tag.mode-火运 { background: #7c5bd9; }
.mode-solid-tag.mode-联运 { background: #7c5bd9; }
.mode-light-tag {
  padding: 2px 10px;
  border-radius: 3px;
  font-size: 12px;
  background: #eef0f5;
  color: #6b7280;
  font-style: normal;
}

.price-box {
  border-left: 1px dashed #eef0f5;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  min-width: 160px;
}
.price-box strong {
  font-size: 26px;
  color: #f53f3f;
  font-weight: 700;
  line-height: 1;
}
.price-box strong span {
  font-size: 14px;
  font-weight: 500;
}
.price-box span {
  color: #9aa3b2;
  font-size: 12px;
}
.price-tag {
  background: #fff0f0;
  color: #d93026;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
}
.cta-btn {
  width: 100%;
  height: 34px;
  background: #3478ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 4px;
}
.cta-btn:hover { background: #2f68ed; }
.countdown {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #f2870b;
  font-size: 12px;
  margin-top: 4px;
}
.countdown i {
  font-style: normal;
  background: #f2870b;
  color: #fff;
  padding: 2px 4px;
  border-radius: 2px;
}
.countdown em {
  font-style: normal;
}

.pagination-row {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.right-column {
  background: #fff;
  border: 1px solid #eef0f5;
  border-radius: 6px;
  padding: 14px;
  height: fit-content;
}
.right-title {
  margin: 0 0 12px;
  font-size: 14px;
  color: #1d2433;
  font-weight: 600;
}
.recent-card {
  padding: 10px;
  background: #f7f9fc;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
}
.recent-card:hover {
  background: #eef4ff;
}
.recent-card > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.recent-card strong {
  font-size: 13px;
  color: #1d2433;
}
.recent-card span {
  font-size: 11px;
  color: #9aa3b2;
}
.recent-card p {
  font-size: 12px;
  color: #5d6b80;
  margin: 4px 0 0;
}

.detail-sub {
  color: #9aa3b2;
  font-size: 12px;
  margin-bottom: 16px;
}
.detail-section {
  margin-bottom: 18px;
}
.section-title {
  position: relative;
  padding-left: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #1d2433;
  margin-bottom: 10px;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 14px;
  background: #2468f2;
  transform: translateY(-50%);
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 20px;
}
.detail-cell {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f7f9fc;
  border-radius: 4px;
  font-size: 13px;
}
.detail-cell span {
  color: #6b7280;
}
.detail-cell b {
  color: #1d2433;
  font-weight: 600;
}
.detail-cell .amount {
  color: #f53f3f;
}

@media (max-width: 1200px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
  .right-column {
    order: -1;
  }
  .source-card {
    grid-template-columns: 1fr;
  }
  .price-box {
    border-left: none;
    border-top: 1px dashed #eef0f5;
    padding-left: 0;
    padding-top: 12px;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
}
</style>
