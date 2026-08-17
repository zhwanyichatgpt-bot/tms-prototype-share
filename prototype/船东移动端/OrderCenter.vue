<template>
  <div class="oc-preview">
    <main class="oc-screen" aria-label="订单中心">
      <!-- 顶部状态栏 -->
      <img class="oc-status-art" src="/shipowner-statusbar.svg" alt="" />

      <!-- 顶部 Header：标题“订单” + 胶囊 Tab [报价] [订单] -->
      <header class="oc-header">
        <div class="oc-title-group">
          <span class="oc-title">订单</span>
          <span class="oc-title-decor"></span>
        </div>

        <!-- 胶囊 Tab 切换 -->
        <nav class="oc-capsule-tabs" aria-label="业务Tab切换">
          <button
            type="button"
            class="oc-tab-item"
            :class="{ active: currentTab === 'quote' }"
            @click="switchTab('quote')"
          >
            报价
          </button>
          <button
            type="button"
            class="oc-tab-item"
            :class="{ active: currentTab === 'order' }"
            @click="switchTab('order')"
          >
            订单
          </button>
        </nav>
      </header>

      <!-- 搜索行：长搜索框 + 筛选按钮 -->
      <div class="oc-search-row">
        <div class="oc-search">
          <van-icon name="search" size="15" color="#8C99A8" />
          <input
            v-if="currentTab === 'quote'"
            v-model="quoteKeyword"
            placeholder="请输入报价单号/发布企业"
            aria-label="搜索报价单号或发布企业"
          />
          <input
            v-else
            v-model="orderKeyword"
            placeholder="请输入托运单号/托运企业"
            aria-label="搜索托运单号或托运企业"
          />
        </div>
        <button class="oc-filter-btn" type="button" aria-label="筛选" @click="showFilter = true">
          <span>筛选</span>
          <van-icon name="arrow-down" size="11" />
        </button>
      </div>

      <!-- 快捷状态过滤 chips -->
      <div class="oc-status-row" aria-label="快捷状态过滤">
        <button
          v-for="s in activeStatusOptions"
          :key="s.value"
          type="button"
          class="oc-status-chip"
          :class="{ active: (currentTab === 'quote' ? quoteStatusFilter : orderStatusFilter) === s.value }"
          @click="onStatusClick(s.value)"
        >
          {{ s.text }}
        </button>
      </div>

      <!-- ================= 报价 Tab 列表 ================= -->
      <section v-if="currentTab === 'quote'" class="oc-list" aria-label="报价单列表">
        <article
          v-for="q in filteredQuotes"
          :key="q.quoteNo"
          class="oc-card oc-quote-card"
          :class="q.quoteType"
          @click="$emit('view-detail', q)"
        >
          <!-- 卡片第一行：报价类型徽章 + 报价状态 + 运输时间 -->
          <div class="oc-card-head">
            <span class="oc-biz-badge" :class="q.quoteType">{{ q.quoteType === 'freight' ? '货源竞价' : '运力竞价' }}</span>
            <span class="oc-status-badge" :class="quoteStatusCls(q.status)">{{ q.status }}</span>
            <span class="oc-time-range">{{ cargoOf(q).timeRange }}</span>
          </div>

          <!-- 路线区段 -->
          <div class="oc-route-block">
            <div class="oc-route-row">
              <i class="oc-route-dot origin-dot"></i>
              <span class="oc-route-name">{{ cargoOf(q).origin }}</span>
              <span class="oc-route-distance">{{ cargoOf(q).originDistance }}</span>
            </div>
            <div class="oc-route-row">
              <i class="oc-route-dot destination-dot"></i>
              <span class="oc-route-name">{{ cargoOf(q).destination }}</span>
              <span class="oc-route-distance">{{ cargoOf(q).destinationDistance }}</span>
            </div>
          </div>

          <!-- 业务标签（左） + 我的报价（右）同一行 -->
          <div class="oc-info-row">
            <div class="oc-tag-row">
              <span class="oc-cargo-tag oc-cargo-type">{{ cargoOf(q).cargoName }}</span>
              <span class="oc-cargo-tag oc-transport-type">需求运量 {{ cargoOf(q).cargoQuantity }}</span>
            </div>
            <div class="oc-price-block">
              <span class="oc-price-label">我的报价</span>
              <strong>{{ q.unitPrice }}</strong>
              <b>{{ q.unit }}</b>
            </div>
          </div>

          <div class="oc-card-divider"></div>

          <!-- 已确认：托运订单 / 运输任务 编号关联展示 -->
          <div v-if="q.status === '已确认'" class="oc-doc-row">
            <span class="oc-doc-label">{{ q.quoteType === 'freight' ? '托运订单' : '运输任务' }}</span>
            <span class="oc-doc-no">{{ q.quoteType === 'freight' ? q.orderNo : q.taskNo }}</span>
          </div>

          <!-- 发布企业与报价截止 / 操作按钮 -->
          <div class="oc-publisher-row">
            <div class="oc-publisher-info">
              <img src="/shipowner-publisher-logo.svg" alt="" />
              <span class="oc-publisher-name">{{ cargoOf(q).publisher }}</span>
            </div>
            <span class="oc-publish-time">报价截止 {{ cargoOf(q).deadline }}</span>
            <button
              type="button"
              class="oc-op-btn"
              :class="quoteOpCls(q)"
              @click.stop="onQuoteOp(q)"
            >
              {{ quoteOpText(q) }}
            </button>
          </div>
        </article>

        <div v-if="filteredQuotes.length === 0" class="oc-empty">
          <van-icon name="search" size="40" color="#c4cbd8" />
          <p>暂无符合条件的报价记录</p>
        </div>
      </section>

      <!-- ================= 订单 Tab 列表 ================= -->
      <section v-else class="oc-list" aria-label="托运订单列表">
        <article
          v-for="order in filteredOrders"
          :key="order.orderNo"
          class="oc-card oc-order-card"
          @click="onViewOrderDetail(order)"
        >
          <!-- 卡片第一行：订单状态 + 托运单号 + 运费总额 -->
          <div class="oc-card-head">
            <span class="oc-status-badge" :class="orderStatusCls(order.status)">{{ order.status }}</span>
            <span class="oc-order-no">
              {{ order.orderNo }}
              <van-icon name="description" size="13" color="#8C99A8" class="oc-copy-icon" @click.stop="copyNo(order.orderNo)" />
            </span>
            <div class="oc-order-amount">
              <b>¥ {{ formatMoney(order.totalAmount) }}</b>
            </div>
          </div>

          <!-- 路线区段 -->
          <div class="oc-route-block">
            <div class="oc-route-row">
              <i class="oc-route-dot origin-dot"></i>
              <span class="oc-route-name">{{ order.origin }}</span>
            </div>
            <div class="oc-route-row">
              <i class="oc-route-dot destination-dot"></i>
              <span class="oc-route-name">{{ order.destination }}</span>
            </div>
          </div>

          <!-- 货物规格 + 业务来源轻量标签 + 单价 -->
          <div class="oc-info-row">
            <div class="oc-tag-row">
              <span class="oc-source-tag" :class="order.source">{{ order.sourceText }}</span>
              <span class="oc-cargo-tag oc-cargo-type">{{ order.cargoSpec }}</span>
            </div>
            <div class="oc-order-unit-price">
              <span>单价</span>
              <strong>{{ order.unitPrice }}</strong>
              <b>{{ order.unit }}</b>
            </div>
          </div>

          <div class="oc-card-divider"></div>

          <!-- 托运企业与创建时间 -->
          <div class="oc-publisher-row">
            <div class="oc-publisher-info">
              <img src="/shipowner-publisher-logo.svg" alt="" />
              <span class="oc-publisher-name">{{ order.shipper }}</span>
            </div>
            <span class="oc-publish-time">创建 {{ order.createTime }}</span>
          </div>
        </article>

        <div v-if="filteredOrders.length === 0" class="oc-empty">
          <van-icon name="search" size="40" color="#c4cbd8" />
          <p>暂无符合条件的托运订单</p>
        </div>
      </section>

      <!-- 底部导航：高亮“订单” (第二项) -->
      <div class="oc-bottom-mask"></div>
      <nav class="oc-bottom-nav" aria-label="底部导航">
        <img src="/shipowner-tabbar-order.svg" alt="找货、订单、运单、我的" />
        <button
          v-for="(nav, index) in navs"
          :key="nav"
          type="button"
          :style="{ left: `${index * 25}%` }"
          :aria-label="nav"
          class="oc-nav-hitbox"
          @click="onNav(nav)"
        ></button>
      </nav>

      <!-- ================= 筛选面板（弹层） ================= -->
      <template v-if="showFilter">
        <div class="oc-filter-mask" @click="showFilter = false"></div>
        <div class="oc-filter-panel">
          <div class="fp-head">
            <span class="fp-title">筛选 ({{ currentTab === 'quote' ? '报价' : '订单' }})</span>
            <button class="fp-close" type="button" aria-label="关闭" @click="showFilter = false">
              <van-icon name="cross" size="16" />
            </button>
          </div>

          <!-- 报价 Tab 专属筛选 -->
          <div v-if="currentTab === 'quote'" class="fp-body">
            <div class="fp-group">
              <h4 class="fp-group-title">竞价类型</h4>
              <div class="fp-chips">
                <button
                  v-for="t in quoteTypeOptions"
                  :key="t.value"
                  type="button"
                  :class="{ active: filterQuoteType === t.value }"
                  @click="filterQuoteType = t.value"
                >
                  {{ t.text }}
                </button>
              </div>
            </div>

            <!-- 发布企业名称搜索输入框 -->
            <div class="fp-group">
              <h4 class="fp-group-title">发布企业名称</h4>
              <div class="fp-input-wrap">
                <van-icon name="search" size="14" color="#8c99a8" />
                <input
                  v-model="filterPublisherName"
                  type="text"
                  placeholder="请输入发布企业名称"
                />
                <button
                  v-if="filterPublisherName"
                  type="button"
                  class="fp-input-clear"
                  @click="filterPublisherName = ''"
                >
                  <van-icon name="clear" size="14" color="#c4cbd8" />
                </button>
              </div>
            </div>
          </div>

          <!-- 订单 Tab 专属筛选 -->
          <div v-else class="fp-body">
            <div class="fp-group">
              <h4 class="fp-group-title">业务来源</h4>
              <div class="fp-chips">
                <button
                  v-for="src in orderSourceOptions"
                  :key="src.value"
                  type="button"
                  :class="{ active: filterOrderSource === src.value }"
                  @click="filterOrderSource = src.value"
                >
                  {{ src.text }}
                </button>
              </div>
            </div>

            <!-- 托运企业名称搜索输入框 -->
            <div class="fp-group">
              <h4 class="fp-group-title">托运企业名称</h4>
              <div class="fp-input-wrap">
                <van-icon name="search" size="14" color="#8c99a8" />
                <input
                  v-model="filterShipperName"
                  type="text"
                  placeholder="请输入托运企业名称"
                />
                <button
                  v-if="filterShipperName"
                  type="button"
                  class="fp-input-clear"
                  @click="filterShipperName = ''"
                >
                  <van-icon name="clear" size="14" color="#c4cbd8" />
                </button>
              </div>
            </div>
          </div>

          <div class="fp-foot">
            <button type="button" class="fp-btn fp-reset" @click="resetFilter">重置</button>
            <button type="button" class="fp-btn fp-submit" @click="applyFilter">确定</button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { showToast } from 'vant'
import { mockCargoList, mockQuoteList, mockOrderList } from './mock-data.js'

const props = defineProps({
  quotes: {
    type: Array,
    default: () => [],
  },
  defaultTab: {
    type: String,
    default: 'quote', // 'quote' | 'order'
  },
})

const emit = defineEmits([
  'back',
  'view-detail',
  'edit-quote',
  'view-order',
  'view-task',
  'nav-home',
])

const navs = ['找货', '订单', '运单', '我的']

// 当前顶层 Tab: 'quote' (报价) | 'order' (订单)
const currentTab = ref(props.defaultTab || 'quote')

watch(
  () => props.defaultTab,
  (newTab) => {
    if (newTab) currentTab.value = newTab
  }
)

const switchTab = (tab) => {
  currentTab.value = tab
}

// =================== 报价 Tab 状态与搜索 ===================
const quoteKeyword = ref('')
const quoteStatusFilter = ref('all')
const filterQuoteType = ref('all')
const filterPublisherName = ref('')
const appliedFilterQuoteType = ref('all')
const appliedFilterPublisherName = ref('')

// 外面展示全部 5 种报价状态：全部、报价中、已确认、已拒绝、已截止
const quoteStatusOptions = [
  { text: '全部', value: 'all' },
  { text: '报价中', value: '报价中' },
  { text: '已确认', value: '已确认' },
  { text: '已拒绝', value: '已拒绝' },
  { text: '已截止', value: '已截止' },
]

const quoteTypeOptions = [
  { text: '全部类型', value: 'all' },
  { text: '货源竞价', value: 'freight' },
  { text: '运力竞价', value: 'capacity' },
]

// =================== 订单 Tab 状态与搜索 ===================
const orderKeyword = ref('')
const orderStatusFilter = ref('all')
const filterOrderSource = ref('all')
const filterShipperName = ref('')
const appliedFilterOrderSource = ref('all')
const appliedFilterShipperName = ref('')

// 外面展示全部 4 种订单状态：全部、待执行、执行中、已完成
const orderStatusOptions = [
  { text: '全部', value: 'all' },
  { text: '待执行', value: '待执行' },
  { text: '执行中', value: '执行中' },
  { text: '已完成', value: '已完成' },
]

const orderSourceOptions = [
  { text: '全部来源', value: 'all' },
  { text: '货源竞价', value: 'bidding' },
  { text: '直接创建', value: 'direct' },
]

// 联动当前 Tab 的快捷状态列表
const activeStatusOptions = computed(() => {
  return currentTab.value === 'quote' ? quoteStatusOptions : orderStatusOptions
})

const onStatusClick = (val) => {
  if (currentTab.value === 'quote') {
    quoteStatusFilter.value = val
  } else {
    orderStatusFilter.value = val
  }
}

// 筛选弹层控制
const showFilter = ref(false)

const resetFilter = () => {
  if (currentTab.value === 'quote') {
    filterQuoteType.value = 'all'
    filterPublisherName.value = ''
    appliedFilterQuoteType.value = 'all'
    appliedFilterPublisherName.value = ''
  } else {
    filterOrderSource.value = 'all'
    filterShipperName.value = ''
    appliedFilterOrderSource.value = 'all'
    appliedFilterShipperName.value = ''
  }
  showToast('筛选已重置')
}

const applyFilter = () => {
  if (currentTab.value === 'quote') {
    appliedFilterQuoteType.value = filterQuoteType.value
    appliedFilterPublisherName.value = filterPublisherName.value.trim()
  } else {
    appliedFilterOrderSource.value = filterOrderSource.value
    appliedFilterShipperName.value = filterShipperName.value.trim()
  }
  showFilter.value = false
}

// =================== 报价列表数据计算 ===================
const allQuotes = computed(() => {
  const customMap = new Map()
  props.quotes.forEach((q) => customMap.set(q.cargoId, q))
  const merged = mockQuoteList.map((q) => {
    if (customMap.has(q.cargoId)) {
      return { ...q, ...customMap.get(q.cargoId) }
    }
    return q
  })
  props.quotes.forEach((q) => {
    if (!mockQuoteList.some((m) => m.cargoId === q.cargoId)) {
      merged.unshift(q)
    }
  })
  return merged
})

const cargoMap = computed(() => {
  const map = {}
  mockCargoList.forEach((c) => {
    map[c.id] = c
  })
  return map
})

const cargoOf = (q) => {
  return (
    cargoMap.value[q.cargoId] || {
      origin: '未知始发港',
      destination: '未知目的港',
      cargoName: '大宗散货',
      cargoQuantity: '500吨',
      timeRange: '今天 12:00 → 08月16日 18:00',
      originDistance: '20 海里',
      destinationDistance: '300 海里',
      publisher: '象笨笨平台船货企业',
      deadline: '08月14日 12:00',
    }
  )
}

const filteredQuotes = computed(() => {
  let list = allQuotes.value

  // 1. 顶部搜索框关键词搜索
  if (quoteKeyword.value.trim()) {
    const kw = quoteKeyword.value.trim().toLowerCase()
    list = list.filter((q) => {
      const cargo = cargoOf(q)
      return (
        (q.quoteNo && q.quoteNo.toLowerCase().includes(kw)) ||
        (cargo.publisher && cargo.publisher.toLowerCase().includes(kw)) ||
        (cargo.cargoName && cargo.cargoName.toLowerCase().includes(kw)) ||
        (cargo.origin && cargo.origin.toLowerCase().includes(kw)) ||
        (cargo.destination && cargo.destination.toLowerCase().includes(kw))
      )
    })
  }

  // 2. 外部快捷状态筛选（全部、报价中、已确认、已拒绝、已截止）
  if (quoteStatusFilter.value !== 'all') {
    list = list.filter((q) => q.status === quoteStatusFilter.value)
  }

  // 3. 弹窗筛选：竞价类型筛选
  if (appliedFilterQuoteType.value !== 'all') {
    list = list.filter((q) => q.quoteType === appliedFilterQuoteType.value)
  }

  // 4. 弹窗筛选：发布企业名称搜索
  if (appliedFilterPublisherName.value) {
    const kw = appliedFilterPublisherName.value.toLowerCase()
    list = list.filter((q) => {
      const cargo = cargoOf(q)
      return cargo.publisher && cargo.publisher.toLowerCase().includes(kw)
    })
  }

  return list
})

const quoteStatusCls = (status) => {
  if (status === '已确认') return 'status-confirmed'
  if (status === '报价中') return 'status-active'
  if (status === '已拒绝') return 'status-rejected'
  if (status === '已截止') return 'status-expired'
  return ''
}

const quoteOpText = (q) => {
  if (q.status === '报价中') return '修改报价'
  if (q.status === '已确认') {
    return q.quoteType === 'freight' ? '查看订单' : '查看任务'
  }
  return '查看详情'
}

const quoteOpCls = (q) => {
  if (q.status === '报价中') return 'btn-orange'
  if (q.status === '已确认') return 'btn-blue'
  return 'btn-gray'
}

const onQuoteOp = (q) => {
  if (q.status === '报价中') {
    emit('edit-quote', q)
  } else if (q.status === '已确认') {
    if (q.quoteType === 'freight') {
      currentTab.value = 'order'
      showToast(`已转入托运订单：${q.orderNo || 'TY20240814001'}`)
      emit('view-order', q)
    } else {
      emit('view-task', q)
    }
  } else {
    emit('view-detail', q)
  }
}

// =================== 订单列表数据计算 ===================
const filteredOrders = computed(() => {
  let list = mockOrderList

  // 1. 顶部搜索框关键词搜索
  if (orderKeyword.value.trim()) {
    const kw = orderKeyword.value.trim().toLowerCase()
    list = list.filter((o) => {
      return (
        (o.orderNo && o.orderNo.toLowerCase().includes(kw)) ||
        (o.shipper && o.shipper.toLowerCase().includes(kw)) ||
        (o.cargoName && o.cargoName.toLowerCase().includes(kw)) ||
        (o.origin && o.origin.toLowerCase().includes(kw)) ||
        (o.destination && o.destination.toLowerCase().includes(kw))
      )
    })
  }

  // 2. 外部快捷状态筛选（全部、待执行、执行中、已完成）
  if (orderStatusFilter.value !== 'all') {
    list = list.filter((o) => o.status === orderStatusFilter.value)
  }

  // 3. 弹窗筛选：业务来源筛选
  if (appliedFilterOrderSource.value !== 'all') {
    list = list.filter((o) => o.source === appliedFilterOrderSource.value)
  }

  // 4. 弹窗筛选：托运企业名称搜索
  if (appliedFilterShipperName.value) {
    const kw = appliedFilterShipperName.value.toLowerCase()
    list = list.filter((o) => {
      return o.shipper && o.shipper.toLowerCase().includes(kw)
    })
  }

  return list
})

const orderStatusCls = (status) => {
  if (status === '待执行') return 'status-pending'
  if (status === '执行中') return 'status-running'
  if (status === '已完成') return 'status-completed'
  return ''
}

const formatMoney = (val) => {
  if (!val) return '0.00'
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const copyNo = (no) => {
  showToast(`已复制单号：${no}`)
}

const onViewOrderDetail = (order) => {
  showToast(`查看托运订单详情：${order.orderNo}（演示）`)
}

const onCreatePlan = (order) => {
  showToast(`针对订单【${order.orderNo}】创建运输计划（演示）`)
}

// 底部导航
const onNav = (nav) => {
  if (nav === '找货') {
    emit('nav-home')
    return
  }
  if (nav === '订单') {
    showToast('当前已在订单中心')
    return
  }
  showToast(`${nav}页面待演示`)
}
</script>

<style scoped>
.oc-preview {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 0;
  background: #e7e9ed;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.oc-screen {
  position: relative;
  width: 375px;
  height: 812px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #dce7fc 0%, #edf2fc 60px, #f5f7fc 140px, #f5f7fc 100%);
  box-shadow: 0 16px 46px rgba(20, 37, 68, 0.18);
}

.oc-status-art {
  position: absolute;
  top: 0;
  left: 0;
  width: 375px;
  height: 72px;
  z-index: 20;
  pointer-events: none;
  display: block;
}

/* ================= 头部 Header ================= */
.oc-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 44px 16px 8px 16px;
  gap: 16px;
  position: relative;
  z-index: 10;
}

.oc-title-group {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.oc-title {
  font-size: 22px;
  font-weight: 700;
  color: #173664;
  letter-spacing: -0.5px;
}

.oc-title-decor {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3a65ff;
  opacity: 0.8;
}

/* 胶囊 Tab */
.oc-capsule-tabs {
  display: inline-flex;
  align-items: center;
  background: rgba(23, 54, 100, 0.08);
  border-radius: 100px;
  padding: 3px;
  gap: 2px;
}

.oc-tab-item {
  border: none;
  background: transparent;
  padding: 4px 14px;
  border-radius: 100px;
  font-size: 13px;
  color: #5a6e85;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.oc-tab-item.active {
  background: #ffffff;
  color: #173664;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(23, 54, 100, 0.08);
}

/* ================= 搜索行 ================= */
.oc-search-row {
  display: flex;
  align-items: center;
  padding: 4px 16px 8px 16px;
  gap: 10px;
}

.oc-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border-radius: 100px;
  padding: 7px 14px;
  box-shadow: 0 2px 6px rgba(23, 54, 100, 0.04);
}

.oc-search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #173664;
}

.oc-search input::placeholder {
  color: #8c99a8;
  font-size: 12px;
}

.oc-filter-btn {
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  color: #5a6e85;
  cursor: pointer;
  padding: 4px 0;
  font-weight: 500;
}

/* ================= 快捷状态栏 ================= */
.oc-status-row {
  display: flex;
  align-items: center;
  padding: 0 16px 8px 16px;
  gap: 8px;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.oc-status-row::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.oc-status-chip {
  flex-shrink: 0;
  border: none;
  background: rgba(255, 255, 255, 0.65);
  color: #5a6e85;
  font-size: 12px;
  padding: 5px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.18s ease;
}

.oc-status-chip.active {
  background: #ffffff;
  color: #3a65ff;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(58, 101, 255, 0.12);
}

/* ================= 列表与卡片 ================= */
.oc-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 16px 80px 16px;
  -webkit-overflow-scrolling: touch;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

.oc-list::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.oc-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
  box-shadow: 0 4px 14px rgba(23, 54, 100, 0.04);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.oc-card:active {
  transform: scale(0.99);
}

/* 卡片头部 */
.oc-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.oc-biz-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}

.oc-biz-badge.freight {
  background: #eef2ff;
  color: #3a65ff;
}

.oc-biz-badge.capacity {
  background: #e8f7f0;
  color: #0fb26a;
}

.oc-source-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 4px;
}

.oc-source-tag.bidding {
  background: #eef2ff;
  color: #3a65ff;
}

.oc-source-tag.direct {
  background: #f0f3f8;
  color: #5a6e85;
}

.oc-status-badge {
  font-size: 12px;
  font-weight: 600;
}

.oc-status-badge.status-confirmed,
.oc-status-badge.status-completed {
  color: #0fb26a;
}

.oc-status-badge.status-active,
.oc-status-badge.status-running {
  color: #ff8400;
}

.oc-status-badge.status-pending {
  color: #3a65ff;
}

.oc-status-badge.status-rejected {
  color: #eb4d3d;
}

.oc-status-badge.status-expired {
  color: #999999;
}

.oc-time-range {
  margin-left: auto;
  font-size: 11px;
  color: #8c99a8;
}

.oc-order-no {
  font-size: 12px;
  color: #5a6e85;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.oc-copy-icon {
  cursor: pointer;
}

.oc-order-amount {
  margin-left: auto;
}

.oc-order-amount b {
  font-size: 15px;
  font-weight: 700;
  color: #173664;
}

/* 路线区段 */
.oc-route-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.oc-route-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.oc-route-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.origin-dot {
  background: #0fb26a;
}

.destination-dot {
  background: #ff8400;
}

.oc-route-name {
  font-size: 14px;
  font-weight: 600;
  color: #173664;
}

.oc-route-distance {
  margin-left: auto;
  font-size: 11px;
  color: #8c99a8;
}

/* 业务标签与价格行 */
.oc-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.oc-tag-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.oc-cargo-tag {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 4px;
}

.oc-cargo-type {
  background: #f4f6fa;
  color: #173664;
  font-weight: 600;
}

.oc-transport-type {
  background: #f4f6fa;
  color: #5a6e85;
}

.oc-price-block {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.oc-price-label {
  font-size: 11px;
  color: #8c99a8;
}

.oc-price-block strong {
  font-size: 17px;
  color: #3a65ff;
  font-weight: 700;
}

.oc-price-block b {
  font-size: 11px;
  color: #3a65ff;
  font-weight: normal;
}

.oc-order-unit-price {
  display: flex;
  align-items: baseline;
  gap: 3px;
  font-size: 11px;
  color: #8c99a8;
}

.oc-order-unit-price strong {
  font-size: 14px;
  color: #173664;
  font-weight: 600;
}

.oc-card-divider {
  height: 1px;
  background: #f0f2f7;
  margin: 8px 0;
}

.oc-doc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 12px;
}

.oc-doc-label {
  color: #8c99a8;
}

.oc-doc-no {
  color: #3a65ff;
  font-weight: 600;
}

/* 发布企业行 */
.oc-publisher-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #8c99a8;
}

.oc-publisher-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.oc-publisher-info img {
  width: 14px;
  height: 14px;
}

.oc-publisher-name {
  color: #5a6e85;
  font-weight: 500;
}

.oc-publish-time {
  margin-left: auto;
}

/* 操作按钮 */
.oc-op-btn {
  border: none;
  border-radius: 100px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.oc-op-btn.btn-orange {
  background: #fff4e8;
  color: #ff8400;
}

.oc-op-btn.btn-blue {
  background: #eef2ff;
  color: #3a65ff;
}

.oc-op-btn.btn-gray {
  background: #f4f6fa;
  color: #5a6e85;
}

.oc-order-op-group {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.oc-op-outline {
  background: transparent;
  border: 1px solid #d2dce8;
  color: #5a6e85;
}

.oc-op-primary {
  background: #3a65ff;
  color: #ffffff;
}

.oc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #8c99a8;
  gap: 12px;
  font-size: 13px;
}

/* ================= 底部导航 ================= */
.oc-bottom-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 70px;
  background: linear-gradient(180deg, rgba(245, 247, 252, 0) 0%, #f5f7fc 80%);
  pointer-events: none;
}

.oc-bottom-nav {
  position: absolute;
  bottom: 12px;
  left: 16px;
  width: 343px;
  height: 55px;
  z-index: 20;
}

.oc-bottom-nav img {
  width: 100%;
  height: 100%;
  display: block;
}

.oc-nav-hitbox {
  position: absolute;
  top: 0;
  width: 25%;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
}

/* ================= 筛选面板弹层 ================= */
.oc-filter-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 30;
}

.oc-filter-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  border-radius: 16px 16px 0 0;
  padding: 16px;
  z-index: 31;
  display: flex;
  flex-direction: column;
  max-height: 70%;
}

.fp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f7;
}

.fp-title {
  font-size: 16px;
  font-weight: 600;
  color: #173664;
}

.fp-close {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #8c99a8;
}

.fp-body {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.fp-group-title {
  font-size: 13px;
  font-weight: 600;
  color: #173664;
  margin-bottom: 10px;
}

.fp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.fp-chips button {
  border: none;
  background: #f4f6fa;
  color: #5a6e85;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}

.fp-chips button.active {
  background: #eef2ff;
  color: #3a65ff;
  font-weight: 600;
}

.fp-input-wrap {
  background: #f4f6fa;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fp-input-wrap input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: #173664;
}

.fp-input-wrap input::placeholder {
  color: #8c99a8;
  font-size: 12px;
}

.fp-input-clear {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.fp-foot {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f7;
}

.fp-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.fp-reset {
  background: #f4f6fa;
  color: #5a6e85;
}

.fp-submit {
  background: #3a65ff;
  color: #ffffff;
}
</style>
