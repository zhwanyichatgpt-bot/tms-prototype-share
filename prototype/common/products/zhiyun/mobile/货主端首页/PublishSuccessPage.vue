<template>
  <div class="ps-page">
    <div class="ps-scroll">
      <!-- 状态栏 -->
      <div class="status-bar">
        <span class="status-time">9:41</span>
        <span class="status-icons">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
          <span class="battery"></span>
        </span>
      </div>

      <!-- 顶部返回 -->
      <div class="ps-nav">
        <button type="button" class="ps-back" @click="$emit('back')" aria-label="返回">
          <svg width="6.5" height="12" viewBox="0 0 13 24" fill="none"><path d="M10.6 1.2L2.4 12L10.6 22.8" stroke="#333" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>

      <!-- 发布成功 icon（Pixso 7:872 140×120 @303,139 → 70×60 居中） -->
      <img class="ps-success-icon" src="/zhiyun-mobile-assets/publish-success-icon.png" alt="" />

      <h1 class="ps-success-title">发布成功！</h1>
      <p class="ps-success-sub">为你找到 23 家匹配的运力</p>

      <!-- 货源订单卡（Pixso 7:886 686×276 @32,418 → 343×138） -->
      <div class="ps-order-card">
        <!-- 路线两行 + 右侧参考运费 -->
        <div class="ps-order-main">
          <div class="ps-route">
            <span class="ps-route-line">
              <span class="ps-dot ps-dot-blue"></span>
              <span class="ps-route-text">{{ order.loadPoint }}</span>
            </span>
            <span class="ps-route-connector" aria-hidden="true"></span>
            <span class="ps-route-line">
              <span class="ps-dot ps-dot-green"></span>
              <span class="ps-route-text">{{ order.unloadPoint }}</span>
            </span>
          </div>
          <div class="ps-price">
            <p class="ps-price-label">参考运费</p>
            <p class="ps-price-value"><b>{{ order.price }}</b><span>元/吨</span></p>
          </div>
        </div>
        <!-- 货品标签行 -->
        <div class="ps-goods-row">
          <span class="ps-goods-pill ps-goods-blue">{{ order.packTag }}</span>
          <span class="ps-goods-pill ps-goods-green">{{ order.typeTag }}</span>
          <span class="ps-goods-pill ps-goods-plain">{{ order.goodsText }}</span>
        </div>
      </div>

      <!-- 推荐运力（Pixso 分组1 @32,739：4 张运力卡） -->
      <div class="ps-rec">
        <div class="ps-rec-head">
          <h2 class="ps-rec-title">推荐<em>运力</em></h2>
          <span class="ps-rec-count">根据线路与货品匹配</span>
        </div>
        <div v-for="c in recCarriers" :key="c.id" class="ps-card" @click="$emit('open-carrier', c.id)">
          <div class="ps-card-side">
            <img class="ps-card-photo" :src="c.photo" alt="" />
            <span class="ps-card-coop">{{ c.coop }}</span>
          </div>
          <div class="ps-card-info">
            <div class="ps-card-top">
              <p class="ps-card-name">{{ c.name }}</p>
              <span class="ps-card-rate"><b>{{ c.rate }}</b>推荐</span>
            </div>
            <div class="ps-card-rows">
              <p class="ps-card-row">
                <span class="ps-card-label">{{ c.row1Label }}</span>{{ c.row1 }}
              </p>
              <p class="ps-card-row">
                <span class="ps-card-label">{{ c.row2Label }}</span>{{ c.row2 }}
              </p>
            </div>
            <div class="ps-card-tags">
              <span class="ps-tag ps-tag-gold">{{ c.tag1 }}</span>
              <span class="ps-tag ps-tag-purple">{{ c.tag2 }}</span>
              <span class="ps-tag ps-tag-blue">{{ c.tag3 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  /* 实际发布的信息：由发布流程带过来，避免与上一步口径不一致 */
  published: { type: Object, default: null },
})

defineEmits(['back', 'open-carrier'])

// 与发布流程第二步保持一致；未从流程进入时使用默认示例
const order = reactive({
  loadPoint: '福州市·江上图首府叁号',
  unloadPoint: '天津市·东丽物流园',
  packTag: '整车',
  typeTag: '煤炭',
  goodsText: '煤炭 340吨',
  price: 1850,
})

watch(
  () => props.published,
  (info) => {
    if (!info) return
    if (info.goods) order.typeTag = info.goods
    if (info.quantity) order.goodsText = `${info.goods || order.typeTag} ${info.quantity}吨`
    if (info.price) order.price = info.price
  },
  { immediate: true },
)

// 推荐运力：沿用 Pixso 承运商卡片版式，内容改为车队运力
const recCarriers = [
  {
    id: 'r1',
    name: '象奔奔车队（福建）运营中心',
    rate: '95%',
    coop: '合作过 3 次',
    photo: '/zhiyun-mobile-assets/truck-li-zeyuan.png',
    row1Label: '运力',
    row1: '共 25 人（12 名持证司机）',
    row2Label: '车辆',
    row2: '共 10 辆（13米高栏等3种车型）',
    tag1: '平台认证',
    tag2: '大宗运输',
    tag3: '接单34次',
  },
  {
    id: 'r2',
    name: '金石智运车队',
    rate: '93%',
    coop: '合作过 5 次',
    photo: '/zhiyun-mobile-assets/truck-li-zeyuan.png',
    row1Label: '运力',
    row1: '共 18 人（9 名持证司机）',
    row2Label: '车辆',
    row2: '共 8 辆（17.5米平板等2种车型）',
    tag1: '平台认证',
    tag2: '干线运输',
    tag3: '接单52次',
  },
  {
    id: 'r3',
    name: '超好运车队（福州）',
    rate: '96%',
    coop: '合作过 2 次',
    photo: '/zhiyun-mobile-assets/truck-li-zeyuan.png',
    row1Label: '运力',
    row1: '共 30 人（15 名持证司机）',
    row2Label: '车辆',
    row2: '共 12 辆（13米高栏等2种车型）',
    tag1: '平台认证',
    tag2: '煤炭专线',
    tag3: '接单41次',
  },
  {
    id: 'r4',
    name: '闽通物流车队',
    rate: '91%',
    coop: '合作过 6 次',
    photo: '/zhiyun-mobile-assets/truck-li-zeyuan.png',
    row1Label: '运力',
    row1: '共 16 人（8 名持证司机）',
    row2Label: '车辆',
    row2: '共 7 辆（13米自卸等2种车型）',
    tag1: '平台认证',
    tag2: '矿建运输',
    tag3: '接单28次',
  },
]
</script>

<style scoped>
/* Pixso 7:798 发布货源（发布成功）@750 → @375 半分 */
.ps-page {
  position: absolute;
  inset: 0;
  z-index: 45;
  background: #eef0f5;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'SF Pro Text', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}
.ps-scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.ps-scroll::-webkit-scrollbar {
  display: none;
}
/* 顶部浅色横带（Pixso 7:801 750×278 #f0f2f6） */
.ps-scroll::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 139px;
  background: linear-gradient(180deg, #f0f2f6 0%, #f0f2f6 100%);
  z-index: 0;
  pointer-events: none;
}
.ps-scroll > * {
  position: relative;
  z-index: 1;
}

/* 状态栏 */
.status-bar {
  height: 60px;
  padding: 16px 14.5px 0 16px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-shrink: 0;
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

/* 返回 */
.ps-nav {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 24px;
}
.ps-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

/* 成功 icon（Pixso 7:872 140×120 @303,139 → 70×60；资产已裁到节点精确边界） */
.ps-success-icon {
  display: block;
  width: 70px;
  height: 60px;
  margin: 9.5px auto 0;
  object-fit: contain;
}
.ps-success-title {
  margin: 6px 0 0;
  text-align: center;
  font-size: 21px;
  line-height: 28px;
  font-weight: 700;
  color: #333;
}
.ps-success-sub {
  margin: 4px 0 0;
  text-align: center;
  font-size: 12px;
  line-height: 16px;
  font-weight: 400;
  color: #333;
}

/* 货源订单卡（无预付条后收缩为内容高度） */
.ps-order-card {
  margin: 25.5px 16px 0;
  background: #fff;
  border-radius: 14px;
  padding: 12px 14px 14px 16.5px;
  box-sizing: border-box;
  box-shadow: 0 2px 10px rgba(120, 140, 180, 0.08);
}
/* 路线区 + 右侧参考运费 */
.ps-order-main {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
}
.ps-route {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.ps-route-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ps-dot {
  width: 4.5px;
  height: 4.5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ps-dot-blue { background: #3a65ff; }
.ps-dot-green { background: #21bd88; }
/* 装卸点之间虚线（Pixso 直线18 0×30 @66,473 → 0×15） */
.ps-route-connector {
  width: 0;
  height: 15px;
  border-left: 1px dashed #b8c0cf;
  margin-left: 2.25px;
}
.ps-route-text {
  font-size: 14px;
  line-height: 18.5px;
  font-weight: 700;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 参考运费（Pixso 组103 107×59 @590,521，右对齐、与第二行路线同底） */
.ps-price {
  flex-shrink: 0;
  text-align: right;
  width: 53.5px;
  padding-bottom: 1px;
}
.ps-price-label {
  margin: 0;
  font-size: 8px;
  line-height: 10.5px;
  font-weight: 700;
  color: #8a91a1;
}
.ps-price-value {
  margin: 0;
  color: #3a65ff;
  font-size: 10px;
  line-height: 13px;
  font-weight: 700;
  white-space: nowrap;
}
.ps-price-value b {
  font-size: 16px;
  line-height: 21px;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin-right: 1px;
}
/* 货品标签行（Pixso y551 → 卡片内 top 66.5） */
.ps-goods-row {
  margin-top: 11px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.ps-goods-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  padding: 1.5px 7.5px;
  font-size: 9px;
  line-height: 12px;
  font-weight: 700;
}
.ps-goods-blue {
  color: #27419c;
  background: #eff3ff;
}
.ps-goods-green {
  color: #137c62;
  background: #e5f4f7;
}
.ps-goods-plain {
  color: #647090;
  background: #e7ecf5;
}
/* 推荐运力 */
.ps-rec {
  padding: 20px 16px 110px;
}
.ps-rec-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0 0 0 2px;
}
.ps-rec-title {
  margin: 0;
  font-size: 17px;
  line-height: 24px;
  font-weight: 700;
  color: #333;
}
.ps-rec-title em {
  font-style: normal;
  color: #3a65ff;
}
.ps-rec-count {
  font-size: 10px;
  color: #999;
}
/* 运力卡：686×236 → 343×118，图块 141×191 @19,23 → 70.5×95.5 @9.5,11.5；信息列 @190,22 → 间距15px 右留8px */
.ps-card {
  margin-top: 10px;
  background: #fff;
  border-radius: 12px;
  padding: 11.5px 8px 11.5px 9.5px;
  display: flex;
  gap: 15px;
  box-sizing: border-box;
  box-shadow: 0 2px 10px rgba(120, 140, 180, 0.08);
  cursor: pointer;
}
.ps-card-side {
  position: relative;
  width: 70.5px;
  height: 95.5px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}
.ps-card-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* 合作过标签（Pixso -03 119×35 @11,146：rgba(39,39,39,.65) 底 + 金色字，居中贴底） */
.ps-card-coop {
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
.ps-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.ps-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}
.ps-card-name {
  margin: 0;
  font-size: 16px;
  line-height: 21px;
  font-weight: 700;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ps-card-rate {
  flex-shrink: 0;
  display: inline-flex;
  align-items: baseline;
  color: #1cae7d;
  font-size: 10px;
  line-height: 14px;
  font-weight: 600;
  margin-top: 4px;
}
.ps-card-rate b {
  font-size: 16px;
  line-height: 16px;
  font-weight: 700;
  margin-right: 2px;
}
.ps-card-rows {
  margin-top: 4px;
}
.ps-card-row {
  margin: 0 0 1.5px;
  font-size: 12px;
  line-height: 16.5px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ps-card-label {
  color: #999;
  font-weight: 400;
  margin-right: 8px;
}
.ps-card-tags {
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.ps-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 5px;
  padding: 2px 6px;
  font-size: 10px;
  line-height: 13px;
  font-weight: 600;
}
.ps-tag-gold {
  color: #784f21;
  background: #f9efd7;
}
.ps-tag-purple {
  color: #808cb6;
  background: #edeff8;
}
.ps-tag-blue {
  color: #27419c;
  background: #e8f1ff;
}
</style>
