<template>
  <section class="aia-page aia-analysis" :aria-label="`${objectLabel}分析对话`">
    <AiTopBar :title="assistantTitle" @history="drawer = true" @new-task="emit('new-task')" @restart="resetConversation" @close="emit('close')"/>

    <div ref="scrollArea" class="aia-analysis__scroll">
      <div class="aia-attachment">
        <span class="aia-attachment__icon"><van-icon name="records-o"/></span>
        <span class="aia-attachment__text">
          <b>{{ attachmentTitle }}</b>
          <small>{{ bills[0]?.id }}</small>
        </span>
      </div>
      <p class="aia-msg-user">帮我分析这 {{ bills.length }} 笔{{ objectLabel }}</p>

      <section class="aia-analysis-card">
        <header class="aia-analysis-card__head"><van-icon name="replay"/><span>已整理 {{ bills.length }} 笔{{ objectLabel }}记录</span></header>

        <h3>业务概览</h3>
        <div class="aia-metrics">
          <div><b>{{ metrics.total }}</b><span>所选单据</span></div>
          <div><b>{{ metrics.pending }}</b><span>待处理</span></div>
          <div><b>{{ metrics.completed }}</b><span>已完成/签收</span></div>
        </div>
        <button type="button" class="aia-collapse" :aria-expanded="detailsOpen" aria-label="展开或收起单据明细" @click="detailsOpen = !detailsOpen">
          <van-icon name="arrow-down" :class="{ 'is-collapsed': !detailsOpen }"/>
        </button>

        <div v-if="detailsOpen" class="aia-detail-list">
          <article v-for="(bill, index) in bills" :key="bill.id" class="aia-detail-card">
            <div class="aia-detail-card__head">
              <i>{{ index + 1 }}</i>
              <strong>{{ bill.name }}</strong>
              <span class="aia-status" :class="'is-' + billTone(bill)">{{ bill.status }}</span>
            </div>
            <div class="aia-route">
              <i class="aia-route__dot is-start"/>
              <i class="aia-route__line"/>
              <i class="aia-route__dot is-end"/>
              <span class="aia-route__names"><span>{{ bill.origin }}</span><span>{{ bill.destination }}</span></span>
            </div>
            <div class="aia-detail-card__meta"><span>{{ bill.id }}</span><time>{{ bill.datetime }}</time></div>
          </article>
        </div>

        <h3>关注点</h3>
        <p v-for="point in focusPoints" :key="point" class="aia-focus">{{ point }}</p>

        <h3>下一步建议</h3>
        <ol class="aia-suggestions">
          <li v-for="(item, index) in suggestions" :key="item"><i>{{ index + 1 }}</i><span>{{ item }}</span></li>
        </ol>

        <p class="aia-source-note">当前业务对话使用演示数据，不代表实时业务状态。</p>
        <div class="aia-card-actions">
          <div class="aia-card-actions__left">
            <button type="button" aria-label="重新分析" @click="restartAnalysis"><van-icon name="replay"/></button>
            <button type="button" aria-label="复制分析摘要" @click="copySummary"><van-icon name="description"/></button>
            <button type="button" :aria-label="speaking ? '停止朗读' : '朗读分析摘要'" @click="toggleSpeak"><van-icon name="volume-o"/></button>
            <button type="button" :aria-label="starred ? '取消收藏' : '收藏本次分析'" :class="{ 'is-on': starred }" @click="starred = !starred"><van-icon :name="starred ? 'star' : 'star-o'"/></button>
            <button type="button" aria-label="更多操作" @click="moreTip = !moreTip"><van-icon name="ellipsis"/></button>
          </div>
          <div class="aia-card-actions__right">
            <button type="button" aria-label="分析有帮助" :class="{ 'is-on': feedback === 'up' }" @click="giveFeedback('up')"><van-icon name="good-job-o"/></button>
            <button type="button" aria-label="分析没有帮助" class="is-down" :class="{ 'is-on': feedback === 'down' }" @click="giveFeedback('down')"><van-icon name="good-job-o"/></button>
          </div>
        </div>
        <p v-if="actionNotice" class="aia-action-notice" role="status">{{ actionNotice }}</p>
        <p v-if="moreTip" class="aia-action-notice">演示环境：更多操作暂未开放。</p>
      </section>

      <div class="aia-quick-actions">
        <button type="button" @click="ask('查看核验清单')">查看核验清单 <van-icon name="arrow"/></button>
        <button type="button" @click="ask('说明数据来源')">说明数据来源 <van-icon name="arrow"/></button>
      </div>

      <template v-for="(message, index) in messages" :key="index">
        <p v-if="message.role === 'user'" class="aia-msg-user">{{ message.text }}</p>
        <div v-else class="aia-msg-ai">{{ message.text }}</div>
      </template>
      <p v-if="responding" class="aia-typing" role="status">{{ assistantName }}正在分析…</p>
    </div>

    <footer class="aia-analysis__composer">
      <form class="aia-composer aia-composer--analysis" @submit.prevent="sendMessage">
        <textarea
          v-model="input"
          rows="1"
          maxlength="500"
          aria-label="输入要查询货分析的业务问题"
          placeholder="输入要查询货分析的业务问题..."
          @keydown.enter.exact.prevent="sendMessage"
        />
        <button v-if="responding" type="button" class="aia-stop" aria-label="停止生成" @click="stopResponding"><i/></button>
        <div class="aia-composer__tools">
          <button type="button" class="aia-icon" :aria-label="listening ? '停止语音输入' : '语音输入'" @click="toggleVoice">
            <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 10v4M12 7.5v9M15 10v4" stroke-linecap="round"/></svg>
          </button>
          <button type="button" class="aia-reason" :class="{ 'is-active': deepReason }" :aria-pressed="deepReason" @click="deepReason = !deepReason">深度推理</button>
          <span class="aia-spacer"/>
          <button type="button" class="aia-icon" aria-label="上传附件" @click="fileInput?.click()">
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m20 11.5-8.3 8.3a5.1 5.1 0 0 1-7.2-7.2l8.5-8.5a3.4 3.4 0 1 1 4.8 4.8l-8.5 8.5a1.7 1.7 0 1 1-2.4-2.4l7.9-7.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button type="submit" class="aia-send" :disabled="!input.trim() || responding" aria-label="发送消息">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <input ref="fileInput" hidden type="file" accept="image/*,.pdf" @change="onFile"/>
      </form>
      <p class="aia-disclaimer">内容由AI生成，仅供参考</p>
      <i class="aia-home-indicator"/>
    </footer>

    <AiHistoryDrawer v-if="drawer" :sessions="sessions" :groups="groups" @close="drawer = false" @new-task="emit('new-task')" @select="onHistorySelect"/>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import AiTopBar from './AiTopBar.vue'
import AiHistoryDrawer from './AiHistoryDrawer.vue'
import { analyseBillSet, billTone } from './ai-bill.js'

const props = defineProps({
  bills: { type: Array, default: () => [] },
  sessions: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
  objectLabel: { type: String, default: '托运单' },
  assistantName: { type: String, default: '至宝' },
  assistantTitle: { type: String, default: '至小简' },
})
const emit = defineEmits(['close', 'new-task', 'history-select'])

const messages = ref([])
const input = ref('')
const responding = ref(false)
const detailsOpen = ref(true)
const deepReason = ref(false)
const feedback = ref('')
const starred = ref(false)
const moreTip = ref(false)
const actionNotice = ref('')
const drawer = ref(false)
const scrollArea = ref(null)
const fileInput = ref(null)
const listening = ref(false)
const speaking = ref(false)
let timer
let recognition

const metrics = computed(() => analyseBillSet(props.bills))
const focusPoints = computed(() => {
  const points = []
  if (metrics.value.pending) points.push(`有 ${metrics.value.pending} 笔${props.objectLabel}尚待处理，建议核对计划时间与运力落实情况。`)
  points.push('当前记录未提供合同金额、运输时限和异常凭证，暂无法判断超期、货损或费用偏差。')
  return points
})
const suggestions = ['核对车辆、司机与计划发运时间。', '补充执行节点及交接凭证，再核验异常。']
const attachmentTitle = computed(() => {
  if (!props.bills.length) return `${props.objectLabel}数据`
  if (props.bills.length === 1) return props.bills[0].name
  return `${props.bills[0].name} 等 ${props.bills.length} 笔`
})
const summaryText = computed(() => {
  const lines = [
    `本次分析 ${metrics.value.total} 笔${props.objectLabel}：待处理 ${metrics.value.pending} 笔，已完成/签收 ${metrics.value.completed} 笔。`,
    ...focusPoints.value,
    `建议：${suggestions.join('')}`,
  ]
  return lines.join('\n')
})

async function scrollBottom() {
  await nextTick()
  if (scrollArea.value) scrollArea.value.scrollTop = scrollArea.value.scrollHeight
}
function buildReply(text) {
  let reply
  if (/运费|金额|费用|成本/.test(text)) reply = `当前${props.objectLabel}记录未提供合同金额与费用明细，暂无法测算费用偏差。建议补充报价单或结算单后再核对。`
  else if (/时效|时间|超期|延误/.test(text)) reply = `已核对计划时间，但当前${props.objectLabel}记录未提供实际发运与到达节点，暂无法判断是否超期。建议补充装卸货时间与在途节点。`
  else if (/核验|清单/.test(text)) reply = '核验清单（演示）：1. 单据与计划一致性；2. 车辆与司机信息；3. 装卸货时间节点；4. 异常与交接凭证。'
  else if (/来源|数据/.test(text)) reply = `当前对话使用原型内置的${props.objectLabel}演示数据，不连接实时业务数据库，也不代表真实运输状态。`
  else reply = `已结合当前 ${metrics.value.total} 笔${props.objectLabel}记录整理：待处理 ${metrics.value.pending} 笔，已完成/签收 ${metrics.value.completed} 笔。演示数据缺少金额与节点凭证，建议补充后再做费用与异常判断。`
  return deepReason.value ? `已开启深度推理。${reply}` : reply
}
function respond(text) {
  clearTimeout(timer)
  responding.value = true
  actionNotice.value = ''
  timer = setTimeout(() => {
    messages.value.push({ role: 'assistant', text: buildReply(text) })
    responding.value = false
    scrollBottom()
  }, 700)
}
function sendMessage() {
  const text = input.value.trim()
  if (!text || responding.value) return
  messages.value.push({ role: 'user', text })
  input.value = ''
  respond(text)
  scrollBottom()
}
function ask(text) {
  if (responding.value) return
  messages.value.push({ role: 'user', text })
  respond(text)
  scrollBottom()
}
function stopResponding() {
  clearTimeout(timer)
  responding.value = false
  actionNotice.value = '已停止本次生成（演示）。'
}
function restartAnalysis() {
  messages.value = []
  input.value = ''
  actionNotice.value = '已重新整理当前单据记录。'
  responding.value = false
  clearTimeout(timer)
  nextTick(() => { if (scrollArea.value) scrollArea.value.scrollTop = 0 })
}
function resetConversation() {
  restartAnalysis()
  actionNotice.value = ''
  moreTip.value = false
  feedback.value = ''
  starred.value = false
}
async function copySummary() {
  try {
    await navigator.clipboard.writeText(summaryText.value)
    actionNotice.value = '已复制分析摘要。'
  } catch {
    actionNotice.value = '当前浏览器不支持自动复制，请手动选择文本。'
  }
}
function toggleSpeak() {
  if (!('speechSynthesis' in window)) {
    actionNotice.value = '当前浏览器不支持语音朗读。'
    return
  }
  if (speaking.value) {
    window.speechSynthesis.cancel()
    speaking.value = false
    return
  }
  const utterance = new SpeechSynthesisUtterance(summaryText.value)
  utterance.lang = 'zh-CN'
  utterance.onend = () => { speaking.value = false }
  window.speechSynthesis.speak(utterance)
  speaking.value = true
}
function giveFeedback(value) {
  feedback.value = feedback.value === value ? '' : value
  actionNotice.value = feedback.value ? '感谢反馈，本次为演示评分。' : ''
}
function toggleVoice() {
  if (listening.value) {
    recognition?.stop()
    return
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    actionNotice.value = '当前浏览器暂不支持语音输入，请使用文字。'
    return
  }
  recognition = new SpeechRecognition()
  recognition.lang = 'zh-CN'
  recognition.interimResults = false
  recognition.onresult = event => { input.value += event.results[0][0].transcript }
  recognition.onerror = () => { listening.value = false; actionNotice.value = '语音输入未完成，请检查麦克风权限。' }
  recognition.onend = () => { listening.value = false }
  try {
    recognition.start()
    listening.value = true
  } catch {
    listening.value = false
    actionNotice.value = '暂时无法开始语音输入，请改用文字。'
  }
}
function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  messages.value.push({ role: 'user', text: `已上传附件：${file.name}` })
  respond('附件已收到，请补充需要核对的业务问题。')
  scrollBottom()
}
function onHistorySelect(item) {
  drawer.value = false
  emit('history-select', item)
}
onBeforeUnmount(() => {
  clearTimeout(timer)
  recognition?.abort()
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
})
</script>
