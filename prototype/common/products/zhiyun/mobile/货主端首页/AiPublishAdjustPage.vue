<template>
  <section class="dispatch-page" aria-label="小简AI缺车调度方案">
    <div class="status-bar">
      <span class="status-time">9:41</span>
      <span class="status-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
        <span class="battery"></span>
      </span>
    </div>

    <header class="nav-bar">
      <button type="button" class="back-button" aria-label="返回" @click="goBack">
        <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.6 1L1.4 8.5L8.6 16" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="nav-title"><h1>小简AI</h1><span><i></i>在线</span></div>
      <button type="button" class="more-button" aria-label="更多" @click="showNotice('当前原型暂无更多操作')">•••</button>
    </header>

    <main ref="contentRef" class="dispatch-content">
      <p class="conversation-time">今天 {{ suggestion.updatedAt }}</p>

      <section class="assistant-turn intro-turn">
        <img class="ai-avatar" src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="小简AI" />
        <div class="assistant-content">
          <p class="assistant-lead">我在监控运输计划时，发现这条货源存在补车风险。</p>

          <article class="risk-cargo-card" aria-label="补车风险货源">
            <div class="risk-card-top">
              <span class="risk-badge"><i></i>补车风险</span>
              <strong>预计缺{{ plan.vehicleGap }}车</strong>
            </div>
            <h2>{{ plan.route }}</h2>
            <p class="cargo-name">{{ plan.goods }} <b>{{ plan.quantity }}</b></p>
            <div class="cargo-progress-label"><span>已接单 {{ plan.accepted }}</span><b>剩余 {{ plan.remaining }}</b></div>
            <div class="cargo-progress"><i></i></div>
            <div class="cargo-meta">
              <span><small>要求完成</small>{{ plan.deadline }}</span>
              <span><small>当前运价</small>300元/吨</span>
            </div>
          </article>

          <div class="risk-conclusion">
            <span>风险判断</span>
            <p>按当前接单进度，预计到要求完成时仍会缺{{ plan.vehicleGap }}辆车，剩余{{ plan.remaining }}可能无法按时发运。</p>
          </div>
        </div>
      </section>

      <button type="button" class="evidence-toggle" :aria-expanded="evidenceExpanded" @click="evidenceExpanded = !evidenceExpanded">
        <span><i>✦</i>为什么判断有风险？</span>
        <b>{{ evidenceExpanded ? '收起' : '查看依据' }} ›</b>
      </button>

      <section v-if="evidenceExpanded" class="screening-section">
        <div class="evidence-points">
          <p><i></i><span>当前已接单{{ plan.accepted }}，剩余{{ plan.remaining }}未覆盖</span></p>
          <p><i></i><span>按25吨/车测算，至少还需要{{ plan.vehicleGap }}辆车</span></p>
          <p><i></i><span>小简已在当前运价下找到{{ plan.matchedVehicleCount }}辆可用车</span></p>
        </div>
        <div class="screening-flow">
          <template v-for="(item, index) in suggestion.screening" :key="item.label">
            <div class="screening-item" :class="[item.tone, { active: index <= analysisStep }]">
              <strong>{{ item.count }}辆</strong><span>{{ item.label }}</span>
            </div>
            <span v-if="index < suggestion.screening.length - 1" class="flow-arrow">›</span>
          </template>
        </div>
      </section>

      <div v-if="!analysisReady" class="preparing-plan"><i></i><span>小简正在结合运力和费用生成解决方案…</span></div>

      <template v-if="analysisReady && !executionStarted">
        <section class="strategy-section">
          <div class="assistant-inline"><img src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="" /><p>我已经针对这条货源准备了3种补车方案，推荐先用“精准邀请”，暂时不加价。</p></div>
          <div class="strategy-tabs" role="tablist" aria-label="执行策略">
            <button
              v-for="strategy in strategies"
              :key="strategy.id"
              type="button"
              role="tab"
              :aria-selected="strategy.id === strategyId"
              :class="{ active: strategy.id === strategyId }"
              @click="selectStrategy(strategy.id)"
            >
              <strong><i></i>{{ strategyDisplayName(strategy.id) }}<em v-if="strategy.id === 'balanced'">小简推荐</em></strong>
              <span>{{ strategy.action }}</span>
              <small>{{ strategy.eta }}｜{{ strategy.cost }}</small>
            </button>
          </div>
          <div class="strategy-detail">
            <b>为什么推荐</b>
            <p>{{ currentStrategyReason }}</p>
            <span>预计{{ currentStrategy.eta }}前完成接单 · {{ currentStrategy.cost }}</span>
          </div>
        </section>

        <section class="candidate-section">
          <div class="section-heading candidate-heading">
            <div><h3>当前方案将邀请{{ selectedVehicleCount }}辆车</h3><p>目标接单4辆，覆盖剩余{{ plan.remaining }}</p></div>
            <span>可调整</span>
          </div>

          <div class="candidate-list">
            <PlatformSelectRow
              v-for="candidate in visibleCandidates"
              :key="candidate.id"
              logo="车"
              logo-color="#3a65ff"
              :name="`${candidate.driver} · ${candidate.plate}`"
              :feature="`${candidate.team} · ${candidate.capacity}吨`"
              :tags="[candidate.tag]"
              :meta="`推荐理由：${candidate.meta}`"
              :checked="selectedIds.includes(candidate.id)"
              @select="toggleCandidate(candidate.id)"
            />
          </div>
        </section>

        <label class="fallback-setting">
          <span><b>15:40仍少于3辆时</b><small>提醒我扩大到象奔奔、至简智运</small></span>
          <input v-model="fallbackEnabled" type="checkbox" />
          <i></i>
        </label>

        <div class="primary-action-area">
          <button type="button" class="execute-button" :disabled="selectedVehicleCount < 4" @click="startExecution">
            立即邀请这{{ selectedVehicleCount }}辆车
          </button>
          <p>本次仅发送邀请，不改变当前运价。</p>
        </div>
      </template>

      <section v-if="analysisReady && executionStarted" class="execution-section">
        <div class="assistant-turn execution-turn">
          <img class="ai-avatar" src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="小简AI" />
          <div class="assistant-content">
            <p class="assistant-context">方案已开始执行</p>
            <h2>{{ executionHeadline }}</h2>
            <p>{{ executionMessage }}</p>
          </div>
        </div>

        <div class="progress-summary">
          <div><strong>{{ acceptedCount }}/4辆</strong><span>已接单</span></div>
          <div class="progress-track"><i :style="{ width: `${acceptedCount * 25}%` }"></i></div>
          <b>{{ acceptedCount * 25 }}/100吨</b>
        </div>

        <div class="execution-list">
          <PlatformSelectRow
            v-for="(candidate, index) in executionCandidates"
            :key="candidate.id"
            logo="车"
            logo-color="#3a65ff"
            :name="`${candidate.driver} · ${candidate.plate}`"
            :feature="`${candidate.team} · ${candidate.capacity}吨`"
            :state="executionStatus(index).text"
            :muted="executionStatus(index).tone === 'muted'"
            :meta="candidate.meta"
            :selectable="false"
          />
        </div>

        <ol class="execution-timeline">
          <li v-for="item in executionTimeline" :key="item.time + item.text"><time>{{ item.time }}</time><i></i><p>{{ item.text }}</p></li>
        </ol>

        <button v-if="executionStage < 3" type="button" class="refresh-button" @click="refreshProgress">刷新接单进展</button>
        <button v-else type="button" class="complete-button" @click="showNotice('已补足4车，运输计划已更新')">查看更新后的运输计划</button>
        <button type="button" class="text-button" @click="returnToPlan">返回方案</button>
      </section>

      <div v-for="message in conversationMessages" :key="message.id" class="extra-message" :class="message.role">
        <img v-if="message.role === 'assistant'" src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="" />
        <p>{{ message.text }}</p>
      </div>
    </main>

    <footer class="composer">
      <div v-if="!executionStarted" class="quick-constraints">
        <button type="button" @click="applyConstraint('partners')">只用合作车辆</button>
        <button type="button" @click="applyConstraint('noPrice')">不要加价</button>
        <button type="button" @click="applyConstraint('faster')">必须16:30前到齐</button>
      </div>
      <form class="composer-row" @submit.prevent="sendMessage">
        <span class="composer-plus">＋</span>
        <input v-model.trim="inputText" type="text" :placeholder="executionStarted ? '继续询问接单进展…' : '继续告诉小简你的限制条件…'" />
        <button type="submit" aria-label="发送">➤</button>
      </form>
    </footer>

    <div v-if="notice" class="notice" role="status">{{ notice }}<button type="button" @click="notice = ''">×</button></div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { dispatchSuggestion, planForecast } from './ai-home-data.js'
import PlatformSelectRow from '../shared/PlatformSelectRow.vue'

const props = defineProps({
  initialState: { type: Object, default: () => ({}) },
  active: { type: Boolean, default: false },
})
const emit = defineEmits(['back', 'open-conversation'])

const plan = planForecast
const suggestion = dispatchSuggestion
const strategies = suggestion.strategies.map((strategy) => ({
  ...strategy,
  expectedLabel: strategy.id === 'lowestCost' ? '接单3～4辆' : '接单4辆',
}))
const contentRef = ref(null)
const analysisStep = ref(0)
const analysisReady = ref(false)
const analysisStarted = ref(false)
const strategyId = ref('balanced')
const selectedIds = ref([...strategies[0].candidateIds])
const fallbackEnabled = ref(true)
const evidenceExpanded = ref(false)
const executionStarted = ref(false)
const executionStage = ref(0)
const executionCandidateIds = ref([])
const conversationMessages = ref([])
const inputText = ref('')
const notice = ref('')
let analysisTimer
let analysisReadyTimer
let noticeTimer
let messageSeed = 0

const currentStrategy = computed(() => strategies.find(item => item.id === strategyId.value) || strategies[0])
const currentStrategyReason = computed(() => ({
  balanced: '4辆合作运力刚好覆盖100吨，多邀请1辆附近车抵消临时拒单风险，兼顾时间与成本。',
  fastest: '同时扩大邀请范围并增加两个平台，能更快补足运力，但可能产生平台服务费。',
  lowestCost: '只使用合作过的运力，不扩平台、不增加费用，但任意一辆拒单都需要重新补车。',
}[currentStrategy.value.id]))
const visibleCandidates = computed(() => suggestion.candidates.filter(item => currentStrategy.value.candidateIds.includes(item.id)))
const selectedVehicleCount = computed(() => selectedIds.value.length)
const executionCandidates = computed(() => suggestion.candidates.filter(item => executionCandidateIds.value.includes(item.id)))
const acceptedCount = computed(() => [0, 2, 3, 4][executionStage.value] || 0)
const executionHeadline = computed(() => acceptedCount.value >= 4 ? '4辆车已全部补足' : `已补足${acceptedCount.value}/4辆，还差${4 - acceptedCount.value}辆`)
const executionMessage = computed(() => {
  if (executionStage.value === 0) return `已向${executionCandidateIds.value.length}辆候选运力发送邀请，正在等待回复。`
  if (executionStage.value === 1) return '永盛车队已确认2辆，其他候选仍在回复时间内，暂不扩大平台。'
  if (executionStage.value === 2) return '陈师傅已接单。林师傅预计5分钟内回复，当前仍不需要加价。'
  return '林师傅已确认接单，剩余100吨已有4辆合作运力承运，平台备选不再启用。'
})
const executionTimeline = computed(() => {
  const items = [{ time: '15:22', text: `已向${executionCandidateIds.value.length}辆候选运力发送邀请` }]
  if (executionStage.value >= 1) items.unshift({ time: '15:27', text: '永盛车队确认2辆，已覆盖50吨' })
  if (executionStage.value >= 2) items.unshift({ time: '15:31', text: '陈师傅确认接单，累计覆盖75吨' })
  if (executionStage.value >= 3) items.unshift({ time: '15:36', text: '林师傅确认接单，100吨运力已补齐' })
  return items
})

function goBack() { emit('back') }
function strategyDisplayName(id) {
  return { balanced: '精准邀请', fastest: '最快补齐', lowestCost: '成本优先' }[id]
}
function toggleCandidate(id) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(item => item !== id)
    : [...selectedIds.value, id]
}
function selectStrategy(id) {
  strategyId.value = id
  const strategy = strategies.find(item => item.id === id)
  selectedIds.value = [...strategy.candidateIds]
}
function startExecution() {
  if (selectedVehicleCount.value < 4) return
  executionCandidateIds.value = [...selectedIds.value]
  executionStage.value = 0
  executionStarted.value = true
  showNotice(`已向${selectedVehicleCount.value}辆候选运力发送邀请`)
  scrollToBottom()
}
function refreshProgress() {
  executionStage.value = Math.min(executionStage.value + 1, 3)
  showNotice(executionStage.value === 3 ? '4辆合作运力已全部接单' : '已获取最新接单回复')
  scrollToBottom()
}
function executionStatus(index) {
  if (index < acceptedCount.value) return { text: '已接单', tone: 'success' }
  if (executionStage.value >= 3 && index >= 4) return { text: '无需启用', tone: 'muted' }
  return { text: '等待回复', tone: 'pending' }
}
function returnToPlan() {
  executionStarted.value = false
  executionStage.value = 0
  scrollToBottom()
}
function applyConstraint(type) {
  const copy = {
    partners: ['只用合作过的车辆', '好的，我已切换为成本优先，只邀请4辆合作运力，不扩平台、不加价，预计17:40前补齐。'],
    noPrice: ['不要加价', '已保留当前运价。推荐组合首轮不加价，只有启用平台备选时可能增加800元服务费。'],
    faster: ['必须16:30前到齐', '我已切换为最快补齐：同时邀请8辆并增加两个平台，预计16:40前完成接单，仍无法保证16:30前车辆全部到场。'],
  }
  const [userText, assistantText] = copy[type]
  if (type === 'partners') selectStrategy('lowestCost')
  if (type === 'faster') selectStrategy('fastest')
  appendConversation(userText, assistantText)
}
function sendMessage() {
  if (!inputText.value) return
  const text = inputText.value
  inputText.value = ''
  if (/合作|常用/.test(text)) {
    selectStrategy('lowestCost')
    appendConversation(text, '我已改为只邀请4辆合作运力，不扩平台、不加价，预计17:40前补齐。')
  } else if (/16:30|更快|最快/.test(text)) {
    selectStrategy('fastest')
    appendConversation(text, '我已切换为最快补齐方案：同时邀请8辆并增加两个平台，预计16:40前完成接单。')
  } else if (/不加价|不要加/.test(text)) {
    appendConversation(text, '已保留当前运价。首轮邀请不会改变单价，我会在需要产生额外费用前再次提醒你确认。')
  } else {
    appendConversation(text, executionStarted.value ? '我已记录这个要求，并会结合当前接单回复继续更新方案。' : '我已按这个限制重新检查候选运力，当前推荐组合仍可覆盖剩余100吨。')
  }
}
function appendConversation(userText, assistantText) {
  conversationMessages.value.push(
    { id: ++messageSeed, role: 'user', text: userText },
    { id: ++messageSeed, role: 'assistant', text: assistantText },
  )
  scrollToBottom()
}
function scrollToBottom() {
  nextTick(() => {
    if (contentRef.value) contentRef.value.scrollTo({ top: contentRef.value.scrollHeight, behavior: 'smooth' })
  })
}
function showNotice(text) {
  notice.value = text
  clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => { notice.value = '' }, 3200)
}
function startAnalysis() {
  if (analysisStarted.value) return
  analysisStarted.value = true
  analysisStep.value = 0
  analysisTimer = window.setInterval(() => {
    analysisStep.value += 1
    if (analysisStep.value >= suggestion.screening.length - 1) {
      window.clearInterval(analysisTimer)
      analysisReadyTimer = window.setTimeout(() => { analysisReady.value = true }, 260)
    }
  }, 260)
}

watch(() => props.active, (active) => { if (active) startAnalysis() }, { immediate: true })
onBeforeUnmount(() => {
  window.clearInterval(analysisTimer)
  window.clearTimeout(analysisReadyTimer)
  window.clearTimeout(noticeTimer)
})
</script>

<style scoped>
.dispatch-page{position:absolute;inset:0;overflow:hidden;background:#f6f8fc;color:#17223d;font-family:'PingFang SC',-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;line-height:1.5}.dispatch-page *{box-sizing:border-box}.dispatch-page button,.dispatch-page input{font:inherit}
.status-bar{position:relative;z-index:5;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 17px;background:rgba(255,255,255,.96);color:#0d1424}.status-time{font-size:15px;font-weight:650;letter-spacing:.2px}.status-icons{display:flex;align-items:center;gap:5px}.battery{position:relative;display:inline-block;width:22.8px;height:11.75px;border:2px solid rgba(12,12,12,.35);border-radius:2px}.battery::before{content:'';position:absolute;inset:0;background:#0c0c0c;border-radius:1px}.battery::after{content:'';position:absolute;top:1.8px;right:-3.4px;width:1.4px;height:4.15px;background:rgba(12,12,12,.35);border-radius:.7px}
.nav-bar{position:relative;z-index:5;height:50px;display:grid;grid-template-columns:44px 1fr 44px;align-items:center;padding:0 7px;background:rgba(255,255,255,.96);border-bottom:1px solid #edf0f5;box-shadow:0 2px 12px rgba(26,46,83,.03)}.back-button,.more-button{width:40px;height:40px;border:0;background:transparent;display:flex;align-items:center;justify-content:center;color:#17213c}.more-button{font-size:18px;font-weight:700;letter-spacing:1px}.nav-title{display:flex;align-items:center;justify-content:center;gap:7px}.nav-title h1{margin:0;font-size:17px;font-weight:650}.nav-title span{font-size:11px;color:#8993a6}.nav-title i{display:inline-block;width:7px;height:7px;margin-right:4px;border-radius:50%;background:#18ae73;box-shadow:0 0 0 3px rgba(24,174,115,.11)}
.dispatch-content{position:absolute;top:94px;right:0;bottom:108px;left:0;overflow-y:auto;padding:18px 13px 32px;scroll-behavior:smooth}.conversation-time{margin:0 0 14px;text-align:center;color:#9aa4b5;font-size:10px}.assistant-turn{display:grid;grid-template-columns:30px 1fr;gap:9px;align-items:flex-start}.ai-avatar{width:28px;height:28px;border:2px solid #fff;border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(55,117,248,.09),0 5px 15px rgba(37,91,190,.12)}
.assistant-content{min-width:0;padding:14px 15px 15px;border:1px solid rgba(220,229,243,.85);border-radius:5px 18px 18px 18px;background:linear-gradient(145deg,#fff 0%,#fbfdff 100%);box-shadow:0 8px 24px rgba(31,60,112,.07)}.assistant-context{margin:0 0 5px;color:#71809a;font-size:10px}.assistant-content h2{margin:0 0 8px;font-size:18px;line-height:1.35;letter-spacing:-.2px;color:#172a53}.assistant-content h2 span{color:#246df7}.assistant-content>p:last-child{margin:0;color:#46536b;font-size:12px;line-height:1.7}.assistant-content b{color:#246df7}.assistant-content strong{color:#ff6a24;font-size:15px}
.assistant-lead{margin:0 0 11px;color:#33425d;font-size:12px;line-height:1.65}.risk-cargo-card{padding:13px 13px 12px;border-radius:14px;background:linear-gradient(140deg,#173469 0%,#2553a0 100%);color:#fff;box-shadow:0 9px 22px rgba(25,60,125,.2)}.risk-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.risk-badge{display:flex;align-items:center;gap:5px;padding:3px 7px;border-radius:9px;background:rgba(255,255,255,.13);font-size:9px}.risk-badge i{width:5px;height:5px;border-radius:50%;background:#ffb35c;box-shadow:0 0 0 3px rgba(255,179,92,.13)}.risk-card-top>strong{color:#ffca83;font-size:11px}.risk-cargo-card h2{margin:11px 0 0;color:#fff;font-size:18px;letter-spacing:.2px}.cargo-name{margin:2px 0 12px;color:rgba(255,255,255,.72);font-size:10px}.cargo-name b{color:#fff;font-size:11px}.cargo-progress-label{display:flex;justify-content:space-between;margin-bottom:5px;color:rgba(255,255,255,.7);font-size:8px}.cargo-progress-label b{color:#fff}.cargo-progress{height:5px;overflow:hidden;border-radius:4px;background:rgba(255,255,255,.16)}.cargo-progress i{display:block;width:91%;height:100%;border-radius:4px;background:linear-gradient(90deg,#6fa5ff,#9ac8ff)}.cargo-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.13)}.cargo-meta span{font-size:10px}.cargo-meta small{display:block;margin-bottom:2px;color:rgba(255,255,255,.58);font-size:7px}.risk-conclusion{margin-top:11px;padding:10px 11px;border-radius:11px;background:#fff6ed;border:1px solid #ffe5c8}.risk-conclusion span{display:block;margin-bottom:3px;color:#e06c21;font-size:9px;font-weight:600}.risk-conclusion p{margin:0;color:#5d4b3f;font-size:10px;line-height:1.6}
.capacity-equation{display:grid;grid-template-columns:1fr 14px 1fr;align-items:center;gap:5px;margin:10px 0 14px 39px;padding:11px 12px;border:1px solid #e3eaf5;border-radius:13px;background:#fff;box-shadow:0 5px 18px rgba(31,60,112,.045)}.capacity-equation>div{display:grid;grid-template-columns:18px 1fr;align-items:center;column-gap:7px;min-width:0}.capacity-equation strong,.capacity-equation b{display:block;grid-column:2;font-size:10px;white-space:nowrap}.capacity-equation strong{color:#56637a;font-weight:500}.capacity-equation b{color:#246df7;font-size:12px}.capacity-equation em{font-style:normal;color:#a1abba;text-align:center}.backup-capacity{color:#7f8b9e}.truck-icon{grid-row:1/3;position:relative;width:17px;height:13px;border:1.7px solid #246df7;border-radius:2px;flex:none}.truck-icon::before{content:'';position:absolute;right:-5px;bottom:-2px;width:5px;height:8px;border:1.7px solid #246df7;border-left:0;border-radius:0 2px 2px 0}.truck-icon::after{content:'';position:absolute;left:2px;bottom:-4px;width:4px;height:4px;border-radius:50%;background:#246df7;box-shadow:11px 0 0 #246df7}.backup-capacity .truck-icon{filter:grayscale(1);opacity:.55}
.section-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}.section-heading h3{margin:0;font-size:15px;line-height:1.35;color:#192641}.done-label,.thinking-label{flex:none;margin-top:2px;padding:2px 7px;border-radius:10px;font-size:9px}.done-label{color:#159765;background:#e9f8f1}.thinking-label{display:flex;align-items:center;gap:4px;color:#246df7;background:#edf4ff}.thinking-label i{width:5px;height:5px;border-radius:50%;background:#246df7;animation:pulse 1s infinite}
.evidence-toggle{width:calc(100% - 39px);display:flex;align-items:center;justify-content:space-between;margin:10px 0 10px 39px;padding:9px 11px;border:1px solid #e2e8f2;border-radius:11px;background:#fff;color:#42506a;text-align:left}.evidence-toggle span{font-size:10px}.evidence-toggle span i{margin-right:5px;color:#246df7;font-style:normal}.evidence-toggle b{color:#71809a;font-size:8px;font-weight:500}.screening-section{margin:0 0 12px 39px;padding:12px;border-radius:13px;background:linear-gradient(135deg,#eef4ff 0%,#f8fbff 100%);border:1px solid #dde8fb}.evidence-points{margin-bottom:11px;padding-bottom:9px;border-bottom:1px solid #dce7f8}.evidence-points p{display:grid;grid-template-columns:5px 1fr;gap:6px;align-items:start;margin:0 0 5px;color:#52617a;font-size:9px}.evidence-points p:last-child{margin-bottom:0}.evidence-points i{width:4px;height:4px;margin-top:5px;border-radius:50%;background:#246df7}.screening-flow{display:flex;align-items:center;justify-content:space-between;gap:2px}.screening-item{min-width:0;opacity:.22;transition:.25s ease}.screening-item.active{opacity:1}.screening-item strong,.screening-item span{display:block}.screening-item strong{font-size:12px;line-height:1.2}.screening-item span{margin-top:2px;color:#7b869b;font-size:6.5px;line-height:1.25}.screening-item.primary strong{color:#246df7}.flow-arrow{color:#94b6f5;font-size:15px}.thinking-copy{margin:8px 0 0;color:#74829a;font-size:9px}.preparing-plan{display:flex;align-items:center;gap:7px;margin:12px 0 0 39px;padding:10px 12px;border-radius:12px;background:#eef4ff;color:#58709a;font-size:9px}.preparing-plan i{width:8px;height:8px;border:2px solid #b9cdf5;border-top-color:#246df7;border-radius:50%;animation:spin .8s linear infinite}
.candidate-section{margin:17px 0 0 39px}.candidate-heading{align-items:flex-end;margin-bottom:8px}.candidate-heading p{margin:2px 0 0;color:#8792a5;font-size:9px}.candidate-heading>span{flex:none;color:#246df7;font-size:9px;font-weight:600}.candidate-list{overflow:hidden;border:1px solid #e4e9f2;border-radius:15px;background:#fff;box-shadow:0 7px 22px rgba(31,60,112,.05)}.candidate-row{width:100%;display:grid;grid-template-columns:28px 1fr 20px;align-items:center;gap:9px;padding:10px 11px;border:0;border-bottom:1px solid #edf0f5;background:#fff;text-align:left;color:inherit}.candidate-row:last-child{border-bottom:0}.candidate-truck{position:relative;display:flex;width:28px;height:28px;align-items:center;justify-content:center;border:0;border-radius:9px;background:#edf4ff;color:#246df7}.candidate-truck::before{content:'车';position:static;width:auto;height:auto;border:0;font-size:11px;font-weight:700}.candidate-truck::after{display:none}.candidate-main{min-width:0}.candidate-title{display:flex;align-items:center;gap:5px;min-width:0}.candidate-title b{overflow:hidden;font-size:12px;white-space:nowrap;text-overflow:ellipsis}.candidate-title em{padding:1px 5px;border-radius:7px;font-size:8px;font-style:normal;white-space:nowrap}.candidate-title em.blue{color:#246df7;background:#eaf1ff}.candidate-title em.green{color:#0d9a61;background:#e6f7f0}.candidate-title em.gray{color:#6f7b91;background:#edf0f5}.candidate-title em.orange{color:#e56a2c;background:#fff0e8}.candidate-team{display:block;margin-top:1px;color:#66738a;font-size:9px}.candidate-main small{display:block;overflow:hidden;margin-top:2px;color:#98a2b4;font-size:8px;white-space:nowrap;text-overflow:ellipsis}.check-mark{display:flex;width:19px;height:19px;align-items:center;justify-content:center;border:1.5px solid #c5cedb;border-radius:6px;color:transparent;font-size:11px}.candidate-row.selected .check-mark{border-color:#246df7;background:#246df7;color:#fff}.candidate-row:not(.selected){opacity:.5}
.ai-reason{display:flex;gap:7px;margin:9px 0 17px;padding:8px 10px;border-radius:11px;background:#eef5ff;color:#51617d}.ai-reason span{color:#246df7}.ai-reason p{margin:0;font-size:9px}.assistant-inline{display:grid;grid-template-columns:28px 1fr;gap:9px;align-items:center;margin:0 0 9px -39px}.assistant-inline img{width:28px;height:28px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(55,117,248,.08)}.assistant-inline p{margin:0;color:#44516a;font-size:11px}
.strategy-section{margin:15px 0 0 39px}.strategy-tabs{display:grid;gap:7px}.strategy-tabs button{position:relative;display:grid;grid-template-columns:1fr auto;grid-template-areas:'name meta' 'action meta';gap:1px 8px;min-width:0;padding:10px 11px 10px 35px;border:1px solid #e2e7f0;border-radius:13px;background:#fff;color:#27334c;text-align:left;box-shadow:0 4px 13px rgba(31,60,112,.035)}.strategy-tabs button.active{border-color:#79a7ff;background:linear-gradient(135deg,#f4f8ff,#fff);box-shadow:0 0 0 2px rgba(36,109,247,.07),0 6px 16px rgba(36,109,247,.08)}.strategy-tabs strong{grid-area:name;font-size:11px}.strategy-tabs strong i{position:absolute;top:13px;left:12px;width:12px;height:12px;border:1.5px solid #a7b1c1;border-radius:50%}.strategy-tabs strong em{margin-left:5px;padding:1px 5px;border-radius:7px;background:#e8f1ff;color:#246df7;font-size:7px;font-style:normal;font-weight:500}.strategy-tabs button.active strong{color:#246df7}.strategy-tabs button.active strong i{border:3.5px solid #246df7}.strategy-tabs span{grid-area:action;color:#768198;font-size:8px}.strategy-tabs small{grid-area:meta;align-self:center;color:#8792a6;font-size:8px;text-align:right;white-space:nowrap}.strategy-tabs button.active small{color:#246df7}.strategy-detail{margin-top:8px;padding:10px 11px;border-left:2px solid #79a7ff;border-radius:0 10px 10px 0;background:#f0f5ff}.strategy-detail b{display:block;color:#246df7;font-size:9px}.strategy-detail p{margin:3px 0 5px;color:#53627b;font-size:9px;line-height:1.55}.strategy-detail span{color:#71809a;font-size:8px}
.fallback-setting{display:grid;grid-template-columns:1fr 34px;position:relative;align-items:center;margin-left:39px;padding:11px 12px;border:1px solid #e5eaf2;border-radius:13px;background:#fff}.fallback-setting span b,.fallback-setting span small{display:block}.fallback-setting span b{font-size:10px}.fallback-setting span small{margin-top:2px;color:#8792a6;font-size:8px}.fallback-setting input{position:absolute;opacity:0}.fallback-setting>i{position:relative;width:32px;height:19px;border-radius:11px;background:#ccd3de;transition:.2s}.fallback-setting>i::after{content:'';position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.16);transition:.2s}.fallback-setting input:checked+i{background:#246df7}.fallback-setting input:checked+i::after{transform:translateX(13px)}
.primary-action-area{margin-left:39px;padding:12px 0 4px;text-align:center}.execute-button,.complete-button{width:100%;height:42px;border:0;border-radius:13px;background:linear-gradient(100deg,#367cff,#2467ee);color:#fff;font-size:13px;font-weight:600;box-shadow:0 8px 18px rgba(36,109,247,.2)}.execute-button:disabled{opacity:.45}.primary-action-area p{margin:5px 0 0;color:#949eaf;font-size:8px}
.execution-section{margin-top:5px}.execution-turn .assistant-content h2{font-size:17px}.progress-summary{display:grid;grid-template-columns:62px 1fr 52px;align-items:center;gap:9px;margin:14px 0 14px 39px;padding:12px;border-radius:13px;background:#fff}.progress-summary>div:first-child strong,.progress-summary>div:first-child span{display:block}.progress-summary>div:first-child strong{color:#246df7;font-size:15px}.progress-summary>div:first-child span{color:#7d879a;font-size:8px}.progress-track{height:6px;overflow:hidden;border-radius:4px;background:#e1e7f1}.progress-track i{display:block;height:100%;background:linear-gradient(90deg,#246df7,#54a2ff);transition:.35s}.progress-summary>b{text-align:right;font-size:9px;color:#536078}.execution-list{margin-left:39px;overflow:hidden;border:1px solid #e3e8f0;border-radius:13px;background:#fff}.execution-row{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:9px;padding:10px;border-bottom:1px solid #edf0f5}.execution-row:last-child{border-bottom:0}.execution-row>span:nth-child(2) b,.execution-row>span:nth-child(2) small{display:block}.execution-row>span:nth-child(2) b{font-size:11px}.execution-row>span:nth-child(2) small{color:#8290a6;font-size:8px}.execution-row em{font-size:9px;font-style:normal}.execution-row em.success{color:#18ae73}.execution-row em.pending{color:#e28a2d}.execution-row em.muted{color:#8b95a8}.execution-timeline{margin:14px 0 14px 39px;padding:0 10px;list-style:none}.execution-timeline li{display:grid;grid-template-columns:37px 10px 1fr;align-items:start;gap:5px;position:relative;min-height:30px}.execution-timeline time{color:#77849b;font-size:9px}.execution-timeline i{position:relative;width:7px;height:7px;margin-top:4px;border-radius:50%;background:#246df7}.execution-timeline i::after{content:'';position:absolute;top:7px;left:3px;width:1px;height:23px;background:#cbd8ef}.execution-timeline li:last-child i::after{display:none}.execution-timeline p{margin:0;font-size:10px}.refresh-button,.complete-button{width:calc(100% - 39px);margin-left:39px;height:40px}.refresh-button{border:1px solid #246df7;border-radius:12px;background:#fff;color:#246df7;font-weight:600}.text-button{display:block;margin:9px auto 0;border:0;background:transparent;color:#6f7b91;font-size:10px}
.extra-message{display:flex;gap:8px;margin:12px 0 0 39px}.extra-message p{margin:0;padding:9px 11px;border-radius:12px;font-size:10px}.extra-message.user{justify-content:flex-end}.extra-message.user p{max-width:82%;background:#246df7;color:#fff;border-bottom-right-radius:3px}.extra-message.assistant{margin-left:0}.extra-message.assistant img{width:28px;height:28px;border-radius:50%}.extra-message.assistant p{max-width:86%;background:#fff;color:#39465f;border-bottom-left-radius:3px;box-shadow:0 4px 12px rgba(31,52,90,.06)}
.composer{position:absolute;right:0;bottom:0;left:0;z-index:6;padding:8px 12px 10px;background:rgba(255,255,255,.97);border-top:1px solid #edf0f5;box-shadow:0 -6px 20px rgba(31,52,90,.04);backdrop-filter:blur(12px)}.quick-constraints{display:flex;gap:6px;margin-bottom:7px;overflow:hidden}.quick-constraints button{flex:none;padding:4px 9px;border:1px solid #dfe6f1;border-radius:12px;background:#f8faff;color:#526b91;font-size:9px}.composer-row{display:grid;grid-template-columns:28px 1fr 32px;align-items:center;gap:7px}.composer-plus{display:flex;width:27px;height:27px;align-items:center;justify-content:center;border:1px solid #9aa5b8;border-radius:50%;color:#778399;font-size:18px}.composer-row input{width:100%;height:35px;padding:0 13px;border:1px solid #e0e5ed;border-radius:18px;outline:0;background:#f5f7fa;color:#29364f;font-size:10px}.composer-row input:focus{border-color:#76a4ff;background:#fff}.composer-row button{width:32px;height:32px;border:0;border-radius:50%;background:#246df7;color:#fff;font-size:14px;transform:rotate(-12deg)}
.notice{position:absolute;right:18px;bottom:116px;left:18px;z-index:20;padding:10px 36px 10px 12px;border-radius:10px;background:rgba(24,35,58,.94);color:#fff;font-size:10px;box-shadow:0 8px 22px rgba(0,0,0,.18)}.notice button{position:absolute;top:5px;right:7px;border:0;background:transparent;color:#fff;font-size:18px}@keyframes pulse{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}@keyframes spin{to{transform:rotate(360deg)}}

/* Pixso AI 工作台基线：复用货主端二级页的卡片、操作栏和色彩 Token，业务文案保持本页内容。 */
.dispatch-page{background:#eff1f9;color:#333;font-size:14px;line-height:1.5}
.status-bar{height:44px;padding:0 16px;background:transparent}
.nav-bar{height:44px;display:flex;grid-template-columns:none;padding:0 12px;background:transparent;border:0;box-shadow:none}
.back-button,.more-button{width:32px;height:32px;padding:0;background:none}.nav-title{flex:1}.nav-title h1{font-size:17px;font-weight:600;color:#333}.nav-title span{font-size:11px}.more-button{font-size:18px}
.dispatch-content{top:88px;bottom:84px;padding:4px 16px 16px;scrollbar-width:none}.conversation-time{margin:0 0 8px;font-size:10px;color:#8a96ad}
.assistant-turn{display:block}.intro-turn .ai-avatar{display:none}.assistant-content{padding:14px;border:0;border-radius:10px;background:#fff;box-shadow:none}.assistant-lead{margin:0 0 9px;font-size:14px;line-height:20px;font-weight:500;color:#333}.assistant-content h2{font-size:15px;line-height:20px;font-weight:700;color:#1f2a3d}.assistant-content>p:last-child{font-size:12px;line-height:19px;color:#666}
.risk-cargo-card{padding:12px 0 10px;border:0;border-radius:7px;background:#f7f8fa;color:#333;box-shadow:none}.risk-card-top{padding:0 10px}.risk-badge{padding:2px 6px;border-radius:4px;background:#fff4e9;color:#a36122;font-size:10px}.risk-badge i{background:#f3a91b;box-shadow:none}.risk-card-top>strong{color:#a36122;font-size:11px}.risk-cargo-card h2{margin:8px 10px 0;color:#1f2a3d;font-size:15px;font-weight:600}.cargo-name{margin:2px 10px 10px;color:#666;font-size:11px}.cargo-name b{color:#20ad82;font-size:16px}.cargo-progress-label{margin:0 10px 5px;color:#888;font-size:10px}.cargo-progress-label b{color:#3a65ff}.cargo-progress{height:6px;margin:0 10px;background:#e1e6f0}.cargo-progress i{width:91%;background:#3a65ff}.cargo-meta{margin:10px 10px 0;padding-top:8px;border-color:#e2e5eb}.cargo-meta span{font-size:11px;color:#333}.cargo-meta small{color:#8a91a1;font-size:10px}.risk-conclusion{margin-top:9px;padding:8px 10px;border:0;border-radius:7px;background:#f7f8fa}.risk-conclusion span{color:#3a65ff;font-size:11px}.risk-conclusion p{color:#666;font-size:12px;line-height:18px}
.evidence-toggle{width:100%;margin:0 0 8px;padding:10px 12px;border:0;border-radius:10px;background:#fff;color:#333}.evidence-toggle span{font-size:13px}.evidence-toggle b{color:#3a65ff;font-size:11px}.screening-section{margin:0 0 8px;padding:12px 14px;border:0;border-radius:10px;background:#fff}.evidence-points{border-color:#eef0f4}.evidence-points p{font-size:11px}.screening-item strong{font-size:13px}.screening-item span{font-size:8px}.preparing-plan{margin:0 0 8px;padding:10px 12px;border-radius:10px;background:#fff;color:#8a91a1;font-size:11px}
.strategy-section{margin:0 0 8px;padding:14px;border-radius:10px;background:#fff}.assistant-inline{margin:0 0 9px}.assistant-inline p{font-size:12px;color:#666}.strategy-tabs{gap:6px}.strategy-tabs button{padding:10px 10px 10px 34px;border-color:#eef0f4;border-radius:8px;box-shadow:none}.strategy-tabs button.active{border-color:#9bb7ff;background:#f4f7ff;box-shadow:none}.strategy-tabs strong{font-size:13px}.strategy-tabs span{font-size:11px}.strategy-tabs small{font-size:10px}.strategy-detail{margin-top:9px;padding:9px 10px;border-left:2px solid #3a65ff;border-radius:0 7px 7px 0;background:#f7f8fa}.strategy-detail b{color:#3a65ff;font-size:11px}.strategy-detail p{font-size:11px;line-height:17px}.strategy-detail span{font-size:10px}
.candidate-section{margin:0 0 8px;padding:14px;border-radius:10px;background:#fff}.candidate-heading{margin-bottom:8px}.candidate-heading h3{font-size:15px}.candidate-heading p{font-size:11px}.candidate-heading>span{font-size:11px;color:#3a65ff}.candidate-list{border:0;border-radius:7px;background:#f7f8fa;box-shadow:none}.candidate-row{grid-template-columns:28px 1fr 20px;padding:10px;border-bottom:1px solid #eef0f4;background:transparent}.candidate-title b{font-size:13px}.candidate-team{font-size:11px}.candidate-main small{font-size:10px;color:#8a91a1}.candidate-truck{background:#eaf2ff;color:#3a65ff}.check-mark{border-radius:4px}.candidate-row.selected .check-mark{border-color:#3a65ff;background:#3a65ff}
.fallback-setting{margin:0 0 8px;padding:12px 14px;border:0;border-radius:10px;background:#fff}.fallback-setting span b{font-size:13px}.fallback-setting span small{font-size:10px}.primary-action-area{margin:0;padding:6px 0 2px}.execute-button,.complete-button{height:44px;border-radius:8px;background:#3a65ff;font-size:15px;font-weight:700;box-shadow:none}.primary-action-area p{font-size:10px}
.execution-section{margin:0}.execution-section .assistant-content{margin-bottom:8px}.progress-summary{margin:0 0 8px;padding:12px;border-radius:10px;background:#fff}.execution-list{margin:0 0 8px;border:0;border-radius:10px;background:#fff}.execution-row{padding:10px;border-color:#eef0f4}.execution-timeline{margin:0 0 8px;padding:12px;border-radius:10px;background:#fff}.refresh-button,.complete-button{width:100%;margin:0;height:44px;border-radius:8px}.text-button{font-size:13px}
.extra-message{margin:0 0 8px}.extra-message p{font-size:12px}.composer{padding:8px 12px 12px;background:#fff;border-top:1px solid #eef2f6;box-shadow:0 -1px 0 #eef2f6}.quick-constraints{margin-bottom:7px}.quick-constraints button{padding:4px 9px;border:1px solid #d9dce3;border-radius:16px;background:#fff;color:#333;font-size:11px}.composer-row input{height:36px;border-color:#d9dce3;background:#fff;font-size:12px}.composer-row button{background:#3a65ff}.notice{bottom:92px;left:24px;right:24px;border-radius:8px;font-size:12px}
</style>
