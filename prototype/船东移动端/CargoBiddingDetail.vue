<template>
  <div class="detail-preview">
    <main class="detail-screen" aria-label="详情">
      <div class="detail-scroll">
        <!-- 1. 顶部航线地图区 -->
        <section class="map-section">
          <img class="map-image" src="/cargo-detail-map.png" alt="运输路线地图" />
          <img class="status-bar" src="/shipowner-statusbar.svg" alt="" />

          <button type="button" class="back-button" aria-label="返回" @click="onBack">
            <van-icon name="arrow-left" size="22" color="#333333" />
          </button>
          <h1>详情</h1>

          <img class="route-image" src="/cargo-detail-route.svg" alt="" />
          <div class="port-card load-port">
            <span class="port-label load-label">
              {{ isCapacity ? '始发港' : '装货港' }}
            </span>
            <div class="port-content">{{ originPort }}</div>
            <span class="port-line"></span>
            <span class="port-anchor"></span>
          </div>
          <div class="port-card unload-port">
            <span class="port-label unload-label">
              {{ isCapacity ? '目的港' : '卸货港' }}
            </span>
            <div class="port-content">{{ destPort }}</div>
            <span class="port-line"></span>
            <span class="port-anchor"></span>
          </div>
          <div class="route-distance">航线{{ routeDistText }}</div>
        </section>

        <!-- 2. 下方面板区 -->
        <section class="detail-sheet">
          <div class="bidding-notice">
            <img src="/cargo-detail-notice.svg" alt="" />
            <span>{{ noticeText }}</span>
          </div>

          <!-- 3. 摘要卡片 -->
          <section class="design-card summary-card">
            <div class="summary-top">
              <strong>{{ cargoName }}</strong>
              <div class="estimated-price">
                <b>{{ priceNum }}</b>
                <span>{{ priceTip }}</span>
              </div>
            </div>

            <div class="time-row">
              <div class="time-block">
                <b>09:24</b>
                <span>04月17日 周五</span>
              </div>
              <div class="duration">
                <i></i>
                <span>共 2 天</span>
                <i></i>
              </div>
              <div class="time-block align-right">
                <b>09:24</b>
                <span>04月19日 周日</span>
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
          <section class="design-card address-card" :class="{ expanded: requirementExpanded }">
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

          <!-- 5. 底部发布信息卡片 -->
          <section class="design-card info-card">
            <div>
              <span>{{ codeLabel }}</span>
              <button type="button" class="copy-value" @click="onCopyCode">
                {{ codeValue }}
                <img src="/cargo-detail-copy.svg" alt="复制" />
              </button>
            </div>
            <div><span>发布企业</span><b>{{ publisherName }}</b></div>
            <div><span>发布时间</span><b>{{ publishTime }}</b></div>
          </section>
        </section>
      </div>

      <!-- 6. 底部固定操作栏 -->
      <footer class="detail-action">
        <button
          type="button"
          @click="openQuoteSheet"
        >
          {{ hasSubmittedQuote ? '查看我的报价' : '参与竞价' }}
        </button>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  cargoData: {
    type: Object,
    default: () => null,
  },
  hasSubmittedQuote: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['back', 'open-quote'])

// 判断是否为运力竞价模式
const standaloneBiddingType = new URLSearchParams(window.location.search).get('biddingType')
const isCapacity = computed(() => (
  props.cargoData?.businessType === 'capacity'
  || (!props.cargoData && standaloneBiddingType === 'capacity')
))

// 动态文案与参数绑定（保持统一的色彩体系）
const noticeText = computed(() =>
  isCapacity.value ? '竞价中，报价截止：04月18日 17:00' : '竞价中，报价截止：04月16日 18:00'
)

const cargoName = computed(() => {
  if (props.cargoData) {
    return isCapacity.value
      ? `${props.cargoData.cargoType} ${props.cargoData.cargoSpec}`
      : `${props.cargoData.cargoType} ${props.cargoData.cargoSpec}`
  }
  return '煤 1000吨'
})

const priceNum = computed(() => {
  if (props.cargoData && props.cargoData.price != null) {
    const rawNum = Number(String(props.cargoData.price).replace(/[^\d.]/g, '')) || 120
    const total = isCapacity.value ? rawNum * 5000 : rawNum * 1000
    return `¥${total}`
  }
  return isCapacity.value ? '¥600000' : '¥150000'
})

const priceTip = computed(() => (isCapacity.value ? '预估总运费' : '预估总运费'))

const tag1 = computed(() => (props.cargoData ? props.cargoData.timeRange : '距装货2天'))
const tag2 = computed(() => (props.cargoData ? props.cargoData.cargoType : '煤炭及制品'))
const tag3 = computed(() => {
  if (props.cargoData) {
    return `${isCapacity.value ? '参考采购' : '参考运费'} ${props.cargoData.price}${props.cargoData.unit}`
  }
  return isCapacity.value ? '参考采购 120 元/吨' : '参考运费 150 元/吨'
})

const originPort = computed(() => {
  if (!props.cargoData) return '福州港马尾作业区'
  return props.cargoData.origin && props.cargoData.origin.includes('·')
    ? props.cargoData.origin.split('·')[1]
    : props.cargoData.origin || '福州港马尾作业区'
})

const originAddr = computed(() =>
  props.cargoData
    ? props.cargoData.originAddr || `${props.cargoData.origin}`
    : '福州市马尾区福州港马尾作业区'
)

const destPort = computed(() => {
  if (!props.cargoData) return '上海港'
  return props.cargoData.destination && props.cargoData.destination.includes('·')
    ? props.cargoData.destination.split('·')[1]
    : props.cargoData.destination || '上海港'
})

const destAddr = computed(() =>
  props.cargoData ? props.cargoData.destinationAddr || `${props.cargoData.destination}` : '上海港罗泾码头'
)

const reqText = computed(() =>
  isCapacity.value
    ? '“要求散货船具备5000吨及以上承运能力，船龄10年以内，证照健全，满足沿海及内河航区适航要求。”'
    : '煤炭从福州港马尾作业区装船至上海港罗泾码头，需封仓，承运方应具备相应水路运输资质，装卸作业期间须服从港区安全管理要求。'
)

const codeLabel = computed(() => (isCapacity.value ? '运力编号' : '货源编号'))
const codeValue = computed(() =>
  props.cargoData
    ? props.cargoData.code || (isCapacity.value ? 'YL202604180002' : 'HY202604170001')
    : isCapacity.value
      ? 'YL202604180002'
      : 'HY202604170001'
)
const publisherName = computed(() => (props.cargoData ? props.cargoData.publisher : '福州港船企业'))
const publishTime = computed(() =>
  props.cargoData
    ? props.cargoData.publishTimeFull || '2026-04-17 08:00:00'
    : '2026-04-17 08:00:00'
)

const routeDistText = computed(() => props.cargoData?.routeDistance || '420海里')

// 初始页面状态
const requirementExpanded = ref(false)

const onBack = () => emit('back')

const onCopyCode = async () => {
  try {
    await navigator.clipboard?.writeText(codeValue.value)
  } finally {
    showToast(`${codeLabel.value}已复制`)
  }
}

const openQuoteSheet = () => {
  emit('open-quote')
}

const submitQuote = () => {
  if (!String(quotePrice.value).trim()) {
    showToast('请输入报价单价')
    return
  }
  if (!String(quoteDuration.value).trim()) {
    showToast('请输入预计运输时长')
    return
  }

  showConfirmDialog({
    title: '确认提交',
    message: `确认按单价 ${quotePrice.value} 元/吨、时长 ${quoteDuration.value} 天提交本次报价吗？`,
    teleport: 'body',
  }).then(() => {
    quoteSubmitted.value = true
    showQuoteSheet.value = false
    showToast('报价提交成功')
  }).catch(() => {})
}
</script>

<style scoped>
.detail-screen,
.detail-screen *,
.detail-screen *::before,
.detail-screen *::after {
  box-sizing: border-box;
}

.detail-preview {
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

.detail-screen {
  position: relative;
  width: 375px;
  height: 812px;
  overflow: hidden;
  flex: 0 0 auto;
  background: #eff1f6;
  box-shadow: 0 16px 46px rgba(20, 37, 68, 0.18);
}

.detail-scroll {
  position: absolute;
  inset: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-bottom: 78px;
  scrollbar-width: none;
}

.detail-scroll::-webkit-scrollbar {
  display: none;
}

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
  left: 166px;
  top: 101px;
  width: max-content;
}

.unload-port {
  left: 49px;
  top: 257px;
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
}

.load-port .port-content {
  width: max-content;
  min-width: 88px;
  max-width: 132px;
  height: 34px;
  min-height: 34px;
  padding: 5px 8px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.unload-port .port-content {
  width: max-content;
  min-width: 88px;
  max-width: 132px;
  height: 34px;
  min-height: 34px;
  padding: 5px 8px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.port-line {
  position: absolute;
  left: 50%;
  top: 54px;
  width: 2px;
  height: 18px;
  background: #333333;
}

.load-port .port-line {
  left: 50%;
  top: 54px;
  height: 18px;
}

.unload-port .port-line {
  left: 50%;
  top: 54px;
  height: 18px;
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

.load-port .port-anchor {
  left: calc(50% - 2.5px);
  top: 69px;
}

.unload-port .port-anchor {
  left: calc(50% - 2.5px);
  top: 69px;
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

.detail-sheet {
  position: relative;
  z-index: 6;
  width: 375px;
  min-height: 470px;
  margin-top: -75px;
  padding: 0 0 16px;
  border-radius: 12px 12px 0 0;
  background: #eff1f6;
}

.bidding-notice {
  height: 42px;
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
  margin: 0 16px 12px;
  border-radius: 10px;
  background: #ffffff;
}

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

.estimated-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
}

.estimated-price b {
  color: #3a65ff;
  font-size: 18px;
  line-height: 20px;
  font-weight: 600;
}

.estimated-price span {
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
  background: #3a65ff;
  color: #ffffff;
  font-size: 15px;
  line-height: 40px;
  cursor: pointer;
}

.quote-sheet-content {
  padding: 16px 20px calc(24px + env(safe-area-inset-bottom));
}

.quote-sheet-content label {
  display: block;
  margin-bottom: 16px;
  color: #333333;
  font-size: 13px;
  font-weight: 600;
}

.quote-sheet-content label > span {
  display: block;
  margin-bottom: 6px;
}

.quote-sheet-content .required::after {
  content: " *";
  color: #ee3f3f;
}

.quote-sheet-content :deep(.van-field) {
  padding: 9px 12px;
  border: 1px solid #e5e9f2;
  border-radius: 8px;
  background: #f4f6fa;
}

.quote-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.quote-actions button {
  height: 44px;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 600;
}

.quote-actions .cancel {
  flex: 1;
  border: 1px solid #c8ced9;
  background: #ffffff;
  color: #55627a;
}

.quote-actions .confirm {
  flex: 2;
  border: 0;
  background: #3a65ff;
  color: #ffffff;
}

@media (max-width: 420px) {
  .detail-preview {
    min-height: 812px;
    padding: 0;
    background: #eff1f6;
  }

  .detail-screen {
    width: 100vw;
    max-width: 375px;
    box-shadow: none;
  }
}
</style>
