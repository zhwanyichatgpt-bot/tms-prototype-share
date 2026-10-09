<template>
  <section class="fee-page" aria-label="费用核算">
    <div class="fee-scroll">
      <div class="status-bar" aria-hidden="true">
        <img src="/zhiyun-mobile-assets/waybill/status-bar.svg" alt="" />
      </div>

      <header class="nav-bar">
        <button type="button" class="back-button" aria-label="返回" @click="emit('back')">
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.6 1L1.4 8.5L8.6 16" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <h1>{{ pageTitle }}</h1>
        <span class="nav-spacer" aria-hidden="true"></span>
      </header>

      <main class="page-content">
        <section class="white-card cargo-card" :class="{ 'annot-zhiyunShipperHome-rule-settle-vouchers': w.settleType === 'pending' }">
          <div class="info-row"><span>货物信息</span><b>{{ w.cargo }}</b></div>
          <div class="info-row"><span>运单号</span><b>{{ w.number }}</b></div>
          <div class="info-row"><span>承接平台</span><b>{{ w.platform }}</b></div>
          <div class="info-row"><span>承运车辆</span><b>{{ w.plate }} · {{ w.driver }}</b></div>
          <div class="info-row"><span>计价规则</span><b>{{ billingRule }}</b></div>
          <div class="info-row"><span>实装重量</span><b>{{ loadWeight }} 吨</b></div>
          <button type="button" class="info-row voucher-row" :disabled="w.vouchers?.load" @click="completeVoucher('load')">
            <span>装货凭证</span>
            <span class="voucher-preview" :class="{ missing: !w.vouchers?.load }">
              <i v-for="index in 3" :key="`load-${index}`" :class="`proof-${index}`"></i>
              <em v-if="!w.vouchers?.load">待补</em>
            </span>
          </button>
          <div class="info-row"><span>实卸重量</span><b>{{ unloadWeight }} 吨</b></div>
          <button type="button" class="info-row voucher-row" :disabled="w.vouchers?.unload" @click="completeVoucher('unload')">
            <span>卸货凭证</span>
            <span class="voucher-preview" :class="{ missing: !w.vouchers?.unload }">
              <i v-for="index in 3" :key="`unload-${index}`" :class="`proof-${index + 1}`"></i>
              <em v-if="!w.vouchers?.unload">待补</em>
            </span>
          </button>
        </section>

        <section class="white-card price-card">
          <div class="info-row"><span>运输单价</span><b>{{ w.unitPrice }} 元/吨</b></div>
          <div class="info-row"><span>结算吨位</span><b>{{ settleWeight }} 吨</b></div>
        </section>

        <section class="white-card adjustment-card">
          <div class="section-head">
            <h2>扣费项目</h2>
            <button v-if="editable" type="button" @click="addItem('deduction')"><i>＋</i>新增扣费</button>
          </div>
          <div v-for="item in deductionItems" :key="item.id" class="adjustment-row">
            <input v-model="item.name" class="item-name" type="text" :readonly="!editable" aria-label="扣费项目名称" />
            <span class="amount-field minus"><i>−</i><input v-model="item.amount" type="number" min="0" inputmode="decimal" :readonly="!editable" aria-label="扣费金额" /><em>元</em></span>
          </div>
          <p v-if="!deductionItems.length" class="empty-copy">暂无扣费</p>
        </section>

        <section class="white-card adjustment-card">
          <div class="section-head">
            <h2>补贴项目</h2>
            <button v-if="editable" type="button" @click="addItem('subsidy')"><i>＋</i>新增补贴</button>
          </div>
          <div v-for="item in subsidyItems" :key="item.id" class="adjustment-row">
            <input v-model="item.name" class="item-name" type="text" :readonly="!editable" aria-label="补贴项目名称" />
            <span class="amount-field plus"><i>＋</i><input v-model="item.amount" type="number" min="0" inputmode="decimal" :readonly="!editable" aria-label="补贴金额" /><em>元</em></span>
          </div>
          <p v-if="!subsidyItems.length" class="empty-copy">暂无补贴</p>
        </section>

        <section class="white-card detail-card" :class="{ collapsed: !detailExpanded }">
          <template v-if="detailExpanded">
            <div class="section-head detail-title">
              <h2>结算信息</h2>
            </div>
            <div class="summary-row"><span>基础运费</span><b>{{ money(baseAmount) }}元</b></div>
            <div class="summary-row"><span>扣费合计</span><b class="minus">−{{ money(deductionTotal) }}元</b></div>
            <div class="summary-row"><span>补贴合计</span><b class="plus">＋{{ money(subsidyTotal) }}元</b></div>
          </template>
          <button type="button" class="total-row" :aria-expanded="detailExpanded" @click="detailExpanded = !detailExpanded">
            <span>费用明细<i :class="{ expanded: detailExpanded }"></i></span>
            <strong>¥{{ money(settleAmount) }}</strong>
          </button>
        </section>

      </main>
    </div>

    <footer class="bottom-bar">
      <template v-if="w.settleType === 'pending'">
        <div class="action-row">
          <button type="button" class="secondary-button" @click="emit('back')">取消</button>
          <button type="button" class="primary-button" :disabled="!canSettle" @click="confirmSettle">确认结算</button>
        </div>
      </template>
      <template v-else-if="w.settleType === 'unpaid'">
        <div class="pay-total"><span>待付金额</span><strong>¥{{ money(settleAmount) }}</strong></div>
        <div class="payee-line annot-zhiyunShipperHome-rule-settle-payee"><span>收款方</span><b>{{ payee }}</b></div>
        <div class="action-row">
          <button type="button" class="secondary-button" @click="emit('back')">取消</button>
          <button type="button" class="primary-button" @click="pay">确认付款</button>
        </div>
      </template>
      <button v-else type="button" class="primary-button full" @click="emit('back')">返回</button>
    </footer>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { money, platformEntities } from './mock-data.js'

const props = defineProps({ record: { type: Object, required: true } })
const emit = defineEmits(['back', 'settled', 'paid'])
const w = props.record
const editable = computed(() => w.settleType === 'pending')
const detailExpanded = ref(true)

const normalizeItems = (items, fallback) => {
  if (Array.isArray(items) && items.length) return items.map((item, index) => ({ id: item.id || `${Date.now()}-${index}`, ...item }))
  return fallback
}

const deductionItems = reactive(normalizeItems(w.deductionItems, w.adjustAmount < 0
  ? [{ id: 'deduction-existing', name: '吨位扣减', amount: Math.abs(w.adjustAmount) }]
  : editable.value ? [{ id: 'deduction-demo', name: '吨位扣减', amount: 10 }] : []))
const subsidyItems = reactive(normalizeItems(w.subsidyItems, w.adjustAmount > 0
  ? [{ id: 'subsidy-existing', name: '运输补贴', amount: w.adjustAmount }]
  : editable.value ? [{ id: 'subsidy-demo', name: '装卸补贴', amount: 10 }] : []))

const pageTitle = computed(() => ({ pending: '费用核算', unpaid: '付款', settled: '费用核算' }[w.settleType] || '费用核算'))
const payee = computed(() => platformEntities[w.platform] || w.platform)
const billingRule = computed(() => w.billingRule || '按实卸重量核算')
const loadWeight = computed(() => Number(w.loadTons ?? w.tons))
const unloadWeight = computed(() => Number(w.unloadTons ?? w.tons))
const settleWeight = computed(() => billingRule.value.includes('实装') ? loadWeight.value : unloadWeight.value)
const voucherReady = computed(() => Boolean(w.vouchers?.load && w.vouchers?.unload))
const canSettle = computed(() => voucherReady.value)
const baseAmount = computed(() => Number(w.unitPrice || 0) * settleWeight.value)
const sumItems = (items) => items.reduce((total, item) => total + (Number.isFinite(Number(item.amount)) ? Number(item.amount) : 0), 0)
const deductionTotal = computed(() => sumItems(deductionItems))
const subsidyTotal = computed(() => sumItems(subsidyItems))
const settleAmount = computed(() => baseAmount.value - deductionTotal.value + subsidyTotal.value)

const addItem = (type) => {
  const target = type === 'deduction' ? deductionItems : subsidyItems
  target.push({ id: `${type}-${Date.now()}`, name: type === 'deduction' ? '其他扣费' : '其他补贴', amount: '' })
}
const completeVoucher = (type) => {
  if (!editable.value || w.vouchers?.[type]) return
  w.vouchers[type] = true
  toast(`${type === 'load' ? '装货' : '卸货'}凭证已补传`)
}
const confirmSettle = () => {
  if (!canSettle.value) return
  w.deductionItems = deductionItems.map(({ id, name, amount }) => ({ id, name, amount: Number(amount) || 0 }))
  w.subsidyItems = subsidyItems.map(({ id, name, amount }) => ({ id, name, amount: Number(amount) || 0 }))
  w.adjustAmount = subsidyTotal.value - deductionTotal.value
  w.settleType = 'unpaid'
  w.settleTime = now()
  toast('结算已确认，请付款')
  emit('settled', w)
}
const pay = () => {
  w.settleType = 'settled'
  w.paidTime = now()
  toast(`${w.number} 付款完成`)
  emit('paid', w)
}
const now = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const toast = (text) => {
  if (typeof window !== 'undefined' && window.sharedStorage?.toast) window.sharedStorage.toast(text)
}
</script>

<style scoped>
.fee-page{position:absolute;inset:0;z-index:8;display:flex;flex-direction:column;overflow:hidden;background:#f5f5f7;color:#262626;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased}
.fee-scroll{flex:1;min-height:0;overflow-y:auto;scrollbar-width:none}.fee-scroll::-webkit-scrollbar{display:none}
.status-bar{height:44px;padding:0 16px;display:flex;align-items:center;background:#f7f7f8;box-sizing:border-box}.status-bar img{display:block;width:100%;height:auto}
.nav-bar{height:44px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;background:#f7f7f8}.nav-bar h1{margin:0;font-size:17px;font-weight:600}.back-button{width:28px;height:28px;padding:0;display:grid;place-items:center start;border:0;background:transparent}.nav-spacer{width:28px;height:28px}
.page-content{padding:10px 12px 18px}.white-card{margin-bottom:10px;padding:13px 12px;border-radius:8px;background:#fff}.info-row{min-height:30px;display:flex;align-items:center;gap:12px;border:0;background:transparent;box-sizing:border-box}.info-row>span:first-child{flex:0 0 82px;color:#7f7f85;font-size:13px;text-align:left}.info-row>b{flex:1;color:#28282b;font-size:13px;font-weight:400;text-align:right;overflow-wrap:anywhere}
.voucher-row{width:100%;padding:0;font-family:inherit;cursor:pointer}.voucher-row:disabled{cursor:default;opacity:1}.voucher-preview{flex:1;min-height:42px;display:flex;align-items:center;justify-content:flex-end;gap:5px;position:relative}.voucher-preview>i{width:38px;height:38px;border-radius:4px;background:linear-gradient(145deg,#ddd1b6,#997e60);box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}.voucher-preview>i.proof-2{background:linear-gradient(145deg,#c6d1cb,#6f8d7b)}.voucher-preview>i.proof-3{background:linear-gradient(145deg,#d5c9c0,#947663)}.voucher-preview>i.proof-4{background:linear-gradient(145deg,#d2d7df,#74869f)}.voucher-preview.missing>i{background:#f4f4f6;border:1px dashed #d8d8dd;box-shadow:none}.voucher-preview em{position:absolute;right:10px;color:#4779f6;font-size:11px;font-style:normal}
.section-head{min-height:28px;display:flex;align-items:center;justify-content:space-between}.section-head h2{margin:0;font-size:14px;font-weight:600}.section-head>button{padding:0;display:flex;align-items:center;gap:3px;border:0;background:transparent;color:#4779f6;font-family:inherit;font-size:12px}.section-head>button>i:first-child{width:15px;height:15px;display:grid;place-items:center;border-radius:50%;background:#4779f6;color:#fff;font-size:12px;font-style:normal;line-height:1}
.adjustment-card{padding-bottom:9px}.adjustment-row{min-height:34px;display:flex;align-items:center;gap:8px}.item-name{min-width:0;flex:1;padding:0;border:0;outline:none;background:transparent;color:#6f6f75;font-family:inherit;font-size:13px}.amount-field{display:flex;align-items:center;justify-content:flex-end;color:#333}.amount-field>i{margin-right:2px;font-size:13px;font-style:normal}.amount-field>input{width:64px;height:27px;padding:0 5px;border:0;border-radius:4px;outline:none;background:#f4f4f6;color:#333;font-family:inherit;font-size:13px;text-align:right;box-sizing:border-box}.amount-field>input:read-only{background:transparent}.amount-field>em{margin-left:3px;color:#555;font-size:12px;font-style:normal}.amount-field.plus>i,.summary-row .plus{color:#4779f6}.empty-copy{margin:8px 0 0;color:#aaaab0;font-size:12px}
.detail-card{padding-bottom:0}.detail-card.collapsed{padding-top:0}.detail-title{margin-bottom:4px}.summary-row{min-height:30px;display:flex;align-items:center;gap:12px}.detail-card .summary-row>span::before{content:'';width:4px;height:4px;margin-right:7px;display:inline-block;border-radius:50%;background:#4779f6;vertical-align:middle}.summary-row>span{flex:0 0 82px;color:#7f7f85;font-size:13px}.summary-row>b{flex:1;color:#333;font-size:13px;font-weight:400;text-align:right;overflow-wrap:anywhere}.total-row{width:100%;min-height:48px;margin-top:6px;padding:0;display:flex;align-items:center;border:0;border-top:1px solid #ededf0;background:transparent;font-family:inherit}.detail-card.collapsed .total-row{margin-top:0;border-top:0}.total-row>span{display:flex;align-items:center;color:#4779f6;font-size:12px}.total-row i{width:6px;height:6px;margin-left:5px;border-right:1px solid currentColor;border-bottom:1px solid currentColor;transform:rotate(45deg);transition:transform .18s ease}.total-row i.expanded{transform:rotate(225deg)}.total-row strong{margin-left:auto;color:#326af2;font-size:16px;font-weight:600}
.bottom-bar{flex:0 0 auto;padding:10px 12px calc(14px + env(safe-area-inset-bottom));background:#fff;box-shadow:0 -1px 8px rgba(0,0,0,.04)}.action-row{display:flex;gap:10px}.secondary-button,.primary-button{height:44px;border-radius:6px;font-family:inherit;font-size:14px;font-weight:500}.secondary-button{flex:0 0 84px;border:1px solid #dadade;background:#fff;color:#333}.primary-button{flex:1;border:0;background:#4779f6;color:#fff}.primary-button:disabled{background:#bfcaf0;color:rgba(255,255,255,.85)}.primary-button.full{width:100%}.pay-total,.payee-line{display:flex;align-items:center}.pay-total{min-height:30px}.pay-total span,.payee-line>span{color:#77777d;font-size:12px}.pay-total strong{margin-left:auto;color:#326af2;font-size:18px}.payee-line{min-height:26px;margin-bottom:6px}.payee-line>b{margin-left:auto;color:#555;font-size:11px;font-weight:400;text-align:right}
@media (max-height:700px){.page-content{padding-top:8px}.white-card{margin-bottom:8px;padding-top:10px;padding-bottom:10px}.info-row{min-height:27px}.voucher-preview{min-height:36px}.voucher-preview>i{width:32px;height:32px}}
</style>
