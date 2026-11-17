<script setup>
/**
 * 运输结算 3.0 —— 页面主入口
 * 复刻对象：https://jy.zjz1.net/settlementAdjust3.0（2026-11-08）
 * 业务系统框架复用公共组件 TmsWebShell（business 规格），页面只承载业务内容
 */
import { computed, nextTick, onUnmounted, ref } from 'vue'
import TmsWebShell from '../../../../../shared/web/tms-web-shell/TmsWebShell.vue'
import SettlementList from './components/SettlementList.vue'
import SettlementDetail from './components/SettlementDetail.vue'
import SettlementWaybillDetail from './components/SettlementWaybillDetail.vue'
import CreateDrawer from './components/CreateDrawer.vue'
import { menuGroups } from './mock-data'
import { driverPendingWaybills, makeDriverDraft } from './driver-accounting'
import './transport-settlement.css'

const asset = (name) => `/transport-settlement-assets/${name}`

/* 顶部栏应用菜单 */
const navMenus = [
  { key: 'workbench', label: '工作台' },
  { key: 'twin', label: '3D数字孪生' },
  { key: 'screen', label: '数字大屏展示' },
  { key: 'apps', label: '应用导航' },
  { key: 'business', label: '业务工作台' },
]

/* 左侧图标栏（坐标取自真实系统） */
const railItems = [
  {
    key: 'app',
    label: '应用',
    left: 8,
    top: 388,
    width: 48,
    height: 68,
    imgs: [{ src: asset('rail-app.png'), x: 14, y: 18, w: 32, h: 32 }],
  },
  {
    key: 'store',
    label: '云商城',
    left: 8,
    top: 481,
    width: 48,
    height: 68,
    imgs: [{ src: asset('rail-store.png'), x: 14, y: 18, w: 32, h: 32 }],
  },
]

/* 页签栏 */
const workspaceTabs = [
  { key: 'settlement', label: '运输结算3.0' },
]
const activeTab = ref('settlement')

const activeNav = ref('workbench')
const props = defineProps({ initialSide: { type: String, default: 'road-0' } })
const activeSide = ref(props.initialSide)
const transportMode = computed(() => activeSide.value.split('-')[0])
const driverMode = computed(() => activeSide.value === 'road-2')
const drawerOpen = ref(false)
const accountingDraft = ref(null)
const driverDrawerOpen = ref(false)
const driverCargoKind = ref('bulk')
const driverWaybills = ref([])
const driverPickerRows = computed(() => driverPendingWaybills.filter(row => row.kind === driverCargoKind.value))
const detailRow = ref(null)
const waybillRow = ref(null)
let waybillTrigger = null
const toast = ref('')
let toastTimer = null

function showToast(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2000)
}

function openCreate(option) {
  const waybills = option?.rows || []
  driverCargoKind.value = option?.kind || (option === '集装箱' ? 'container' : 'bulk')
  driverDrawerOpen.value = driverMode.value
  if (driverDrawerOpen.value) {
    selectDriverWaybills(waybills)
    drawerOpen.value = true
    return
  }
  accountingDraft.value = null
  if (waybills.length) {
    const plans = new Map()
    const rows = waybills.map((row, index) => {
      plans.set(row.planNo, { id: row.planNo, name: row.planName, number: row.planNo })
      return {
        id: row.id, seq: index + 1, planId: row.planNo,
        driver: row.operator, phone: row.contact, plate: row.vehicle,
        goods: row.goods, loadPlace: row.from, unloadPlace: row.to,
        load: row.loaded, unload: row.unloaded, price: row.unitPrice,
        basic: row.payable, amount: row.payable, loss: 0,
      }
    })
    const shippers = new Set(waybills.map(row => row.shipper))
    accountingDraft.value = {
      plans: [...plans.values()],
      rows,
      basis: 'loaded',
      unit: waybills[0].unit,
      party: shippers.size === 1 ? waybills[0].shipper : '',
      totalRows: rows.length,
      count: rows.length,
      total: rows.reduce((sum, row) => sum + row.amount, 0),
      weight: rows.reduce((sum, row) => sum + row.load, 0),
      loss: 0,
    }
  }
  drawerOpen.value = true
}

function selectDriverWaybills(rows) {
  driverWaybills.value = rows
  accountingDraft.value = makeDriverDraft(rows)
}

function chooseDriverMode() {
  const selectedIds = new Set((accountingDraft.value?.rows || []).map(row => row.id))
  driverDrawerOpen.value = true
  selectDriverWaybills(driverPickerRows.value.filter(row => selectedIds.has(row.id)))
}

function openDetail(row) {
  detailRow.value = row
}

function openWaybill(row) {
  waybillTrigger = document.activeElement
  waybillRow.value = row
}

async function closeWaybill() {
  waybillRow.value = null
  await nextTick()
  waybillTrigger?.focus()
  waybillTrigger = null
}

onUnmounted(() => {
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="ts-root">
    <div class="ts-canvas">
      <div class="ts-app">
        <TmsWebShell
          variant="business"
          fluid
          site-name="至简测试企业"
          organization-name="至简测试企业"
          date-text="2026 年 11 月 08 日"
          weather-text="-6℃晴"
          :menus="navMenus"
          active-menu="workbench"
          :tabs="workspaceTabs"
          active-tab-key="settlement"
          :nav-items="railItems"
          active-nav="app"
          :inert="Boolean(waybillRow)"
          @menu-select="activeNav = $event"
          @switch-tab="activeTab = $event"
          @go-workbench="activeTab = 'workbench'"
          @close-tab="showToast('页签关闭功能待接入')"
        >
          <template #home-icon>
            <img src="/bulk-dispatch-assets/home-grid.svg" alt="" />
          </template>
          <template #logo>
            <img class="ts-logo" :src="asset('logo.png')" alt="至简集运" />
          </template>
          <template #avatar>
            <img class="ts-avatar-img" :src="asset('avatar.png')" alt="" />
          </template>
          <template #weather-icon>
            <img class="ts-weather-icon" :src="asset('weather.png')" alt="" />
          </template>
          <template #actions>
            <img :src="asset('tool-stat.png')" alt="" />
            <img :src="asset('tool-alarm.png')" alt="" />
            <img :src="asset('tool-setting.png')" alt="" />
          </template>

          <!-- 业务主体 -->
          <section class="ts-body">
            <aside class="ts-side annot-transportSettlement-rule-service-menu">
              <div v-for="(group, gi) in menuGroups" :key="group.key" class="ts-side-group">
                <div class="ts-side-group-title">
                  <img class="ts-menu-icon" :src="asset(group.icon)" alt="" />
                  <span>{{ group.name }}</span>
                  <img class="ts-arrow" :src="asset('arrow.png')" alt="" />
                </div>
                <div
                  v-for="(child, ci) in group.children"
                  :key="child"
                  class="ts-side-child"
                  :class="{ active: activeSide === `${group.key}-${ci}` }"
                  @click="activeSide = `${group.key}-${ci}`"
                >{{ child }}</div>
              </div>
            </aside>

            <SettlementList :key="activeSide" :mode="transportMode" :driver-mode="driverMode" @create="openCreate" @notice="showToast" @detail="openDetail" @waybill-detail="openWaybill" />
          </section>
        </TmsWebShell>

        <SettlementDetail
          v-if="detailRow"
          :row="detailRow"
          @close="detailRow = null"
          @notice="showToast"
        />

        <SettlementWaybillDetail v-if="waybillRow" :row="waybillRow" @close="closeWaybill" />

        <CreateDrawer
          v-if="drawerOpen"
          :draft="accountingDraft"
          :driver-mode="driverDrawerOpen"
          :allow-driver-mode="transportMode === 'road'"
          :picker-rows="driverPickerRows"
          :selected-waybills="driverWaybills"
          @choose-driver="chooseDriverMode"
          @select-waybills="selectDriverWaybills"
          @close="drawerOpen = false"
          @confirm="showToast('当前为模拟核算预览，未生成结算单')"
          @notice="showToast"
        />

        <div v-if="toast" class="ts-toast">
          <i class="ts-toast-icon">!</i>{{ toast }}
        </div>
      </div>
    </div>
  </div>
</template>
