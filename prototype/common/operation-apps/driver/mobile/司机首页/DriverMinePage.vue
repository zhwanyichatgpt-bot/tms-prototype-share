<template>
  <main class="driver-mine-page" aria-label="司机个人中心">
    <div class="driver-status" aria-hidden="true">
      <strong>9:41</strong>
      <span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span>
    </div>

    <div class="driver-mine-scroll">
      <section class="driver-mine-hero" aria-label="司机身份与当前车辆">
        <img class="driver-mine-hero-bg" src="/zhiyun-mobile-assets/mine/header-bg.png" alt="">
        <header class="driver-mine-header">
          <h1>个人中心</h1>
        </header>

        <!-- 整张资料卡进入「我的资料」：身份、证件与多车档案统一在二级页管理 -->
        <button type="button" class="driver-profile-card" aria-label="查看我的资料" @click="emit('open-profile')">
          <span class="driver-profile-watermark" aria-hidden="true"><van-icon name="passed" /></span>
          <img class="driver-profile-avatar" :src="driverProfile.avatar" alt="司机头像">
          <div class="driver-profile-content">
            <div class="driver-profile-name">
              <strong>{{ driverProfile.name }}</strong>
              <span v-for="tag in driverProfile.tags" :key="tag"><van-icon name="checked" />{{ tag }}</span>
            </div>
            <span class="driver-vehicle-row">
              <span><van-icon name="logistics" />{{ currentVehicle.plateNo }}</span>
              <small>{{ currentVehicle.vehicleType }}</small>
              <van-icon name="arrow" />
            </span>
          </div>
        </button>
      </section>

      <div class="driver-mine-content">
        <!-- 账户卡：设计稿为蓝色实心渐变卡；指标含待打款，与钱包页口径一致 -->
        <section class="driver-account-card" aria-label="我的账户">
          <div class="driver-account-head">
            <small>可提现余额</small>
            <button type="button" class="withdraw-button" @click="emit('open-cash')">提现</button>
          </div>
          <strong class="driver-account-balance"><em>¥</em>{{ account.balance }}</strong>
          <div class="driver-account-meta">
            <span><small>本月入账</small><b>{{ account.monthIncome }}</b></span>
            <span><small>本月提现</small><b>{{ account.monthWithdrawal }}</b></span>
            <span><small>提现中</small><b>{{ account.withdrawing }}</b></span>
            <span><small>待打款</small><b>{{ account.pendingEntry }}</b></span>
          </div>
        </section>

        <!-- 快捷入口行：接单设置、信用评价、全部待办、常跑路线。
             运输资质不在此单列入口，证件统一在「我的资料」管理 -->
        <section class="driver-quick-row" aria-label="常用功能">
          <button v-for="item in driverQuickEntries" :key="item.key" type="button" @click="openQuickEntry(item)">
            <span class="driver-quick-icon" :class="item.tone">
              <van-icon :name="item.icon" />
              <!-- 待办有时效性，数量不露出会被漏掉，故补数字角标 -->
              <em v-if="item.badge === 'todo' && todoList.length" class="driver-quick-badge">{{ todoList.length }}</em>
            </span>
            <small>{{ item.label }}</small>
          </button>
        </section>

        <section class="driver-business-card" aria-label="本月经营概览">
          <div class="driver-section-title">
            <h2>本月经营</h2>
            <button type="button" @click="notify('经营明细后续验证')">经营明细<van-icon name="arrow" /></button>
          </div>
          <div class="driver-business-main">
            <div>
              <small>本月完成运单收入</small>
              <strong><em>¥</em>{{ business.completedIncome }}</strong>
              <span class="driver-business-compare">较上月 <b>{{ driverBusinessOverview.compareRate }}</b></span>
            </div>
            <!-- 收入走势由 mock 的按周累计值生成，仅表达趋势，不做收益预测 -->
            <svg class="driver-business-trend" viewBox="0 0 120 44" preserveAspectRatio="none" aria-hidden="true">
              <polyline :points="trendAreaPoints" fill="rgba(74, 118, 245, .12)" stroke="none" />
              <polyline :points="trendLinePoints" fill="none" stroke="#4a76f5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="driver-business-stats">
            <div v-for="item in driverBusinessOverview.metrics" :key="item.label">
              <small>{{ item.label }}</small>
              <strong>{{ item.value }}<em>{{ item.unit }}</em></strong>
            </div>
          </div>
          <!-- 一句话经营洞察，点击进入小简AI查看完整测算 -->
          <button type="button" class="driver-business-insight" @click="aiPanelOpen = true">
            <van-icon name="bulb-o" />
            <span>{{ driverBusinessOverview.insight }}</span>
          </button>
        </section>

        <section class="driver-operating-service-card" aria-label="用车服务">
          <div class="driver-section-title">
            <h2>用车服务</h2>
            <button type="button" @click="notify('全部经营服务后续验证')">全部服务<van-icon name="arrow" /></button>
          </div>
          <div class="driver-operating-service-grid">
            <button v-for="item in driverOperatingServices" :key="item.key" type="button" @click="notify(`${item.label}后续验证`)">
              <span class="service-heading"><i :class="item.tone"><van-icon :name="item.icon" /></i><strong>{{ item.label }}</strong><van-icon name="arrow" /></span>
              <small>{{ item.metricLabel }}</small>
              <b>{{ item.value }}</b>
              <em>{{ item.summary }}</em>
            </button>
          </div>
        </section>

        <section class="driver-support-card" aria-label="其他服务">
          <h2>其他</h2>
          <div class="driver-support-grid">
            <button v-for="item in driverSupportItems" :key="item.key" type="button" @click="notify(`${item.label}后续验证`)">
              <i><van-icon :name="item.icon" /></i>
              <small>{{ item.label }}</small>
            </button>
          </div>
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
  driverBusinessOverview,
  driverOperatingServices,
  driverProfile,
  driverQuickEntries,
  driverSupportItems,
  driverVehicleInsight,
} from './mock-data.js'
import { driverFlowStore, currentVehicleArchive, driverTodos, withdrawableBalance } from './driver-flow-store.js'
import './driver-mine.css'

const emit = defineEmits(['navigate', 'open-wallet', 'open-profile', 'open-cash', 'open-todo', 'open-order-setting'])
const aiPanelOpen = ref(false)
const notify = (message) => showToast(message)
const continueVehicleAnalysis = () => {
  aiPanelOpen.value = false
  emit('navigate', 'assistant')
}

// 待办由证件状态与运单异常派生，与待办页同源；一级页只做数量角标与入口
const todoList = computed(() => driverTodos())

// 资料卡展示当前车辆，与接单页默认车辆同源，避免两处车牌/车型口径不一致
const currentVehicle = computed(() => currentVehicleArchive())

// 快捷入口：待办与接单设置各有页面，信用评价待后续验证
function openQuickEntry(item) {
  if (item.key === 'todo') {
    emit('open-todo')
    return
  }
  if (item.key === 'order-setting') {
    emit('open-order-setting')
    return
  }
  notify(`${item.label}后续验证`)
}

// 收入走势折线：把按月累计值归一化到 120x44 的 viewBox，
// 面积线在折线基础上补两个底角点闭合。纯展示，不含坐标轴与交互。
const TREND_W = 120
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

// 账户与经营数据在静态基准上叠加本次闭环增量，保证接单→结算链路可被观察。
const account = computed(() => {
  const pendingAmount = driverFlowStore.waybills
    .filter((wb) => wb.status === 'pending')
    .reduce((sum, wb) => sum + (Number(wb.freightAmount) || 0), 0)
  const income = driverFlowStore.sessionIncome
  return {
    // 余额取 store 的统一口径：基准 + 入账 - 已提现
    balance: withdrawableBalance().toLocaleString('zh-CN', { minimumFractionDigits: 2 }),
    monthIncome: (Number(driverAccount.monthIncome.replace(/,/g, '')) + income).toLocaleString('zh-CN'),
    monthWithdrawal: driverAccount.monthWithdrawal,
    // 提现中的实时增量来自提现链路，提交提现后此处同步增加
    withdrawing: (Number(driverAccount.withdrawing.replace(/,/g, '')) + (driverFlowStore.sessionWithdrawing || 0)).toLocaleString('zh-CN'),
    pendingEntry: (Number(driverAccount.pendingEntry.replace(/,/g, '')) + pendingAmount).toLocaleString('zh-CN'),
  }
})

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
</script>
