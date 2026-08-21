<template>
  <div class="qd-preview">
    <main class="qd-screen" aria-label="报价详情">
      <div class="qd-scroll">
        <!-- 1. 顶部航线地图区（复用货源详情视觉） -->
        <section class="map-section annot-shipowner-quote-detail-field-route">
          <img class="map-image" src="/cargo-detail-map.png" alt="运输路线地图" />
          <img class="status-bar" src="/shipowner-statusbar.svg" alt="" />

          <button type="button" class="back-button" aria-label="返回" @click="$emit('back')">
            <van-icon name="arrow-left" size="22" color="#333333" />
          </button>
          <h1>报价详情</h1>

          <img class="route-image" src="/cargo-detail-route.svg" alt="" />
          <div class="port-card load-port">
            <span class="port-label load-label">{{ isCapacity ? '始发港' : '装货港' }}</span>
            <div class="port-content">{{ originPort }}</div>
            <span class="port-line"></span>
            <span class="port-anchor"></span>
          </div>
          <div class="port-card unload-port">
            <span class="port-label unload-label">{{ isCapacity ? '目的港' : '卸货港' }}</span>
            <div class="port-content">{{ destPort }}</div>
            <span class="port-line"></span>
            <span class="port-anchor"></span>
          </div>
        </section>

        <!-- 2. 下方面板区 -->
        <section class="detail-sheet">
          <div class="bidding-notice">
            <img src="/cargo-detail-notice.svg" alt="" />
            <span>{{ noticeText }}</span>
          </div>

          <!-- 3. 摘要卡片 -->
          <section class="design-card summary-card annot-shipowner-quote-detail-field-summary">
            <div class="summary-top">
              <strong>{{ cargoName }}</strong>
              <div class="my-price">
                <b>{{ unitPriceText }}</b>
                <span>{{ quote.unit }}</span>
              </div>
            </div>

            <div class="time-row">
              <div class="time-block">
                <b>{{ startTime }}</b>
                <span>{{ startDate }}</span>
              </div>
              <div class="duration">
                <i></i>
                <span>{{ durationText }}</span>
                <i></i>
              </div>
              <div class="time-block align-right">
                <b>{{ endTime }}</b>
                <span>{{ endDate }}</span>
              </div>
            </div>

            <div class="summary-tags">
              <span class="time-tag">
                <img src="/cargo-detail-hourglass.svg" alt="" />{{ tag1 }}
              </span>
              <span>{{ tag2 }}</span>
              <span>{{ tag3 }}</span>
            </div>
          </section>

          <!-- 4. 起终点地址卡片 -->
          <section class="design-card address-card annot-shipowner-quote-detail-rule-route" :class="{ expanded: requirementExpanded }">
            <div class="address-list">
              <div class="address-item">
                <span class="address-mark start">起</span>
                <div>
                  <b>{{ originPort }}</b>
                  <span>{{ originAddr }}</span>
                </div>
                <img src="/cargo-detail-location.svg" alt="" />
              </div>
              <div class="address-rail"></div>
              <div class="address-item">
                <span class="address-mark end">终</span>
                <div>
                  <b>{{ destPort }}</b>
                  <span>{{ destAddr }}</span>
                </div>
                <img src="/cargo-detail-location.svg" alt="" />
              </div>
            </div>

            <div class="requirement-panel" :class="{ expanded: requirementExpanded }">
              <p :class="{ clamp: !requirementExpanded }">
                {{ reqText }}
              </p>
              <button type="button" @click="requirementExpanded = !requirementExpanded">
                {{ requirementExpanded ? '收起' : '展开更多' }}
                <van-icon :name="requirementExpanded ? 'arrow-up' : 'arrow-down'" size="12" />
              </button>
            </div>
          </section>

          <!-- 5. 我的报价卡片（承运商端重点区） -->
          <section class="design-card my-quote-card annot-shipowner-quote-detail-rule-result">
            <div class="mq-header">
              <span class="mq-title">我的报价</span>
              <em class="mq-status" :class="statusCls">{{ quote.status }}</em>
            </div>

            <div class="mq-info-row mq-price-row">
              <span class="mq-label">运输单价</span>
              <b class="mq-value mq-value-blue">{{ quote.unitPrice }} {{ quote.unit }}</b>
            </div>

            <div class="mq-divider"></div>

            <div class="mq-info-row">
              <span class="mq-label">预计总运费</span>
              <b class="mq-value">{{ totalFreightText }}元</b>
            </div>
            <div class="mq-info-row">
              <span class="mq-label">报价说明</span>
              <b class="mq-value mq-note">{{ quote.quoteNote }}</b>
            </div>
            <div class="mq-info-row">
              <span class="mq-label">报价时间</span>
              <b class="mq-value">{{ quote.quoteTime }}</b>
            </div>
            <!-- 已确认状态：关联托运订单号 / 运输任务号 (紧跟在报价时间后，纯文本展示) -->
            <div v-if="quote.status === '已确认' && !isCapacity" class="mq-info-row">
              <span class="mq-label">托运订单</span>
              <b class="mq-value mq-value-blue">{{ quote.orderNo || 'TY20240814001' }}</b>
            </div>
            <div v-if="quote.status === '已确认' && isCapacity" class="mq-info-row">
              <span class="mq-label">运输任务</span>
              <b class="mq-value mq-value-blue">{{ quote.taskNo || 'RW20240814001' }}</b>
            </div>
          </section>

          <!-- 6. 发布信息卡片 -->
          <section class="design-card info-card annot-shipowner-quote-detail-field-publish-info">
            <div>
              <span>报价单号</span>
              <button type="button" class="copy-value" @click="onCopyCode">
                {{ quote.quoteNo }}
                <img src="/cargo-detail-copy.svg" alt="复制" />
              </button>
            </div>
            <div><span>发布企业</span><b>{{ publisherName }}</b></div>
            <div><span>报价截止</span><b>{{ deadlineText }}</b></div>
          </section>
        </section>
      </div>

      <!-- 7. 底部固定操作栏（仅在报价中展示修改报价，已确认/已完成去除操作按钮） -->
      <footer class="detail-action annot-shipowner-quote-detail-action-edit" v-if="showAction">
        <button type="button" class="primary" @click="onAction">
          修改报价
        </button>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { showToast } from 'vant'
import { mockCargoList } from './mock-data.js'

const props = defineProps({
  quote: { type: Object, required: true },
})

const emit = defineEmits(['back', 'edit-quote', 'view-order', 'view-task'])

const requirementExpanded = ref(false)

const cargo = computed(() => mockCargoList.find((c) => c.id === props.quote.cargoId) || {})
const isCapacity = computed(() => props.quote.quoteType === 'capacity')

const statusCls = computed(() => {
  if (props.quote.status === '报价中') return 'quoting'
  if (props.quote.status === '已确认') return 'confirmed'
  if (props.quote.status === '已拒绝') return 'rejected'
  return 'closed'
})

const noticeText = computed(
  () => `${props.quote.status}，报价截止：${cargo.value.deadline || '—'}`
)

const cargoName = computed(() =>
  cargo.value.cargoType
    ? `${cargo.value.cargoType} ${cargo.value.cargoQuantity || ''}`
    : '煤 1000吨'
)

// 报价单价：单位统一用 quote.unit
const unitPriceText = computed(() => props.quote.unitPrice || '—')

// 摘要卡时间：拆分为「大号时间 + 小号日期」
function splitTime(t) {
  const m = String(t || '').match(/(\d{1,2}月\d{1,2}日)?\s*(\d{1,2}:\d{2})?/)
  return { date: m?.[1] || '', time: m?.[2] || '' }
}
const startTime = computed(() => splitTime(cargo.value.startTime).time || '09:24')
const startDate = computed(() => splitTime(cargo.value.startTime).date || '08月14日 周五')
const endTime = computed(() => splitTime(cargo.value.endTime).time || '09:24')
const endDate = computed(() => splitTime(cargo.value.endTime).date || '08月16日 周日')

function calcDays(start, end) {
  const p = (s) => {
    const m = String(s || '').match(/(\d{1,2})月(\d{1,2})日/)
    return m ? { mo: Number(m[1]), d: Number(m[2]) } : null
  }
  const a = p(start)
  const b = p(end)
  if (!a || !b) return ''
  const da = new Date(2026, a.mo - 1, a.d)
  const db = new Date(2026, b.mo - 1, b.d)
  const days = Math.round((db - da) / 86400000)
  return days >= 1 ? `共 ${days} 天` : '当天往返'
}
const durationText = computed(() => calcDays(cargo.value.startTime, cargo.value.endTime) || '共 2 天')

const tag1 = computed(() => (cargo.value.deadline ? `截止 ${cargo.value.deadline}` : '距装货2天'))
const tag2 = computed(() => cargo.value.cargoType || '煤炭及制品')
const tag3 = computed(() =>
  `期望运费 ${cargo.value.price ?? ''}${cargo.value.unit || ''}`
)

const originPort = computed(() => {
  const o = cargo.value.origin || '福州 马尾区·福州港'
  return o.includes('·') ? o.split('·')[1] : o
})
const originAddr = computed(() => cargo.value.originAddr || cargo.value.origin || '福州市马尾区福州港马尾作业区')
const destPort = computed(() => {
  const d = cargo.value.destination || '厦门 湖里区·五通港'
  return d.includes('·') ? d.split('·')[1] : d
})
const destAddr = computed(() => cargo.value.destinationAddr || cargo.value.destination || '厦门市湖里区五通港')

const reqText = computed(() => {
  if (cargo.value.cargoType) {
    return `“${cargo.value.cargoName || ''}${cargo.value.cargoQuantity ? ' ' + cargo.value.cargoQuantity : ''}从${originPort.value}运至${destPort.value}，需${cargo.value.transportType || ''}承运，请确保按时装货、证照齐全。”`
  }
  return isCapacity.value
    ? '“要求散货船具备5000吨及以上承运能力，船龄10年以内，证照健全，满足沿海及内河航区适航要求。”'
    : '煤炭从福州港马尾作业区装船至上海港罗泾码头，需封仓，承运方应具备相应水路运输资质。'
})

const routeDistText = computed(() => cargo.value.routeDistance || '328.9海里')

const publisherName = computed(() => cargo.value.publisher || '福州港船企业')
const deadlineText = computed(() => cargo.value.deadline || '—')

const totalFreightText = computed(() =>
  props.quote.totalFreight ? Number(props.quote.totalFreight).toLocaleString() : '—'
)

const onCopyCode = async () => {
  try {
    await navigator.clipboard?.writeText(props.quote.quoteNo)
  } finally {
    showToast('报价单号已复制')
  }
}

const copyDoc = async (no, typeName) => {
  try {
    await navigator.clipboard?.writeText(no)
  } finally {
    showToast(`${typeName}已复制：${no}`)
  }
}

// 底部操作：仅在报价中时展示修改报价；已确认去除底部操作按钮
const showAction = computed(() => props.quote.status === '报价中')

const onAction = () => {
  if (props.quote.status === '报价中') {
    emit('edit-quote', props.quote)
  }
}
</script>

<style scoped>
.qd-screen,
.qd-screen *,
.qd-screen *::before,
.qd-screen *::after {
  box-sizing: border-box;
}

.qd-preview {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 0;
  background: #e7e9ed;
  color: #333333;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: auto;
  text-rendering: optimizeLegibility;
}

.qd-screen {
  position: relative;
  width: 375px;
  height: 812px;
  overflow: hidden;
  flex: 0 0 auto;
  background: #eff1f6;
  box-shadow: 0 16px 46px rgba(20, 37, 68, 0.18);
}

.qd-scroll {
  position: absolute;
  inset: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-bottom: 78px;
  scrollbar-width: none;
}

.qd-scroll::-webkit-scrollbar {
  display: none;
}

/* ============ 1. 顶部地图区（与货源详情一致） ============ */
.map-section {
  position: relative;
  width: 375px;
  height: 438px;
  overflow: hidden;
}

.map-image {
  position: absolute;
  inset: 0;
  width: 375px;
  height: 438px;
}

.status-bar {
  position: absolute;
  z-index: 8;
  inset: 0 auto auto 0;
  width: 375px;
  height: 72px;
  pointer-events: none;
}

.back-button {
  position: absolute;
  z-index: 10;
  left: 8px;
  top: 46px;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.map-section h1 {
  position: absolute;
  z-index: 9;
  left: 46px;
  top: 49px;
  margin: 0;
  color: #333333;
  font-size: 18px;
  line-height: 24px;
  font-weight: 600;
}

.route-image {
  position: absolute;
  z-index: 2;
  left: 142px;
  top: 150px;
  width: 106px;
  height: 139px;
}

.port-card {
  position: absolute;
  z-index: 4;
  width: max-content;
  min-width: 88px;
  max-width: 132px;
  color: #333333;
}

.load-port {
  left: 120px;
  top: 205px;
  width: max-content;
}

.unload-port {
  left: 205px;
  top: 65px;
  width: max-content;
}

.port-label {
  position: absolute;
  z-index: 2;
  left: 10px;
  top: 0;
  height: 27px;
  padding: 4px 11px 0;
  border-radius: 9px 9px 0 0;
  color: #ffffff;
  font-size: 12px;
  line-height: 18px;
}

.load-label { background: #3a65ff; }
.unload-label { background: #34c7a9; }

.port-content {
  position: relative;
  left: 0;
  top: 20px;
  width: max-content;
  min-width: 88px;
  max-width: 132px;
  height: 34px;
  min-height: 34px;
  padding: 5px 8px;
  border-radius: 7px;
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.16);
  font-size: 12px;
  line-height: 24px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}

.port-line {
  position: absolute;
  left: 50%;
  top: 54px;
  width: 2px;
  height: 18px;
  background: #333333;
}

.port-anchor {
  position: absolute;
  left: calc(50% - 2.5px);
  top: 69px;
  width: 7px;
  height: 7px;
  border: 1px solid #ffffff;
  border-radius: 50%;
  background: #34c7a9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.route-distance {
  position: absolute;
  z-index: 5;
  left: 199px;
  top: 215px;
  height: 19px;
  padding: 2px 7px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.68);
  color: #ffffff;
  font-size: 10px;
  line-height: 15px;
}

/* ============ 2. 下方面板 ============ */
.detail-sheet {
  position: relative;
  z-index: 6;
  width: 375px;
  min-height: 470px;
  margin-top: -75px;
  padding: 0 0 24px;
  border-radius: 12px 12px 0 0;
  background: #eff1f6;
}

.bidding-notice {
  height: 46px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #55627a;
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
}

.bidding-notice img {
  width: 13px;
  height: 13px;
}

.design-card {
  width: 343px;
  margin: 0 16px 16px;
  border-radius: 10px;
  background: #ffffff;
}

/* ============ 3. 摘要卡片 ============ */
.summary-card {
  height: 134.5px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.summary-top {
  height: auto;
  min-height: 24px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.summary-top > strong {
  font-size: 17px;
  line-height: 22px;
  font-weight: 600;
}

.my-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
}

.my-price b {
  color: #3a65ff;
  font-size: 18px;
  line-height: 20px;
  font-weight: 600;
}

.my-price span {
  color: #999999;
  font-size: 9.5px;
  line-height: 12px;
  margin-top: 1px;
}

.time-row {
  height: 44px;
  display: grid;
  grid-template-columns: 92px 1fr 92px;
  align-items: center;
}

.time-block {
  display: flex;
  flex-direction: column;
}

.time-block b {
  color: #2f2f2f;
  font-size: 24px;
  line-height: 28px;
  font-weight: 600;
}

.time-block span {
  color: #666666;
  font-size: 11px;
  line-height: 16px;
}

.time-block.align-right {
  align-items: flex-end;
}

.duration {
  display: flex;
  align-items: center;
  justify-content: center;
}

.duration i {
  width: 18px;
  height: 1px;
  background: #dfdfdf;
}

.duration span {
  padding: 3px 8px;
  border: 1px solid #dddddd;
  border-radius: 11px;
  color: #9a9a9a;
  font-size: 10px;
  line-height: 13px;
}

.summary-tags {
  height: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.summary-tags > span {
  height: 18px;
  padding: 2px 5px;
  border: 1px solid #d6dffc;
  border-radius: 3px;
  color: #52689c;
  font-size: 10.5px;
  line-height: 12px;
  white-space: nowrap;
}

.summary-tags .time-tag {
  display: flex;
  align-items: center;
  gap: 3px;
  border: 0;
  background: #fff3d9;
  color: #8c673b;
}

.time-tag img {
  width: 11px;
  height: 11px;
}

/* ============ 4. 起终点地址卡片 ============ */
.address-card {
  height: 195px;
  min-height: 195px;
  padding: 13px 14px 9px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.address-card.expanded {
  height: auto;
}

.address-list {
  position: relative;
  height: 99px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.address-item {
  position: relative;
  height: 44px;
  display: grid;
  grid-template-columns: 18px 1fr 14px;
  column-gap: 8px;
  align-items: start;
}

.address-item > div {
  display: flex;
  flex-direction: column;
}

.address-item b {
  color: #333333;
  font-size: 14px;
  line-height: 19px;
  font-weight: 600;
}

.address-item div span {
  color: #717c8e;
  font-size: 11px;
  line-height: 15px;
  margin-top: 2px;
}

.address-item > img {
  width: 14px;
  height: 14px;
  margin-top: 2px;
}

.address-mark {
  position: relative;
  z-index: 2;
  width: 15px;
  height: 15px;
  margin-top: 1px;
  border-radius: 3px;
  display: grid;
  place-items: center;
  font-size: 9px;
  line-height: 15px;
}

.address-mark.start {
  background: #eef0f5;
  color: #708096;
}

.address-mark.end {
  background: #3a65ff;
  color: #ffffff;
}

.address-rail {
  position: absolute;
  left: 7px;
  top: 17px;
  height: 58px;
  border-left: 1px dashed #d4d7de;
}

.requirement-panel {
  position: relative;
  width: 315px;
  height: 72px;
  padding: 8px 8px 23px;
  border-radius: 2px;
  background: #f8f8fa;
}

.requirement-panel.expanded {
  height: auto;
  min-height: 72px;
}

.requirement-panel p {
  margin: 0;
  color: #55627a;
  font-size: 12px;
  line-height: 17px;
}

.requirement-panel p.clamp {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.requirement-panel button {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 4px;
  height: 18px;
  padding: 0;
  border: 0;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3px;
  color: #4e5969;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
}

/* ============ 5. 我的报价卡片（重点） ============ */
.my-quote-card {
  padding: 13px 14px 12px;
  background: #ffffff;
}

.mq-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mq-title {
  position: relative;
  padding-left: 7px;
  color: #173664;
  font-size: 14px;
  font-weight: 700;
  line-height: 18px;
}

.mq-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: #3a65ff;
}

.mq-status {
  height: 18px;
  padding: 0 7px;
  border-radius: 9px;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 18px;
  font-style: normal;
}

.mq-status.quoting { background: #eef3ff; color: #2f68ff; }
.mq-status.confirmed { background: #e8f7ef; color: #1a9e64; }
.mq-status.rejected { background: #fdecec; color: #e5484d; }
.mq-status.closed { background: #f0f2f5; color: #8a8f99; }

.mq-price-row {
  margin-top: 6px;
}

.mq-divider {
  height: 1px;
  margin: 10px 0 6px;
  background: #edf0f4;
  transform: scaleY(0.5);
}

.mq-info-row {
  min-height: 24px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.mq-label {
  flex: 0 0 auto;
  color: #a7a7a7;
  font-size: 11px;
  line-height: 24px;
}

.mq-value {
  color: #606060;
  font-size: 12px;
  font-weight: 400;
  line-height: 24px;
  text-align: right;
}

.mq-value-blue {
  color: #3465ff;
  font-weight: 600;
}

.mq-doc-btn {
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 0;
}

.mq-note {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

/* ============ 6. 发布信息卡片 ============ */
.info-card {
  min-height: 108px;
  padding: 13px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.info-card > div {
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.info-card > div > span {
  color: #a7a7a7;
}

.info-card b,
.copy-value {
  color: #606060;
  font-size: 12px;
  font-weight: 400;
}

.copy-value {
  padding: 0;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.copy-value img {
  width: 14px;
  height: 14px;
}

/* ============ 7. 底部固定操作栏 ============ */
.detail-action {
  position: absolute;
  z-index: 20;
  left: 0;
  right: 0;
  bottom: 0;
  width: 375px;
  height: 70px;
  padding: 10px 24px 20px;
  background: #ffffff;
}

.detail-action > button {
  width: 327px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  font-size: 15px;
  line-height: 40px;
  cursor: pointer;
}

.detail-action > button.primary {
  background: #3a65ff;
  color: #ffffff;
}

.detail-action > button.confirm {
  background: #1a9e64;
  color: #ffffff;
}

@media (max-width: 420px) {
  .qd-preview {
    min-height: 812px;
    padding: 0;
    background: #eff1f6;
  }

  .qd-screen {
    width: 100vw;
    max-width: 375px;
    box-shadow: none;
  }
}
</style>
