<template>
  <section class="settle-page" aria-label="结算与付款">
    <div class="status-bar">
      <span class="status-time">9:41</span>
      <span class="status-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
        <span class="battery"></span>
      </span>
    </div>

    <header class="nav-bar">
      <button type="button" class="back-button" aria-label="返回" @click="$emit('back')">
        <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.6 1L1.4 8.5L8.6 16" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h1>结算与付款</h1>
      <span class="nav-placeholder"></span>
    </header>

    <main class="settle-content">
      <!-- 小简汇总：只讲需要办理的事项，待结算不计入应付 -->
      <section class="card">
        <div class="card-head">
          <div class="card-author"><img src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="" /><span>小简已为你整理</span></div>
        </div>
        <p class="conclusion">当前有 {{ data.paymentSummary.count }} 笔待付款记录，合计 <b class="blue">{{ money(data.paymentSummary.total) }}</b></p>
        <p class="secondary">另有 {{ data.settlementCount }} 项运输待结算，未计入本次应付金额。</p>
      </section>

      <!-- 双页签：沿用运单页模式切换的外观 -->
      <nav class="mode-switch" aria-label="事项分类">
        <button type="button" :class="{ active: tab === 'settlement' }" @click="tab = 'settlement'">待结算 {{ data.settlementCount }}</button>
        <button type="button" :class="{ active: tab === 'payment' }" @click="tab = 'payment'">待付款 {{ paymentCount }}</button>
      </nav>

      <!-- 待付款：当前不设置付款截止时间，平铺展示待付款记录 -->
      <template v-if="tab === 'payment'">
        <p class="list-note">共 {{ paymentCount }} 笔待付款记录</p>
        <template v-if="paymentCount">
          <article v-for="item in data.payments" :key="item.id" class="card pay-card">
            <p class="card-platform">所属平台：{{ item.platform }}</p>
            <h3 class="card-title">{{ item.route }} · {{ item.goods }}</h3>
            <p class="secondary">{{ item.period }} · {{ item.waybillCount }}笔运单</p>
            <div class="summary-row"><span>收款方</span><b>{{ item.payee }}</b></div>
            <div class="summary-row"><span>付款状态</span><b class="orange">待付款</b></div>
            <div class="card-footer-row">
              <div class="cargo-price"><small>本次应付</small><strong>{{ money(item.amount) }}</strong></div>
              <button type="button" class="cargo-action" @click="openBill(item)">查看并付款</button>
            </div>
          </article>
        </template>
        <div v-else class="empty-state"><span>¥</span><p>暂无待付款账单</p></div>
      </template>

      <!-- 待结算：最小列表布局，未形成金额不生成数值 -->
      <template v-else>
        <p class="list-note">结算确认后将生成付款账单，届时进入待付款列表</p>
        <article v-for="item in data.settlements" :key="item.id" class="card pay-card">
          <div class="row-between">
            <h3 class="card-title">{{ item.route }} · {{ item.goods }}</h3>
            <span class="state-tag">待结算</span>
          </div>
          <p class="secondary">{{ item.platform }} · {{ item.waybillCount }}笔运单 · 结算货量 {{ item.quantity }}</p>
          <div class="card-footer-row">
            <div class="cargo-price"><small>{{ item.amount !== null ? '待确认金额' : '金额' }}</small><strong v-if="item.amount !== null">{{ money(item.amount) }}</strong><em v-else>结算中，金额未形成</em></div>
            <button type="button" class="cargo-action" @click="openSettlement(item)">去结算</button>
          </div>
        </article>
        <div v-if="!data.settlements.length" class="empty-state"><span>¥</span><p>暂无待结算事项</p></div>
      </template>

    </main>

    <!-- 问小简：沿用 AI 首页问小简入口样式 -->
    <button class="ask-entry" type="button" @click="ask">
      <img src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="" />
      <span>问小简</span>
      <small>{{ tab === 'payment' ? '了解今天的付款安排' : '了解待结算事项' }}</small>
      <b>›</b>
    </button>

    <div v-if="notice" class="notice" role="status">{{ notice }}<button type="button" @click="notice = ''">×</button></div>

    <!-- 只读明细：先核对账单/结算信息，再说明办理边界 -->
    <div v-if="activeBill" class="overlay" @click.self="activeBill = null">
      <section class="sheet">
        <div class="sheet-head"><h2>账单明细</h2><button type="button" aria-label="关闭" @click="activeBill = null">×</button></div>
        <div class="summary-row"><span>所属平台</span><b>{{ activeBill.platform }}</b></div>
        <div class="summary-row"><span>关联运输</span><b>{{ activeBill.route }} · {{ activeBill.goods }}</b></div>
        <div class="summary-row"><span>结算周期</span><b>{{ activeBill.period }} · {{ activeBill.waybillCount }}笔运单</b></div>
        <div class="summary-row"><span>实际收款方</span><b>{{ activeBill.payee }}</b></div>
        <div class="summary-row"><span>付款状态</span><b class="orange">待付款</b></div>
        <div class="summary-row"><span>本次应付</span><b class="blue">{{ money(activeBill.amount) }}</b></div>
        <p class="gap-note">付款通道尚未接入：本原型不提供实际支付，也不会返回付款结果。核对无误后请在正式系统办理。</p>
        <button type="button" class="sheet-close" @click="activeBill = null">返回列表</button>
      </section>
    </div>

    <div v-if="activeSettlement" class="overlay" @click.self="activeSettlement = null">
      <section class="sheet">
        <div class="sheet-head"><h2>结算明细</h2><button type="button" aria-label="关闭" @click="activeSettlement = null">×</button></div>
        <div class="summary-row"><span>关联运输</span><b>{{ activeSettlement.route }} · {{ activeSettlement.goods }}</b></div>
        <div class="summary-row"><span>所属平台</span><b>{{ activeSettlement.platform }}</b></div>
        <div class="summary-row"><span>关联运单</span><b>{{ activeSettlement.waybillCount }}笔</b></div>
        <div class="summary-row"><span>结算货量</span><b>{{ activeSettlement.quantity }}</b></div>
        <div class="summary-row"><span>待确认金额</span><b>{{ activeSettlement.amount !== null ? money(activeSettlement.amount) : '结算中，金额未形成' }}</b></div>
        <p class="gap-note">结算计重与确认规则尚未确定：此处只读展示已形成的结算业务，不进行结算确认或计重口径判断。</p>
        <button type="button" class="sheet-close" @click="activeSettlement = null">返回列表</button>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { settlementPage } from './ai-home-data.js'

const props = defineProps({ initialTab: { type: String, default: 'payment' } })
const emit = defineEmits(['back', 'open-conversation'])

const data = settlementPage
const tab = ref(props.initialTab === 'settlement' ? 'settlement' : 'payment')
/* 页面以 v-show 常驻，从首页不同提醒进入时同步选中页签 */
watch(() => props.initialTab, (value) => {
  if (value === 'settlement' || value === 'payment') tab.value = value
})
const activeBill = ref(null)
const activeSettlement = ref(null)
const notice = ref('')

const paymentCount = computed(() => data.payments.length)
const money = (value) => `¥${Number(value.toFixed ? value.toFixed(2) : value).toLocaleString()}`

function openBill(item) {
  activeBill.value = item
}
function openSettlement(item) {
  activeSettlement.value = item
}
function ask() {
  emit('open-conversation', { context: tab.value, from: 'settlement' })
}
</script>

<style scoped>
/* 版式与字号沿用二级页既有规范（AiPublishAdjustPage / AiHomePage / WaybillPage） */
.settle-page{position:absolute;inset:0;background:#eff1f9;color:#333;font-family:'PingFang SC',-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;line-height:1.5}
.settle-page *{box-sizing:border-box}
.settle-page button{font-family:inherit;cursor:pointer}

.status-bar{height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:#0c0c0c}
.status-time{font-size:15px;font-weight:600;letter-spacing:.3px}
.status-icons{display:flex;align-items:center;gap:5px}
.battery{position:relative;display:inline-block;width:22.8px;height:11.75px;border:2px solid rgba(12,12,12,.35);border-radius:1.5px}
.battery::before{content:'';position:absolute;inset:0;background:#0c0c0c;border-radius:.7px}
.battery::after{content:'';position:absolute;top:1.8px;right:-3.4px;width:1.4px;height:4.15px;background:rgba(12,12,12,.35);border-radius:.7px}

.nav-bar{height:44px;display:flex;align-items:center;padding:0 12px}
.back-button{width:32px;height:32px;border:0;background:none;display:flex;align-items:center;justify-content:center;padding:0}
.nav-placeholder{width:32px;height:32px}
.nav-bar h1{flex:1;margin:0;font-size:17px;font-weight:600;text-align:center;color:#333}

.settle-content{position:absolute;top:88px;bottom:86px;left:0;right:0;overflow-y:auto;padding:4px 16px 16px;scrollbar-width:none}
.settle-content::-webkit-scrollbar{display:none}

.card{background:#fff;border-radius:10px;padding:14px;margin-bottom:8px}
.card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.card-author{display:flex;align-items:center;gap:5px;color:#666;font-size:11px}
.card-author img{width:22px;height:22px;object-fit:contain}
.card-title{margin:0;font-size:15px;line-height:20px;font-weight:600;color:#252b3a}
.conclusion{margin:0;font-size:14px;line-height:20px;font-weight:500;color:#333}
.conclusion b{font-size:16px;font-weight:700}
.secondary{margin:4px 0 0;color:#666;font-size:11px;line-height:17px}
.blue{color:#3a65ff}

/* 双页签：沿用运单页 mode-switch 外观，横向铺满 */
.mode-switch{display:flex;height:32px;margin:8px 0 2px;padding:2px;border-radius:16px;background:rgba(217,221,232,.7);box-shadow:0 1px 7px rgba(0,0,0,.08)}
.mode-switch button{flex:1;border:0;border-radius:14px;background:transparent;color:#626b78;font-size:13px;font-weight:400}
.mode-switch button.active{background:#fff;color:#2f61f6;font-weight:600;box-shadow:0 2px 7px rgba(65,87,130,.15)}
.list-note{margin:8px 0 0;color:#8a91a1;font-size:11px}

/* 待付款分组 */
.pay-group{margin-top:2px}
.group-head{display:flex;align-items:baseline;justify-content:space-between;margin:8px 0 6px}
.group-head h2{margin:0;font-size:15px;font-weight:700;color:#252b3a}
.group-head span{color:#747c8c;font-size:11px}
.pay-card{padding-top:12px}
.card-platform{margin:0;color:#8a91a1;font-size:11px}
.pay-card .card-title{margin-top:5px;font-size:15px;font-weight:700}
.row-between{display:flex;align-items:center;justify-content:space-between;gap:8px}
.state-tag{padding:2px 7px;border-radius:4px;background:#eaf2ff;color:#3974d8;font-size:10px;line-height:16px;font-weight:600}
.summary-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px;font-size:12px}
.summary-row span{flex-shrink:0;color:#747c8c}
.summary-row b{font-weight:600;color:#333;text-align:right}
.card-footer-row{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:10px;padding-top:10px;border-top:1px solid #eef0f4}
.cargo-price{text-align:left;color:#3d6dff;white-space:nowrap}
.cargo-price small{display:block;color:#a2a8b4;font-size:9px;line-height:10px}
.cargo-price strong{font-size:19px;line-height:22px}
.cargo-price em{display:block;margin-top:3px;color:#d56b34;font-size:12px;font-style:normal;font-weight:600}
.cargo-action{min-width:82px;height:30px;padding:0 12px;flex-shrink:0;border:1px solid #d9dce3;border-radius:16px;background:#fff;color:#333;font-size:13px;font-weight:600}

.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:170px;color:#abb0b8}
.empty-state span{width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#e3e8f0;color:#8f99a8;font-size:22px}
.empty-state p{margin:10px 0 0;font-size:13px}

/* 问小简：沿用 AI 首页 ask-entry */
.ask-entry{position:absolute;bottom:26px;left:16px;right:16px;display:flex;align-items:center;gap:7px;border:0;border-radius:10px;background:#fff;padding:9px 10px;text-align:left;box-shadow:0 2px 8px rgba(71,91,128,.05)}
.ask-entry img{width:22px;height:22px;object-fit:contain}
.ask-entry span{font-size:13px;font-weight:500}
.ask-entry small{flex:1;color:#999;font-size:10px;margin-left:1px}
.ask-entry b{color:#c3cbdb;font-size:16px}

.notice{position:absolute;bottom:72px;left:24px;right:24px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:8px;background:rgba(51,51,51,.92);color:#fff;font-size:12px;z-index:6}
.notice button{border:0;background:none;color:#fff;font-size:16px;line-height:1;padding:0}

.overlay{position:absolute;inset:0;z-index:5;display:flex;align-items:flex-end;background:rgba(0,0,0,.4)}
.sheet{width:100%;max-height:84%;overflow-y:auto;background:#fff;border-radius:12px 12px 0 0;padding:16px 16px 20px}
.sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.sheet h2{margin:0;font-size:16px;font-weight:700;color:#252b3a}
.sheet-head button{border:0;background:none;font-size:20px;line-height:1;color:#747c8c}
.gap-note{margin:10px 0 0;padding:10px;border-radius:7px;background:#f4f5f9;color:#747c8c;font-size:11px;line-height:18px}
.sheet-close{width:100%;height:42px;margin-top:14px;border:0;border-radius:8px;background:#3a65ff;color:#fff;font-size:15px;font-weight:700}
.sheet .summary-row{margin-top:0;padding:10px 0;border-bottom:1px solid #eef2f6;font-size:13px}
.sheet .summary-row:last-of-type{border-bottom:0}
.sheet .summary-row b{font-weight:700;color:#252b3a}
.sheet .blue{color:#3a65ff}
</style>
