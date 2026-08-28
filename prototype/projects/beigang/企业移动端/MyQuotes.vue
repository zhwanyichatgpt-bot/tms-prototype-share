<template>
  <div class="mq-preview">
    <main class="mq-screen" aria-label="我的报价">
      <!-- 顶部状态栏 -->
      <img class="mq-status-art" src="/shipowner-statusbar.svg" alt="" />

      <!-- 头部：返回 + 标题 -->
      <header class="mq-header">
        <button class="mq-back" type="button" aria-label="返回货源大厅" @click="$emit('back')">
          <van-icon name="arrow-left" size="18" color="#173664" />
        </button>
        <span class="mq-title">我的报价</span>
      </header>

      <!-- 搜索行：长搜索框 + 筛选按钮 -->
      <div class="mq-search-row">
        <div class="mq-search">
          <van-icon name="search" size="14" color="#7b8794" />
          <input v-model="keyword" placeholder="搜索报价单号 / 货品 / 港口" aria-label="搜索报价单号货品或港口" />
        </div>
        <button class="mq-filter-btn" type="button" aria-label="筛选" @click="showFilter = true">
          <span>筛选</span>
          <van-icon name="arrow-down" size="12" />
        </button>
      </div>

      <!-- 状态过滤 chips -->
      <div class="mq-status-row" aria-label="状态过滤">
        <button
          v-for="s in statusOptions"
          :key="s.value"
          type="button"
          :class="{ active: statusFilter === s.value }"
          @click="statusFilter = s.value"
        >
          {{ s.text }}
        </button>
      </div>

      <!-- 报价单列表 -->
      <section class="mq-list" aria-label="报价单列表">
        <article
          v-for="q in filteredQuotes"
          :key="q.quoteNo"
          class="mq-card"
          :class="q.quoteType"
          @click="$emit('view-detail', q)"
        >
          <!-- 卡片第一行：报价类型徽章 + 报价状态 + 运输时间 -->
          <div class="mq-card-head">
            <span class="mq-biz-badge" :class="q.quoteType">{{ q.quoteType === 'freight' ? '货源竞价' : '运力竞价' }}</span>
            <span class="mq-recommend" :class="statusCls(q.status)">{{ q.status }}</span>
            <span class="mq-time-range">{{ cargoOf(q).timeRange }}</span>
          </div>

          <!-- 路线区段 -->
          <div class="mq-route-block">
            <div class="mq-route-row">
              <i class="mq-route-dot origin-dot"></i>
              <span class="mq-route-name">{{ cargoOf(q).origin }}</span>
              <span class="mq-route-distance">{{ cargoOf(q).originDistance }}</span>
            </div>
            <div class="mq-route-row">
              <i class="mq-route-dot destination-dot"></i>
              <span class="mq-route-name">{{ cargoOf(q).destination }}</span>
              <span class="mq-route-distance">{{ cargoOf(q).destinationDistance }}</span>
            </div>
          </div>

          <!-- 业务标签（左） + 我的报价（右）同一行 -->
          <div class="mq-info-row">
            <div class="mq-tag-row">
              <span class="mq-cargo-tag mq-cargo-type">{{ cargoOf(q).cargoName }}</span>
              <span class="mq-cargo-tag mq-transport-type">需求运量 {{ cargoOf(q).cargoQuantity }}</span>
            </div>
            <div class="mq-price-block">
              <span class="mq-price-label">我的报价</span>
              <strong>{{ q.unitPrice }}</strong>
              <b>{{ q.unit }}</b>
            </div>
          </div>

          <div class="mq-card-divider"></div>

          <!-- 已确认：托运订单 / 运输任务 编号 -->
          <div v-if="q.status === '已确认'" class="mq-doc-row">
            <span class="mq-doc-label">{{ q.quoteType === 'freight' ? '托运订单' : '运输任务' }}</span>
            <span class="mq-doc-no">{{ q.quoteType === 'freight' ? q.orderNo : q.taskNo }}</span>
          </div>

          <!-- 发布企业与报价截止 -->
          <div class="mq-publisher-row">
            <div class="mq-publisher-info">
              <img src="/shipowner-publisher-logo.svg" alt="" />
              <span class="mq-publisher-name">{{ cargoOf(q).publisher }}</span>
            </div>
            <span class="mq-publish-time">报价截止 {{ cargoOf(q).deadline }}</span>
            <button
              v-if="q.status === '报价中'"
              type="button"
              class="mq-op"
              :class="opCls(q)"
              @click.stop="onOp(q)"
            >
              {{ opText(q) }}
            </button>
          </div>
        </article>

        <div v-if="filteredQuotes.length === 0" class="mq-empty">
          <van-icon name="search" size="40" color="#c4cbd8" />
          <p>暂无符合条件的报价单</p>
        </div>
      </section>

      <!-- 底部导航 -->
      <div class="mq-bottom-mask"></div>
      <nav class="mq-bottom-nav" aria-label="底部导航">
        <img src="/shipowner-tabbar.svg" alt="找货、跑货、运单、我的" />
        <button
          v-for="(nav, index) in navs"
          :key="nav"
          type="button"
          :style="{ left: `${index * 25}%` }"
          :aria-label="nav"
          :class="{ 'mq-nav-active': index === 0 }"
          @click="onNav(nav)"
        ></button>
      </nav>

      <!-- 筛选面板（参考运单-全部筛选，容器内底部弹层） -->
      <template v-if="showFilter">
        <div class="mq-filter-mask" @click="showFilter = false"></div>
        <div class="mq-filter-panel">
          <div class="fp-head">
            <span class="fp-title">筛选</span>
            <button class="fp-close" type="button" aria-label="关闭" @click="showFilter = false">
              <van-icon name="cross" size="16" />
            </button>
          </div>

          <div class="fp-body">
            <div class="fp-group">
              <h4 class="fp-group-title">竞价类型</h4>
              <div class="fp-chips">
                <button
                  v-for="t in typeOptions"
                  :key="t.value"
                  type="button"
                  :class="{ active: typeFilter === t.value }"
                  @click="typeFilter = t.value"
                >{{ t.text }}</button>
              </div>
            </div>

            <div class="fp-group">
              <h4 class="fp-group-title">货主</h4>
              <input v-model="publisherKeyword" class="fp-input" type="text" placeholder="请输入货主名称" aria-label="货主名称" />
            </div>

            <div class="fp-group">
              <h4 class="fp-group-title">时间</h4>
              <div class="fp-chips">
                <button
                  v-for="tm in timeOptions"
                  :key="tm.value"
                  type="button"
                  :class="{ active: timeFilter === tm.value }"
                  @click="timeFilter = tm.value"
                >{{ tm.text }}</button>
              </div>
            </div>
          </div>

          <div class="fp-footer">
            <button class="fp-reset" type="button" @click="onResetFilter">重置</button>
            <button class="fp-save" type="button" @click="showFilter = false">保存</button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { showToast } from 'vant'
import { mockQuoteList, mockCargoList } from './mock-data.js'

const props = defineProps({
  quotes: { type: Array, default: () => [] },
})

const emit = defineEmits(['back', 'view-detail', 'edit-quote', 'view-order', 'view-task'])

const navs = ['找货', '订单', '运单', '我的']
const keyword = ref('')
const statusFilter = ref('all')
const showFilter = ref(false)

// 筛选面板条件（竞价类型 / 货主 / 时间）
const typeFilter = ref('all')
const publisherKeyword = ref('')
const timeFilter = ref('all')

const typeOptions = [
  { text: '全部', value: 'all' },
  { text: '货源竞价', value: 'freight' },
  { text: '运力竞价', value: 'capacity' },
]
const statusOptions = [
  { text: '全部', value: 'all' },
  { text: '报价中', value: '报价中' },
  { text: '已确认', value: '已确认' },
  { text: '已拒绝', value: '已拒绝' },
  { text: '已截止', value: '已截止' },
]
const timeOptions = [
  { text: '全部时间', value: 'all' },
  { text: '今日', value: 'today' },
  { text: '近7日', value: '7d' },
  { text: '近30日', value: '30d' },
]

const allQuotes = computed(() => {
  // 用户新提交的报价按 cargoId 覆盖同需求下的 mock 报价，避免同一需求出现两条
  const userCargoIds = new Set(props.quotes.map((q) => q.cargoId))
  const mock = mockQuoteList.filter((q) => !userCargoIds.has(q.cargoId))
  return [...mock, ...props.quotes]
})

const cargoMap = computed(() => {
  const map = {}
  mockCargoList.forEach((c) => { map[c.id] = c })
  return map
})

const cargoOf = (q) => {
  const c = cargoMap.value[q.cargoId] || {}
  return { ...c, platformName: c.platformTag ? c.platformTag.replace(/^平台\s*/, '') : '象笨笨' }
}

function inTimeRange(dateStr, range) {
  if (range === 'all') return true
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return true
  const diff = Date.now() - d.getTime()
  const day = 86400000
  if (range === 'today') return diff >= 0 && diff < day
  if (range === '7d') return diff >= 0 && diff < 7 * day
  if (range === '30d') return diff >= 0 && diff < 30 * day
  return true
}

const filteredQuotes = computed(() => {
  const kw = keyword.value.trim()
  const pk = publisherKeyword.value.trim()
  return allQuotes.value.filter((q) => {
    if (typeFilter.value !== 'all' && q.quoteType !== typeFilter.value) return false
    if (statusFilter.value !== 'all' && q.status !== statusFilter.value) return false
    if (pk && !(cargoOf(q).publisher || '').includes(pk)) return false
    if (timeFilter.value !== 'all' && !inTimeRange(q.quoteTime, timeFilter.value)) return false
    if (kw) {
      const c = cargoOf(q)
      const haystack = [q.quoteNo, c.publisher, c.cargoName, c.cargoType, c.origin, c.destination, c.transportType]
        .filter(Boolean)
        .join(' ')
      if (!haystack.includes(kw)) return false
    }
    return true
  })
})

function onResetFilter() {
  typeFilter.value = 'all'
  publisherKeyword.value = ''
  timeFilter.value = 'all'
  statusFilter.value = 'all'
  showFilter.value = false
}

function statusCls(status) {
  if (status === '报价中') return 'quoting'
  if (status === '已确认') return 'confirmed'
  if (status === '已拒绝') return 'rejected'
  return 'closed'
}

function opText(q) {
  if (q.status === '报价中') return '修改报价'
  if (q.status === '已确认') return q.quoteType === 'freight' ? '查看托运订单' : '查看运输任务'
  return '查看详情'
}

function opCls(q) {
  if (q.status === '报价中') return 'primary'
  if (q.status === '已确认') return 'confirm'
  return 'plain'
}

function onOp(q) {
  if (q.status === '报价中') emit('edit-quote', q)
  else if (q.status === '已确认' && q.quoteType === 'freight') emit('view-order', q)
  else if (q.status === '已确认' && q.quoteType === 'capacity') emit('view-task', q)
  else emit('view-detail', q)
}

function onNav(nav) {
  if (nav === '找货') {
    emit('back')
    return
  }
  if (nav === '订单') return
  showToast(`${nav}页面待演示`)
}
</script>

<style scoped>
.mq-preview {
  display: flex;
  justify-content: center;
  background: #dfe5f1;
}
.mq-screen {
  position: relative;
  width: 375px;
  height: 812px;
  overflow: hidden;
  flex: 0 0 auto;
  background: #f4f6fb;
  box-shadow: 0 16px 46px rgba(20, 37, 68, 0.18);
}
.mq-status-art {
  position: absolute;
  z-index: 30;
  left: 0;
  top: 0;
  width: 375px;
  height: 72px;
  pointer-events: none;
}

/* 头部 */
.mq-header {
  position: absolute;
  z-index: 20;
  left: 0;
  top: 0;
  width: 375px;
  height: 96px;
  box-sizing: border-box;
  padding: 72px 16px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(180deg, #e8f0ff 0%, #f4f6fb 100%);
}
.mq-back {
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
}
.mq-title {
  font-size: 17px;
  font-weight: 700;
  color: #173664;
  white-space: nowrap;
}

/* 搜索行：长搜索框 + 筛选按钮 */
.mq-search-row {
  position: absolute;
  z-index: 20;
  left: 0;
  right: 0;
  top: 110px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
}

.mq-search {
  flex: 1;
  height: 34px;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(39, 62, 103, 0.08);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  box-sizing: border-box;
}
.mq-search input {
  flex: 1;
  border: 0;
  outline: none;
  font-size: 13px;
  color: #333;
  background: transparent;
  min-width: 0;
}
.mq-search input::placeholder {
  color: #b0b8c6;
}

/* 筛选按钮（参考运单筛选按钮：文字 + 箭头） */
.mq-filter-btn {
  flex: 0 0 auto;
  height: 34px;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 4px;
  cursor: pointer;
}
.mq-filter-btn span {
  font-size: 12px;
  font-weight: 400;
  color: #333333;
}
.mq-filter-btn .van-icon {
  color: #333333;
}

/* 状态过滤 chips（搜索框下方） */
.mq-status-row {
  position: absolute;
  z-index: 20;
  left: 0;
  right: 0;
  top: 152px;
  display: flex;
  gap: 6px;
  padding: 0 16px;
  overflow-x: auto;
  box-sizing: border-box;
  scrollbar-width: none;
}
.mq-status-row::-webkit-scrollbar {
  display: none;
}
.mq-status-row button {
  flex: 0 0 auto;
  height: 26px;
  padding: 0 12px;
  border: 0;
  border-radius: 13px;
  background: #fff;
  color: #4a5a78;
  font-size: 12px;
  line-height: 26px;
  cursor: pointer;
}
.mq-status-row button.active {
  background: #3a65ff;
  color: #fff;
  font-weight: 600;
}

/* 列表 */
.mq-list {
  position: absolute;
  left: 0;
  top: 188px;
  right: 0;
  bottom: 56px;
  overflow-y: auto;
  padding: 4px 12px 12px;
  box-sizing: border-box;
}

/* 报价卡片 —— 1:1 复用货源大厅 cargo-card 视觉 */
.mq-card {
  position: relative;
  width: 343px;
  margin: 0 auto 12px;
  box-sizing: border-box;
  padding: 9px 12px 8px;
  overflow: hidden;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(39, 62, 103, 0.04);
  cursor: pointer;
}
.mq-card-head {
  display: flex;
  align-items: center;
  height: 20px;
  white-space: nowrap;
}
.mq-biz-badge {
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
.mq-biz-badge.freight,
.mq-biz-badge.capacity {
  background: #eef3ff;
  color: #2f68ff;
  border: 1px solid #c2d5ff;
}
.mq-recommend {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}
.mq-recommend.quoting { color: #3a65ff; }
.mq-recommend.confirmed { color: #1a9e64; }
.mq-recommend.rejected { color: #e5484d; }
.mq-recommend.closed { color: #8a8f99; }
.mq-time-range {
  margin-left: 7px;
  color: #111;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 19px;
  letter-spacing: -0.35px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 路线区段：装/卸地址间距加大 */
.mq-route-block {
  position: relative;
  margin-top: 10px;
  padding-left: 1px;
}
.mq-route-block::before {
  content: "";
  position: absolute;
  left: 3.5px;
  top: 14px;
  width: 1px;
  height: 25px;
  background: #c8ced9;
}
.mq-route-row {
  position: relative;
  height: 28px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}
.mq-route-dot {
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
.mq-route-dot.origin-dot { background: #3a65ff; }
.mq-route-dot.destination-dot { background: #3a65ff; }
.mq-route-name {
  color: #292929;
  font-size: 14px;
  font-weight: 600;
  line-height: 19px;
  letter-spacing: -0.25px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 235px;
}
.mq-route-distance {
  margin-left: 6px;
  color: #9ba4b5;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
}

/* 业务标签（左） + 我的报价（右）同一行 */
.mq-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}
.mq-tag-row {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.mq-cargo-tag {
  height: 18px;
  padding: 0 6px;
  border-radius: 3px;
  font-size: 10px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100px;
}
.mq-cargo-type,
.mq-transport-type {
  background: #edf1ff;
  color: #3158b0;
}

/* 我的报价（右） */
.mq-price-block {
  display: flex;
  align-items: baseline;
  gap: 3px;
  white-space: nowrap;
  text-align: right;
}
.mq-price-label {
  color: #8b94a5;
  font-size: 9px;
  line-height: 12px;
  margin-right: 3px;
}
.mq-price-block strong {
  color: #3465ff;
  font-size: 21px;
  font-weight: 700;
  line-height: 23px;
}
.mq-price-block b {
  color: #3465ff;
  font-size: 10px;
  font-weight: 600;
}

/* 分隔线 */
.mq-card-divider {
  height: 1px;
  margin: 8px 0 6px;
  background: #edf0f4;
  transform: scaleY(0.5);
}

/* 已确认：托运订单 / 运输任务 编号 */
.mq-doc-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 4px;
}
.mq-doc-label {
  flex: 0 0 auto;
  font-size: 10px;
  color: #9aa4b5;
  line-height: 14px;
}
.mq-doc-no {
  font-size: 10.5px;
  font-weight: 600;
  color: #3a65ff;
  line-height: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 发布企业 + 报价截止 + 操作 */
.mq-publisher-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mq-publisher-info {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 5.5px;
}
.mq-publisher-info img {
  display: block;
  width: 22px;
  height: 18.5px;
  flex: 0 0 auto;
}
.mq-publisher-name {
  overflow: hidden;
  color: #7d8799;
  font-size: 10.5px;
  font-weight: 500;
  line-height: 13px;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 130px;
}
.mq-publish-time {
  flex: 0 0 auto;
  color: #9da5b3;
  font-size: 10px;
  line-height: 18px;
}
.mq-op {
  flex: 0 0 auto;
  height: 26px;
  border-radius: 13px;
  font-size: 12px;
  font-weight: 600;
  padding: 0 13px;
  cursor: pointer;
  margin-left: 8px;
}
.mq-op.primary { background: #3a65ff; color: #fff; border: 0; }
.mq-op.confirm { background: #e8f7ef; color: #1a9e64; border: 0; }
.mq-op.plain { background: #f0f2f5; color: #4a5a78; border: 0; }

.mq-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 90px;
  color: #9aa4b5;
  font-size: 14px;
}

/* 底部导航 */
.mq-bottom-mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 56px;
  background: #fff;
  z-index: 25;
}
.mq-bottom-nav {
  position: absolute;
  z-index: 26;
  left: 0;
  right: 0;
  bottom: 0;
  height: 56px;
}
.mq-bottom-nav img {
  width: 375px;
  height: 56px;
  display: block;
}
.mq-bottom-nav button {
  position: absolute;
  top: 0;
  width: 25%;
  height: 56px;
  border: 0;
  background: transparent;
  cursor: pointer;
}

/* ============ 筛选面板（参考运单-全部筛选，容器内底部弹层） ============ */
.mq-filter-mask {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: rgba(15, 23, 42, 0.5);
}

.mq-filter-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 51;
  background: #ffffff;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.fp-input {
  width: 100%;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #e5e9f2;
  border-radius: 10px;
  background: #f6f8fc;
  box-sizing: border-box;
  font-size: 14px;
  color: #333333;
  outline: none;
}
.fp-input::placeholder {
  color: #b0b8c6;
}

.fp-head {
  position: relative;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
}
.fp-title {
  font-size: 16px;
  font-weight: 700;
  color: #333333;
}
.fp-close {
  position: absolute;
  right: 12px;
  top: 14px;
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
}

.fp-body {
  max-height: 480px;
  overflow-y: auto;
  padding: 8px 16px 16px;
}

.fp-group {
  margin-top: 16px;
}
.fp-group-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #333333;
}
.fp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fp-chips button {
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  background: #f6f8fc;
  color: #333333;
  font-size: 13px;
  line-height: 32px;
  cursor: pointer;
}
.fp-chips button.active {
  background: #3a65ff;
  color: #ffffff;
  font-weight: 600;
}

.fp-footer {
  display: flex;
  gap: 12px;
  padding: 12px 16px 20px;
  border-top: 1px solid #f0f0f0;
}
.fp-footer button {
  height: 40px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.fp-reset {
  flex: 1;
  border: 1px solid #e5e9f2;
  background: #ffffff;
  color: #333333;
}
.fp-save {
  flex: 2;
  border: 0;
  background: #3a65ff;
  color: #ffffff;
}
</style>
