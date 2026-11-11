<script setup>
/**
 * 运输结算 3.0 —— 页面主入口
 * 复刻对象：https://jy.zjz1.net/settlementAdjust3.0（2026-11-08）
 * 业务系统框架复用公共组件 TmsWebShell（business 规格），页面只承载业务内容
 */
import { onMounted, onUnmounted, ref } from 'vue'
import TmsWebShell from '../../../../../shared/web/tms-web-shell/TmsWebShell.vue'
import SettlementList from './components/SettlementList.vue'
import SettlementDetail from './components/SettlementDetail.vue'
import CreateDrawer from './components/CreateDrawer.vue'
import { menuGroups } from './mock-data'
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
  { key: 'workbench', label: '工作台' },
  { key: 'settlement', label: '运输结算3.0' },
]
const activeTab = ref('settlement')

const activeNav = ref('workbench')
const activeSide = ref('road-0')
const drawerOpen = ref(false)
const detailRow = ref(null)
const toast = ref('')
let toastTimer = null

/* —— 自适应缩放，保证 1920×936 比例不变 —— */
const rootEl = ref(null)
const scale = ref(1)
let resizeObserver = null

function updateScale() {
  if (!rootEl.value) return
  const width = rootEl.value.clientWidth
  scale.value = width > 0 ? Math.min(1, width / 1920) : 1
}

function showToast(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2000)
}

function openCreate() {
  drawerOpen.value = true
}

function openDetail(row) {
  detailRow.value = row
}

onMounted(() => {
  updateScale()
  resizeObserver = new ResizeObserver(updateScale)
  if (rootEl.value) resizeObserver.observe(rootEl.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  clearTimeout(toastTimer)
})
</script>

<template>
  <div ref="rootEl" class="ts-root" :style="{ height: `${936 * scale}px` }">
    <div class="ts-canvas" :style="{ transform: `scale(${scale})` }">
      <div class="ts-app">
        <TmsWebShell
          variant="business"
          :canvas-height="936"
          site-name="至简测试企业"
          organization-name="至简测试企业"
          date-text="2026 年 11 月 08 日"
          weather-text="-6℃晴"
          :menus="navMenus"
          active-menu="workbench"
          :tabs="workspaceTabs"
          active-tab-key="settlement"
          :show-home="false"
          :nav-items="railItems"
          active-nav="app"
          @menu-select="activeNav = $event"
          @switch-tab="activeTab = $event"
          @close-tab="showToast('页签关闭功能待接入')"
        >
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
            <aside class="ts-side">
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

            <SettlementList @create="openCreate" @notice="showToast" @detail="openDetail" />
          </section>
        </TmsWebShell>

        <SettlementDetail
          v-if="detailRow"
          :row="detailRow"
          @close="detailRow = null"
          @notice="showToast"
        />

        <CreateDrawer
          v-if="drawerOpen"
          @close="drawerOpen = false"
          @notice="showToast"
        />

        <div v-if="toast" class="ts-toast">
          <i class="ts-toast-icon">!</i>{{ toast }}
        </div>
      </div>
    </div>
  </div>
</template>
