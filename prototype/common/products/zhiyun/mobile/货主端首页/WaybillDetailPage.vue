<template>
  <div class="wd-page" aria-label="运单详情">
    <div class="wd-scroll">
      <!-- 地图区：沿用东南沿海底图，装卸点按底图实际地理方位标注 -->
      <div class="wd-map">
        <img class="wd-map-img" src="/cargo-detail-map.png" alt="" />

        <svg class="wd-route" viewBox="0 0 375 438" aria-hidden="true">
          <path class="wd-route-glow" :d="routePath" />
          <path class="wd-route-line" :d="routePath" />
        </svg>

        <div class="wd-point" :style="pointStyle('load')">
          <span class="wd-point-badge wd-badge-load">装货地</span>
          <span class="wd-point-card">{{ loadTitle }}<i aria-hidden="true">‹</i></span>
        </div>
        <span class="wd-pin wd-pin-load" :style="pinStyle('load')" aria-hidden="true"></span>

        <div class="wd-point" :style="pointStyle('unload')">
          <span class="wd-point-badge wd-badge-unload">卸货地</span>
          <span class="wd-point-card">{{ unloadTitle }}<i aria-hidden="true">‹</i></span>
        </div>
        <span class="wd-pin wd-pin-unload" :style="pinStyle('unload')" aria-hidden="true"></span>

        <span class="wd-distance" :style="distanceStyle">{{ waybill.routeDistance }}</span>

        <div class="wd-fade" aria-hidden="true"></div>
        <p class="wd-notice"><i aria-hidden="true"></i>{{ noticeText }}</p>
      </div>

      <div class="wd-status">
        <span class="wd-status-time">9:41</span>
        <span class="wd-status-icons" aria-hidden="true">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
          <span class="battery"></span>
        </span>
      </div>

      <header class="wd-nav">
        <button type="button" class="wd-back" aria-label="返回" @click="emit('back')">
          <svg width="9" height="17" viewBox="0 0 10 18" fill="none"><path d="M8.6 1L1.4 9L8.6 17" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <h1>运单详情</h1>
        <span class="wd-nav-hold" aria-hidden="true"></span>
      </header>

      <div class="wd-body">
        <!-- ① 运单主卡：货物、运费、装卸时间 -->
        <section class="wd-card wd-main">
          <div class="wd-main-head">
            <h2>{{ waybill.cargo }} <b>{{ waybill.tons }} 吨</b></h2>
            <p class="wd-price"><i>¥</i>{{ waybill.freight }}</p>
          </div>

          <div class="wd-time-row">
            <div class="wd-time">
              <strong>{{ loadTime.time }}</strong>
              <span>{{ loadTime.date }}</span>
            </div>
            <div class="wd-duration">
              <i aria-hidden="true"></i>
              <em>{{ waybill.statusType === 'done' ? '已送达' : arriveShort }}</em>
              <i aria-hidden="true"></i>
            </div>
            <div class="wd-time wd-time-right">
              <strong>{{ unloadTime.time || '--' }}</strong>
              <span>{{ unloadTime.date || '待卸货' }}</span>
            </div>
          </div>

          <div class="wd-tags">
            <span class="wd-tag wd-tag-state" :class="`tag-${waybill.statusType}`">{{ waybill.status }}</span>
            <span class="wd-tag wd-tag-plain">{{ waybill.cargoCategory }}</span>
            <span class="wd-tag wd-tag-plain">承接 {{ waybill.platform }}</span>
          </div>
        </section>

        <!-- ② 关联货源：说明这张运单属于哪一票货源 -->
        <section class="wd-card wd-cargo-link">
          <div class="wd-link-head">
            <h3>关联货源</h3>
            <button type="button" class="wd-link-entry" @click="emit('open-cargo', waybill)">
              {{ waybill.cargoNo }}
              <svg width="7" height="12" viewBox="0 0 9 14" fill="none"><path d="M1.5 1l6 6-6 6" stroke="#3a65ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <p class="wd-link-line">
            {{ waybill.cargo }} · 本单 {{ waybill.tons }} 吨 · {{ waybill.loadCity }} → {{ waybill.unloadCity }}
          </p>
        </section>

        <!-- ③ 装卸地址 -->
        <section class="wd-card wd-addr">
          <div class="wd-addr-row">
            <span class="wd-badge wd-badge-start">起</span>
            <div class="wd-addr-text">
              <p class="wd-addr-city">{{ waybill.loadCity }}</p>
              <p class="wd-addr-detail">{{ waybill.loadDetail }}</p>
            </div>
            <span class="wd-addr-icon" aria-hidden="true">
              <svg width="14" height="18" viewBox="0 0 14 18" fill="none"><path d="M7 0C3.1 0 0 3.1 0 7c0 5.2 7 11 7 11s7-5.8 7-11c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 7 4.5a2.5 2.5 0 0 1 0 5z" fill="#d4d4d4"/></svg>
            </span>
          </div>

          <span class="wd-addr-link" aria-hidden="true"></span>

          <div class="wd-addr-row">
            <span class="wd-badge wd-badge-end">终</span>
            <div class="wd-addr-text">
              <p class="wd-addr-city">{{ waybill.unloadCity }}</p>
              <p class="wd-addr-detail">{{ waybill.unloadDetail }}</p>
            </div>
            <span class="wd-addr-icon" aria-hidden="true">
              <svg width="14" height="18" viewBox="0 0 14 18" fill="none"><path d="M7 0C3.1 0 0 3.1 0 7c0 5.2 7 11 7 11s7-5.8 7-11c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 7 4.5a2.5 2.5 0 0 1 0 5z" fill="#d4d4d4"/></svg>
            </span>
          </div>
        </section>

        <!-- ④ 运输进度：公路节点，替代水运的开航/到港 -->
        <section class="wd-card wd-progress">
          <h3>运输进度</h3>
          <div
            v-for="(step, index) in progressSteps"
            :key="step.name"
            class="wd-step"
            :class="{ 'is-last': index === progressSteps.length - 1 }"
          >
            <span class="wd-step-state" :class="`step-${step.tone}`">{{ step.toneText }}</span>
            <div class="wd-step-body">
              <p class="wd-step-head">
                <b>{{ step.name }}</b>
                <time>{{ step.time }}</time>
              </p>
              <p class="wd-step-desc" :class="{ 'is-active': step.tone === 'running' }">{{ step.description }}</p>
              <p v-if="step.extra" class="wd-step-extra">{{ step.extra }}</p>
            </div>
          </div>
        </section>

        <!-- ⑤ 承运信息：车辆与司机属于运单，不放在货源上 -->
        <section class="wd-card wd-vehicle">
          <div class="wd-vehicle-text">
            <h3>{{ waybill.plate }}</h3>
            <p class="wd-vehicle-line"><span>车型</span><b>{{ waybill.vehicleType }}</b></p>
            <p class="wd-vehicle-line"><span>司机</span><b>{{ waybill.driver }}（{{ waybill.driverPhone }}）</b></p>
            <p class="wd-vehicle-line"><span>承接平台</span><b>{{ waybill.platform }}</b></p>
          </div>
          <figure class="wd-vehicle-photo">
            <img src="/zhiyun-mobile-assets/truck-li-zeyuan.png" alt="" />
            <figcaption>{{ waybill.vehicleType }}</figcaption>
          </figure>
        </section>

        <!-- ⑥ 单据信息：凭证与结算分开表达，不用运输完成代表已结算 -->
        <section class="wd-card wd-meta">
          <div class="wd-meta-row">
            <span>运单号</span>
            <p>
              {{ waybill.number }}
              <button type="button" class="wd-copy" aria-label="复制运单号" @click="copyNumber">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="9" height="9" rx="1.4" stroke="#bcbcbc" stroke-width="1.2"/><path d="M9.5 2.6V2a1.4 1.4 0 0 0-1.4-1.4H2.2A1.4 1.4 0 0 0 .8 2v5.9a1.4 1.4 0 0 0 1.4 1.4h.6" stroke="#bcbcbc" stroke-width="1.2" stroke-linecap="round"/></svg>
              </button>
            </p>
          </div>
          <div v-for="row in metaRows" :key="row.label" class="wd-meta-row">
            <span>{{ row.label }}</span>
            <p>{{ row.value }}</p>
          </div>
        </section>
      </div>
    </div>

    <div class="wd-actions">
      <button type="button" class="wd-action-ghost" @click="contactDriver">联系司机</button>
      <button v-if="primaryAction" type="button" class="wd-action" @click="onPrimary">{{ primaryAction }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ waybill: { type: Object, required: true } })
const emit = defineEmits(['back', 'open-cargo', 'to-settle'])

const loadTitle = computed(() => props.waybill.loadCity.split('·')[0])
const unloadTitle = computed(() => props.waybill.unloadCity.split('·')[0])

const splitDateTime = (value = '') => {
  const parts = value.split(' ')
  if (parts.length < 2) return { date: '', time: '' }
  return { date: parts[0], time: parts[1] }
}
const loadTime = computed(() => splitDateTime(props.waybill.loadTime))
const unloadTime = computed(() => splitDateTime(props.waybill.unloadTime))

const arriveShort = computed(() => (props.waybill.arriveText || '').replace(/^预计\s*/, '').replace(/\s*到达$/, '') || '运输中')

/* 顶部提示用货主口径：说明这单现在到哪一步，不用司机端那种推进动作 */
const noticeText = computed(() => ({
  loaded: '司机已装货，车辆准备发车',
  moving: '货物运输中，可查看进度与凭证',
  done: '货物已送达，可核对凭证并结算',
  cancelled: '运单已取消',
}[props.waybill.statusType] || ''))

/* 公路运输节点：接单 → 装货 → 运输 → 送达；取代水运的开航/到港 */
const progressSteps = computed(() => {
  const w = props.waybill
  const done = w.statusType === 'done'
  const loaded = done || w.statusType === 'moving' || w.statusType === 'loaded'
  return [
    {
      name: '司机接单', tone: 'passed', toneText: '已完成', time: w.acceptTime?.slice(5, 16) || '--',
      description: `承运车辆 ${w.plate}`, extra: `承接平台 ${w.platform}`,
    },
    {
      name: '完成装货', tone: loaded ? 'passed' : 'waiting', toneText: loaded ? '已完成' : '待开始',
      time: w.loadTime || '--',
      description: loaded ? `装货 ${w.tons} 吨，装货凭证已上传` : '到达装货地后上传装货凭证',
      extra: w.loadCity,
    },
    {
      name: '运输途中', tone: done ? 'passed' : (w.statusType === 'moving' ? 'running' : 'waiting'),
      toneText: done ? '已完成' : (w.statusType === 'moving' ? '进行中' : '待开始'),
      time: w.statusType === 'moving' ? '运输中' : (done ? '已抵达' : '--'),
      description: w.statusType === 'moving' ? '车辆按计划运输，可查看最新位置' : (done ? `全程 ${w.routeDistance}` : '装货完成后进入运输'),
      extra: w.arriveText || '',
    },
    {
      name: '到达卸货地', tone: done ? 'passed' : 'waiting', toneText: done ? '已完成' : '待开始',
      time: done ? (w.unloadTime || '--') : '--',
      description: done ? `卸货 ${w.tons} 吨，卸货凭证已上传` : '到达后需上传卸货凭证',
      extra: w.unloadCity,
    },
  ]
})

/* 货主视角的下一步：运输中能做的只有联系司机，送达后才进入结算 */
const primaryAction = computed(() => {
  if (props.waybill.statusType === 'done') {
    return props.waybill.settleType === 'settled' ? '' : '去结算'
  }
  return ''
})

// 结算状态取运单自身的 settleType；原读写 settleState 字段在数据中并不存在，该行此前渲染为空
const SETTLE_LABELS = { pending: '待结算', unpaid: '待付款', settled: '已结算' }

const metaRows = computed(() => {
  const w = props.waybill
  return [
    { label: '接单时间', value: w.acceptTime },
    { label: '装货凭证', value: w.vouchers?.load ? '已上传' : '待上传' },
    { label: '卸货凭证', value: w.vouchers?.unload ? '已上传' : '待上传' },
    { label: '结算状态', value: SETTLE_LABELS[w.settleType] || '待结算' },
  ]
})

const onPrimary = () => {
  if (primaryAction.value === '去结算') {
    emit('to-settle', props.waybill)
    return
  }
}

const contactDriver = () => {
  toToast(`正在联系司机 ${props.waybill.driver}`)
}

const copyNumber = () => {
  try {
    window.navigator?.clipboard?.writeText(props.waybill.number)
  } catch { /* 剪贴板不可用时仍给出提示 */ }
  toToast('运单号已复制')
}

const toToast = (message) => {
  if (typeof window !== 'undefined' && window.sharedStorage && window.sharedStorage.toast) {
    window.sharedStorage.toast(message)
  }
}

/* ===== 地图标注：与货源详情同一套排布规则 ===== */
const MAP_W = 375
const MAP_H = 438
const MAP_PAD = 8
const CARD_W = 182
const PIN_R = 10
const LABEL_H = 62

/* 运单地图沿用货源线路的城市方位；两站点纵向拉开，保证两张标签卡上下互不遮挡 */
const pins = computed(() => {
  const w = props.waybill
  const southern = ['福州', '宁德']
  const loadIsSouth = southern.some((city) => w.loadCity.includes(city))
  return loadIsSouth
    ? { load: { x: 140, y: 344 }, unload: { x: 258, y: 196 } }
    : { load: { x: 258, y: 196 }, unload: { x: 140, y: 344 } }
})

const routePath = computed(() => {
  const { load, unload } = pins.value
  const dx = unload.x - load.x
  const dy = unload.y - load.y
  const cx = (load.x + unload.x) / 2 - dy * 0.28
  const cy = (load.y + unload.y) / 2 + dx * 0.28
  return `M ${load.x} ${load.y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${unload.x} ${unload.y}`
})

const pinStyle = (key) => {
  const point = pins.value[key]
  return { left: `${point.x}px`, top: `${point.y}px` }
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

/* 标签卡一律贴在点位上方，与货源详情同一排布规则，避免落入地图下沿过渡层 */
const pointStyle = (key) => {
  const point = pins.value[key]
  const left = clamp(point.x - CARD_W / 2 + PIN_R, MAP_PAD, MAP_W - CARD_W - MAP_PAD)
  const top = clamp(point.y - PIN_R - 8 - LABEL_H, MAP_PAD, MAP_H - LABEL_H - MAP_PAD)
  return { left: `${left}px`, top: `${top}px` }
}

const distanceStyle = computed(() => {
  const { load, unload } = pins.value
  const upper = load.y <= unload.y ? load : unload
  const lower = upper === load ? unload : load
  const gapTop = upper.y - PIN_R - 8
  const gapBottom = lower.y - PIN_R - 8 - LABEL_H
  const gap = gapBottom - gapTop
  const y = gap >= 24 ? gapTop + gap / 2 : (load.y + unload.y) / 2
  const span = unload.y - load.y || 1
  const ratio = Math.min(Math.max((y - load.y) / span, 0), 1)
  const lineX = load.x + (unload.x - load.x) * ratio
  const left = clamp(lineX + 20, MAP_PAD, MAP_W - 76 - MAP_PAD)
  const top = clamp(y - 9, MAP_PAD, MAP_H - 26)
  return { left: `${left}px`, top: `${top}px` }
})
</script>

<style scoped>
.wd-page {
  position: absolute;
  inset: 0;
  z-index: 100;
  overflow: hidden;
  background: #eef0f5;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.wd-scroll {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 70px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: none;
}
.wd-scroll::-webkit-scrollbar { display: none; }

/* ===== 地图区 ===== */
.wd-map {
  position: relative;
  height: 438px;
  overflow: hidden;
  background: #e9f1fb;
}
.wd-map-img {
  position: absolute;
  inset: 0;
  width: 375px;
  height: 438px;
  object-fit: cover;
}
.wd-route {
  position: absolute;
  inset: 0;
  width: 375px;
  height: 438px;
}
.wd-route-glow {
  fill: none;
  stroke: #3a65ff;
  stroke-width: 8;
  stroke-linecap: round;
  opacity: 0.28;
  filter: blur(3px);
}
.wd-route-line {
  fill: none;
  stroke: #3a65ff;
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-dasharray: 7 6;
}

.wd-pin {
  position: absolute;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(28, 60, 140, 0.35);
}
.wd-pin-load { background: #3a65ff; }
.wd-pin-unload { background: #34c7a9; }

.wd-point {
  position: absolute;
  width: 182px;
  display: flex;
  flex-direction: column;
}
.wd-point-badge {
  align-self: flex-start;
  height: 27px;
  padding: 0 13px;
  border-radius: 8px 8px 0 0;
  display: inline-flex;
  align-items: center;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
}
.wd-badge-load { background: #3a65ff; }
.wd-badge-unload { background: #34c7a9; }
.wd-point-card {
  position: relative;
  padding: 11px 30px 11px 11px;
  border-radius: 0 10px 10px 10px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(28, 60, 140, 0.14);
  color: #333;
  font-size: 12px;
  line-height: 17px;
  font-weight: 600;
}
.wd-point-card i {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #9aa3b3;
  font-size: 14px;
  font-style: normal;
}
.wd-distance {
  position: absolute;
  height: 18px;
  padding: 0 8px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.68);
  color: #fff;
  font-size: 10px;
  white-space: nowrap;
}
.wd-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 80px;
  background: linear-gradient(180deg, #ebf3fe, #eef0f5);
}
.wd-notice {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 47px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 24px;
  color: #3d4050;
  font-size: 12px;
}
.wd-notice i {
  width: 11px;
  height: 13px;
  flex: none;
  background: #77808f;
  clip-path: polygon(0 0, 55% 22%, 100% 0, 100% 100%, 0 100%);
}

/* ===== 状态栏与导航 ===== */
.wd-status {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  color: #0c0c0c;
}
.wd-status-time { font-size: 15px; font-weight: 700; }
.wd-status-icons { display: flex; align-items: center; gap: 5px; }
.battery {
  position: relative;
  width: 21px;
  height: 10px;
  border: 1px solid #111;
  border-radius: 2px;
  background: #111;
  box-shadow: inset 0 0 0 2px #eef2f8;
}
.wd-nav {
  position: absolute;
  top: 44px;
  left: 0;
  right: 0;
  z-index: 3;
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 16px;
}
.wd-back {
  width: 32px;
  height: 32px;
  margin-left: -6px;
  display: grid;
  place-items: center;
  border: 0;
  padding: 0;
  background: none;
  cursor: pointer;
}
.wd-nav h1 {
  flex: 1;
  margin: 0;
  font-size: 18px;
  line-height: 25px;
  font-weight: 600;
  color: #333;
}
.wd-nav-hold { width: 32px; }

/* ===== 内容区 ===== */
.wd-body {
  position: relative;
  z-index: 2;
  margin-top: -32px;
  padding: 0 15px 16px;
}
.wd-card {
  margin-bottom: 10px;
  padding: 16px 14px;
  border-radius: 12px;
  background: #fff;
}

/* ① 运单主卡 */
.wd-main { padding-bottom: 14px; }
.wd-main-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.wd-main-head h2 {
  margin: 0;
  font-size: 16px;
  line-height: 21px;
  font-weight: 600;
  color: #333;
}
.wd-main-head h2 b { font-weight: 600; }
.wd-price {
  display: flex;
  align-items: baseline;
  margin: 0;
  color: #3a65ff;
  font-size: 18px;
  line-height: 19px;
  font-weight: 700;
  white-space: nowrap;
}
.wd-price i { margin-right: 2px; font-size: 10px; font-style: normal; }

.wd-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 14px;
}
.wd-time { display: flex; flex-direction: column; }
.wd-time-right { align-items: flex-end; }
.wd-time strong { font-size: 26px; line-height: 28px; font-weight: 700; color: #333; }
.wd-time span { margin-top: 5px; color: #a1a1a1; font-size: 12px; }
.wd-duration { display: flex; align-items: center; gap: 6px; padding-bottom: 14px; }
.wd-duration i {
  width: 24px;
  height: 2px;
  background: linear-gradient(90deg, rgba(166, 166, 166, 0), #a6a6a6);
}
.wd-duration i:last-child { background: linear-gradient(90deg, #a6a6a6, rgba(166, 166, 166, 0)); }
.wd-duration em {
  padding: 3px 9px;
  border: 1px solid #a6a6a6;
  border-radius: 11px;
  color: #999;
  font-size: 10px;
  font-style: normal;
  white-space: nowrap;
}

.wd-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.wd-tag {
  height: 18px;
  padding: 0 8px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  white-space: nowrap;
}
.wd-tag-plain { border: 1px solid #b8c2e6; color: #808cb6; }
.tag-done { background: #eef7f3; color: #20ad82; }
.tag-moving { background: #eef3ff; color: #3a65ff; }
.tag-loaded { background: #f9efd7; color: #784f21; }
.tag-cancelled { background: #f2f3f5; color: #999; }

/* ② 关联货源 */
.wd-link-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.wd-link-head h3 {
  margin: 0;
  font-size: 14px;
  line-height: 14px;
  font-weight: 600;
  color: #333;
}
.wd-link-entry {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  color: #3a65ff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.wd-link-line {
  margin: 10px 0 0;
  color: #666;
  font-size: 12px;
  line-height: 17px;
}

/* ③ 装卸地址 */
.wd-addr { padding-bottom: 16px; }
.wd-addr-row { display: flex; align-items: flex-start; gap: 12px; }
.wd-badge {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  flex: none;
  border-radius: 4px;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 600;
}
.wd-badge-start { background: #e1e4ec; color: #3a4564; }
.wd-badge-end { background: #3a65ff; color: #fff; }
.wd-addr-text { flex: 1; min-width: 0; }
.wd-addr-city { margin: 0; font-size: 14px; line-height: 18.5px; font-weight: 600; color: #333; }
.wd-addr-detail { margin: 2px 0 0; color: #999; font-size: 12px; line-height: 17px; }
.wd-addr-icon { flex: none; width: 14px; height: 18px; }
.wd-addr-link {
  display: block;
  width: 0;
  height: 26px;
  margin: 2px 0 2px 9px;
  border-left: 3px dotted #e6e6e6;
}

/* ④ 运输进度 */
.wd-progress h3 {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 14px;
  font-weight: 600;
  color: #333;
}
.wd-step {
  display: flex;
  gap: 10px;
  margin-bottom: 13px;
  padding-bottom: 13px;
  border-bottom: 1px solid #f0f2f7;
}
.wd-step.is-last { margin: 0; padding: 0; border: 0; }
.wd-step-state {
  flex: none;
  height: 19px;
  padding: 0 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  line-height: 19px;
}
.step-running { background: #e8f0ff; color: #3a65ff; }
.step-passed { background: #e9f8f1; color: #0f9d64; }
.step-waiting { background: #eef0f5; color: #8a8f99; }
.wd-step-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.wd-step-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin: 0;
}
.wd-step-head b { font-size: 14px; color: #333; }
.wd-step-head time { color: #717c8e; font-size: 11px; }
.wd-step-desc { margin: 0; color: #717c8e; font-size: 11px; line-height: 15px; }
.wd-step-desc.is-active { color: #1a9e64; font-weight: 600; }
.wd-step-extra { margin: 0; color: #a0a8b6; font-size: 10px; }

/* ⑤ 承运信息 */
.wd-vehicle { display: flex; align-items: flex-start; gap: 12px; }
.wd-vehicle-text { flex: 1; min-width: 0; }
.wd-vehicle-text h3 {
  margin: 0;
  font-size: 14px;
  line-height: 14px;
  font-weight: 600;
  color: #333;
}
.wd-vehicle-line { display: flex; gap: 8px; margin: 12px 0 0; font-size: 12px; line-height: 16px; }
.wd-vehicle-line span { color: #999; }
.wd-vehicle-line b { font-weight: 500; color: #333; }
.wd-vehicle-photo {
  position: relative;
  width: 65px;
  height: 86px;
  flex: none;
  margin: 0;
  overflow: hidden;
  border-radius: 6px;
}
.wd-vehicle-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.wd-vehicle-photo figcaption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 22px;
  display: grid;
  place-items: center;
  background: rgba(28, 30, 44, 0.64);
  color: #f9d6ad;
  font-size: 9px;
  white-space: nowrap;
}

/* ⑥ 单据信息 */
.wd-meta { padding: 16px 14px 8px; }
.wd-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 15px;
}
.wd-meta-row > span { flex: none; color: #999; font-size: 13px; }
.wd-meta-row p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  color: #333;
  text-align: right;
}
.wd-copy {
  flex: none;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border: 1px solid #d9dce3;
  border-radius: 4px;
  padding: 0;
  background: #fff;
  cursor: pointer;
}

/* ===== 底部操作栏 ===== */
.wd-actions {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  height: 70px;
  padding: 15px 16px;
  box-sizing: border-box;
  display: flex;
  gap: 10px;
  background: #fff;
  border-top: 1px solid #e2e2e2;
}
.wd-action-ghost {
  flex: 1;
  height: 40px;
  border: 1px solid #d9dce3;
  border-radius: 8px;
  background: #fff;
  color: #333;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.wd-action {
  flex: 1;
  height: 40px;
  border: 0;
  border-radius: 8px;
  background: #3a65ff;
  color: #fff;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
</style>
