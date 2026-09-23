<template>
  <main class="driver-cargo-detail" :class="{ scrolled: isScrolled }" aria-label="货源详情">
    <div class="cargo-detail-scroll" @scroll="handleScroll">
      <section class="cargo-detail-map">
        <img class="cargo-detail-map-image" src="/cargo-detail-map.png" alt="公路运输路线地图">
        <img class="cargo-detail-route" src="/cargo-detail-route.svg" alt="">
        <div class="cargo-detail-point load-point"><span>装货地</span><b>{{ cargo.loadAddress }}</b><i></i></div>
        <div class="cargo-detail-point unload-point"><span>卸货地</span><b>{{ cargo.unloadAddress }}</b><i></i></div>
        <div class="cargo-detail-distance">{{ cargo.routeDistance }}</div>
      </section>

      <section class="cargo-detail-notice">
        <van-icon :name="noticeIcon" />
        <span>{{ noticeText }}</span>
      </section>

      <div class="cargo-detail-panel">
        <section class="cargo-detail-card summary-card">
          <div class="summary-top">
            <strong>{{ cargo.cargoName }} {{ cargo.needWeight }}吨</strong>
            <b class="summary-price">{{ cargo.pricePerTon }}<em>元/吨</em></b>
          </div>
          <div class="summary-time">
            <div><b>{{ loadClock }}</b><span>{{ loadDateLabel }}</span></div>
            <p><i></i><span>{{ durationLabel }}</span><i></i></p>
            <div class="align-right"><b>{{ unloadClock }}</b><span>{{ unloadDateLabel }}</span></div>
          </div>
          <div class="summary-tags">
            <span class="urgent"><van-icon name="underway-o" />{{ countdownLabel }}</span>
            <span>{{ cargo.cargoCategory }}</span>
            <span>{{ cargo.platform }}</span>
            <span>{{ cargo.recommendation }}</span>
          </div>        </section>

        <section class="cargo-detail-card endpoint-card">
          <div class="endpoint-row">
            <em class="start">起</em>
            <p><b>{{ cargo.loadShort }}</b><span>{{ cargo.loadDetail }}</span></p>
            <van-icon name="location-o" />
          </div>
          <div class="endpoint-row">
            <em class="end">终</em>
            <p><b>{{ cargo.unloadShort }}</b><span>{{ cargo.unloadDetail }}</span></p>
            <van-icon name="location-o" />
          </div>
          <p class="requirement-text" :class="{ expanded: requirementExpanded }">{{ cargo.requirement }}</p>
          <button type="button" class="expand-button" @click="requirementExpanded = !requirementExpanded">
            {{ requirementExpanded ? '收起' : '展开更多' }}<van-icon :name="requirementExpanded ? 'arrow-up' : 'arrow-down'" />
          </button>
        </section>

        <section class="cargo-detail-card publisher-card">
          <div class="publisher-main">
            <h3>{{ cargo.publisher }}</h3>
            <div class="info-row"><span>联系人：</span><b>{{ cargo.contact }}</b></div>
            <div class="info-row"><span>联系电话：</span><b>{{ cargo.contactPhone }}</b></div>
            <div class="publisher-tags"><span v-for="tag in cargo.publisherTags" :key="tag">{{ tag }}</span></div>
          </div>
          <button type="button" class="publisher-art" aria-label="查看货主档案" @click="notify('货主档案后续验证')"><van-icon name="shop-o" /><span>货主档案</span></button>
        </section>

        <section class="cargo-detail-card">
          <h2>货源信息</h2>
          <div class="info-row"><span>货源号</span><b>{{ cargo.cargoNo }}</b></div>
          <div class="info-row"><span>上架时间</span><b>{{ listedTime }}</b></div>
        </section>
      </div>
    </div>

    <div class="driver-status" aria-hidden="true"><strong>9:41</strong><span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span></div>

    <header class="cargo-detail-header">
      <button type="button" class="cargo-detail-back" aria-label="返回" @click="emit('back')"><van-icon name="arrow-left" /></button>
      <h1>货源详情</h1>
    </header>

    <footer class="cargo-detail-actions" :class="{ 'without-follow': !followable && !followed }">
      <button v-if="followable" type="button" class="action-follow" :class="{ followed }" @click="toggleFollow">
        <van-icon :name="followed ? 'star' : 'star-o'" />{{ followed ? '已关注' : '关注' }}
      </button>
      <!-- 已失效货源不支持重新激活关注，唯一可做的是移除这条关注记录 -->
      <button v-else-if="followed" type="button" class="action-follow remove" @click="removeFollow">
        <van-icon name="delete-o" />移除记录
      </button>
      <button type="button" class="action-secondary" @click="notify(`正在联系货主 ${cargo.contact}`)">联系货主</button>
      <button v-if="canAccept" type="button" class="action-primary" @click="emit('accept', cargo)">立即接单</button>
      <button v-else type="button" class="action-primary" disabled>{{ closedText }}</button>
    </footer>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { showToast } from 'vant'
import {
  cargoLoadAt,
  cargoUnloadAt,
  cargoExpireReason,
  followCargo,
  isCargoActive,
  isFollowed,
  unfollowCargo,
} from './driver-flow-store.js'
import './driver-flow.css'

const props = defineProps({ cargo: { type: Object, required: true } })
const emit = defineEmits(['back', 'accept'])
const requirementExpanded = ref(false)
const isScrolled = ref(false)
const notify = (message) => showToast(message)

// 顶部返回与标题固定悬浮在地图之上；页面滚动后标题栏加上浅色底，
// 避免白色标题压在白色卡片上不可读。
function handleScroll(event) {
  isScrolled.value = event.target.scrollTop > 120
}

// 装货时间即接单截止时间：超过装货时间或货源失效后不可接单。
// 详情页与接单页提交前各校验一次，防止司机停留期间越界。
const loadAt = computed(() => cargoLoadAt(props.cargo))
const unloadAt = computed(() => cargoUnloadAt(props.cargo))
const canAccept = computed(() => isCargoActive(props.cargo))
const expire = computed(() => cargoExpireReason(props.cargo))

const noticeText = computed(() => {
  if (!canAccept.value) return expire.value ? `${expire.value.title}：${expire.value.detail}` : '该货源当前不可接单'
  return '请核对货源信息，确认后可接单'
})
const noticeIcon = computed(() => (canAccept.value ? 'volume-o' : 'warning-o'))

const pad = (n) => String(n).padStart(2, '0')
const clockOf = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`
const loadClock = computed(() => clockOf(loadAt.value))
const unloadClock = computed(() => clockOf(unloadAt.value))

// 日期标签：设计稿在时刻下方显示「04月17日 周五」这类完整日期
const weekOf = (date) => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
const dateLabel = (date) => `${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 ${weekOf(date)}`
const loadDateLabel = computed(() => dateLabel(loadAt.value))
const unloadDateLabel = computed(() => dateLabel(unloadAt.value))

// 运输时长：由装货到卸货的时刻差推得，跨天时标注天数
const durationLabel = computed(() => {
  const hours = Math.round(((unloadAt.value - loadAt.value) / 3600000) * 10) / 10
  return hours >= 24 ? `共 ${Math.round(hours / 24)} 天` : `共 ${hours} 小时`
})

// 距装货倒计时：已过装货时间即不可接单，不再显示「可立即装货」；
// 其他失效原因（已接满 / 已取消 / 已下架）直接显示失效原因，避免「已接满」的货源还在倒计时。
const countdownLabel = computed(() => {
  if (!canAccept.value) return expire.value ? expire.value.title : '不可接单'
  const minutes = Math.round((loadAt.value.getTime() - Date.now()) / 60000)
  if (minutes < 60) return `距装货 ${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `距装货 ${hours} 小时`
  return `距装货 ${Math.floor(hours / 24)} 天`
})

// 关注：司机看完详情才决定是否跟单，入口放在详情页底部。
// 只对当前可接单的货源展示：已失效货源不支持重新激活关注，其移除记录在关注列表内完成。
const followed = computed(() => isFollowed(props.cargo.id))
const followable = computed(() => canAccept.value)
const closedText = computed(() => (expire.value ? expire.value.title : '不可接单'))
function toggleFollow() {
  if (followed.value) {
    unfollowCargo(props.cargo.id)
    notify('已取消关注')
    return
  }
  followCargo(props.cargo)
  notify('已关注，可在「关注货源」中持续跟进')
}

// 已失效货源不支持重新激活关注，只能移除这条关注记录
function removeFollow() {
  unfollowCargo(props.cargo.id)
  notify('已移除该关注记录')
}

// 创建与上架时间：司机关心的是「货源什么时候开始可接」，只展示上架时间这一个真实时点。
// 数据来自 cargoSourceCatalog.listedAt，不再由页面现场拼当前日期——否则列表的相对时间
// 与详情绝对时间对不上。创建时间/后台发布时间对司机无决策价值，不展示。
const listedTime = computed(() => {
  const raw = props.cargo.listedAt || ''
  if (!raw) return ''
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})/)
  if (!m) return raw
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:00`
})
</script>
