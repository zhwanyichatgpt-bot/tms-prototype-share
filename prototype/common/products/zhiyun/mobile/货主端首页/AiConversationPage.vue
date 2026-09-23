<template>
  <section class="ai-conversation" aria-label="小简AI对话页">
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
      <h1>小简AI</h1>
      <span class="nav-placeholder"></span>
    </header>

    <main ref="scrollArea" class="conversation-content">
      <!-- 关联对象：进入对话时保留业务上下文 -->
      <section class="context-card">
        <p class="context-label">当前关联</p>
        <p class="context-title">{{ contextInfo.title }}</p>
        <p v-for="line in contextInfo.lines" :key="line" class="context-line">{{ line }}</p>
        <p v-if="detail" class="context-detail">你的当前输入：{{ detail }}</p>
      </section>

      <div class="assistant-label"><img src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="" /><span>小简</span></div>
      <section class="answer-card">
        <p class="answer-title">{{ contextInfo.analysisTitle }}</p>
        <p class="answer-lead">{{ contextInfo.analysisLead }}</p>
      </section>

      <!-- 消息列表：只有用户实际发送才出现用户消息 -->
      <template v-for="(message, index) in messages" :key="index">
        <div v-if="message.role === 'user'" class="user-bubble">{{ message.text }}</div>
        <template v-else>
          <div class="assistant-label"><img src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="" /><span>小简</span></div>
          <section class="answer-card reply-card">
            <p class="answer-lead">{{ message.text }}</p>
          </section>
        </template>
      </template>

    </main>

    <form class="conversation-composer" @submit.prevent="send">
      <img class="composer-avatar" src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="小简AI" />
      <input v-model="question" placeholder="请输入消息" aria-label="请输入消息" />
      <button type="submit" :disabled="!question.trim() || waiting" aria-label="发送">↑</button>
    </form>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { marketInsight, planForecast, riskEvent, settlementPage } from './ai-home-data.js'

const props = defineProps({
  context: { type: String, default: 'question' },
  detail: { type: String, default: '' },
})
defineEmits(['back'])

const question = ref('')
const messages = ref([])
const waiting = ref(false)
const scrollArea = ref(null)
let replyTimer

/* 切换关联对象时开启新对话，避免不同计划/事件/账单的消息混在一起 */
watch(() => props.context, () => {
  clearTimeout(replyTimer)
  messages.value = []
  waiting.value = false
  question.value = ''
})

const contextInfo = computed(() => ({
  plan: {
    title: `${planForecast.route} · ${planForecast.goods} ${planForecast.quantity}`,
    lines: [`已接单 ${planForecast.accepted}，待接单剩余 ${planForecast.remaining}`, `原发布平台：${planForecast.currentPlatforms.join('、')}`, `建议新增：${planForecast.suggestedPlatforms.join('、')}`],
    analysisTitle: '当前建议：扩大剩余货量的接单范围',
    analysisLead: planForecast.conclusion,
  },
  risk: {
    title: `${riskEvent.route} · ${riskEvent.goods} ${riskEvent.weight}`,
    lines: [`风险确认：${riskEvent.confirmation}，处理进度单独记录`, `司机车辆：${riskEvent.driver} · ${riskEvent.plate}`],
    analysisTitle: riskEvent.analysis.conclusion,
    analysisLead: riskEvent.analysis.nextStep,
  },
  settlement: {
    title: `${settlementPage.settlementCount} 项运输待结算`,
    lines: settlementPage.settlements.map(item => `${item.route} · ${item.platform} · ${item.waybillCount}笔运单`),
    analysisTitle: '待结算与待付款分开统计',
    analysisLead: '待结算金额不计入待付款合计；未形成的结算金额不会生成数值。',
  },
  payment: {
    title: `当前有 ${settlementPage.paymentSummary.count} 笔待付款记录`,
    lines: settlementPage.payments.map(item => `${item.route} · ${item.platform} → ${item.payee} · ¥${item.amount.toLocaleString()}`),
    analysisTitle: `待付款合计 ¥${settlementPage.paymentSummary.total.toLocaleString()}`,
    analysisLead: '平台与实际收款方分别展示；付款需先核对账单，AI 不代为支付。',
  },
  market: {
    title: `${marketInsight.route} · ${marketInsight.goods} · ${marketInsight.vehicle}`,
    lines: [`上次成交 ${marketInsight.lastDeal.price}元/吨（${marketInsight.lastDeal.date}）`, `${marketInsight.reference.label} ${marketInsight.reference.min}–${marketInsight.reference.max}元/吨`, `样本 ${marketInsight.sample.count}笔 · 来源：${marketInsight.sample.sources.join('、')}`],
    analysisTitle: marketInsight.analysis.conclusion,
    analysisLead: `${marketInsight.analysis.detail}${marketInsight.analysis.note}`,
  },
  question: {
    title: '运输业务咨询',
    lines: ['可继续描述线路、货品、计划或需要查看的事项'],
    analysisTitle: '我可以帮你处理运输业务',
    analysisLead: '说明具体计划、运单、账单或线路后，小简会结合已知业务数据整理并准备下一步。',
  },
})[props.context] || {
  title: '运输业务咨询',
  lines: ['可继续描述线路、货品、计划或需要查看的事项'],
  analysisTitle: '我可以帮你处理运输业务',
  analysisLead: '说明具体计划、运单、账单或线路后，小简会结合已知业务数据整理并准备下一步。',
})

/* 模拟回复按上下文给出已知事实，不承诺执行结果 */
const simulatedReply = computed(() => ({
  plan: `关于${planForecast.route}计划：建议新增${planForecast.suggestedPlatforms.join('、')}扩大剩余${planForecast.remaining}的接单范围，各平台共享同一剩余额度。确认与提交需要你在调整页完成，这里不会代为发布。`,
  risk: `该事件风险确认为“${riskEvent.confirmation}”：定位显示车辆已继续行驶，维修原因仍是司机反馈、待平台核实，现有照片不能证明货品状态。风险确认与核查由平台运营负责，无需你填写确认工单。`,
  settlement: `当前有 ${settlementPage.settlementCount} 项运输待结算，已形成的待确认金额按平台展示；未形成金额的条目不会估算。结算确认与计重规则尚未接通，本原型只做只读展示。`,
  payment: `当前有 ${settlementPage.paymentSummary.count} 笔待付款记录，合计 ¥${settlementPage.paymentSummary.total.toLocaleString()}；平台与实际收款方需要分别核对。付款通道尚未接入，本原型不执行实际支付。`,
  market: `${marketInsight.route}同条件参考价 ${marketInsight.reference.min}–${marketInsight.reference.max}元/吨，低于你上次成交的 ${marketInsight.lastDeal.price}元/吨。参考价不保证成交，也缺少接单效率数据，无法判断多久能接单。`,
  question: '我已经记录了你的问题。当前原型只接通了本地模拟，不会写入业务数据，也不会代为发布或支付。',
})[props.context] || '当前原型只接通了本地模拟，不会写入业务数据，也不会代为发布或支付。')

async function scrollToBottom() {
  await nextTick()
  if (scrollArea.value) scrollArea.value.scrollTop = scrollArea.value.scrollHeight
}

function send() {
  const text = question.value.trim()
  if (!text || waiting.value) return
  messages.value.push({ role: 'user', text })
  question.value = ''
  waiting.value = true
  scrollToBottom()
  clearTimeout(replyTimer)
  replyTimer = window.setTimeout(() => {
    messages.value.push({ role: 'assistant', text: simulatedReply.value, simulated: true })
    waiting.value = false
    scrollToBottom()
  }, 600)
}

onBeforeUnmount(() => clearTimeout(replyTimer))
</script>

<style scoped>
.ai-conversation{position:absolute;inset:0;background:#eff1f9;color:#333;font-family:'PingFang SC',-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;line-height:1.5}
.ai-conversation *{box-sizing:border-box}
.ai-conversation button,.ai-conversation input{font-family:inherit;cursor:pointer}

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

.conversation-content{position:absolute;top:88px;bottom:76px;left:0;right:0;overflow-y:auto;padding:4px 16px 18px;scrollbar-width:none}
.conversation-content::-webkit-scrollbar{display:none}

.context-card{background:#fff;border-radius:10px;padding:12px 13px;margin-bottom:10px}
.context-label{margin:0;color:#3a65ff;font-size:11px;font-weight:700}
.context-title{margin:4px 0 0;font-size:15px;font-weight:700;color:#1f2a3d}
.context-line{margin:3px 0 0;color:#747c8c;font-size:12px;line-height:18px}
.context-detail{margin:6px 0 0;padding-top:6px;border-top:1px solid #eef2f6;color:#3a65ff;font-size:12px;font-weight:600}

.user-bubble{max-width:82%;margin:4px 0 12px auto;background:#3a65ff;color:#fff;border-radius:14px 4px 14px 14px;padding:10px 12px;font-size:14px;line-height:21px;word-break:break-word}
.assistant-label{display:flex;align-items:center;gap:6px;color:#666;font-size:12px;margin:10px 0 6px 2px}
.assistant-label img{width:24px;height:24px;object-fit:contain}
.answer-card{background:#fff;border-radius:4px 14px 14px 14px;padding:14px;box-shadow:0 2px 10px rgba(71,91,128,.05);margin-bottom:8px}
.answer-title{font-size:15px;font-weight:700;line-height:23px;margin:0;color:#1f2a3d}
.answer-lead{font-size:14px;line-height:22px;margin:6px 0 0;color:#4a5263}
.reply-card{margin-bottom:4px}
.sim-tag{margin:8px 0 0;color:#9aa3b3;font-size:10px}

.conversation-composer{position:absolute;bottom:16px;left:16px;right:16px;height:46px;display:flex;align-items:center;gap:8px;padding:5px 6px 5px 14px;background:#fff;border-radius:12px;box-shadow:0 3px 16px rgba(37,47,76,.1)}
.conversation-composer input{flex:1;min-width:0;border:0;outline:0;background:none;font-size:14px;cursor:text}
.composer-avatar{width:24px;height:24px;flex-shrink:0;object-fit:contain}
.conversation-composer button{width:34px;height:34px;flex-shrink:0;border:0;border-radius:50%;background:#3a65ff;color:#fff;font-size:16px;line-height:1}
.conversation-composer button:disabled{background:#e6e9f3;color:#9aa3bb}
</style>
