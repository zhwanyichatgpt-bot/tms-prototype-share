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
          <button type="button" class="driver-mine-capsule" aria-label="更多操作" @click="notify('更多操作后续验证')">
            <img src="/zhiyun-mobile-assets/mine/header-actions.png" alt="">
          </button>
        </header>

        <article class="driver-profile-card">
          <span class="driver-profile-watermark" aria-hidden="true"><van-icon name="passed" /></span>
          <img class="driver-profile-avatar" :src="driverProfile.avatar" alt="司机头像">
          <div class="driver-profile-content">
            <div class="driver-profile-name">
              <strong>{{ driverProfile.name }}</strong>
              <span v-for="tag in driverProfile.tags" :key="tag"><van-icon name="checked" />{{ tag }}</span>
            </div>
            <button type="button" class="driver-vehicle-row" @click="notify('切换车辆后续验证')">
              <span><van-icon name="logistics" />{{ driverProfile.plateNo }}</span>
              <small>{{ driverProfile.vehicleType }}</small>
              <van-icon name="arrow" />
            </button>
          </div>
        </article>
      </section>

      <div class="driver-mine-content">
        <section class="driver-account-card" aria-label="我的账户">
          <div class="driver-section-title">
            <h2>我的账户</h2>
            <button type="button" @click="emit('open-wallet')">流水明细<van-icon name="arrow" /></button>
          </div>
          <div class="driver-account-main">
            <div><small>可提现余额</small><strong><em>¥</em>{{ account.balance }}</strong></div>
            <button type="button" class="withdraw-button" @click="notify('提现流程后续验证')">提现</button>
          </div>
          <div class="driver-account-meta">
            <span>本月入账 <b>¥{{ account.monthIncome }}</b></span>
            <span>本月提现 <b>¥{{ account.monthWithdrawal }}</b></span>
            <span>提现中 <b>¥{{ account.withdrawing }}</b></span>
          </div>
          <button type="button" class="driver-account-pending" @click="emit('open-wallet')">
            <span><van-icon name="clock-o" />已核算待打款 <b>¥{{ account.pendingEntry }}</b></span>
            <small>运费已核算，等待上游付款</small>
            <van-icon name="arrow" />
          </button>
        </section>

        <section class="driver-todo-card" aria-label="待办事项">
          <button type="button" class="driver-todo-summary" @click="notify('全部待办后续验证')">
            <span class="todo-icon warning"><van-icon name="notes-o" /></span>
            <span class="driver-todo-summary-content">
              <strong>{{ driverTodos.length }}项待处理</strong>
              <small>{{ driverTodos.map((item) => item.title).join(' · ') }}</small>
            </span>
            <van-icon name="arrow" />
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
            </div>
            <div class="driver-business-badges">
              <span>{{ business.completedOrders }}趟完成</span>
              <small>较上月 <b>{{ driverBusinessOverview.compareRate }}</b></small>
            </div>
          </div>
          <div class="driver-business-stats">
            <div v-for="item in driverBusinessOverview.metrics" :key="item.label">
              <small>{{ item.label }}</small>
              <strong>{{ item.value }}<em>{{ item.unit }}</em></strong>
            </div>
          </div>
          <button type="button" class="driver-ai-insight" @click="aiPanelOpen = true">
            <span class="driver-ai-insight-icon"><van-icon name="bulb-o" /></span>
            <span class="driver-ai-insight-content">
              <span><b>小简经营建议</b><em>{{ driverVehicleInsight.fitLabel }}</em></span>
              <strong>{{ driverVehicleInsight.cardSummary }}</strong>
            </span>
            <van-icon name="arrow" />
          </button>
          <button type="button" class="driver-frequent-route" @click="notify('线路经营分析后续验证')">
            <span><van-icon name="location-o" />高频线路</span>
            <strong>{{ driverBusinessOverview.frequentRoute }}</strong>
            <small>本月{{ driverBusinessOverview.routeOrders }}趟</small>
            <van-icon name="arrow" />
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

        <section class="driver-management-card" aria-label="司机与接单">
          <h2>司机与接单</h2>
          <div class="driver-management-grid">
            <button v-for="item in driverManagementItems" :key="item.key" type="button" @click="notify(`${item.label}后续验证`)">
              <i :class="item.tone"><van-icon :name="item.icon" /></i>
              <span><strong>{{ item.label }}</strong><small>{{ item.summary }}</small></span>
              <van-icon name="arrow" />
            </button>
          </div>
        </section>

        <section class="driver-support-card" aria-label="个人中心服务菜单">
          <button v-for="item in driverSupportItems" :key="item.key" type="button" @click="notify(`${item.label}后续验证`)">
            <span><i><van-icon :name="item.icon" /></i>{{ item.label }}</span><van-icon name="arrow" />
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
  driverBusinessOverview,
  driverManagementItems,
  driverOperatingServices,
  driverProfile,
  driverSupportItems,
  driverTodos,
  driverVehicleInsight,
} from './mock-data.js'
import { driverFlowStore } from './driver-flow-store.js'
import './driver-mine.css'

const emit = defineEmits(['navigate', 'open-wallet'])
const aiPanelOpen = ref(false)
const notify = (message) => showToast(message)
const continueVehicleAnalysis = () => {
  aiPanelOpen.value = false
  emit('navigate', 'assistant')
}

// 账户与经营数据在静态基准上叠加本次闭环增量，保证接单→结算链路可被观察。
const account = computed(() => {
  const income = driverFlowStore.sessionIncome
  const pendingAmount = driverFlowStore.waybills
    .filter((wb) => wb.status === 'pending')
    .reduce((sum, wb) => sum + (Number(wb.freightAmount) || 0), 0)
  return {
    balance: (Number(driverAccount.balance.replace(/,/g, '')) + income).toLocaleString('zh-CN', { minimumFractionDigits: 2 }),
    monthIncome: (Number(driverAccount.monthIncome.replace(/,/g, '')) + income).toLocaleString('zh-CN'),
    monthWithdrawal: driverAccount.monthWithdrawal,
    withdrawing: driverAccount.withdrawing,
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
