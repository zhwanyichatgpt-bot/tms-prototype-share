<template>
  <div class="cd-page" :class="{ 'is-no-action': !cargo.action }" aria-label="货源详情">
    <div class="cd-scroll">
      <!-- 地图区：底图按东南沿海场景，装/卸点与路线按底图实际地理方位标注 -->
      <div class="cd-map">
        <img class="cd-map-img" src="/cargo-detail-map.png" alt="" />

        <svg class="cd-route" viewBox="0 0 375 438" aria-hidden="true">
          <path class="cd-route-glow" :d="routePath" />
          <path class="cd-route-line" :d="routePath" />
        </svg>

        <div class="cd-point" :style="pointStyle('load')">
          <span class="cd-point-badge cd-badge-load">装货点</span>
          <span class="cd-point-card">{{ cargo.loadCity }}<i aria-hidden="true">‹</i></span>
        </div>
        <span class="cd-pin cd-pin-load" :style="pinStyle('load')" aria-hidden="true"></span>

        <div class="cd-point" :style="pointStyle('unload')">
          <span class="cd-point-badge cd-badge-unload">卸货点</span>
          <span class="cd-point-card">{{ cargo.unloadCity }}<i aria-hidden="true">‹</i></span>
        </div>
        <span class="cd-pin cd-pin-unload" :style="pinStyle('unload')" aria-hidden="true"></span>

        <span class="cd-distance" :style="distanceStyle">{{ cargo.routeDistance }}</span>

        <div class="cd-fade" aria-hidden="true"></div>
        <p class="cd-notice"><i aria-hidden="true"></i>{{ noticeText }}</p>
      </div>

      <div class="cd-status">
        <span class="cd-status-time">9:41</span>
        <span class="cd-status-icons" aria-hidden="true">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
          <span class="battery"></span>
        </span>
      </div>

      <header class="cd-nav">
        <button type="button" class="cd-back" aria-label="返回货源列表" @click="emit('back')">
          <svg width="9" height="17" viewBox="0 0 10 18" fill="none"><path d="M8.6 1L1.4 9L8.6 17" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <h1>货源详情</h1>
        <span class="cd-nav-hold" aria-hidden="true"></span>
      </header>

      <div class="cd-body">
        <!-- ① 货源主卡：货品货量、装卸时间、关键标签、参考运费 -->
        <section class="cd-card cd-main">
          <div class="cd-main-head">
            <h2>{{ cargo.cargo }} <b>{{ cargo.weight }}</b></h2>
            <p class="cd-price"><i>¥</i>{{ cargo.price }}</p>
          </div>

          <div class="cd-time-row">
            <div class="cd-time">
              <strong>{{ loadTime.time }}</strong>
              <span>{{ loadTime.date }}</span>
            </div>
            <div class="cd-duration">
              <i aria-hidden="true"></i>
              <em>{{ cargo.duration }}</em>
              <i aria-hidden="true"></i>
            </div>
            <div class="cd-time cd-time-right">
              <strong>{{ unloadTime.time }}</strong>
              <span>{{ unloadTime.date }}</span>
            </div>
          </div>

          <div class="cd-tags">
            <span v-if="cargo.loadCountdown" class="cd-tag cd-tag-warn">{{ cargo.loadCountdown }}</span>
            <span class="cd-tag cd-tag-plain">{{ cargo.cargoCategory }}</span>
            <span class="cd-tag cd-tag-plain">运费 {{ cargo.unitPrice }}</span>
          </div>
        </section>

        <!-- ② 承接进展：货源由多台车分运，这里只表达总量与按平台承接情况，具体车辆在关联运单里 -->
        <section class="cd-card cd-claim annot-zhiyunShipperHome-rule-cargo-shared-quantity">
          <div class="cd-claim-head">
            <h3>承接进展</h3>
            <span>{{ claimSummary.note }}</span>
          </div>

          <template v-if="cargoWaybills.length">
            <div class="cd-claim-bar">
              <p class="cd-claim-nums">
                <b>{{ claimSummary.claimed }}</b> 吨<span>／需求 {{ cargo.weightNum }} 吨</span>
                <em>已接 {{ claimSummary.claimed }}/{{ cargo.weightNum }} 吨</em>
              </p>
              <span class="cd-track"><i :style="{ width: `${claimSummary.percent}%` }"></i></span>
            </div>

            <ul class="cd-platform">
              <li v-for="item in platformGroups" :key="item.platform">
                <span>{{ item.platform }}</span>
                <b>{{ item.tons }} 吨</b>
                <em>{{ item.count }} 单</em>
              </li>
            </ul>

            <button type="button" class="cd-waybill-entry" @click="waybillSheet = true">
              查看关联运单（{{ cargoWaybills.length }}）
              <svg width="8" height="13" viewBox="0 0 9 14" fill="none"><path d="M1.5 1l6 6-6 6" stroke="#8a91a1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </template>

          <p v-else class="cd-claim-empty">{{ claimEmptyNote }}</p>
        </section>

        <!-- ③ 装卸地址卡 -->
        <section class="cd-card cd-addr">
          <div class="cd-addr-row">
            <span class="cd-badge cd-badge-start">起</span>
            <div class="cd-addr-text">
              <p class="cd-addr-city">{{ cargo.loadCity }}</p>
              <p class="cd-addr-detail">{{ cargo.loadDetail }}</p>
            </div>
            <span class="cd-addr-pin" aria-hidden="true">
              <svg width="14" height="18" viewBox="0 0 14 18" fill="none"><path d="M7 0C3.1 0 0 3.1 0 7c0 5.2 7 11 7 11s7-5.8 7-11c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 7 4.5a2.5 2.5 0 0 1 0 5z" fill="#d4d4d4"/></svg>
            </span>
          </div>

          <span class="cd-addr-link" aria-hidden="true"></span>

          <div class="cd-addr-row">
            <span class="cd-badge cd-badge-end">终</span>
            <div class="cd-addr-text">
              <p class="cd-addr-city">{{ cargo.unloadCity }}</p>
              <p class="cd-addr-detail">{{ cargo.unloadDetail }}</p>
            </div>
            <span class="cd-addr-pin" aria-hidden="true">
              <svg width="14" height="18" viewBox="0 0 14 18" fill="none"><path d="M7 0C3.1 0 0 3.1 0 7c0 5.2 7 11 7 11s7-5.8 7-11c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 7 4.5a2.5 2.5 0 0 1 0 5z" fill="#d4d4d4"/></svg>
            </span>
          </div>

          <div class="cd-requirement">
            <p :class="{ 'is-collapsed': !requirementOpen }">{{ cargo.requirement }}</p>
            <button type="button" class="cd-more" @click="requirementOpen = !requirementOpen">
              {{ requirementOpen ? '收起' : '展开更多' }}
              <svg :class="{ 'is-open': requirementOpen }" width="11" height="7" viewBox="0 0 11 7" fill="none"><path d="M1 1l4.5 4.5L10 1" stroke="#8a91a1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </section>

        <!-- ④ 货源档案：状态不同，展示的时间字段不同 -->
        <section class="cd-card cd-meta">
          <div v-for="row in metaRows" :key="row.label" class="cd-meta-row">
            <span>{{ row.label }}</span>
            <p>
              {{ row.value }}
              <button v-if="row.copyable" type="button" class="cd-copy" aria-label="复制货源号" @click="copyCargoNo">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="9" height="9" rx="1.4" stroke="#bcbcbc" stroke-width="1.2"/><path d="M9.5 2.6V2a1.4 1.4 0 0 0-1.4-1.4H2.2A1.4 1.4 0 0 0 .8 2v5.9a1.4 1.4 0 0 0 1.4 1.4h.6" stroke="#bcbcbc" stroke-width="1.2" stroke-linecap="round"/></svg>
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>

    <div v-if="cargo.action" class="cd-actions">
      <button type="button" :class="actionClass" @click="handleAction">{{ cargo.action }}</button>
    </div>

    <!-- 关联运单：一票货源的多张运单，从这里下钻到运单详情 -->
    <div v-if="waybillSheet" class="cd-sheet-mask" data-annotation-container="drawer" @click.self="waybillSheet = false">
      <section class="cd-sheet" data-annotation-content="drawer">
        <header>
          <h2>关联运单（{{ cargoWaybills.length }}）</h2>
          <button type="button" aria-label="关闭" @click="waybillSheet = false">×</button>
        </header>

        <p class="cd-sheet-summary">
          已承运 <b>{{ claimSummary.claimed }}</b> 吨 / 共 {{ cargo.weightNum }} 吨<span>．</span>剩余 {{ claimSummary.remain }} 吨
        </p>

        <ul class="cd-waybills annot-zhiyunShipperHome-rule-cargo-related-waybills">
          <li v-for="item in cargoWaybills" :key="item.id" class="cd-waybill">
            <div class="cd-waybill-top">
              <strong>{{ item.number }}</strong>
              <span class="cd-wb-state" :class="`wb-${item.statusType}`">{{ item.status }}</span>
            </div>
            <p class="cd-waybill-vehicle">
              {{ item.plate }} · {{ item.vehicleType }} · {{ item.driver }}
              <em>{{ item.tons }} 吨</em>
            </p>
            <p class="cd-waybill-platform">承接平台 · {{ item.platform }}</p>
            <button type="button" class="cd-waybill-link" @click="openWaybill(item)">
              查看运单详情
              <svg width="7" height="12" viewBox="0 0 9 14" fill="none"><path d="M1.5 1l6 6-6 6" stroke="#3a65ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { waybillsOfCargo } from './mock-data.js'

const props = defineProps({ cargo: { type: Object, required: true } })
const emit = defineEmits(['back', 'changed', 'open-waybill', 'resume-publish'])

const requirementOpen = ref(false)
const waybillSheet = ref(false)

/* 运单与货源分开维护，按 cargoId 取本票货源下的全部运单 */
const cargoWaybills = computed(() => waybillsOfCargo(props.cargo.id))

/* 时间文案按「04月17日 周五 09:24」拆成日期与时刻两行，列表只用日期部分 */
const splitDateTime = (value = '') => {
  const parts = value.split(' ')
  const time = parts.length > 2 ? parts[parts.length - 1] : ''
  const date = parts.slice(0, parts.length > 2 ? -1 : undefined).join(' ')
  return { date, time }
}
const loadTime = computed(() => splitDateTime(props.cargo.loadDate))
const unloadTime = computed(() => splitDateTime(props.cargo.unloadDate))

/* 各状态下的顶部提示，与列表状态和底部操作保持同一口径 */
const noticeText = computed(() => ({
  draft: '货源尚未发布，核对信息后继续发布',
  pending: '货源已发布，平台正在为你匹配运力',
  matched: '司机已接单，运输进行中',
  completed: '运输已完成，可查看关联运单',
  cancelled: '货源已取消，可重新发布',
}[props.cargo.stateType] || ''))

/* 承接进展：货源按吨组织，由多台车分运；接单占用额度，装货后按实际释放差额 */
const claimSummary = computed(() => {
  const total = props.cargo.weightNum || 0
  const claimed = cargoWaybills.value.reduce((sum, item) => sum + item.tons, 0)
  const remain = Math.max(total - claimed, 0)
  const percent = total ? Math.min(Math.round((claimed / total) * 100), 100) : 0
  const note = props.cargo.stateType === 'completed'
    ? '已全部承运'
    : remain === 0
      ? '已全部接单，无需扩大发布'
      : `待承接 ${remain} 吨`
  return { total, claimed, remain, percent, note }
})

/* 按平台汇总承接量：结算粒度＝货源×平台，这里先给出货量分布 */
const platformGroups = computed(() => {
  const map = new Map()
  cargoWaybills.value.forEach((item) => {
    const entry = map.get(item.platform) || { platform: item.platform, tons: 0, count: 0 }
    entry.tons += item.tons
    entry.count += 1
    map.set(item.platform, entry)
  })
  return [...map.values()]
})

const claimEmptyNote = computed(() => (
  props.cargo.stateType === 'cancelled'
    ? '货源已取消，重新发布后由平台按线路匹配运力'
    : '发布后由平台按线路与货品匹配运力，接单情况会在这里更新'
))

/* 时间字段随状态变化：未上架不显示上架时间，已完成补完成时间 */
const metaRows = computed(() => {
  const rows = [{ label: '货源号', value: props.cargo.cargoNo, copyable: true }]
  rows.push({ label: '发布人', value: `${props.cargo.publisher}（${props.cargo.publisherPhone}）` })
  rows.push({ label: '创建时间', value: props.cargo.createdAt })
  if (props.cargo.listedAt) rows.push({ label: '上架时间', value: props.cargo.listedAt })
  if (props.cargo.stateType === 'completed') rows.push({ label: '完成时间', value: props.cargo.stateDate.replace(/^2026年/, '2026-') })
  return rows
})

const actionClass = computed(() => (props.cargo.action === '取消货源' ? 'cd-action cd-action-ghost' : 'cd-action'))

/* 「继续发布」不在这里直接改状态：发布动作唯一，交回发布流程完成核对与选平台 */
const handleAction = () => {
  if (props.cargo.action === '继续发布') {
    emit('resume-publish', props.cargo)
    return
  }
  if (props.cargo.action === '取消货源') {
    props.cargo.state = '已取消'
    props.cargo.stateType = 'cancelled'
    props.cargo.stateDate = '2026年4月15日 取消'
    props.cargo.action = '重新发布'
    toToast('货源已取消')
    emit('changed')
    return
  }
  props.cargo.state = '待接单'
  props.cargo.stateType = 'pending'
  props.cargo.stateDate = '2026年4月15日 发布'
  props.cargo.listedAt = '2026-04-15 08:00:00'
  props.cargo.action = '取消货源'
  toToast('货源已重新发布，平台正在匹配运力')
  emit('changed')
}

const copyCargoNo = () => {
  try {
    window.navigator?.clipboard?.writeText(props.cargo.cargoNo)
  } catch { /* 剪贴板不可用时仍给出提示 */ }
  toToast('货源号已复制')
}

/* 运单详情页尚未建立，先把跳转对象交给外层，避免弹窗里的按钮点了没反应 */
/* 下钻到运单详情：先收起弹层，避免返回时残留 */
const openWaybill = (waybill) => {
  waybillSheet.value = false
  emit('open-waybill', waybill)
}

const toToast = (message) => {
  if (typeof window !== 'undefined' && window.sharedStorage && window.sharedStorage.toast) {
    window.sharedStorage.toast(message)
  }
}

/* ===== 地图标注：点位来自 Mock 数据，标签与里程按点位相对位置排布 ===== */
const MAP_W = 375
const MAP_H = 438
const MAP_PAD = 8
const CARD_W = 182
const PIN_R = 10
const LABEL_H = 62

const pins = computed(() => props.cargo.map)

/* 路线弧线：控制点沿装卸点连线法向偏移，形成设计稿的弧线走向 */
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

/* 标签卡一律贴在点位上方，与设计稿一致；左右做夹取避免超出地图边缘 */
const pointStyle = (key) => {
  const point = pins.value[key]
  const left = clamp(point.x - CARD_W / 2 + PIN_R, MAP_PAD, MAP_W - CARD_W - MAP_PAD)
  const top = clamp(point.y - PIN_R - 8 - LABEL_H, MAP_PAD, MAP_H - LABEL_H - MAP_PAD)
  return { left: `${left}px`, top: `${top}px` }
}

/* 里程标签落在两张点位标签之间的空档里，再沿连线略向右让开路线本身 */
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
.cd-page {
  position: absolute;
  inset: 0;
  z-index: 100;
  overflow: hidden;
  background: #eef0f5;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.cd-scroll {
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
.cd-scroll::-webkit-scrollbar { display: none; }
.cd-page.is-no-action .cd-scroll { bottom: 0; }

/* ===== 地图区 ===== */
.cd-map {
  position: relative;
  height: 438px;
  overflow: hidden;
  background: #e9f1fb;
}
.cd-map-img {
  position: absolute;
  inset: 0;
  width: 375px;
  height: 438px;
  object-fit: cover;
}

.cd-route {
  position: absolute;
  inset: 0;
  width: 375px;
  height: 438px;
}
.cd-route-glow {
  fill: none;
  stroke: #3a65ff;
  stroke-width: 8;
  stroke-linecap: round;
  opacity: 0.28;
  filter: blur(3px);
}
.cd-route-line {
  fill: none;
  stroke: #3a65ff;
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-dasharray: 7 6;
}

.cd-pin {
  position: absolute;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(28, 60, 140, 0.35);
}
.cd-pin-load { background: #3a65ff; }
.cd-pin-unload { background: #34c7a9; }

.cd-point {
  position: absolute;
  width: 182px;
  display: flex;
  flex-direction: column;
}
.cd-point-badge {
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
.cd-badge-load { background: #3a65ff; }
.cd-badge-unload { background: #34c7a9; }
.cd-point-card {
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
.cd-point-card i {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #9aa3b3;
  font-size: 14px;
  font-style: normal;
}

.cd-distance {
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

/* 地图下沿过渡层，衔接页面底色 */
.cd-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 80px;
  background: linear-gradient(180deg, #ebf3fe, #eef0f5);
}
.cd-notice {
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
.cd-notice i {
  width: 11px;
  height: 13px;
  flex: none;
  background: #77808f;
  clip-path: polygon(0 0, 55% 22%, 100% 0, 100% 100%, 0 100%);
}

/* ===== 状态栏与导航 ===== */
.cd-status {
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
.cd-status-time { font-size: 15px; font-weight: 700; }
.cd-status-icons { display: flex; align-items: center; gap: 5px; }
.battery {
  position: relative;
  width: 21px;
  height: 10px;
  border: 1px solid #111;
  border-radius: 2px;
  background: #111;
  box-shadow: inset 0 0 0 2px #eef2f8;
}

.cd-nav {
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
.cd-back {
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
.cd-nav h1 {
  flex: 1;
  margin: 0;
  font-size: 18px;
  line-height: 25px;
  font-weight: 600;
  color: #333;
}
.cd-nav-hold { width: 32px; }

/* ===== 内容区 ===== */
.cd-body {
  position: relative;
  z-index: 2;
  margin-top: -32px;
  padding: 0 15px 16px;
}

.cd-card {
  margin-bottom: 10px;
  padding: 16px 14px;
  border-radius: 12px;
  background: #fff;
}

/* ① 货源主卡 */
.cd-main { padding-bottom: 14px; }
.cd-main-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.cd-main-head h2 {
  margin: 0;
  font-size: 16px;
  line-height: 21px;
  font-weight: 600;
  color: #333;
}
.cd-main-head h2 b { font-weight: 600; }
.cd-price {
  display: flex;
  align-items: baseline;
  margin: 0;
  color: #3a65ff;
  font-size: 18px;
  line-height: 19px;
  font-weight: 700;
  white-space: nowrap;
}
.cd-price i { margin-right: 2px; font-size: 10px; font-style: normal; }

.cd-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 14px;
}
.cd-time { display: flex; flex-direction: column; }
.cd-time-right { align-items: flex-end; }
.cd-time strong {
  font-size: 26px;
  line-height: 28px;
  font-weight: 700;
  color: #333;
}
.cd-time span {
  margin-top: 5px;
  color: #a1a1a1;
  font-size: 12px;
}
.cd-duration {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 14px;
}
.cd-duration i {
  width: 24px;
  height: 2px;
  background: linear-gradient(90deg, rgba(166, 166, 166, 0), #a6a6a6);
}
.cd-duration i:last-child { background: linear-gradient(90deg, #a6a6a6, rgba(166, 166, 166, 0)); }
.cd-duration em {
  padding: 3px 9px;
  border: 1px solid #a6a6a6;
  border-radius: 11px;
  color: #999;
  font-size: 10px;
  font-style: normal;
  white-space: nowrap;
}

.cd-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.cd-tag {
  height: 18px;
  padding: 0 8px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  white-space: nowrap;
}
.cd-tag-warn { background: #f9efd7; color: #784f21; }
.cd-tag-plain { border: 1px solid #b8c2e6; color: #808cb6; }
.cd-tag-blue { background: #eff3ff; color: #27419c; }

/* ② 承接进展 */
.cd-claim-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.cd-claim-head h3 {
  margin: 0;
  font-size: 14px;
  line-height: 14px;
  font-weight: 600;
  color: #333;
}
.cd-claim-head > span {
  color: #3a65ff;
  font-size: 11px;
}
.cd-claim-bar { margin-top: 14px; }
.cd-claim-nums {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 0;
  font-size: 12px;
  color: #666;
}
.cd-claim-nums b {
  color: #3a65ff;
  font-size: 20px;
  line-height: 22px;
  font-weight: 700;
}
.cd-claim-nums span { color: #999; }
.cd-claim-nums em {
  margin-left: auto;
  color: #999;
  font-size: 11px;
  font-style: normal;
}
.cd-track {
  display: block;
  height: 6px;
  margin-top: 9px;
  overflow: hidden;
  border-radius: 3px;
  background: #e8e9ed;
}
.cd-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #3a65ff;
}

.cd-platform {
  margin: 13px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid #eef1f6;
}
.cd-platform li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 0;
  font-size: 12px;
  color: #333;
}
.cd-platform li + li { border-top: 1px solid #f4f6fa; }
.cd-platform b { margin-left: auto; font-weight: 600; }
.cd-platform em {
  min-width: 34px;
  text-align: right;
  color: #999;
  font-size: 11px;
  font-style: normal;
}

.cd-waybill-entry {
  width: 100%;
  height: 40px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #d9dce3;
  border-radius: 9px;
  background: #fff;
  color: #333;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.cd-claim-empty {
  margin: 12px 0 0;
  color: #999;
  font-size: 12px;
  line-height: 17px;
}

/* ③ 装卸地址 */
.cd-addr { padding-bottom: 14px; }
.cd-addr-row { display: flex; align-items: flex-start; gap: 12px; }
.cd-badge {
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
.cd-badge-start { background: #e1e4ec; color: #3a4564; }
.cd-badge-end { background: #3a65ff; color: #fff; }
.cd-addr-text { flex: 1; min-width: 0; }
.cd-addr-city {
  margin: 0;
  font-size: 14px;
  line-height: 18.5px;
  font-weight: 600;
  color: #333;
}
.cd-addr-detail {
  margin: 2px 0 0;
  color: #999;
  font-size: 12px;
  line-height: 17px;
}
.cd-addr-pin { flex: none; width: 14px; height: 18px; }
.cd-addr-link {
  display: block;
  width: 0;
  height: 26px;
  margin: 2px 0 2px 9px;
  border-left: 3px dotted #e6e6e6;
}

.cd-requirement {
  margin-top: 12px;
  padding: 10px 10px 2px;
  border-radius: 8px;
  background: #f8f8fb;
}
.cd-requirement p {
  margin: 0;
  color: #333;
  font-size: 12px;
  line-height: 17px;
}
.cd-requirement p.is-collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cd-more {
  width: 100%;
  height: 30px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 0;
  background: none;
  color: #8a91a1;
  font-size: 12px;
  cursor: pointer;
}
.cd-more svg { transition: transform 0.2s; }
.cd-more svg.is-open { transform: rotate(180deg); }

/* ④ 货源档案 */
.cd-meta { padding: 16px 14px 8px; }
.cd-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 15px;
}
.cd-meta-row > span {
  flex: none;
  color: #999;
  font-size: 14px;
}
.cd-meta-row p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  color: #333;
  text-align: right;
}
.cd-copy {
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
.cd-actions {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  height: 70px;
  padding: 15px 24px;
  box-sizing: border-box;
  background: #fff;
  border-top: 1px solid #e2e2e2;
}
.cd-action {
  width: 100%;
  height: 40px;
  border: 0;
  border-radius: 8px;
  background: #3a65ff;
  color: #fff;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.cd-action-ghost {
  border: 1px solid #d9dce3;
  background: #fff;
  color: #333;
}

/* ===== 关联运单弹层 ===== */
.cd-sheet-mask {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  background: rgba(20, 25, 35, 0.42);
}
.cd-sheet {
  width: 100%;
  max-height: 78%;
  overflow-y: auto;
  padding: 0 18px 20px;
  border-radius: 16px 16px 0 0;
  background: #fff;
  color: #333;
  scrollbar-width: none;
}
.cd-sheet::-webkit-scrollbar { display: none; }
.cd-sheet header {
  position: sticky;
  top: 0;
  z-index: 2;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
  background: #fff;
}
.cd-sheet h2 {
  margin: 0;
  font-size: 16px;
  line-height: 21px;
  font-weight: 500;
}
.cd-sheet header button {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #999;
  font-size: 26px;
  line-height: 32px;
  font-weight: 300;
  cursor: pointer;
}
.cd-sheet-summary {
  margin: 14px 0 0;
  color: #666;
  font-size: 12px;
}
.cd-sheet-summary b {
  color: #3a65ff;
  font-size: 15px;
  font-weight: 700;
}
.cd-sheet-summary span { margin: 0 4px; color: #ccc; }

.cd-waybills {
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}
.cd-waybill {
  padding: 14px 0 12px;
  border-bottom: 1px solid #f1f3f7;
}
.cd-waybill:last-child { border-bottom: 0; }
.cd-waybill-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.cd-waybill-top strong {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.cd-wb-state {
  height: 20px;
  padding: 0 8px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  font-size: 10px;
}
.wb-done { background: #eef7f3; color: #20ad82; }
.wb-moving { background: #eef3ff; color: #3a65ff; }
.wb-loaded { background: #f9efd7; color: #784f21; }
.cd-waybill-vehicle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 9px 0 0;
  color: #555;
  font-size: 12px;
}
.cd-waybill-vehicle em {
  margin-left: auto;
  color: #333;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
}
.cd-waybill-platform {
  margin: 5px 0 0;
  color: #999;
  font-size: 11px;
}
.cd-waybill-link {
  margin-top: 9px;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: none;
  color: #3a65ff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
</style>
