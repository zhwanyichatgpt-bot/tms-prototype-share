<template>
  <section class="ly-mine" aria-label="我的">
    <header class="ly-mine-header">
      <div class="ly-mine-nav">
        <h1>个人中心</h1>
        <button class="ly-mine-setting" type="button" aria-label="设置" @click="navigate('settings')">
          <van-icon name="setting-o" />
        </button>
      </div>
      <button class="ly-mine-profile" type="button" aria-label="查看我的资料" @click="navigate('profile')">
        <img class="ly-mine-avatar" :src="identity.avatar" alt="" />
        <span class="ly-mine-profile-copy">
          <span class="ly-mine-name-row">
            <strong>{{ identity.name }}</strong>
            <span class="ly-mine-cert" :class="{ 'is-verified': identity.certification === '已认证' }">
              <van-icon :name="identity.certification === '已认证' ? 'checked' : 'info-o'" />
              {{ identity.certification }}
            </span>
          </span>
          <span class="ly-mine-enterprise" :title="identity.enterpriseName">{{ identity.enterpriseName }}</span>
        </span>
        <van-icon class="ly-mine-profile-arrow" name="arrow" />
      </button>
    </header>

    <section class="ly-mine-account" aria-labelledby="ly-mine-account-title">
      <div class="ly-mine-heading">
        <h2 id="ly-mine-account-title">我的账户</h2>
        <button class="ly-mine-link" type="button" @click="navigate('account', 'history')">账户明细<van-icon name="arrow" /></button>
      </div>
      <div class="ly-mine-account-metrics">
        <div class="ly-mine-account-amount">
          <div class="ly-mine-amount-label">
            <span>可用余额（元）</span>
            <button type="button" :aria-label="amountsVisible ? '隐藏可用余额' : '显示可用余额'" :aria-pressed="!amountsVisible" @click="amountsVisible = !amountsVisible">
              <van-icon :name="amountsVisible ? 'eye-o' : 'closed-eye'" />
            </button>
          </div>
          <button class="ly-mine-number-button" type="button" aria-label="查看可用余额" @click="navigate('account', 'balance')">
            <strong>{{ amountsVisible ? formatMineAmount(account.availableBalance) : '****' }}</strong><van-icon name="arrow" />
          </button>
        </div>
        <button class="ly-mine-frozen" type="button" aria-label="查看冻结金额" @click="navigate('account', 'frozen')">
          <span>冻结金额（元）</span>
          <strong>{{ formatMineAmount(account.frozenAmount) }}<van-icon name="arrow" /></strong>
        </button>
      </div>
      <div class="ly-mine-account-bars" aria-hidden="true"><i /><i /></div>
      <button class="ly-mine-account-notice" type="button" :title="paymentNotice" :disabled="!payment.pendingCount" @click="navigate('payment', 'pending')">
        <i aria-hidden="true" /><span>{{ paymentNotice }}</span>
      </button>
    </section>

    <div class="ly-mine-content">
      <section class="ly-mine-invoice" aria-labelledby="ly-mine-invoice-title">
        <div class="ly-mine-heading">
          <h2 id="ly-mine-invoice-title">我的发票</h2>
          <button class="ly-mine-link" type="button" @click="navigate('invoice', 'history')">开票记录<van-icon name="arrow" /></button>
        </div>
        <div class="ly-mine-invoice-card">
          <div class="ly-mine-invoice-metrics">
            <button class="ly-mine-invoice-amount" type="button" @click="navigate('invoice', 'available')">
              <span>可申请金额（元）</span>
              <strong>{{ formatMineAmount(invoice.availableAmount) }}</strong>
            </button>
            <button class="ly-mine-invoice-count" type="button" @click="navigate('invoice', 'available')">
              <span>待申请</span><strong>{{ invoice.availableCount }}<small>笔</small></strong>
            </button>
            <button class="ly-mine-invoice-count" type="button" @click="navigate('invoice', 'processing')">
              <span>开票中</span><strong>{{ invoice.processingCount }}<small>笔</small></strong>
            </button>
          </div>
          <div class="ly-mine-invoice-action">
            <span>{{ invoice.availableCount ? `当前可申请 ${invoice.availableCount} 笔` : '暂无可申请的发票' }}</span>
            <button class="ly-mine-primary" type="button" :disabled="!invoice.availableCount" @click="navigate('invoice', 'apply')">去开票</button>
          </div>
        </div>
      </section>

      <section class="ly-mine-activity" aria-label="待办、消息与个人记录">
        <nav class="ly-mine-inbox-grid" aria-label="待办与消息">
          <button v-for="item in inboxMenus" :key="item.key" class="ly-mine-inbox-entry" type="button" :aria-label="`${item.label}，${item.summary}`" @click="navigate(item.key)">
            <span class="ly-mine-inbox-heading"><span>{{ item.label }}</span><van-icon :name="item.icon" /></span>
            <span class="ly-mine-inbox-metric" :class="{ 'is-empty': !item.count }">
              <strong v-if="item.count">{{ item.count }}</strong>
              <small>{{ item.count ? item.unit : item.summary }}</small>
              <van-icon name="arrow" />
            </span>
          </button>
        </nav>
        <nav class="ly-mine-shortcuts" aria-label="个人记录">
          <button v-for="item in shortcuts" :key="item.key" type="button" @click="navigate(item.key)">
            <span class="ly-mine-shortcut-icon"><van-icon :name="item.icon" /></span>
            <strong>{{ item.label }}</strong><small>{{ item.summary }}</small>
          </button>
        </nav>
      </section>

      <section class="ly-mine-panel" aria-labelledby="ly-mine-materials-title">
        <h2 id="ly-mine-materials-title" class="ly-mine-panel-title">我的资料</h2>
        <button v-for="item in materialMenus" :key="item.key" class="ly-mine-row" type="button" @click="navigate(item.key)">
          <van-icon class="ly-mine-row-icon" :name="item.icon" />
          <span class="ly-mine-row-label">{{ item.label }}</span>
          <span class="ly-mine-row-status" :class="{ 'is-verified': item.key === 'certification' && identity.certification === '已认证' }">
            {{ item.status }}<van-icon v-if="item.key === 'certification' && identity.certification === '已认证'" name="checked" />
          </span>
          <van-icon class="ly-mine-row-arrow" name="arrow" />
        </button>
      </section>

      <nav class="ly-mine-panel" aria-label="帮助与设置">
        <button v-for="item in mineSupportMenus" :key="item.key" class="ly-mine-row" type="button" @click="navigate(item.key)">
          <van-icon class="ly-mine-row-icon" :name="item.icon" />
          <span class="ly-mine-row-label">{{ item.label }}</span>
          <van-icon class="ly-mine-row-arrow" name="arrow" />
        </button>
      </nav>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  mineProfile, mineAccountSummary, minePaymentSummary, mineInvoiceSummary, minePersonalSummary,
  mineInboxSummary, mineSupportMenus, formatMineAmount,
} from './mine-data.js'
import './mine.css'

const props = defineProps({
  profile: { type: Object, default: () => ({ ...mineProfile }) },
  accountSummary: { type: Object, default: () => ({ ...mineAccountSummary }) },
  paymentSummary: { type: Object, default: () => ({ ...minePaymentSummary }) },
  invoiceSummary: { type: Object, default: () => ({ ...mineInvoiceSummary }) },
  personalSummary: { type: Object, default: () => ({ ...minePersonalSummary }) },
  favoriteCounts: { type: Object, default: () => ({ services: 0, providers: 0, cargos: 0 }) },
  inboxSummary: { type: Object, default: () => ({ ...mineInboxSummary }) },
})

// 公共入口由协调对话接入；本页只发送目标与页签，不创建二级页面或修改共享存储。
const emit = defineEmits(['navigate'])
const amountsVisible = ref(false)
const identity = computed(() => ({ ...mineProfile, ...props.profile }))
const account = computed(() => ({ ...mineAccountSummary, ...props.accountSummary }))
const payment = computed(() => ({ ...minePaymentSummary, ...props.paymentSummary }))
const paymentNotice = computed(() => {
  if (!payment.value.pendingCount) return '暂无待支付费用'
  const shortage = Number(payment.value.pendingAmount) > Number(account.value.availableBalance)
  return `有${payment.value.pendingCount}笔费用待支付 ${formatMineAmount(payment.value.pendingAmount)}元${shortage ? '，可用余额不足' : ''}`
})
const invoice = computed(() => ({ ...mineInvoiceSummary, ...props.invoiceSummary }))
const personal = computed(() => ({ ...minePersonalSummary, ...props.personalSummary }))
const inbox = computed(() => ({ ...mineInboxSummary, ...props.inboxSummary }))
const inboxMenus = computed(() => {
  const todoCount = Math.max(0, Math.floor(Number(inbox.value.todoCount) || 0))
  const unreadCount = Math.max(0, Math.floor(Number(inbox.value.unreadCount) || 0))
  return [
    { key: 'todos', label: '我的待办', icon: 'todo-list-o', count: todoCount, unit: '项待处理', summary: todoCount ? `${todoCount} 项待处理` : '暂无待办' },
    { key: 'messages', label: '我的消息', icon: 'envelop-o', count: unreadCount, unit: '条未读', summary: unreadCount ? `${unreadCount} 条未读` : '暂无未读消息' },
  ]
})
const favoriteTotal = computed(() => ['services', 'providers', 'cargos'].reduce((sum, key) => sum + (Number(props.favoriteCounts[key]) || 0), 0))
const shortcuts = computed(() => [
  { key: 'favorites', label: '我的收藏', icon: 'star-o', summary: `${favoriteTotal.value} 个收藏` },
  { key: 'recent', label: '最近浏览', icon: 'clock-o', summary: `${personal.value.recentCount} 条记录` },
  { key: 'reviews', label: '我的评价', icon: 'comment-o', summary: `${personal.value.reviewCount} 条评价` },
  { key: 'routes', label: '常用路线', icon: 'guide-o', summary: `${personal.value.routeCount} 条路线` },
])
const materialMenus = computed(() => [
  { key: 'certification', label: '认证信息', icon: 'certificate', status: identity.value.certification },
  { key: 'enterprise', label: '企业资料', icon: 'shield-o', status: '' },
  { key: 'address', label: '地址簿', icon: 'location-o', status: `${personal.value.addressCount} 个地址` },
  { key: 'contacts', label: '常用联系人', icon: 'friends-o', status: `${personal.value.contactCount} 位联系人` },
])

function navigate(target, view = 'overview') {
  emit('navigate', { target, view })
}
</script>
