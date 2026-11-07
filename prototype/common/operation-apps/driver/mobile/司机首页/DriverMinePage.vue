<template>
  <main class="driver-mine-page" aria-label="司机个人中心">
    <div class="driver-status" aria-hidden="true">
      <strong>9:41</strong>
      <span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span>
    </div>
    <img class="driver-mine-capsule" src="/zhiyun-mobile-assets/icons/capsule.svg" alt="" aria-hidden="true">

    <div class="driver-mine-scroll">
      <header class="driver-mine-hero">
        <img class="driver-mine-hero-bg" src="/zhiyun-mobile-assets/mine/header-bg-v2.png" alt="">
        <!-- 整张资料卡进入「我的资料」：身份、证件与多车档案统一在二级页管理 -->
        <button type="button" class="driver-profile-card" aria-label="查看我的资料" @click="emit('open-profile')">
          <img class="driver-profile-avatar" :src="driverProfile.avatar" alt="司机头像">
          <span class="driver-profile-main">
            <span class="driver-profile-name">
              <strong>{{ driverProfile.name }}</strong>
              <span class="driver-profile-verify"><van-icon name="passed" />{{ driverProfile.verifyStatus }}</span>
            </span>
            <span class="driver-profile-plate">
              <b>{{ currentVehicle.plateNo }}</b>
              <i>修改<van-icon name="arrow" /></i>
            </span>
          </span>
        </button>
      </header>

      <div class="driver-mine-content">
        <!-- 钱包卡：蓝色渐变卡上只保留余额与提现，四项资金指标落在卡外白区 -->
        <section class="driver-wallet" aria-label="我的账户">
          <div class="driver-wallet-card">
            <div class="driver-wallet-head">
              <small>可提现余额</small>
              <button type="button" class="withdraw-button" @click="emit('open-cash')">提现</button>
            </div>
            <button type="button" class="driver-wallet-balance" aria-label="查看钱包明细" @click="emit('open-wallet')">
              <em>￥</em>{{ account.balance }}<van-icon name="arrow" />
            </button>
          </div>
          <div class="driver-wallet-stats">
            <span v-for="item in walletStats" :key="item.label">
              <small>{{ item.label }}</small>
              <b>{{ item.value }}<i>元</i></b>
            </span>
          </div>
        </section>

        <section class="driver-business-card" aria-label="本月经营概览">
          <div class="driver-section-title">
            <h2>本月经营</h2>
          </div>
          <div class="driver-business-main">
            <div class="driver-business-income">
              <small>本月完成运单收入</small>
              <div class="driver-business-amount">
                <strong><em>￥</em><span>{{ incomeParts.main }}</span><i>{{ incomeParts.accent }}</i><b>元</b></strong>
                <span class="driver-business-compare">较上月 <b>{{ driverBusinessOverview.compareRate }}</b><van-icon name="arrow-up" /></span>
              </div>
            </div>
            <!-- 收入走势由 mock 的按周累计值生成，仅表达趋势，不做收益预测 -->
            <div class="driver-business-chart" aria-hidden="true">
              <span class="driver-business-trips">{{ business.completedOrders }}趟</span>
              <svg viewBox="0 0 104 44" preserveAspectRatio="none">
                <polyline :points="trendAreaPoints" fill="rgba(74, 118, 245, .1)" stroke="none" />
                <polyline :points="trendLinePoints" fill="none" stroke="#4a76f5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
          <div class="driver-business-stats">
            <div v-for="item in driverBusinessOverview.metrics" :key="item.label">
              <small>{{ item.label }}</small>
              <strong>{{ item.value }}<em>{{ item.unit }}</em></strong>
            </div>
          </div>
          <!-- 一句话经营洞察，点击进入小简AI查看完整测算 -->
          <button type="button" class="driver-business-insight" @click="aiPanelOpen = true">
            <img src="/zhiyun-mobile-assets/mine/icon-ai-star.svg" alt="">
            <span>{{ driverBusinessOverview.insight }}</span>
          </button>
        </section>

        <section class="driver-operating-service-card" aria-label="用车服务">
          <div class="driver-section-title">
            <h2>用车服务</h2>
          </div>
          <div class="driver-operating-service-grid">
            <button v-for="item in driverOperatingServices" :key="item.key" type="button" @click="notify(`${item.label}后续验证`)">
              <img :src="item.image" alt="">
              <span class="service-copy">
                <strong>{{ item.label }}</strong>
                <small>{{ item.metricLabel }}</small>
                <b>{{ item.value }}</b>
              </span>
            </button>
          </div>
        </section>

        <!-- 全部应用：最近使用置顶便于复用高频入口，其后按司机日常场景分组 -->
        <section class="driver-apps" aria-label="全部应用">
          <div class="driver-apps-card driver-recent-card">
            <h2>最近使用应用</h2>
            <div class="driver-apps-grid">
              <button v-for="item in recentApps" :key="item.key" type="button" @click="notify(`${item.label}后续验证`)">
                <span class="driver-apps-icon" :class="item.tone"><van-icon :name="item.icon" /></span>
                <span>{{ item.label }}</span>
              </button>
            </div>
          </div>
          <div v-for="group in driverAppGroups" :key="group.key" class="driver-apps-card">
            <h2>{{ group.label }}</h2>
            <div class="driver-apps-grid">
              <button v-for="item in group.items" :key="item.key" type="button" @click="notify(`${item.label}后续验证`)">
                <span class="driver-apps-icon" :class="item.tone"><van-icon :name="item.icon" /></span>
                <span>{{ item.label }}</span>
              </button>
            </div>
          </div>
        </section>

        <!-- 账户与服务属于低频系统入口，固定收在页面最底部 -->
        <section class="driver-support-card" aria-label="账户与服务">
          <button v-for="item in driverSupportItems" :key="item.key" type="button" class="driver-support-row" @click="notify(`${item.label}后续验证`)">
            <img :src="item.image" alt="">
            <span>{{ item.label }}</span>
            <van-icon name="arrow" />
          </button>
        </section>
      </div>
    </div>

    <div v-if="aiPanelOpen" class="driver-ai-overlay" role="presentation" @click.self="aiPanelOpen = false">
      <aside class="driver-ai-panel" role="dialog" aria-modal="true" aria-label="车辆经营建议">
        <div class="driver-ai-panel-handle" aria-hidden="true"></div>
        <header class="driver-ai-panel-header">
          <div>
            <span><van-icon name="bulb-o" /></span>
            <div><strong>车辆经营建议</strong><small>由小简AI基于近90天运输数据生成</small></div>
          </div>
          <button type="button" aria-label="关闭" @click="aiPanelOpen = false"><van-icon name="cross" /></button>
        </header>

        <section class="driver-ai-conclusion">
          <span>{{ driverVehicleInsight.fitLabel }}</span>
          <strong>{{ driverVehicleInsight.title }}</strong>
          <p>{{ driverVehicleInsight.summary }}</p>
        </section>

        <section class="driver-ai-evidence">
          <h3>判断依据</h3>
          <div>
            <article v-for="item in driverVehicleInsight.evidence" :key="item.label">
              <strong>{{ item.value }}</strong><small>{{ item.label }}</small>
            </article>
          </div>
        </section>

        <section class="driver-ai-cost">
          <div class="driver-ai-section-heading">
            <h3>每月能源成本测算</h3><span>预计节省 <b>¥{{ driverVehicleInsight.monthlySavings }}</b></span>
          </div>
          <div v-for="item in driverVehicleInsight.costComparison" :key="item.label" class="driver-ai-cost-row">
            <span>{{ item.label }}</span>
            <i><em :style="{ width: item.ratio }" :class="item.tone"></em></i>
            <strong>¥{{ item.value }}</strong>
          </div>
          <small>{{ driverVehicleInsight.costNote }}</small>
        </section>

        <section class="driver-ai-action-note">
          <van-icon name="info-o" />
          <p><strong>建议先试租1个月</strong><span>{{ driverVehicleInsight.riskTip }}</span></p>
        </section>

        <footer class="driver-ai-panel-footer">
          <button type="button" @click="aiPanelOpen = false">暂不考虑</button>
          <button type="button" @click="continueVehicleAnalysis">继续测算</button>
        </footer>
      </aside>
    </div>

    <nav class="driver-bottom-nav" aria-label="司机端主导航">
      <img class="driver-tab-bg-top" src="/zhiyun-mobile-assets/icons/tab-band-top.svg" alt="">
      <img class="driver-tab-bg-bottom" src="/zhiyun-mobile-assets/icons/tab-band-bottom.svg" alt="">
      <img class="driver-tab-glass" src="/zhiyun-mobile-assets/icons/tab-glass-band.svg" alt="">
      <button v-for="tab in bottomTabs" :key="tab.key" type="button" class="driver-tab-item" :class="[`driver-tab-${tab.key}`, { active: tab.key === 'mine' }]" :aria-current="tab.key === 'mine' ? 'page' : undefined" @click="emit('navigate', tab.key)">
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
import { computed, ref } from 'vue'
import { showToast } from 'vant'
import {
  bottomTabs,
  driverAccount,
  driverAppGroups,
  driverBusinessOverview,
  driverOperatingServices,
  driverProfile,
  driverRecentAppKeys,
  driverSupportItems,
  driverVehicleInsight,
} from './mock-data.js'
import { driverFlowStore, currentVehicleArchive, withdrawableBalance } from './driver-flow-store.js'
import './driver-mine.css'

const emit = defineEmits(['navigate', 'open-wallet', 'open-profile', 'open-cash', 'open-todo', 'open-order-setting'])
const aiPanelOpen = ref(false)
const notify = (message) => showToast(message)
const continueVehicleAnalysis = () => {
  aiPanelOpen.value = false
  emit('navigate', 'assistant')
}

// 最近使用应用从分组数据里按 key 取用，保证图标、文案与下方的应用入口完全一致
const recentApps = computed(() => {
  const all = driverAppGroups.flatMap((group) => group.items)
  return driverRecentAppKeys.map((key) => all.find((item) => item.key === key)).filter(Boolean)
})

// 资料卡展示当前车辆，与接单页默认车辆同源，避免两处车牌/车型口径不一致
const currentVehicle = computed(() => currentVehicleArchive())

// 收入走势折线：把按月累计值归一化到 104x44 的 viewBox，
// 面积线在折线基础上补两个底角点闭合。纯展示，不含坐标轴与交互。
const TREND_W = 104
const TREND_H = 44
const trendPoints = computed(() => {
  const values = driverBusinessOverview.incomeTrend || []
  if (values.length < 2) return []
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * TREND_W
    // 上下各留 4px 余量，避免折线顶到画布边缘被裁切
    const y = TREND_H - 4 - ((value - min) / span) * (TREND_H - 8)
    return [Number(x.toFixed(2)), Number(y.toFixed(2))]
  })
})
const trendLinePoints = computed(() => trendPoints.value.map(([x, y]) => `${x},${y}`).join(' '))
const trendAreaPoints = computed(() => {
  if (!trendPoints.value.length) return ''
  const first = trendPoints.value[0][0]
  const last = trendPoints.value[trendPoints.value.length - 1][0]
  return `${first},${TREND_H} ${trendLinePoints.value} ${last},${TREND_H}`
})

// 账户数据在静态基准上叠加本次闭环增量，保证接单→结算链路可被观察。
const account = computed(() => {
  const pendingAmount = driverFlowStore.waybills
    .filter((wb) => wb.status === 'pending')
    .reduce((sum, wb) => sum + (Number(wb.freightAmount) || 0), 0)
  const income = driverFlowStore.sessionIncome
  const stat = (base, extra = 0) => String((Number(base) || 0) + extra)
  return {
    // 余额取 store 的统一口径：基准 + 入账 - 已提现
    balance: withdrawableBalance().toLocaleString('zh-CN', { minimumFractionDigits: 2 }),
    monthIncome: stat(driverAccount.monthIncome, income),
    monthWithdrawal: stat(driverAccount.monthWithdrawal),
    // 提现中的实时增量来自提现链路，提交提现后此处同步增加
    withdrawing: stat(driverAccount.withdrawing, driverFlowStore.sessionWithdrawing || 0),
    pendingEntry: stat(driverAccount.pendingEntry, pendingAmount),
  }
})

const walletStats = computed(() => [
  { label: '本月入账', value: account.value.monthIncome },
  { label: '本月提现', value: account.value.monthWithdrawal },
  { label: '提现中', value: account.value.withdrawing },
  { label: '待打款', value: account.value.pendingEntry },
])

// 本月经营的完成趟数与收入，随闭环中已完成的运单同步累加。
const business = computed(() => {
  const completed = driverFlowStore.waybills.filter((wb) => ['pending', 'settled', 'accounting'].includes(wb.status))
  const extraIncome = completed.reduce((sum, wb) => sum + (Number(wb.freightAmount) || 0), 0)
  return {
    ...driverBusinessOverview,
    completedIncome: (Number(driverBusinessOverview.completedIncome.replace(/,/g, '')) + extraIncome).toLocaleString('zh-CN'),
    completedOrders: String(Number(driverBusinessOverview.completedOrders) + completed.length),
  }
})

// 设计稿将收入末三位做绿色强调，这里按同一规则切分，数据变化时规则仍成立
const incomeParts = computed(() => {
  const raw = String(business.value.completedIncome)
  const matched = raw.match(/^(.*?)(\d{3})$/)
  return matched ? { main: matched[1], accent: matched[2] } : { main: raw, accent: '' }
})
</script>
