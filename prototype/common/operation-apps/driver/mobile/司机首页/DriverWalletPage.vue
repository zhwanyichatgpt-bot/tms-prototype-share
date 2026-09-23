<template>
  <main class="driver-wallet-page" aria-label="司机账户流水">
    <div class="driver-status wallet-status" aria-hidden="true">
      <strong>9:41</strong>
      <span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span>
    </div>

    <div class="wallet-scroll">
      <header class="wallet-header">
        <button type="button" aria-label="返回个人中心" @click="emit('back')"><van-icon name="arrow-left" /></button>
        <h1>流水明细</h1>
        <span aria-hidden="true"></span>
      </header>

      <section class="wallet-balance-card" aria-label="账户资金概览">
        <div class="wallet-balance-main">
          <div><small>可提现余额</small><strong><em>¥</em>{{ account.balance }}</strong></div>
          <button type="button" @click="notify('提现页将在后续二级页完善')">提现</button>
        </div>
        <div class="wallet-balance-meta">
          <span>本月入账<b>¥{{ account.monthIncome }}</b></span>
          <span>本月提现<b>¥{{ account.monthWithdrawal }}</b></span>
          <span>提现中<b>¥{{ account.withdrawing }}</b></span>
        </div>
      </section>

      <nav class="wallet-tabs" aria-label="资金明细类型">
        <button type="button" :class="{ active: activeTab === 'flow' }" @click="activeTab = 'flow'">资金流水</button>
        <button type="button" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">待打款运单 <b>{{ pendingList.length }}</b></button>
      </nav>

      <section v-if="activeTab === 'flow'" class="wallet-flow-section" aria-label="资金流水列表">
        <div class="wallet-filter-row"><strong>2026年9月</strong><button type="button" @click="notify('月份筛选后续验证')">本月<van-icon name="arrow-down" /></button></div>
        <section v-for="group in flowGroups" :key="group.date" class="wallet-date-group">
          <h2>{{ group.date }}</h2>
          <button v-for="item in group.items" :key="item.id" type="button" class="wallet-flow-row" @click="notify(`${item.title}详情将在后续页完善`)">
            <i :class="item.type"><van-icon :name="item.type === 'income' ? 'balance-list-o' : 'after-sale'" /></i>
            <span class="wallet-flow-content"><strong>{{ item.title }}</strong><small>{{ item.summary }}</small><em>{{ item.time }} · {{ item.reference }}</em></span>
            <span class="wallet-flow-amount"><strong :class="{ income: item.type === 'income' }">{{ item.amount }}</strong><small>{{ item.status }}</small></span>
          </button>
        </section>
        <p class="wallet-list-tip">仅展示近期流水</p>
      </section>

      <section v-else class="wallet-pending-section" aria-label="待打款运单列表">
        <div class="wallet-pending-summary">
          <span><van-icon name="clock-o" /></span>
          <div><small>已核算待打款</small><strong>¥{{ account.pendingEntry }}</strong></div>
          <p>运费已核算，等待上游付款</p>
        </div>

        <button v-for="item in pendingList" :key="item.id" type="button" class="pending-waybill-card" @click="emit('open-waybill', item)">
          <header><span>{{ item.paymentStatus }}</span><small>{{ item.waybillNo }}</small><strong>¥{{ item.freightAmount }}</strong></header>
          <div class="pending-cargo-row">
            <div>
              <strong>{{ item.cargoName }} {{ item.cargoWeight }}</strong>
              <p>{{ item.origin.split(' · ')[0] }} - {{ item.destination.split(' · ')[0] }}</p>
            </div>
            <span><small>核算完成</small><time>{{ item.accountingTime }}</time></span>
          </div>
          <footer><span><i>付</i>{{ item.payerName }}</span><small>等待上游付款</small><van-icon name="arrow" /></footer>
        </button>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { showToast } from 'vant'
import { driverAccount, pendingPaymentWaybills, walletTransactionGroups } from './mock-data.js'
import { driverFlowStore } from './driver-flow-store.js'
import './driver-wallet.css'

const emit = defineEmits(['back', 'open-waybill'])
const activeTab = ref('flow')
const notify = (message) => showToast(message)

// 静态基准数据 + 闭环增量：本次会话接单并走到结算的运单实时反映到账户与流水。
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

// 待打款 = 静态基准 + 闭环中已核算待付款的运单
const pendingList = computed(() => {
  const fromFlow = driverFlowStore.waybills
    .filter((wb) => wb.status === 'pending')
    .map((wb) => ({ ...wb, paymentStatus: '待打款' }))
  return [...fromFlow, ...pendingPaymentWaybills]
})

// 流水按日期分组，闭环新增的入账记录插到最前
const flowGroups = computed(() => {
  if (driverFlowStore.sessionFlows.length === 0) return walletTransactionGroups
  const byDate = new Map()
  for (const item of driverFlowStore.sessionFlows) {
    if (!byDate.has(item.date)) byDate.set(item.date, [])
    byDate.get(item.date).push(item)
  }
  const merged = [...byDate.entries()].map(([date, items]) => ({ date, items }))
  for (const group of walletTransactionGroups) {
    const hit = merged.find((g) => g.date === group.date)
    if (hit) hit.items = [...hit.items, ...group.items]
    else merged.push({ ...group, items: [...group.items] })
  }
  return merged
})
</script>
