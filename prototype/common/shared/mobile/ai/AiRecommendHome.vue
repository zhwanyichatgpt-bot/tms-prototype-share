<template>
  <section class="aia-page aia-home" :aria-label="`${assistantName}推荐 AI 首页`">
    <AiTopBar :title="assistantTitle" :extra-menus="extraMenus" @history="drawer = true" @new-task="restart" @restart="restart" @close="emit('close')" @menu-action="onMenuAction"/>

    <main class="aia-home__scroll">
      <section class="aia-hero" :aria-label="`${assistantName}推荐`">
        <img class="aia-hero__for-you" src="/shared-mobile-assets/ai/for-you-text.svg" alt=""/>
        <span class="aia-tag aia-tag--daily">每日洞察</span>
        <span class="aia-tag aia-tag--smart">智能推荐</span>
        <img class="aia-hero__mascot" src="/shared-mobile-assets/ai/zhibao-mascot.png" :alt="assistantName"/>
        <h1>{{ assistantName }}推荐</h1>
        <p>读懂业务动态，从一份「经营洞察」开始</p>
      </section>

      <section class="aia-analysis-panel" :aria-label="`${objectLabel}分析`">
        <header>
          <h2>{{ objectLabel }}分析</h2>
          <p>点击{{ objectLabel }}，{{ assistantName }}帮你立刻分析~</p>
        </header>
        <div class="aia-bill-list">
          <button v-for="bill in featuredBills" :key="bill.id" type="button" class="aia-bill-row" @click="emit('analyse', [bill])">
            <span class="aia-bill-row__head">
              <span class="aia-bill-row__no">{{ objectLabel }}号：{{ bill.id }}</span>
              <span class="aia-status" :class="'is-' + billTone(bill)">{{ bill.status }}</span>
            </span>
            <span class="aia-bill-row__main">
              <strong>{{ bill.name }}</strong>
              <time>{{ bill.datetime }}</time>
            </span>
            <span class="aia-bill-row__route">{{ bill.origin }} <i>—</i> {{ bill.destination }}</span>
          </button>
        </div>
        <button type="button" class="aia-more" @click="emit('open-select')">查看更多 <van-icon name="arrow"/></button>
      </section>

      <div class="aia-dots" aria-hidden="true"><i v-for="dot in 8" :key="dot" :class="{ 'is-active': dot === 1 }"/></div>
    </main>

    <footer class="aia-home__composer">
      <form class="aia-composer" @submit.prevent="send">
        <textarea
          v-model="input"
          rows="1"
          maxlength="500"
          :aria-label="`向${assistantName}描述业务问题`"
          placeholder="输入要查询货分析的业务问题..."
          @keydown.enter.exact.prevent="send"
        />
        <div class="aia-composer__tools">
          <button type="button" class="aia-icon" :aria-label="listening ? '停止语音输入' : '语音输入'" @click="toggleVoice">
            <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 10v4M12 7.5v9M15 10v4" stroke-linecap="round"/></svg>
          </button>
          <button type="button" class="aia-reason" :class="{ 'is-active': deepReason }" :aria-pressed="deepReason" @click="deepReason = !deepReason">深度推理</button>
          <span class="aia-spacer"/>
          <button type="button" class="aia-icon" aria-label="上传图片或文件" @click="fileInput?.click()">
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m20 11.5-8.3 8.3a5.1 5.1 0 0 1-7.2-7.2l8.5-8.5a3.4 3.4 0 1 1 4.8 4.8l-8.5 8.5a1.7 1.7 0 1 1-2.4-2.4l7.9-7.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button type="submit" class="aia-send" :disabled="!input.trim()" aria-label="发送消息">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <input ref="fileInput" hidden type="file" accept="image/*,.pdf" @change="onFile"/>
      </form>
      <p class="aia-disclaimer">内容由AI生成，仅供参考</p>
      <p v-if="notice" class="aia-notice" role="status">{{ notice }}</p>
      <i class="aia-home-indicator"/>
    </footer>

    <AiHistoryDrawer v-if="drawer" :sessions="sessions" :groups="groups" @close="drawer = false" @new-task="restart" @select="selectHistory"/>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import AiTopBar from './AiTopBar.vue'
import AiHistoryDrawer from './AiHistoryDrawer.vue'
import { billTone } from './ai-bill.js'

const props = defineProps({
  bills: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
  sessions: { type: Array, default: () => [] },
  objectLabel: { type: String, default: '运单' },
  assistantName: { type: String, default: '至宝' },
  assistantTitle: { type: String, default: '至小简' },
  extraMenus: { type: Array, default: () => [] },
})
const emit = defineEmits(['message', 'analyse', 'open-select', 'history-select', 'close', 'new-task', 'restart', 'menu-action'])

const featuredBills = computed(() => props.bills.slice(0, 3))
const input = ref(''), drawer = ref(false), notice = ref('')
const listening = ref(false), deepReason = ref(false)
const fileInput = ref(null)
let recognition

function send() {
  const text = input.value.trim()
  if (!text) return
  emit('message', text)
  input.value = ''
  notice.value = ''
}
function restart() {
  input.value = ''
  notice.value = ''
  drawer.value = false
  emit('restart')
}
function selectHistory(item) {
  drawer.value = false
  emit('history-select', item)
}
function onMenuAction(key) {
  emit('menu-action', key)
}
function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  notice.value = `已选择 ${file.name}，当前演示仅支持${props.objectLabel}分析。`
}
function toggleVoice() {
  if (listening.value) {
    recognition?.stop()
    return
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    notice.value = '当前浏览器暂不支持语音输入，请使用文字或图片。'
    return
  }
  recognition = new SpeechRecognition()
  recognition.lang = 'zh-CN'
  recognition.interimResults = false
  recognition.onresult = event => { input.value += event.results[0][0].transcript; notice.value = '请核对识别文字后发送。' }
  recognition.onerror = () => { notice.value = '语音输入未完成，请检查麦克风权限或改用文字。'; listening.value = false }
  recognition.onend = () => { listening.value = false }
  try {
    recognition.start()
    listening.value = true
    notice.value = '正在聆听，点击麦克风停止。'
  } catch {
    listening.value = false
    notice.value = '暂时无法开始语音输入，请改用文字。'
  }
}
onBeforeUnmount(() => recognition?.abort())
</script>
