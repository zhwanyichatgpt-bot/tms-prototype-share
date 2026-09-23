<template>
  <main ref="pageRoot" class="driver-work-page" :aria-label="isRunPage ? '跑货' : '运单'">
    <div class="driver-status" aria-hidden="true">
      <strong>9:41</strong>
      <span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span>
    </div>

    <template v-if="isRunPage">
      <header class="work-title-header">
        <h1>运输跟踪<i class="title-check"></i></h1>
      </header>

      <div class="work-scroll run-scroll">
        <section class="tracking-map-card" aria-label="运输跟踪地图">
          <img src="/shipowner-run-map.png" alt="福州公路运输跟踪地图">
          <button type="button" class="map-full-button" aria-label="全屏查看地图" @click="notify('全屏运输地图后续验证')"><van-icon name="enlarge" /></button>
          <div v-if="!activeTracking" class="tracking-empty">
            <div class="tracking-empty-icon"><van-icon name="logistics" /></div>
            <p>暂无运输中</p>
            <small>您已接的运输任务将在开始运输后显示路线</small>
          </div>
          <template v-else>
            <div class="tracking-route-layer" aria-hidden="true">
              <svg class="tracking-route-line" viewBox="0 0 343 256.5" preserveAspectRatio="none">
                <path d="M67 108 C90 112 110 124 128 125 C146 128 168 136 186 138 C204 137 218 122 226 106 C238 84 246 66 262 62 C288 55 312 48 330 44" fill="none" stroke="#3a65ff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M67 108 C60 118 56 132 58 146 C64 168 84 186 108 196 C132 206 160 208 186 202" fill="none" stroke="#a9befb" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity=".85" />
              </svg>
              <span class="tracking-port-tag">装货地</span>
              <span class="tracking-port-card">{{ activeTracking.loadShort }}</span>
              <span class="tracking-route-dot load"></span>
            </div>
            <div class="track-progress-panel" aria-label="运输进度">
              <strong>已行驶 {{ activeTracking.percent }}%，{{ activeTracking.hint }}</strong>
              <button type="button" class="track-progress-more" aria-label="查看运输详情" @click="notify('运输详情后续验证')"><van-icon name="arrow" /></button>
            </div>
          </template>
        </section>

        <!-- 设计稿：首张在途运单卡上移覆盖地图下缘 -->
        <div v-if="activeTracking" class="work-current-card">
          <WaybillCard :item="activeTracking.waybill" @open="openWaybill" @copy="copyNo" @voucher="addVoucher" />
        </div>

        <div class="work-section-head">
          <span>我已接的<i class="section-check"></i></span>
          <button type="button" @click="emit('navigate', 'order')">运单中心<van-icon name="arrow" /></button>
        </div>

        <section class="work-card-list" aria-label="已接运输任务">
          <WaybillCard v-for="item in runningWaybills" :key="item.id" :item="item" @open="openWaybill" @copy="copyNo" @voucher="addVoucher" />
          <div v-if="runningWaybills.length === 0" class="work-empty"><van-icon name="orders-o" /><p>暂无已接运输任务</p></div>
        </section>
      </div>
    </template>

    <template v-else>
      <header class="waybill-header">
        <div class="waybill-title"><h1>运单</h1><i></i></div>
        <nav class="waybill-mode" aria-label="运输结算切换">
          <button type="button" :class="{ active: mode === 'transport' }" @click="mode = 'transport'">运输</button>
          <button type="button" :class="{ active: mode === 'settle' }" @click="mode = 'settle'">结算</button>
        </nav>
      </header>

      <template v-if="mode === 'transport'">
        <div class="waybill-search-row">
          <label class="waybill-search"><van-icon name="search" /><input v-model="keyword" placeholder="请输入运单号" aria-label="搜索运单号"></label>
          <button type="button" class="filter-button" @click="notify('更多筛选条件后续验证')">筛选<van-icon name="arrow-down" /></button>
        </div>

        <div class="status-filter" aria-label="运单状态筛选">
          <button v-for="item in statusOptions" :key="item.value" type="button" :class="{ active: statusFilter === item.value }" @click="statusFilter = item.value">{{ item.label }}</button>
        </div>

        <section class="waybill-list" aria-label="运单列表">
          <WaybillCard v-for="item in filteredWaybills" :key="item.id" :item="item" @open="openWaybill" @copy="copyNo" @voucher="addVoucher" />
          <div v-if="filteredWaybills.length === 0" class="work-empty"><van-icon name="search" /><p>暂无符合条件的运单</p></div>
        </section>
      </template>

      <section v-else class="settlement-empty"><van-icon name="balance-o" /><p>暂无待结算运单</p><small>已完成并审核通过的运单将在这里结算</small></section>
    </template>

    <nav class="driver-bottom-nav" aria-label="司机端主导航">
      <img class="driver-tab-bg-top" src="/zhiyun-mobile-assets/icons/tab-band-top.svg" alt="">
      <img class="driver-tab-bg-bottom" src="/zhiyun-mobile-assets/icons/tab-band-bottom.svg" alt="">
      <img class="driver-tab-glass" src="/zhiyun-mobile-assets/icons/tab-glass-band.svg" alt="">
      <button v-for="tab in bottomTabs" :key="tab.key" type="button" class="driver-tab-item" :class="[`driver-tab-${tab.key}`, { active: activeTab === tab.key }]" :aria-current="activeTab === tab.key ? 'page' : undefined" @click="emit('navigate', tab.key)">
        <template v-if="tab.key === 'assistant'">
          <img class="driver-tab-ai-image" src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt=""><span>{{ tab.label }}</span>
        </template>
        <template v-else>
          <img class="driver-tab-icon" :src="tab.icon" alt=""><span>{{ tab.label }}</span>
        </template>
      </button>
    </nav>

  </main>
</template>

<script setup>
import { computed, defineComponent, h, ref } from 'vue'
import { showToast } from 'vant'
import { bottomTabs, roadWaybills } from './mock-data.js'
import { driverFlowStore, waybillStatusMeta } from './driver-flow-store.js'
import './driver-work.css'

const props = defineProps({ page: { type: String, required: true } })
const emit = defineEmits(['navigate', 'open-waybill'])
const pageRoot = ref(null)
const mode = ref('transport')
const keyword = ref('')
const statusFilter = ref('all')
const isRunPage = computed(() => props.page === 'run')
const activeTab = computed(() => isRunPage.value ? 'run' : 'order')
const statusOptions = [
  { label: '全部', value: 'all' }, { label: '运输中', value: 'transporting' },
  { label: '已送达', value: 'delivered' },
  { label: '已取消', value: 'cancelled' },
]

// 闭环新增的运单（本次会话接单产生）与静态历史运单合并展示。
// 闭环运单的运输/卸货状态归入「运输中」当量，结算完成后归入「已送达」。
const flowWaybills = computed(() => driverFlowStore.waybills.map((wb) => ({
  ...wb,
  statusText: waybillStatusMeta[wb.status]?.text || wb.status,
  listStatus: ['loading', 'transporting', 'unloading', 'accounting'].includes(wb.status) ? 'transporting' : 'delivered',
  canVoucher: ['loading', 'transporting', 'unloading'].includes(wb.status),
})))

const allWaybills = computed(() => [...flowWaybills.value, ...roadWaybills])

const filteredWaybills = computed(() => allWaybills.value.filter((item) => {
  const itemStatus = item.listStatus || item.status
  const matchesStatus = statusFilter.value === 'all' || itemStatus === statusFilter.value
  const target = `${item.waybillNo}${item.cargoName}${item.origin}${item.destination}`.toLowerCase()
  return matchesStatus && target.includes(keyword.value.trim().toLowerCase())
}))

// 跑货页只展示在途中的运单：装货中、运输中、待收货确认。
// 静态历史运单与本次会话接单产生的运单合并，保证刷新后页面仍有在途内容。
const runningWaybills = computed(() => {
  const flowRunning = flowWaybills.value.filter((item) => ['loading', 'transporting', 'unloading'].includes(item.status))
  const staticRunning = roadWaybills.filter((item) => ['loading', 'transporting', 'unloading'].includes(item.status))
  return [...flowRunning, ...staticRunning]
})

// 运输进度按状态推演：装货 0%、运输中按在途比例、待收货确认为 100%。
// 原型无实时轨迹，用状态映射稳定呈现在途感，不伪造里程数据。
const activeTracking = computed(() => {
  const current = runningWaybills.value[0]
  if (!current) return null
  const base = { waybill: current, loadShort: current.originShort || current.origin }
  if (current.status === 'transporting') return { ...base, percent: 30, hint: `预计${current.timeValue}到达卸货地` }
  if (current.status === 'unloading') return { ...base, percent: 100, hint: '已到达卸货地，等待收货确认' }
  return { ...base, percent: 0, hint: `请于 ${current.timeValue} 前完成装货` }
})
const notify = (message) => showToast(message)
const copyNo = (no) => showToast(`已复制运单号：${no}`)
const addVoucher = (item) => showToast(`补录凭证：${item.waybillNo}`)
const openWaybill = (item) => emit('open-waybill', item)

const WaybillCard = defineComponent({
  props: { item: { type: Object, required: true } },
  emits: ['open', 'copy', 'voucher'],
  setup(cardProps, { emit: cardEmit }) {
    return () => h('article', { class: 'work-waybill-card', onClick: () => cardEmit('open', cardProps.item) }, [
      h('div', { class: 'work-card-head' }, [
        h('span', { class: ['work-status', `status-${cardProps.item.listStatus || cardProps.item.status}`] }, cardProps.item.statusText),
        h('span', { class: 'work-waybill-no' }, cardProps.item.waybillNo),
        h('button', { class: 'work-copy', type: 'button', 'aria-label': '复制运单号', onClick: (event) => { event.stopPropagation(); cardEmit('copy', cardProps.item.waybillNo) } }, '▣'),
        h('b', { class: 'work-freight' }, `¥${cardProps.item.freightAmount}`),
      ]),
      h('div', { class: 'work-cargo-row' }, [
        h('div', { class: 'work-cargo-main' }, [
          h('div', { class: 'work-cargo-name' }, [h('strong', cardProps.item.cargoName), h('b', cardProps.item.cargoWeight)]),
          h('p', `${cardProps.item.origin} - ${cardProps.item.destination}`),
        ]),
        h('div', { class: 'work-time' }, [h('span', cardProps.item.timeLabel), h('span', cardProps.item.timeValue)]),
      ]),
      h('div', { class: 'work-driver-row' }, [
        h('span', [h('img', { src: '/zhiyun-mobile-assets/mine/avatar.png', alt: '' }), `司机 ${cardProps.item.driverName || '张建国'}`]),
        cardProps.item.canVoucher ? h('button', { type: 'button', onClick: (event) => { event.stopPropagation(); cardEmit('voucher', cardProps.item) } }, '补录凭证') : h('small', '凭证已完成'),
      ]),
    ])
  },
})
</script>
